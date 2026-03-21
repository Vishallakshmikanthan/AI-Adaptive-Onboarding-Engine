"use client";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: string;
}

export default function EmptyState({
  title = "Nothing here yet",
  description = "Get started by running an analysis",
  actionLabel = "Start Analysis",
  actionHref = "/",
  icon = "🗺️"
}: EmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center
      justify-center min-h-[400px] text-center px-6">
      <div className="w-16 h-16 rounded-2xl
        bg-[rgba(79,158,248,0.08)]
        border border-[rgba(79,158,248,0.15)]
        flex items-center justify-center
        text-3xl mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold
        text-[rgba(255,255,255,0.9)] mb-2"
        style={{
          fontFamily: "var(--font-syne, sans-serif)"
        }}>
        {title}
      </h3>
      <p className="text-sm
        text-[rgba(255,255,255,0.4)]
        max-w-xs leading-relaxed mb-8">
        {description}
      </p>
      <button
        onClick={() => router.push(actionHref)}
        className="px-6 py-3 rounded-[10px]
          text-sm font-semibold transition-all
          hover:opacity-90 hover:shadow-lg
          active:scale-[0.98]"
        style={{
          background:
            "linear-gradient(135deg, #4F9EF8, #7C3AED)",
          color: "#060810",
          fontFamily: "var(--font-syne, sans-serif)"
        }}>
        {actionLabel} →
      </button>
    </div>
  );
}
