import NextAuth from "next-auth";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth v4 configuration with pure JWT session strategy
 * 
 * IMPORTANT: Credentials provider in NextAuth v4 does NOT support database sessions.
 * This is a known limitation and design choice.
 * 
 * - JWT tokens are stored in HTTP-only cookies
 * - Sessions are stateless and contain user id, email, and role
 * - No session records are created in the database
 * - PrismaAdapter is NOT used (only needed for OAuth with database sessions)
 */
export const authOptions = {
  // No adapter needed for pure JWT sessions
  // PrismaAdapter is only for OAuth providers with database sessions

  // Credentials provider requires JWT strategy
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user?.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // Add user data to JWT token
    async jwt({ token, user }: { token: JWT; user: User }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },

    // Add token data to session
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.AUTH_SECRET,
};

export default NextAuth(authOptions);
