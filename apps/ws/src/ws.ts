// get jwt from Url;
/**
   const queryString = req.url?.split("?")[1];

  const token = queryString
    ? new URLSearchParams(queryString).get("token")
    : null;

  if (!token) {
    ws.close();
    return;
  }
  */

import { WebSocketServer, WebSocket } from "ws";
import type {
  AuthenticatedSocket,
  ClientEvent,
  ServerEvent,
} from "./types/ws.types";
import { verifyToken } from "./authCheck/auth.ws";
import { prisma } from "@repo/db/client";
import { rooms } from "./rooms/room";

const PORT = Number(process.env.PORT || 8080);

export const wss = new WebSocketServer({
  port: PORT,
});

console.log(`WebSocket server running on port ${PORT}`);

// CONNECTION

wss.on("connection", async (ws: AuthenticatedSocket, req) => {
  console.log("New WebSocket connection");

  // AUTHENTICATION

  const url = new URL(req.url!, `http://${req.headers.host}`);

  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(1008, "Authentication token required");

    return;
  }

  // VERIFY JWT

  let payload;

  try {
    payload = verifyToken(token);
  } catch {
    ws.close(1008, "Invalid authentication token");

    return;
  }

  // ATTACH USER TO SOCKET

  ws.userId = payload.userId;
  ws.role = payload.role;

  console.log("Authenticated:", {
    userId: ws.userId,
    role: ws.role,
  });

  // AUTHENTICATED EVENT

  const authenticatedEvent: ServerEvent = {
    type: "AUTHENTICATED",
    userId: ws.userId,
    role: ws.role,
  };

  ws.send(JSON.stringify(authenticatedEvent));

  // MESSAGE

  ws.on("message", async (rawMessage) => {
    try {
      const message: ClientEvent = JSON.parse(rawMessage.toString());

      console.log("Client event:", message);

      // JOIN CONVERSATION

      if (message.type === "JOIN_CONVERSATION") {
        const conversationId = message.conversationId;

        // Find conversation

        const conversation = await prisma.conversation.findUnique({
          where: {
            id: conversationId,
          },
        });

        if (!conversation) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "Conversation not found",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Check user belongs to conversation

        const isCandidate = conversation.candidateId === ws.userId;

        const isAgent = conversation.agentId === ws.userId;

        if (!isCandidate && !isAgent) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "You are not allowed to join this conversation",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Create room if needed

        if (!rooms[conversationId]) {
          rooms[conversationId] = [];
        }

        // Prevent duplicate socket

        const alreadyJoined = rooms[conversationId].some(
          (socket) => socket === ws,
        );

        if (alreadyJoined) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "Already joined conversation",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Maximum 2 sockets

        if (rooms[conversationId].length >= 2) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "Conversation room is full",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Add socket to room

        rooms[conversationId].push(ws);

        // Store conversation on socket
        ws.conversationId = conversationId;

        console.log(`${ws.userId} joined ${conversationId}`);

        // Tell client

        const joinedEvent: ServerEvent = {
          type: "JOINED_CONVERSATION",
          conversationId,
        };

        ws.send(JSON.stringify(joinedEvent));

        // Notify other socket

        rooms[conversationId].forEach((socket) => {
          if (socket !== ws && socket.readyState === WebSocket.OPEN) {
            const event: ServerEvent = {
              type: "USER_JOINED",
              userId: ws.userId!,
              role: ws.role!,
            };

            socket.send(JSON.stringify(event));
          }
        });

        return;
      }

      // SEND MESSAGE

      if (message.type === "SEND_MESSAGE") {
        const { conversationId, content } = message;

        // Validate

        if (!content.trim()) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "Message cannot be empty",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Verify socket is in conversation

        if (ws.conversationId !== conversationId) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "You are not connected to this conversation",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Get conversation

        const conversation = await prisma.conversation.findUnique({
          where: {
            id: conversationId,
          },
        });

        if (!conversation) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "Conversation not found",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Authorization

        const allowed =
          conversation.candidateId === ws.userId ||
          conversation.agentId === ws.userId;

        if (!allowed) {
          const event: ServerEvent = {
            type: "ERROR",
            message: "You cannot send messages to this conversation",
          };

          ws.send(JSON.stringify(event));

          return;
        }

        // Save to DB

        const savedMessage = await prisma.message.create({
          data: {
            conversationId,
            senderId: ws.userId!,
            content: content.trim(),
          },
        });

        // Create typed server event

        const newMessageEvent: ServerEvent = {
          type: "NEW_MESSAGE",

          message: {
            id: savedMessage.id,
            conversationId: savedMessage.conversationId,
            senderId: savedMessage.senderId,
            content: savedMessage.content,
            createdAt: savedMessage.createdAt,
          },
        };

        // Broadcast

        rooms[conversationId]?.forEach((socket) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(newMessageEvent));
          }
        });

        return;
      }

      // LEAVE CONVERSATION

      if (message.type === "LEAVE_CONVERSATION") {
        const conversationId = message.conversationId;

        if (rooms[conversationId]) {
          rooms[conversationId] = rooms[conversationId].filter(
            (socket) => socket !== ws,
          );

          if (rooms[conversationId].length === 0) {
            delete rooms[conversationId];
          }
        }

        ws.conversationId = undefined;

        return;
      }
    } catch (error) {
      console.error("WebSocket message error:", error);

      const event: ServerEvent = {
        type: "ERROR",
        message: "Invalid WebSocket message",
      };

      ws.send(JSON.stringify(event));
    }
  });

  // CLOSE

  ws.on("close", () => {
    console.log(`Socket closed: ${ws.userId}`);

    const conversationId = ws.conversationId;

    if (!conversationId) {
      return;
    }

    // Remove socket

    if (rooms[conversationId]) {
      rooms[conversationId] = rooms[conversationId].filter(
        (socket) => socket !== ws,
      );

      // Notify remaining socket

      rooms[conversationId].forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          const event: ServerEvent = {
            type: "USER_LEFT",
            userId: ws.userId!,
          };

          socket.send(JSON.stringify(event));
        }
      });

      // Delete empty room

      if (rooms[conversationId].length === 0) {
        delete rooms[conversationId];
      }
    }
  });

  // ERROR

  ws.on("error", (error) => {
    console.error(`Socket error for ${ws.userId}:`, error);
  });
});

//one improvement we can make is zod validation
