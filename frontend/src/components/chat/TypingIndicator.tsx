import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName = 'Someone' }) => {
  return (
    <div className="flex items-center space-x-2 text-xs text-blue-400 italic py-1 px-3 bg-slate-800/60 rounded-full w-fit animate-pulse">
      <span>{userName} is typing</span>
      <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
