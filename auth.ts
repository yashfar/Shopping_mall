import NextAuth from "next-auth";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

/**
 * NextAuth v4 configuration with hybrid session strategy
 * 
 * IMPORTANT: Credentials provider in NextAuth v4 does NOT support database sessions.
 * This is a known limitation. We use a hybrid approach:
 * - JWT for session management (required for Credentials provider)
 * - Manual session records in database for tracking and management
 * 
 * The session callback creates/updates database session records manually.
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),

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

    // Add token data to session and create/update database session record
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;

        // Manually create/update session record in database for tracking
        try {
          const sessionToken = `jwt-${token.id}-${Date.now()}`;
          const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

          // Find existing session or create new one
          const existingSession = await prisma.session.findFirst({
            where: { userId: token.id as string },
          });

          if (existingSession) {
            await prisma.session.update({
              where: { id: existingSession.id },
              data: { expires },
            });
          } else {
            await prisma.session.create({
              data: {
                sessionToken,
                userId: token.id as string,
                expires,
              },
            });
          }
        } catch (error) {
          console.error("Failed to create/update session record:", error);
        }
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
