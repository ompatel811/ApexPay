import React from 'react';

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelectReaction, onClose }) => {
  return (
    <div className="flex items-center space-x-1 p-1.5 bg-slate-800 border border-slate-700/80 rounded-full shadow-xl backdrop-blur-md">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelectReaction(emoji);
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform duration-150 rounded-full hover:bg-slate-700"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
