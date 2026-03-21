"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface ATSResult {
  overall_score: number;
  grade: string;
  summary: string;
  keyword_analysis: {
    score: number;
    matched_keywords: string[];
    missing_keywords: string[];
    keyword_density: string;
  };
  format_analysis: {
    score: number;
    issues: string[];
    strengths: string[];
  };
  section_analysis: {
    has_contact_info: boolean;
    has_summary: boolean;
    has_experience: boolean;
    has_education: boolean;
    has_skills: boolean;
    missing_sections: string[];
  };
  experience_match: {
    score: number;
    years_found: number;
    years_required: number;
    assessment: string;
  };
  improvements: Array<{
    priority: string;
    category: string;
    issue: string;
    fix: string;
  }>;
  quick_wins: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getGradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: "#10B981",
    B: "#4F9EF8",
    C: "#F59E0B",
    D: "#F97316",
    F: "#EF4444",
  };
  return map[grade] || "#8892A4";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent — ATS Ready";
  if (score >= 75) return "Good — Minor fixes needed";
  if (score >= 60) return "Average — Improvements needed";
  if (score >= 40) return "Below Average — Major fixes needed";
  return "Poor — Significant rewrite needed";
}

function getPriorityColor(priority: string): string {
  if (priority === "high") return "#EF4444";
  if (priority === "medium") return "#F59E0B";
  return "#4F9EF8";
}

function getPriorityBg(priority: string): string {
  if (priority === "high") return "rgba(239,68,68,0.08)";
  if (priority === "medium") return "rgba(245,158,11,0.08)";
  return "rgba(79,158,248,0.08)";
}

