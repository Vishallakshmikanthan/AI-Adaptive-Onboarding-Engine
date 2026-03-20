"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ReasoningTraceProps {
  trace: string;
}

export default function ReasoningTrace({ trace }: ReasoningTraceProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button — fixed right edge, vertically centered */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50
                     bg-[#2E86AB] text-white px-2 py-4 rounded-l-lg
                     shadow-lg hover:bg-[#256d8a] transition-colors
                     [writing-mode:vertical-lr] text-sm font-semibold tracking-wide"
        >
          AI Reasoning
        </button>
      )}

      {/* Slide-in Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[320px] z-50
                       bg-[#111827] border-l border-gray-700 shadow-2xl
                       flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h2 className="text-teal-300 font-semibold text-base">
                AI Reasoning Trace
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-teal-300/90 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {trace}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
