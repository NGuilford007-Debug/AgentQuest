import React, { useState, useRef, useEffect } from "react";
import { 
  SaveStateSnapshot, 
  Agent, 
  Workflow, 
  EmployeeProfile, 
  TaskExecutionRecord, 
  ActiveTaskSession 
} from "../types";
import { 
  Save, 
  FolderArchive, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Trash2, 
  Clock, 
  Layers, 
  FileText, 
  Plus, 
  X, 
  AlertTriangle,
  HardDrive,
  Copy,
  Sparkles,
  Database,
  Eraser,
  RefreshCw,
  Shield,
  CreditCard,
  Archive,
  SlidersHorizontal,
  FileSpreadsheet
} from "lucide-react";
import { INITIAL_AGENTS, INITIAL_USER_PROFILE, INITIAL_WORKFLOWS, LEADERBOARD_USERS } from "../data/initialData";

interface SaveStateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: {
    agents: Agent[];
    workflows: Workflow[];
    userProfile: EmployeeProfile;
    executionHistory: TaskExecutionRecord[];
    activeTaskSession?: ActiveTaskSession | null;
    auditLogsCount?: number;
    tenantsBillingCount?: number;
    approvedAutomationsCount?: number;
    savedReportsCount?: number;
    clientAgentRequestsCount?: number;
  };
  onRestoreState: (snapshotData: SaveStateSnapshot["data"]) => void;
  onResetToDefaults: () => void;
  onResetToCleanSlate?: () => void;
  onClearExecutionHistory?: () => void;
  onClearAuditLogs?: () => void;
  onClearTenantsBilling?: () => void;
  onClearApprovedAutomations?: () => void;
  onClearSavedReports?: () => void;
  onClearAllMockData?: () => void;
}

const STORAGE_KEY = "agentflow_save_states";

