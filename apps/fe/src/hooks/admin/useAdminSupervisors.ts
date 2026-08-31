import { useQuery } from "@tanstack/react-query";
import {
  getAdminSupervisors,
  getSupervisorAgents,
} from "../../services/admin.service";

export function useAdminSupervisors() {
  return useQuery({
    queryKey: ["admin", "supervisors"],
    queryFn: getAdminSupervisors,
  });
}

export function useSupervisorAgents(supervisorId: string | null) {
  return useQuery({
    queryKey: ["admin", "supervisors", supervisorId, "agents"],
    queryFn: () => getSupervisorAgents(supervisorId!),
    enabled: Boolean(supervisorId),
  });
}
