const SKILL_DEMAND: Record<string, {
  level: "hot" | "high" | "growing",
  label: string,
  trend: string
}> = {
  "Machine Learning": { level: "hot", label: "🔥 Hot", trend: "+34% YoY" },
  "Docker": { level: "hot", label: "🔥 Hot", trend: "+28% YoY" },
  "Kubernetes": { level: "hot", label: "🔥 Hot", trend: "+41% YoY" },
  "AWS": { level: "hot", label: "🔥 Hot", trend: "+31% YoY" },
  "Python": { level: "hot", label: "🔥 Hot", trend: "+22% YoY" },
  "System Design": { level: "high", label: "📈 High", trend: "+19% YoY" },
  "TypeScript": { level: "high", label: "📈 High", trend: "+45% YoY" },
  "React": { level: "high", label: "📈 High", trend: "+18% YoY" },
  "CI/CD": { level: "high", label: "📈 High", trend: "+25% YoY" },
  "Data Analysis": { level: "growing", label: "↑ Growing", trend: "+15% YoY" },
  "SQL": { level: "growing", label: "↑ Growing", trend: "+12% YoY" },
  "REST API Design": { level: "high", label: "📈 High", trend: "+20% YoY" },
  "Microservices": { level: "hot", label: "🔥 Hot", trend: "+38% YoY" },
  "Deep Learning": { level: "hot", label: "🔥 Hot", trend: "+52% YoY" },
  "DevOps": { level: "hot", label: "🔥 Hot", trend: "+29% YoY" },
  "Cloud Security": { level: "hot", label: "🔥 Hot", trend: "+47% YoY" },
  "Java": { level: "high", label: "📈 High", trend: "+8% YoY" },
  "Azure": { level: "high", label: "📈 High", trend: "+33% YoY" },
  "Agile Methodology": { level: "growing", label: "↑ Growing", trend: "+10% YoY" },
  "Supply Chain Management": { level: "growing", label: "↑ Growing", trend: "+14% YoY" },
};

export default SKILL_DEMAND;
