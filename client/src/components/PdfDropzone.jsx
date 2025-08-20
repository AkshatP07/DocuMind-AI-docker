import React, { useCallback, useEffect, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import DuplicateModal from "./DuplicateModal";
import PDFCard from "./ui/PDFCard";

export default function PdfDropzone({ files, setFiles, outlines,setOutlines, onPdfClick }) {
  const [duplicateFile, setDuplicateFile] = useState(null);
  const duplicateCallbackRef = useRef(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [newlyAdded, setNewlyAdded] = useState(new Set());

  // Use useEffect to handle newly added files for animation
  useEffect(() => {
    // Determine which files are new and add them to the newlyAdded set
    const currentFileNames = new Set(files.map(f => f.file.name));
    const newFiles = [...newlyAdded].filter(name => currentFileNames.has(name));
    setNewlyAdded(new Set(newFiles));
  }, [files]);

  function handleDuplicateChoice(file) {
    return new Promise((resolve) => {
      duplicateCallbackRef.current = resolve;
      setDuplicateFile(file);
    });
  }

  function handleModalChoice(choice) {
    if (duplicateCallbackRef.current) {
      duplicateCallbackRef.current(choice);
      duplicateCallbackRef.current = null;
    }
    setDuplicateFile(null);
  }

  const onDrop = useCallback(
    async (acceptedFiles) => {
      for (let file of acceptedFiles) {
        if (files.some((f) => f.file.name === file.name)) {
          console.log("[DUPLICATE DETECTED]", file.name);
          const action = await handleDuplicateChoice(file);
          if (action === "cancel") continue;
          if (action === "keepboth") {
            const extIndex = file.name.lastIndexOf(".");
            const base = extIndex !== -1 ? file.name.slice(0, extIndex) : file.name;
            const ext = extIndex !== -1 ? file.name.slice(extIndex) : "";
            file = new File([file], `${base}_copy${ext}`, { type: file.type });
          }
          if (action === "overwrite") {
            try {
              await fetch(`/delete/${file.name}`, { method: "DELETE" });
              setFiles(prev => prev.filter(f => f.file.name !== file.name));
              console.log(`[OVERWRITE] Deleted existing file: ${file.name}`);
            } catch (err) {
              console.error("Error deleting existing file before overwrite:", err);
              continue;
            }
          }
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          console.log("[UPLOAD RESPONSE]", data);

          if (data.error) {
            console.error(data.error);
          } else {
            // Set the state and trigger the new file animation
            setFiles((prev) => [
              ...prev,
              { file, url: `/uploads/${file.name}` },
            ]);
            setNewlyAdded(prev => new Set(prev).add(file.name));
            // After setFiles and setNewlyAdded
          try {
            const procRes = await fetch(
              `/api/v1/extract-outline/?file_name=${file.name}`
            );
            const procData = await procRes.json();

            const fileOutline = (procData.data.outline || []).map(item => ({
              ...item,
              doc_id: file.name
            }));

            setOutlines(prev => [...prev, ...fileOutline]);
          } catch (err) {
            console.error(`Error fetching outline for ${file.name}:`, err);
          }
          }
        } catch (err) {
          console.error("Upload error:", err);
        }
      }
    },
    [files]
  );

  const handleDelete = async (name) => {
    setDeletingFile(name);

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const res = await fetch(`/delete/${name}`, {
        method: "DELETE",
      });
      const data = await res.json();
      console.log("[DELETE RESPONSE]", data);

      if (data.error) {
        console.error(data.error);
      } else {
        setFiles(prev => prev.filter(f => f.file.name !== name));
        setOutlines(prev => prev.filter(o => o.doc_id !== name));
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingFile(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: true,
  });

  return (
    <div className="flex-grow flex flex-col items-center p-8 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 w-full font-sans">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 tracking-tight">
        Drop your PDFs here
      </h1>
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center w-full max-w-4xl p-8 mb-8 rounded-3xl border-4 border-dashed transition-all duration-300 ease-in-out cursor-pointer shadow-xl
          ${isDragActive ? "border-blue-600 bg-blue-100 dark:bg-gray-700" : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 transform hover:scale-[1.01]"}`}
      >
        <input {...getInputProps()} />
        <svg
          className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDragActive ? "text-blue-600" : "text-gray-400"}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        {isDragActive ? (
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Drop the files here...
          </p>
        ) : (
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium text-center">
            Drag and drop PDFs here, or <span className="text-blue-600 dark:text-blue-400 font-bold">click to select</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4 md:p-6">
        {files.map((file, idx) => {
          const isNewlyAdded = newlyAdded.has(file.file.name);
          const isDeleting = deletingFile === file.file.name;

          return (
            <div
              key={file.file.name}
              className={`transition-all duration-300 ease-in-out transform ${
                isDeleting ? "opacity-0 scale-75" : "opacity-100 scale-100"
              } ${
                isNewlyAdded ? "animate-stack-in" : ""
              }`}
            >
              <PDFCard
                file={file}
                onPdfClick={onPdfClick}
                onDelete={handleDelete}
              />
            </div>
          );
        })}
      </div>
      
      {duplicateFile && (
        <DuplicateModal
          fileName={duplicateFile.name}
          onChoice={handleModalChoice}
        />
      )}
      {/* Tailwind CSS keyframes for stacking animation */}
      <style jsx>{`
        @keyframes stack-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-stack-in {
          animation: stack-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}