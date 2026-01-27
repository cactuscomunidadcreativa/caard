/**
 * CAARD - Health Check API
 * ========================
 * Endpoint for monitoring system health
 * Used by Vercel, monitoring services, and uptime checks
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "ok" | "error";
      latency?: number;
      message?: string;
    };
    memory: {
      status: "ok" | "warning" | "error";
      used: number;
      total: number;
      percentage: number;
    };
  };
}

const startTime = Date.now();

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const health: HealthStatus = {
    status: "healthy",
    timestamp,
    version: process.env.npm_package_version || "1.0.0",
    uptime,
    checks: {
      database: { status: "ok" },
      memory: { status: "ok", used: 0, total: 0, percentage: 0 },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    health.checks.database = {
      status: "ok",
      latency: dbLatency,
    };

    if (dbLatency > 1000) {
      health.status = "degraded";
    }
  } catch (error: any) {
    health.status = "unhealthy";
    health.checks.database = {
      status: "error",
      message: error.message || "Database connection failed",
    };
  }

  // Check memory usage
  if (typeof process !== "undefined" && process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const percentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    health.checks.memory = {
      status: percentage > 90 ? "error" : percentage > 75 ? "warning" : "ok",
      used: usedMB,
      total: totalMB,
      percentage,
    };

    if (percentage > 90 && health.status === "healthy") {
      health.status = "degraded";
    }
  }

  // Return appropriate status code
  const statusCode = health.status === "unhealthy" ? 503 : 200;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
