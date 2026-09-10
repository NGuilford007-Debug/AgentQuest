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
  FileDown,
  Compass,
  Building2,
  Folder,
  Tag,
  Tags,
  Search,
  Layers,
  Briefcase,
  X
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
import { ForecastSummaryData, generateRoiExecutiveSummaryPdfReport } from "../utils/pdfExport";
import { ExecutionStatusBadge } from "./ExecutionStatusBadge";
import { ROISummaryModal, RoiExecutiveReport } from "./ROISummaryModal";
import { TaskTaggingModal } from "./TaskTaggingModal";
import { TaskTagBadges } from "./TaskTagBadges";
import { exportEnterpriseAnalyticsCsv } from "../utils/csvExport";

interface ROIAnalyticsProps {
  agents: Agent[];
  executionHistory: TaskExecutionRecord[];
  onUpdateExecution?: (updated: TaskExecutionRecord) => void;
  onApproveHitl?: (taskId: string) => void;
  onOpenQuickStart?: () => void;
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
  onApproveHitl,
  onOpenQuickStart
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

  // Categorization and tagging states
  const [viewTab, setViewTab] = useState<"overview" | "categorization" | "audit">("overview");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [taggingModalTask, setTaggingModalTask] = useState<TaskExecutionRecord | null>(null);
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState<boolean>(false);

  // Gemini AI Executive Summary states
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [isGeneratingSummaryPdf, setIsGeneratingSummaryPdf] = useState<boolean>(false);
  const [roiSummary, setRoiSummary] = useState<RoiExecutiveReport | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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

  // Active Forecast Summary Data (from interactive forecast section with fallback)
  const activeForecastData = useMemo<ForecastSummaryData>(() => {
    if (forecastSummaryData) return forecastSummaryData;
    const historicalCost = Math.round(totalHours * blendedHourlyCost);
    const proj12Hours = Math.round(totalHours * 4.2) || 480;
    const proj12Gross = Math.round(proj12Hours * blendedHourlyCost);
    const proj12Net = Math.round(proj12Gross * 0.94);
    return {
      totalHistoricalHours: totalHours,
      totalHistoricalCostSaved: totalDollarSaved || historicalCost,
      totalTasks: totalTasks || 12,
      qualityRate: qualityRate || 98.4,
      hourlyRate: blendedHourlyCost,
      projected12MoHours: proj12Hours,
      projected12MoGrossSavings: proj12Gross,
      projected12MoNetValue: proj12Net,
      projected12MoTasks: Math.round(totalTasks * 4.5) || 520,
      projectedFteLiberated: parseFloat((proj12Hours / 1920).toFixed(1)),
      growthScenarioName: "Balanced (20% MoM)",
      monthlyProjections: [
        { monthName: "Month 1", tasks: 80, hours: 45, grossSavings: 3825, aiCost: 15, netSavings: 3810, fteEquivalent: 0.3 },
        { monthName: "Month 3", tasks: 120, hours: 70, grossSavings: 5950, aiCost: 25, netSavings: 5925, fteEquivalent: 0.4 },
        { monthName: "Month 6", tasks: 220, hours: 130, grossSavings: 11050, aiCost: 45, netSavings: 11005, fteEquivalent: 0.8 },
        { monthName: "Month 12", tasks: 450, hours: 260, grossSavings: 22100, aiCost: 90, netSavings: 22010, fteEquivalent: 1.6 },
      ],
      departmentBreakdown: departmentBreakdown.length > 0
        ? departmentBreakdown
        : [
            { name: "Customer Support", hours: 45, costSaved: 3825, percent: 35 },
            { name: "Engineering", hours: 35, costSaved: 2975, percent: 27 },
            { name: "DevOps & SecOps", hours: 25, costSaved: 2125, percent: 19 },
            { name: "Sales & CRM", hours: 15, costSaved: 1275, percent: 12 },
            { name: "Operations", hours: 9, costSaved: 765, percent: 7 },
          ],
    };
  }, [forecastSummaryData, totalHours, totalDollarSaved, totalTasks, qualityRate, blendedHourlyCost, departmentBreakdown]);

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

  // Generate Executive ROI Summary using Gemini AI
  const handleGenerateRoiSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setIsSummaryModalOpen(true);

