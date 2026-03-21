"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { useRouter } from "next/navigation";
import axios from "axios";

const ROLE_TEMPLATES = [
  {
    label: "Software Engineer",
    icon: "💻",
    jd: "Senior Software Engineer position requiring Python, Java, Docker, Kubernetes, AWS, CI/CD, System Design, Microservices, REST API Design, SQL"
  },
  {
    label: "Data Scientist", 
    icon: "📊",
    jd: "Data Scientist position requiring Machine Learning, Deep Learning, Python, Statistics, Data Visualization, NLP, SQL, TensorFlow, Feature Engineering"
  },
  {
    label: "DevOps Engineer",
    icon: "⚙️", 
    jd: "DevOps Engineer position requiring Docker, Kubernetes, AWS, CI/CD, Linux, Terraform, Ansible, Monitoring, Python scripting, Cloud Security"
  },
  {
    label: "Product Manager",
    icon: "🎯",
    jd: "Product Manager position requiring Product Management, Agile Methodology, Business Communication, Data Analysis, UX Design, Financial Management, Team Leadership, Project Management"
  },
  {
    label: "Data Analyst",
    icon: "📈",
    jd: "Data Analyst position requiring SQL, Data Analysis, Data Visualization, Microsoft Excel, Statistics, Python, Tableau, Business Communication, Database Design"
  },
  {
    label: "Cloud Architect",
    icon: "☁️",
    jd: "Cloud Architect position requiring AWS Advanced, Azure, Google Cloud Platform, Docker, Kubernetes, Cloud Security, Networking, DevOps, System Design, Microservices"
  }
];

