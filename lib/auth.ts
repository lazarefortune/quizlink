import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
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

        // Check if email is verified
        if (!user.emailVerifiedAt) {
          // Return null to indicate authentication failure
          // We'll handle the EMAIL_NOT_VERIFIED case in the sign-in page
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

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
    async jwt({ token, user, trigger }) {
      // On initial login, set token from user
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.coinBalance = user.coinBalance;
        return token;
      }

      // Always fetch latest user data from database if we have a token ID
      // This ensures the session is always up-to-date
      // When trigger is "update", force refresh from database
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
            // Only update if data has changed to avoid unnecessary updates
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
