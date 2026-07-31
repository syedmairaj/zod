import { AppError } from "@zod-ai/shared";
import { processGithubWebhook } from "@zod-ai/github";
import { NextResponse, type NextRequest } from "next/server";
import { getDbPool } from "@/lib/db";
import { getServerEnv } from "@/lib/env.server";

export const dynamic = "force-dynamic";

/**
 * Thin GitHub webhook ingress. Parsing, signature verification, domain
 * handling, and queue enqueue live in packages/; this route only wires HTTP.
 */
export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const pool = getDbPool();

  try {
    const result = await processGithubWebhook(pool, {
      rawBody: await request.text(),
      signatureHeader: request.headers.get("x-hub-signature-256"),
      deliveryId: request.headers.get("x-github-delivery"),
      eventType: request.headers.get("x-github-event"),
      webhookSecret: env.GITHUB_APP_WEBHOOK_SECRET,
    });

    if (result.status === "duplicate") {
      return NextResponse.json({ status: "duplicate" });
    }
    if (result.status === "ignored") {
      return NextResponse.json({ status: "ignored" });
    }
    return NextResponse.json({
      status: "ok",
      ...(result.queueJobId ? { queueJobId: result.queueJobId } : {}),
      ...(result.commitSha ? { commitSha: result.commitSha } : {}),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
