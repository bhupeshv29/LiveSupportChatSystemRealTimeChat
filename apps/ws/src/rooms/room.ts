import { WebSocket } from "ws";
import type { AuthenticatedSocket, ServerEvent } from "../types/ws.types";

export const rooms: Record<string, AuthenticatedSocket[]> = {};

export function broadcast(conversationId: string, event: ServerEvent) {
  rooms[conversationId]?.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event));
    }
  });
}
