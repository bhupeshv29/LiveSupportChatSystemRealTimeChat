import type {
  CandidateConversation,
  ConversationDetail,
  CreateConversationResponse,
} from "../types/types";
import api from "./api";

export async function getCandidateConversations(): Promise<CandidateConversation[]> {
  const response = await api.get<CandidateConversation[]>("/conversation");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getConversation(conversationId: string,): Promise<ConversationDetail> {
  const response = await api.get<ConversationDetail>(`/conversation/${conversationId}`);
  return response.data;
}

export async function createConversation(): Promise<CreateConversationResponse> {
  const response = await api.post<CreateConversationResponse>("/conversation");
  return response.data;
}

export async function closeConversation(conversationId: string) {
  const response = await api.post(`/conversation/${conversationId}/close`);
  return response.data;
}
