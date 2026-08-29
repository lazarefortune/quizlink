import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthOkResponse = {
  status: "ok";
};

type HealthUnavailableResponse = {
  status: "unavailable";
};

export type HealthResponse = HealthOkResponse | HealthUnavailableResponse;

/**
 * Liveness + readiness probe for Docker / reverse proxies.
 * Returns 200 when the process can serve traffic and the database answers.
 * Returns 503 when the database is unreachable.
 * Never exposes secrets, connection strings, or stack traces.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
