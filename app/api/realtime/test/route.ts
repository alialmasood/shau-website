import { broadcast } from "@/lib/sseHub";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Test endpoint to manually trigger a broadcast
 * Usage: GET /api/realtime/test?type=RESULTS_IMPORTED
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "TEST_EVENT";
  const payload = searchParams.get("payload") ? JSON.parse(searchParams.get("payload")!) : {};

  console.log(`[Test API] Broadcasting test event: ${type}`, payload);
  
  broadcast({
    type,
    payload,
  });

  return NextResponse.json({
    success: true,
    message: `Broadcast sent: ${type}`,
    payload,
  });
}
