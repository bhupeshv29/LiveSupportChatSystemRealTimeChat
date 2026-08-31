import { useQuery } from "@tanstack/react-query";
import { getSupervisorTeamAgents } from "../../services/supervisor.service";

export function useSupervisorTeamAgents() {
  return useQuery({
    queryKey: ["supervisor-agents"],
    queryFn: getSupervisorTeamAgents,
  });
}
