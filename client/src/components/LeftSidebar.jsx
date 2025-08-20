import React, { useEffect } from 'react';
import { PanelLeft } from 'lucide-react';

const LeftSidebar = ({ isOpen, outlines, selectedPdf, setSelectedPdf, viewerRef, onToggle }) => {
  // Filter outlines for the selected PDF
  const pdfOutlines = selectedPdf
    ? outlines.filter(item => item.doc_id === selectedPdf.file.name)
    : [];

  useEffect(() => {
    if (selectedPdf) {
      console.log(`Outlines for ${selectedPdf.file.name}:`, pdfOutlines);
    }
  }, [selectedPdf, outlines]);

  // Function to get font size and padding based on level
  const getStyle = (level) => {
    switch (level) {
      case 'H1': return 'text-md font-bold pl-0';
      case 'H2': return 'text-sm font-semibold pl-4';
      case 'H3': return 'text-sm pl-8';
      default: return 'text-sm pl-0';
    }
  };
  return (
    <div
      className={`
        bg-gray-50 dark:bg-gray-950
        p-4 shadow-lg
        transform transition-all duration-300 ease-in-out scrollbar-hide
        ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0 overflow-hidden'}
        flex-shrink-0 
        fixed md:static inset-y-0 left-0 z-40
      `}
    >
      <div className="md:hidden flex justify-end mb-4">
        <button
          onClick={onToggle}
          className="p-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <PanelLeft size={24} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 h-full flex flex-col">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-3">
            Document Outline
          </h3>

          <div className="overflow-y-auto scrollbar-hide flex-1">
            {selectedPdf ? (
              pdfOutlines.length > 0 ? (
                <ul className="space-y-1">
                  {pdfOutlines.map((item, idx) => (
                    <li
                      key={idx}
                      className={`
                        cursor-pointer rounded-md transition-colors
                        hover:bg-gray-200/50 dark:hover:bg-gray-800/50
                      `}
                      onClick={() => {
                        viewerRef.current?.gotoPage(item.page);
                      }}
                    >
                      <div className={`py-2 px-3 ${getStyle(item.level)}`}>
                        <p className="font-medium text-gray-800 dark:text-gray-200 leading-tight">
                          {item.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Page: {item.page}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex justify-center items-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
                  No outlines available for this PDF.
                </div>
              )
            ) : (
              <div className="flex justify-center items-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
                Select a PDF to view its outlines.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;