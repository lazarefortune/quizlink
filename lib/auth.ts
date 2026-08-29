import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { initializeUserCoins } from "@/lib/coins";
import { getAuthAuditFieldsFromHeaders, type AuthAuditFields } from "@/lib/authAuditContext";
import bcrypt from "bcryptjs";
import {
  persistSuccessfulLogin,
  recordUserAuthEvent,
  USER_AUTH_EVENT_TYPES,
  USER_AUTH_PROVIDERS,
} from "@/lib/userAuthEvents";
import { recordUserLifecycleEvent, USER_LIFECYCLE_EVENT_TYPES } from "@/lib/userLifecycleEvents";
import { sendUserSignupNotificationIfNeeded } from "@/lib/sendUserSignupNotificationIfNeeded";
import { getCredentialsLoginRejection } from "@/lib/auth/validate-credentials-login";
import { ensureDefaultUserAvatar } from "@/lib/user-avatar/ensureDefaultUserAvatar";
import { deriveNameFromEmail } from "@/lib/auth/pending-signup";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";
import { consumeSignupIntentFromRequest } from "@/lib/observability/signup-intent-server";
import { logger } from "@/lib/observability/logger";
import { trackServer, captureServerException } from "@/lib/analytics/track-server";
import { parsePostHogDistinctIdFromCookieHeader } from "@/lib/analytics/parse-posthog-cookie";
import {
  SIGNUP_COMPLETED,
  SIGNUP_EXISTING_USER,
  SIGNUP_FAILED,
} from "@/lib/analytics/events";

const CREDENTIALS_FAILURE_REASON = "CREDENTIALS_REJECTED";

