"use client";
import { useState } from "react";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    localStorage.setItem(
      "user_feedback",
      JSON.stringify({
        rating,
        timestamp: new Date().toISOString(),
      })
    );
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
      }, 300);
    }, 1800);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40
          bg-[#161B27]
          border border-[rgba(255,255,255,0.08)]
          hover:border-[rgba(79,158,248,0.3)]
          hover:bg-[rgba(79,158,248,0.05)]
          text-[rgba(255,255,255,0.4)]
          hover:text-[rgba(255,255,255,0.9)]
          text-[11px] px-3 py-2 rounded-full
          transition-all duration-200
          flex items-center gap-2 shadow-lg"
      >
        <span>💬</span>
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end p-6">
          <div className="bg-[#161B27] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 w-72 pointer-events-auto shadow-2xl">
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">🎉</div>
                <p className="text-sm font-semibold text-[#10B981]">
                  Thanks for the feedback!
                </p>
                <p className="text-[11px] text-[rgba(255,255,255,0.4)] mt-1">
                  It means a lot to us
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-[rgba(255,255,255,0.9)]">
                      How was your experience?
                    </p>
                    <p className="text-[10px] text-[rgba(255,255,255,0.3)] mt-0.5">
                      Takes 2 seconds
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.9)] text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="flex justify-center gap-3 mb-5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={`text-2xl transition-all duration-150 hover:scale-125 ${
                        n <= rating ? "opacity-100 scale-110" : "opacity-25"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <p className="text-center text-xs text-[rgba(255,255,255,0.4)] mb-4">
                    {rating === 5
                      ? "Excellent! 🚀"
                      : rating === 4
                      ? "Great! 👍"
                      : rating === 3
                      ? "Good 😊"
                      : rating === 2
                      ? "Needs work 🤔"
                      : "Sorry to hear that 😢"}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={rating === 0}
                  className="w-full py-2.5 rounded-[10px] text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background:
                      rating > 0
                        ? "linear-gradient(135deg, #4F9EF8, #7C3AED)"
                        : "rgba(255,255,255,0.05)",
                    color: rating > 0 ? "#060810" : "inherit",
                  }}
                >
                  Submit Feedback
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