export default function ATSPage() {
  const router = useRouter();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"upload" | "results">("upload");
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [jdFileName, setJdFileName] = useState("");
  const [jdMode, setJdMode] = useState<"upload" | "paste">("upload");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState("");
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingJD, setIsDraggingJD] = useState(false);

  const parseFile = async (file: File, endpoint: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/parse/${endpoint}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.text || "";
  };

  const handleResumeFile = async (file: File) => {
    try {
      const text = await parseFile(file, "resume");
      setResumeText(text);
      setResumeFileName(file.name);
    } catch {
      setError("Failed to parse resume file.");
    }
  };

  const handleJDFile = async (file: File) => {
    try {
      const text = await parseFile(file, "job-description");
      setJdText(text);
      setJdFileName(file.name);
    } catch {
      setError("Failed to parse job description file.");
    }
  };

  const handleResumeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleResumeFile(file);
  };

  const handleJDInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleJDFile(file);
  };

  const handleResumeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingResume(false);
    const file = e.dataTransfer.files[0];
    if (file) handleResumeFile(file);
  }, []);

  const handleJDDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJD(false);
    const file = e.dataTransfer.files[0];
    if (file) handleJDFile(file);
  }, []);

  const handleCheck = async () => {
    if (!resumeText || !jdText) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/ats/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setResult(data.data);
        setView("results");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (e: any) {
      setError(
        e?.message?.includes("429")
          ? "Rate limit reached. Wait 30 seconds and try again."
          : "ATS check failed. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setView("upload");
    setResult(null);
    setResumeText("");
    setJdText("");
    setResumeFileName("");
    setJdFileName("");
    setError("");
  };

  const canCheck = resumeText.length > 0 && jdText.length > 0;

  if (view === "results" && result) {
    const gradeColor = getGradeColor(result.grade);
    const sortedImprovements = [...(result.improvements || [])].sort((a, b) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 2) - (order[b.priority] || 2);
    });

    const sectionScore = (() => {
      const s = result.section_analysis || {};
      const fields = [
        s.has_contact_info,
        s.has_summary,
        s.has_experience,
        s.has_education,
        s.has_skills,
      ];
      const trueCount = fields.filter(Boolean).length;
      return Math.round((trueCount / 5) * 100);
    })();

    return (
      <div className="min-h-screen bg-[#060810] text-[rgba(255,255,255,0.9)]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Back button */}
          <button
            onClick={resetAll}
            className="mb-8 text-sm text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.9)] transition-colors flex items-center gap-2"
          >
            ← Check Another Resume
          </button>

          {/* Score header */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-4">
              <div
                className="w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 mx-auto"
                style={{
                  borderColor: gradeColor,
                  boxShadow: `0 0 40px ${gradeColor}25`,
                }}
              >
                <span
                  className="text-5xl font-bold"
                  style={{
                    color: gradeColor,
                    fontFamily: "var(--font-syne, sans-serif)",
                  }}
                >
                  {result.overall_score}
                </span>
                <span className="text-xs text-[rgba(255,255,255,0.3)]">
                  / 100
                </span>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center absolute -top-1 -right-1 text-base font-bold"
                style={{
                  background: gradeColor,
                  color: "#060810",
                  fontFamily: "var(--font-syne, sans-serif)",
                }}
              >
                {result.grade}
              </div>
            </div>

            <h2
              className="text-xl font-bold text-[rgba(255,255,255,0.9)] mb-2"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              {getScoreLabel(result.overall_score)}
            </h2>
            <p className="text-sm text-[rgba(255,255,255,0.5)] max-w-md mx-auto leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* 4 sub-score cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              {
                label: "Keyword Match",
                score: result.keyword_analysis?.score || 0,
                icon: "🔍",
                color: "#4F9EF8",
              },
              {
                label: "Format & Structure",
                score: result.format_analysis?.score || 0,
                icon: "📋",
                color: "#7C3AED",
              },
              {
                label: "Experience Match",
                score: result.experience_match?.score || 0,
                icon: "💼",
                color: "#F59E0B",
              },
              {
                label: "Sections Complete",
                score: sectionScore,
                icon: "✅",
                color: "#10B981",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#161B27] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span>{item.icon}</span>
                  <span className="text-[10px] text-[rgba(255,255,255,0.4)] flex-1 leading-tight">
                    {item.label}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: item.color,
                      fontFamily: "var(--font-syne, sans-serif)",
                    }}
                  >
                    {Math.round(item.score)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: item.score + "%", background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Keyword analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Matched keywords */}
            <div className="bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.12)] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#10B981] mb-3 flex items-center gap-2">
                <span>✓</span>
                Matched Keywords
                <span className="ml-auto bg-[rgba(16,185,129,0.15)] px-2 py-0.5 rounded-full text-[10px]">
                  {result.keyword_analysis?.matched_keywords?.length || 0}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {(result.keyword_analysis?.matched_keywords || []).map(
                  (kw: string, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]"
                    >
                      {kw}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Missing keywords */}
            <div className="bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.12)] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#EF4444] mb-3 flex items-center gap-2">
                <span>✗</span>
                Missing Keywords
                <span className="ml-auto bg-[rgba(239,68,68,0.15)] px-2 py-0.5 rounded-full text-[10px]">
                  {result.keyword_analysis?.missing_keywords?.length || 0}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {(result.keyword_analysis?.missing_keywords || []).map(
                  (kw: string, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-1 rounded-full bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.2)]"
                    >
                      {kw}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Quick wins */}
          {(result.quick_wins?.length || 0) > 0 && (
            <div className="mb-6">
              <h3
                className="text-base font-bold text-[rgba(255,255,255,0.9)] mb-4"
                style={{ fontFamily: "var(--font-syne, sans-serif)" }}
              >
                ⚡ Quick Wins
              </h3>
              <div className="space-y-3">
                {result.quick_wins.map((win: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.1)] rounded-xl p-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">
                      {win}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {sortedImprovements.length > 0 && (
            <div className="mb-8">
              <h3
                className="text-base font-bold text-[rgba(255,255,255,0.9)] mb-4"
                style={{ fontFamily: "var(--font-syne, sans-serif)" }}
              >
                Specific Improvements
              </h3>
              <div className="space-y-3">
                {sortedImprovements.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      background: getPriorityBg(item.priority),
                      border: `1px solid rgba(255,255,255,0.05)`,
                      borderLeftWidth: "3px",
                      borderLeftColor: getPriorityColor(item.priority),
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.3)]">
                        {item.category}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color: getPriorityColor(item.priority),
                          background: getPriorityBg(item.priority),
                        }}
                      >
                        {item.priority} priority
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[rgba(255,255,255,0.9)] mb-1">
                      {item.issue}
                    </p>
                    <p className="text-xs text-[#4F9EF8] leading-relaxed">
                      → {item.fix}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetAll}
              className="px-5 py-2.5 rounded-[10px] text-sm font-medium bg-transparent border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.9)] hover:border-[rgba(255,255,255,0.2)] transition-all"
            >
              Check Another Resume
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all"
              style={{
                background: "linear-gradient(135deg, #4F9EF8, #7C3AED)",
                color: "#060810",
              }}
            >
              Go to Learning Pathway →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060810] text-[rgba(255,255,255,0.9)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block mb-4 text-[10px] uppercase tracking-[0.1em] bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)] px-3 py-1 rounded-full">
            New Feature
          </span>
          <h1
            className="text-4xl font-bold mb-4"
            style={{
              fontFamily: "var(--font-syne, sans-serif)",
              fontWeight: 800,
              background: "linear-gradient(135deg, #4F9EF8, #7C3AED, #F59E0B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ATS Resume Checker
          </h1>
          <p
            className="text-base text-[rgba(255,255,255,0.5)] max-w-lg mx-auto leading-relaxed mb-6"
            style={{ fontWeight: 300 }}
          >
            See how your resume performs against Applicant Tracking Systems
            before you apply. Get a score and specific fixes instantly.
          </p>
          <div className="inline-block bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] rounded-xl px-5 py-3">
            <p className="text-xs text-[#F59E0B]">
              💡 75% of resumes are rejected by ATS before a human reads them.
              Don&apos;t let yours be one of them.
            </p>
          </div>
        </div>

        {/* Upload zones */}
        <div className="space-y-4 mb-6">
          {/* Resume upload */}
          <div
            onClick={() => resumeInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDraggingResume(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingResume(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleResumeDrop}
            className={`rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
              isDraggingResume
                ? "border-[#4F9EF8] bg-[rgba(79,158,248,0.05)]"
                : resumeText
                ? "border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.03)]"
                : "border-[rgba(255,255,255,0.08)] bg-[#0D1117] hover:border-[rgba(79,158,248,0.3)]"
            }`}
          >
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleResumeInputChange}
            />
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">{resumeText ? "✅" : "📄"}</span>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                {resumeText ? resumeFileName : "Upload Your Resume"}
              </p>
              <p className="text-xs text-[rgba(255,255,255,0.3)]">
                {resumeText
                  ? "Parsed successfully — ready to analyze"
                  : "PDF or DOCX — drag and drop or click"}
              </p>
            </div>
          </div>

          {/* JD section */}
          <div>
            <div className="flex gap-2 mb-3">
              {(["upload", "paste"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setJdMode(mode)}
                  className={`text-xs px-4 py-2 rounded-lg transition-all capitalize ${
                    jdMode === mode
                      ? "bg-[#4F9EF8] text-[#060810] font-semibold"
                      : "bg-[#161B27] text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]"
                  }`}
                >
                  {mode === "upload" ? "Upload JD" : "Paste JD"}
                </button>
              ))}
            </div>

            {jdMode === "upload" ? (
              <div
                onClick={() => jdInputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingJD(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingJD(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleJDDrop}
                className={`rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
                  isDraggingJD
                    ? "border-[#7C3AED] bg-[rgba(124,58,237,0.05)]"
                    : jdText
                    ? "border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.03)]"
                    : "border-[rgba(255,255,255,0.08)] bg-[#0D1117] hover:border-[rgba(124,58,237,0.3)]"
                }`}
              >
                <input
                  ref={jdInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleJDInputChange}
                />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">{jdText ? "✅" : "💼"}</span>
                  <p className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                    {jdText ? jdFileName : "Upload Job Description"}
                  </p>
                  <p className="text-xs text-[rgba(255,255,255,0.3)]">
                    {jdText ? "Parsed successfully" : "PDF or DOCX"}
                  </p>
                </div>
              </div>
            ) : (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 text-sm text-[rgba(255,255,255,0.8)] placeholder-[rgba(255,255,255,0.2)] resize-none h-36 focus:outline-none focus:border-[rgba(79,158,248,0.3)] transition-colors"
              />
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Check button */}
        <button
          onClick={handleCheck}
          disabled={!canCheck || loading}
          className="w-full h-[52px] rounded-[10px] text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background:
              canCheck && !loading
                ? "linear-gradient(135deg, #F59E0B, #EF4444)"
                : "rgba(255,255,255,0.05)",
            color:
              canCheck && !loading ? "#060810" : "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-syne, sans-serif)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-4 h-4 rounded-full border-2 border-[rgba(6,8,16,0.3)] border-t-[rgba(6,8,16,0.9)] animate-spin" />
              Analyzing ATS Compatibility...
            </span>
          ) : (
            "Check ATS Score →"
          )}
        </button>

        <p className="text-center text-[11px] text-[rgba(255,255,255,0.2)] mt-4">
          Analysis takes 15-30 seconds
        </p>
      </div>
    </div>
  );
}
