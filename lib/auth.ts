import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (!prisma) {
          console.error("Prisma client not initialized. Run 'pnpm prisma:generate' first.");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        if (!user.emailVerifiedAt) {
          return null;
        }

        if (!user.passwordHash) {
          // Google-only account — cannot sign in with credentials
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
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

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || profile?.name || "Utilisateur",
              passwordHash: null,
              googleId: profile?.sub ?? null,
              emailVerifiedAt: new Date(),
            },
          });
        } else if (!existingUser.googleId && profile?.sub) {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              googleId: profile.sub,
              emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
            },
          });
        }

        return true;
      }

      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // Google OAuth — first sign-in
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

      // Credentials — first sign-in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.coinBalance = user.coinBalance;
        return token;
      }

      // Subsequent requests — refresh from DB
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
});
