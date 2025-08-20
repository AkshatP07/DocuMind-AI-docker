import React from 'react';
import { TriangleAlert } from 'lucide-react';

// This component presents a modern, visually enhanced modal dialog for file duplication.
// It uses Lucide-React for the warning icon and Tailwind CSS for all styling.
// The design is professional, responsive, and includes a subtle fade-in animation.

// Props:
// - fileName: The name of the file that already exists.
// - onChoice: A callback function that receives the user's choice ("overwrite", "keepboth", or "cancel").

export default function DuplicateModal({ fileName, onChoice }) {
  return (
    // Modal backdrop: Fixed position, full screen, semi-transparent overlay.
    // The backdrop uses a flexbox to center the modal content.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      
      {/* The modal card: The main container for the dialog content. */}
      {/* It has a subtle shadow, rounded corners, and a light background. */}
      {/* The 'animate-scale-in' class provides a smooth entry animation. */}
      <div className="w-full max-w-sm transform rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 ease-out animate-scale-in">
        
        {/* Warning Icon: A prominent icon at the top of the modal to draw attention. */}
        {/* The icon and heading are centered and colored for visual hierarchy. */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <TriangleAlert className="h-8 w-8 text-yellow-600" />
        </div>

        {/* Modal Heading: The main title of the dialog. */}
        <h4 className="mt-4 text-center text-xl font-bold text-gray-900">
          Duplicate File
        </h4>
        
        {/* Description: The body text explaining the situation. */}
        <p className="mt-2 text-center text-sm text-gray-600">
          A file named <span className="font-semibold text-gray-800">{fileName}</span> already exists.
        </p>

        <p className="mt-1 text-center text-sm text-gray-600">
          How would you like to proceed?
        </p>
        
        {/* Button Container: A flex column for the action buttons. */}
        <div className="mt-6 flex flex-col gap-3">
          
          {/* Overwrite Button: Styled as a primary, potentially destructive action (red). */}
          <button
            onClick={() => onChoice("overwrite")}
            className="w-full rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Overwrite Existing File
          </button>
          
          {/* Keep Both Button: Styled as a secondary, neutral option (blue). */}
          <button
            onClick={() => onChoice("keepboth")}
            className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Keep Both
          </button>
          
          {/* Cancel Button: Styled as a tertiary, text-based option to be less intrusive. */}
          <button
            onClick={() => onChoice("cancel")}
            className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Cancel
          </button>

        </div>
      </div>
    </div>
  );
}
