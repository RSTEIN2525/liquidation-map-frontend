// Fetch historical price data from CoinGecko (CORS-friendly)
export interface Candlestick {
  time: number; // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Map CoinGecko IDs
const COINGECKO_IDS: { [key: string]: string } = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  XRP: 'ripple',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
};

export async function fetchHistoricalPrice(
  symbol: string,
  days: number = 1
): Promise<Candlestick[]> {
  try {
    const coinId = COINGECKO_IDS[symbol.toUpperCase()] || 'bitcoin';
    
    // CoinGecko OHLC endpoint (free, CORS-enabled)
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // CoinGecko returns: [timestamp_ms, open, high, low, close]
    return data.map((candle: number[]) => ({
      time: Math.floor(candle[0] / 1000), // Convert ms to seconds
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: 0, // CoinGecko OHLC doesn't include volume in free tier
    }));
  } catch (error) {
    console.error('Failed to fetch price data:', error);
    return [];
  }
}

