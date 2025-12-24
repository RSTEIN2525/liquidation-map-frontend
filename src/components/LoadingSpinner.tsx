import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { useTheme } from '../lib/theme';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 128, className = '' }: LoadingSpinnerProps) {
  const { theme } = useTheme();
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    const animationFile = theme === 'dark' 
      ? '/assets/animations/loading_dark.json'
      : '/assets/animations/loading_light.json';
    
    fetch(animationFile)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load animation:', err));
  }, [theme]);

  if (!animationData) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: size, height: size }}
      />
    </div>
  );
}

