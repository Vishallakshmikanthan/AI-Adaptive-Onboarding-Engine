"use client";
import { useEffect, useState } from "react";

export default function APIHealthIndicator() {
  const [status, setStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/`,
          { signal: AbortSignal.timeout(3000) }
        );
        setStatus(res.ok ? "online" : "offline");
      } catch {
        setStatus("offline");
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-[rgba(255,255,255,0.4)]">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
          status === "online"
            ? "bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"
            : status === "offline"
            ? "bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.6)]"
            : "bg-[#F59E0B] animate-pulse"
        }`}
      />
      {status === "online"
        ? "AI Online"
        : status === "offline"
        ? "AI Offline"
        : "Connecting..."}
    </div>
  );
}
