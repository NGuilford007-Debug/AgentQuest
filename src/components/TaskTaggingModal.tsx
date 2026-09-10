import React, { useState, useEffect } from "react";
import { X, Tag, Building2, Folder, Plus, Check, Trash2, Sparkles } from "lucide-react";
import { TaskExecutionRecord } from "../types";

interface TaskTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskExecutionRecord | null;
  existingProjects?: string[];
  existingClients?: string[];
  existingTags?: string[];
  onSave: (updatedTask: TaskExecutionRecord) => void;
}

export const TaskTaggingModal: React.FC<TaskTaggingModalProps> = ({
  isOpen,
  onClose,
  task,
  existingProjects = [],
  existingClients = [],
  existingTags = [],
  onSave,
}) => {
  const [client, setClient] = useState<string>("");
  const [project, setProject] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isCreatingNewClient, setIsCreatingNewClient] = useState<boolean>(false);
  const [isCreatingNewProject, setIsCreatingNewProject] = useState<boolean>(false);

  useEffect(() => {
    if (task) {
      setClient(task.client || "");
      setProject(task.project || "");
      setTags(task.tags ? [...task.tags] : []);
      setCustomTagInput("");
      setIsCreatingNewClient(false);
      setIsCreatingNewProject(false);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9_-]/g, "-");
    if (!cleanTag) return;
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setCustomTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDownTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(customTagInput);
    }
  };

  const handleSave = () => {
    if (!task) return;
    const updatedTask: TaskExecutionRecord = {
      ...task,
      client: client.trim() !== "" ? client.trim() : undefined,
      project: project.trim() !== "" ? project.trim() : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
    onSave(updatedTask);
    onClose();
  };

  // Quick suggestions: tags not yet selected
  const suggestedTags = existingTags.filter((t) => !tags.includes(t));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Categorize Task Execution
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Assign client, initiative project, and tags for granular ROI reporting
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Snippet Banner */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
              {task.title}
            </span>
            <span className="font-mono">{task.hoursSaved}h saved</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 italic">
            "{task.summary || task.prompt || task.inputPayload}"
          </p>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Client Assignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Client Account</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isCreatingNewClient ? "Select existing" : "+ New client"}
              </button>
            </label>

            {isCreatingNewClient ? (
              <input
                id="input-custom-client"
                type="text"
                placeholder="Enter client or stakeholder name (e.g. Acme Corp)"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex gap-2">
                <select
                  id="select-modal-client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">No Client (Internal / General Operations)</option>
                  {existingClients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {client && (
                  <button
                    type="button"
                    onClick={() => setClient("")}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Clear client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Project Assignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-cyan-500" />
                <span>Project / Campaign Initiative</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNewProject(!isCreatingNewProject)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isCreatingNewProject ? "Select existing" : "+ New project"}
              </button>
            </label>

            {isCreatingNewProject ? (
              <input
                id="input-custom-project"
                type="text"
                placeholder="Enter project name (e.g. Q4 Website Redesign)"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="flex gap-2">
                <select
                  id="select-modal-project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">No Specific Project (Ad-hoc automation)</option>
                  {existingProjects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {project && (
                  <button
                    type="button"
                    onClick={() => setProject("")}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Clear project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tags Manager */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>Task Categorization Tags</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Press Enter or comma to add
              </span>
            </label>

            {/* Current Active Tags */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 min-h-[50px] flex flex-wrap items-center gap-1.5">
              {tags.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No tags assigned yet. Add tags below or click from suggestions.
                </span>
              ) : (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-red-500 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-new-tag"
                  type="text"
                  placeholder="Type new tag and press Enter..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleKeyDownTagInput}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddTag(customTagInput)}
                disabled={!customTagInput.trim()}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Suggested Existing Tags */}
            {suggestedTags.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Suggested from other completions:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {suggestedTags.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>#{tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setClient("");
              setProject("");
              setTags([]);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            Clear All Metadata
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-task-tags"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Categorization</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
