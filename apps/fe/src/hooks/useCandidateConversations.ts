import { useQuery } from "@tanstack/react-query";
import { getCandidateConversations } from "../services/conversation.service";

export function useCandidateConversations() {
  return useQuery({
    queryKey: ["conversations", "candidate"],
    queryFn: getCandidateConversations,
  });
}
