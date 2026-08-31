export type Role = "CANDIDATE" | "AGENT" | "SUPERVISOR" | "ADMIN";

export type ConversationStatus = "OPEN" | "CLOSE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Person {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  conversationId?: string;
  senderName?: string;
}

export interface ConversationDetail {
  id: string;
  status: ConversationStatus;
  candidate: Person;
  agent: Person | null;
  supervisor: Person | null;
  messages: Message[];
}

export interface CandidateConversation {
  id: string;
  candidateId: string;
  supervisorId: string | null;
  agentId: string | null;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  agent: Person | null;
  supervisor: Person | null;
}

export interface TeamConversation {
  id: string;
  status: ConversationStatus;
  candidate: Person;
  agent: Person | null;
  supervisor: Person | null;
}

export interface CreateConversationResponse {
  id: string;
  candidateId: string;
  supervisorId: string | null;
  agentId: string | null;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAgent {
  id: string;
  name: string;
  email: string;
  supervisorId: string | null;
  supervisor: Person | null;
}

export interface AdminAnalytics {
  totalConversations: number;
  openConversations: number;
  closedConversations: number;
  supervisors: SupervisorAnalytics[];
}

export interface SupervisorAnalytics {
  id: string;
  name: string;
  agentCount: number;
  conversationCount: number;
}

export interface AdminSupervisor {
  id: string;
  name: string;
  email: string;
}

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
      role: string;
    }
  | {
      type: "JOINED_CONVERSATION";
      conversationId: string;
    }
  | {
      type: "USER_JOINED";
      userId: string;
      role: string;
    }
  | {
      type: "NEW_MESSAGE";
      message: Message;
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

export function getRoleHome(role: Role): string {
  switch (role) {
    case "CANDIDATE":
      return "/candidate";
    case "AGENT":
      return "/agent";
    case "SUPERVISOR":
      return "/supervisor";
    case "ADMIN":
      return "/admin";
  }
}
