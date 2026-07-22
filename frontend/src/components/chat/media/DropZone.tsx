import React, { useState, DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  children: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped, children }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesDropped(filesArray);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 flex flex-col h-full overflow-hidden"
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-blue-950/80 backdrop-blur-md border-4 border-dashed border-blue-400 rounded-3xl m-2 animate-in fade-in duration-150">
          <UploadCloud className="w-16 h-16 text-blue-400 animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-white">Drop files to share in chat</h3>
          <p className="text-xs text-blue-200 mt-1">Images, Videos, PDFs, Documents, ZIP Archives</p>
        </div>
      )}
      {children}
    </div>
  );
};
