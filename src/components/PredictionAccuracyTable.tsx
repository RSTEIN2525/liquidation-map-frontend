import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import type { Prediction, PredictionStats } from '../types/predictions';

function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'up' | 'down' | 'neutral';
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide';
  const styles =
    variant === 'up'
      ? 'bg-green-500/15 text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-500/20'
      : variant === 'down'
        ? 'bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-500/20'
        : 'bg-purple-500/10 text-text-secondary ring-1 ring-inset ring-purple-500/15';

  return <span className={`${base} ${styles}`}>{children}</span>;
}

function ResultDot({ state }: { state: 'correct' | 'wrong' | 'pending' }) {
  const cls =
    state === 'correct'
      ? 'bg-green-500/90 ring-green-500/30'
      : state === 'wrong'
        ? 'bg-red-500/90 ring-red-500/30'
        : 'bg-amber-500/90 ring-amber-500/30';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ring-4 ${cls}`} />;
}

export function PredictionAccuracyTable() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    // Real-time subscription: Updates when new predictions arrive
    const subscription = supabase
      .channel('predictions')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'predictions',
        },
        () => {
          fetchData(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch predictions (last 50)
      const { data: predictionsData, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (predError) throw predError;
      setPredictions(predictionsData || []);

      // Fetch aggregated stats
      const { data: statsData, error: statsError } = await supabase
        .from('prediction_stats')
        .select('*')
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        // Ignore "not found" errors for stats view
        throw statsError;
      }
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-purple-500/20 bg-surface p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59C19.01 16.02 18.044 18 16.518 18H3.482c-1.526 0-2.492-1.98-1.743-3.31l6.518-11.59zM10 7a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">Couldn’t load predictions</div>
            <div className="mt-1 text-sm text-text-secondary">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Accuracy
          </h3>
          <div className="text-4xl font-semibold text-text-primary">
            {stats?.accuracy_pct?.toFixed(1) || '0.0'}%
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            {stats?.correct || 0} / {stats?.completed || 0} correct
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Total Predictions
          </h3>
          <div className="text-4xl font-semibold text-text-primary">
            {stats?.total_predictions || 0}
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            {stats?.completed || 0} completed, {(stats?.total_predictions || 0) - (stats?.completed || 0)} pending
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Avg Move
          </h3>
          <div className="text-4xl font-semibold text-text-primary">
            {stats?.avg_move_pct?.toFixed(2) || '0.00'}%
          </div>
          <div className="mt-2 text-xs text-text-secondary">per hour</div>
        </div>
      </div>

      {/* The Table */}
      <div className="bg-surface rounded-xl border border-purple-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-purple-500/10">
            <thead className="bg-purple-500/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Predicted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Magnets (↑/↓)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Price Then
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Actual Move
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                    <div className="text-sm text-text-secondary">No predictions yet.</div>
                    <div className="mt-1 text-xs text-text-tertiary">Once the backend writes rows to Supabase, they’ll appear here in real time.</div>
                  </td>
                </tr>
              ) : (
                predictions.map((pred) => (
                  <tr
                    key={pred.id}
                    className="hover:bg-purple-500/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {new Date(pred.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {pred.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={pred.bias === 'UP' ? 'up' : pred.bias === 'DOWN' ? 'down' : 'neutral'}>
                        {pred.bias}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <span className="tabular-nums">
                        <span className="text-text-secondary">↑</span> {Math.round(pred.upward_mag)}
                        <span className="mx-2 text-text-tertiary">·</span>
                        <span className="text-text-secondary">↓</span> {Math.round(pred.downward_mag)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      ${pred.price_at_prediction.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {pred.price_change_pct !== null ? (
                        <span
                          className={
                            pred.price_change_pct > 0
                              ? 'text-text-primary font-semibold'
                              : 'text-text-primary font-semibold'
                          }
                        >
                          <span className={pred.price_change_pct > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {pred.price_change_pct > 0 ? '+' : ''}
                            {pred.price_change_pct.toFixed(2)}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-text-tertiary">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <ResultDot
                          state={
                            pred.direction_correct === true
                              ? 'correct'
                              : pred.direction_correct === false
                                ? 'wrong'
                                : 'pending'
                          }
                        />
                        <span className="text-xs font-medium text-text-secondary">
                          {pred.direction_correct === true ? 'Correct' : pred.direction_correct === false ? 'Wrong' : 'Waiting'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

