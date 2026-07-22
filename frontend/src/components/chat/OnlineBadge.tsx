import React from 'react';

interface OnlineBadgeProps {
  online: boolean;
  className?: string;
}

export const OnlineBadge: React.FC<OnlineBadgeProps> = ({ online, className = '' }) => {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full border-2 border-slate-900 ${
        online ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-500'
      } ${className}`}
      title={online ? 'Online' : 'Offline'}
    />
  );
};
