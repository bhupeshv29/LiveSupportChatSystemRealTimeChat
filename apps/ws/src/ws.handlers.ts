import type { ClientEvent, ServerEvent } from "@repo/common/types";
import type { RawData } from "ws";

import { prisma, ConversationStatus, Role } from "@repo/db/client";

import type { AuthenticatedSocket } from "./ws.rooms";

import {
  getRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  addMessageToMemory,
  deleteMessagesFromMemory,
} from "./ws.rooms";

function sendEvent(ws: AuthenticatedSocket, event: ServerEvent) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

function broadcast(conversationId: string, event: ServerEvent) {
  const room = getRoom(conversationId);

  if (!room) {
    return;
  }

  for (const ws of room) {
    sendEvent(ws, event);
  }
}

/**
 * Only Candidate and assigned Agent
 * can access the chat.
 */
async function canAccessConversation(
  userId: string,
  role: Role,
  conversationId: string,
) {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
      candidateId: true,
      agentId: true,
      supervisorId: true,
      status: true,
    },
  });

  if (!conversation) {
    return null;
  }

  if (role === Role.CANDIDATE && conversation.candidateId === userId) {
    return conversation;
  }

  if (role === Role.AGENT && conversation.agentId === userId) {
    return conversation;
  }

  return null;
}

/**
 * JOIN_CONVERSATION
 */
async function handleJoinConversation(
  ws: AuthenticatedSocket,
  conversationId: string,
) {
  if (!ws.userId || !ws.role) {
    return;
  }

  const conversation = await canAccessConversation(
    ws.userId,
    ws.role,
    conversationId,
  );

  if (!conversation) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "You cannot access this conversation",
      },
    });

    return;
  }

  if (conversation.status === ConversationStatus.CLOSE) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "Conversation is closed",
      },
    });

    return;
  }

  joinRoom(conversationId, ws);

  sendEvent(ws, {
    event: "CONVERSATION_JOINED",
    data: {
      conversationId,
    },
  });
}

/**
 * SEND_MESSAGE
 */
async function handleSendMessage(
  ws: AuthenticatedSocket,
  conversationId: string,
  content: string,
) {
  if (!ws.userId || !ws.role) {
    return;
  }

  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "Message cannot be empty",
      },
    });

    return;
  }

  const room = getRoom(conversationId);

  if (!room || !room.has(ws)) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "You have not joined this conversation",
      },
    });

    return;
  }

  const conversation = await canAccessConversation(
    ws.userId,
    ws.role,
    conversationId,
  );

  if (!conversation) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "You cannot access this conversation",
      },
    });

    return;
  }

  if (conversation.status === ConversationStatus.CLOSE) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "Conversation is closed",
      },
    });

    return;
  }

  // 1. Persist permanently
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: ws.userId,
      content: trimmedContent,
    },
  });

  // 2. Store temporarily in memory
  addMessageToMemory(conversationId, {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderRole: ws.role,
    content: message.content,
    createdAt: message.createdAt,
  });

  // 3. Broadcast to everyone in room
  broadcast(conversationId, {
    event: "NEW_MESSAGE",
    data: {
      conversationId,
      senderId: message.senderId,
      senderRole: ws.role,
      content: message.content,
      createdAt: message.createdAt,
    },
  });
}

/**
 * CLOSE_CONVERSATION
 *
 * Only the assigned Agent can close.
 */
async function handleCloseConversation(
  ws: AuthenticatedSocket,
  conversationId: string,
) {
  if (!ws.userId || ws.role !== Role.AGENT) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "Only the assigned agent can close conversation",
      },
    });

    return;
  }

  // Agent must have joined
  const room = getRoom(conversationId);

  if (!room || !room.has(ws)) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "You have not joined this conversation",
      },
    });

    return;
  }

  /**
   * Atomic operation.
   *
   * Only succeeds if:
   * - conversation exists
   * - this agent is assigned
   * - conversation is still OPEN
   */
  const result = await prisma.conversation.updateMany({
    where: {
      id: conversationId,
      agentId: ws.userId,
      status: ConversationStatus.OPEN,
    },
    data: {
      status: ConversationStatus.CLOSE,
      closedAt: new Date(),
    },
  });

  /**
   * count === 0 means:
   *
   * - already closed
   * OR
   * - another agent is assigned
   * OR
   * - conversation doesn't exist
   */
  if (result.count === 0) {
    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "Conversation already closed or not assigned to you",
      },
    });

    return;
  }

  // Notify candidate + agent
  broadcast(conversationId, {
    event: "CONVERSATION_CLOSED",
    data: {
      conversationId,
    },
  });

  // Cleanup memory
  deleteRoom(conversationId);
  deleteMessagesFromMemory(conversationId);
}

/**
 * LEAVE_CONVERSATION
 */
async function handleLeaveConversation(
  ws: AuthenticatedSocket,
  conversationId: string,
) {
  leaveRoom(conversationId, ws);
}

/**
 * Main WS event handler
 */
export async function handleMessage(ws: AuthenticatedSocket, rawData: RawData) {
  try {
    const text = Array.isArray(rawData)
      ? Buffer.concat(rawData).toString()
      : Buffer.from(rawData).toString();
    const message = JSON.parse(text) as ClientEvent;

    switch (message.event) {
      case "JOIN_CONVERSATION":
        await handleJoinConversation(ws, message.data.conversationId);
        break;

      case "SEND_MESSAGE":
        await handleSendMessage(
          ws,
          message.data.conversationId,
          message.data.content,
        );
        break;

      case "LEAVE_CONVERSATION":
        await handleLeaveConversation(ws, message.data.conversationId);
        break;

      case "CLOSE_CONVERSATION":
        await handleCloseConversation(ws, message.data.conversationId);
        break;

      default:
        sendEvent(ws, {
          event: "ERROR",
          data: {
            message: "Unknown event",
          },
        });
    }
  } catch (error) {
    console.error("WS message error:", error);

    sendEvent(ws, {
      event: "ERROR",
      data: {
        message: "Invalid WebSocket message",
      },
    });
  }
}
