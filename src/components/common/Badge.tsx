import React from 'react';
import { ApplicationStatus } from '../../types';
import { getStatusDetails } from '../../utils/helpers';
import { CheckCircle2, Clock, FileEdit, Send, XCircle, AlertCircle, Info } from 'lucide-react';

interface BadgeProps {
  status?: ApplicationStatus;
  label?: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'blue' | 'stone' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<{ status: ApplicationStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  const details = getStatusDetails(status);

  const getIcon = () => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="w-3.5 h-3.5 ml-1 inline shrink-0" />;
      case 'under_review':
        return <Clock className="w-3.5 h-3.5 ml-1 inline shrink-0" />;
      case 'draft':
        return <FileEdit className="w-3.5 h-3.5 ml-1 inline shrink-0" />;
      case 'submitted':
        return <Send className="w-3.5 h-3.5 ml-1 inline shrink-0" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5 ml-1 inline shrink-0" />;
      case 'needs_correction':
        return <AlertCircle className="w-3.5 h-3.5 ml-1 inline shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 ml-1 inline shrink-0" />;
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${details.bg} ${details.text} ${details.border} ${sizeClasses}`}
    >
      {getIcon()}
      <span>{details.label}</span>
    </span>
  );
};

export const CustomBadge: React.FC<BadgeProps> = ({
  label,
  variant = 'emerald',
  size = 'sm',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    amber: 'bg-amber-50 text-amber-800 border-amber-300',
    rose: 'bg-rose-50 text-rose-800 border-rose-300',
    blue: 'bg-blue-50 text-blue-800 border-blue-300',
    stone: 'bg-stone-100 text-stone-800 border-stone-300',
    orange: 'bg-orange-50 text-orange-800 border-orange-300',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${variantStyles[variant]} ${sizeClasses}`}
    >
      {label}
    </span>
  );
};
