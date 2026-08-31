import { WebSocket } from "ws";

export type Role = "CANDIDATE" | "AGENT" | "SUPERVISOR" | "ADMIN";

export type JwtPayload = {
  userId: string;
  role: Role;
};

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
    }
  | {
      type: "CLOSE_CONVERSATION";
      conversationId: string;
    };

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
        senderName: string;
        content: string;
        createdAt: Date;
      };
    }
  | {
      type: "USER_LEFT";
      userId: string;
    }
  | {
      type: "CONVERSATION_CLOSED";
      conversationId: string;
    }
  | {
      type: "ERROR";
      message: string;
    };

export type AuthenticatedSocket = WebSocket & {
  userId?: string;
  role?: Role;
  conversationId?: string;
};
