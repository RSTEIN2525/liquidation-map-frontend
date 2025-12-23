import { LiquidationMapSchema, type LiquidationMap } from './schemas';

const API_BASE = '/api'; // Will be proxied to VITE_API_BASE_URL

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

export async function fetchLiquidationMap(): Promise<LiquidationMap> {
  try {
    const response = await fetch(`${API_BASE}/liquidation-map`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch liquidation map: ${response.statusText}`,
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

