"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, CheckCircle2 } from "lucide-react";

interface ReasoningTraceProps {
  trace: string;
}

interface ParsedStep {
  number: string;
  title: string;
  explanation: string;
}

export default function ReasoningTrace({ trace }: ReasoningTraceProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse reasoning trace
  const parseTrace = (text: string): ParsedStep[] => {
    if (!text) return [];
    
    // Split by numbered list pattern (e.g., "1.", "2.", "3.")
    // We use a regex to find all instances of digits followed by a dot
    const matches = Array.from(text.matchAll(/(?:^|\n)(\d+)\.\s+\*\*(.*?)\*\*(?:[:\s]*)([\s\S]*?)(?=(?:\n\d+\.\s+\*\*|$))/g));
    
    if (matches.length > 0) {
      return matches.map(match => ({
        number: match[1].trim(),
        title: match[2].trim(),
        explanation: match[3].trim()
      }));
    }

    // Fallback if formatting doesn't match perfectly, just try to split by numbers
    const parts = text.split(/(?:^|\n)\d+\.\s+/);
    if (parts.length > 1) {
       return parts.slice(1).map((part, index) => {
         const titleMatch = part.match(/^\*\*(.*?)\*\*/);
         if (titleMatch) {
            return {
              number: (index + 1).toString(),
              title: titleMatch[1],
              explanation: part.replace(titleMatch[0], "").replace(/^[:\s]+/, "").trim()
            };
         }
         return {
           number: (index + 1).toString(),
           title: "Step " + (index + 1),
           explanation: part.trim()
         };
       });
    }

    return [];
  };

  const steps = parseTrace(trace);

  return (
    <>
      {/* Toggle Button — fixed right edge, vertically centered */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50
                     bg-[#2E86AB] text-white px-2 py-4 rounded-l-lg
                     shadow-lg hover:bg-[#256d8a] transition-colors
                     flex flex-col items-center justify-center gap-2"
        >
          <div className="relative">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <span className="[writing-mode:vertical-lr] text-sm font-semibold tracking-wide">
            AI Reasoning
          </span>
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
            className="fixed right-0 top-0 h-full w-[380px] sm:w-[420px] z-50
                       bg-[#111827] border-l border-gray-700 shadow-2xl
                       flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-700 bg-gradient-to-r from-[#111827] to-[#1A2035]">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Brain className="text-[#2E86AB] w-5 h-5" />
                  <h2 className="text-white font-bold text-lg">
                    AI Reasoning Trace
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-[#2E86AB]/10 text-[#2E86AB] px-2 py-0.5 rounded-full font-medium border border-[#2E86AB]/20">
                    Powered by OpenRouter
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 p-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400 ml-7">How the AI analyzed your profile</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[#2E86AB]/30 scrollbar-track-transparent">
              {steps.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {steps.map((step, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 + 0.1, duration: 0.4 }}
                      key={index}
                      className="bg-[#151D30] rounded-xl p-4 border-l-2 border-[#2E86AB] shadow-md relative"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#2E86AB] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                          {step.number}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <h3 className="font-semibold text-white text-sm">
                            {step.title}
                          </h3>
                          <p className="text-xs text-gray-300 leading-relaxed mt-1.5 break-words">
                            {step.explanation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Footer Summary Card */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: steps.length * 0.15 + 0.3 }}
                    className="mt-2 bg-[#2E86AB]/10 border border-[#2E86AB]/20 rounded-xl p-3 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Analysis complete. Your personalized pathway has been generated based on the above reasoning.
                    </p>
                  </motion.div>
                </div>
              ) : (
                <pre className="text-teal-300/90 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {trace}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
