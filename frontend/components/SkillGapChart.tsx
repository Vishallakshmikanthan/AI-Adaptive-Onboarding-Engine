"use client";

import { useEffect, useState } from "react";

interface SkillGapChartProps {
  scoreMap: Record<string, number>; // Maps skill name to gap relevance (0.0 to 1.0)
}

export default function SkillGapChart({ scoreMap }: SkillGapChartProps) {
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});

  useEffect(() => {
    // Stagger animation
    const sortedSkills = Object.keys(scoreMap).sort((a, b) => scoreMap[b] - scoreMap[a]).slice(0, 6); // Top 6 gaps
    
    sortedSkills.forEach((skill, index) => {
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [skill]: scoreMap[skill]
        }));
      }, index * 150 + 300); // 300ms initial delay, then 150ms per bar
    });
  }, [scoreMap]);

  const sortedSkills = Object.keys(scoreMap)
    .sort((a, b) => scoreMap[b] - scoreMap[a])
    .slice(0, 6);

  if (sortedSkills.length === 0) {
    return (
      <div className="bg-[#1A2035] p-6 rounded-2xl border border-gray-800 text-center">
        <p className="text-gray-400">No skill gaps identified.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A2035] p-6 rounded-2xl border border-gray-800 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-red-500 rounded-sm inline-block"></span>
        Top Skill Gaps
      </h3>

      <div className="flex flex-col gap-5">
        {sortedSkills.map((skill) => {
          const targetValue = scoreMap[skill];
          const currentValue = animatedScores[skill] || 0;
          const percentage = Math.round(currentValue * 100);
          
          let colorClass = "from-green-500 to-green-400";
          if (targetValue >= 0.7) colorClass = "from-red-500 to-red-400";
          else if (targetValue >= 0.4) colorClass = "from-yellow-500 to-yellow-400";

          return (
            <div key={skill} className="w-full">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-200 truncate pr-4" title={skill}>
                  {skill}
                </span>
                <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                  Severity: {percentage}%
                </span>
              </div>
              
              <div className="w-full bg-[#0A0F1E] rounded-full h-2.5 overflow-hidden border border-gray-700">
                <div 
                  className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}