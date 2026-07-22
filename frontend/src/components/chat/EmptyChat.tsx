import React from 'react';
import { MessageSquare } from 'lucide-react';

export const EmptyChat: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-950">
      <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/5">
        <MessageSquare className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">Select a Conversation</h3>
      <p className="text-sm text-slate-400 max-w-sm">
        Choose a contact or search for users to start instant real-time messaging on ApexPay.
      </p>
    </div>
  );
};
