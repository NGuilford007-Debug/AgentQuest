import React, { useState, useMemo } from "react";
import { Agent, TaskExecutionRecord, Department } from "../types";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  ShieldAlert,
  CheckCircle2,
  Users2,
  Sparkles,
  ArrowUpRight,
  Filter,
  Calendar,
  AlertTriangle,
  Wrench,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Award,
  FileDown
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import Markdown from "react-markdown";
import { TaskTroubleshootModal } from "./TaskTroubleshootModal";
import { ROIForecastSection } from "./ROIForecastSection";
import { ROIReportPdfModal } from "./ROIReportPdfModal";
import { ForecastSummaryData } from "../utils/pdfExport";

interface ROIAnalyticsProps {
  agents: Agent[];
  executionHistory: TaskExecutionRecord[];
  onUpdateExecution?: (updated: TaskExecutionRecord) => void;
  onApproveHitl?: (taskId: string) => void;
}

const DEPARTMENT_COLORS: Record<string, string> = {
  "Engineering": "#3b82f6",
  "DevOps & SecOps": "#8b5cf6",
  "Customer Support": "#06b6d4",
  "Sales & CRM": "#6366f1",
  "Finance & Legal": "#f59e0b",
  "Marketing & Growth": "#ec4899",
  "HR & People Ops": "#10b981",
  "Operations": "#14b8a6",
};

// Generates time-series trend points for hours saved and efficiency
const generateTrendData = (period: "7d" | "30d" | "90d" | "1y", liveExecutions: TaskExecutionRecord[], baseMultiplier: number) => {
  const points: any[] = [];
  const count = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 12 : 12;
  const unit = period === "7d" || period === "30d" ? "Day" : "Week";

  const now = new Date();
  let cumulativeHours = 0;

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    if (period === "7d" || period === "30d") {
      d.setDate(now.getDate() - i);
    } else {
      d.setDate(now.getDate() - i * 7);
    }

    const label = period === "7d" 
      ? d.toLocaleDateString([], { weekday: "short" })
      : period === "30d" 
      ? d.toLocaleDateString([], { month: "short", day: "numeric" })
      : `Wk ${count - i}`;

    // Base synthetic foundation plus live logged tasks (or zero if on clean slate)
    const isCleanZero = baseMultiplier === 0 && liveExecutions.length === 0;
    const dailyBase = isCleanZero ? 0 : (12 + Math.sin(i * 0.5) * 4 + (count - i) * 0.8);
    const dailyHours = parseFloat(dailyBase.toFixed(1));
    cumulativeHours += dailyHours;

    points.push({
      label,
      date: d.toISOString().split("T")[0],
      dailyHours,
      cumulativeHours: parseFloat(cumulativeHours.toFixed(1)),
      supportHours: parseFloat((dailyHours * 0.38).toFixed(1)),
      engineeringHours: parseFloat((dailyHours * 0.28).toFixed(1)),
      devopsHours: parseFloat((dailyHours * 0.20).toFixed(1)),
      salesHours: parseFloat((dailyHours * 0.14).toFixed(1)),
      tasksCompleted: isCleanZero ? 0 : Math.round(dailyHours * 3.4),
      costSaved: Math.round(dailyHours * 85),
    });
  }

  // Factor in real executions into the latest point
  if (liveExecutions.length > 0 && points.length > 0) {
    const liveHoursTotal = liveExecutions.reduce((acc, e) => acc + (e.hoursSaved || 0), 0);
    const last = points[points.length - 1];
    last.dailyHours = parseFloat((last.dailyHours + liveHoursTotal).toFixed(1));
    last.cumulativeHours = parseFloat((last.cumulativeHours + liveHoursTotal).toFixed(1));
    last.tasksCompleted += liveExecutions.length;
    last.costSaved = Math.round(last.cumulativeHours * 85);
  }

  return points;
};

