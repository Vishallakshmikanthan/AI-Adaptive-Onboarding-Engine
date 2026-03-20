"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReasoningTrace from "@/components/ReasoningTrace";

// -- Types
interface SkillGap {
  skill: string;
  catalog_skill: string;
  gap_severity: number;
  priority: string;
}

interface Course {
  id: string;
  skill: string;
  display_name: string;
  level: string;
  estimated_hours: number;
  order: number;
  gap_relevance: number;
  category?: string;
  description?: string;
}

interface RoadmapData {
  match_score: number;
  skill_gaps: SkillGap[];
  reasoning_trace?: string;
  pathway: {
    pathway: Course[];
    total_courses: number;
    total_estimated_hours: number;
    courses_skipped: number;
    efficiency_gain: string;
  };
}

// -- Icons
const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SkipIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.1A1 1 0 005 7.9v8.2a1 1 0 001.6.8l5.333-4.1zm9.467-1.6l-5.333 4.1A1 1 0 0114 16.1V7.9a1 1 0 011.6-.8l5.333 4.1a1 1 0 010 1.6z" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

// -- Reusable Components
const StatCard = ({ title, value, icon, delay = 0 }: { title: string; value: string | number; icon: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-[#1A2035] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg border border-gray-800"
  >
    <div className="w-12 h-12 bg-[#2E86AB]/20 rounded-full flex items-center justify-center text-[#2E86AB] mb-4">
      {icon}
    </div>
    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-gray-400">{title}</p>
  </motion.div>
);

const getSeverityColor = (severity: number | string, priority: string) => {
  const p = priority.toLowerCase();
  if (p === "high") return "bg-red-500/20 text-red-500 border-red-500/30";
  if (p === "medium") return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
  return "bg-green-500/20 text-green-500 border-green-500/30";
};

const CourseCard = ({ course, index }: { course: Course; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    className="relative flex gap-6 items-start group"
  >
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-[#2E86AB] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#2E86AB]/30 z-10 border-4 border-[#0A0F1E] group-hover:scale-110 transition-transform">
        {course.order}
      </div>
      <div className="w-0.5 h-full bg-gradient-to-b from-[#2E86AB] to-[#1A2035] -mt-2 opacity-50 absolute top-12 bottom-[-24px] group-last:hidden" />
    </div>

    <div className="flex-1 bg-[#1A2035] rounded-2xl p-6 shadow-md border border-gray-800/60 hover:border-[#2E86AB]/50 transition-colors mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{course.display_name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#2E86AB]/20 text-[#2E86AB]">
              {course.skill}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 capitalize">
              {course.level} Level
            </span>
            {course.category && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                {course.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#0A0F1E] px-4 py-2 rounded-xl text-sm font-medium text-gray-300">
          <ClockIcon className="w-4 h-4 text-[#2E86AB]" />
          {course.estimated_hours} Hours
        </div>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">
        {course.description || `Core module covering ${course.skill} concepts designed to bridge your identified knowledge gaps securely.`}
      </p>
    </div>
  </motion.div>
);

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const rawData = localStorage.getItem("roadmap");
      if (rawData) {
        setData(JSON.parse(rawData));
      }
    } catch (err) {
      console.error("Failed to parse roadmap data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#2E86AB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.pathway || data.pathway.pathway.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <ChartIcon className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No Roadmap Found</h2>
        <p className="text-gray-400 max-w-md">
          Please upload your resume and the job description to analyze and build your personalized learning path first.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-8 px-6 py-3 bg-[#2E86AB] hover:bg-[#236e8e] transition-colors rounded-xl font-medium"
        >
          Go to Upload Page
        </button>
      </div>
    );
  }

  const { pathway, skill_gaps, match_score, reasoning_trace } = data;
  const matchPercentage = Math.round(match_score * 100);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white font-sans py-12 px-6">
      {reasoning_trace && <ReasoningTrace trace={reasoning_trace} />}
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Your Personalized Learning Path
          </h1>
          <p className="text-gray-400 text-lg">
            A step-by-step adaptive journey optimized specifically for your skill gaps.
          </p>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            delay={0.1}
            title="Total Courses"
            value={pathway.total_courses}
            icon={<BookIcon className="w-6 h-6" />}
          />
          <StatCard
            delay={0.2}
            title="Estimated Hours"
            value={pathway.total_estimated_hours}
            icon={<ClockIcon className="w-6 h-6" />}
          />
          <StatCard
            delay={0.3}
            title="Courses Skipped"
            value={pathway.courses_skipped}
            icon={<SkipIcon className="w-6 h-6" />}
          />
          <StatCard
            delay={0.4}
            title="Role Match"
            value={`${matchPercentage}%`}
            icon={<ChartIcon className="w-6 h-6" />}
          />
        </div>

        {/* Skill Gaps Section */}
        {skill_gaps && skill_gaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mb-14"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              Identified Skill Gaps
            </h2>
            <div className="flex flex-wrap gap-3">
              {skill_gaps.map((gap, i) => (
                <div
                  key={i}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border ${getSeverityColor(
                    gap.gap_severity,
                    gap.priority
                  )}`}
                >
                  {gap.catalog_skill || gap.skill}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Timeline Section */}
        <div className="mb-14">
          <h2 className="text-2xl font-bold mb-8 pl-4 border-l-4 border-[#2E86AB]">
            Course Progression
          </h2>
          <div className="relative pt-4">
            {pathway.pathway.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index + 6} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
