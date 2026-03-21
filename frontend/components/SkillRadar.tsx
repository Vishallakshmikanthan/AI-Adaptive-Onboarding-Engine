"use client";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Skill {
  skill: string;
  level?: string;
}

interface Props {
  resumeSkills: Skill[];
}

const LEVEL_SCORE: Record<string, number> = {
  beginner: 25,
  intermediate: 60,
  advanced: 85,
  expert: 95,
};

const SKILL_TO_CATEGORY: Record<string, string> = {
  Python: "Programming",
  "Python Advanced": "Programming",
  JavaScript: "Programming",
  TypeScript: "Programming",
  React: "Programming",
  "Node.js": "Programming",
  Java: "Programming",
  "REST API Design": "Programming",
  "Software Testing": "Programming",
  Microservices: "Programming",
  "System Design": "Programming",
  SQL: "Data",
  "SQL Advanced": "Data",
  "Data Analysis": "Data",
  "Machine Learning": "Data",
  "Deep Learning": "Data",
  Statistics: "Data",
  "Data Visualization": "Data",
  NLP: "Data",
  "Data Engineering": "Data",
  "Database Design": "Data",
  Docker: "Cloud",
  Kubernetes: "Cloud",
  AWS: "Cloud",
  Azure: "Cloud",
  "Google Cloud Platform": "Cloud",
  "CI/CD": "Cloud",
  DevOps: "Cloud",
  "Cloud Security": "Cloud",
  Cybersecurity: "Cloud",
  Git: "Fundamentals",
  Linux: "Fundamentals",
  "Computer Networking": "Fundamentals",
  "Microsoft Excel": "Fundamentals",
  "Problem Solving": "Fundamentals",
  "UX Design": "Fundamentals",
  "Agile Methodology": "Leadership",
  "Project Management": "Leadership",
  "Team Leadership": "Leadership",
  "Business Communication": "Leadership",
  "Product Management": "Leadership",
  "Financial Management": "Leadership",
  "Inventory Management": "Operations",
  "Supply Chain Management": "Operations",
  "Safety Protocols": "Operations",
  "ERP Systems": "Operations",
  "Quality Management": "Operations",
  "Customer Service": "Operations",
  "Forklift Operation": "Operations",
};

const CATEGORY_COLORS: Record<string, string> = {
  Programming: "#4F9EF8",
  Data: "#7C3AED",
  Cloud: "#06B6D4",
  Fundamentals: "#8892A4",
  Leadership: "#F59E0B",
  Operations: "#10B981",
};

export default function SkillRadar({ resumeSkills }: Props) {
  if (!resumeSkills || resumeSkills.length === 0) {
    return null;
  }

  const categories = [
    "Programming",
    "Data",
    "Cloud",
    "Fundamentals",
    "Leadership",
    "Operations",
  ];

  const data = categories.map((cat) => {
    const catSkills = resumeSkills.filter(
      (s) => SKILL_TO_CATEGORY[s.skill] === cat
    );
    const score =
      catSkills.length > 0
        ? Math.round(
            catSkills.reduce(
              (sum, s) =>
                sum + (LEVEL_SCORE[s.level?.toLowerCase() || "beginner"] || 25),
              0
            ) / catSkills.length
          )
        : 0;
    return {
      category: cat,
      score,
      fullMark: 100,
    };
  });

  const hasAnyData = data.some((d) => d.score > 0);
  if (!hasAnyData) return null;

  return (
    <div className="bg-[#161B27] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3
            className="text-sm font-semibold text-[rgba(255,255,255,0.9)]"
            style={{ fontFamily: "var(--font-syne,sans-serif)" }}
          >
            Skill Profile Radar
          </h3>
          <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-0.5">
            Your strengths by category
          </p>
        </div>
        <span className="text-[10px] bg-[rgba(79,158,248,0.1)] text-[#4F9EF8] border border-[rgba(79,158,248,0.15)] px-2 py-0.5 rounded-full">
          {resumeSkills.length} skills
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <RadarChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <PolarGrid
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={{
              fill: "rgba(255,255,255,0.4)",
              fontSize: 10,
              fontFamily: "DM Sans, sans-serif",
            }}
          />
          <Radar
            name="Your Skills"
            dataKey="score"
            stroke="#4F9EF8"
            fill="#4F9EF8"
            fillOpacity={0.12}
            strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{
              background: "#0D1117",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#F0F4FF",
              padding: "8px 12px",
            }}
            formatter={(value: number) => [value + "%", "Proficiency"]}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-1.5 mt-1">
        {data
          .filter((d) => d.score > 0)
          .map((item) => (
            <div
              key={item.category}
              className="flex items-center gap-1.5 bg-[rgba(255,255,255,0.03)] rounded-lg px-2 py-1.5"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: CATEGORY_COLORS[item.category] }}
              />
              <span className="text-[9px] text-[rgba(255,255,255,0.3)] truncate">
                {item.category}
              </span>
              <span
                className="text-[9px] font-bold ml-auto"
                style={{
                  color: CATEGORY_COLORS[item.category],
                  fontFamily: "var(--font-syne, sans-serif)",
                }}
              >
                {item.score}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
