"use client";

import { useEffect, useState } from "react";

interface MatchScoreRingProps {
  score: number; // 0 to 100
}

export default function MatchScoreRing({ score, size: sizeProp }: MatchScoreRingProps & { size?: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const size = sizeProp ?? 160;
  const strokeWidth = size < 80 ? 6 : 12;
  const cx = size / 2;
  const cy = size / 2;
  const radius = cx - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Animate the score from 0 to target
  useEffect(() => {
    let startTime: number;
    const duration = 1500; // 1.5s
    
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      // Easing out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(easeOut * score));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  const offset = circumference - (displayScore / 100) * circumference;

  let color = "#4ADE80"; // Green
  let text = "Excellent Fit";
  if (score < 50) {
    color = "#F87171"; // Red
    text = "Major Gaps";
  } else if (score < 75) {
    color = "#FACC15"; // Yellow
    text = "Moderate Match";
  }

  const compact = size < 100;
  const fontSize = compact ? "text-sm" : "text-4xl";

  return (
    <div className={compact ? "flex items-center justify-center" : "flex flex-col items-center justify-center p-6 bg-[#1A2035] rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden"}>
      
      {!compact && <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2E86AB]/10 rounded-full blur-2xl pointer-events-none" />}
      {!compact && <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F18F01]/10 rounded-full blur-2xl pointer-events-none" />}

      {!compact && <h3 className="text-sm text-gray-400 font-semibold mb-4 tracking-wider uppercase">Initial Role Match</h3>}
      
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          className="absolute top-0 left-0 -rotate-90" 
          width={size} 
          height={size}
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke="#0A0F1E"
            strokeWidth={strokeWidth}
          />
        </svg>

        <svg 
          className="absolute top-0 left-0 -rotate-90" 
          width={size} 
          height={size}
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-75 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-black text-white`}>{displayScore}%</span>
        </div>
      </div>
      
      {!compact && (
        <div className="mt-4 px-4 py-1.5 rounded-full bg-[#0A0F1E] border border-gray-700 text-sm font-medium" style={{ color }}>
          {text}
        </div>
      )}
    </div>
  );
}