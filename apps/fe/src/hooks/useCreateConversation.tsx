import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createConversation } from "../services/conversation.service";

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", "candidate"],
      });
    },
  });
}
