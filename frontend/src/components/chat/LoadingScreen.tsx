import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
      <span className="text-sm font-medium">Loading ApexPay Messages...</span>
    </div>
  );
};
