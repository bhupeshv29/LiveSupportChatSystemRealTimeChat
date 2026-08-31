import type { TeamConversation } from "../types/types";
import api from "./api";

export async function getAgentConversations(): Promise<TeamConversation[]> {
  const response = await api.get<{ conversations: TeamConversation[] }>(
    "/agent/conversations",
  );

  return response.data.conversations ?? [];
}
