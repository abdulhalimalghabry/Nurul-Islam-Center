import React from 'react';

interface BrochureRibbonTitleProps {
  children: React.ReactNode;
  variant?: 'yellow' | 'lightGreen' | 'darkGreen';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Curved ornamental ribbon banner inspired by the official Nurul Islam Center Moyale brochure
 */
export const BrochureRibbonTitle: React.FC<BrochureRibbonTitleProps> = ({
  children,
  variant = 'yellow',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    yellow:
      'bg-gradient-to-r from-[#facc15] via-[#fde047] to-[#eab308] text-stone-950 border-[#ca8a04]/40 shadow-md shadow-amber-950/10',
    lightGreen:
      'bg-gradient-to-r from-[#4ade80] via-[#65e035] to-[#22c55e] text-stone-950 border-emerald-700/30 shadow-md shadow-emerald-950/10',
    darkGreen:
      'bg-gradient-to-r from-[#14532d] via-[#166534] to-[#15803d] text-[#fde047] border-[#facc15]/40 shadow-md',
  };

  const sizeStyles = {
    sm: 'px-5 py-1.5 text-sm rounded-tl-2xl rounded-br-2xl rounded-tr-md rounded-bl-md',
    md: 'px-7 py-2.5 text-base sm:text-lg rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg',
    lg: 'px-9 py-3 text-lg sm:text-xl rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg',
  };

  return (
    <div
      className={`inline-flex items-center justify-center font-black tracking-tight border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </div>
  );
};

interface DiamondDividerProps {
  variant?: 'yellow' | 'green' | 'white';
  className?: string;
}

/**
 * Three-diamond tapered geometric divider inspired by the official brochure
 */
export const DiamondDivider: React.FC<DiamondDividerProps> = ({
  variant = 'yellow',
  className = '',
}) => {
  const colorMap = {
    yellow: {
      lineFrom: 'from-transparent via-[#facc15] to-[#facc15]',
      lineTo: 'from-[#facc15] via-[#facc15] to-transparent',
      diamond: 'bg-[#facc15]',
    },
    green: {
      lineFrom: 'from-transparent via-[#15803d] to-[#15803d]',
      lineTo: 'from-[#15803d] via-[#15803d] to-transparent',
      diamond: 'bg-[#15803d]',
    },
    white: {
      lineFrom: 'from-transparent via-white/90 to-white/90',
      lineTo: 'from-white/90 via-white/90 to-transparent',
      diamond: 'bg-white',
    },
  };

  const c = colorMap[variant];

  return (
    <div className={`flex items-center justify-center gap-2 py-2 select-none ${className}`} aria-hidden="true">
      <div className={`h-[2px] w-16 sm:w-28 bg-gradient-to-l ${c.lineFrom} rounded-full`} />
      <span className={`w-2 h-2 rotate-45 ${c.diamond} inline-block shrink-0`} />
      <span className={`w-3.5 h-3.5 rotate-45 ${c.diamond} inline-block shrink-0 shadow-xs`} />
      <span className={`w-2 h-2 rotate-45 ${c.diamond} inline-block shrink-0`} />
      <div className={`h-[2px] w-16 sm:w-28 bg-gradient-to-l ${c.lineTo} rounded-full`} />
    </div>
  );
};
