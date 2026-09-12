import { NextRequest, NextResponse } from "next/server";
import {
  createSubmittedApplication,
  getEdition2026,
  isRegistrationOpen,
} from "@/lib/innovationConferenceRepo";
import { checkInnovationConferenceRateLimit } from "@/lib/innovationConferenceRateLimit";
import {
  validateInnovationConferenceRegistration,
  type IcRegisterBody,
} from "@/lib/innovationConferenceValidation";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 512 * 1024; // 512KB JSON

function getClientIp(req: NextRequest): string {
  const x = req.headers.get("x-forwarded-for");
  if (x) return x.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function errorJson(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(fields && Object.keys(fields).length ? { fields } : {}),
      },
    },
    { status }
  );
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return errorJson(413, "VALIDATION_ERROR", "حجم الطلب كبير جداً.");
    }

    const open = await isRegistrationOpen();
    if (!open) {
      return errorJson(403, "REGISTRATION_CLOSED", "التسجيل في المؤتمر غير متاح حالياً.");
    }

    const edition = await getEdition2026();
    if (!edition) {
      return errorJson(403, "REGISTRATION_CLOSED", "التسجيل في المؤتمر غير متاح حالياً.");
    }

    const body = (await req.json().catch(() => null)) as IcRegisterBody | null;
    if (!body || typeof body !== "object") {
      return errorJson(400, "VALIDATION_ERROR", "يرجى مراجعة البيانات المدخلة.");
    }

    // منع العميل من فرض حقول إدارية
    const blocked = body as Record<string, unknown>;
    if (
      blocked.status != null ||
      blocked.participationCode != null ||
      blocked.trackingToken != null ||
      blocked.adminNotes != null ||
      blocked.submittedAt != null
    ) {
      return errorJson(400, "VALIDATION_ERROR", "يرجى مراجعة البيانات المدخلة.");
    }

    const validated = await validateInnovationConferenceRegistration(body, edition.id);
    if (!validated.ok) {
      if (validated.code === "HONEYPOT") {
        return errorJson(400, "VALIDATION_ERROR", "تعذر إتمام الطلب.");
      }
      return errorJson(400, validated.code, validated.message, validated.fields);
    }

    // بعد اجتياز التحقق فقط — يحمي من إرسال ناجح متكرر دون استهلاك الحصة على أخطاء التحقق
    const ip = getClientIp(req);
    const rl = checkInnovationConferenceRateLimit(ip, "register");
    if (!rl.allowed) {
      const res = errorJson(
        429,
        "RATE_LIMITED",
        "تم تجاوز عدد المحاولات المسموح. حاول لاحقاً."
      );
      if (rl.retryAfterSec) res.headers.set("Retry-After", String(rl.retryAfterSec));
      return res;
    }

    const result = await createSubmittedApplication({
      ...validated.data,
      ipAddress: ip === "unknown" ? null : ip,
      userAgent: req.headers.get("user-agent")?.slice(0, 500) || null,
    });

    return NextResponse.json(
      {
        ok: true,
        application: {
          participationCode: result.participationCode,
          trackingToken: result.trackingToken,
          projectTitle: validated.data.projectTitle,
          status: result.status,
          submittedAt: result.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("innovation-conference register POST failed");
    return errorJson(500, "SUBMISSION_FAILED", "تعذر إرسال الطلب. حاول مرة أخرى.");
  }
}
