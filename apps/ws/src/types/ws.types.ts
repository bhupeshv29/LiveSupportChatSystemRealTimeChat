import { WebSocket } from "ws";

export type Role = "CANDIDATE" | "AGENT";

export type JwtPayload = {
  userId: string;
  role: Role;
};

// CLIENT → SERVER EVENTS

export type ClientEvent =
  | {
      type: "JOIN_CONVERSATION";
      conversationId: string;
    }
  | {
      type: "SEND_MESSAGE";
      conversationId: string;
      content: string;
    }
  | {
      type: "LEAVE_CONVERSATION";
      conversationId: string;
    };

// SERVER → CLIENT EVENTS

export type ServerEvent =
  | {
      type: "AUTHENTICATED";
      userId: string;
      role: Role;
    }
  | {
      type: "JOINED_CONVERSATION";
      conversationId: string;
    }
  | {
      type: "USER_JOINED";
      userId: string;
      role: Role;
    }
  | {
      type: "NEW_MESSAGE";
      message: {
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        createdAt: Date;
      };
    }
  | {
      type: "USER_LEFT";
      userId: string;
    }
  | {
      type: "ERROR";
      message: string;
    };

// AUTHENTICATED SOCKET

export type AuthenticatedSocket = WebSocket & {
  userId?: string;
  role?: Role;
  conversationId?: string;
};
