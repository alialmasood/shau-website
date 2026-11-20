import { NextRequest, NextResponse } from "next/server";
import { getBusyDaysForRange } from "@/lib/conferenceHallRepo";
import { isValidYmd } from "@/lib/conferenceHallConfig";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const from = String(url.searchParams.get("from") ?? "").trim();
  const to = String(url.searchParams.get("to") ?? "").trim();
  const localeRaw = String(url.searchParams.get("locale") ?? "ar").trim();
  const locale = localeRaw === "en" ? "en" : "ar";

  if (!isValidYmd(from) || !isValidYmd(to) || to < from) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {
    const busyDays = await getBusyDaysForRange(from, to, locale);
    return NextResponse.json({ busyDays });
  } catch (e) {
    console.error("[conference-hall availability]", e);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
