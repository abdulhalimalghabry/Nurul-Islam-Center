import React from 'react';

interface CenterLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'default' | 'dark' | 'light' | 'plain';
  className?: string;
}

export const CENTER_LOGO_SRC = '/big%20logo.png';

export const CenterLogo: React.FC<CenterLogoProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-9 h-9 p-0.5 rounded-lg',
    sm: 'w-11 h-11 p-1 rounded-xl',
    md: 'w-13 h-13 p-1 rounded-2xl',
    lg: 'w-18 h-18 p-1.5 rounded-2xl',
    xl: 'w-24 h-24 p-2 rounded-3xl',
    hero: 'w-32 h-32 sm:w-40 sm:h-40 p-2.5 rounded-3xl',
  };

  const variantClasses = {
    default:
      'bg-white shadow-md border border-emerald-200/80 ring-2 ring-amber-400/20',
    light:
      'bg-white/95 backdrop-blur-sm shadow-lg border border-white/80 ring-2 ring-amber-300/40',
    dark:
      'bg-white/95 shadow-md border border-emerald-700/50 ring-2 ring-amber-400/30',
    plain: '',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <img
        src={CENTER_LOGO_SRC}
        alt="شعار مركز نور الإسلام"
        className="w-full h-full object-contain drop-shadow-2xs"
        loading="eager"
      />
    </div>
  );
};
