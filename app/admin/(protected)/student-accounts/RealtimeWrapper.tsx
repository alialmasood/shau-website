"use client";

import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeRefresh";

export default function RealtimeWrapper() {
  useRealtimeRefresh({
    eventTypes: ["STUDENT_ACCOUNTS_UPDATED", "ACCOUNTS_UPDATED"],
  });
  return null;
}
