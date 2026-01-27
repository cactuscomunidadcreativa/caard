/**
 * CAARD - Database Status API
 * ===========================
 * Detailed database connection status for admin panel
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can see database status
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes((session.user as any).role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status: any = {
      connected: false,
      provider: "postgresql",
      host: "Neon",
      timestamp: new Date().toISOString(),
    };

    try {
      // Test connection
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      status.connected = true;
      status.latency = latency;

      // Get database version
      const versionResult: any[] = await prisma.$queryRaw`SELECT version()`;
      status.version = versionResult[0]?.version?.split(" ").slice(0, 2).join(" ") || "Unknown";

      // Get table counts
      const counts = await Promise.all([
        prisma.user.count(),
        prisma.center.count(),
        prisma.case.count(),
        prisma.caseDocument.count(),
        prisma.payment.count(),
        prisma.notification.count(),
      ]);

      status.tables = {
        users: counts[0],
        centers: counts[1],
        cases: counts[2],
        documents: counts[3],
        payments: counts[4],
        notifications: counts[5],
      };

      // Get database size (approximate)
      const sizeResult: any[] = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      status.size = sizeResult[0]?.size || "Unknown";

    } catch (dbError: any) {
      status.error = dbError.message;
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Database status error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
