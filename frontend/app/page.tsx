"use client";

import React, { useState, useCallback } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { useRouter } from "next/navigation";
import axios from "axios";

// Icons (Inlined to avoid missing dependencies)
const UploadIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileTextIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SpinnerIcon = ({ className = "w-6 h-6" }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function UploadPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [jdText, setJdText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();

  const onResumeDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setResumeFile(file);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/parse/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeText(res.data.text);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || "Failed to parse resume."
      );
      setResumeFile(null);
      setResumeText("");
    }
  }, []);

  const onJdDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setJdFile(file);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/parse/job-description", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setJdText(res.data.text);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to parse job description."
      );
      setJdFile(null);
      setJdText("");
    }
  }, []);

  const dropzoneOptions: DropzoneOptions = {
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
      ],
    },
    maxFiles: 1,
  };

  const {
    getRootProps: getResumeRootProps,
    getInputProps: getResumeInputProps,
    isDragActive: isResumeDragActive,
  } = useDropzone({ ...dropzoneOptions, onDrop: onResumeDrop });

  const {
    getRootProps: getJDRootProps,
    getInputProps: getJDInputProps,
    isDragActive: isJDDragActive,
  } = useDropzone({ ...dropzoneOptions, onDrop: onJdDrop });

  const handleAnalyze = async () => {
    if (!resumeText || !jdText) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/pathway/analyze", {
        resume_text: resumeText,
        jd_text: jdText,
        max_hours: 120,
      });

      localStorage.setItem("roadmap", JSON.stringify(res.data));
      router.push("/roadmap");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || "Failed to analyze data."
      );
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            AI-Adaptive Onboarding
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your resume and the target job description to generate a
            personalized learning roadmap.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Resume Upload Zone */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              <span className="bg-[#2E86AB] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                1
              </span>
              Resume
            </h2>
            <div
              {...getResumeRootProps()}
              className={`
                relative group flex flex-col items-center justify-center p-8 
                border-2 border-dashed rounded-2xl transition-all duration-300
                bg-[#1A2035] min-h-[250px] cursor-pointer
                ${
                  isResumeDragActive
                    ? "border-[#2E86AB] bg-[#2E86AB]/10 scale-[1.02]"
                    : "border-gray-600 hover:border-[#2E86AB] hover:bg-[#1A2035]/80"
                }
              `}
            >
              <input {...getResumeInputProps()} />
              {resumeFile ? (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <CheckCircleIcon className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-200 line-clamp-1 break-all">
                      {resumeFile.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatFileSize(resumeFile.size)}
                    </p>
                  </div>
                  {resumeText && (
                    <span className="text-xs font-medium px-3 py-1 bg-green-500/20 text-green-400 rounded-full mt-2">
                      Parsed Successfully
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-[#2E86AB]/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadIcon className="w-8 h-8 text-[#2E86AB]" />
                  </div>
                  <p className="text-lg font-medium mb-1">
                    Drop your resume here
                  </p>
                  <p className="text-sm text-gray-400">
                    or click to browse (.pdf, .docx)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Job Description Upload Zone */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-3">
              <span className="bg-[#2E86AB] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                2
              </span>
              Job Description
            </h2>
            <div
              {...getJDRootProps()}
              className={`
                relative group flex flex-col items-center justify-center p-8 
                border-2 border-dashed rounded-2xl transition-all duration-300
                bg-[#1A2035] min-h-[250px] cursor-pointer
                ${
                  isJDDragActive
                    ? "border-[#2E86AB] bg-[#2E86AB]/10 scale-[1.02]"
                    : "border-gray-600 hover:border-[#2E86AB] hover:bg-[#1A2035]/80"
                }
              `}
            >
              <input {...getJDInputProps()} />
              {jdFile ? (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <CheckCircleIcon className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-200 line-clamp-1 break-all">
                      {jdFile.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatFileSize(jdFile.size)}
                    </p>
                  </div>
                  {jdText && (
                    <span className="text-xs font-medium px-3 py-1 bg-green-500/20 text-green-400 rounded-full mt-2">
                      Parsed Successfully
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-[#2E86AB]/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileTextIcon className="w-8 h-8 text-[#2E86AB]" />
                  </div>
                  <p className="text-lg font-medium mb-1">
                    Drop the JD here
                  </p>
                  <p className="text-sm text-gray-400">
                    or click to browse (.pdf, .docx)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analyze Action */}
        <div className="flex justify-center h-20 items-center">
          {resumeText && jdText ? (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`
                flex items-center justify-center gap-3 px-8 py-4 
                bg-[#2E86AB] hover:bg-[#236e8e] text-white text-lg font-semibold 
                rounded-xl transition-all duration-300 shadow-lg shadow-[#2E86AB]/25
                min-w-[280px]
                ${loading ? "opacity-70 cursor-not-allowed scale-95" : "hover:scale-105 active:scale-95"}
              `}
            >
              {loading ? (
                <>
                  <SpinnerIcon className="w-6 h-6" />
                  Analyzing Files...
                </>
              ) : (
                <>Analyze & Build Roadmap</>
              )}
            </button>
          ) : (
            <div className="text-gray-500 text-sm mt-4 tracking-wide">
              Waiting for both documents to enable analysis...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
