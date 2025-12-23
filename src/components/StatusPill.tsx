import { cn } from '../lib/utils';

interface StatusPillProps {
  status: 'initializing' | 'ready' | 'error' | 'stale';
  message?: string;
}

export function StatusPill({ status, message }: StatusPillProps) {
  const styles = {
    initializing: {
      bg: 'bg-blue-500/10 dark:bg-blue-400/10',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500 dark:bg-blue-400',
    },
    ready: {
      bg: 'bg-green-500/10 dark:bg-green-400/10',
      text: 'text-green-700 dark:text-green-300',
      dot: 'bg-green-500 dark:bg-green-400',
    },
    error: {
      bg: 'bg-red-500/10 dark:bg-red-400/10',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500 dark:bg-red-400',
    },
    stale: {
      bg: 'bg-amber-500/10 dark:bg-amber-400/10',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
  };

  const style = styles[status];
  const labels = {
    initializing: 'Initializing',
    ready: 'Ready',
    error: 'Error',
    stale: 'Stale',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        style.bg,
        style.text
      )}
      title={message}
    >
      <div
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          style.dot,
          status === 'initializing' && 'animate-pulse'
        )}
      />
      <span>{labels[status]}</span>
    </div>
  );
}

