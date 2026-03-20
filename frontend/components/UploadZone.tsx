"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface UploadZoneProps {
  label: string;
  onTextExtracted: (text: string) => void;
  endpoint: string;
}

export default function UploadZone({ label, onTextExtracted, endpoint }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Only .pdf and .docx files are accepted.");
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/parse/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      setFileName(file.name);
      onTextExtracted(data.text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const baseClasses =
    "relative flex flex-col items-center justify-center w-full min-h-[180px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 p-6";

  let stateClasses = "border-gray-600 bg-[#1A2035] hover:border-[#2E86AB] hover:bg-[#2E86AB]/5";
  if (isDragging) {
    stateClasses = "border-[#2E86AB] bg-[#2E86AB]/10 scale-[1.02]";
  } else if (fileName) {
    stateClasses = "border-green-500 bg-green-500/5 hover:border-[#2E86AB] hover:bg-[#2E86AB]/5";
  }

  return (
    <div
      className={`${baseClasses} ${stateClasses}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleChange}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2E86AB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Uploading...</p>
        </div>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-400 font-medium">{fileName}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-10 h-10 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-400">
            <span className="text-[#2E86AB] font-medium">Click to browse</span> or drag & drop
          </p>
          <p className="text-xs text-gray-500">{label} — .pdf or .docx only</p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
