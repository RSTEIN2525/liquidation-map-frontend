import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/theme';

interface StatusPillProps {
  status: 'initializing' | 'ready' | 'error' | 'stale';
  message?: string;
}

export function StatusPill({ status, message }: StatusPillProps) {
  const { theme } = useTheme();
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    if (status === 'initializing') {
      const animationFile = theme === 'dark' 
        ? '/assets/animations/loading_dark.json'
        : '/assets/animations/loading_light.json';
      
      fetch(animationFile)
        .then((res) => res.json())
        .then((data) => setAnimationData(data))
        .catch((err) => console.error('Failed to load animation:', err));
    }
  }, [status, theme]);

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
        if (!animationData) {
          return (
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          );
        }
        return (
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: 16, height: 16 }}
          />
        );
      case 'ready':
        return (
          <svg
            className="w-4 h-4 text-purple-500 dark:text-purple-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-4 h-4 text-red-500 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'stale':
        return (
          <svg
            className="w-4 h-4 text-amber-500 dark:text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className="cursor-help"
      title={message}
    >
      {getStatusIcon()}
    </div>
  );
}


