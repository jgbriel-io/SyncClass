import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QK } from "@/hooks/queryKeys";

export interface RateLimitSummaryRow {
  operation: string;
  total_requests: number;
  unique_users: number;
  max_per_user: number;
  window_start: string;
}

async function fetchRateLimitSummary(
  windowHours: number
): Promise<RateLimitSummaryRow[]> {
  const { data, error } = await supabase.rpc("get_rate_limit_summary", {
    p_window_hours: windowHours,
  });
  if (error) throw error;
  return (data ?? []) as RateLimitSummaryRow[];
}

export function useRateLimitDashboard(windowHours = 1) {
  return useQuery({
    queryKey: [QK.RATE_LIMIT_DASHBOARD, windowHours],
    queryFn: () => fetchRateLimitSummary(windowHours),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
