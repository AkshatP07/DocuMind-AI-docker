import React, { useState,useEffect,useRef } from 'react';
import { AlignJustify,  Library } from 'lucide-react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import AdobePdfViewer from './AdobePdfViewer';
import PdfDropzone from './PdfDropzone';
import ActionBar from './ActionBar';
import PodcastPlayer from './PodcastPlayer';

const MainComponent = () => {
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(false);
  const [isRightPaneOpen, setIsRightPaneOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedText, setSelectedText] = useState("");
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [rightPaneContent, setRightPaneContent] = useState(null); // "insight" | "relevant"
  const [showPodcast, setShowPodcast] = useState(false);
  const [activate, setActivate] = useState(false);
  const [activate2, setActivate2] = useState(false);
  const [insightData, setInsightData] = useState(null);
  const [istrained,setIstrained] = useState(false);
  const viewerRef = useRef(null);
  const [outlines, setOutlines] = useState([]); // array of outline items
    // key: filename, value: outline

// This useEffect hook handles fetching the initial list of files from the server
useEffect(() => {
  (async () => {
    try {
      const res = await fetch("/files");
      const data = await res.json();
      console.log("[INIT FILES]", data.files);

      const loaded = [];
      const allOutlines = [];

      for (let fname of data.files) {
        loaded.push({
          file: { name: fname },
          url: `/uploads/${fname}`,
        });

        try {
          // Request outline from backend for this file
          const procRes = await fetch(`/api/v1/extract-outline/?file_name=${fname}`);
          const procData = await procRes.json();

          // Make sure each outline item has the filename (doc_id)
          const fileOutline = (procData.data.outline || []).map(item => ({
            ...item,
            doc_id: fname
          }));
          console.log(fileOutline)
          allOutlines.push(...fileOutline);
        } catch (err) {
          console.error(`Error processing file ${fname}:`, err);
        }
      }
      setFiles(loaded);
      setOutlines(allOutlines); // now an array
    } catch (err) {
      console.error("Error fetching existing files:", err);
    }
  })();
}, []);


useEffect(() => {
  if (files.length === 0) return;
  setIstrained(false);

  const controller = new AbortController();
  const signal = controller.signal;

  let interval;

  const trainModel = async () => {
    try {
      console.log("[TRAINING STARTED] with files:", files.map(f => f.file.name));

      await fetch("/relevant/train", { method: "POST", signal });

      interval = setInterval(async () => {
        try {
          const res = await fetch("/relevant/train/status", { signal });
          const data = await res.json();
          console.log("[TRAINING STATUS]", data.status);

          if (data.status === "done") {
            setIstrained(true);
            clearInterval(interval);
          }

          if (data.status === "failed") {
            console.warn("[TRAINING FAILED] Retrying...");
            clearInterval(interval);
            setIstrained(false);
            setTimeout(() => trainModel(), 3000);
          }
        } catch (err) {
          if (err.name === "AbortError") return; // ignore abort
          console.error("Error checking training status:", err);
          clearInterval(interval);
        }
      }, 2000);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Training error:", err);
      setIstrained(false);
    }
  };

  trainModel();

  // Cleanup: abort ongoing requests and clear interval if files change
  return () => {
    controller.abort();
    if (interval) clearInterval(interval);
  };
}, [files]);



    useEffect(() => {
  console.log(
    "From MainComponent:",
    selectedText,
    "| isTextSelected:",
    isTextSelected ? "YES" : "NO"
  );
}, [selectedText, isTextSelected]);
  const toggleLeftPane = () => {
    setIsLeftPaneOpen(!isLeftPaneOpen);
    if (isRightPaneOpen) {
      setIsRightPaneOpen(false);
    }
  };
  const toggleRightPane = () => {
    setIsRightPaneOpen(!isRightPaneOpen);
    if (isLeftPaneOpen) {
      setIsLeftPaneOpen(false);
    }
  };
  const clearSelectedPdf = () => {
    setSelectedPdf(null);
  };
  const handleInsightClick = () => {
  if (!selectedText) return;
  if (rightPaneContent !== "insight" || !isRightPaneOpen) {
    setRightPaneContent("insight");
    setIsRightPaneOpen(true); 
  }
};

const handleRelevantClick = () => {
  if (!selectedText) return;
  if (rightPaneContent !== "relevant" || !isRightPaneOpen) {
    setRightPaneContent("relevant");
    setIsRightPaneOpen(true);
  }
};
const handlePodcastClick = () => {
  if (!selectedText) return;
  setShowPodcast(true);      // Show podcast player
  // setIsRightPaneOpen(false);  // Close right pane
};
  return (
    <div className="flex h-screen w-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      <LeftSidebar isOpen={isLeftPaneOpen} selectedPdf={selectedPdf} viewerRef={viewerRef} setSelectedPdf={setSelectedPdf} outlines={outlines} onToggle={toggleLeftPane} files={files} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Updated header for a professional, consistent look */}
        <div className="flex items-center justify-between p-4 shadow-xl border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Styled left pane toggle button */}
            <button
              onClick={toggleLeftPane}
              className="p-2 rounded-xl transition-all duration-300 transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <AlignJustify size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            {/* Consistent title styling */}
            <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
              DocuMind AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {selectedPdf && (
              <button
                onClick={() => {
                  clearSelectedPdf();
                  setIsLeftPaneOpen(false);
                  setIsRightPaneOpen(false);
                  setIsTextSelected(false); // reset selection state
                }} 
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105"
              >
                <Library size={20} className="mr-2" />
                Library
              </button>
            )}
            {/* Styled right pane toggle button */}
            <button
              onClick={toggleRightPane}
              className="p-2 rounded-xl transition-all duration-300 transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <AlignJustify size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 md:p-6 flex flex-col min-h-0">
  {!selectedPdf && (
    <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
      <PdfDropzone files={files} outlines={outlines} setOutlines={setOutlines} setFiles={setFiles} onPdfClick={setSelectedPdf} />
    </div>
  )}
{selectedPdf && (
  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
    <div className="flex-1 flex flex-col justify-end min-h-0">
      <AdobePdfViewer
        ref={viewerRef}
        file={selectedPdf}
        setSelectedText={setSelectedText}
        setIsTextSelected={setIsTextSelected}
        className="flex-1"
      />
    </div>
  </div>
)}
</div>
      </div>
      {isTextSelected && (<ActionBar selectedText={selectedText} setActivate2={setActivate2} setActivate={setActivate} showPodcast={showPodcast} onInsightClick={handleInsightClick} onRelevantClick={handleRelevantClick} onPodcastClick={handlePodcastClick}
/>)}
<RightSidebar
  selectedPdf={selectedPdf}
  viewerRef={viewerRef}
  setSelectedPdf={setSelectedPdf}
  activate={activate}
  istrained={istrained}
  isOpen={isRightPaneOpen}
  setContent={setRightPaneContent}
  setActivate={setActivate}
  onToggle={toggleRightPane}
  content={rightPaneContent}
  selectedText={selectedText}
  insightData={insightData}
  setInsightData={setInsightData}
  className={`fixed right-0 top-0 h-full transition-transform duration-300 ease-in-out
    ${isRightPaneOpen ? "translate-x-0" : "translate-x-full"}`}
/>
{showPodcast && (
  <PodcastPlayer selectedText={selectedText} activate2={activate2} setActivate2={setActivate2} insightData={insightData} onClose={() => setShowPodcast(false)} />
)}
    </div>
  );
};

export default MainComponent;