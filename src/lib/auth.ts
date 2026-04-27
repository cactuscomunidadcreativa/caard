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
      perms?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    centerId?: string | null;
  }
}

// Determinar URL base para callbacks OAuth
const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
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

        // Normalize email: lowercase + trim
        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Try exact match first (faster)
        let user = await prisma.user.findUnique({
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

        // Fallback: case-insensitive search if exact match failed
        if (!user) {
          user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
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
        }

        if (!user) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        // Login por OTP verificado (el código ya fue validado en /api/auth/otp/verify)
        if (password.startsWith("__OTP_VERIFIED__")) {
          // Verificar que existe un OTP usado recientemente para este usuario
          const recentOtp = await prisma.otpToken.findFirst({
            where: {
              userId: user.id,
              type: "LOGIN",
              usedAt: { not: null, gte: new Date(Date.now() - 5 * 60 * 1000) }, // usado en últimos 5 min
            },
            orderBy: { usedAt: "desc" },
          });

          if (!recentOtp) {
            return null; // No hay OTP verificado reciente
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            centerId: user.centerId,
          };
        }

        // Login por contraseña tradicional
        if (!user.passwordHash) {
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
            // Permitir vincular cuenta OAuth a usuario existente con mismo email
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Initial sign in - add custom fields to token
      if (user) {
        // Para OAuth (Google), cargar rol y centerId desde la DB
        if (account?.provider !== "credentials" && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, centerId: true, name: true, image: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.centerId = dbUser.centerId || null;
            // Usar siempre el nombre/imagen de la DB (fuente de verdad)
            token.name = dbUser.name || user.name || null;
            token.picture = dbUser.image || user.image || null;
          } else {
            token.id = user.id;
            token.role = "DEMANDANTE";
            token.centerId = null;
          }
        } else {
          token.id = user.id;
          token.role = user.role || "DEMANDANTE";
          token.centerId = user.centerId || null;
          token.name = user.name || null;
          token.picture = user.image || null;
        }
      }

      // Si se actualiza sesión manualmente (useSession().update()), refrescar desde DB
      if (trigger === "update" && token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, image: true, role: true, centerId: true },
        });
        if (dbUser) {
          token.name = dbUser.name || token.name;
          token.picture = dbUser.image || token.picture;
          token.role = dbUser.role;
          token.centerId = dbUser.centerId || null;
        }
      }

      // Calcular permisos efectivos (defaults del rol + overrides del usuario).
      // Se refresca en el primer login y en cada update manual de sesión.
      if (token?.id && (user || trigger === "update" || !token.perms)) {
        try {
          const { computeEffectivePermissions } = await import("./permissions");
          token.perms = await computeEffectivePermissions(
            token.id as string,
            token.role as Role
          );
        } catch (e) {
          // Si falla el cálculo, dejar sin perms — los helpers caen a defaults del rol
          console.error("computeEffectivePermissions failed:", e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.centerId = token.centerId as string | null;
        // Permisos efectivos (suma defaults del rol + overrides del usuario)
        (session.user as any).perms = (token.perms as string[] | undefined) || [];
        // Asegurar que name/image reflejan la DB
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // For OAuth providers, check if user exists and is active
      if (account?.provider !== "credentials" && user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();

        // PROTECCIÓN ANTI-CROSS-LINKING:
        // Si ya existe un Account (provider, providerAccountId) y está
        // ligado a un User con un email DIFERENTE al que viene en este
        // OAuth callback, bloqueamos el login para evitar que un usuario
        // termine entrando como otro (caso real: cuentas que se linkean
        // accidentalmente cuando un usuario tiene varias sesiones de
        // Google en el mismo navegador).
        if (account?.providerAccountId) {
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            include: { user: { select: { email: true, id: true } } },
          });
          if (
            existingAccount?.user?.email &&
            existingAccount.user.email.toLowerCase().trim() !== normalizedEmail
          ) {
            console.error(
              "[signIn] cross-link detectado:",
              `OAuth email=${normalizedEmail} pero Account está ligado a User=${existingAccount.user.email}`
            );
            return false; // Bloquear login
          }
        }

        // Buscar case-insensitive (Google puede devolver mayúsculas mixtas)
        let existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, isActive: true, name: true, image: true, email: true },
        });

        if (!existingUser) {
          existingUser = await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: "insensitive" } },
            select: { id: true, isActive: true, name: true, image: true, email: true },
          });
        }

        if (existingUser) {
          if (!existingUser.isActive) {
            return false;
          }
          // Solo llenar name/image en el PRIMER login (si están vacíos).
          // No sobreescribir en logins subsiguientes: cuentas compartidas
          // (p.ej. administracion@caardpe.com) pueden ser usadas por varias
          // personas vía Google y el perfil cambiaría constantemente.
          const updates: any = {};
          if (!existingUser.name && user.name) updates.name = user.name;
          if (!existingUser.image && user.image) updates.image = user.image;
          if (Object.keys(updates).length > 0) {
            await prisma.user.update({ where: { id: existingUser.id }, data: updates });
          }
          return true;
        }

        // Usuario no existe. Auto-crear si es del dominio corporativo.
        const isCorporateEmail = normalizedEmail.endsWith("@caardpe.com");
        if (isCorporateEmail) {
          // Rol por defecto: ADMIN para administracion@ y similares de staff,
          // CENTER_STAFF para el resto. Un SUPER_ADMIN puede promover luego.
          const isAdminMailbox =
            normalizedEmail.startsWith("administracion@") ||
            normalizedEmail.startsWith("admin@");
          await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: user.name || normalizedEmail.split("@")[0],
              image: user.image || null,
              role: isAdminMailbox ? "ADMIN" : "CENTER_STAFF",
              isActive: true,
              emailVerified: new Date(),
            },
          });
          return true;
        }

        // Otros dominios no pueden auto-registrarse
        return false;
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

        // Backfill: enlazar CaseMember (y cualquier otro registro con email)
        // que aún no tengan userId pero compartan el email del usuario.
        // Esto garantiza que casos antiguos importados de la plantilla donde
        // la parte/árbitro figuraba solo con email aparezcan en su panel
        // apenas el usuario se autentica por primera vez.
        if (user.email) {
          try {
            const email = user.email.toLowerCase().trim();
            await prisma.caseMember.updateMany({
              where: { email, userId: null },
              data: { userId: user.id },
            });
          } catch (e: any) {
            console.error("backfill CaseMember.userId:", e?.message);
          }
        }
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
