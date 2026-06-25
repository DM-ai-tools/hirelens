import { NextResponse } from "next/server";

/** Lightweight liveness probe for Railway — no database required. */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "HireLens",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
