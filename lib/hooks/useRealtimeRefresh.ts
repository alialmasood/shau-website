"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type RealtimeEvent = {
  type: string;
  payload?: {
    studentId?: string;
    departmentCode?: string;
    batchId?: string;
    [key: string]: unknown;
  };
};

type UseRealtimeRefreshOptions = {
  /**
   * Filter events - only refresh if this function returns true
   * If not provided, all events will trigger refresh
   */
  filter?: (event: RealtimeEvent) => boolean;
  
  /**
   * List of event types to listen to
   * If not provided, listens to all events
   */
  eventTypes?: string[];
  
  /**
   * Current student ID (for student dashboard filtering)
   */
  studentId?: string;
};

/**
 * Hook to listen for real-time updates via SSE and refresh the page
 * 
 * @example
 * // In admin pages - refresh on all events
 * useRealtimeRefresh();
 * 
 * // In student dashboard - only refresh if event is for this student
 * useRealtimeRefresh({ studentId: session.studentId });
 * 
 * // Custom filter
 * useRealtimeRefresh({
 *   filter: (event) => event.type === "RESULTS_IMPORTED"
 * });
 */
export function useRealtimeRefresh(options: UseRealtimeRefreshOptions = {}) {
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Don't connect in development if explicitly disabled
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DISABLE_SSE === "true") {
      console.log("[useRealtimeRefresh] SSE disabled in development");
      return;
    }

    console.log("[useRealtimeRefresh] 🔌 Initializing SSE connection...");

    const connect = () => {
      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          console.log("[useRealtimeRefresh] 🔄 Closing existing connection");
          eventSourceRef.current.close();
        }

        console.log("[useRealtimeRefresh] 🔗 Creating new EventSource connection to /api/realtime");
        const eventSource = new EventSource("/api/realtime");
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("[useRealtimeRefresh] ✅ SSE connection opened successfully");
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            console.log("[useRealtimeRefresh] 📨 Raw event received:", event.data);
            const data: RealtimeEvent = JSON.parse(event.data);
            console.log("[useRealtimeRefresh] 📦 Parsed event:", data);

            // Ignore ping and hello events
            if (data.type === "ping" || data.type === "hello") {
              console.log(`[useRealtimeRefresh] ⏭️  Ignoring ${data.type} event`);
              return;
            }

            // Apply filter if provided
            if (options.filter) {
              if (!options.filter(data)) {
                console.log(`[useRealtimeRefresh] ⏭️  Event filtered out by custom filter`);
                return;
              }
            }

            // Filter by event types if provided
            if (options.eventTypes && !options.eventTypes.includes(data.type)) {
              console.log(`[useRealtimeRefresh] ⏭️  Event type "${data.type}" not in allowed types:`, options.eventTypes);
              return;
            }

            // Special handling for student dashboard
            if (options.studentId) {
              // Only refresh if event is for this student or is a general update
              if (
                data.type === "ACCOUNTS_UPDATED" &&
                data.payload?.studentId &&
                data.payload.studentId !== options.studentId
              ) {
                console.log(`[useRealtimeRefresh] ⏭️  Event not for this student (${options.studentId} vs ${data.payload.studentId})`);
                return; // Skip - not for this student
              }
            }

            console.log(`[useRealtimeRefresh] 🔄 Received event: ${data.type}, triggering router.refresh()...`);
            
            // Force refresh - use both router.refresh() and window.location.reload() for reliability
            router.refresh();
            
            // Also force a hard reload if it's a RESULTS_IMPORTED event (data was imported)
            if (data.type === "RESULTS_IMPORTED") {
              console.log(`[useRealtimeRefresh] 🔄 RESULTS_IMPORTED detected, forcing page reload...`);
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
            
            console.log(`[useRealtimeRefresh] ✅ Router refresh triggered`);
          } catch (error) {
            console.error("[useRealtimeRefresh] ❌ Error parsing event:", error, "Raw data:", event.data);
          }
        };

        eventSource.onerror = (error) => {
          console.error("[useRealtimeRefresh] SSE error:", error);
          
          // Close and attempt reconnect
          eventSource.close();
          eventSourceRef.current = null;

          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * reconnectAttemptsRef.current, 10000); // Exponential backoff, max 10s
            console.log(`[useRealtimeRefresh] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error("[useRealtimeRefresh] Max reconnect attempts reached, giving up");
          }
        };
      } catch (error) {
        console.error("[useRealtimeRefresh] Error creating EventSource:", error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [router, options.filter, options.eventTypes, options.studentId]);
}
