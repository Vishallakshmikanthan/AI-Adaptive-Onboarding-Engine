"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Upload, FileText, Clock, Book, Target, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PathwayResult {
  match_score: number;
  skill_gaps: { skill: string; gap_relevance?: number; gap_score?: number }[];
  reasoning_trace?: string;
  pathway: {
    pathway: any[];
    total_courses: number;
    total_estimated_hours: number;
    courses_skipped: number;
  };
}

function UploadCard({
  label,
  accent,
  accentRgb,
  text,
  fileName,
  onDrop,
  onPaste,
}: {
  label: string;
  accent: string;
  accentRgb: string;
  text: string;
  fileName: string;
  onDrop: (files: File[]) => void;
  onPaste: (text: string) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-[var(--font-syne)] font-bold uppercase tracking-wider" style={{ color: accent }}>
        {label}
      </h3>
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center min-h-[160px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 p-5 ${
          isDragActive
            ? `border-[${accent}] bg-[rgba(${accentRgb},0.1)] scale-[1.02]`
            : text
            ? "border-[#10B981] bg-[rgba(16,185,129,0.05)]"
            : `border-[rgba(255,255,255,0.1)] bg-[var(--bg-surface)] hover:border-[rgba(${accentRgb},0.4)]`
        }`}
      >
        <input {...getInputProps()} />
        {text ? (
          <div className="flex flex-col items-center gap-2">
            <FileText size={24} className="text-[#10B981]" />
            <p className="text-xs text-[#10B981] font-medium">{fileName || "Loaded"}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Click or drop to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} style={{ color: accent }} />
            <p className="text-xs text-[var(--text-secondary)]">Drop PDF/DOCX or click</p>
          </div>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => onPaste(e.target.value)}
        placeholder={`Or paste ${label.toLowerCase()} text here...`}
        className="w-full h-24 bg-[var(--bg-surface)] border border-[rgba(255,255,255,0.06)] rounded-lg p-3 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[rgba(79,158,248,0.3)]"
      />
    </div>
  );
}

export default function ComparePage() {
  const [resumeAText, setResumeAText] = useState("");
  const [resumeBText, setResumeBText] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeAName, setResumeAName] = useState("");
  const [resumeBName, setResumeBName] = useState("");
  const [jdName, setJdName] = useState("");
  const [resultA, setResultA] = useState<PathwayResult | null>(null);
  const [resultB, setResultB] = useState<PathwayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"A" | "B" | null>(null);
  const [error, setError] = useState("");

  const parseFile = async (file: File, endpoint: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`/api/parse/${endpoint}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.text;
  };

  const handleDropA = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    setResumeAName(file.name);
    try {
      const text = await parseFile(file, "resume");
      setResumeAText(text);
    } catch {
      setError("Failed to parse Candidate A resume.");
    }
  }, []);

  const handleDropB = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    setResumeBName(file.name);
    try {
      const text = await parseFile(file, "resume");
      setResumeBText(text);
    } catch {
      setError("Failed to parse Candidate B resume.");
    }
  }, []);

  const handleDropJD = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    setJdName(file.name);
    try {
      const text = await parseFile(file, "job-description");
      setJdText(text);
    } catch {
      setError("Failed to parse job description.");
    }
  }, []);

  const canCompare = resumeAText.trim() && resumeBText.trim() && jdText.trim();

  const handleCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError("");
    setResultA(null);
    setResultB(null);

    try {
      // Run sequentially to avoid LLM rate limits
      setLoadingPhase("A");
      const resAResponse = await fetch("/api/pathway/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeAText, jd_text: jdText }),
      });
      if (!resAResponse.ok) throw new Error(`Candidate A analysis failed (${resAResponse.status})`);
      const resA = await resAResponse.json();
      setResultA(resA);

      setLoadingPhase("B");
      const resBResponse = await fetch("/api/pathway/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeBText, jd_text: jdText }),
      });
      if (!resBResponse.ok) throw new Error(`Candidate B analysis failed (${resBResponse.status})`);
      const resB = await resBResponse.json();
      setResultB(resB);
    } catch (err: any) {
      setError(err.message || "Comparison failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingPhase(null);
    }
  };

  const scoreA = resultA ? Math.round(resultA.match_score * 100) : 0;
  const scoreB = resultB ? Math.round(resultB.match_score * 100) : 0;
  const winner = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "tie";

  return (
    <div className="min-h-screen bg-[#060810] text-[var(--text-primary)] font-[var(--font-dm-sans)] py-12 px-6 tracking-wide relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#4F9EF8]/[0.06] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#7C3AED]/[0.06] blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <h1 className="text-3xl font-[var(--font-syne)] font-extrabold gradient-text mb-2">
            Compare Candidates
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Upload two resumes and one job description to compare candidate pathways side by side
          </p>
        </div>

        {/* Upload Section — 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <UploadCard
            label="Candidate A Resume"
            accent="#4F9EF8"
            accentRgb="79,158,248"
            text={resumeAText}
            fileName={resumeAName}
            onDrop={handleDropA}
            onPaste={setResumeAText}
          />
          <UploadCard
            label="Job Description"
            accent="#7C3AED"
            accentRgb="124,58,237"
            text={jdText}
            fileName={jdName}
            onDrop={handleDropJD}
            onPaste={setJdText}
          />
          <UploadCard
            label="Candidate B Resume"
            accent="#06B6D4"
            accentRgb="6,182,212"
            text={resumeBText}
            fileName={resumeBName}
            onDrop={handleDropB}
            onPaste={setResumeBText}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Compare Button */}
        <button
          onClick={handleCompare}
          disabled={!canCompare || loading}
          className={`w-full py-4 rounded-2xl text-white font-[var(--font-syne)] font-bold text-lg transition-all mb-12 ${
            canCompare && !loading
              ? "bg-gradient-to-r from-[#4F9EF8] to-[#7C3AED] hover:from-[#4F9EF8]/90 hover:to-[#7C3AED]/90 shadow-lg shadow-[#4F9EF8]/20 cursor-pointer"
              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {loadingPhase === "A" ? "Analyzing Candidate A..." : "Analyzing Candidate B..."}
            </span>
          ) : (
            "Compare Candidates"
          )}
        </button>

        {/* ===== RESULTS ===== */}
        {resultA && resultB && (
          <div className="space-y-8 fade-up">
            {/* Comparison Header Banner */}
            <div className="card-premium p-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                {/* Candidate A Stats */}
                <div className="text-center space-y-3">
                  <p className="text-xs font-[var(--font-syne)] font-bold text-[#4F9EF8] uppercase tracking-wider">Candidate A</p>
                  <p className="text-5xl font-[var(--font-syne)] font-extrabold text-[var(--text-primary)]">{scoreA}%</p>
                  {winner === "A" ? (
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[rgba(16,185,129,0.2)]">
                      ✓ Better Match
                    </span>
                  ) : winner === "B" ? (
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]">
                      Needs more training
                    </span>
                  ) : (
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(79,158,248,0.12)] text-[#4F9EF8] border border-[rgba(79,158,248,0.2)]">
                      Equal Match
                    </span>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <p className="text-lg font-[var(--font-syne)] font-bold text-[#4F9EF8]">{resultA.pathway.total_courses}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Courses</p>
                    </div>
                    <div>
                      <p className="text-lg font-[var(--font-syne)] font-bold text-[#F59E0B]">{resultA.pathway.total_estimated_hours}h</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Hours</p>
                    </div>
                    <div>
                      <p className="text-lg font-[var(--font-syne)] font-bold text-[#EF4444]">{resultA.skill_gaps.length}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Gaps</p>
                    </div>
                  </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-gradient-to-br from-[#4F9EF8] to-[#7C3AED] text-white rounded-full w-14 h-14 flex items-center justify-center font-[var(--font-syne)] font-bold text-xl shadow-lg shadow-[#4F9EF8]/30">
                    VS
                  </div>
                  <div className="w-px h-16 bg-gradient-to-b from-[rgba(255,255,255,0.1)] to-transparent" />
                </div>

                {/* Candidate B Stats */}
                <div className="text-center space-y-3">
                  <p className="text-xs font-[var(--font-syne)] font-bold text-[#06B6D4] uppercase tracking-wider">Candidate B</p>
                  <p className="text-5xl font-[var(--font-syne)] font-extrabold text-[var(--text-primary)]">{scoreB}%</p>
                  {winner === "B" ? (
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[rgba(16,185,129,0.2)]">
                      ✓ Better Match
                    </span>
                  ) : winner === "A" ? (
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]">
                      Needs more training
                    </span>
                  ) : (
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-[rgba(79,158,248,0.12)] text-[#4F9EF8] border border-[rgba(79,158,248,0.2)]">
                      Equal Match
                    </span>
                  )}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <p className="text-lg font-[var(--font-syne)] font-bold text-[#4F9EF8]">{resultB.pathway.total_courses}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Courses</p>
                    </div>
                    <div>
                      <p className="text-lg font-[var(--font-syne)] font-bold text-[#F59E0B]">{resultB.pathway.total_estimated_hours}h</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Hours</p>
                    </div>
                    <div>
                      <p className="text-lg font-[var(--font-syne)] font-bold text-[#EF4444]">{resultB.skill_gaps.length}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Gaps</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Skill Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-[var(--font-syne)] font-bold text-[#4F9EF8] mb-3 uppercase tracking-wider">Candidate A — Skill Gaps</h3>
                <div className="flex flex-wrap gap-2">
                  {resultA.skill_gaps.map((g, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[rgba(239,68,68,0.08)] text-[#EF4444] border border-[rgba(239,68,68,0.15)]">
                      {g.skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-[var(--font-syne)] font-bold text-[#06B6D4] mb-3 uppercase tracking-wider">Candidate B — Skill Gaps</h3>
                <div className="flex flex-wrap gap-2">
                  {resultB.skill_gaps.map((g, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[rgba(239,68,68,0.08)] text-[#EF4444] border border-[rgba(239,68,68,0.15)]">
                      {g.skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Side-by-Side Pathways */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Candidate A Pathway */}
              <div>
                <h3 className="text-sm font-[var(--font-syne)] font-bold text-[#4F9EF8] mb-3 uppercase tracking-wider">Candidate A — Pathway</h3>
                <div className="flex flex-col gap-2">
                  {resultA.pathway.pathway.map((course: any, i: number) => (
                    <div key={i} className="card-premium p-3 flex items-center justify-between border-l-[3px] border-l-[#4F9EF8]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-[var(--font-syne)] font-bold text-[#4F9EF8] flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-[var(--text-primary)] truncate">{course.display_name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex-shrink-0 ml-2">
                        <Clock size={10} />
                        {course.estimated_hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Candidate B Pathway */}
              <div>
                <h3 className="text-sm font-[var(--font-syne)] font-bold text-[#06B6D4] mb-3 uppercase tracking-wider">Candidate B — Pathway</h3>
                <div className="flex flex-col gap-2">
                  {resultB.pathway.pathway.map((course: any, i: number) => (
                    <div key={i} className="card-premium p-3 flex items-center justify-between border-l-[3px] border-l-[#06B6D4]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-[var(--font-syne)] font-bold text-[#06B6D4] flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-[var(--text-primary)] truncate">{course.display_name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex-shrink-0 ml-2">
                        <Clock size={10} />
                        {course.estimated_hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendation Card */}
            <div className="bg-[rgba(79,158,248,0.06)] border border-[rgba(79,158,248,0.15)] rounded-2xl p-6">
              <h3 className="font-[var(--font-syne)] font-bold text-lg gradient-text mb-3">AI Recommendation</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {winner === "A" ? (
                  <>
                    <strong className="text-[#10B981]">Candidate A is recommended</strong> for this role with a {scoreA}% match.
                    They require{" "}
                    <strong>{resultB.pathway.total_courses - resultA.pathway.total_courses > 0
                      ? `${resultB.pathway.total_courses - resultA.pathway.total_courses} fewer`
                      : `${resultA.pathway.total_courses - resultB.pathway.total_courses} more`
                    }</strong>{" "}
                    training modules than Candidate B, and need{" "}
                    <strong>{Math.abs(resultB.pathway.total_estimated_hours - resultA.pathway.total_estimated_hours)}h {
                      resultA.pathway.total_estimated_hours < resultB.pathway.total_estimated_hours ? "less" : "more"
                    }</strong>{" "}
                    training time.
                  </>
                ) : winner === "B" ? (
                  <>
                    <strong className="text-[#10B981]">Candidate B is recommended</strong> for this role with a {scoreB}% match.
                    They require{" "}
                    <strong>{resultA.pathway.total_courses - resultB.pathway.total_courses > 0
                      ? `${resultA.pathway.total_courses - resultB.pathway.total_courses} fewer`
                      : `${resultB.pathway.total_courses - resultA.pathway.total_courses} more`
                    }</strong>{" "}
                    training modules than Candidate A, and need{" "}
                    <strong>{Math.abs(resultA.pathway.total_estimated_hours - resultB.pathway.total_estimated_hours)}h {
                      resultB.pathway.total_estimated_hours < resultA.pathway.total_estimated_hours ? "less" : "more"
                    }</strong>{" "}
                    training time.
                  </>
                ) : (
                  <>
                    <strong className="text-[#4F9EF8]">Both candidates are equally matched</strong> at {scoreA}%.
                    Consider other factors such as experience, cultural fit, and growth potential to make a final decision.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
