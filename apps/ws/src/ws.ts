import "dotenv/config";
import { WebSocketServer } from "ws";

import { authenticateToken } from "./ws.auth";
import { handleMessage } from "./ws.handlers";
import { removeSocketFromAllRooms, type AuthenticatedSocket } from "./ws.rooms";

const PORT = Number(process.env.PORT || 8080);

const wss = new WebSocketServer({
  port: PORT,
});

wss.on("connection", (ws, request) => {
  const socket = ws as AuthenticatedSocket;

  try {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);

    const token = url.searchParams.get("token");

    if (!token) {
      socket.close(1008, "Authentication required");
      return;
    }

    const user = authenticateToken(token);

    socket.userId = user.userId;
    socket.role = user.userRole;

    console.log(`WS connected: ${socket.userId} (${socket.role})`);

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    socket.on("message", async (data) => {
      await handleMessage(socket, data as Buffer);
    });

    socket.on("close", () => {
      removeSocketFromAllRooms(socket);

      console.log(`WS disconnected: ${socket.userId}`);
    });

    socket.send(
      JSON.stringify({
        event: "CONNECTED",
        data: {
          userId: socket.userId,
        },
      }),
    );
  } catch (error) {
    console.error("WS authentication failed:", error);
    socket.close(1008, "Invalid authentication");
  }
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
