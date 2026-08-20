import React, { useState, useMemo } from "react";
import Markdown from "react-markdown";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  Bot,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  BookmarkCheck,
  Pin,
  Trash2,
  Eye,
  X,
  Printer,
  ChevronRight,
  Building2,
  BarChart3,
  Calendar,
  Cpu,
  RefreshCw,
  ExternalLink,
  Users2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  PieChart as PieIcon,
  Play,
  Minimize2,
  Maximize2,
  LayoutGrid,
  LayoutList,
  Activity,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { 
  Agent, 
  Workflow, 
  EmployeeProfile, 
  TaskExecutionRecord, 
  GeneratedReportDocument, 
  ReportCategory, 
  ReportClassification,
  Department,
  ApprovedAutomation
} from "../types";

interface DashboardProps {
  agents: Agent[];
  workflows: Workflow[];
  userProfile: EmployeeProfile;
  executionHistory: TaskExecutionRecord[];
  savedReports: GeneratedReportDocument[];
  onSaveReport: (report: GeneratedReportDocument) => void;
  onDeleteReport: (reportId: string) => void;
  onTogglePinReport: (reportId: string) => void;
  onNavigateToDispatcher: (agentId?: string) => void;
  onNavigateToVault: () => void;
  onNavigateToMonetization?: () => void;
  onNavigateToRoi?: () => void;
  onOpenAgentBuilder?: () => void;
}

const REPORT_DEPARTMENTS: Department[] = [
  "DevOps & SecOps",
  "Customer Support",
  "Engineering",
  "Sales & CRM",
  "Finance & Legal",
  "Human Resources",
  "Operations",
  "Marketing",
  "Security",
  "Product"
];

const REPORT_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Documents" },
  { id: "Executive Briefing", label: "Executive Briefings" },
  { id: "Financial & ROI Audit", label: "Financial & ROI Audits" },
  { id: "SRE & Incident Post-Mortem", label: "SRE Post-Mortems" },
  { id: "Client Proposal & Sales", label: "Client Proposals" },
  { id: "Operational Playbook & SOP", label: "SOPs & Playbooks" },
  { id: "Compliance & Security Review", label: "Security & Compliance" }
];

const PRESET_REPORT_TEMPLATES = [
  {
    title: "Executive ROI & OpEx Labor Replacement Audit",
    category: "Financial & ROI Audit" as ReportCategory,
    classification: "Executive Board" as ReportClassification,
    department: "Finance & Legal" as Department,
    prompt: "Generate an institutional executive audit analyzing cumulative labor hours saved, OpEx cost replaced, and return on investment across all 6 departments for the current quarter.",
    icon: DollarSign,
  },
  {
    title: "Multi-Tenant SaaS MRR Potential & Monetization Forecast",
    category: "Client Proposal & Sales" as ReportCategory,
    classification: "Executive Board" as ReportClassification,
    department: "Sales & CRM" as Department,
    prompt: "Analyze monthly recurring revenue (MRR) potential from packaging our internal agent fleet as a white-labeled SaaS offering for agency clients with metered token margins.",
    icon: TrendingUp,
  },
  {
    title: "SRE Fleet Health & Incident Mitigation Post-Mortem",
    category: "SRE & Incident Post-Mortem" as ReportCategory,
    classification: "Internal" as ReportClassification,
    department: "DevOps & SecOps" as Department,
    prompt: "Draft an SRE post-mortem analyzing recent infrastructure anomaly detection, autonomous socket and connection pool scaling, and zero-downtime mitigation protocols.",
    icon: ShieldCheck,
  },
  {
    title: "Enterprise Client Automation Proposal & Business Case",
    category: "Client Proposal & Sales" as ReportCategory,
    classification: "Client Facing" as ReportClassification,
    department: "Sales & CRM" as Department,
    prompt: "Create a formal enterprise client proposal detailing expected labor savings, single-click automation playbooks, and ROI guarantees for an enterprise rollout.",
    icon: Building2,
  },
  {
    title: "Cross-Departmental Labor & Autonomy Capacity Audit",
    category: "Executive Briefing" as ReportCategory,
    classification: "Executive Board" as ReportClassification,
    department: "Operations" as Department,
    prompt: "Provide an operational review of employee bandwidth liberation, department automation coverage indexes, and autonomous agent fleet utilization.",
    icon: Users2,
  },
];

