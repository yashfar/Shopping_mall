import NextAuth from "next-auth";
import type { User, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Account, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth v4 configuration with hybrid approach:
 * - Credentials login: JWT sessions
 * - Google OAuth: Account linking + JWT sessions
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

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
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
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
    /**
     * JWT callback — runs on every token read.
     *
     * DB is queried ONLY:
     *  1. On first sign-in (user object is present)
     *  2. On explicit session update (trigger === "update")
     *
     * This prevents a DB hit on every authenticated request.
     * To refresh profile data after a profile edit, call:
     *   update() from useSession() on the client.
     */
    async jwt({
      token,
      user,
      trigger,
    }: {
      token: JWT;
      user?: User;
      trigger?: "signIn" | "signUp" | "update";
    }) {
      if (user) {
        // First sign-in: seed token from the just-authenticated user
        token.id = user.id;
        token.picture = (user as User & { image?: string }).image ?? null;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
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
          token.avatar = dbUser.avatar || dbUser.image || token.picture;
        }
      }

      // Re-fetch only when the client explicitly triggers a session update
      if (trigger === "update" && token.id) {
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
          token.avatar = dbUser.avatar || dbUser.image || token.picture;
        }
      }

      return token;
    },

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

    async signIn({
      user,
      account,
      profile,
    }: {
      user: User;
      account: Account | null;
      profile?: Profile;
    }) {
      if (account?.provider === "google" && profile) {
        try {
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [{ id: user.id }, { email: user.email ?? "" }],
            },
            select: { id: true, avatar: true },
          });

          if (existingUser) {
            const googleProfile = profile as Profile & {
              picture?: string;
              given_name?: string;
              family_name?: string;
              email_verified?: boolean;
            };

            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: profile.name,
                image: googleProfile.picture,
                emailVerified: googleProfile.email_verified ? new Date() : null,
                firstName: googleProfile.given_name || null,
                lastName: googleProfile.family_name || null,
                avatar: existingUser.avatar || googleProfile.picture || null,
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
