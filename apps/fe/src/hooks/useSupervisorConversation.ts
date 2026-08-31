import { useQuery } from "@tanstack/react-query";
import { getSupervisorConversations } from "../services/supervisor.service";

export function useSupervisorConversations() {
  return useQuery({
    queryKey: ["supervisor-conversations"],
    queryFn: getSupervisorConversations,
  });
}
