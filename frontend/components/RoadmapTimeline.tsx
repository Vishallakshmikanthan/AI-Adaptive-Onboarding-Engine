"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Book, Link as LinkIcon, Clock, ExternalLink, Check } from "lucide-react";
import SKILL_DEMAND from "@/data/skillDemand";

interface Resource {
  name: string;
  url: string;
}

interface Course {
  id: string;
  display_name: string;
  level: string;
  estimated_hours: number;
  category: string;
  description: string;
  order: number;
  gap_relevance: number;
  resources?: Resource[];
  prerequisites?: string[];
}

interface RoadmapTimelineProps {
  courses: Course[];
  onCompletionChange?: (count: number, total: number) => void;
}

const categoryColors: Record<string, string> = {
  programming: "bg-[#4F9EF8]/15 text-[#4F9EF8] border-[#4F9EF8]/30",
  data: "bg-[#7C3AED]/15 text-[#7C3AED] border-[#7C3AED]/30",
  cloud: "bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30",
  leadership: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
  operations: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30",
  fundamentals: "bg-[#8892A4]/15 text-[#8892A4] border-[#8892A4]/30",
};

const categoryBorderColors: Record<string, string> = {
  programming: "border-l-[#4F9EF8]",
  data: "border-l-[#7C3AED]",
  cloud: "border-l-[#06B6D4]",
  leadership: "border-l-[#F59E0B]",
  operations: "border-l-[#10B981]",
  fundamentals: "border-l-[#8892A4]",
};

const levelColors: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-300",
  intermediate: "bg-yellow-500/20 text-yellow-300",
  advanced: "bg-red-500/20 text-red-300",
};

