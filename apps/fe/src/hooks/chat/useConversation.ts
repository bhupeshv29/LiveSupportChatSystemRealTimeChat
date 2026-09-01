import { useQuery } from "@tanstack/react-query";
import { getConversation } from "../../services/conversation.service";

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: Boolean(conversationId),
  });
}
