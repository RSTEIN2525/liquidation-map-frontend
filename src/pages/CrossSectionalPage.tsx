import { useLiquidationMap } from '../lib/queries';
import { getCurrentPrice, transformToCrossSectional } from '../lib/schemas';
import { CrossSectionalChart } from '../components/charts/CrossSectionalChart';

export function CrossSectionalPage() {
  const { data, isLoading, isError, error } = useLiquidationMap();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-4"></div>
          <p className="text-text-secondary">Loading liquidation data...</p>
        </div>
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
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Binance/BTCUSDT Liquidation Map
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Cross-sectional view of liquidation clusters
            </p>
          </div>
          <div className="flex items-center gap-6">
            {currentPrice && (
              <div>
                <div className="text-xs text-text-tertiary">Current Price</div>
                <div className="text-lg font-semibold text-text-primary">
                  ${currentPrice.toLocaleString()}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-text-tertiary">Bias</div>
              <div className={`text-lg font-semibold ${
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

      {/* Chart Card */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <CrossSectionalChart
          data={crossSectionalData}
          currentPrice={currentPrice}
        />
      </div>
    </div>
  );
}

