import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";

let wsServer: WebSocketServer | null = null;
const wsClients = new Set<WebSocket>();

export const startWebSocketHub = (httpServer: Server): void => {
  if (wsServer) {
    return;
  }

  wsServer = new WebSocketServer({
    server: httpServer,
    path: "/ws",
  });

  wsServer.on("connection", (socket) => {
    wsClients.add(socket);

    socket.send(
      JSON.stringify({
        type: "WS_CONNECTED",
        payload: {
          connectedAt: new Date().toISOString(),
        },
      })
    );

    socket.on("close", () => {
      wsClients.delete(socket);
    });
  });

  console.log("WebSocket hub started on /ws");
};

export const broadcastRealtimeEvent = (type: string, payload: unknown): void => {
  const message = JSON.stringify({ type, payload });

  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

export const stopWebSocketHub = async (): Promise<void> => {
  for (const client of wsClients) {
    client.close();
  }
  wsClients.clear();

  if (!wsServer) {
    return;
  }

  await new Promise<void>((resolve) => {
    wsServer?.close(() => resolve());
  });

  wsServer = null;
};