    try {
      const response = await fetch("/api/gemini/generate-roi-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executionHistory,
          metrics: {
            totalHours,
            totalDollarSaved,
            qualityRate,
            totalTasks,
            blendedHourlyCost,
            approvedAudits,
            discrepancyAudits,
          },
          departmentBreakdown,
          timeHorizon,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.report) {
        setRoiSummary(data.report);
      } else {
        throw new Error("No report was returned by the AI engine.");
      }
    } catch (err: any) {
      console.error("Error generating ROI summary with Gemini:", err);
      setSummaryError(err?.message || "Failed to generate executive summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownloadSummaryPdf = async () => {
    if (!roiSummary) return;
    try {
      setIsGeneratingSummaryPdf(true);
      await generateRoiExecutiveSummaryPdfReport(roiSummary, "Apex Enterprise");
    } catch (err) {
      console.error("Failed to generate executive summary PDF:", err);
    } finally {
      setIsGeneratingSummaryPdf(false);
    }
  };

  // Categorization unique collections
  const allProjects = useMemo(() => {
    return Array.from(new Set(executionHistory.map((e) => e.project).filter(Boolean) as string[])).sort();
  }, [executionHistory]);

  const allClients = useMemo(() => {
    return Array.from(new Set(executionHistory.map((e) => e.client).filter(Boolean) as string[])).sort();
  }, [executionHistory]);

  const allTags = useMemo(() => {
    return Array.from(new Set(executionHistory.flatMap((e) => e.tags || []))).sort();
  }, [executionHistory]);

  // Aggregated Client Reporting Summary
  const clientReportSummaries = useMemo(() => {
    const map: Record<string, {
      name: string;
      totalTasks: number;
      hoursSaved: number;
      costSaved: number;
      approvedCount: number;
      projects: Set<string>;
      tags: Set<string>;
    }> = {};

    executionHistory.forEach((rec) => {
      const clientName = rec.client?.trim() || "Unassigned / Internal";
      if (!map[clientName]) {
        map[clientName] = {
          name: clientName,
          totalTasks: 0,
          hoursSaved: 0,
          costSaved: 0,
          approvedCount: 0,
          projects: new Set<string>(),
          tags: new Set<string>(),
        };
      }
      const entry = map[clientName];
      entry.totalTasks += 1;
      const h = rec.hoursSaved || 0;
      entry.hoursSaved += h;
      entry.costSaved += Math.round(h * blendedHourlyCost);
      if (rec.status === "approved" || rec.status === "resolved" || rec.feedback?.isApproved) {
        entry.approvedCount += 1;
      }
      if (rec.project) entry.projects.add(rec.project);
      (rec.tags || []).forEach((t) => entry.tags.add(t));
    });

    return Object.values(map).map((c) => ({
      ...c,
      hoursSaved: parseFloat(c.hoursSaved.toFixed(1)),
      qualityRate: c.totalTasks > 0 ? parseFloat(((c.approvedCount / c.totalTasks) * 100).toFixed(1)) : 100,
      associatedProjects: Array.from(c.projects),
      tags: Array.from(c.tags),
    })).sort((a, b) => b.hoursSaved - a.hoursSaved);
  }, [executionHistory, blendedHourlyCost]);

  // Aggregated Project Reporting Summary
  const projectReportSummaries = useMemo(() => {
    const map: Record<string, {
      name: string;
      client: string;
      totalTasks: number;
      hoursSaved: number;
      costSaved: number;
      approvedCount: number;
      tags: Set<string>;
    }> = {};

    executionHistory.forEach((rec) => {
      const projectName = rec.project?.trim() || "Unassigned / General";
      if (!map[projectName]) {
        map[projectName] = {
          name: projectName,
          client: rec.client || "Unassigned",
          totalTasks: 0,
          hoursSaved: 0,
          costSaved: 0,
          approvedCount: 0,
          tags: new Set<string>(),
        };
      }
      const entry = map[projectName];
      entry.totalTasks += 1;
      const h = rec.hoursSaved || 0;
      entry.hoursSaved += h;
      entry.costSaved += Math.round(h * blendedHourlyCost);
      if (rec.status === "approved" || rec.status === "resolved" || rec.feedback?.isApproved) {
        entry.approvedCount += 1;
      }
      (rec.tags || []).forEach((t) => entry.tags.add(t));
    });

    return Object.values(map).map((p) => ({
      ...p,
      hoursSaved: parseFloat(p.hoursSaved.toFixed(1)),
      qualityRate: p.totalTasks > 0 ? parseFloat(((p.approvedCount / p.totalTasks) * 100).toFixed(1)) : 100,
      tags: Array.from(p.tags),
    })).sort((a, b) => b.hoursSaved - a.hoursSaved);
  }, [executionHistory, blendedHourlyCost]);

  // Aggregated Tag Distribution Summary
  const tagReportSummaries = useMemo(() => {
    const map: Record<string, { name: string; totalTasks: number; hoursSaved: number; costSaved: number }> = {};
    executionHistory.forEach((rec) => {
      (rec.tags || []).forEach((t) => {
        if (!map[t]) {
          map[t] = { name: t, totalTasks: 0, hoursSaved: 0, costSaved: 0 };
        }
        map[t].totalTasks += 1;
        const h = rec.hoursSaved || 0;
        map[t].hoursSaved += h;
        map[t].costSaved += Math.round(h * blendedHourlyCost);
      });
    });

    return Object.values(map).map((t) => ({
      ...t,
      hoursSaved: parseFloat(t.hoursSaved.toFixed(1)),
    })).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [executionHistory, blendedHourlyCost]);

  // Coverage percentage
  const categorizedTasksCount = useMemo(() => {
    return executionHistory.filter((e) => Boolean(e.client || e.project || (e.tags && e.tags.length > 0))).length;
  }, [executionHistory]);

  const categorizationCoverage = useMemo(() => {
    if (executionHistory.length === 0) return 100;
    return Math.round((categorizedTasksCount / executionHistory.length) * 100);
  }, [categorizedTasksCount, executionHistory.length]);

  // Filtered task audits for the review list & ledger
  const filteredAudits = useMemo(() => {
    return executionHistory.filter((rec) => {
      // 1. Status Filter
      if (auditFilter === "resolved" && rec.status !== "resolved") return false;
      if (auditFilter === "needs_review" && rec.status !== "needs_review") return false;
      if (auditFilter === "discrepancies" && !(rec.status === "discrepancy" || rec.status === "rejected" || rec.status === "failed" || rec.feedback?.isApproved === false)) return false;
      if (auditFilter === "approved" && !(rec.status === "approved" || rec.feedback?.isApproved === true)) return false;

      // 2. Client Filter
      if (selectedClientFilter !== "all") {
        if (selectedClientFilter === "unassigned") {
          if (rec.client) return false;
        } else if (rec.client !== selectedClientFilter) {
          return false;
        }
      }

      // 3. Project Filter
      if (selectedProjectFilter !== "all") {
        if (selectedProjectFilter === "unassigned") {
          if (rec.project) return false;
        } else if (rec.project !== selectedProjectFilter) {
          return false;
        }
      }

      // 4. Tag Filter
      if (selectedTagFilter !== "all") {
        if (!rec.tags || !rec.tags.includes(selectedTagFilter)) {
          return false;
        }
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rec.title?.toLowerCase().includes(q);
        const matchAgent = rec.agentName?.toLowerCase().includes(q);
        const matchDept = rec.department?.toLowerCase().includes(q);
        const matchSummary = rec.summary?.toLowerCase().includes(q);
        const matchClient = rec.client?.toLowerCase().includes(q);
        const matchProject = rec.project?.toLowerCase().includes(q);
        const matchTags = rec.tags?.some((t) => t.toLowerCase().includes(q));

        if (!matchTitle && !matchAgent && !matchDept && !matchSummary && !matchClient && !matchProject && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [executionHistory, auditFilter, selectedClientFilter, selectedProjectFilter, selectedTagFilter, searchQuery]);

  const handleExportCsv = () => {
    exportEnterpriseAnalyticsCsv({
      config: {
        companyName: "Enterprise Operations",
        preparedFor: "Executive Leadership & Department Stakeholders",
        preparedBy: "AgentFlow AI Intelligence Suite",
        timeHorizon: timeHorizon,
        forecastHorizonMonths: 12,
        hourlyRate: 85,
        includeExecutiveSummary: true,
        includeHistoricalMetrics: true,
        includeForecastSection: true,
        includeDepartmentBreakdown: true,
        includeQualityAudit: true,
        includeAgentRoster: true,
      },
      summaryData: activeForecastData,
      agents: agents,
      executionHistory: executionHistory,
    });
  };

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

          {/* Generate Summary Action Button */}
          <button
            id="btn-header-generate-summary"
            type="button"
            onClick={handleGenerateRoiSummary}
            disabled={isGeneratingSummary}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 border border-blue-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            title="Generate Executive ROI Summary with Gemini AI"
          >
            {isGeneratingSummary ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Interpreting Telemetry...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Summary</span>
              </>
            )}
          </button>

          {/* Quick Guide & ROI Formulas Button */}
          {onOpenQuickStart && (
            <button
              id="btn-header-roi-guide"
              type="button"
              onClick={onOpenQuickStart}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="View ROI calculation guide, loaded rate formulas, and features walkthrough"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Guide & Formulas</span>
              <span className="sm:hidden">Guide</span>
            </button>
          )}

          {/* Download Report PDF Action Button */}
          <button
            id="btn-header-download-pdf"
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 border border-emerald-500/30 active:scale-95 transition-all cursor-pointer"
            title="Download Executive ROI Report as PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
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

      {/* VIEW SWITCHER TABS: OVERVIEW vs CLIENT & PROJECT REPORTING vs TASK LEDGER */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="tab-roi-overview"
            type="button"
            onClick={() => setViewTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewTab === "overview"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Executive Overview</span>
          </button>

          <button
            id="tab-roi-categorization"
            type="button"
            onClick={() => setViewTab("categorization")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewTab === "categorization"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Client & Project Reporting</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                viewTab === "categorization"
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
              }`}
            >
              {allClients.length} Clients • {allProjects.length} Projects
            </span>
          </button>

          <button
            id="tab-roi-audit"
            type="button"
            onClick={() => setViewTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewTab === "audit"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Task Ledger & Tagging ({executionHistory.length})</span>
          </button>
        </div>

        {/* Quick Categorization Coverage Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
          <Tag className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-slate-500 dark:text-slate-400">Categorization Coverage:</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono">{categorizationCoverage}%</span>
          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${categorizationCoverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: CLIENT & PROJECT CATEGORIZED REPORTING SUITE */}
      {/* ------------------------------------------------------------------- */}
      {viewTab === "categorization" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Banner with summary metrics */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden space-y-4">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider font-mono">
                    Categorized ROI Studio
                  </span>
                  <span className="text-xs text-slate-300">
                    Client & Project Attribution
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  Client & Project Telemetry Ledger
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Every automated task execution is mapped to strategic enterprise initiatives and client deliverables to ensure precise OpEx billing, contractual SLA reporting, and milestone tracking.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Export Categorized CSV</span>
                </button>
              </div>
            </div>

            {/* 4 Quick Attribution Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 relative z-10">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Active Clients</div>
                <div className="text-lg sm:text-xl font-extrabold font-mono text-white mt-0.5">
                  {clientReportSummaries.length}
                </div>
                <div className="text-[10px] text-emerald-300 mt-0.5">
                  ${clientReportSummaries.reduce((a, c) => a + c.costSaved, 0).toLocaleString()} Saved
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Active Projects</div>
                <div className="text-lg sm:text-xl font-extrabold font-mono text-white mt-0.5">
                  {projectReportSummaries.length}
                </div>
                <div className="text-[10px] text-blue-300 mt-0.5">
                  {projectReportSummaries.reduce((a, p) => a + p.hoursSaved, 0).toFixed(1)} hrs Tracked
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Unique Tags</div>
                <div className="text-lg sm:text-xl font-extrabold font-mono text-white mt-0.5">
                  {allTags.length}
                </div>
                <div className="text-[10px] text-purple-300 mt-0.5">
                  {tagReportSummaries.reduce((a, t) => a + t.totalTasks, 0)} Tag Usages
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10">
                <div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Coverage Rate</div>
                <div className="text-lg sm:text-xl font-extrabold font-mono text-white mt-0.5">
                  {categorizationCoverage}%
                </div>
                <div className="text-[10px] text-amber-300 mt-0.5">
                  {categorizedTasksCount} / {executionHistory.length} Classified
                </div>
              </div>
            </div>
          </div>

          {/* CLIENT BREAKDOWN SECTION */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Client Value Realization & Labor Savings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Breakdown of autonomous agent task executions and liberated dollars per client account.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientReportSummaries.map((client) => (
                <div
                  key={client.name}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Client Account
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{client.name}</span>
                      </h4>
                    </div>
                    <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      ${client.costSaved.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/60 dark:border-slate-800/60 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Tasks</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {client.totalTasks}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Hours</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {client.hoursSaved}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Quality</div>
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                        {client.qualityRate}%
                      </div>
                    </div>
                  </div>

                  {/* Associated Projects */}
                  {client.associatedProjects.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400">Projects:</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {client.associatedProjects.map((prj) => (
                          <button
                            key={prj}
                            type="button"
                            onClick={() => {
                              setSelectedProjectFilter(prj);
                              setViewTab("audit");
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors cursor-pointer"
                          >
                            {prj}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {client.tags.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400">Tags:</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {client.tags.slice(0, 4).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTagFilter(tag);
                              setViewTab("audit");
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jump to Audit Ledger */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientFilter(client.name);
                      setSelectedProjectFilter("all");
                      setSelectedTagFilter("all");
                      setViewTab("audit");
                    }}
                    className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>View Client Tasks in Ledger</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PROJECT BREAKDOWN SECTION */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Project Workload Allocation & Velocity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Execution volume, saved time, and accuracy across strategic internal and client projects.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectReportSummaries.map((project) => (
                <div
                  key={project.name}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        {project.client ? `Client: ${project.client}` : "Internal Initiative"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{project.name}</span>
                      </h4>
                    </div>
                    <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                      ${project.costSaved.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/60 dark:border-slate-800/60 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Tasks</div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {project.totalTasks}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Hours</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {project.hoursSaved}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Quality</div>
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                        {project.qualityRate}%
                      </div>
                    </div>
                  </div>

                  {/* Project Tags */}
                  {project.tags.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400">Tags:</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {project.tags.slice(0, 4).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedTagFilter(tag);
                              setViewTab("audit");
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jump to Audit Ledger */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectFilter(project.name);
                      setSelectedClientFilter("all");
                      setSelectedTagFilter("all");
                      setViewTab("audit");
                    }}
                    className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>View Project Tasks in Ledger</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* TAG MATRIX & TAXONOMY SECTION */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Task Tag Distribution & Impact Analysis
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any tag badge to immediately filter all matching completions in the audit ledger.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {tagReportSummaries.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => {
                    setSelectedTagFilter(tag.name);
                    setViewTab("audit");
                  }}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-left transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 truncate">
                    #{tag.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                    {tag.totalTasks} {tag.totalTasks === 1 ? "task" : "tasks"}
                  </div>
                  <div className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {tag.hoursSaved}h (${tag.costSaved.toLocaleString()})
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: EXECUTIVE OVERVIEW TELEMETRY & PREDICTIVE GROWTH */}
      {/* ------------------------------------------------------------------- */}
      {viewTab === "overview" && (
        <>
      {/* GEMINI AI EXECUTIVE SUMMARY BANNER (IF AVAILABLE) */}
      {roiSummary && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/90 dark:border-blue-800/60 shadow-xs space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {roiSummary.reportTitle}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-normal">
                    {roiSummary.modelUsed}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {roiSummary.period} • {roiSummary.executionsAnalyzedCount} task executions synthesized
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                id="btn-banner-download-pdf"
                type="button"
                onClick={handleDownloadSummaryPdf}
                disabled={isGeneratingSummaryPdf}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                title="Download Executive Summary Report as PDF"
              >
                {isGeneratingSummaryPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              <button
                id="btn-view-full-ai-summary"
                type="button"
                onClick={() => setIsSummaryModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Report</span>
              </button>
              <button
                id="btn-regenerate-ai-summary-banner"
                type="button"
                onClick={handleGenerateRoiSummary}
                disabled={isGeneratingSummary}
                className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-all cursor-pointer"
                title="Regenerate Executive Summary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSummary ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium pl-3 border-l-2 border-blue-500">
            "{roiSummary.executiveSummary}"
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {roiSummary.headlineMetrics?.map((m, idx) => (
              <div key={idx} className="px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/60 text-xs">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{m.label}</div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        </>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 3 & OVERVIEW FOOTER: TASK AUDIT & TAGGING LEDGER */}
      {/* ------------------------------------------------------------------- */}
      {(viewTab === "overview" || viewTab === "audit") && (
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

          {/* Filter Pills & Quick AI Summary Action */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto flex-wrap">
            <button
              id="btn-audit-generate-summary"
              type="button"
              onClick={handleGenerateRoiSummary}
              disabled={isGeneratingSummary}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer disabled:opacity-50"
              title="Generate Executive Summary from Execution Telemetry"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Generate Summary</span>
            </button>
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
              onClick={() => setAuditFilter("resolved")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                auditFilter === "resolved"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Resolved</span>
            </button>
            <button
              onClick={() => setAuditFilter("needs_review")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                auditFilter === "needs_review"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Needs Review</span>
            </button>
            <button
              onClick={() => setAuditFilter("discrepancies")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                auditFilter === "discrepancies"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>Discrepancies & Failures</span>
            </button>
            <button
              onClick={() => setAuditFilter("approved")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                auditFilter === "approved"
                  ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-teal-500" />
              <span>Approved</span>
            </button>
          </div>
        </div>

        {/* Granular Categorization & Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
          {/* Text Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-audit-search"
              type="text"
              placeholder="Search prompt, agent, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Client Filter Dropdown */}
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="select-filter-client"
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Clients ({allClients.length})</option>
              <option value="unassigned">Unassigned / Internal</option>
              {allClients.map((client) => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          {/* Project Filter Dropdown */}
          <div className="relative">
            <Folder className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="select-filter-project"
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Projects ({allProjects.length})</option>
              <option value="unassigned">Unassigned / Ad-hoc</option>
              {allProjects.map((project) => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter Dropdown */}
          <div className="relative">
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="select-filter-tag"
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Tags ({allTags.length})</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>#{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(selectedClientFilter !== "all" || selectedProjectFilter !== "all" || selectedTagFilter !== "all" || searchQuery.trim() !== "" || auditFilter !== "all") && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1 pb-1">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Active Filters:</span>
            {auditFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px]">
                Status: {auditFilter}
                <button type="button" onClick={() => setAuditFilter("all")} className="hover:text-blue-900 dark:hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {selectedClientFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px]">
                Client: {selectedClientFilter}
                <button type="button" onClick={() => setSelectedClientFilter("all")} className="hover:text-indigo-900 dark:hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {selectedProjectFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-[11px]">
                Project: {selectedProjectFilter}
                <button type="button" onClick={() => setSelectedProjectFilter("all")} className="hover:text-cyan-900 dark:hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {selectedTagFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                #{selectedTagFilter}
                <button type="button" onClick={() => setSelectedTagFilter("all")} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {searchQuery.trim() !== "" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px]">
                Query: "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery("")} className="hover:text-amber-900 dark:hover:text-white"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setAuditFilter("all");
                setSelectedClientFilter("all");
                setSelectedProjectFilter("all");
                setSelectedTagFilter("all");
                setSearchQuery("");
              }}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline ml-1 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Task Audit Table / List */}
        {filteredAudits.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Task Executions Match the Current Filter Criteria
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Try clearing filters or changing your search terms to see more completed agent task runs.
            </p>
            <button
              type="button"
              onClick={() => {
                setAuditFilter("all");
                setSelectedClientFilter("all");
                setSelectedProjectFilter("all");
                setSelectedTagFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Clear All Filters
            </button>
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
                          <ExecutionStatusBadge
                            status={task.status}
                            size="xs"
                            id={`audit-status-badge-${task.id}`}
                          />
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Agent: <strong>{task.agentName}</strong> • {task.department} • {task.hoursSaved}h Saved •{" "}
                          <span className="font-mono text-[10px]">
                            {isNaN(new Date(task.timestamp).getTime())
                              ? task.timestamp
                              : new Date(task.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Task Categorization Badges: Client, Project & Tags */}
                        <div className="mt-2">
                          <TaskTagBadges
                            task={task}
                            onEditTags={(t) => {
                              setTaggingModalTask(t);
                              setIsTaggingModalOpen(true);
                            }}
                            onSelectClient={(c) => {
                              setSelectedClientFilter(c);
                              setViewTab("audit");
                            }}
                            onSelectProject={(p) => {
                              setSelectedProjectFilter(p);
                              setViewTab("audit");
                            }}
                            onSelectTag={(tag) => {
                              setSelectedTagFilter(tag);
                              setViewTab("audit");
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setTaggingModalTask(task);
                          setIsTaggingModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Categorize by Client, Project & Tags"
                      >
                        <Tag className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit Tags</span>
                      </button>

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
      )}

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
      <ROIReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        agents={agents}
        executionHistory={executionHistory}
        forecastSummaryData={activeForecastData}
        timeHorizon={timeHorizon}
      />

      {/* GEMINI AI EXECUTIVE ROI SUMMARY MODAL */}
      <ROISummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        report={roiSummary}
        isLoading={isGeneratingSummary}
        onRegenerate={handleGenerateRoiSummary}
      />

      {/* TASK TAGGING & CATEGORIZATION MODAL */}
      <TaskTaggingModal
        isOpen={isTaggingModalOpen}
        onClose={() => {
          setIsTaggingModalOpen(false);
          setTaggingModalTask(null);
        }}
        task={taggingModalTask}
        existingProjects={allProjects}
        existingClients={allClients}
        existingTags={allTags}
        onSave={(updatedTask) => {
          if (onUpdateExecution) {
            onUpdateExecution(updatedTask);
          }
        }}
      />
    </div>
  );
};
