/**
 * SSE Hub - Simple event hub for Server-Sent Events
 * Manages a set of connected clients and broadcasts events to them
 * 
 * NOTE: In Next.js App Router, this uses module-level state which should be shared
 * across requests in the same Node.js process. In serverless environments, each
 * function instance has its own state, so this works best in a single-instance setup.
 */

type SSEClient = {
  send: (data: string) => void;
  id: string;
};

// Use globalThis to ensure shared state across module instances
declare global {
  // eslint-disable-next-line no-var
  var __sseHubClients: Set<SSEClient> | undefined;
  // eslint-disable-next-line no-var
  var __sseHubClientCounter: number | undefined;
}

const clients = globalThis.__sseHubClients ?? new Set<SSEClient>();
let clientIdCounter = globalThis.__sseHubClientCounter ?? 0;

// Store in globalThis for Next.js hot reload compatibility
if (!globalThis.__sseHubClients) {
  globalThis.__sseHubClients = clients;
  globalThis.__sseHubClientCounter = clientIdCounter;
}

/**
 * Add a client to the hub
 * @param sendFn Function to send data to the client
 * @returns Cleanup function to remove the client
 */
export function addClient(sendFn: (data: string) => void): () => void {
  // Ensure we're using the global instance
  const hubClients = globalThis.__sseHubClients ?? clients;
  const counter = (globalThis.__sseHubClientCounter ?? clientIdCounter) + 1;
  globalThis.__sseHubClientCounter = counter;
  
  const clientId = `client-${counter}-${Date.now()}`;
  const client: SSEClient = {
    send: sendFn,
    id: clientId,
  };

  hubClients.add(client);
  console.log(`[SSE Hub] ✅ Client connected: ${clientId} (total: ${hubClients.size})`);
  console.log(`[SSE Hub] 📊 Hub state: globalThis.__sseHubClients exists: ${!!globalThis.__sseHubClients}, size: ${hubClients.size}`);

  // Return cleanup function
  return () => {
    hubClients.delete(client);
    console.log(`[SSE Hub] ❌ Client disconnected: ${clientId} (total: ${hubClients.size})`);
  };
}

/**
 * Broadcast an event to all connected clients
 * @param event Event object with type and optional payload
 */
export function broadcast(event: { type: string; payload?: unknown }): void {
  // Ensure we're using the global instance
  const hubClients = globalThis.__sseHubClients ?? clients;
  
  console.log(`[SSE Hub] 📢 Broadcasting event: ${event.type}`, event.payload);
  console.log(`[SSE Hub] 📊 Current clients count: ${hubClients.size}`);
  console.log(`[SSE Hub] 🔍 Hub state check: globalThis.__sseHubClients exists: ${!!globalThis.__sseHubClients}`);
  
  if (hubClients.size === 0) {
    console.warn(`[SSE Hub] ⚠️  No clients connected, skipping broadcast: ${event.type}`);
    console.warn(`[SSE Hub] 💡 This might happen if broadcast is called from a different serverless instance`);
    return;
  }

  const data = JSON.stringify(event);
  const sseMessage = `data: ${data}\n\n`;

  let sentCount = 0;
  const clientIds: string[] = [];
  
  hubClients.forEach((client) => {
    try {
      client.send(sseMessage);
      sentCount++;
      clientIds.push(client.id);
      console.log(`[SSE Hub] ✅ Sent to client: ${client.id}`);
    } catch (error) {
      console.error(`[SSE Hub] ❌ Error sending to client ${client.id}:`, error);
      // Remove failed client
      hubClients.delete(client);
    }
  });

  console.log(`[SSE Hub] ✅ Broadcast "${event.type}" to ${sentCount}/${hubClients.size} clients`, clientIds);
}

/**
 * Get the number of connected clients (for debugging)
 */
export function getClientCount(): number {
  return clients.size;
}
