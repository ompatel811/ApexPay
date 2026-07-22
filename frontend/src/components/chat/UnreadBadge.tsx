import React from 'react';

interface UnreadBadgeProps {
  count: number;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
};
