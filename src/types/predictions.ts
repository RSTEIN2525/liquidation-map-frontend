export interface Prediction {
  id: number;
  timestamp: string;
  bias: 'UP' | 'DOWN' | 'UNBIASED';
  upward_mag: number;
  downward_mag: number;
  price_at_prediction: number;
  price_1h_later: number | null;
  price_change_pct: number | null;
  direction_correct: boolean | null;
  symbol: string;
  timeframe: string;
  report_data?: {
    summary: {
      total_oi_usd: number;
      close: number;
      funding_rate: number;
      high: number;
      low: number;
    };
    direction: {
      bias: string;
      upward_mag: number;
      downward_mag: number;
    };
    bins: Array<{
      bucket: string;
      usd: number;
      mid_price: number;
      intensity: number;
      status: string;
    }>;
    raw_liquidations?: Array<{
      price: number;
      usd: number;
      side: string;
      status: string;
      entry_time: number | null;
    }>;
    timestamp: number;
  };
}

export interface PredictionStats {
  total_predictions: number;
  completed: number;
  correct: number;
  accuracy_pct: number;
  avg_move_pct: number;
}

