import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'indigo' | 'green' | 'red' | 'yellow' | 'blue';
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  description,
  change,
  trend = 'neutral',
  color = 'indigo',
}: DashboardCardProps) {
  const borderColors = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40 focus:border-indigo-500/40',
    green: 'border-emerald-500/20 hover:border-emerald-500/40 focus:border-emerald-500/40',
    red: 'border-rose-500/20 hover:border-rose-500/40 focus:border-rose-500/40',
    yellow: 'border-amber-500/20 hover:border-amber-500/40 focus:border-amber-500/40',
    blue: 'border-sky-500/20 hover:border-sky-500/40 focus:border-sky-500/40',
  };

  const bgGradients = {
    indigo: 'from-indigo-600/5 to-indigo-600/0',
    green: 'from-emerald-600/5 to-emerald-600/0',
    red: 'from-rose-600/5 to-rose-600/0',
    yellow: 'from-amber-600/5 to-amber-600/0',
    blue: 'from-sky-600/5 to-sky-600/0',
  };

  const iconColors = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-rose-500/10 text-rose-400',
    yellow: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-sky-500/10 text-sky-400',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-300 ${borderColors[color]} bg-gradient-to-br ${bgGradients[color]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-400">{title}</span>
        <div className={`rounded-lg p-2 ${iconColors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-50">{value}</h3>
      </div>

      {description && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{description}</span>
          {change && (
            <span
              className={`font-semibold ${
                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
