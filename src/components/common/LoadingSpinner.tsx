import React from 'react';
import { CenterLogo } from './CenterLogo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'جاري التحميل...',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 space-y-4 ${className}`}>
      {size !== 'sm' && (
        <div className="animate-pulse">
          <CenterLogo size={size === 'lg' ? 'lg' : 'md'} />
        </div>
      )}
      <div
        className={`${sizeMap[size]} border-emerald-200 border-t-emerald-700 rounded-full animate-spin`}
      />
      {text && <p className="text-sm font-medium text-stone-600 animate-pulse">{text}</p>}
    </div>
  );
};
