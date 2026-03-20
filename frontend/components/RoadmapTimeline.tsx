"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Book, Link as LinkIcon, Clock, ExternalLink } from "lucide-react";

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
}

const categoryColors: Record<string, string> = {
  programming: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  data: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  cloud: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  leadership: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  operations: "bg-green-500/20 text-green-300 border-green-500/30",
  fundamentals: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const levelColors: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-300",
  intermediate: "bg-yellow-500/20 text-yellow-300",
  advanced: "bg-red-500/20 text-red-300",
};

export default function RoadmapTimeline({ courses }: RoadmapTimelineProps) {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!courses || courses.length === 0) return;

    courses.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleCards((prev) => new Set(prev).add(index));
      }, index * 120);
      return () => clearTimeout(timer);
    });
  }, [courses]);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  return (
    <div className="relative w-full">
      {/* Gradient timeline line */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2E86AB] to-transparent" />

      <div className="flex flex-col gap-6">
        {courses.map((course, index) => {
          const isVisible = visibleCards.has(index);
          const isExpanded = expandedCards.has(course.id);
          const catColor = categoryColors[course.category] || categoryColors.fundamentals;
          const lvlColor = levelColors[course.level] || levelColors.beginner;

          // Progress dot color logic
          let dotColor = "bg-green-500";
          if (course.gap_relevance > 0.7) dotColor = "bg-red-500";
          else if (course.gap_relevance > 0.4) dotColor = "bg-yellow-500";

          return (
            <div
              key={course.id}
              className={`relative flex items-start gap-4 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {/* Step number badge */}
              <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-[#0A0F1E] border-2 border-[#2E86AB] text-[#2E86AB] font-bold flex items-center justify-center z-10 text-sm">
                {index + 1}
                {/* Progress dot */}
                <div
                  className={`absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#0A0F1E] ${dotColor} z-20`}
                />
              </div>

              {/* Card body */}
              <div
                onClick={() => toggleCard(course.id)}
                className={`flex-1 bg-[#1A2035] border border-gray-700/50 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:border-[#2E86AB]/60 hover:shadow-[0_0_20px_rgba(46,134,171,0.15)]`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{course.display_name}</h3>
                  <ChevronDown
                    className={`text-gray-400 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    size={20}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {/* Category badge */}
                  <span className={`text-xs px-3 py-1 rounded-full border ${catColor}`}>
                    {course.category}
                  </span>

                  {/* Level badge */}
                  <span className={`text-xs px-3 py-1 rounded-full ${lvlColor}`}>
                    {course.level}
                  </span>

                  {/* Estimated Time badge */}
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#F18F01]/20 text-[#F18F01]">
                    <Clock size={12} />
                    {course.estimated_hours}h
                  </span>
                </div>

                <p className={`text-sm text-gray-400 ${!isExpanded ? "line-clamp-2" : ""}`}>
                  {course.description}
                </p>

                {/* Expanded content area */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                  }`}
                >
                  {/* Resources */}
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
                            className="w-fit flex items-center gap-2 text-xs text-[#2E86AB] hover:text-white bg-[#2E86AB]/10 hover:bg-[#2E86AB]/20 px-3 py-1.5 rounded-lg border border-[#2E86AB]/20 transition-all"
                          >
                            {res.name}
                            <ExternalLink size={12} className="ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prerequisites */}
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

                {course.gap_relevance > 0.7 && !isExpanded && (
                  <p className="mt-2 text-sm text-[#2E86AB] font-medium">
                    ⚡ High priority gap
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