export const SaveStateManager: React.FC<SaveStateManagerProps> = ({
  isOpen,
  onClose,
  currentData,
  onRestoreState,
  onResetToDefaults,
  onResetToCleanSlate,
  onClearExecutionHistory,
  onClearAuditLogs,
  onClearTenantsBilling,
  onClearApprovedAutomations,
  onClearSavedReports,
  onClearAllMockData,
}) => {
  const [activeTab, setActiveTab] = useState<"snapshots" | "cleanslate">("snapshots");
  const [snapshots, setSnapshots] = useState<SaveStateSnapshot[]>(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse save states", e);
      }
    }
    // Default initial snapshot
    return [
      {
        id: "snap-default",
        name: "Enterprise Initial Baseline",
        description: "Standard preset with 4 specialized agents and 3 core workflows.",
        timestamp: new Date().toISOString(),
        agentsCount: currentData.agents?.length || 4,
        workflowsCount: currentData.workflows?.length || 3,
        executionsCount: currentData.executionHistory?.length || 0,
        data: {
          agents: INITIAL_AGENTS,
          workflows: INITIAL_WORKFLOWS,
          userProfile: INITIAL_USER_PROFILE,
          executionHistory: [],
        },
      },
    ];
  });

  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [newSnapshotDesc, setNewSnapshotDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  
  // Confirmations
  const [confirmPresetReset, setConfirmPresetReset] = useState(false);
  const [confirmCleanSlate, setConfirmCleanSlate] = useState(false);
  const [confirmPurgeExecutions, setConfirmPurgeExecutions] = useState(false);
  const [confirmPurgeBilling, setConfirmPurgeBilling] = useState(false);
  const [confirmPurgeVault, setConfirmPurgeVault] = useState(false);
  const [confirmPurgeAll, setConfirmPurgeAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync snapshots to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
      } catch (e) {
        console.warn("Failed to persist save states", e);
      }
    }
  }, [snapshots]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3500);
  };

  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) return;

    const newSnapshot: SaveStateSnapshot = {
      id: `snap-${Date.now()}`,
      name: newSnapshotName.trim(),
      description: newSnapshotDesc.trim() || "Manual workspace checkpoint",
      timestamp: new Date().toISOString(),
      agentsCount: currentData.agents.length,
      workflowsCount: currentData.workflows.length,
      executionsCount: currentData.executionHistory.length,
      data: {
        agents: JSON.parse(JSON.stringify(currentData.agents)),
        workflows: JSON.parse(JSON.stringify(currentData.workflows)),
        userProfile: JSON.parse(JSON.stringify(currentData.userProfile)),
        executionHistory: JSON.parse(JSON.stringify(currentData.executionHistory)),
        activeTaskSession: currentData.activeTaskSession ? JSON.parse(JSON.stringify(currentData.activeTaskSession)) : null,
      },
    };

    setSnapshots([newSnapshot, ...snapshots]);
    setNewSnapshotName("");
    setNewSnapshotDesc("");
    setIsCreating(false);
    showNotification(`Created save state: "${newSnapshot.name}"`);
  };

  const handleRestore = (snap: SaveStateSnapshot) => {
    if (window.confirm(`Are you sure you want to restore "${snap.name}"? Current unsaved modifications will be replaced.`)) {
      onRestoreState(snap.data);
      showNotification(`Restored state: "${snap.name}"`);
      onClose();
    }
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    if (snapshots.length <= 1) {
      alert("You must keep at least one save state.");
      return;
    }
    setSnapshots(snapshots.filter((s) => s.id !== id));
    showNotification(`Deleted snapshot "${name}"`);
  };

  // Export full project state as a JSON file
  const handleExportJSON = () => {
    const exportPayload = {
      version: "1.0",
      appName: "AgentFlow Enterprise",
      exportedAt: new Date().toISOString(),
      state: {
        agents: currentData.agents,
        workflows: currentData.workflows,
        userProfile: currentData.userProfile,
        executionHistory: currentData.executionHistory,
        activeTaskSession: currentData.activeTaskSession,
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agentflow-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification("Workspace backup downloaded as JSON!");
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const stateData = parsed.state || parsed;

        if (!stateData.agents || !stateData.workflows) {
          throw new Error("Invalid workspace schema. Missing agents or workflows.");
        }

        onRestoreState({
          agents: stateData.agents,
          workflows: stateData.workflows,
          userProfile: stateData.userProfile || currentData.userProfile,
          executionHistory: stateData.executionHistory || [],
          activeTaskSession: stateData.activeTaskSession || null,
        });

        // Also add as a snapshot
        const importedSnapshot: SaveStateSnapshot = {
          id: `snap-import-${Date.now()}`,
          name: `Imported Backup (${file.name.replace(".json", "")})`,
          description: `Imported on ${new Date().toLocaleDateString()}`,
          timestamp: new Date().toISOString(),
          agentsCount: stateData.agents.length,
          workflowsCount: stateData.workflows.length,
          executionsCount: (stateData.executionHistory || []).length,
          data: stateData,
        };

        setSnapshots([importedSnapshot, ...snapshots]);
        showNotification(`Successfully imported "${file.name}"!`);
        onClose();
      } catch (err: any) {
        alert(`Failed to import file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div 
      id="save-state-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="save-state-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Save States, Backups & Data Management</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Manage checkpoints, clear mock data, reset baseline presets, and import/export JSON backups.
              </p>
            </div>
          </div>
          <button
            id="close-save-state-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            id="tab-btn-snapshots"
            onClick={() => setActiveTab("snapshots")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "snapshots"
                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Workspace Snapshots</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 text-[10px]">
              {snapshots.length}
            </span>
          </button>

          <button
            id="tab-btn-cleanslate"
            onClick={() => setActiveTab("cleanslate")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "cleanslate"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Mock Data & Clean Slate Hub</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[10px]">
              Clear / Reset
            </span>
          </button>
        </div>

        {/* Action notification banner */}
        {actionSuccessMsg && (
          <div className="px-4 sm:px-6 py-2.5 bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-inner">
            <Check className="w-4 h-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* ========================================================================= */}
          {/* TAB 1: SNAPSHOTS & BACKUPS */}
          {/* ========================================================================= */}
          {activeTab === "snapshots" && (
            <div className="space-y-5">
              {/* Top Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-create-new-snapshot"
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save New Snapshot</span>
                  </button>
                  <button
                    id="btn-export-backup-json"
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Backup (JSON)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                  <button
                    id="btn-import-backup-json"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                </div>
              </div>

              {/* New Snapshot Form */}
              {isCreating && (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      <span>Create New Save State</span>
                    </span>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    placeholder="Snapshot Name (e.g. Incident Response Sprint v2)"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />

                  <input
                    type="text"
                    value={newSnapshotDesc}
                    onChange={(e) => setNewSnapshotDesc(e.target.value)}
                    placeholder="Optional notes or context..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-save-snapshot"
                      onClick={handleCreateSnapshot}
                      disabled={!newSnapshotName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
                    >
                      Save State Now
                    </button>
                  </div>
                </div>
              )}

              {/* Snapshot List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Available Save States ({snapshots.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-emerald-500" />
                    <span>Auto-saved to browser local storage</span>
                  </span>
                </div>

                <div className="space-y-2.5">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      id={`snapshot-card-${snap.id}`}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {snap.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {new Date(snap.timestamp).toLocaleDateString()} {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {snap.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                          <span>{snap.agentsCount} Agents</span>
                          <span>•</span>
                          <span>{snap.workflowsCount} Workflows</span>
                          <span>•</span>
                          <span>{snap.executionsCount} Logs</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          id={`btn-restore-snapshot-${snap.id}`}
                          onClick={() => handleRestore(snap)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id, snap.name)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MOCK DATA & CLEAN SLATE HUB */}
          {/* ========================================================================= */}
          {activeTab === "cleanslate" && (
            <div className="space-y-6">
              
              {/* Introduction Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Eraser className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                    Workspace Mock Data & Telemetry Purge Controls
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Easily purge mock data, zero out execution statistics, wipe sample tenant billing invoices, or restore pristine default presets. All actions update state and persist directly to your local storage.
                </p>
              </div>

              {/* Real-time Workspace Inventory */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Current Workspace Data Inventory
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Agents</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{currentData.agents.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Workflows</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{currentData.workflows.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Execution Logs</span>
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">{currentData.executionHistory.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Audit Events</span>
                    <span className="text-base font-bold text-purple-600 dark:text-purple-400">{currentData.auditLogsCount ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Tenant Invoices</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{currentData.tenantsBillingCount ?? 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-500 block">Vault Automations</span>
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400">{currentData.approvedAutomationsCount ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              <div className="space-y-3.5">
                
                {/* 1. Complete Zero-State Wipe */}
                <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Eraser className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Wipe All Mock Data (Zero-State Clean Slate)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Clears execution logs, audit trails, tenant billing records, saved reports, active sessions, and resets hours saved to 0.0 hrs.
                    </p>
                  </div>

                  {confirmPurgeAll ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id="btn-confirm-purge-all"
                        onClick={() => {
                          if (onClearAllMockData) onClearAllMockData();
                          setConfirmPurgeAll(false);
                          showNotification("Wiped all mock data & reset to clean slate!");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Confirm Wipe
                      </button>
                      <button
                        onClick={() => setConfirmPurgeAll(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeAll(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border border-red-300 dark:border-red-800 text-xs font-bold transition-all shrink-0 shadow-2xs"
                    >
                      Wipe All Mock Data
                    </button>
                  )}
                </div>

                {/* 2. Restore Enterprise Baseline Presets */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Restore Enterprise Presets
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Restores standard 4 specialized demo agents, 3 pre-built workflows, and standard enterprise baseline metrics.
                    </p>
                  </div>

                  {confirmPresetReset ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id="btn-confirm-restore-presets"
                        onClick={() => {
                          onResetToDefaults();
                          setConfirmPresetReset(false);
                          showNotification("Restored workspace to Enterprise defaults!");
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Confirm Restore
                      </button>
                      <button
                        onClick={() => setConfirmPresetReset(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPresetReset(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 border border-blue-300 dark:border-blue-800 text-xs font-bold transition-all shrink-0 shadow-2xs"
                    >
                      Restore Presets
                    </button>
                  )}
                </div>

                {/* 3. Selective Purge: Execution History & Logs */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-slate-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Clear Execution Logs & Audit Trail
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Removes all past task run history ({currentData.executionHistory.length} logs) without deleting your configured agents or workflows.
                    </p>
                  </div>

                  {confirmPurgeExecutions ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (onClearExecutionHistory) onClearExecutionHistory();
                          if (onClearAuditLogs) onClearAuditLogs();
                          setConfirmPurgeExecutions(false);
                          showNotification("Cleared execution and audit logs!");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
                      >
                        Confirm Clear
                      </button>
                      <button
                        onClick={() => setConfirmPurgeExecutions(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeExecutions(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all shrink-0"
                    >
                      Clear Logs ({currentData.executionHistory.length})
                    </button>
                  )}
                </div>

                {/* 4. Selective Purge: Tenant Invoices & Stripe Receivables */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Clear Mock Stripe Invoices & Receivables
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Removes mock receivable billing records ({currentData.tenantsBillingCount ?? 0} invoices) from the Developer Monetization Hub.
                    </p>
                  </div>

                  {confirmPurgeBilling ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (onClearTenantsBilling) onClearTenantsBilling();
                          setConfirmPurgeBilling(false);
                          showNotification("Cleared mock Stripe invoices!");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
                      >
                        Confirm Clear
                      </button>
                      <button
                        onClick={() => setConfirmPurgeBilling(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeBilling(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all shrink-0"
                    >
                      Clear Invoices ({currentData.tenantsBillingCount ?? 0})
                    </button>
                  )}
                </div>

                {/* 5. Selective Purge: Approved Automations Vault */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Clear Approved Automations Vault
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Clears all saved approved automations ({currentData.approvedAutomationsCount ?? 0} items) from the vault.
                    </p>
                  </div>

                  {confirmPurgeVault ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (onClearApprovedAutomations) onClearApprovedAutomations();
                          setConfirmPurgeVault(false);
                          showNotification("Cleared approved automations vault!");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
                      >
                        Confirm Clear
                      </button>
                      <button
                        onClick={() => setConfirmPurgeVault(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPurgeVault(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all shrink-0"
                    >
                      Clear Vault ({currentData.approvedAutomationsCount ?? 0})
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Tip: Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-800 rounded">Ctrl+S</kbd> anytime to open this manager.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
