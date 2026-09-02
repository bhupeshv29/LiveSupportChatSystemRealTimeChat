import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignAgentToSupervisor,
  removeAgentFromSupervisor,
} from "../../services/admin.service";

type AgentSupervisorIds = {
  supervisorId: string;
  agentId: string;
};

export function useAssignAgentToSupervisor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supervisorId, agentId }: AgentSupervisorIds) =>
      assignAgentToSupervisor(supervisorId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useRemoveAgentFromSupervisor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supervisorId, agentId }: AgentSupervisorIds) =>
      removeAgentFromSupervisor(supervisorId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
