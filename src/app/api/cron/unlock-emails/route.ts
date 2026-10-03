import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processNotifyJobs } from "@/modules/notify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Local convenience: allow when unset outside production.
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await processNotifyJobs(prisma);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
