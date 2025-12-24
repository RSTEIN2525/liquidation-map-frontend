import { useQuery } from '@tanstack/react-query';
import { fetchLiquidationMap, type CustomMapParams } from './api';

export function useLiquidationMap(params?: CustomMapParams) {
  const isCustom = !!params;
  
  return useQuery({
    queryKey: params 
      ? ['liquidation-map', 'custom', params.ticker, params.lookbackDays, params.exchanges?.join(',')]
      : ['liquidation-map', 'default'],
    queryFn: () => fetchLiquidationMap(params),
    // Default endpoint: cache for 1 hour, custom endpoint: don't auto-refetch
    refetchInterval: isCustom ? false : 60 * 60 * 1000,
    staleTime: isCustom ? Infinity : 50 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}


