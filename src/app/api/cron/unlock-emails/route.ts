import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processNotifyJobs } from "@/modules/notify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Auth for scheduled notify jobs.
 *
 * - Production: require `Authorization: Bearer ${CRON_SECRET}`.
 * - Vercel Cron: set project env `CRON_SECRET`; Vercel sends that Bearer header
 *   automatically on cron invocations (GET). Do not put the secret in the URL —
 *   query-string secrets land in logs and referrers.
 * - External ping (cron-job.org, etc.): same Bearer header.
 * - Local: when `CRON_SECRET` is unset, allow outside production.
 *
 * `x-vercel-cron` / user-agent alone are not trusted — they are forgeable.
 */
function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
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
