import { NextRequest, NextResponse } from "next/server";
import { createApplication, isActiveDepartmentId, type CreateApplicationInput } from "@/lib/applicationsRepo";

const CATEGORY_VALUES = new Set([
  "scientific", "biological", "applied", "nursing_prep", "midwifery_prep",
  "industrial_medical_devices", "industrial_laser", "industrial_communications",
  "industrial_oil_gas", "industrial_petrochemicals", "industrial_it_networks",
  "industrial_construction", "vocational_railway", "industry", "admin",
]);

function getClientIp(req: NextRequest): string | null {
  const x = req.headers.get("x-forwarded-for");
  if (x) return x.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip") || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fn = String(body.full_name || "").trim();
    const gy = body.graduation_year;
    const school = String(body.school_name || "").trim();
    const phone = String(body.phone || "").replace(/\D/g, "");
    const email = body.email != null ? String(body.email).trim() : "";
    const address = String(body.address || "").trim();
    const category = String(body.category || "").trim();
    const department_id = String(body.department_id || "").trim();
    const study_type = String(body.study_type || "").toLowerCase();
    const average = Number(body.average);
    const total = body.total != null && body.total !== "" ? Number(body.total) : null;
    const notes = body.notes != null ? String(body.notes).trim() : null;

    // تحقق بسيط
    if (fn.length < 6) return NextResponse.json({ ok: false, error: "full_name" }, { status: 400 });
    if (phone.length < 10 || phone.length > 15) return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
    if (!school) return NextResponse.json({ ok: false, error: "school_name" }, { status: 400 });
    const gyNum = parseInt(String(gy), 10);
    if (!Number.isFinite(gyNum) || gyNum < 1900 || gyNum > 2100) return NextResponse.json({ ok: false, error: "graduation_year" }, { status: 400 });
    if (!address) return NextResponse.json({ ok: false, error: "address" }, { status: 400 });
    if (!category || !CATEGORY_VALUES.has(category)) return NextResponse.json({ ok: false, error: "category" }, { status: 400 });
    if (!department_id) return NextResponse.json({ ok: false, error: "department_id" }, { status: 400 });
    if (study_type !== "morning" && study_type !== "evening") return NextResponse.json({ ok: false, error: "study_type" }, { status: 400 });
    if (!Number.isFinite(average) || average < 0 || average > 100) return NextResponse.json({ ok: false, error: "average" }, { status: 400 });
    if (total != null && (!Number.isFinite(total) || total < 0)) return NextResponse.json({ ok: false, error: "total" }, { status: 400 });

    const ok = await isActiveDepartmentId(department_id);
    if (!ok) return NextResponse.json({ ok: false, error: "department_id" }, { status: 400 });

    const data: CreateApplicationInput = {
      full_name: fn,
      graduation_year: gyNum,
      school_name: school,
      phone,
      email: email || null,
      address,
      category,
      department_id,
      study_type: study_type as "morning" | "evening",
      average,
      total: total ?? null,
      notes: notes || null,
      ip: getClientIp(req) || null,
      user_agent: req.headers.get("user-agent") || null,
    };

    const id = await createApplication(data);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("applications POST", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
