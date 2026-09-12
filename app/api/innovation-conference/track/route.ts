import { NextRequest, NextResponse } from "next/server";
import { verifyAndGetTrackingView } from "@/lib/innovationConferenceRepo";
import { checkInnovationConferenceRateLimit } from "@/lib/innovationConferenceRateLimit";
import { getStatusPublicCopy } from "@/lib/innovationConferenceStatus";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const GENERIC_AUTH_MESSAGE =
  "تعذر التحقق من بيانات المتابعة. تأكد من رقم المشاركة ورمز المتابعة.";

function getClientIp(req: NextRequest): string {
  const x = req.headers.get("x-forwarded-for");
  if (x) return x.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function errorJson(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return errorJson(400, "TRACK_FAILED", GENERIC_AUTH_MESSAGE);
    }

    const ip = getClientIp(req);
    const rl = checkInnovationConferenceRateLimit(ip, "track");
    if (!rl.allowed) {
      const res = errorJson(
        429,
        "RATE_LIMITED",
        "تم إجراء عدد كبير من محاولات التحقق. حاول مرة أخرى لاحقاً."
      );
      if (rl.retryAfterSec) res.headers.set("Retry-After", String(rl.retryAfterSec));
      return res;
    }

    const body = (await req.json().catch(() => null)) as {
      participationCode?: unknown;
      trackingToken?: unknown;
    } | null;

    if (!body || typeof body !== "object") {
      return errorJson(400, "TRACK_UNAUTHORIZED", GENERIC_AUTH_MESSAGE);
    }

    const participationCode =
      typeof body.participationCode === "string" ? body.participationCode : "";
    const trackingToken =
      typeof body.trackingToken === "string" ? body.trackingToken : "";

    const view = await verifyAndGetTrackingView(participationCode, trackingToken);
    if (!view) {
      return errorJson(401, "TRACK_UNAUTHORIZED", GENERIC_AUTH_MESSAGE);
    }

    const copy = getStatusPublicCopy(view.status);

    return NextResponse.json({
      ok: true,
      application: {
        participationCode: view.participationCode,
        projectTitle: view.projectTitle,
        status: view.status,
        statusTitle: copy.title,
        statusMessage: copy.message,
        submittedAt: view.submittedAt,
        updatedAt: view.updatedAt,
      },
    });
  } catch {
    console.error("innovation-conference track POST failed");
    return errorJson(
      500,
      "TRACK_FAILED",
      "تعذر التحقق من حالة الطلب حالياً. حاول مرة أخرى بعد قليل."
    );
  }
}
