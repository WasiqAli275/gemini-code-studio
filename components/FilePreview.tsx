import React from 'react';
import { Icons } from './Icon';
import { Attachment } from '../types';

interface FilePreviewProps {
  attachment: Attachment;
  onRemove: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ attachment, onRemove }) => {
  const isImage = attachment.type.startsWith('image/');
  
  return (
    <div className="relative group flex items-center gap-3 p-2 pr-8 bg-gray-800 rounded-lg border border-gray-700 max-w-[200px] hover:border-blue-500 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-700 text-gray-300">
        {isImage ? (
          <img 
            src={attachment.content} 
            alt="Preview" 
            className="w-full h-full object-cover rounded" 
          />
        ) : (
          <Icons.FileCode size={16} />
        )}
      </div>
      
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-200 truncate">
          {attachment.name}
        </p>
        <p className="text-[10px] text-gray-400 truncate">
          {isImage ? 'Image' : 'Code/Text'}
        </p>
      </div>

      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 bg-gray-700 rounded-full text-gray-400 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
      >
        <Icons.Close size={12} />
      </button>
    </div>
  );
};
