/**
 * CAARD - Configuración de NextAuth.js
 * Autenticación con roles y Prisma adapter
 */

import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

// Extend session types for NextAuth v5
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      centerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    centerId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Credentials Provider for email/password
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            role: true,
            centerId: true,
            isActive: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          centerId: user.centerId,
        };
      },
    }),

    // Google OAuth Provider (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add custom fields to token
      if (user) {
        token.id = user.id;
        token.role = user.role || "DEMANDANTE";
        token.centerId = user.centerId || null;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.centerId = token.centerId as string | null;
      }
      return session;
    },

    async signIn({ user, account }) {
      // For OAuth providers, check if user exists and is active
      if (account?.provider !== "credentials" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true },
        });

        if (existingUser && !existingUser.isActive) {
          return false;
        }
      }
      return true;
    },
  },

  events: {
    async signIn({ user }) {
      // Log successful login
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            meta: { timestamp: new Date().toISOString() },
          },
        });
      }
    },
  },
});

// =============================================================================
// Auth Helper Functions
// =============================================================================

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is admin (SUPER_ADMIN or SECRETARIA)
 */
export function isAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "SECRETARIA";
}

/**
 * Check if user can access a specific case
 */
export async function canAccessCase(
  userId: string,
  caseId: string,
  userRole: Role
): Promise<boolean> {
  // Admins can access all cases
  if (isAdmin(userRole)) {
    return true;
  }

  // Check if user is a member of the case
  const membership = await prisma.caseMember.findFirst({
    where: {
      caseId,
      userId,
    },
  });

  return !!membership;
}
