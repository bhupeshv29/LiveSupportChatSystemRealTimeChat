import type { WebSocket } from "ws";
import type { Role } from "@repo/common/types";

export interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  role?: Role;
}

export interface MemoryMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: Role;
  content: string;
  createdAt: Date;
}

const rooms = new Map<string, Set<AuthenticatedSocket>>();

const messageCache = new Map<string, MemoryMessage[]>();

export function joinRoom(conversationId: string, ws: AuthenticatedSocket) {
  let room = rooms.get(conversationId);

  if (!room) {
    room = new Set();

    rooms.set(conversationId, room);
  }

  room.add(ws);
}

export function leaveRoom(conversationId: string, ws: AuthenticatedSocket) {
  const room = rooms.get(conversationId);

  if (!room) {
    return;
  }

  room.delete(ws);

  if (room.size === 0) {
    rooms.delete(conversationId);
  }
}

export function getRoom(conversationId: string) {
  return rooms.get(conversationId);
}

export function deleteRoom(conversationId: string) {
  rooms.delete(conversationId);
}

export function addMessageToMemory(
  conversationId: string,
  message: MemoryMessage,
) {
  let messages = messageCache.get(conversationId);

  if (!messages) {
    messages = [];

    messageCache.set(conversationId, messages);
  }

  messages.push(message);
}

export function getMessagesFromMemory(conversationId: string) {
  return messageCache.get(conversationId) ?? [];
}

export function deleteMessagesFromMemory(conversationId: string) {
  messageCache.delete(conversationId);
}

export function removeSocketFromAllRooms(ws: AuthenticatedSocket) {
  for (const [conversationId, room] of rooms) {
    room.delete(ws);

    if (room.size === 0) {
      rooms.delete(conversationId);
    }
  }
}
