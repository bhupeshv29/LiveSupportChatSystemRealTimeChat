import { useQuery } from "@tanstack/react-query";
import { getAdminAgents } from "../../services/admin.service";

export function useAdminAgents() {
  return useQuery({
    queryKey: ["admin", "agents"],
    queryFn: getAdminAgents,
  });
}
