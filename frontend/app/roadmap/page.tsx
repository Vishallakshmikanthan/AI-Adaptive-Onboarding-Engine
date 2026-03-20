"use client";

import React, { useEffect, useState } from "react";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import ReasoningTrace from "@/components/ReasoningTrace";
import { Download, Book, Clock, Zap, Target } from "lucide-react";

interface RoadmapData {
  match_score: number;
  skill_gaps: { skill: string }[];
  reasoning_trace?: string;
  pathway: {
    pathway: {
      id: string;
      display_name: string;
      level: string;
      estimated_hours: number;
      category: string;
      description: string;
      order: number;
      gap_relevance: number;
      resources?: { name: string; url: string }[];
    }[];
    total_courses: number;
    total_estimated_hours: number;
    courses_skipped: number;
  };
}

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    // Minimum loading duration of 800ms
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    
    const loadData = async () => {
      try {
        const raw = localStorage.getItem("pathway_data");
        if (raw) {
          const parsed = JSON.parse(raw);
          setData(parsed);
          // Set progress width shortly after data loads to trigger animation
          setTimeout(() => {
            setProgressWidth(Math.round((parsed.match_score ?? 0) * 100));
          }, 100);
        }
      } catch (err) {
        console.error("Failed to parse pathway_data", err);
      }
    };

    Promise.all([loadData(), minDelay]).then(() => {
      setLoading(false);
    });
  }, []);

  const handleExport = () => {
    if (!data) return;

    const content = `My Personalized Learning Pathway\nGenerated on: ${new Date().toLocaleDateString()}\n\n--- STATS ---\nTotal Courses: ${data.pathway.pathway.length}\nTotal Hours: ${data.pathway.total_estimated_hours}h\nMatch Score: ${Math.round(data.match_score * 100)}%\n\n--- COURSES ---\n${data.pathway.pathway.map((c, i) => `\n${i + 1}. ${c.display_name} (${c.estimated_hours}h) - ${c.category}\n   ${c.resources && c.resources.length > 0 ? "Resources:\n   " + c.resources.map(r => `• ${r.name}: ${r.url}`).join("\n   ") : "No resources attached."}`).join("")}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-learning-pathway.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="h-10 bg-gray-700/50 rounded w-1/3 animate-pulse mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-[#1A2035] rounded-xl animate-pulse"></div>
            ))}
          </div>
          <div className="flex gap-8">
            <div className="flex-1 flex flex-col gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#1A2035] rounded-xl p-4 flex gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-3"></div>
                    <div className="flex gap-2 mb-3">
                      <div className="h-5 w-16 bg-gray-700/50 rounded-full"></div>
                      <div className="h-5 w-16 bg-gray-700/50 rounded-full"></div>
                      <div className="h-5 w-16 bg-gray-700/50 rounded-full"></div>
                    </div>
                    <div className="h-3 bg-gray-700/50 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden lg:block w-80 h-96 bg-[#1A2035] rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center text-white p-6 text-center">
        <h2 className="text-2xl font-bold mb-3">No analysis data found</h2>
        <p className="text-gray-400 mb-6">
          Please upload your resume and job description first to generate a pathway.
        </p>
        <a
          href="/"
          className="px-6 py-3 bg-[#2E86AB] hover:bg-[#236e8e] transition-colors rounded-xl font-medium"
        >
          Go to Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Learning Pathway</h1>
            <p className="text-gray-400 text-sm">
              Personalized roadmap generated by AI based on your resume and job description
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-fit bg-[#2E86AB] hover:bg-[#2E86AB]/80 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg"
          >
            <Download size={16} />
            Export Pathway
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-gradient-to-br from-[#1A2035] to-[#151D30] rounded-xl p-4 border border-gray-700/50 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Book size={14} className="text-gray-400" />
              <p className="text-xs text-gray-400">Total Courses</p>
            </div>
            <p className="text-2xl font-bold text-[#2E86AB] mb-1">
              {data?.pathway?.pathway?.length ?? 0}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">in your pathway</p>
          </div>
          <div className="bg-gradient-to-br from-[#1A2035] to-[#151D30] rounded-xl p-4 border border-gray-700/50 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-gray-400" />
              <p className="text-xs text-gray-400">Total Hours</p>
            </div>
            <p className="text-2xl font-bold text-[#F18F01] mb-1">
              {data?.pathway?.total_estimated_hours ?? 0}h
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">estimated</p>
          </div>
          <div className="bg-gradient-to-br from-[#1A2035] to-[#151D30] rounded-xl p-4 border border-gray-700/50 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-gray-400" />
              <p className="text-xs text-gray-400">Courses Skipped</p>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-1">
              {data?.pathway?.courses_skipped ?? 0}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">already mastered</p>
          </div>
          <div className="bg-gradient-to-br from-[#1A2035] to-[#151D30] rounded-xl p-4 border border-gray-700/50 shadow-md">
             <div className="flex items-center gap-2 mb-1">
               <Target size={14} className="text-gray-400" />
               <p className="text-xs text-gray-400">Role Match</p>
             </div>
             <p className="text-2xl font-bold text-purple-400 mb-1">
               {Math.round((data?.match_score ?? 0) * 100)}%
             </p>
             <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2 mt-2 overflow-hidden">
               <div
                 className="h-1.5 rounded-full bg-gradient-to-r from-[#2E86AB] to-[#F18F01] transition-all duration-1000 ease-out"
                 style={{ width: `${progressWidth}%` }}
               />
             </div>
             <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">compatibility</p>
          </div>
        </div>

        {/* Skill Gaps */}
        {data?.skill_gaps && data.skill_gaps.length > 0 && (
          <div className="mb-10">
            <p className="text-sm text-gray-400 mb-3">Identified Skill Gaps</p>
            <div className="flex flex-wrap gap-2">
              {data.skill_gaps.map((gap, i) => (
                <span
                  key={i}
                  className="bg-red-500/10 text-red-300 border border-red-500/20 rounded-full text-xs px-3 py-1"
                >
                  {gap.skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Left: Timeline */}
          <div className="flex-1">
            <RoadmapTimeline courses={data?.pathway?.pathway ?? []} />
          </div>

          {/* Right: Reasoning Trace */}
          {data?.reasoning_trace && (
            <div className="w-full lg:w-80">
              <ReasoningTrace trace={data.reasoning_trace} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