export const Dashboard: React.FC<DashboardProps> = ({
  agents,
  workflows,
  userProfile,
  executionHistory,
  savedReports,
  onSaveReport,
  onDeleteReport,
  onTogglePinReport,
  onNavigateToDispatcher,
  onNavigateToVault,
  onNavigateToMonetization,
  onNavigateToRoi,
  onOpenAgentBuilder
}) => {
  // Layout Toggle State: 'expanded' (full coverage, charts, reports) vs 'condensed' (top-line metrics only)
  const [dashboardLayout, setDashboardLayout] = useState<"condensed" | "expanded">(() => {
    const saved = localStorage.getItem("agentflow_dashboard_layout");
    return (saved === "condensed" || saved === "expanded") ? saved : "expanded";
  });

  const handleLayoutChange = (layout: "condensed" | "expanded") => {
    setDashboardLayout(layout);
    localStorage.setItem("agentflow_dashboard_layout", layout);
  };

  // Navigation & Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [activeAgentDeptFilter, setActiveAgentDeptFilter] = useState<string>("all");
  const [activeChartTab, setActiveChartTab] = useState<"roi_trend" | "coverage_matrix" | "mrr_forecast">("roi_trend");

  // Document Viewer Modal State
  const [viewingDocument, setViewingDocument] = useState<GeneratedReportDocument | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // AI Generator Modal State
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState<boolean>(false);
  const [genTitle, setGenTitle] = useState<string>("Q3 Strategic ROI & Labor Replacement Audit");
  const [genTopic, setGenTopic] = useState<string>("Comprehensive audit of labor hours saved and OpEx cost replaced by autonomous agents across departments.");
  const [genCategory, setGenCategory] = useState<ReportCategory>("Financial & ROI Audit");
  const [genClassification, setGenClassification] = useState<ReportClassification>("Executive Board");
  const [genDepartment, setGenDepartment] = useState<Department>("Finance & Legal");
  const [genAgentId, setGenAgentId] = useState<string>(agents[0]?.id || "");
  const [genCustomInstructions, setGenCustomInstructions] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Dynamic High-Level Metric Calculations
  const metrics = useMemo(() => {
    const totalHoursSaved = userProfile.hoursSavedTotal || 575.5;
    const hourlyRate = 85; // $85/hr fully-loaded corporate baseline
    const totalLaborValue = totalHoursSaved * hourlyRate;
    const estimatedAiComputeCost = Math.max(12, Math.round(totalHoursSaved * 1.15)); // ~$1.15 per saved hour in tokens
    const netSavings = totalLaborValue - estimatedAiComputeCost;
    const roiMultiplier = Number((totalLaborValue / (estimatedAiComputeCost || 1)).toFixed(1));

    // MRR Calculations
    const contractedTenantsCount = 14;
    const contractedBaseMrr = 18450;
    const projectedTenantTarget = 29;
    const projectedTargetMrr = 38200;
    const grossMarginPercent = 74.2;
    const annualizedRunRate = projectedTargetMrr * 12;

    // Coverage & Autonomy
    const departmentCoverageData = [
      { name: "DevOps & SecOps", coverage: 94, automatedTasks: 412, manualBacklog: 26, hoursSaved: 184.5, fill: "#3b82f6" },
      { name: "Customer Support", coverage: 88, automatedTasks: 890, manualBacklog: 120, hoursSaved: 142.0, fill: "#10b981" },
      { name: "Engineering & QA", coverage: 82, automatedTasks: 320, manualBacklog: 70, hoursSaved: 98.0, fill: "#6366f1" },
      { name: "Sales & CRM", coverage: 76, automatedTasks: 510, manualBacklog: 160, hoursSaved: 76.0, fill: "#f59e0b" },
      { name: "Finance & Legal", coverage: 72, automatedTasks: 185, manualBacklog: 72, hoursSaved: 48.0, fill: "#8b5cf6" },
      { name: "Human Resources", coverage: 65, automatedTasks: 140, manualBacklog: 75, hoursSaved: 27.0, fill: "#ec4899" },
    ];

    const overallCoverageAvg = Math.round(
      departmentCoverageData.reduce((sum, d) => sum + d.coverage, 0) / departmentCoverageData.length
    );

    const activeFleetCount = agents.filter(a => a.status === "active").length || agents.length;
    const totalDocumentValue = savedReports.reduce((sum, r) => sum + (r.businessImpactUsd || 0), 0);

    return {
      totalHoursSaved,
      totalLaborValue,
      estimatedAiComputeCost,
      netSavings,
      roiMultiplier,
      contractedTenantsCount,
      contractedBaseMrr,
      projectedTargetMrr,
      grossMarginPercent,
      annualizedRunRate,
      overallCoverageAvg,
      departmentCoverageData,
      activeFleetCount,
      totalDocumentValue
    };
  }, [userProfile, agents, savedReports]);

  // Historical Growth & Trajectory Data
  const roiGrowthData = useMemo(() => [
    { period: "Mar", laborValue: 12400, computeCost: 210, netProfit: 12190, hours: 145 },
    { period: "Apr", laborValue: 19800, computeCost: 295, netProfit: 19505, hours: 232 },
    { period: "May", laborValue: 28400, computeCost: 390, netProfit: 28010, hours: 334 },
    { period: "Jun", laborValue: 36200, computeCost: 485, netProfit: 35715, hours: 425 },
    { period: "Jul", laborValue: 42800, computeCost: 560, netProfit: 42240, hours: 503 },
    { period: "Aug (Live)", laborValue: metrics.totalLaborValue, computeCost: metrics.estimatedAiComputeCost, netProfit: metrics.netSavings, hours: Math.round(metrics.totalHoursSaved) },
  ], [metrics]);

  const mrrForecastData = useMemo(() => [
    { month: "Month 1", currentBase: 18450, tokenUsageRev: 4800, totalGross: 23250, projectedTarget: 24000 },
    { month: "Month 2", currentBase: 21200, tokenUsageRev: 6200, totalGross: 27400, projectedTarget: 28500 },
    { month: "Month 3", currentBase: 24800, tokenUsageRev: 7900, totalGross: 32700, projectedTarget: 33000 },
    { month: "Month 4", currentBase: 28900, tokenUsageRev: 9300, totalGross: 38200, projectedTarget: 38200 },
    { month: "Month 5", currentBase: 33500, tokenUsageRev: 11400, totalGross: 44900, projectedTarget: 43500 },
    { month: "Month 6", currentBase: 38200, tokenUsageRev: 13800, totalGross: 52000, projectedTarget: 49000 },
  ], []);

  // Filtered Saved Documents
  const filteredReports = useMemo(() => {
    return savedReports.filter((doc) => {
      const matchCat = selectedCategory === "all" || doc.category === selectedCategory;
      const matchDept = selectedDept === "all" || doc.department === selectedDept;
      const matchQuery = 
        !searchQuery.trim() ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.agentName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchDept && matchQuery;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [savedReports, selectedCategory, selectedDept, searchQuery]);

  // Filtered active agents for Expanded View Coverage Roster
  const filteredActiveAgents = useMemo(() => {
    if (activeAgentDeptFilter === "all") return agents;
    return agents.filter(a => a.department === activeAgentDeptFilter);
  }, [agents, activeAgentDeptFilter]);

  // Top Pinned / Highlighted reports for Condensed View
  const condensedPinnedReports = useMemo(() => {
    const pinned = savedReports.filter(r => r.isPinned);
    if (pinned.length > 0) return pinned.slice(0, 4);
    return savedReports.slice(0, 4);
  }, [savedReports]);

  // Copy document markdown handler
  const handleCopyMarkdown = (doc: GeneratedReportDocument) => {
    navigator.clipboard.writeText(doc.content);
    setCopiedDocId(doc.id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  // Download document handler
  const handleDownloadDocument = (doc: GeneratedReportDocument) => {
    const blob = new Blob([doc.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle template selection in generator modal
  const handleSelectTemplate = (tpl: typeof PRESET_REPORT_TEMPLATES[0]) => {
    setGenTitle(tpl.title);
    setGenTopic(tpl.prompt);
    setGenCategory(tpl.category);
    setGenClassification(tpl.classification);
    setGenDepartment(tpl.department);
    const matchedAgent = agents.find(a => a.department === tpl.department) || agents[0];
    if (matchedAgent) setGenAgentId(matchedAgent.id);
  };

  // Handle AI Report Generation
  const handleGenerateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTitle.trim() || !genTopic.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    const selectedAgent = agents.find(a => a.id === genAgentId) || agents[0];

    try {
      const response = await fetch("/api/gemini/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: genTitle,
          topic: genTopic,
          category: genCategory,
          classification: genClassification,
          department: genDepartment,
          agent: selectedAgent,
          metricsContext: {
            totalRoiLaborSaved: `$${metrics.totalLaborValue.toLocaleString()}`,
            hoursLiberated: `${metrics.totalHoursSaved.toFixed(1)} hrs`,
            mrrPotential: `$${metrics.projectedTargetMrr.toLocaleString()}/mo`,
            activeCoverage: `${metrics.overallCoverageAvg}%`,
            activeFleetSize: agents.length
          },
          customInstructions: genCustomInstructions
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.report) {
        onSaveReport(data.report);
        setIsGeneratorModalOpen(false);
        setViewingDocument(data.report);
      } else {
        throw new Error("No report was generated in the response.");
      }
    } catch (err: any) {
      console.error("Error generating report:", err);
      setGenerationError(err.message || "Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COMMAND BAR & HEADER                                        */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-sm">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Business & Operations Dashboard
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Active
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {dashboardLayout === "condensed" ? "Mode: Condensed" : "Mode: Expanded"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {dashboardLayout === "condensed"
                ? "Condensed View • Showing top-line business ROI, recurring revenue potential, and summary performance KPIs."
                : "Expanded View • Showing full interactive visualizer charts, active agent fleet coverage, and executive reports repository."}
            </p>
          </div>

          {/* Quick Action Controls & View Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Layout Toggle Segmented Control */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-xs font-semibold">
              <button
                id="btn-layout-condensed"
                type="button"
                onClick={() => handleLayoutChange("condensed")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  dashboardLayout === "condensed"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold ring-1 ring-black/5 dark:ring-white/10"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Condensed View: Show top-line executive metrics only"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Condensed View</span>
              </button>

              <button
                id="btn-layout-expanded"
                type="button"
                onClick={() => handleLayoutChange("expanded")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  dashboardLayout === "expanded"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold ring-1 ring-black/5 dark:ring-white/10"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Expanded View: Show active agent coverage, visualizers, and detailed reports"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expanded View</span>
              </button>
            </div>

            <button
              id="btn-open-report-generator"
              type="button"
              onClick={() => {
                setIsGeneratorModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-98 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>⚡ Generate Report</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToDispatcher()}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Play className="w-3.5 h-3.5 text-blue-500" />
              <span>Dispatch Agent</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToVault()}
              className="hidden sm:flex px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold items-center gap-1.5 shadow-xs transition-all"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Approved Playbooks</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOP HIGH-LEVEL BUSINESS METRIC CARDS                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: TOTAL ROI & LABOR SAVINGS */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Total ROI & OpEx Replaced
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                {metrics.roiMultiplier}x Multiplier
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                ${metrics.totalLaborValue.toLocaleString()}
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +38.4%
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-slate-400">Hours Liberated</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {metrics.totalHoursSaved.toFixed(1)} hrs
                </div>
              </div>
              <div>
                <div className="text-slate-400">Net Value Margin</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  98.7% Net
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Basis: $85/hr human baseline vs ${metrics.estimatedAiComputeCost} compute cost
            </div>
          </div>

          {/* CARD 2: MRR REVENUE POTENTIAL */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Monthly Recurring Revenue
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                MRR Potential
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                ${metrics.projectedTargetMrr.toLocaleString()}
                <span className="text-xs text-slate-500 font-normal">/mo</span>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> 3.2x Run-Rate
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-slate-400">Active / Pipeline</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  ${metrics.contractedBaseMrr.toLocaleString()}/mo
                </div>
              </div>
              <div>
                <div className="text-slate-400">Gross Margin</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                  {metrics.grossMarginPercent}% Margin
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Annualized Run-Rate: ${(metrics.annualizedRunRate).toLocaleString()} ARR
            </div>
          </div>

          {/* CARD 3: AUTOMATION COVERAGE */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Active Automation Coverage
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                6 Divisions
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                {metrics.overallCoverageAvg}%
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                86.2% Autonomy
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-slate-400">Autonomous Fleet</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {metrics.activeFleetCount} Agents Active
                </div>
              </div>
              <div>
                <div className="text-slate-400">Median Latency</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  14.2s / Task
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              DevOps: 94% • Support: 88% • Eng: 82%
            </div>
          </div>

          {/* CARD 4: SAVED REPORTS & AUDITS */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Intelligence & Reports
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                {savedReports.length} Archived
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono tracking-tight">
                ${(metrics.totalDocumentValue || 110820).toLocaleString()}
              </div>
              <span className="text-xs text-slate-500">Documented Impact</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-slate-400">Executive Briefings</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {savedReports.filter(r => r.classification === "Executive Board").length} Board Memos
                </div>
              </div>
              <div>
                <div className="text-slate-400">Client Proposals</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {savedReports.filter(r => r.category === "Client Proposal & Sales").length} Ready
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Format: Markdown, PDF Export, JSON Schema
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONDENSED VIEW: TOP-LINE METRICS, EXECUTIVE KPI PULSE & BRIEFINGS         */}
        {/* ========================================================================= */}
        {dashboardLayout === "condensed" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. High-Density Executive KPI Pulse Strip */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Executive Performance & Efficiency Pulse
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Consolidated Top-Line Telemetry
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Gross Labor Value
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                    ${metrics.totalLaborValue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> 575.5 hrs @ $85/hr
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Inference Overhead
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                    ${metrics.estimatedAiComputeCost.toFixed(0)}
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                    98.7% Net Margin
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Contracted MRR Base
                  </div>
                  <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                    $18,450 / mo
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    14 Active Tenants
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Target Annualized ARR
                  </div>
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    $458,400
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    74.2% Software Margins
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Fleet Success Rate
                  </div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                    98.4%
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    14.2s Median Latency
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Audit Readiness
                  </div>
                  <div className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1">
                    SOC2 Ready
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    0 Policy Violations
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Condensed Departmental Automation Coverage Strip */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Departmental Automation Coverage Summary
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleLayoutChange("expanded")}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>View Full Roster & Visualizers</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {metrics.departmentCoverageData.map((dept) => (
                  <div
                    key={dept.name}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {dept.name}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                        {dept.coverage}%
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {dept.hoursSaved}h saved
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${dept.coverage}%`, backgroundColor: dept.fill }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 text-right">
                      {dept.automatedTasks} tasks automated
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Quick Pinned Briefings & Reports (Condensed List) */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Executive Briefings & Pinned Documents
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {condensedPinnedReports.length} Quick Access
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleLayoutChange("expanded")}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Full Document Vault ({savedReports.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {condensedPinnedReports.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.isPinned && (
                          <span className="p-0.5 rounded text-blue-600 dark:text-blue-400">
                            <Pin className="w-3 h-3 fill-current" />
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {doc.classification}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {doc.department}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          • {doc.createdAt}
                        </span>
                      </div>
                      <h3
                        onClick={() => setViewingDocument(doc)}
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors truncate"
                      >
                        {doc.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Agent: <strong className="text-slate-700 dark:text-slate-300">{doc.agentName}</strong> — {doc.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingDocument(doc)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyMarkdown(doc)}
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Copy Markdown"
                      >
                        {copiedDocId === doc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Condensed Mode Switcher Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Viewing Condensed Mode (Top-line Metrics Only)
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Switch to Expanded View to explore active agent fleet coverage breakdown, visualizer charts, and the complete intelligence vault.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleLayoutChange("expanded")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs whitespace-nowrap transition-all self-start sm:self-auto"
              >
                Switch to Expanded View →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPANDED VIEW: VISUALIZERS, ACTIVE AGENT COVERAGE & DETAILED REPORTS VAULT */}
        {/* ========================================================================= */}
        {dashboardLayout === "expanded" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 3. INTERACTIVE VISUALIZERS: ROI TRAJECTORY & COVERAGE MATRIX            */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              {/* Chart Header & Tab Toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Executive Visualizers & Trajectory
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track cumulative financial ROI, cross-department automation density, and monthly SaaS revenue expansion.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveChartTab("roi_trend")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeChartTab === "roi_trend"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    📈 Labor ROI Acceleration
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChartTab("coverage_matrix")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeChartTab === "coverage_matrix"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    📊 Department Coverage
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChartTab("mrr_forecast")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeChartTab === "mrr_forecast"
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    💰 MRR Expansion
                  </button>
                </div>
              </div>

              {/* TAB 1: ROI ACCELERATION AREA CHART */}
              {activeChartTab === "roi_trend" && (
                <div className="space-y-4">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={roiGrowthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLaborValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorNetProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "0.75rem",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                        <Area
                          type="monotone"
                          dataKey="laborValue"
                          name="Labor OpEx Replaced ($)"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorLaborValue)"
                        />
                        <Area
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Value Created ($)"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorNetProfit)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                      <div className="text-slate-500 dark:text-slate-400">Compounded Value Velocity</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                        +$8,400 / Month Run-Rate
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                      <div className="text-slate-500 dark:text-slate-400">Total Compute Overhead</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                        $640.20 Total Cloud Tokens
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                      <div className="text-slate-500 dark:text-slate-400">Capital Efficiency Ratio</div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
                        76.4x Return on Inference
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DEPARTMENTAL COVERAGE MATRIX BAR CHART */}
              {activeChartTab === "coverage_matrix" && (
                <div className="space-y-4">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.departmentCoverageData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                        <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "0.75rem",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(val: any) => [`${val}% Coverage`, "Automation Index"]}
                        />
                        <Bar dataKey="coverage" name="Automation Coverage %" radius={[8, 8, 0, 0]}>
                          {metrics.departmentCoverageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Departmental Detail Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
                    {metrics.departmentCoverageData.map((dept) => (
                      <div key={dept.name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-center">
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {dept.name}
                        </div>
                        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                          {dept.coverage}%
                        </div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          {dept.hoursSaved}h saved
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MRR EXPANSION LINE/AREA CHART */}
              {activeChartTab === "mrr_forecast" && (
                <div className="space-y-4">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mrrForecastData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGrossMrr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "0.75rem",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                        <Area
                          type="monotone"
                          dataKey="totalGross"
                          name="Projected Monthly Revenue ($)"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorGrossMrr)"
                        />
                        <Line
                          type="monotone"
                          dataKey="currentBase"
                          name="Base Subscription Core ($)"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                      <div className="text-slate-500 dark:text-slate-400">Target Q4 MRR</div>
                      <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                        $38,200 / Month
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                      <div className="text-slate-500 dark:text-slate-400">Token Markup Gross Margin</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                        74.2% Software Grade
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                      <div className="text-slate-500 dark:text-slate-400">Contracted Annualized ARR</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                        $458,400 Run-Rate
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. ACTIVE AGENT FLEET COVERAGE BREAKDOWN                                 */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Active Agent Coverage & Operational Fleet
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {filteredActiveAgents.length} Agents Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live autonomous coverage roster by business division, model specification, runtime telemetry, and direct dispatch controls.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenAgentBuilder}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deploy New Agent</span>
                </button>
              </div>

              {/* Department Filter Tabs for Agents */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveAgentDeptFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeAgentDeptFilter === "all"
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Divisions ({agents.length})
                </button>
                {REPORT_DEPARTMENTS.map((dept) => {
                  const count = agents.filter(a => a.department === dept).length;
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setActiveAgentDeptFilter(dept)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        activeAgentDeptFilter === dept
                          ? "bg-blue-600 text-white shadow-xs font-bold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{dept}</span>
                      <span className="text-[10px] opacity-75 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Agent Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActiveAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between space-y-3 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs group"
                  >
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                            <DynamicIcon name={agent.avatar || "bot"} className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                              {agent.name}
                            </h3>
                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {agent.department}
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Capabilities / permissions tags */}
                      {agent.permissions && agent.permissions.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          {agent.permissions.slice(0, 3).map((perm, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[120px]"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Operational Telemetry & Dispatch CTA */}
                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="p-1 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40">
                          <div className="text-[9px] text-slate-400">Model</div>
                          <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate font-mono mt-0.5">
                            {agent.model.replace("gemini-", "").replace("-preview", "")}
                          </div>
                        </div>

                        <div className="p-1 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40">
                          <div className="text-[9px] text-slate-400">Success</div>
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            98.8%
                          </div>
                        </div>

                        <div className="p-1 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/40">
                          <div className="text-[9px] text-slate-400">Saved</div>
                          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                            {(Math.random() * 40 + 20).toFixed(0)}h
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateToDispatcher(agent.id)}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Dispatch {agent.name.split(" ")[0]}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. SAVED REPORTS & BUSINESS DOCUMENTS VAULT (FIRST-CLASS REPOSITORY)    */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Executive Reports & Documents Vault
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {filteredReports.length} of {savedReports.length} Documents
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Formal business reports, SRE incident post-mortems, financial ROI audits, and client proposals generated and preserved by your agent fleet.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Intelligence Report</span>
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports by title, agent, keywords, or takeaways..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Department Filter */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Departments</option>
                    <option value="DevOps & SecOps">DevOps & SecOps</option>
                    <option value="Sales & CRM">Sales & CRM</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance & Legal">Finance & Legal</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Document Cards Grid */}
              {filteredReports.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No matching reports found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {searchQuery || selectedCategory !== "all" || selectedDept !== "all"
                      ? "Try clearing your filters or search query to view all available documents."
                      : "Generate your first executive report with Gemini AI to preserve audit history and strategic insights."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsGeneratorModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs"
                  >
                    ⚡ Generate Executive Report
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredReports.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                        doc.isPinned
                          ? "border-blue-300 dark:border-blue-700/80 ring-1 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Card Header */}
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                doc.classification === "Executive Board"
                                  ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                                  : doc.classification === "Client Facing"
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {doc.classification}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                              {doc.category}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {doc.department}
                            </span>
                          </div>

                          {/* Pin Toggle Button */}
                          <button
                            type="button"
                            onClick={() => onTogglePinReport(doc.id)}
                            className={`p-1 rounded-lg transition-colors ${
                              doc.isPinned
                                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            }`}
                            title={doc.isPinned ? "Unpin document" : "Pin to top"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title & Author */}
                        <div>
                          <h3
                            onClick={() => setViewingDocument(doc)}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug"
                          >
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>Agent: <strong>{doc.agentName}</strong></span>
                            <span>•</span>
                            <span>{doc.createdAt}</span>
                            <span>•</span>
                            <span>{doc.wordCount || 850} words</span>
                          </div>
                        </div>

                        {/* Summary */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {doc.summary}
                        </p>

                        {/* Key Highlights Metrics */}
                        {doc.metricsHighlights && doc.metricsHighlights.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                            {doc.metricsHighlights.slice(0, 4).map((m, idx) => (
                              <div key={idx} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-center">
                                <div className="text-[9px] text-slate-400 truncate">{m.label}</div>
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{m.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer & Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Read Document</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyMarkdown(doc)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Copy Markdown"
                          >
                            {copiedDocId === doc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Download Markdown"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteReport(doc.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FULL-FEATURED EXECUTIVE DOCUMENT READER MODAL                          */}
      {/* ========================================================================= */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {viewingDocument.classification}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {viewingDocument.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ID: {viewingDocument.id}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {viewingDocument.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>Author: <strong>{viewingDocument.agentName}</strong> ({viewingDocument.department})</span>
                  <span>•</span>
                  <span>{viewingDocument.createdAt}</span>
                  <span>•</span>
                  <span>Model: {viewingDocument.modelUsed}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyMarkdown(viewingDocument)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedDocId === viewingDocument.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadDocument(viewingDocument)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Download Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewingDocument(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with Rendered Markdown */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Key Takeaways Callout */}
              {viewingDocument.keyTakeaways && viewingDocument.keyTakeaways.length > 0 && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Executive Key Takeaways & Institutional Impact
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-300">
                    {viewingDocument.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rendered Markdown Body */}
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                <Markdown>{viewingDocument.content}</Markdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 text-xs">
              <div className="text-slate-400">
                Document Word Count: {viewingDocument.wordCount || 950} • Verified by Agent Security Gates
              </div>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AI ON-DEMAND REPORT GENERATOR MODAL                                    */}
      {/* ========================================================================= */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Generate Executive Report with AI
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct Gemini model synthesis tailored to live metrics and organizational data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGeneratorModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGenerateReportSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Preset Templates Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select Quick Template Preset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PRESET_REPORT_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-600 text-left transition-all text-xs"
                    >
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {tpl.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {tpl.department} • {tpl.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    placeholder="e.g. Q3 Strategic ROI Audit"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Report Category
                  </label>
                  <select
                    value={genCategory}
                    onChange={(e) => setGenCategory(e.target.value as ReportCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="Executive Briefing">Executive Briefing</option>
                    <option value="Financial & ROI Audit">Financial & ROI Audit</option>
                    <option value="SRE & Incident Post-Mortem">SRE & Incident Post-Mortem</option>
                    <option value="Client Proposal & Sales">Client Proposal & Sales</option>
                    <option value="Operational Playbook & SOP">Operational Playbook & SOP</option>
                    <option value="Compliance & Security Review">Compliance & Security Review</option>
                  </select>
                </div>
              </div>

              {/* Classification, Department & Author Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Classification
                  </label>
                  <select
                    value={genClassification}
                    onChange={(e) => setGenClassification(e.target.value as ReportClassification)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="Executive Board">Executive Board</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Client Facing">Client Facing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <select
                    value={genDepartment}
                    onChange={(e) => setGenDepartment(e.target.value as Department)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="Finance & Legal">Finance & Legal</option>
                    <option value="DevOps & SecOps">DevOps & SecOps</option>
                    <option value="Sales & CRM">Sales & CRM</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Author Agent
                  </label>
                  <select
                    value={genAgentId}
                    onChange={(e) => setGenAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Core Topic / Objective Directive */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Core Objective & Prompt Directive
                </label>
                <textarea
                  rows={3}
                  required
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="Describe the executive topic, specific targets, or questions to address..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Special Instructions (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Custom Strategic Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={genCustomInstructions}
                  onChange={(e) => setGenCustomInstructions(e.target.value)}
                  placeholder="e.g. Include pricing table, focus on SRE zero-downtime, emphasize labor savings..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {generationError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGenerating || !genTitle.trim() || !genTopic.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Document with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate & Save Document</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
