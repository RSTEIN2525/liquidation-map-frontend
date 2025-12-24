import { cn } from '../lib/utils';

export const TICKERS = [
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'SOL', label: 'Solana' },
  { value: 'BNB', label: 'BNB' },
  { value: 'XRP', label: 'XRP' },
  { value: 'DOGE', label: 'Dogecoin' },
  { value: 'ADA', label: 'Cardano' },
] as const;

export const LOOKBACK_OPTIONS = [
  { value: 0.5, label: '12 Hours' },
  { value: 1, label: '1 Day' },
  { value: 7, label: '1 Week' },
  { value: 30, label: '1 Month' },
] as const;

export const EXCHANGES = [
  { value: 'binance', label: 'Binance' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'okx', label: 'OKX' },
  { value: 'hyperliquid', label: 'Hyperliquid' },
  { value: 'mexc', label: 'MEXC' },
  { value: 'krakenfutures', label: 'Kraken Futures' },
  { value: 'kucoinfutures', label: 'KuCoin Futures' },
  { value: 'gateio', label: 'Gate.io' },
  { value: 'bitget', label: 'Bitget' },
  { value: 'deribit', label: 'Deribit' },
] as const;

interface FilterControlsProps {
  ticker: string;
  lookbackDays: number;
  exchanges: string[];
  onTickerChange: (ticker: string) => void;
  onLookbackChange: (days: number) => void;
  onExchangesChange: (exchanges: string[]) => void;
  onApply: () => void;
  isLoading?: boolean;
}

export function FilterControls({
  ticker,
  lookbackDays,
  exchanges,
  onTickerChange,
  onLookbackChange,
  onExchangesChange,
  onApply,
  isLoading = false,
}: FilterControlsProps) {
  const toggleExchange = (exchange: string) => {
    if (exchanges.includes(exchange)) {
      onExchangesChange(exchanges.filter(e => e !== exchange));
    } else {
      onExchangesChange([...exchanges, exchange]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Configuration Title */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-1">Configuration</h2>
        <p className="text-xs text-text-tertiary">Customize your liquidation map view</p>
      </div>
      
      {/* Filters - Grow to fill space */}
      <div className="flex-1 flex flex-col space-y-8 min-h-0">
      {/* Ticker - Horizontal Scrolling Carousel */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-4 uppercase tracking-wider">
          Ticker
        </label>
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
          <div className="flex gap-6 min-w-max">
            {TICKERS.map((t) => {
              const isSelected = ticker === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => onTickerChange(t.value)}
                  className={cn(
                    'group relative px-2 py-2 text-sm font-medium transition-all duration-300',
                    'hover:scale-105 hover:-translate-y-0.5',
                    isSelected
                      ? 'text-purple-500 dark:text-purple-400'
                      : 'text-text-secondary hover:text-purple-400 dark:hover:text-purple-300'
                  )}
                >
                  <span className="relative z-10">{t.value}</span>
                  {isSelected && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 dark:bg-purple-400 origin-center"
                      style={{
                        animation: 'underlineExpand 0.3s ease-out',
                      }}
                    />
                  )}
                  {!isSelected && (
                    <span
                      className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-purple-300 dark:bg-purple-500 origin-center transition-all duration-300 opacity-0 scale-x-0 group-hover:left-0 group-hover:right-0 group-hover:opacity-100 group-hover:scale-x-110"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lookback - Horizontal Scrolling Carousel */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-4 uppercase tracking-wider">
          Lookback Period
        </label>
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
          <div className="flex gap-6 min-w-max">
            {LOOKBACK_OPTIONS.map((option) => {
              const isSelected = lookbackDays === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onLookbackChange(option.value)}
                  className={cn(
                    'group relative px-2 py-2 text-sm font-medium transition-all duration-300',
                    'hover:scale-105 hover:-translate-y-0.5',
                    isSelected
                      ? 'text-purple-500 dark:text-purple-400'
                      : 'text-text-secondary hover:text-purple-400 dark:hover:text-purple-300'
                  )}
                >
                  <span className="relative z-10">{option.label}</span>
                  {isSelected && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 dark:bg-purple-400 origin-center"
                      style={{
                        animation: 'underlineExpand 0.3s ease-out',
                      }}
                    />
                  )}
                  {!isSelected && (
                    <span
                      className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-purple-300 dark:bg-purple-500 origin-center transition-all duration-300 opacity-0 scale-x-0 group-hover:left-0 group-hover:right-0 group-hover:opacity-100 group-hover:scale-x-110"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exchanges - Multi-line Selection */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-4 uppercase tracking-wider">
          Exchanges
        </label>
        <div className="flex flex-wrap gap-2">
          {EXCHANGES.map((exchange) => {
            const isSelected = exchanges.includes(exchange.value);
            return (
              <button
                key={exchange.value}
                onClick={() => toggleExchange(exchange.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                  'hover:scale-105 border',
                  'min-w-fit', // Prevent width changes
                  isSelected
                    ? 'bg-purple-500 dark:bg-purple-400 text-white border-transparent'
                    : 'bg-bg border-border text-text-secondary hover:text-text-primary hover:border-purple-400 dark:hover:border-purple-500'
                )}
              >
                {exchange.label}
              </button>
            );
          })}
        </div>
      </div>

      </div>
      
      {/* Apply Button - Pushed to bottom to align with chart */}
      <div className="mt-auto pt-8">
        <button
          onClick={onApply}
          disabled={isLoading || exchanges.length === 0}
          className={cn(
            'w-full px-4 py-3 rounded-md text-sm font-medium transition-all duration-300',
            'bg-purple-500 dark:bg-purple-400 text-white hover:bg-purple-600 dark:hover:bg-purple-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:scale-[1.02] active:scale-[0.98]'
          )}
        >
          {isLoading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
}