const ANALYSIS_STEPS = [
  { id: 1, text: "Parsing your resume...", duration: 1000 },
  { id: 2, text: "Extracting skills from resume...", duration: 1500 },
  { id: 3, text: "Analyzing job description...", duration: 1000 },
  { id: 4, text: "Computing skill gaps...", duration: 2000 },
  { id: 5, text: "Building learning pathway...", duration: 1500 },
  { id: 6, text: "Generating AI reasoning...", duration: 1000 },
  { id: 7, text: "Finalizing your roadmap...", duration: 500 },
];

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
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [jdFileName, setJdFileName] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");
  const [jdText, setJdText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  const [toastMessage, setToastMessage] = useState<string>("");
  const [clickedTemplate, setClickedTemplate] = useState<string>("");

  const router = useRouter();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleDemo1 = () => {
    setResumeText("John Smith - Software Engineer\nSkills: Python (3 years), JavaScript (2 years), React (2 years), \nSQL (2 years), Git, REST APIs, HTML/CSS\nExperience: Built e-commerce web application, automated data pipelines,\ndeveloped REST APIs for mobile applications\nEducation: B.E. Computer Science, CGPA 8.5\nProjects: Student management system, weather app, chat application");
    setJdText("Senior Software Engineer - Job Description\nRequired Skills: Python, Java, Machine Learning, Docker, Kubernetes,\nAWS, CI/CD pipelines, System Design, Microservices Architecture,\nREST API Design, SQL Advanced\nPreferred: Azure, GCP, Terraform, Redis\nExperience: 3+ years in backend development\nRole involves designing scalable distributed systems");
    setResumeFileName("sample_swe_resume.txt");
    setJdFileName("sample_swe_jd.txt");
    showToast("Sample SWE profile loaded! Click Analyze to continue.");
  };

  const handleDemo2 = () => {
    setResumeText("Maria Garcia - Operations Worker\nSkills: Basic computer use, Microsoft Excel (basic), \nCustomer service (3 years), Physical inventory counting,\nCash register operation, Team communication\nExperience: Retail cashier 2 years, General store assistant 1 year,\nHelped with stock taking and shelf arrangement\nEducation: High School Diploma");
    setJdText("Warehouse Operations Supervisor - Job Description\nRequired Skills: Inventory Management, Supply Chain Management,\nTeam Leadership, Safety Protocols, Forklift Operation,\nERP Systems, Quality Management, Microsoft Excel Advanced\nPreferred: Six Sigma certification, SAP experience\nExperience: 2+ years in warehouse or logistics environment\nRole involves supervising a team of 10 warehouse staff");
    setResumeFileName("sample_warehouse_resume.txt");
    setJdFileName("sample_warehouse_jd.txt");
    showToast("Sample Warehouse profile loaded! Click Analyze to continue.");
  };

  const handleRoleTemplate = (label: string, jd: string) => {
    setJdText(jd);
    setJdFileName(label + "_jd.txt");
    setClickedTemplate(label);
    showToast(label + " template loaded!");
  };

  const onResumeDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setResumeFile(file);
    setResumeFileName(file.name);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/parse/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeText(res.data.text);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to parse resume.");
      setResumeFile(null);
      setResumeFileName("");
      setResumeText("");
    }
  }, []);

  const onJdDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setJdFile(file);
    setJdFileName(file.name);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/parse/job-description", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setJdText(res.data.text);
      setClickedTemplate("");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to parse job description.");
      setJdFile(null);
      setJdFileName("");
      setJdText("");
    }
  }, []);

  const dropzoneOptions: DropzoneOptions = {
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
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

  useEffect(() => {
    if (loading) {
      let currentIdx = 0;
      setCompletedSteps([]);
      setCurrentStep(ANALYSIS_STEPS[0].id);

      const runSteps = () => {
        if (currentIdx >= ANALYSIS_STEPS.length) return;
        const idx = currentIdx;
        
        setTimeout(() => {
          setCompletedSteps(prev => [...prev, ANALYSIS_STEPS[idx].id]);
          currentIdx++;
          if (currentIdx < ANALYSIS_STEPS.length) {
            setCurrentStep(ANALYSIS_STEPS[currentIdx].id);
            runSteps();
          }
        }, ANALYSIS_STEPS[idx].duration);
      };

      runSteps();
    }
  }, [loading]);

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

      localStorage.setItem("pathway_data", JSON.stringify(res.data));
      router.push(res.data.session_id ? `/roadmap?session=${res.data.session_id}` : "/roadmap");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to analyze data.");
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
    <div className="min-h-screen bg-[#060810] text-[var(--text-primary)] p-6 flex flex-col items-center justify-center font-[var(--font-dm-sans)] tracking-wide relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#4F9EF8]/[0.06] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#7C3AED]/[0.06] blur-[120px]" />
      </div>
      {/* Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10B981]/90 text-white px-5 py-3 rounded-xl shadow-lg transition-transform animate-slide-in-right backdrop-blur-sm">
          {toastMessage}
        </div>
      )}

      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-8 fade-up">
          <h1 className="text-4xl md:text-5xl font-[var(--font-syne)] font-extrabold mb-4 tracking-tight gradient-text">
            AI-Adaptive Onboarding
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Upload your resume and the target job description to generate a
            personalized learning roadmap.
          </p>
        </div>

        {/* Demo Section */}
        <div className="mb-8 fade-up fade-up-delay-1">
          <h3 className="text-[var(--text-muted)] text-sm text-center mb-4">Or try with a sample profile</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleDemo1}
              className="card-premium px-5 py-3 text-sm flex items-center justify-center gap-2 hover:border-[#4F9EF8]/30 transition-all"
            >
              🧑‍💻 Software Engineer Demo
            </button>
            <button
              onClick={handleDemo2}
              className="card-premium px-5 py-3 text-sm flex items-center justify-center gap-2 hover:border-[#4F9EF8]/30 transition-all"
            >
              🏭 Warehouse Operations Demo
            </button>
          </div>
        </div>

        {/* Role Templates Section */}
        <div className="mb-10 max-w-3xl mx-auto fade-up fade-up-delay-2">
          <h3 className="text-[var(--text-muted)] text-sm text-center mb-3">Quick Role Templates</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ROLE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => handleRoleTemplate(tpl.label, tpl.jd)}
                className={`
                  card-premium p-3 text-center flex flex-col items-center
                  ${clickedTemplate === tpl.label ? "!border-[#4F9EF8] !bg-[#4F9EF8]/10" : ""} 
                  hover:border-[#4F9EF8]/40
                `}
              >
                <div className="text-2xl">{tpl.icon}</div>
                <div className="text-xs text-[var(--text-secondary)] font-medium mt-1">{tpl.label}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400">
            <AlertCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="card-premium p-6 w-full animate-slide-up shimmer">
            <h2 className="font-[var(--font-syne)] font-bold text-lg mb-6">Analyzing your profile...</h2>
            <div className="space-y-4">
              {ANALYSIS_STEPS.map((step) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = currentStep === step.id;
                return (
                  <div key={step.id} className="flex items-center gap-4">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircleIcon className="w-4 h-4 text-green-400" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-[#2E86AB]/20 flex items-center justify-center flex-shrink-0">
                        <SpinnerIcon className="w-4 h-4 text-[#2E86AB]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center flex-shrink-0"></div>
                    )}
                    <span
                      className={`text-sm ${
                        isCompleted
                          ? "text-gray-400 line-through"
                          : isCurrent
                          ? "text-white font-medium flex items-center"
                          : "text-gray-600"
                      }`}
                    >
                      {step.text}
                      {isCurrent && (
                        <span className="flex">
                          <span className="animate-bounce mx-[1px]">.</span>
                          <span className="animate-bounce delay-100 mx-[1px]">.</span>
                          <span className="animate-bounce delay-200 mx-[1px]">.</span>
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <div className="bg-gray-700/30 rounded-full h-2 w-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#2E86AB] to-green-400 h-full transition-all duration-500"
                  style={{ width: `${(completedSteps.length / ANALYSIS_STEPS.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 fade-up fade-up-delay-3">
              {/* Resume Upload Zone */}
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-[var(--font-syne)] font-bold flex items-center gap-3">
                  <span className="bg-gradient-to-br from-[#4F9EF8] to-[#7C3AED] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    1
                  </span>
                  Resume
                </h2>
                <div
                  {...getResumeRootProps()}
                  className={`
                    card-premium relative group flex flex-col items-center justify-center p-8 
                    border-2 border-dashed min-h-[250px] cursor-pointer transition-all duration-300
                    ${
                      isResumeDragActive
                        ? "!border-[#4F9EF8] !bg-[#4F9EF8]/10 scale-[1.02]"
                        : "border-[var(--border-default)] hover:border-[#4F9EF8]/50"
                    }
                  `}
                >
                  <input {...getResumeInputProps()} />
                  {resumeFileName ? (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                        <CheckCircleIcon className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-200 line-clamp-1 break-all">
                          {resumeFileName}
                        </p>
                        {resumeFile && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatFileSize(resumeFile.size)}
                          </p>
                        )}
                      </div>
                      {resumeText && (
                        <span className="text-xs font-medium px-3 py-1 bg-green-500/20 text-green-400 rounded-full mt-2">
                          Ready
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
                <h2 className="text-xl font-[var(--font-syne)] font-bold flex items-center gap-3">
                  <span className="bg-gradient-to-br from-[#7C3AED] to-[#4F9EF8] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    2
                  </span>
                  Job Description
                </h2>
                <div
                  {...getJDRootProps()}
                  className={`
                    card-premium relative group flex flex-col items-center justify-center p-8 
                    border-2 border-dashed min-h-[250px] cursor-pointer transition-all duration-300
                    ${
                      isJDDragActive
                        ? "!border-[#7C3AED] !bg-[#7C3AED]/10 scale-[1.02]"
                        : "border-[var(--border-default)] hover:border-[#7C3AED]/50"
                    }
                  `}
                >
                  <input {...getJDInputProps()} />
                  {jdFileName ? (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                        <CheckCircleIcon className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-200 line-clamp-1 break-all">
                          {jdFileName}
                        </p>
                        {jdFile && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatFileSize(jdFile.size)}
                          </p>
                        )}
                      </div>
                      {jdText && (
                        <span className="text-xs font-medium px-3 py-1 bg-green-500/20 text-green-400 rounded-full mt-2">
                          Ready
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
                        or click to browse (.pdf, .docx)<br />or select a template above
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
                  className={`
                    flex items-center justify-center gap-3 px-8 py-4 
                    bg-gradient-to-r from-[#4F9EF8] to-[#7C3AED] hover:from-[#4F9EF8]/90 hover:to-[#7C3AED]/90
                    text-white text-lg font-[var(--font-syne)] font-bold 
                    rounded-xl transition-all duration-300 shadow-lg shadow-[#4F9EF8]/25
                    min-w-[280px] hover:scale-105 active:scale-95
                  `}
                >
                  Analyze & Build Roadmap
                </button>
              ) : (
                <div className="text-[var(--text-muted)] text-sm mt-4 tracking-wide">
                  Waiting for both text inputs to enable analysis...
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in-right {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
