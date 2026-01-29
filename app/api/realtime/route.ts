import { NextRequest } from "next/server";
import { addClient } from "@/lib/sseHub";

export const dynamic = "force-dynamic";

/**
 * SSE endpoint for real-time updates
 * Clients connect here and receive events when data changes
 */
export async function GET(request: NextRequest) {
  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper function to send SSE message
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error("[SSE] Error sending data:", error);
        }
      };

      // Register client with hub
      const cleanup = addClient(send);
      console.log("[SSE API] ✅ Client registered with hub");

      // Send initial "hello" event
      const helloMessage = `data: ${JSON.stringify({ type: "hello", payload: { message: "Connected", timestamp: Date.now() } })}\n\n`;
      send(helloMessage);
      console.log("[SSE API] 👋 Sent hello message");

      // Send ping every 25-30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          send(`data: ${JSON.stringify({ type: "ping", payload: { timestamp: Date.now() } })}\n\n`);
        } catch (error) {
          console.error("[SSE] Error sending ping:", error);
          clearInterval(pingInterval);
          cleanup();
        }
      }, 28000); // 28 seconds

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        cleanup();
        try {
          controller.close();
        } catch (error) {
          // Ignore errors on close
        }
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in nginx
    },
  });
}
