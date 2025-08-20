import React from 'react';
import { FileText, Trash2 } from 'lucide-react';

export default function PDFCard({ file, onPdfClick, onDelete }) {
  return (
    <div
      onClick={() => onPdfClick(file)}
      className="relative flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer group w-35 h-42"
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file.file.name);
        }}
        className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 text-red-500 dark:text-red-400 bg-gray-100 dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <Trash2 size={16} />
      </button>

      {/* PDF Icon - a simple, professional SVG */}
      <div className="flex-grow flex items-center justify-center">
        <FileText
          size={56}
          className="text-blue-500 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      
      {/* File name with text overflow handling */}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center w-full truncate px-2 mt-4">
        {file.file.name}
      </p>
    </div>
  );
}