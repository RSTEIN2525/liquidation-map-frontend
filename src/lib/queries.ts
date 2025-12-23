import { useQuery } from '@tanstack/react-query';
import { fetchLiquidationMap } from './api';

export function useLiquidationMap() {
  return useQuery({
    queryKey: ['liquidation-map'],
    queryFn: fetchLiquidationMap,
    refetchInterval: 60 * 60 * 1000, // Refetch every hour (API updates hourly)
    staleTime: 50 * 60 * 1000, // Consider stale after 50 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

