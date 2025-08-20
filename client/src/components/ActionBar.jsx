import React, { useState } from "react";
import { Lightbulb, File, AudioLines } from "lucide-react";

export default function ActionBar({
  selectedText,
  onInsightClick,
  onRelevantClick,
  onPodcastClick,
  showPodcast,
  setActivate,
  setActivate2
}) {
  const [hovered, setHovered] = useState(null);

  if (!selectedText) {
    // Return null to ensure no component is rendered
    return null;
  }

  const handlePodcastClick = () => {
    // Call the original prop function as well
    if (onPodcastClick) {
      onPodcastClick();
    }
    setActivate(true);
    setActivate2(true);
  };

  const actionBarClass = `
    fixed left-1/2 -translate-x-1/2
    bg-white dark:bg-gray-800
    p-2 shadow-xl rounded-full
    flex items-center space-x-2
    border border-gray-200 dark:border-gray-700
    transition-all duration-300 transform-gpu
    hover:scale-105
    ${showPodcast ? "bottom-25" : "bottom-8"}
    `;
  return (
    <div className={actionBarClass}>
      <button
        onClick={() => {
              onInsightClick();
              setActivate(true);
            }}
        onMouseEnter={() => setHovered("insight")}
        onMouseLeave={() => setHovered(null)}
        className="flex items-center justify-center px-2 py-2 text-sm font-semibold rounded-full
          bg-blue-500 hover:bg-blue-600
          text-white transition-all duration-300 overflow-hidden group
          "
      >
        <Lightbulb className="w-5 h-5 flex-shrink-0" />
        <span
          className={`whitespace-nowrap transition-all duration-300 ease-in-out
            ${
              hovered === "insight"
                ? "w-16 opacity-100"
                : "w-0 opacity-0 group-hover:w-16 group-hover:opacity-100 group-hover:ml-2"
            }`}
        >
          Insight
        </span>
      </button>
      <button
        onClick={() => {
              onRelevantClick();
              setActivate(true);
            }}
        onMouseEnter={() => setHovered("relevant")}
        onMouseLeave={() => setHovered(null)}
        className="flex items-center justify-center px-2 py-2 text-sm font-semibold rounded-full
          bg-green-500 hover:bg-green-600
          text-white transition-all duration-300 overflow-hidden group"
      >
        <File className="w-5 h-5 flex-shrink-0" />
        <span
          className={`whitespace-nowrap transition-all duration-300 ease-in-out
            ${
              hovered === "relevant"
                ? "w-16 opacity-100"
                : "w-0 opacity-0 group-hover:w-16 group-hover:opacity-100 group-hover:ml-2"
            }`}
        >
          Relevant
        </span>
      </button>
      <button
        onClick={handlePodcastClick}
        onMouseEnter={() => setHovered("podcast")}
        onMouseLeave={() => setHovered(null)}
        className="flex items-center justify-center px-2 py-2 text-sm font-semibold rounded-full
          bg-purple-500 hover:bg-purple-600
          text-white transition-all duration-300 overflow-hidden group"
      >
        <AudioLines className="w-5 h-5 flex-shrink-0" />
        <span
          className={`whitespace-nowrap transition-all duration-300 ease-in-out
            ${
              hovered === "podcast"
                ? "w-16 opacity-100 "
                : "w-0 opacity-0 group-hover:w-16 group-hover:opacity-100 group-hover:ml-2"
            }`}
        >
          Podcast
        </span>
      </button>
    </div>
  );
}