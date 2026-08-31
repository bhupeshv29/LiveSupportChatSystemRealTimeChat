import { useQuery } from "@tanstack/react-query";
import { getAgentConversations } from "../../services/agent.service";

export function useAgentConversations() {
  return useQuery({
    queryKey: ["agent-conversations"],
    queryFn: getAgentConversations,
  });
}
