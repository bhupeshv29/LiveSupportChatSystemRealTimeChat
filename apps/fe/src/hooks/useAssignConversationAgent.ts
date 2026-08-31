import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignConversationAgent } from "../services/supervisor.service";

export function useAssignConversationAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      agentId,
    }: {
      conversationId: string;
      agentId: string;
    }) => assignConversationAgent(conversationId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supervisor-conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-conversations"],
      });
    },
  });
}
