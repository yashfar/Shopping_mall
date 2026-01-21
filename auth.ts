import NextAuth from "next-auth";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth v4 configuration with hybrid approach:
 * - Credentials login: JWT sessions
 * - Google OAuth: Account linking + JWT sessions
 * 
 * Features:
 * - Both credentials and Google sign-in supported
 * - Account linking by email for existing users
 * - JWT sessions for both auth methods
 * - PrismaAdapter for OAuth account management
 */
export const authOptions = {
  // Use Prisma adapter for OAuth account linking
  adapter: PrismaAdapter(prisma),

  // JWT strategy for sessions
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Enable account linking by email
    }),

    // Credentials Provider (existing login)
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
          where: { email: credentials.email },
        });

        // User must exist and have a password (not OAuth-only account)
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        };
      },
    }),
  ],

  callbacks: {
    // Add user data to JWT token
    async jwt({ token, user, account, trigger }: any) {
      // Initial sign in or when user object is available
      if (user) {
        token.id = user.id;
      }

      // Always fetch fresh user data from database to get latest avatar
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            firstName: true,
            lastName: true,
            avatar: true,
            image: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          // Use avatar if available, otherwise fall back to Google image
          token.avatar = dbUser.avatar || dbUser.image;
        }
      }

      return token;
    },

    // Add token data to session
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        session.user.avatar = token.avatar as string | null;
      }
      return session;
    },


    // Handle account linking and profile sync
    async signIn({ user, account, profile }: any) {
      // For OAuth sign-ins, sync profile data
      if (account?.provider === "google" && profile) {
        try {
          // Check if user exists and has an avatar
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, avatar: true },
          });

          // Only update if user exists (PrismaAdapter creates user first)
          if (existingUser) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                name: profile.name,
                image: profile.picture,
                emailVerified: profile.email_verified ? new Date() : null,
                firstName: profile.given_name || null,
                lastName: profile.family_name || null,
                // Only set avatar from Google if user doesn't have one already
                avatar: existingUser.avatar || profile.picture || null,
              },
            });
          }
        } catch (error) {
          console.error("Error syncing Google profile:", error);
        }
      }
      return true;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.AUTH_SECRET,
};

export default NextAuth(authOptions);
