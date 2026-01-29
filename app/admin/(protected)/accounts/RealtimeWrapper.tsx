"use client";

import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeRefresh";

export default function RealtimeWrapper() {
  useRealtimeRefresh({
    eventTypes: ["RESULTS_IMPORTED", "ACCOUNTS_UPDATED"],
  });
  return null;
}
