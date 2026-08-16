import React, { useState } from "react";
import { Agent, AgentTemplate, Department } from "../types";
import { AGENT_TEMPLATES } from "../data/agentTemplates";
import { 
  Bot, 
  Sparkles, 
  X, 
  Search, 
  Check, 
  Zap, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Flame, 
  Layers, 
  Sliders, 
  Cpu, 
  ArrowRight,
  Filter,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

interface AgentTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: AgentTemplate, autoDeploy?: boolean) => void;
}

export const AgentTemplateModal: React.FC<AgentTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<AgentTemplate | null>(null);

  if (!isOpen) return null;

  const departments: (string)[] = [
    "all",
    "DevOps & SecOps",
    "Customer Support",
    "Finance & Legal",
    "Sales & CRM",
    "Engineering",
    "Marketing",
    "HR & People Ops",
    "Operations",
  ];

  const filteredTemplates = AGENT_TEMPLATES.filter((tmpl) => {
    if (selectedDept !== "all" && tmpl.department !== selectedDept) return false;
    if (selectedDifficulty !== "all" && tmpl.difficultyTier !== selectedDifficulty) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.role.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q) ||
        tmpl.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Enterprise Agent Archetype Templates
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  {AGENT_TEMPLATES.length} Archetypes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Production-ready autonomous AI agent blueprints with optimized prompts, models, and least-privilege permissions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates (e.g. SRE, TicketHero, Invoice, SQL, Recruiter)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                <Filter className="w-3.5 h-3.5" /> Complexity:
              </span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Department Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDept === dept
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {dept === "all" ? "All Departments" : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid / Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const isSelected = previewTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                    template.featured
                      ? "border-blue-300 dark:border-blue-800/80 ring-1 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name, Department */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={template.avatar}
                          alt={template.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                              {template.name}
                            </h3>
                            {template.featured && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {template.role}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          template.difficultyTier === "Beginner"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : template.difficultyTier === "Intermediate"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : template.difficultyTier === "Advanced"
                            ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                            : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {template.difficultyTier}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {template.description}
                    </p>

                    {/* Metadata Badges: Model, Autonomy, Hours Saved */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">AI Foundation:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {template.model}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">Autonomy Tier:</span>
                        <span className="font-semibold uppercase text-[10px]">
                          {template.autonomyLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">Est. ROI Impact:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>~{template.estimatedHoursSavedPerMonth}h / mo</span>
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Inspect Prompt
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(template, false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors"
                        title="Open in Agent Builder to customize"
                      >
                        Customize
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(template, true);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
                        title="Instantiate directly into active fleet"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Deploy</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Inspection Drawer Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <img
                    src={previewTemplate.avatar}
                    alt={previewTemplate.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {previewTemplate.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {previewTemplate.department} • {previewTemplate.model}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white mb-1">
                    System Instruction & Prompt Blueprint:
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed border border-slate-800">
                    {previewTemplate.systemPrompt}
                  </pre>
                </div>

                {previewTemplate.suggestedPrompts && (
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white mb-1.5">
                      Sample Invocations:
                    </div>
                    <div className="space-y-1.5">
                      {previewTemplate.suggestedPrompts.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          "{p}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate(previewTemplate, true);
                    setPreviewTemplate(null);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Deploy This Template</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
