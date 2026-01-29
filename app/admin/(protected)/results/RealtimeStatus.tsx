"use client";

import { useState, useEffect } from "react";

export default function RealtimeStatus() {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/realtime");
    
    eventSource.onopen = () => {
      setStatus("connected");
      console.log("[RealtimeStatus] ✅ Connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "ping" && data.type !== "hello") {
          setLastEvent(`${data.type} at ${new Date().toLocaleTimeString()}`);
        }
      } catch (e) {
        // Ignore
      }
    };

    eventSource.onerror = () => {
      setStatus("disconnected");
      console.log("[RealtimeStatus] ❌ Disconnected");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-lg text-xs">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "connected"
            ? "bg-green-500 animate-pulse"
            : status === "connecting"
            ? "bg-yellow-500"
            : "bg-red-500"
        }`}
      />
      <span className="text-gray-600">
        {status === "connected"
          ? "متصل"
          : status === "connecting"
          ? "جاري الاتصال..."
          : "غير متصل"}
      </span>
      {lastEvent && (
        <span className="text-gray-400 text-[10px]">• {lastEvent}</span>
      )}
    </div>
  );
}
