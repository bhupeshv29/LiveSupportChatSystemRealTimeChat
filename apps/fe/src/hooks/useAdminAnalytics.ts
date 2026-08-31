import { useQuery } from "@tanstack/react-query";
import { getAdminAnalytics } from "../services/admin.service";

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: getAdminAnalytics,
  });
}
