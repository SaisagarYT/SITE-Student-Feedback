import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardOverview } from "@/api";

export function useDashboardData(_filters: { branch?: string; semester?: string } = {}) {
  // Filters are ignored until backend supports them in prod
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getAdminDashboardOverview(),
  });
}
