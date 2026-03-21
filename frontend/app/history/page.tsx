"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  resume_filename: string;
  jd_filename: string;
  match_score: number;
  total_courses: number;
  total_hours: number;
  created_at: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pathway/recent`)
      .then(res => res.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadSession = async (sessionId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/pathway/session/${sessionId}`
    );
    const data = await res.json();
    localStorage.setItem("pathway_data", JSON.stringify(data));
    router.push("/roadmap");
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recent Analyses</h1>
            <p className="text-gray-400 text-sm mt-1">
              Click any session to reload its pathway
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-[#2E86AB] hover:bg-[#2E86AB]/80 text-white 
            px-4 py-2 rounded-lg text-sm transition-all"
          >
            New Analysis
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#1A2035] rounded-xl p-5 
              animate-pulse h-24" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">No analyses yet</p>
            <p className="text-sm">Run your first analysis to see history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, i) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className="bg-[#1A2035] border border-gray-700/50 
                rounded-xl p-5 cursor-pointer hover:border-[#2E86AB]/50 
                hover:bg-[#1A2035]/80 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs bg-[#2E86AB]/20 text-[#2E86AB] 
                      px-2 py-0.5 rounded-full">
                        #{i + 1}
                      </span>
                      <span className="font-medium text-white text-sm truncate">
                        {session.resume_filename}
                      </span>
                      <span className="text-gray-500 text-xs">→</span>
                      <span className="text-gray-400 text-sm truncate">
                        {session.jd_filename}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span className="text-[#2E86AB]">
                        {session.total_courses} courses
                      </span>
                      <span className="text-[#F18F01]">
                        {session.total_hours}h total
                      </span>
                      <span className="text-purple-400">
                        {Math.round((session.match_score || 0) * 100)}% match
                      </span>
                      <span>
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-600 group-hover:text-[#2E86AB] 
                  transition-colors text-xl ml-4">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
