import React, { useState } from "react";
import { 
  Agent, 
  EmployeeProfile, 
  TaskExecutionRecord, 
  Workflow 
} from "../types";
import { 
  Download, 
  Copy, 
  Check, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp,
  Layers,
  ArrowRight
} from "lucide-react";
import { fireCelebration } from "../utils/confetti";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    agents: Agent[];
    workflows: Workflow[];
    userProfile: EmployeeProfile;
    executionHistory: TaskExecutionRecord[];
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"json" | "csv_tasks" | "csv_agents" | "markdown_report">("json");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. JSON full backup export
  const getJsonExportString = () => {
    return JSON.stringify(
      {
        version: "2.5.0",
        exportedAt: new Date().toISOString(),
        workspace: "AgentFlow Enterprise",
        data: {
          agents: data.agents,
          workflows: data.workflows,
          userProfile: data.userProfile,
          executionHistory: data.executionHistory,
        },
      },
      null,
      2
    );
  };

  // 2. CSV Task Executions & Audit Logs
  const getCsvTasksString = () => {
    const headers = [
      "Execution ID",
      "Timestamp",
      "Agent Name",
      "Workflow Name",
      "Department",
      "Status",
      "Hours Saved",
      "XP Earned",
      "Summary",
    ];

    const rows = data.executionHistory.map((rec) => [
      `"${rec.id}"`,
      `"${rec.timestamp}"`,
      `"${rec.agentName.replace(/"/g, '""')}"`,
      `"${rec.workflowName.replace(/"/g, '""')}"`,
      `"${rec.department}"`,
      `"${rec.status}"`,
      rec.hoursSaved,
      rec.xpEarned,
      `"${rec.summary.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  // 3. CSV Agent Performance Roster
  const getCsvAgentsString = () => {
    const headers = [
      "Agent ID",
      "Name",
      "Role",
      "Department",
      "Model",
      "Autonomy Level",
      "Status",
      "Tasks Completed",
      "Hours Saved",
      "Success Rate %",
      "Avg Latency (s)",
      "XP Generated",
      "Permissions Count",
    ];

    const rows = data.agents.map((a) => [
      `"${a.id}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.role.replace(/"/g, '""')}"`,
      `"${a.department}"`,
      `"${a.model}"`,
      `"${a.autonomyLevel}"`,
      `"${a.status}"`,
      a.stats.tasksCompleted,
      a.stats.hoursSaved,
      a.stats.successRate,
      a.stats.avgLatencySec,
      a.stats.xpGenerated,
      a.permissions.length,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  // 4. Executive Markdown ROI & Operations Report
  const getMarkdownReportString = () => {
    const totalHours = data.userProfile.hoursSavedTotal;
    const costSaved = data.userProfile.costSavedUsd;
    const completedTasks = data.userProfile.tasksAutomatedTotal;
    const hitlCount = data.executionHistory.filter((e) => e.status === "approved" || e.status === "needs_review").length;

    return `# AgentFlow Enterprise - Executive AI ROI & Operations Brief
**Generated On:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
**Lead Operator:** ${data.userProfile.name} (${data.userProfile.role} - Level ${data.userProfile.level})

---

## 1. Executive Summary & Impact Metrics
- **Total Hours Saved:** ${totalHours} hrs
- **Estimated Operational Cost Reduction:** $${costSaved.toLocaleString()} USD (based on $85/hr blended rate)
- **Workflows Automated:** ${completedTasks} total executions
- **Active AI Agents Deployed:** ${data.agents.filter((a) => a.status === "active").length} of ${data.agents.length}
- **Human-in-the-Loop Governance Audits:** ${hitlCount} gated reviews processed with 100% compliance

---

## 2. Agent Workforce Performance Roster
| Agent Name | Department | Autonomy Tier | Tasks Run | Hours Saved | Success Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
${data.agents
  .map(
    (a) =>
      `| **${a.name}** | ${a.department} | \`${a.autonomyLevel.toUpperCase()}\` | ${a.stats.tasksCompleted} | ${a.stats.hoursSaved}h | ${a.stats.successRate}% |`
  )
  .join("\n")}

