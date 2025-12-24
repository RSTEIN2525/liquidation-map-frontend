import { useState } from 'react';
import { useLiquidationMap } from '../lib/queries';
import { getCurrentPrice, transformToCrossSectional } from '../lib/schemas';
import { CrossSectionalChart } from '../components/charts/CrossSectionalChart';
import { FilterControls } from '../components/FilterControls';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { CustomMapParams } from '../lib/api';

export function CrossSectionalPage() {
  // Filter state
  const [ticker, setTicker] = useState('BTC');
  const [lookbackDays, setLookbackDays] = useState(1);
  const [exchanges, setExchanges] = useState(['binance', 'bybit', 'okx']);
  
  // Applied filters (only update on Apply button click)
  const [appliedParams, setAppliedParams] = useState<CustomMapParams>({
    ticker: 'BTC',
    lookbackDays: 1,
    exchanges: ['binance', 'bybit', 'okx'],
  });

  const { data, isLoading, isError, error } = useLiquidationMap(appliedParams);

  const handleApply = () => {
    setAppliedParams({
      ticker,
      lookbackDays,
      exchanges,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <LoadingSpinner size={128} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to Load Data</h3>
          <p className="text-text-secondary text-sm">{error?.message || 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const currentPrice = getCurrentPrice(data.summary);
  const crossSectionalData = transformToCrossSectional(data.bins, currentPrice);

  return (
    <div className="flex gap-12 h-full">
      {/* Left Sidebar - Filters (30%) */}
      <div className="w-[30%] flex-shrink-0 flex flex-col h-full">
        <FilterControls
          ticker={ticker}
          lookbackDays={lookbackDays}
          exchanges={exchanges}
          onTickerChange={setTicker}
          onLookbackChange={setLookbackDays}
          onExchangesChange={setExchanges}
          onApply={handleApply}
          isLoading={isLoading}
        />
      </div>

      {/* Right Side - Chart (70%) */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Header Info */}
        <div className="mb-6 pl-12">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-1">
                {appliedParams.ticker}USDT Liquidation Map
              </h2>
              <p className="text-sm text-text-secondary">
                Cross-sectional view of liquidation clusters
              </p>
            </div>
            
            {/* Stats - Right Side */}
            <div className="flex items-center gap-8 flex-shrink-0">
              {currentPrice && (
                <div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Current Price</div>
                  <div className="text-xl font-semibold text-text-primary">
                    ${currentPrice.toLocaleString()}
                  </div>
                </div>
              )}
              {data.summary.total_oi_usd && (
                <div>
                  <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Open Interest</div>
                  <div className="text-xl font-semibold text-text-primary">
                    ${(data.summary.total_oi_usd / 1e9).toFixed(2)}B
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Bias</div>
                <div className={`text-xl font-semibold ${
                  data.direction.bias === 'UP' ? 'text-green-500' :
                  data.direction.bias === 'DOWN' ? 'text-red-500' :
                  'text-text-secondary'
                }`}>
                  {data.direction.bias}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1">
          <CrossSectionalChart
            data={crossSectionalData}
            currentPrice={currentPrice}
            rawLiquidations={data.raw_liquidations}
          />
        </div>
      </div>
    </div>
  );
}


