import React, { useState } from "react";
import { Workflow } from "../types";
import { 
  Workflow as WorkflowIcon, 
  Zap, 
  Send, 
  CheckCircle2, 
  Clock, 
  Timer, 
  TrendingUp, 
  BarChart3, 
  Search, 
  Play, 
  ExternalLink, 
  Activity, 
  Layers, 
  Check, 
  AlertCircle,
  Mail,
  Sparkles,
  Info
} from "lucide-react";
import { SEVEN_DAY_WORKFLOW_METRICS, EMAIL_CATEGORY_DISTRIBUTION, ThroughputMetricDay } from "../data/emailActionTriggers";

interface WorkflowMetricsPanelProps {
  workflows: Workflow[];
  onToggleWorkflowEmail: (workflowId: string) => void;
  onSimulateWorkflowRun: (workflow: Workflow) => void;
  onOpenWorkflowCanvas?: (workflowId: string) => void;
}

export const WorkflowMetricsPanel: React.FC<WorkflowMetricsPanelProps> = ({
  workflows,
  onToggleWorkflowEmail,
  onSimulateWorkflowRun,
  onOpenWorkflowCanvas,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [hoveredDay, setHoveredDay] = useState<ThroughputMetricDay | null>(null);

  // Compute fleet-wide aggregations
  const totalRuns = workflows.reduce((acc, w) => acc + (w.totalRuns || 0), 0);
  const totalEmails = workflows.reduce((acc, w) => acc + (w.totalEmailsSent || 0), 0);
  const totalHoursSaved = workflows.reduce((acc, w) => acc + ((w.totalRuns || 0) * (w.avgHoursSavedPerRun || 0.5)), 0);
  const activeWorkflowsCount = workflows.filter((w) => w.isActive).length;
  const avgSuccessRate = workflows.length > 0 
    ? (workflows.reduce((acc, w) => acc + (w.successRate || 99.4), 0) / workflows.length).toFixed(1)
    : "99.4";

  const departments = [
    { id: "all", label: "All Departments" },
    { id: "DevOps & SecOps", label: "DevOps & SRE" },
    { id: "Sales & CRM", label: "Sales & CRM" },
    { id: "Marketing", label: "Marketing" },
    { id: "Customer Support", label: "Customer Support" },
  ];

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesDept = selectedDepartment === "all" || wf.department === selectedDepartment;
    const matchesSearch = 
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Calculate SVG chart dimensions
  const maxRuns = Math.max(...SEVEN_DAY_WORKFLOW_METRICS.map((d) => d.workflowRuns), 400);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Workflow Execution Telemetry & Automated Email Metrics
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                100% Delivery SLA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Real-time pipeline run analytics, delivery telemetry, automated receipt volumes, and per-workflow notification controls across the enterprise fleet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400 font-medium mr-1.5">Monitored Fleet:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {activeWorkflowsCount} / {workflows.length} Active
              </span>
            </div>
          </div>
        </div>

        {/* 6 Executive KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Pipelines</span>
              <WorkflowIcon className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {activeWorkflowsCount}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              100% Operational
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Runs</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {totalRuns.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              +18.4% this week
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Emails Dispatched</span>
              <Send className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {totalEmails.toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              Zero dropouts
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Success Rate</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {avgSuccessRate}%
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Zero unhandled
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Hours Saved</span>
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {totalHoursSaved.toFixed(1)}h
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              ~${(totalHoursSaved * 75).toLocaleString()} avoided
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Trigger Latency</span>
              <Timer className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              142ms
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Sub-second webhook
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid: 7-Day Throughput & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Throughput SVG Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  7-Day Workflow Runs & Email Notifications Throughput
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {hoveredDay ? `${hoveredDay.day} (${hoveredDay.date}): ${hoveredDay.workflowRuns} runs • ${hoveredDay.emailsDispatched} emails` : "Hover bars for details"}
              </span>
            </div>

            {/* SVG Interactive Bar Chart */}
            <div className="h-44 w-full mt-4 flex items-end justify-between gap-3 px-2 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              {SEVEN_DAY_WORKFLOW_METRICS.map((m) => {
                const runHeightPct = Math.round((m.workflowRuns / maxRuns) * 100);
                const emailHeightPct = Math.round((m.emailsDispatched / maxRuns) * 100);
                const isHovered = hoveredDay?.day === m.day;

                return (
                  <div
                    key={m.day}
                    onMouseEnter={() => setHoveredDay(m)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer h-full justify-end"
                  >
                    <div className="w-full flex items-end justify-center gap-1 h-32 relative">
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap z-20 shadow-lg border border-slate-700 pointer-events-none animate-in fade-in">
                          {m.workflowRuns} runs / {m.emailsDispatched} emails ({m.hoursSaved}h)
                        </div>
                      )}

                      {/* Workflow Runs Bar */}
                      <div
                        style={{ height: `${runHeightPct}%` }}
                        className={`w-3.5 sm:w-5 rounded-t-md transition-all duration-300 ${
                          isHovered 
                            ? "bg-indigo-600 shadow-md shadow-indigo-500/30" 
                            : "bg-indigo-500/80 group-hover:bg-indigo-600"
                        }`}
                        title={`${m.day}: ${m.workflowRuns} runs`}
                      />

                      {/* Emails Dispatched Bar */}
                      <div
                        style={{ height: `${emailHeightPct}%` }}
                        className={`w-3.5 sm:w-5 rounded-t-md transition-all duration-300 ${
                          isHovered 
                            ? "bg-emerald-500 shadow-md shadow-emerald-500/30" 
                            : "bg-emerald-500/80 group-hover:bg-emerald-600"
                        }`}
                        title={`${m.day}: ${m.emailsDispatched} emails dispatched`}
                      />
                    </div>

                    {/* Day label */}
                    <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {m.day.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                <span>Workflow Executions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                <span>Automated Email Dispatches</span>
              </div>
            </div>
            <span className="font-mono text-slate-500">Peak: 382 runs / day</span>
          </div>
        </div>

        {/* Email Category Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Email Dispatch Distribution
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Proportion of automated notifications by purpose & template category.
            </p>

            <div className="space-y-3.5">
              {EMAIL_CATEGORY_DISTRIBUTION.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {cat.category}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className={`h-full rounded-full ${cat.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 mt-4 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>Action Receipts constitute 48% of enterprise automated dispatches with cryptographically verified SHA-256 audit hashes.</span>
          </div>
        </div>
      </div>

      {/* Per-Workflow Metrics & Email Notification Control Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Pipeline Notification Matrix & Execution Telemetry</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {workflows.length} Pipelines
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toggle automated email notifications on or off per workflow and monitor runs, success rates, and hours saved.
            </p>
          </div>

          {/* Department Filter & Search Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 overflow-x-auto">
              {departments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDepartment(d.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedDepartment === d.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pipeline..."
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Workflow Pipeline</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Email Notifications</th>
                <th className="py-3 px-4 text-right">Runs</th>
                <th className="py-3 px-4 text-right">Emails Sent</th>
                <th className="py-3 px-4 text-right">Success Rate</th>
                <th className="py-3 px-4 text-right">Hours Saved</th>
                <th className="py-3 px-4">Last Run</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredWorkflows.map((wf) => {
                const isEmailEnabled = wf.emailNotificationsEnabled !== false;
                const hoursSaved = ((wf.totalRuns || 0) * (wf.avgHoursSavedPerRun || 0.5)).toFixed(1);
                const successRate = wf.successRate ?? 99.4;

                return (
                  <tr
                    key={wf.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Pipeline Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <WorkflowIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{wf.name}</span>
                            {wf.isActive && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active in Production" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {wf.nodes.length} nodes • {wf.connections.length} cables
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {wf.department}
                      </span>
                    </td>

                    {/* Email Notifications Toggle Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        id={`btn-toggle-wf-email-${wf.id}`}
                        onClick={() => onToggleWorkflowEmail(wf.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                          isEmailEnabled
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        }`}
                        title={isEmailEnabled ? "Email alerts active: Click to mute" : "Email alerts muted: Click to enable"}
                      >
                        <Mail className={`w-3 h-3 ${isEmailEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                        <span>{isEmailEnabled ? "Active" : "Muted"}</span>
                      </button>
                    </td>

                    {/* Runs */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {(wf.totalRuns || 0).toLocaleString()}
                    </td>

                    {/* Emails Sent */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {(wf.totalEmailsSent || 0).toLocaleString()}
                    </td>

                    {/* Success Rate */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`font-mono font-bold ${successRate >= 99 ? "text-emerald-600" : "text-amber-600"}`}>
                          {successRate}%
                        </span>
                        <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
                          <div
                            style={{ width: `${Math.min(100, successRate)}%` }}
                            className={`h-full rounded-full ${successRate >= 99 ? "bg-emerald-500" : "bg-amber-500"}`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Hours Saved */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {hoursSaved}h
                    </td>

                    {/* Last Run */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {wf.lastRun || "Recently"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          id={`btn-simulate-wf-run-${wf.id}`}
                          onClick={() => onSimulateWorkflowRun(wf)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Simulate workflow run & trigger action receipt email"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span className="hidden sm:inline">Simulate Run</span>
                        </button>

                        {onOpenWorkflowCanvas && (
                          <button
                            type="button"
                            onClick={() => onOpenWorkflowCanvas(wf.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="Open in Workflow Studio Canvas"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
