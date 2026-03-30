import { useQuery } from "@tanstack/react-query";


export function useDashboardData(_filters: { branch?: string; semester?: string } = {}) {
  // Filters are ignored until backend supports them in prod
  // Placeholder: No dashboard overview API implemented
  return { data: null, isLoading: false, error: null };
}
