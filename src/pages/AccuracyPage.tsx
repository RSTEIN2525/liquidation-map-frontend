import { PredictionAccuracyTable } from '../components/PredictionAccuracyTable';

export function AccuracyPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary mb-2">
            Prediction Accuracy
          </h1>
          <p className="text-text-secondary">
            Live audit trail of bias predictions and their outcomes.
          </p>
        </div>
      </div>

      <PredictionAccuracyTable />
    </div>
  );
}