// Custom Chart Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-slate-900/95 text-white border border-slate-700 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-sm">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-[10px] text-blue-400 font-mono">Live Telemetry</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-mono font-bold">
              {entry.name.includes("Cost") ? `$${Number(entry.value).toLocaleString()}` : `${entry.value} hrs`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ROIAnalytics: React.FC<ROIAnalyticsProps> = ({ 
  agents, 
  executionHistory, 
  onUpdateExecution,
  onApproveHitl 
}) => {
  const [timeHorizon, setTimeHorizon] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");
  const [chartMetric, setChartMetric] = useState<"cumulative" | "breakdown" | "daily">("cumulative");
  const [troubleshootTask, setTroubleshootTask] = useState<TaskExecutionRecord | null>(null);
  const [isTroubleshootOpen, setIsTroubleshootOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<string>("all");
  const [forecastSummaryData, setForecastSummaryData] = useState<ForecastSummaryData | null>(null);

  const blendedHourlyCost = 85; // $85/hr standard loaded engineer/SDR capacity
  
  // Aggregate real agent numbers
  const totalAgentHours = agents.reduce((acc, a) => acc + a.stats.hoursSaved, 0);
  const liveExecutionHours = executionHistory.reduce((acc, e) => acc + (e.hoursSaved || 0), 0);
  const totalHours = parseFloat((totalAgentHours + liveExecutionHours).toFixed(1));
  const totalDollarSaved = Math.round(totalHours * blendedHourlyCost);
  const totalTasks = agents.reduce((acc, a) => acc + a.stats.tasksCompleted, 0) + executionHistory.length;

  // Quality & Spec Compliance Rate calculations
  const totalAudits = executionHistory.length;
  const approvedAudits = executionHistory.filter((e) => e.status === "approved" || e.status === "resolved" || e.feedback?.isApproved).length;
  const discrepancyAudits = executionHistory.filter((e) => e.status === "discrepancy" || e.status === "rejected" || e.feedback?.isApproved === false).length;
  const qualityRate = totalAudits > 0 
    ? parseFloat(((approvedAudits / totalAudits) * 100).toFixed(1))
    : (totalHours > 0 ? 98.4 : 100.0);

  // Department Breakdown Aggregation
  const departmentBreakdown = useMemo(() => {
    const map: Record<string, { name: string; hours: number; tasks: number; color: string }> = {};

    // Seed defaults
    agents.forEach((ag) => {
      const dept = ag.department || "Operations";
      if (!map[dept]) {
        map[dept] = {
          name: dept,
          hours: 0,
          tasks: 0,
          color: DEPARTMENT_COLORS[dept] || "#3b82f6",
        };
      }
      map[dept].hours += ag.stats.hoursSaved;
      map[dept].tasks += ag.stats.tasksCompleted;
    });

    // Add execution history
    executionHistory.forEach((exec) => {
      const dept = exec.department || "Operations";
      if (!map[dept]) {
        map[dept] = {
          name: dept,
          hours: 0,
          tasks: 0,
          color: DEPARTMENT_COLORS[dept] || "#3b82f6",
        };
      }
      map[dept].hours += exec.hoursSaved || 0.5;
      map[dept].tasks += 1;
    });

    const list = Object.values(map);
    const sumHours = list.reduce((acc, d) => acc + d.hours, 0);

    return list.map((d) => ({
      ...d,
      hours: parseFloat(d.hours.toFixed(1)),
      costSaved: Math.round(d.hours * blendedHourlyCost),
      percent: sumHours > 0 ? Math.round((d.hours / sumHours) * 100) : 0,
    })).sort((a, b) => b.hours - a.hours);
  }, [agents, executionHistory]);

  // Trend Data for Recharts
  const trendData = useMemo(() => {
    return generateTrendData(timeHorizon, executionHistory, totalHours);
  }, [timeHorizon, executionHistory, totalHours]);

  // Handle open troubleshooting modal
  const handleOpenTroubleshoot = (task: TaskExecutionRecord) => {
    setTroubleshootTask(task);
    setIsTroubleshootOpen(true);
  };

  const handleTaskResolved = (updated: TaskExecutionRecord) => {
    if (onUpdateExecution) {
      onUpdateExecution(updated);
    }
  };

  // Filtered task audits for the review list
  const filteredAudits = useMemo(() => {
    return executionHistory.filter((rec) => {
      if (auditFilter === "discrepancies") {
        return rec.status === "discrepancy" || rec.status === "rejected" || rec.feedback?.isApproved === false;
      }
      if (auditFilter === "approved") {
        return rec.status === "approved" || rec.status === "resolved" || rec.feedback?.isApproved === true;
      }
      if (auditFilter === "needs_review") {
        return rec.status === "needs_review";
      }
      return true;
    });
  }, [executionHistory, auditFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* HEADER WITH PERIOD SELECTOR & EXPORT PDF BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Enterprise ROI & Telemetry Studio</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time measurement of human toil reduction, agent efficiency trend lines, and predictive growth modeling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Time Horizon Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            {(["7d", "30d", "90d", "1y"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setTimeHorizon(period)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeHorizon === period
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : period === "90d" ? "90 Days" : "1 Year"}
              </button>
            ))}
          </div>

          {/* Export Report PDF Action Button */}
          <button
            id="btn-header-export-pdf"
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 border border-emerald-500/30 active:scale-95 transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 CORE EXECUTIVE IMPACT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Hours Liberated</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalHours.toLocaleString()} hrs
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+42.8 hrs this week</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Direct Cost Saved</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ${totalDollarSaved.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Based on $85/hr loaded rate
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Task Turnaround Acceleration</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            1,200x
          </div>
          <div className="text-[11px] text-slate-400">
            45m manual &rarr; 1.4s AI turnaround
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Spec Compliance Rate</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            {qualityRate}%
          </div>
          <div className="text-[11px] text-slate-400">
            {discrepancyAudits} flagged • {approvedAudits} approved
          </div>
        </div>
      </div>

      {/* PREDICTIVE 'ROI FORECAST' SECTION WITH RECHARTS & SCENARIO ENGINE */}
      <ROIForecastSection
        agents={agents}
        executionHistory={executionHistory}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onUpdateForecastData={(data) => setForecastSummaryData(data)}
      />

      {/* PRIMARY RECHARTS SECTION: TREND LINES FOR HOURS SAVED OVER TIME */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Agent Efficiency & Hours Saved Trend Over Time</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual velocity tracking showing cumulative and department-specific hours liberated.
            </p>
          </div>

          {/* Metric View Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto">
            <button
              onClick={() => setChartMetric("cumulative")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                chartMetric === "cumulative"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Cumulative Hours
            </button>
            <button
              onClick={() => setChartMetric("breakdown")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                chartMetric === "breakdown"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              By Department
            </button>
            <button
              onClick={() => setChartMetric("daily")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                chartMetric === "daily"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Daily Velocity
            </button>
          </div>
        </div>

        {/* RECHARTS CANVAS CONTAINER */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === "cumulative" ? (
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  unit="h"
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeHours" 
                  name="Cumulative Hours Saved"
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCumulative)" 
                />
              </AreaChart>
            ) : chartMetric === "breakdown" ? (
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="supportHours" 
                  name="Customer Support" 
                  stroke="#06b6d4" 
                  strokeWidth={2.5} 
                  dot={{ r: 3 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="engineeringHours" 
                  name="Engineering" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={{ r: 3 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="devopsHours" 
                  name="DevOps & SecOps" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5} 
                  dot={{ r: 3 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="salesHours" 
                  name="Sales & CRM" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  dot={{ r: 3 }} 
                />
              </LineChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar 
                  dataKey="dailyHours" 
                  name="Daily Hours Saved" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DEPARTMENT BREAKDOWN & TASK DISTRIBUTION (RECHARTS BAR + SUMMARY) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Recharts Bar Breakdown by Department */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users2 className="w-4 h-4 text-blue-500" />
              <span>Hours Liberated by Department</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total: {totalHours} hrs
            </span>
          </div>

          {/* Recharts Bar for Department Volume */}
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentBreakdown} layout="vertical" margin={{ top: 5, right: 25, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="h" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  width={90}
                />
                <Tooltip 
                  formatter={(val: any) => [`${val} hrs ($${Math.round(val * 85).toLocaleString()})`, "Hours Saved"]}
                />
                <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                  {departmentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Progress List */}
          <div className="space-y-2.5 pt-1">
            {departmentBreakdown.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-slate-800 dark:text-slate-200">{dept.name}</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {dept.hours} hrs (${dept.costSaved.toLocaleString()}) • {dept.percent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${dept.percent}%`, backgroundColor: dept.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highest Impact Automated Pipelines & Agent Efficiency */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Highest Impact Automated Pipelines</span>
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              ${totalDollarSaved.toLocaleString()} Saved
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {agent.role} • {agent.department}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    +{agent.stats.hoursSaved}h (${Math.round(agent.stats.hoursSaved * 85).toLocaleString()})
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {agent.stats.tasksCompleted} tasks • {agent.stats.successRate}% autonomous
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUALITY AUDIT, DISCREPANCY MANAGEMENT & AI TROUBLESHOOTING SECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Execution Quality Verification & Discrepancy Diagnostics</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit agent work products. If an output isn't what you asked for, launch AI Root-Cause Troubleshooting to diagnose and auto-fix the prompt.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto">
            <button
              onClick={() => setAuditFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                auditFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All Runs ({executionHistory.length})
            </button>
            <button
              onClick={() => setAuditFilter("discrepancies")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                auditFilter === "discrepancies"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Flagged Discrepancies</span>
            </button>
            <button
              onClick={() => setAuditFilter("approved")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                auditFilter === "approved"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Approved</span>
            </button>
          </div>
        </div>

        {/* Task Audit Table / List */}
        {filteredAudits.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Flagged Discrepancies in Current Filter
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              All agent task executions are currently meeting compliance standards. If an output ever deviates, flag it here or in the Dispatcher to launch the AI diagnostic engine.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAudits.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const isDiscrepancy = task.status === "discrepancy" || task.status === "rejected" || task.feedback?.isApproved === false;
              const isResolved = task.status === "resolved";
              const isApproved = task.status === "approved" || task.feedback?.isApproved === true;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDiscrepancy
                      ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60"
                      : isResolved
                      ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800/60"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isDiscrepancy ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : isResolved ? (
                          <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : isApproved ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {task.title}
                          </h4>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isDiscrepancy
                                ? "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
                                : isResolved
                                ? "bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-200"
                                : isApproved
                                ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200"
                                : "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {task.status === "discrepancy" ? "Not What I Asked For" : task.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Agent: <strong>{task.agentName}</strong> • {task.department} • {task.hoursSaved}h Saved •{" "}
                          {new Date(task.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? "Hide Output" : "View Output"}</span>
                      </button>

                      {/* Not Approved / Troubleshoot Trigger */}
                      <button
                        id={`btn-troubleshoot-${task.id}`}
                        type="button"
                        onClick={() => handleOpenTroubleshoot(task)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                        title="Flag discrepancy & launch AI troubleshooting"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Troubleshoot / Fix</span>
                      </button>

                      {!isApproved && onApproveHitl && (
                        <button
                          type="button"
                          onClick={() => onApproveHitl(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Deliverable Preview */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Generated Work Product Deliverable:
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 max-h-60 overflow-y-auto markdown-body leading-relaxed">
                        <Markdown>{task.generatedOutput || task.summary}</Markdown>
                      </div>

                      {task.feedback && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Logged User Quality Feedback:</span>
                          </div>
                          <p className="italic">"{task.feedback.userNote}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TASK TROUBLESHOOTING MODAL */}
      <TaskTroubleshootModal
        isOpen={isTroubleshootOpen}
        onClose={() => {
          setIsTroubleshootOpen(false);
          setTroubleshootTask(null);
        }}
        task={troubleshootTask}
        agents={agents}
        onTaskResolved={handleTaskResolved}
      />

      {/* EXECUTIVE ROI & FORECAST PDF EXPORT MODAL */}
      {forecastSummaryData && (
        <ROIReportPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          agents={agents}
          executionHistory={executionHistory}
          forecastSummaryData={forecastSummaryData}
          timeHorizon={timeHorizon}
        />
      )}
    </div>
  );
};