export default function RoadmapTimeline({ courses, onCompletionChange }: RoadmapTimelineProps) {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      return new Set(JSON.parse(localStorage.getItem("completed_courses") || "[]"));
    }
    return new Set();
  });

  useEffect(() => {
    if (!courses || courses.length === 0) return;

    const timers = courses.map((_, index) => {
      return setTimeout(() => {
        setVisibleCards((prev) => new Set(prev).add(index));
      }, index * 120);
    });

    return () => timers.forEach(clearTimeout);
  }, [courses]);

  useEffect(() => {
    if (onCompletionChange && courses) {
      onCompletionChange(completed.size, courses.length);
    }
  }, [completed, courses, onCompletionChange]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleComplete = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      localStorage.setItem("completed_courses", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  if (!courses || courses.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-center">
          No courses to display. Run an analysis first.
        </p>
      </div>
    );
  }

  const completionPercent = courses.length > 0 ? (completed.size / courses.length) * 100 : 0;

  const getDifficultyDots = (level: string) => {
    const map: Record<string, number> = {
      beginner: 2,
      intermediate: 3,
      advanced: 5
    };
    const filled = map[level] || 2;
    return Array(5).fill(null).map((_, i) => (
      <span
        key={i}
        className={`w-1.5 h-1.5 rounded-full transition-colors ${
          i < filled
            ? level === "advanced"
              ? "bg-[#EF4444]"
              : level === "intermediate"
              ? "bg-[#F59E0B]"
              : "bg-[#10B981]"
            : "bg-[rgba(255,255,255,0.1)]"
        }`}
      />
    ));
  };

  return (
    <div className="relative w-full">
      {/* Completion Summary Bar */}
      <div className="mb-8 w-full">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-[var(--text-secondary)] font-medium">{completed.size} of {courses.length} courses completed</span>
          <span className="text-[#4F9EF8] font-[var(--font-syne)] font-bold">{Math.round(completionPercent)}%</span>
        </div>
        <div className="bg-[var(--bg-elevated)] rounded-full h-2 w-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#4F9EF8] to-[#10B981] h-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <div className="absolute left-6 top-16 bottom-8 w-0.5 bg-gradient-to-b from-[#4F9EF8]/50 to-transparent" />

      <div className="flex flex-col gap-6">
        {courses.map((course, index) => {
          const isVisible = visibleCards.has(index);
          const isExpanded = expandedCards.has(course.id);
          const isCompleted = completed.has(course.id);
          const catColor = categoryColors[course.category] || categoryColors.fundamentals;
          const catBorder = categoryBorderColors[course.category] || categoryBorderColors.fundamentals;
          const lvlColor = levelColors[course.level] || levelColors.beginner;

          let dotColor = "bg-green-500";
          if (course.gap_relevance > 0.7) dotColor = "bg-red-500";
          else if (course.gap_relevance > 0.4) dotColor = "bg-yellow-500";

          return (
            <div
              key={course.id}
              className={`relative flex items-start gap-4 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } ${isCompleted ? "opacity-75" : ""}`}
            >
              {/* Step number badge */}
              <div className={`relative flex-shrink-0 w-12 h-12 rounded-full bg-[var(--bg-base)] border-2 flex items-center justify-center z-10 text-sm font-[var(--font-syne)] font-bold ${
                isCompleted ? "border-[#10B981] text-[#10B981]" : "border-[#4F9EF8] text-[#4F9EF8]"
              }`}>
                {index + 1}
                <div
                  className={`absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[var(--bg-base)] ${dotColor} z-20`}
                />
              </div>

              {/* Card body */}
              <div
                onClick={() => toggleCard(course.id)}
                className={`flex-1 card-premium border-l-[3px] ${catBorder} p-4 cursor-pointer hover:shadow-[0_0_20px_rgba(79,158,248,0.1)] relative ${
                  isCompleted ? "!border-[#10B981]/30 border-l-[#10B981]" : ""
                }`}
              >
                {/* Complete Checkbox */}
                <div className="absolute top-4 right-4 z-20">
                  <button 
                    onClick={(e) => toggleComplete(course.id, e)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isCompleted ? "border-[#10B981] bg-[#10B981] text-white" : "border-[var(--border-default)] bg-transparent hover:border-[#4F9EF8]"
                    }`}
                  >
                    {isCompleted && <Check size={16} strokeWidth={3} />}
                  </button>
                </div>

                <div className="flex items-start justify-between mb-2 pr-10">
                  <h3 className={`font-[var(--font-syne)] font-bold ${isCompleted ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                    {course.display_name}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-xs px-3 py-1 rounded-full border ${catColor}`}>
                    {course.category}
                  </span>
                  {(() => {
                    const demand = SKILL_DEMAND[course.display_name] || SKILL_DEMAND[course.category];
                    return demand ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1
                        ${demand.level === "hot"
                          ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                          : demand.level === "high"
                          ? "bg-[rgba(79,158,248,0.15)] text-[#4F9EF8]"
                          : "bg-[rgba(16,185,129,0.15)] text-[#10B981]"
                        }`}>
                        {demand.label} <span className="opacity-70">{demand.trend}</span>
                      </span>
                    ) : null;
                  })()}
                  <span className={`text-xs px-3 py-1 rounded-full ${lvlColor}`}>
                    {course.level}
                  </span>
                  <div className="flex items-center gap-1 ml-1">
                    {getDifficultyDots(course.level)}
                  </div>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">
                    <Clock size={12} />
                    {course.estimated_hours}h
                  </span>
                </div>

                <p className={`text-sm text-[var(--text-secondary)] ${!isExpanded ? "line-clamp-2" : ""}`}>
                  {course.description}
                </p>

                {/* Expanded content area */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                  }`}
                >
                  {course.resources && course.resources.length > 0 && (
                    <div className="mb-4">
                      <h4 className="flex items-center gap-2 text-sm text-white font-medium mb-2">
                        <Book size={16} /> Learning Resources
                      </h4>
                      <div className="flex flex-col gap-2">
                        {course.resources.map((res, i) => (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-fit flex items-center gap-2 text-xs text-[#4F9EF8] hover:text-white bg-[#4F9EF8]/10 hover:bg-[#4F9EF8]/20 px-3 py-1.5 rounded-lg border border-[#4F9EF8]/20 transition-all"
                          >
                            {res.name}
                            <ExternalLink size={12} className="ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 text-sm text-white font-medium mb-2">
                        <LinkIcon size={16} /> Prerequisites
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {course.prerequisites.map((prereq, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-md"
                          >
                            {prereq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-2 opacity-50">
                  <ChevronDown
                    className={`text-gray-400 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    size={20}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
