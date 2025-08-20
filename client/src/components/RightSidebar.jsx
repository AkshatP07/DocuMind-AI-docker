import React, { useEffect, useState, useRef } from "react";
import { PanelRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Loader } from "lucide-react";

const RightSidebar = ({ 
  isOpen, onToggle, content, activate, selectedPdf, setContent, viewerRef, istrained, setSelectedPdf, selectedText, setActivate, insightData, setInsightData 
}) => {
  const prevSelectedText = useRef("");
  const [relevantData, setRelevantData] = useState([]);

  useEffect(() => {
    console.log("is model trained?", istrained);
  }, [istrained]);

  useEffect(() => {
    setActivate(false);
  }, [selectedText]);

  useEffect(() => {
    console.log("is activated?", activate);
  }, [activate]);

useEffect(() => {
  const fetchData = async () => {
    try {
      prevSelectedText.current = selectedText;
      setRelevantData([]);
      setInsightData(null);
      console.log('Querry extraction starts')

      const relevantRes = await axios.get("/relevant/search", {
        params: {
          query: selectedText,
          k: 15,
          context: 1,
        },
      });
      console.log("Querry extraction done");
      setRelevantData(relevantRes.data.results);
      console.log(relevantRes.data.results)

      const prompt = `
You are an assistant that analyzes PDF content uploaded by the user. 
The user has selected the text: "${selectedText}". 
Here are the relevant sections from other PDFs: ${JSON.stringify(relevantRes.data.results)}.
Based exclusively on these relevant sections, produce a JSON object with the following keys:
{
  "text": {
    "selected_text": "...",
    "key_insights": "...",
    "did_you_know": "...",
    "counterpoints": "...",
    "connecting_the_dots": "..."
  }
}
Rules:
- Only use the relevant sections provided, do not pull generic internet info.
- Do not copy text verbatim; synthesize, simplify, and enrich the user's reading experience.
- Key insights: go beyond the literal text.
- Did you know: interesting info from relevant sections.
- Counterpoints: contradictory viewpoints in relevant sections.
- Connecting the dots: explain how the sections relate, with context, progression, and references to documents (no page numbers needed).
Respond strictly as JSON.
`;
      console.log('insight LLM calls started');

let insightRes;
const maxRetries = 2;

for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    insightRes = await axios.post("/v1/llm/generate", { prompt });
    break;
  } catch (err) {
    if (attempt === maxRetries) throw err;
    console.warn(`LLM call failed (attempt ${attempt + 1}), retrying...`);
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
}

      console.log('insight LLM calls done')

      let rawText = insightRes.data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/^```json\s*|\s*```$/g, '');

      let parsedData;
      try {
        parsedData = JSON.parse(rawText).text;
      } catch (e) {
        console.error("Failed to parse Gemini JSON:", e);
        parsedData = null;
      }

      setInsightData(parsedData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setActivate(false);
    }
  };

  if (activate && istrained && selectedText && selectedText !== prevSelectedText.current) {
    fetchData();
  }
}, [activate, selectedText, istrained, setActivate]);


  const getPreview = (text) => {
    if (!text) return "";
    const words = text.split(/\s+/).slice(0, 20).join(" ");
    return words + (text.split(/\s+/).length > 20 ? "..." : "");
  };

  return (
    <div
      className={`
        bg-gray-50 dark:bg-gray-950
        p-4 shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0 w-80" : "translate-x-full w-0 overflow-hidden"}
        flex-shrink-0
        fixed md:static inset-y-0 right-0 z-40
      `}
    >
      <div className="md:hidden flex justify-start mb-4">
        <button
          onClick={onToggle}
          className="p-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <PanelRight size={24} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 overflow-y-auto scrollbar-hide max-h-full">
          {(content === "relevant" || content === "insight") && (
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                {content === "relevant" ? (
                  <motion.h3
                    key="relevant-heading"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-semibold text-gray-800 dark:text-gray-100"
                  >
                    Relevant Sections
                  </motion.h3>
                ) : (
                  <motion.h3
                    key="insight-heading"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-semibold text-gray-800 dark:text-gray-100"
                  >
                    Insights & Connections
                  </motion.h3>
                )}
              </AnimatePresence>

              {/* Toggle Switch */}
              <div
                onClick={() =>
                  setContent(content === "relevant" ? "insight" : "relevant")
                }
                className="relative w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full cursor-pointer"
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 left-1 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-md"
                  animate={{ x: content === "insight" ? 24.5 : 0 }}
                />
              </div>
            </div>
          )}

          {!content && (
            <div className="flex flex-col justify-center items-center py-20 space-y-4 text-center">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
                Select & Explore
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                Select some text and choose an option from the action bar to see relevant sections and insights across your library.
              </p>
            </div>
          )}

          {/* RELEVANT CONTENT */}
          {content === "relevant" && (
            relevantData && istrained && relevantData.length > 0 ? (
              relevantData
                .filter(item => item.score > 0.35)
                .filter((item, idx, arr) => {
                  if (selectedPdf && item.doc_id === selectedPdf.file.name) {
                    const sameDocItems = arr.filter(x => x.doc_id === selectedPdf.file.name);
                    const indexInSame = sameDocItems.findIndex(x => x === item);
                    return indexInSame < 2;
                  }
                  return true;
                })
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-white dark:bg-gray-900 shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      if (!selectedPdf || selectedPdf.file.name !== item.doc_id) {
                        setSelectedPdf({
                          file: { name: item.doc_id },
                          url: `/uploads/${item.doc_id}`,
                        });
                        setTimeout(() => {
                          viewerRef.current?.gotoPage(item.page);
                        }, 800);
                      } else {
                        viewerRef.current?.gotoPage(item.page);
                      }
                    }}
                  >
                    <p className="text-sm font-semibold text-indigo-600">{item.doc_id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Page: {item.page}
                    </p>
                    <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                      {getPreview(item.paragraph_with_context)}
                    </p>
                  </div>
                ))
            ) : (
              <div className="flex flex-col justify-center items-center py-10 space-y-2">
                {!selectedText ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Select some text to see relevant sections across your library.
                  </p>
                ) : (
                  <>
                    <Loader className="animate-spin w-8 h-8 text-indigo-500" />
                    {!istrained && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center max-w-xs">
                        Training the model—just once! After this, all your queries will be lightning fast.
                      </p>
                    )}
                  </>
                )}
              </div>
            )
          )}

          {/* INSIGHT CONTENT */}
          {content === "insight" && (
            <div className="space-y-3">
              {insightData && istrained &&
                (insightData.key_insights ||
                insightData.did_you_know ||
                insightData.counterpoints ||
                (insightData.connecting_the_dots && insightData.connecting_the_dots.length > 0)) ? (
                <>
                  {insightData.key_insights && (
                    <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                      <p className="text-sm font-semibold text-indigo-600">Key Insight</p>
                      <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                        {insightData.key_insights}
                      </p>
                    </div>
                  )}

                  {insightData.did_you_know && (
                    <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                      <p className="text-sm font-semibold text-indigo-600">Did you know</p>
                      <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                        {insightData.did_you_know}
                      </p>
                    </div>
                  )}

                  {insightData.counterpoints && (
                    <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                      <p className="text-sm font-semibold text-indigo-600">Counterpoints</p>
                      <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                        {insightData.counterpoints}
                      </p>
                    </div>
                  )}

                  {insightData.connecting_the_dots && (
                    <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                      <p className="text-sm font-semibold text-indigo-600">Connecting the dots</p>
                      <ul className="list-disc list-inside text-sm mt-1 text-gray-700 dark:text-gray-300">
                        {Array.isArray(insightData.connecting_the_dots)
                          ? insightData.connecting_the_dots.map((item, idx) => <li key={idx}>{item}</li>)
                          : <li>{insightData.connecting_the_dots}</li>}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col justify-center items-center py-10 space-y-2">
                  {!selectedText ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                      Select some text to see insights and connections.
                    </p>
                  ) : (
                    <>
                      <div className="flex justify-center py-10 text-gray-500 dark:text-gray-400 space-x-1 text-xl">
                        <span>Thinking</span>
                        <span className="dot">.</span>
                        <span className="dot dot-2">.</span>
                        <span className="dot dot-3">.</span>
                      </div>
                      {!istrained && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center max-w-xs">
                          Training the model—just once! After this, all your queries will be lightning fast.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
