"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

interface Course {
  id: string;
  display_name: string;
  level: string;
  estimated_hours: number;
}

interface WeeklyTimelineProps {
  courses: Course[];
  hoursPerWeek: number;
}

export default function WeeklyTimeline({ courses, hoursPerWeek = 10 }: WeeklyTimelineProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0])); // Week 0 open by default

  if (!courses || courses.length === 0) return null;

  // Group courses into weeks
  const weeks: { weekNum: number; courses: Course[]; totalHours: number }[] = [];
  let currentWeekCourses: Course[] = [];
  let currentWeekHours = 0;
  let weekCounter = 1;

  courses.forEach((course) => {
    // If adding this course exceeds the weekly limit (and we already have courses in this week)
    if (currentWeekHours + course.estimated_hours > hoursPerWeek && currentWeekCourses.length > 0) {
      // Close current week and start a new one
      weeks.push({
        weekNum: weekCounter,
        courses: currentWeekCourses,
        totalHours: currentWeekHours
      });
      weekCounter++;
      currentWeekCourses = [course];
      currentWeekHours = course.estimated_hours;
    } else {
      currentWeekCourses.push(course);
      currentWeekHours += course.estimated_hours;
    }
  });

  // Push the final week if there are remaining courses
  if (currentWeekCourses.length > 0) {
    weeks.push({
      weekNum: weekCounter,
      courses: currentWeekCourses,
      totalHours: currentWeekHours
    });
  }

  const toggleWeek = (weekIndex: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekIndex)) next.delete(weekIndex);
      else next.add(weekIndex);
      return next;
    });
  };

  return (
    <div className="w-full bg-[#1A2035] rounded-xl border border-gray-700/50 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-[#F18F01] rounded-sm"></span>
          Weekly Schedule
        </h3>
        <div className="text-sm px-3 py-1 bg-[#0A0F1E] rounded-full border border-gray-700 text-gray-400">
          Target: <span className="font-bold text-white">{hoursPerWeek} hrs</span> / week
        </div>
      </div>

      <div className="space-y-4">
        {weeks.map((week, index) => {
          const isExpanded = expandedWeeks.has(index);
          const percentUsed = Math.min((week.totalHours / hoursPerWeek) * 100, 100);

          return (
            <div key={index} className="border border-gray-700/50 rounded-lg overflow-hidden bg-[#0A0F1E]">
              {/* Week Header */}
              <button 
                onClick={() => toggleWeek(index)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2E86AB]/20 text-[#2E86AB] flex items-center justify-center font-bold">
                    W{week.weekNum}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-200">
                      Phase {week.weekNum}
                    </div>
                    <div className="text-xs text-gray-500">
                      {week.courses.length} module{week.courses.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Capacity</span>
                      <span className={`${week.totalHours > hoursPerWeek ? 'text-red-400' : 'text-[#F18F01]'}`}>
                        {week.totalHours}h
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${week.totalHours > hoursPerWeek ? 'bg-red-500' : 'bg-[#F18F01]'}`}
                        style={{ width: `${percentUsed}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={`transform transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </div>
              </button>

              {/* Week Content (Courses) */}
              {isExpanded && (
                <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex flex-col gap-2">
                  {week.courses.map(course => (
                    <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1A2035] border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex-1 truncate pr-4">
                        <div className="text-sm font-medium text-gray-200 truncate">
                          {course.display_name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {course.level}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono bg-gray-800 px-2.5 py-1 rounded text-gray-300 whitespace-nowrap">
                        <Clock size={12} className="text-[#2E86AB]" />
                        {course.estimated_hours}h
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}