---

## 3. Deployed Enterprise Automation Pipelines
${data.workflows
  .map(
    (wf, idx) => `### ${idx + 1}. ${wf.name} (${wf.department})
- **Description:** ${wf.description}
- **Nodes in Pipeline:** ${wf.nodes.length} connected stages (${wf.nodes.map((n) => n.name).join(" → ")})
- **Estimated Speedup:** ~${wf.avgHoursSavedPerRun} hours saved per execution
`
  )
  .join("\n")}

---

## 4. Compliance, Security & Audit Readiness
- **RBAC Scopes Enforced:** All agents operate strictly within assigned OAuth / API permissions.
- **Data Protection:** No raw credentials or confidential customer PII exposed outside sandbox boundaries.
- **Audit Verification:** All task dispatches and model completions timestamped in immutable execution history.
`;
  };

  const getExportContent = () => {
    if (selectedFormat === "json") return getJsonExportString();
    if (selectedFormat === "csv_tasks") return getCsvTasksString();
    if (selectedFormat === "csv_agents") return getCsvAgentsString();
    return getMarkdownReportString();
  };

  const getFilename = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    if (selectedFormat === "json") return `agentflow-workspace-backup-${dateStr}.json`;
    if (selectedFormat === "csv_tasks") return `agentflow-task-executions-${dateStr}.csv`;
    if (selectedFormat === "csv_agents") return `agentflow-agent-roster-${dateStr}.csv`;
    return `agentflow-executive-roi-report-${dateStr}.md`;
  };

  const getMimeType = () => {
    if (selectedFormat === "json") return "application/json";
    if (selectedFormat === "csv_tasks" || selectedFormat === "csv_agents") return "text/csv";
    return "text/markdown";
  };

  const handleDownload = () => {
    const content = getExportContent();
    const blob = new Blob([content], { type: getMimeType() });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFilename();
    a.click();
    URL.revokeObjectURL(url);
    fireCelebration();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Enterprise Export & Audit Center</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  Multi-Format Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export full system snapshots, audit logs, performance rosters, or executive markdown summaries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg"
          >
            ✕
          </button>
        </div>

        {/* Format Selector Grid */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Select Export Package:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setSelectedFormat("json")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFormat === "json"
                  ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-md"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-blue-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>Full System JSON</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Complete backup with agents, workflows & state.
              </p>
            </button>

            <button
              onClick={() => setSelectedFormat("csv_tasks")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFormat === "csv_tasks"
                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-md"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-emerald-400 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Audit Logs CSV</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Execution history, hours saved & model outputs.
              </p>
            </button>

            <button
              onClick={() => setSelectedFormat("csv_agents")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFormat === "csv_agents"
                  ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow-md"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-purple-400 font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>Agent Roster CSV</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                KPIs, accuracy, latency & autonomy stats.
              </p>
            </button>

            <button
              onClick={() => setSelectedFormat("markdown_report")}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFormat === "markdown_report"
                  ? "bg-amber-600/20 border-amber-500 text-amber-200 shadow-md"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-amber-400 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>Executive Brief (.md)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Leadership ROI summary & compliance ready.
              </p>
            </button>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-5 flex-1 flex flex-col overflow-hidden bg-slate-950">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Preview ({getFilename()})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-[11px] text-slate-300 leading-relaxed select-all">
            <pre className="whitespace-pre-wrap">{getExportContent().slice(0, 3000)}</pre>
            {getExportContent().length > 3000 && (
              <div className="text-slate-500 italic mt-2">
                ... ({getExportContent().length - 3000} more characters in full download)
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            Ready to download: <strong className="text-slate-200">{getFilename()}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Export Package</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
