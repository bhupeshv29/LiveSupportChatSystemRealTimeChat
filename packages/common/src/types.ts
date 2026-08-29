export type Role = "CANDIDATE" | "SUPERVISOR" | "AGENT" | "ADMIN";

export type ClientEvent =
  | {
      event: "JOIN_CONVERSATION";
      data: {
        conversationId: string;
      };
    }
  | {
      event: "SEND_MESSAGE";
      data: {
        conversationId: string;
        content: string;
      };
    }
  | {
      event: "LEAVE_CONVERSATION";
      data: {
        conversationId: string;
      };
    }
  | {
      event: "CLOSE_CONVERSATION";
      data: {
        conversationId: string;
      };
    };

export type ServerEvent =
  | {
      event: "CONVERSATION_JOINED";
      data: {
        conversationId: string;
      };
    }
  | {
      event: "NEW_MESSAGE";
      data: {
        conversationId: string;
        senderId: string;
        senderRole: Role;
        content: string;
        createdAt: Date;
      };
    }
  | {
      event: "CONVERSATION_CLOSED";
      data: {
        conversationId: string;
      };
    }
  | {
      event: "ERROR";
      data: {
        message: string;
      };
    };
