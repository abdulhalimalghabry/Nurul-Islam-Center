import React from 'react';

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  bgGradient: string;
  textColor: string;
  subtext?: string;
  onClick?: () => void;
  active?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon,
  bgGradient,
  textColor,
  subtext,
  onClick,
  active,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 border bg-white shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${active ? 'ring-2 ring-emerald-600 border-emerald-600' : 'border-stone-200/80'}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${textColor}`}>{count}</span>
            {subtext && <span className="text-[11px] text-stone-400 font-medium">{subtext}</span>}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${bgGradient}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
