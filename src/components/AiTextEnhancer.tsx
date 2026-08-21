import React, { useState } from "react";
import { Sparkles, Loader2, Check, RefreshCw, Sliders, Wand2, X } from "lucide-react";

interface AiTextEnhancerProps {
  value: string;
  onApply: (enhancedText: string) => void;
  contextType?: "prompt" | "system_instruction" | "report_brief" | "workflow_description" | "email" | "code_spec";
  placeholder?: string;
  className?: string;
}

export const AiTextEnhancer: React.FC<AiTextEnhancerProps> = ({
  value,
  onApply,
  contextType = "prompt",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [mode, setMode] = useState<"enterprise" | "concise" | "creative" | "bullet_points">("enterprise");
  const [enhancedResult, setEnhancedResult] = useState<string | null>(null);

  const handleEnhance = async (selectedMode = mode) => {
    if (!value || !value.trim()) return;
    setIsEnhancing(true);
    setEnhancedResult(null);

    try {
      const res = await fetch("/api/gemini/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          contextType,
          mode: selectedMode,
        }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setEnhancedResult(data.enhancedText);
      } else {
        setEnhancedResult(generateLocalEnhanced(value, selectedMode, contextType));
      }
    } catch (e) {
      setEnhancedResult(generateLocalEnhanced(value, selectedMode, contextType));
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateLocalEnhanced = (raw: string, m: string, ctx: string) => {
    const trimmed = raw.trim();
    if (m === "concise") {
      return `Direct objective: ${trimmed}. Deliver high-fidelity structured output without conversational preamble.`;
    }
    if (m === "bullet_points") {
      return `### Specific Task Directives:\n- Primary Objective: ${trimmed}\n- Structural Schema: Return verified enterprise markdown with tabular benchmarks.\n- Governance: Ensure zero hallucination, strict typing, and auditable verification.`;
    }
    if (m === "creative") {
      return `Synthesize an innovative, high-impact approach to: "${trimmed}". Provide cutting-edge industry methodologies, creative strategic angles, and comprehensive execution blueprints.`;
    }
    return `[ENTERPRISE SPECIFICATION]\nObjective: ${trimmed}\nDeliverables:\n1. Structured analysis and technical implementation.\n2. Key performance metrics & ROI savings.\n3. Risk mitigation and governance compliance.\nFormat: High-craft Markdown format.`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && value.trim() && !enhancedResult) {
            handleEnhance(mode);
          }
        }}
        disabled={!value.trim()}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border shadow-2xs ${
          value.trim()
            ? "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
            : "bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
        }`}
        title="Enhance prompt with AI (Expand, Polish, Structure)"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
        <span>AI Enhance</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-80 sm:w-96 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/80 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                AI Prompt & Text Enhancer
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
            {[
              { id: "enterprise", label: "Enterprise" },
              { id: "concise", label: "Concise" },
              { id: "bullet_points", label: "Structured" },
              { id: "creative", label: "Creative" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id as any);
                  handleEnhance(tab.id as any);
                }}
                className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                  mode === tab.id
                    ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          {isEnhancing ? (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center text-xs text-purple-600 dark:text-purple-400 font-medium">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Optimizing prompt schema with Gemini...</span>
            </div>
          ) : enhancedResult ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-xs text-slate-700 dark:text-slate-200 font-mono max-h-44 overflow-y-auto whitespace-pre-wrap">
                {enhancedResult}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleEnhance(mode)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApply(enhancedResult);
                    setIsOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Enhanced Text</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              Type or select prompt text above to enhance.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
