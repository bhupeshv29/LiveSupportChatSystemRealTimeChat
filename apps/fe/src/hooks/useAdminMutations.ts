import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignAgentToSupervisor,
  removeAgentFromSupervisor,
} from "../services/admin.service";

function invalidateAdminOrg(
  queryClient: ReturnType<typeof useQueryClient>,
  supervisorId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["admin", "agents"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "supervisors"] });
  queryClient.invalidateQueries({
    queryKey: ["admin", "supervisors", supervisorId, "agents"],
  });
  queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
}

export function useAssignAgentToSupervisor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supervisorId,
      agentId,
    }: {
      supervisorId: string;
      agentId: string;
    }) => assignAgentToSupervisor(supervisorId, agentId),
    onSuccess: (_, variables) => {
      invalidateAdminOrg(queryClient, variables.supervisorId);
    },
  });
}

export function useRemoveAgentFromSupervisor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supervisorId,
      agentId,
    }: {
      supervisorId: string;
      agentId: string;
    }) => removeAgentFromSupervisor(supervisorId, agentId),
    onSuccess: (_, variables) => {
      invalidateAdminOrg(queryClient, variables.supervisorId);
    },
  });
}
