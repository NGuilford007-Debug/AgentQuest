import React, { useState, useEffect } from "react";
import { ActiveTaskSession, Agent, Department } from "../types";
import { 
  CheckSquare, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Bot, 
  Target,
  Sparkles,
  Maximize2,
  Minimize2
} from "lucide-react";

interface TaskFocusHUDProps {
  session: ActiveTaskSession | null;
  agents: Agent[];
  onUpdateSession: (updated: ActiveTaskSession) => void;
  onDispatchTaskWithAgent: (taskTitle: string, taskDesc: string, agentId: string) => void;
}

export const TaskFocusHUD: React.FC<TaskFocusHUDProps> = ({
  session,
  agents,
  onUpdateSession,
  onDispatchTaskWithAgent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  // Default initial session if none provided
  const currentSession: ActiveTaskSession = session || {
    id: "task-session-1",
    title: "Triaging P0 Production Alert & Verifying Patch",
    department: "Engineering",
    description: "Automate log parsing, generate remediation PR, and require SRE lead signoff.",
    checklist: [
      { id: "c-1", text: "Parse Datadog error payload & identify impacted endpoints", completed: true },
      { id: "c-2", text: "Run Gemini SRE analysis for root cause remediation", completed: true },
      { id: "c-3", text: "Require HITL Staff SRE approval before pushing to prod", completed: false },
      { id: "c-4", text: "Dispatch resolved notification to Slack #war-room", completed: false },
    ],
    scratchpad: "Observing 504 gateway timeouts on /v1/checkout. DB connection pool exhausted.",
    startedAt: new Date().toISOString(),
    elapsedSeconds: 420,
    isRunning: true,
    assignedAgentId: agents[0]?.id || "agent-1",
  };

  // Timer interval effect
  useEffect(() => {
    if (!currentSession.isRunning) return;

    const interval = setInterval(() => {
      onUpdateSession({
        ...currentSession,
        elapsedSeconds: currentSession.elapsedSeconds + 1,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession.isRunning, currentSession.elapsedSeconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleChecklist = (id: string) => {
    const updatedChecklist = currentSession.checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdateSession({
      ...currentSession,
      checklist: updatedChecklist,
    });
  };

  const addChecklistItem = () => {
    if (!newSubtaskText.trim()) return;
    const newItem = {
      id: `c-${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false,
    };
    onUpdateSession({
      ...currentSession,
      checklist: [...currentSession.checklist, newItem],
    });
    setNewSubtaskText("");
  };

  const removeChecklistItem = (id: string) => {
    onUpdateSession({
      ...currentSession,
      checklist: currentSession.checklist.filter((i) => i.id !== id),
    });
  };

  const toggleTimer = () => {
    onUpdateSession({
      ...currentSession,
      isRunning: !currentSession.isRunning,
    });
  };

  const resetTimer = () => {
    onUpdateSession({
      ...currentSession,
      elapsedSeconds: 0,
    });
  };

  const assignedAgent = agents.find((a) => a.id === currentSession.assignedAgentId) || agents[0];
  const completedCount = currentSession.checklist.filter((c) => c.completed).length;
  const totalCount = currentSession.checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div 
      id="task-focus-hud-container"
      className="fixed bottom-4 right-4 z-40 w-[94vw] sm:w-[460px] max-w-[96vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all overflow-hidden"
    >
      {/* Top Header Bar */}
      <div 
        className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Active Focus Task
              </span>
              <span className="text-[10px] text-slate-400">
                {completedCount}/{totalCount} Done ({progressPercent}%)
              </span>
            </div>
            <h4 className="text-xs font-bold truncate text-slate-100">
              {currentSession.title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Live Timer Pill */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400"
            onClick={(e) => {
              e.stopPropagation();
              toggleTimer();
            }}
            title={currentSession.isRunning ? "Click to pause timer" : "Click to start timer"}
          >
            <Clock className={`w-3 h-3 ${currentSession.isRunning ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
            <span>{formatTime(currentSession.elapsedSeconds)}</span>
          </div>

          <button
            id="toggle-task-hud"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
        <div 
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
          {/* Mission Title Edit & Agent Assignment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Mission Objective
              </label>
              <button
                onClick={() => {
                  if (isEditingTitle) {
                    if (tempTitle.trim()) {
                      onUpdateSession({ ...currentSession, title: tempTitle.trim() });
                    }
                    setIsEditingTitle(false);
                  } else {
                    setTempTitle(currentSession.title);
                    setIsEditingTitle(true);
                  }
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingTitle ? "Save" : "Edit"}</span>
              </button>
            </div>

            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (tempTitle.trim()) {
                      onUpdateSession({ ...currentSession, title: tempTitle.trim() });
                    }
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-400 text-xs font-semibold text-slate-900 dark:text-white"
                autoFocus
              />
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {currentSession.title}
              </p>
            )}

            {/* Agent Pairing */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Assigned AI:</span>
              <select
                id="hud-assigned-agent-select"
                value={currentSession.assignedAgentId || ""}
                onChange={(e) => onUpdateSession({ ...currentSession, assignedAgentId: e.target.value })}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtask Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Action Checklist
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {completedCount} of {totalCount} completed
              </span>
            </div>

            <div className="space-y-1.5">
              {currentSession.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
                >
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer select-none"
                    onClick={() => toggleChecklist(item.id)}
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={`${item.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200 font-medium"}`}>
                      {item.text}
                    </span>
                  </div>
                  <button
                    onClick={() => removeChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask input */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addChecklistItem();
                }}
                placeholder="+ Add task milestone..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addChecklistItem}
                disabled={!newSubtaskText.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          {/* Quick Scratchpad */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Session Scratchpad & Notes
            </label>
            <textarea
              rows={2}
              value={currentSession.scratchpad}
              onChange={(e) => onUpdateSession({ ...currentSession, scratchpad: e.target.value })}
              placeholder="Keep working notes, key entity IDs, or logs here..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bottom Action Controls */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTimer}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                {currentSession.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{currentSession.isRunning ? "Pause" : "Resume"}</span>
              </button>
              <button
                onClick={resetTimer}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Reset session clock"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <button
              id="btn-dispatch-active-mission"
              onClick={() => {
                onDispatchTaskWithAgent(
                  currentSession.title,
                  `${currentSession.description}\n\nContext Notes:\n${currentSession.scratchpad}`,
                  assignedAgent.id
                );
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Send className="w-3 h-3" />
              <span>Run in Dispatcher</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
