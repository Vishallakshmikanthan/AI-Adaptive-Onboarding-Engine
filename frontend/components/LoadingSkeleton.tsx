"use client";

interface SkeletonCardProps {
  index: number;
}

function SkeletonCard({ index }: SkeletonCardProps) {
  return (
    <div
      className="flex gap-4 mb-4"
      style={{ animationDelay: `${index * 80}ms` }}>
      <div className="w-10 h-10 rounded-full flex-shrink-0
        bg-[rgba(255,255,255,0.04)] animate-pulse" />
      <div className="flex-1 bg-[#161B27]
        border border-[rgba(255,255,255,0.04)]
        rounded-2xl p-4">
        <div className="flex items-start
          justify-between gap-4 mb-3">
          <div className="h-4 rounded-lg w-2/3"
            style={{
              background: "linear-gradient(90deg, #161B27 0%, rgba(79,158,248,0.06) 50%, #161B27 100%)",
              backgroundSize: "1000px 100%",
              animation: "shimmer 2s infinite"
            }} />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full
              bg-[rgba(255,255,255,0.04)]
              animate-pulse" />
            <div className="h-5 w-12 rounded-full
              bg-[rgba(255,255,255,0.04)]
              animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 rounded w-full
            bg-[rgba(255,255,255,0.03)]
            animate-pulse" />
          <div className="h-3 rounded w-4/5
            bg-[rgba(255,255,255,0.03)]
            animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map(i => (
        <SkeletonCard key={i} index={i} />
      ))}
    </div>
  );
}
