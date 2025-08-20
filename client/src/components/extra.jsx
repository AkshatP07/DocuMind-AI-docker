import React from "react";
import { PanelRight } from "lucide-react";

const RightSidebar = ({ isOpen, onToggle, content }) => {
  return (
    <div
      className={`
        fixed top-4 right-4 h-[93%]
        transition-all duration-500 ease-in-out transform
        ${isOpen ? "translate-x-0 opacity-100 w-80" : "translate-x-full opacity-0 w-0"}
        z-50
        relative p-[2px] rounded-2xl
        before:content-[''] before:absolute before:inset-0 before:rounded-2xl
        before:bg-[linear-gradient(to_right,theme(colors.green.400),theme(colors.red.500),theme(colors.purple.500),theme(colors.pink.500))]
        before:blur-md before:animate-pulse
      `}
    >
      {/* Inner container on top of neon border */}
      <div className="relative h-full w-full rounded-2xl bg-gray-950 p-4">
        
        {/* Close button (mobile only) */}
        <div className="md:hidden flex justify-start mb-4">
          <button
            onClick={onToggle}
            className="p-2 text-gray-300 rounded-md hover:bg-gray-800"
          >
            <PanelRight size={24} />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-100">
            Right Sidebar
          </h3>
          <p className="text-sm text-gray-400">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
