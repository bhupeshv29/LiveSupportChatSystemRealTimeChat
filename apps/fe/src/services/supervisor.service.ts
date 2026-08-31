import type { TeamConversation, User } from "../types/types";
import api from "./api";

export async function getSupervisorConversations(): Promise<
  TeamConversation[]
> {
  const response = await api.get<{
    conversations: TeamConversation[];
  }>("/supervisor/conversations");

  return response.data.conversations ?? [];
}

export async function getSupervisorTeamAgents(): Promise<
  Pick<User, "id" | "name" | "email" | "role">[]
> {
  const response = await api.get<{
    agents: Pick<User, "id" | "name" | "email" | "role">[];
  }>("/supervisor/agents");

  return response.data.agents ?? [];
}

export async function assignConversationAgent(
  conversationId: string,
  agentId: string,
): Promise<TeamConversation> {
  const response = await api.post<TeamConversation>(
    `/conversation/${conversationId}/assign`,
    { agentId },
  );

  return response.data;
}
