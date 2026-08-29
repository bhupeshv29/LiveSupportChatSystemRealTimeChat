import type { Analytics, Conversation, Message } from "../types";
import { getSession } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export type Person = { id: string; name: string; email: string };
export type Supervisor = Person & { agents: Person[] };
type ApiConversation = {
  id: string;
  candidateId: string;
  supervisorId: string | null;
  agentId: string | null;
  status: "OPEN" | "CLOSE";
  createdAt: string;
  candidate: { id: string; name: string };
  agent: { id: string; name: string } | null;
  messages?: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  }[];
};
const mapConversation = (item: ApiConversation): Conversation => ({
  id: item.id,
  candidateId: item.candidateId ?? item.candidate.id,
  candidateName: item.candidate.name,
  supervisorId: item.supervisorId ?? undefined,
  agentId: item.agentId ?? item.agent?.id,
  agentName: item.agent?.name,
  subject: `Support request #${item.id.slice(0, 8)}`,
  status: item.status === "CLOSE" ? "CLOSED" : "OPEN",
  createdAt: item.createdAt ?? "",
});
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getSession()?.token;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const data = (await response.json()) as T & {
    message?: string;
    conversationId?: string;
  };
  if (!response.ok) {
    const error = new Error(data.message ?? "Request failed") as Error & {
      conversationId?: string;
    };
    error.conversationId = data.conversationId;
    throw error;
  }
  return data;
}
export const api = {
  createConversation: async () => {
    try {
      return (
        await request<{ conversationId: string }>("/conversation", {
          method: "POST",
        })
      ).conversationId;
    } catch (error) {
      const existing = error as Error & { conversationId?: string };
      if (existing.conversationId) return existing.conversationId;
      throw error;
    }
  },
  candidateConversations: async () =>
    (await request<ApiConversation[]>("/candidate/conversations")).map(
      mapConversation,
    ),
  agentConversations: async () =>
    (await request<ApiConversation[]>("/agent/conversations")).map(
      mapConversation,
    ),
  supervisorConversations: async () =>
    (await request<ApiConversation[]>("/supervisor/conversations")).map(
      mapConversation,
    ),
  supervisorAgents: () => request<Person[]>("/supervisor/agents"),
  assign: (id: string, agentId: string) =>
    request(`/conversation/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ agentId }),
    }),
  supervisors: () => request<Supervisor[]>("/admin/supervisors"),
  agents: () => request<Person[]>("/admin/agents"),
  assignAgentToSupervisor: (supervisorId: string, agentId: string) =>
    request(`/admin/supervisors/${supervisorId}/agents`, {
      method: "POST",
      body: JSON.stringify({ agentId }),
    }),
  conversation: async (id: string) =>
    mapConversation(await request<ApiConversation>(`/conversation/${id}`)),
  messages: async (id: string): Promise<Message[]> => {
    const result = await request<ApiConversation>(`/conversation/${id}`);
    const currentUser = getSession();
    return (result.messages ?? []).map((message) => ({
      ...message,
      conversationId: id,
      senderRole:
        message.senderId === result.candidate.id ? "CANDIDATE" : "AGENT",
      senderName:
        message.senderId === result.candidate.id
          ? result.candidate.name
          : message.senderId === currentUser?.id
            ? currentUser.name
            : (result.agent?.name ?? "Support agent"),
    }));
  },
  analytics: async (): Promise<Analytics> => {
    const result = await request<{
      totalConversations: number;
      openConversations: number;
      closedConversations: number;
      supervisors: {
        name: string;
        agentCount: number;
        conversationCount: number;
      }[];
    }>("/admin/analytics");
    return {
      total: result.totalConversations,
      open: result.openConversations,
      closed: result.closedConversations,
      supervisors: result.supervisors.map((item) => ({
        name: item.name,
        agents: item.agentCount,
        conversations: item.conversationCount,
      })),
    };
  },
};
