"use client";

import React, { useState, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResumeFile {
  file: File;
  name: string;
  text: string;
  status: "pending" | "parsed" | "error";
}

interface CandidateResult {
  name: string;
  matchScore: number;
  gapCount: number;
  totalHours: number;
  skillGaps: any[];
  pathway: any;
  resumeSkills: any[];
  reasoningTrace: string;
  status: "waiting" | "analyzing" | "done" | "error";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RecruiterPage() {
  const router = useRouter();

  // ── View state
  const [view, setView] = useState<"upload" | "processing" | "results">("upload");

  // ── Resume state
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // ── JD state
  const [jdText, setJdText] = useState("");
  const [jdSource, setJdSource] = useState<"upload" | "paste">("upload");
  const [jdDragActive, setJdDragActive] = useState(false);
  const jdInputRef = useRef<HTMLInputElement>(null);

  // ── Top-N state
  const [topN, setTopN] = useState(5);

  // ── Results state
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedGaps, setExpandedGaps] = useState<Record<number, boolean>>({});
  const [barWidths, setBarWidths] = useState<Record<number, number>>({});

  // ─── Confetti on results view ─────────────────────────────────────────────
  useEffect(() => {
    if (view === "results") {
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.4 },
          colors: ["#4F9EF8", "#7C3AED", "#10B981"],
        });
      }, 400);
    }
  }, [view]);

  // ─── Animate bar widths when results view mounts ──────────────────────────
  useEffect(() => {
    if (view === "results") {
      const ranked = getRankedResults();
      ranked.forEach((r, i) => {
        setTimeout(() => {
          setBarWidths((prev) => ({ ...prev, [i]: r.matchScore }));
        }, 100 + i * 80);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ─── Parse files (sequential) ─────────────────────────────────────────────
  const parseFiles = async (files: File[]) => {
    for (const file of files) {
      // Add as pending first
      const pendingEntry: ResumeFile = {
        file,
        name: file.name.replace(/\.(pdf|docx)$/i, ""),
        text: "",
        status: "pending",
      };
      setResumeFiles((prev) => [...prev, pendingEntry]);

      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/parse/resume`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        setResumeFiles((prev) =>
          prev.map((rf) =>
            rf.file === file
              ? { ...rf, text: data.text, status: "parsed" }
              : rf
          )
        );
      } catch {
        setResumeFiles((prev) =>
          prev.map((rf) =>
            rf.file === file ? { ...rf, status: "error" } : rf
          )
        );
      }
    }
  };

  // ─── Parse JD file ────────────────────────────────────────────────────────
  const parseJdFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/parse/job-description`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setJdText(data.text || "");
    } catch {
      // silent fail
    }
  };

  // ─── Resume drag handlers ─────────────────────────────────────────────────
  const handleResumeDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".pdf") || f.name.endsWith(".docx")
    );
    if (files.length) parseFiles(files);
  };

  const handleResumeInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) parseFiles(files);
    e.target.value = "";
  };

  // ─── JD drag handlers ────────────────────────────────────────────────────
  const handleJdDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setJdDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) parseJdFile(files[0]);
  };

  const handleJdInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseJdFile(file);
    e.target.value = "";
  };

  // ─── Core bulk analysis ───────────────────────────────────────────────────
  const startBulkAnalysis = async () => {
    const parsedFiles = resumeFiles.filter((f) => f.status === "parsed");
    const initial: CandidateResult[] = parsedFiles.map((f) => ({
      name: f.name,
      matchScore: 0,
      gapCount: 0,
      totalHours: 0,
      skillGaps: [],
      pathway: null,
      resumeSkills: [],
      reasoningTrace: "",
      status: "waiting",
    }));
    setResults(initial);
    setView("processing");

    for (let i = 0; i < parsedFiles.length; i++) {
      setCurrentIndex(i);
      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "analyzing" } : r))
      );

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/pathway/analyze`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resume_text: parsedFiles[i].text,
              jd_text: jdText,
            }),
          }
        );
        const data = await res.json();
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  matchScore: Math.round((data.match_score || 0) * 100),
                  gapCount: (data.skill_gaps || []).length,
                  totalHours: data.pathway?.total_estimated_hours || 0,
                  skillGaps: data.skill_gaps || [],
                  pathway: data.pathway,
                  resumeSkills: data.resume_skills || [],
                  reasoningTrace: data.reasoning_trace || "",
                  status: "done",
                }
              : r
          )
        );
        if (i < parsedFiles.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "error" } : r
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setTimeout(() => setView("results"), 800);
  };

  // ─── Download report ──────────────────────────────────────────────────────
  const downloadReport = (result: CandidateResult, rank: number) => {
    const report = [
      "CANDIDATE ANALYSIS REPORT",
      "==========================",
      `Candidate: ${result.name}`,
      `Rank: #${rank}`,
      `Match Score: ${result.matchScore}%`,
      `Skill Gaps: ${result.gapCount}`,
      `Training Hours Needed: ${result.totalHours}h`,
      "",
      "SKILL GAPS:",
      ...result.skillGaps.map(
        (g: any) =>
          `  • ${g.skill || g.catalog_skill} (severity: ${g.gap_severity || "N/A"})`
      ),
      "",
      "EXISTING SKILLS:",
      ...result.resumeSkills.map(
        (s: any) => `  • ${s.skill} (${s.level || "N/A"})`
      ),
      "",
      "AI REASONING:",
      result.reasoningTrace,
      "",
      "Generated by AI-Adaptive Onboarding Engine",
      `Date: ${new Date().toLocaleDateString()}`,
    ].join("\n");

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.name}_analysis_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Ranked results ───────────────────────────────────────────────────────
  const getRankedResults = () => {
    const done = results.filter((r) => r.status === "done");
    const sorted = [...done].sort((a, b) => b.matchScore - a.matchScore);
    return topN === 0 ? sorted : sorted.slice(0, topN);
  };

  // ─── Progress ─────────────────────────────────────────────────────────────
  const doneCount = results.filter(
    (r) => r.status === "done" || r.status === "error"
  ).length;
  const progressPercent =
    results.length > 0 ? Math.round((doneCount / results.length) * 100) : 0;

  const parsedCount = resumeFiles.filter((f) => f.status === "parsed").length;
  const canAnalyze = parsedCount > 0 && jdText.trim() !== "";

  // ─── Rank badge color helper ──────────────────────────────────────────────
  const getRankColor = (rank: number) => {
    if (rank === 1) return "#F59E0B";
    if (rank === 2) return "#94A3B8";
    if (rank === 3) return "#CD7F32";
    return "#4F9EF8";
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "rgba(245,158,11,0.15)";
    if (rank === 2) return "rgba(148,163,184,0.12)";
    if (rank === 3) return "rgba(205,127,50,0.12)";
    return "rgba(255,255,255,0.04)";
  };

  const getRankBorder = (rank: number) => {
    if (rank === 1) return "rgba(245,158,11,0.3)";
    if (rank === 2) return "rgba(148,163,184,0.2)";
    if (rank === 3) return "rgba(205,127,50,0.2)";
    return "rgba(255,255,255,0.06)";
  };

  const getBarGradient = (rank: number) =>
    rank === 1
      ? "linear-gradient(90deg, #F59E0B, #FCD34D)"
      : "linear-gradient(90deg, #4F9EF8, #7C3AED)";

  const getGapBadge = (count: number) => {
    if (count <= 5)
      return "bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]";
    if (count <= 10)
      return "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]";
    return "bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.2)]";
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: UPLOAD
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "upload") {
    return (
      <div className="min-h-screen bg-[#060810] text-[var(--text-primary)]">
        {/* Ambient Glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-60 -left-60 w-[600px] h-[600px] rounded-full bg-[#4F9EF8]/[0.05] blur-[140px]" />
          <div className="absolute -bottom-60 -right-60 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/[0.05] blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="mb-10 fade-up">
            <span className="inline-block text-[10px] uppercase tracking-[0.1em] bg-[rgba(79,158,248,0.1)] text-[#4F9EF8] border border-[rgba(79,158,248,0.15)] px-3 py-1 rounded-full mb-4">
              Recruiter Mode
            </span>
            <h1
              className="gradient-text font-extrabold mb-3 leading-tight"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: "clamp(28px, 4vw, 40px)",
              }}
            >
              Bulk Candidate Analysis
            </h1>
            <p
              className="text-[var(--text-secondary)] max-w-xl leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Upload multiple resumes at once. Our AI analyzes each candidate
              against your job description and ranks them automatically.
            </p>
          </div>

          {/* ── Resume Upload Zone ─────────────────────────────────────────── */}
          <div className="mb-8 fade-up fade-up-delay-1">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Candidate Resumes
              </h2>
              {resumeFiles.length > 0 && (
                <span className="text-xs text-[var(--text-muted)]">
                  {parsedCount} / {resumeFiles.length} ready
                </span>
              )}
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${
                dragActive
                  ? "border-[rgba(79,158,248,0.5)] bg-[rgba(79,158,248,0.04)]"
                  : "border-[rgba(255,255,255,0.08)] bg-[#0D1117] hover:border-[rgba(79,158,248,0.3)] hover:bg-[rgba(79,158,248,0.02)]"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleResumeDrop}
              onClick={() => resumeInputRef.current?.click()}
            >
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.docx"
                multiple
                className="hidden"
                onChange={handleResumeInput}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(79,158,248,0.08)] border border-[rgba(79,158,248,0.15)] flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-[#4F9EF8]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-medium text-sm mb-1">
                    Drop resumes here or{" "}
                    <span className="text-[#4F9EF8]">browse files</span>
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">
                    PDF or DOCX · Multiple files supported
                  </p>
                </div>
              </div>
            </div>

            {/* File list */}
            {resumeFiles.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {resumeFiles.map((rf, i) => (
                  <div
                    key={i}
                    className="bg-[#161B27] rounded-xl px-4 py-3 flex items-center gap-3 border border-[rgba(255,255,255,0.04)]"
                  >
                    {/* Doc icon */}
                    <svg
                      className="w-5 h-5 text-[#4F9EF8] flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {/* Name + size */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                        {rf.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {fmtBytes(rf.file.size)}
                      </p>
                    </div>
                    {/* Status badge */}
                    {rf.status === "parsed" && (
                      <span className="text-xs bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)] px-2.5 py-1 rounded-full flex-shrink-0">
                        ✓ Ready
                      </span>
                    )}
                    {rf.status === "error" && (
                      <span className="text-xs bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.2)] px-2.5 py-1 rounded-full flex-shrink-0">
                        ✗ Failed
                      </span>
                    )}
                    {rf.status === "pending" && (
                      <span className="text-xs text-[var(--text-muted)] shimmer px-2.5 py-1 rounded-full flex-shrink-0">
                        Parsing...
                      </span>
                    )}
                    {/* Remove */}
                    <button
                      onClick={() =>
                        setResumeFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="text-[var(--text-muted)] hover:text-[#EF4444] transition-colors ml-1 flex-shrink-0"
                      title="Remove"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add more */}
                <button
                  onClick={() => resumeInputRef.current?.click()}
                  className="mt-1 text-xs text-[var(--text-muted)] hover:text-[#4F9EF8] transition-colors border border-dashed border-[rgba(255,255,255,0.06)] hover:border-[rgba(79,158,248,0.3)] rounded-xl px-4 py-2.5 text-center"
                >
                  + Add More Resumes
                </button>
              </div>
            )}
          </div>

          {/* ── JD Section ────────────────────────────────────────────────── */}
          <div className="mb-8 fade-up fade-up-delay-2">
            <h2
              className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Job Description
            </h2>

            {/* Toggle */}
            <div className="flex gap-1 mb-4 bg-[#0D1117] rounded-xl p-1 w-fit border border-[rgba(255,255,255,0.06)]">
              {(["upload", "paste"] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setJdSource(src)}
                  className={`px-4 py-1.5 text-xs rounded-lg transition-all capitalize ${
                    jdSource === src
                      ? "bg-[#4F9EF8] text-[#060810] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {src === "upload" ? "Upload File" : "Paste Text"}
                </button>
              ))}
            </div>

            {jdSource === "upload" ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                  jdDragActive
                    ? "border-[rgba(79,158,248,0.5)] bg-[rgba(79,158,248,0.04)]"
                    : "border-[rgba(255,255,255,0.08)] bg-[#0D1117] hover:border-[rgba(79,158,248,0.3)] hover:bg-[rgba(79,158,248,0.02)]"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setJdDragActive(true);
                }}
                onDragLeave={() => setJdDragActive(false)}
                onDrop={handleJdDrop}
                onClick={() => jdInputRef.current?.click()}
              >
                <input
                  ref={jdInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleJdInput}
                />
                {jdText ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-[#10B981]">
                      ✓ Job description loaded
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      ({jdText.split(" ").length} words)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setJdText("");
                      }}
                      className="text-xs text-[var(--text-muted)] hover:text-[#EF4444] transition-colors"
                    >
                      ✗ Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-[var(--text-muted)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Drop job description or{" "}
                      <span className="text-[#4F9EF8]">browse</span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      PDF, DOCX, or TXT
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none h-36 focus:outline-none focus:border-[rgba(79,158,248,0.3)] transition-colors"
                placeholder="Paste job description here..."
              />
            )}
          </div>

          {/* ── Top N Selector ─────────────────────────────────────────────── */}
          <div className="mb-10 fade-up fade-up-delay-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-[var(--text-secondary)]">
                Show top candidates:
              </span>
              <div className="flex gap-2">
                {[3, 5, 10, 0].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopN(n)}
                    className={`px-4 py-2 text-sm rounded-lg transition-all ${
                      topN === n
                        ? "bg-[#4F9EF8] text-[#060810] font-semibold"
                        : "bg-[#161B27] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {n === 0 ? "All" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Analyze Button ─────────────────────────────────────────────── */}
          <div className="fade-up fade-up-delay-4">
            <button
              disabled={!canAnalyze}
              onClick={startBulkAnalysis}
              className={`w-full h-[52px] rounded-[10px] text-sm transition-all ${
                canAnalyze
                  ? "hover:opacity-90 shadow-lg shadow-[#4F9EF8]/20"
                  : "opacity-40 cursor-not-allowed"
              }`}
              style={{
                background: canAnalyze
                  ? "linear-gradient(135deg, #4F9EF8, #7C3AED)"
                  : "#161B27",
                color: canAnalyze ? "#060810" : "var(--text-muted)",
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
              }}
            >
              {parsedCount === 0
                ? "Upload resumes to begin"
                : `Analyze ${parsedCount} Candidate${parsedCount !== 1 ? "s" : ""} →`}
            </button>
            {parsedCount > 0 && !jdText.trim() && (
              <p className="text-xs text-[var(--text-muted)] text-center mt-2">
                Add a job description to enable analysis
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "processing") {
    return (
      <div className="min-h-screen bg-[#060810] text-[var(--text-primary)] flex items-start justify-center">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-60 -left-60 w-[600px] h-[600px] rounded-full bg-[#4F9EF8]/[0.05] blur-[140px]" />
          <div className="absolute -bottom-60 -right-60 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/[0.05] blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-2xl w-full mx-auto px-6 py-16 text-center">
          {/* Animated icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(79,158,248,0.08)] border border-[rgba(79,158,248,0.15)] flex items-center justify-center">
              <div
                className="w-8 h-8 rounded-full border-2 border-[#4F9EF8] border-t-transparent animate-spin"
                style={{ animationDuration: "0.9s" }}
              />
            </div>
          </div>

          <h1
            className="gradient-text text-3xl font-extrabold mb-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Analyzing Candidates...
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-8">
            AI is evaluating each resume against the job description
          </p>

          {/* Progress bar */}
          <div className="w-full bg-[#161B27] rounded-full h-2 mb-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: progressPercent + "%",
                background: "linear-gradient(90deg, #4F9EF8, #7C3AED)",
              }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-10">
            {doneCount} of {results.length} candidates analyzed
          </p>

          {/* Candidate list */}
          <div className="flex flex-col gap-3 text-left">
            {results.map((r, i) => (
              <div
                key={i}
                className="bg-[#161B27] rounded-xl px-5 py-4 flex items-center gap-4 border border-[rgba(255,255,255,0.04)] transition-all"
              >
                {/* Status icon */}
                {r.status === "waiting" && (
                  <div className="w-8 h-8 rounded-full bg-[#0D1117] border border-[rgba(255,255,255,0.06)] flex-shrink-0" />
                )}
                {r.status === "analyzing" && (
                  <div
                    className="w-8 h-8 rounded-full border-2 border-[#4F9EF8] border-t-transparent animate-spin flex-shrink-0"
                    style={{ animationDuration: "0.9s" }}
                  />
                )}
                {r.status === "done" && (
                  <div className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center text-[#10B981] text-sm font-bold flex-shrink-0">
                    ✓
                  </div>
                )}
                {r.status === "error" && (
                  <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center text-[#EF4444] text-sm flex-shrink-0">
                    ✗
                  </div>
                )}

                {/* Name */}
                <span className="text-sm font-medium text-[var(--text-primary)] flex-1 truncate">
                  {r.name}
                </span>

                {/* Right status */}
                {r.status === "waiting" && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Waiting...
                  </span>
                )}
                {r.status === "analyzing" && (
                  <span className="text-xs text-[#4F9EF8] flex items-center gap-1">
                    Analyzing
                    <span className="inline-flex gap-0.5">
                      <span
                        className="w-1 h-1 rounded-full bg-[#4F9EF8] animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-[#4F9EF8] animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1 h-1 rounded-full bg-[#4F9EF8] animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  </span>
                )}
                {r.status === "done" && (
                  <span className="text-xs bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)] px-2.5 py-0.5 rounded-full">
                    {r.matchScore}% match
                  </span>
                )}
                {r.status === "error" && (
                  <span className="text-xs text-[#EF4444]">Failed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 3: RESULTS
  // ═══════════════════════════════════════════════════════════════════════════
  const rankedResults = getRankedResults();
  const totalDone = results.filter((r) => r.status === "done").length;
  const avgScore =
    rankedResults.length > 0
      ? Math.round(
          rankedResults.reduce((a, b) => a + b.matchScore, 0) /
            rankedResults.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#060810] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[600px] h-[600px] rounded-full bg-[#4F9EF8]/[0.05] blur-[140px]" />
        <div className="absolute -bottom-60 -right-60 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/[0.05] blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 fade-up">
          <button
            onClick={() => {
              setView("upload");
              setResumeFiles([]);
              setResults([]);
              setJdText("");
            }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 flex items-center gap-1"
          >
            ← New Analysis
          </button>
          <h1
            className="gradient-text text-3xl font-extrabold mb-1"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Candidate Rankings
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Top {rankedResults.length} candidates for this role
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 fade-up fade-up-delay-1">
          {[
            { label: "Total Analyzed", value: totalDone },
            { label: "Avg Match Score", value: avgScore + "%" },
            {
              label: "Best Match",
              value: rankedResults[0]?.name?.split(" ")[0] || "N/A",
            },
          ].map((stat, i) => (
            <div key={i} className="card-premium p-4 text-center">
              <p className="stat-number text-2xl text-[#4F9EF8] mb-1">
                {stat.value}
              </p>
              <p className="text-[var(--text-muted)] text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="fade-up fade-up-delay-2">
          {rankedResults.map((result, idx) => {
            const rank = idx + 1;
            const isExpanded = expandedGaps[idx] || false;
            const visibleGaps = isExpanded
              ? result.skillGaps
              : result.skillGaps.slice(0, 8);
            const hiddenCount = result.skillGaps.length - 8;

            return (
              <div
                key={idx}
                className="card-premium p-5 mb-4 transition-all"
                style={{
                  borderColor: rank === 1 ? "rgba(245,158,11,0.3)" : undefined,
                }}
              >
                {/* Gold badge for #1 */}
                {rank === 1 && (
                  <div className="mb-3">
                    <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full inline-block bg-[rgba(245,158,11,0.08)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]">
                      🏆 Top Candidate
                    </span>
                  </div>
                )}

                {/* Row 1: Rank + Name + Score */}
                <div className="flex items-center gap-4 mb-3">
                  {/* Rank badge */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: getRankBg(rank),
                      border: `1px solid ${getRankBorder(rank)}`,
                      color: getRankColor(rank),
                      fontFamily: "var(--font-syne)",
                    }}
                  >
                    {rank}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-lg font-bold text-[var(--text-primary)] truncate"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {result.name}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className="stat-number text-3xl leading-none"
                      style={{ color: getRankColor(rank) }}
                    >
                      {result.matchScore}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs mt-0.5">
                      % match
                    </p>
                  </div>
                </div>

                {/* Row 2: Progress bar */}
                <div className="bg-[#161B27] rounded-full h-1.5 w-full my-3">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: (barWidths[idx] || 0) + "%",
                      background: getBarGradient(rank),
                    }}
                  />
                </div>

                {/* Row 3: Pills */}
                <div className="flex gap-2 flex-wrap mb-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${getGapBadge(
                      result.gapCount
                    )}`}
                  >
                    {result.gapCount} skill gaps
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(79,158,248,0.1)] text-[#4F9EF8] border border-[rgba(79,158,248,0.2)]">
                    {result.totalHours}h training
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)]">
                    {result.resumeSkills.length} skills matched
                  </span>
                </div>

                {/* Row 4: Skill gaps expand */}
                {result.skillGaps.length > 0 && (
                  <div className="mb-3">
                    <button
                      onClick={() =>
                        setExpandedGaps((prev) => ({ ...prev, [idx]: !prev[idx] }))
                      }
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1 mb-2"
                    >
                      <span
                        className={`transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                      {isExpanded ? "Hide" : "View"} {result.gapCount} skill
                      gaps
                    </button>
                    {isExpanded && (
                      <div className="flex flex-wrap gap-1.5">
                        {visibleGaps.map((g: any, gi: number) => (
                          <span
                            key={gi}
                            className="text-xs px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.08)] text-[#EF4444] border border-[rgba(239,68,68,0.15)]"
                          >
                            {g.skill || g.catalog_skill}
                          </span>
                        ))}
                        {!isExpanded && hiddenCount > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[rgba(255,255,255,0.06)]">
                            +{hiddenCount} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Row 5: Actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      localStorage.setItem(
                        "pathway_data",
                        JSON.stringify({
                          pathway: result.pathway,
                          skill_gaps: result.skillGaps,
                          resume_skills: result.resumeSkills,
                          reasoning_trace: result.reasoningTrace,
                          match_score: result.matchScore / 100,
                        })
                      );
                      router.push("/roadmap");
                    }}
                    className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all hover:opacity-90 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #4F9EF8, #7C3AED)",
                      color: "#060810",
                      fontFamily: "var(--font-syne)",
                    }}
                  >
                    View Full Roadmap
                  </button>
                  <button
                    onClick={() => downloadReport(result, rank)}
                    className="flex-1 h-9 rounded-lg text-xs font-medium bg-[#161B27] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(79,158,248,0.3)] transition-all"
                  >
                    Download Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Download all */}
        {rankedResults.length > 1 && (
          <div className="mt-2 mb-10 fade-up fade-up-delay-3">
            <button
              onClick={() => {
                rankedResults.forEach((r, i) => {
                  setTimeout(() => downloadReport(r, i + 1), i * 100);
                });
              }}
              className="w-full h-11 rounded-xl text-sm font-medium bg-[#161B27] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(79,158,248,0.3)] transition-all"
            >
              Download All Reports ({rankedResults.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
