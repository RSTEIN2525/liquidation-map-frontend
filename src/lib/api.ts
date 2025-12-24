import { LiquidationMapSchema, type LiquidationMap } from './schemas';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://liquidation-api-1001101479084.asia-east1.run.app';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface CustomMapParams {
  ticker: string;
  lookbackDays: number;
  exchanges?: string[];
}

export async function fetchLiquidationMap(params?: CustomMapParams): Promise<LiquidationMap> {
  try {
    let url = `${API_BASE}/liquidation-map`;
    
    // Use custom endpoint if params provided
    if (params) {
      const queryParams = new URLSearchParams({
        ticker: params.ticker,
        lookback_days: params.lookbackDays.toString(),
      });
      
      if (params.exchanges && params.exchanges.length > 0) {
        queryParams.append('exchanges', params.exchanges.join(','));
      }
      
      url = `${API_BASE}/liquidation-map/custom?${queryParams}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 503) {
      throw new ApiError(
        'Data is loading, please wait a moment...',
        503,
        'Service Unavailable'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `Failed to fetch liquidation map: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    
    // Validate and parse with Zod
    const parsed = LiquidationMapSchema.safeParse(data);
    
    if (!parsed.success) {
      console.error('API validation error:', parsed.error);
      throw new ApiError('Invalid API response format');
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }
    
    throw new ApiError('Unknown error fetching liquidation map');
  }
}

// Check API status
export async function checkApiStatus(): Promise<{ status: string }> {
  try {
    const response = await fetch(`${API_BASE}/status`);
    
    if (!response.ok) {
      return { status: 'error' };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { status: 'error' };
  }
}