async function recordCredentialsLoginFailureSafe(userId: string | null, audit: AuthAuditFields): Promise<void> {
  if (!prisma) {
    return;
  }

  try {
    await recordUserAuthEvent(prisma, {
      userId,
      eventType: USER_AUTH_EVENT_TYPES.LOGIN_FAILURE,
      authProvider: USER_AUTH_PROVIDERS.CREDENTIALS,
      audit,
      failureReason: CREDENTIALS_FAILURE_REASON,
    });
  } catch (error) {
    console.error("Failed to record credentials login failure:", error);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth((req: NextRequest | undefined) => {
  const auditFromRoute = getAuthAuditFieldsFromHeaders(req?.headers);

  return {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true,
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials, request) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          if (!prisma) {
            console.error("Prisma client not initialized. Run 'pnpm prisma:generate' first.");
            return null;
          }

          const audit = getAuthAuditFieldsFromHeaders(request.headers);
          const email = credentials.email as string;
          const password = credentials.password as string;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          const rejection = getCredentialsLoginRejection(user);
          if (rejection) {
            await recordCredentialsLoginFailureSafe(
              rejection === "USER_NOT_FOUND" ? null : user?.id ?? null,
              audit,
            );
            return null;
          }

          if (!user?.passwordHash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

          if (!isPasswordValid) {
            await recordCredentialsLoginFailureSafe(user.id, audit);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            coinBalance: user.coinBalance,
          };
        },
      }),
    ],
    pages: {
      signIn: "/auth/signin",
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === "google") {
          if (!user.email || !prisma) return false;

          const signupIntent = await consumeSignupIntentFromRequest(req);
          const cookieDistinctId = parsePostHogDistinctIdFromCookieHeader(
            req?.headers.get("cookie"),
          );

          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            });

            if (!existingUser) {
              const acceptedAt = new Date();
              const googleName = user.name?.trim() || profile?.name?.trim();
              const resolvedName = googleName || deriveNameFromEmail(user.email);
              const createdUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: resolvedName,
                  passwordHash: null,
                  googleId: profile?.sub ?? null,
                  emailVerifiedAt: new Date(),
                  termsAcceptedAt: acceptedAt,
                  termsVersion: CURRENT_TERMS_VERSION,
                  privacyAcceptedAt: acceptedAt,
                  privacyVersion: CURRENT_PRIVACY_VERSION,
                },
              });

              await recordUserLifecycleEvent(prisma, createdUser.id, USER_LIFECYCLE_EVENT_TYPES.SIGNUP);

              await initializeUserCoins(createdUser.id);

              await sendUserSignupNotificationIfNeeded(createdUser.id, "google");

              await ensureDefaultUserAvatar(createdUser.id);

              logger.info("auth.signup.completed", {
                "auth.method": "google",
                outcome: "completed",
                "user.id": createdUser.id,
                posthogDistinctId: cookieDistinctId,
              });
              await trackServer(createdUser.id, SIGNUP_COMPLETED, {
                method: "google",
                ...(cookieDistinctId ? { $anon_distinct_id: cookieDistinctId } : {}),
              });
            } else {
              if (!existingUser.googleId && profile?.sub) {
                await prisma.user.update({
                  where: { email: user.email },
                  data: {
                    googleId: profile.sub,
                    emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
                  },
                });
              }

              if (signupIntent) {
                logger.info("auth.signup.existing_user", {
                  "auth.method": "google",
                  outcome: "existing_user",
                  "user.id": existingUser.id,
                  posthogDistinctId: cookieDistinctId,
                });
                await trackServer(
                  cookieDistinctId ?? existingUser.id,
                  SIGNUP_EXISTING_USER,
                  { method: "google" },
                );
              }
            }

            try {
              const dbUser = await prisma.user.findUnique({
                where: { email: user.email },
                select: { id: true },
              });

              if (dbUser) {
                await persistSuccessfulLogin(prisma, {
                  userId: dbUser.id,
                  authProvider: USER_AUTH_PROVIDERS.GOOGLE,
                  audit: auditFromRoute,
                });
              }
            } catch (error) {
              console.error("Failed to record Google login success:", error);
            }

            return true;
          } catch (error) {
            console.error("Google signIn callback failed:", error);
            logger.error("auth.google.callback.failed", {
              "auth.method": "google",
              "auth.stage": "oauth_callback",
              outcome: "failed",
              "error.code": "oauth_callback_error",
              posthogDistinctId: cookieDistinctId,
            });
            await trackServer(cookieDistinctId ?? "anonymous", SIGNUP_FAILED, {
              method: "google",
              stage: "oauth_callback",
              error_code: "oauth_callback_error",
            });
            await captureServerException(error, cookieDistinctId, {
              $exception_source: "auth_google_signIn",
            });
            return false;
          }
        }

        if (account?.provider === "credentials" && user?.id && prisma) {
          try {
            await persistSuccessfulLogin(prisma, {
              userId: user.id as string,
              authProvider: USER_AUTH_PROVIDERS.CREDENTIALS,
              audit: auditFromRoute,
            });
          } catch (error) {
            console.error("Failed to record credentials login success:", error);
          }
        }

        return true;
      },

      async jwt({ token, user, account, trigger }) {
        if (account?.provider === "google" && user) {
          if (prisma && user.email) {
            try {
              const dbUser = await prisma.user.findUnique({
                where: { email: user.email },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                  coinBalance: true,
                },
              });

              if (dbUser) {
                token.id = dbUser.id;
                token.email = dbUser.email;
                token.name = dbUser.name;
                token.role = dbUser.role;
                token.coinBalance = dbUser.coinBalance;
                return token;
              }
            } catch (error) {
              console.error("Error fetching Google user in jwt callback:", error);
            }
          }
          return token;
        }

        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = user.role;
          token.coinBalance = user.coinBalance;
          return token;
        }

        if (token.id && prisma) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                coinBalance: true,
              },
            });

            if (dbUser) {
              const nameChanged = token.name !== dbUser.name;
              const emailChanged = token.email !== dbUser.email;
              const roleChanged = token.role !== dbUser.role;
              const coinBalanceChanged = token.coinBalance !== dbUser.coinBalance;

              if (nameChanged || emailChanged || roleChanged || coinBalanceChanged) {
                console.log("[JWT] Updating token with fresh user data:", {
                  oldCoinBalance: token.coinBalance,
                  newCoinBalance: dbUser.coinBalance,
                  trigger,
                });
              }

              token.id = dbUser.id;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.role = dbUser.role;
              token.coinBalance = dbUser.coinBalance;
            }
          } catch (error) {
            console.error("Error fetching user data in jwt callback:", error);
          }
        }

        return token;
      },

      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          session.user.role = token.role as string;
          session.user.coinBalance = token.coinBalance as number;
        }
        return session;
      },
    },
  };
});
