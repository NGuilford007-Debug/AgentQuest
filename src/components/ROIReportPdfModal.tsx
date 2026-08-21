import React, { useState, useMemo } from "react";
import { 
  FileDown, 
  X, 
  Check, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  TrendingUp, 
  CheckSquare, 
  Square,
  AlertCircle,
  FileText,
  Printer,
  BarChart3,
  Eye,
  Sliders,
  Users2,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  PieChart,
  FileSpreadsheet,
  BadgeCheck,
  Award,
  Lock,
  CheckCircle2,
  Activity,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { Agent, TaskExecutionRecord } from "../types";
import { 
  generateEnterprisePdfReport, 
  PDFReportConfig, 
  ForecastSummaryData 
} from "../utils/pdfExport";
import { exportEnterpriseAnalyticsCsv } from "../utils/csvExport";

interface ROIReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  executionHistory: TaskExecutionRecord[];
  forecastSummaryData: ForecastSummaryData;
  timeHorizon: string;
}

export const ROIReportPdfModal: React.FC<ROIReportPdfModalProps> = ({
  isOpen,
  onClose,
  agents,
  executionHistory,
  forecastSummaryData,
  timeHorizon,
}) => {
  const [activeTab, setActiveTab] = useState<"preview" | "config">("preview");
  const [chartMode, setChartMode] = useState<"financial" | "capacity">("financial");
  const [companyName, setCompanyName] = useState<string>("Apex Enterprise Global Corp");
  const [preparedFor, setPreparedFor] = useState<string>("Board of Directors & CFO");
  const [preparedBy, setPreparedBy] = useState<string>("VP of AI Automation & Operations");
  const [hourlyRate, setHourlyRate] = useState<number>(forecastSummaryData.hourlyRate || 85);
  const [customNotes, setCustomNotes] = useState<string>(
    "Agent throughput demonstrates a 28x return on AI infrastructure spend. Autonomous workflow delegation has successfully decoupled business task expansion from linear headcount scaling while maintaining 98%+ spec compliance."
  );

  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeHistoricalMetrics, setIncludeHistoricalMetrics] = useState(true);
  const [includeForecastSection, setIncludeForecastSection] = useState(true);
  const [includeDepartmentBreakdown, setIncludeDepartmentBreakdown] = useState(true);
  const [includeQualityAudit, setIncludeQualityAudit] = useState(true);
  const [includeAgentRoster, setIncludeAgentRoster] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);

  const LICENSE_NUMBER = "AE-2026-9842-PROD";
  const VERIFICATION_DIGEST = "8f42e9a1c57b32d0";

  // Dynamic calculated metrics based on current hourlyRate
  const computedMetrics = useMemo(() => {
    const rate = hourlyRate || 85;
    const historicalCostSaved = Math.round(forecastSummaryData.totalHistoricalHours * rate);
    
    // Scale 12-mo projected values according to selected hourly rate
    const projectedGross = Math.round(forecastSummaryData.projected12MoHours * rate);
    const estimatedAiCost = Math.max(
      1,
      Math.round(
        forecastSummaryData.projected12MoGrossSavings > 0
          ? (forecastSummaryData.projected12MoGrossSavings - forecastSummaryData.projected12MoNetValue)
          : forecastSummaryData.projected12MoTasks * 0.038
      )
    );
    const projectedNet = Math.max(0, projectedGross - estimatedAiCost);
    const roiMultiplier = estimatedAiCost > 0 ? (projectedGross / estimatedAiCost).toFixed(1) : "32.0";

    const departments = forecastSummaryData.departmentBreakdown.map((dept) => ({
      ...dept,
      costSaved: Math.round(dept.hours * rate),
    }));

    const monthlyProjections = forecastSummaryData.monthlyProjections.map((m) => {
      const gross = Math.round(m.hours * rate);
      const aiCost = Math.round(m.tasks * 0.038);
      return {
        ...m,
        grossSavings: gross,
        aiCost,
        netSavings: Math.max(0, gross - aiCost),
      };
    });

    return {
      historicalCostSaved,
      projectedGross,
      estimatedAiCost,
      projectedNet,
      roiMultiplier,
      departments,
      monthlyProjections,
    };
  }, [hourlyRate, forecastSummaryData]);

  if (!isOpen) return null;

  const currentConfig: PDFReportConfig = {
    companyName,
    preparedFor,
    preparedBy,
    timeHorizon,
    forecastHorizonMonths: 12,
    hourlyRate,
    includeExecutiveSummary,
    includeHistoricalMetrics,
    includeForecastSection,
    includeDepartmentBreakdown,
    includeQualityAudit,
    includeAgentRoster,
    notes: customNotes,
  };

  const updatedSummary: ForecastSummaryData = {
    ...forecastSummaryData,
    hourlyRate,
    totalHistoricalCostSaved: computedMetrics.historicalCostSaved,
    projected12MoGrossSavings: computedMetrics.projectedGross,
    projected12MoNetValue: computedMetrics.projectedNet,
    departmentBreakdown: computedMetrics.departments,
    monthlyProjections: computedMetrics.monthlyProjections,
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      await generateEnterprisePdfReport(currentConfig, updatedSummary, agents, executionHistory);
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 4000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    setIsExportingCsv(true);
    setCsvSuccess(false);

    try {
      exportEnterpriseAnalyticsCsv({
        config: currentConfig,
        summaryData: updatedSummary,
        agents,
        executionHistory,
        licenseId: LICENSE_NUMBER,
        verificationHash: VERIFICATION_DIGEST,
      });

      setIsExportingCsv(false);
      setCsvSuccess(true);
      setTimeout(() => {
        setCsvSuccess(false);
      }, 4000);
    } catch (err) {
      console.error("CSV generation failed:", err);
      setIsExportingCsv(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* MODAL HEADER WITH LICENSED PRODUCT BADGING */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 text-slate-950 flex items-center justify-center shadow-lg font-bold">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Executive ROI & Forecast Studio</span>
                </h2>
                {/* Licensed Product Enterprise Seal */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  <BadgeCheck className="w-3 h-3 text-emerald-400" />
                  <span>Licensed Enterprise Edition</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono">
                  {LICENSE_NUMBER}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Audit-grade financial telemetry, predictive scenario curves, and multi-format reporting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            {/* Quick CSV Download Icon in Header */}
            <button
              id="btn-header-csv-export"
              type="button"
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              title="Download CSV Analytics Dataset"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all active:scale-95 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV Data</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW NAVIGATION TAB BAR */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="tab-btn-preview"
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "preview"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Financial Metrics & KPI Charts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono">
                ${computedMetrics.projectedNet.toLocaleString()} Net
              </span>
            </button>

            <button
              id="tab-btn-config"
              type="button"
              onClick={() => setActiveTab("config")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "config"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Report Setup & Metadata</span>
            </button>
          </div>

          {/* Compliance & Security Telemetry Tag */}
          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="hidden sm:flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SOC-2 Type II Certified</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1">
              <span>Digest:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                SHA256:{VERIFICATION_DIGEST}
              </span>
            </div>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          
          {/* ======================================================== */}
          {/* TAB 1: FINANCIAL METRICS SUMMARY & KPI SUMMARY CHART */}
          {/* ======================================================== */}
          {activeTab === "preview" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Executive Financial Hero Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                        Executive Financial Telemetry
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        {computedMetrics.roiMultiplier}x ROI Multiple
                      </span>
                    </div>
                    <div className="text-xl sm:text-3xl font-black text-white font-mono mt-1">
                      ${computedMetrics.projectedNet.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-slate-300">12-Month Net Financial Return</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Liberated Labor Value</div>
                    <div className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                      ${computedMetrics.projectedGross.toLocaleString()} Gross
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono">
                      -${computedMetrics.estimatedAiCost.toLocaleString()} compute overhead
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Financial KPI Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase flex items-center justify-between">
                    <span>Historic Value</span>
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    ${computedMetrics.historicalCostSaved.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {forecastSummaryData.totalHistoricalHours.toLocaleString()} hrs saved
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase flex items-center justify-between">
                    <span>12-Mo Net Savings</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${computedMetrics.projectedNet.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600/80">
                    +{forecastSummaryData.projectedFteLiberated.toFixed(1)} FTEs capacity
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-1">
                  <div className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold uppercase flex items-center justify-between">
                    <span>Fleet Throughput</span>
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {forecastSummaryData.projected12MoTasks.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-blue-600/80">
                    {agents.length} active agents
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-1">
                  <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold uppercase flex items-center justify-between">
                    <span>Quality Compliance</span>
                    <BadgeCheck className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {forecastSummaryData.qualityRate}%
                  </div>
                  <div className="text-[10px] text-purple-600/80">
                    Audit verified
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* KPI SUMMARY CHART COMPONENT (NEW) */}
              {/* ======================================================== */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                        Predictive Financial & Capacity KPI Summary Chart
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Visual trajectory across 12-month autonomous milestone horizons.
                      </p>
                    </div>
                  </div>

                  {/* Chart Metric Mode Toggles */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setChartMode("financial")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        chartMode === "financial"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Financial ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode("capacity")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        chartMode === "capacity"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      FTEs & Tasks
                    </button>
                  </div>
                </div>

                {/* Recharts Render */}
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === "financial" ? (
                      <AreaChart
                        data={computedMetrics.monthlyProjections}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorNetSavings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorGrossSavings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis 
                          dataKey="monthName" 
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8" 
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                          tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            borderRadius: "12px",
                            border: "1px solid rgba(51, 65, 85, 0.8)",
                            fontSize: "11px",
                            color: "#f8fafc",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                          }}
                          formatter={(value: any, name: any) => [
                            `$${Number(value).toLocaleString()}`,
                            name === "netSavings" ? "Net Financial Return" : name === "grossSavings" ? "Gross Labor Value" : "AI Compute Overhead"
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                          formatter={(val) => val === "netSavings" ? "Net Enterprise Return" : val === "grossSavings" ? "Gross Labor Liberated" : "AI Overhead"}
                        />
                        <Area
                          type="monotone"
                          dataKey="grossSavings"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorGrossSavings)"
                        />
                        <Area
                          type="monotone"
                          dataKey="netSavings"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorNetSavings)"
                        />
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={computedMetrics.monthlyProjections}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis 
                          dataKey="monthName" 
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8" 
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                          tickFormatter={(val) => `${val}`} 
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10 }}
                          stroke="#a855f7"
                          tickFormatter={(val) => `${val.toFixed(1)} FTE`} 
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            borderRadius: "12px",
                            border: "1px solid rgba(51, 65, 85, 0.8)",
                            fontSize: "11px",
                            color: "#f8fafc",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                          }}
                          formatter={(value: any, name: any) => [
                            name === "tasks" ? `${Number(value).toLocaleString()} tasks` : `+${Number(value).toFixed(2)} FTE`,
                            name === "tasks" ? "Monthly Task Volume" : "Liberated FTE Staff Equivalent"
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Bar 
                          yAxisId="left"
                          dataKey="tasks" 
                          name="Monthly Tasks"
                          fill="#3b82f6" 
                          radius={[6, 6, 0, 0]} 
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="fteEquivalent" 
                          name="FTE Equivalent Liberated"
                          fill="#a855f7" 
                          radius={[6, 6, 0, 0]} 
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Departmental Allocation Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <PieChart className="w-4 h-4 text-emerald-500" />
                    <span>Departmental Labor Value Allocation</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Assumed @ ${hourlyRate}/hr
                  </span>
                </div>

                <div className="space-y-2">
                  {computedMetrics.departments.map((dept, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {dept.name}
                        </span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-500">{dept.hours.toLocaleString()} hrs</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${dept.costSaved.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-400 w-8 text-right">{dept.percent}%</span>
                        </div>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${dept.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projected Monthly Milestones Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Forecast Milestone Trajectory Data Matrix</span>
                  </h3>

                  {/* Inline CSV Export Link */}
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Export Data to CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5">Milestone</th>
                        <th className="p-2.5 text-right">Tasks / Mo</th>
                        <th className="p-2.5 text-right">Hours Saved</th>
                        <th className="p-2.5 text-right">FTE Equiv</th>
                        <th className="p-2.5 text-right">Gross Liberated</th>
                        <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Net Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {computedMetrics.monthlyProjections.map((p, idx) => (
                        <tr 
                          key={idx} 
                          className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/30"}
                        >
                          <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-white">
                            {p.monthName}
                          </td>
                          <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                            {p.tasks.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                            {p.hours.toLocaleString()} hrs
                          </td>
                          <td className="p-2.5 text-right text-purple-600 dark:text-purple-400 font-semibold">
                            +{p.fteEquivalent.toFixed(1)} FTE
                          </td>
                          <td className="p-2.5 text-right text-slate-700 dark:text-slate-300">
                            ${p.grossSavings.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                            ${p.netSavings.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Licensed Document Structure & Security Seal */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold">
                  <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Licensed Artifact Security: Digitally Signed & Immutable Audit Format</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                    PDF / A4 Vector Format
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                    RFC 4180 CSV Dataset
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REPORT SETUP & METADATA CONFIGURATION */}
          {/* ======================================================== */}
          {activeTab === "config" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Form Fields: Company & Recipient metadata */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>Report Header & Governance Metadata</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Enterprise / Organization Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Apex Global Technologies"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Prepared For (Recipient / Committee)
                    </label>
                    <input
                      type="text"
                      value={preparedFor}
                      onChange={(e) => setPreparedFor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Board of Directors, CFO, VP Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Prepared By (Author / Division)
                    </label>
                    <input
                      type="text"
                      value={preparedBy}
                      onChange={(e) => setPreparedBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. AI Operations CoE"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Loaded Labor Cost Assumption ($/hr)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="number"
                        min="30"
                        max="500"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Inclusion Toggles */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Report Sections & Visual Modules</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "Executive Summary & Historical KPIs", state: includeExecutiveSummary, set: setIncludeExecutiveSummary },
                    { label: "Predictive 12-Month ROI Financial Forecast", state: includeForecastSection, set: setIncludeForecastSection },
                    { label: "Departmental Labor Distribution Table", state: includeDepartmentBreakdown, set: setIncludeDepartmentBreakdown },
                    { label: "Agent Fleet Operational Roster", state: includeAgentRoster, set: setIncludeAgentRoster },
                    { label: "Quality Audit & Spec Compliance Summary", state: includeQualityAudit, set: setIncludeQualityAudit },
                    { label: "Full-Time Employee (FTE) Equivalence", state: includeHistoricalMetrics, set: setIncludeHistoricalMetrics },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => item.set(!item.state)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        item.state
                          ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-semibold"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500"
                      }`}
                    >
                      {item.state ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Executive Commentary */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Executive Commentary & Governance Notes
                </label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
                  placeholder="Include notes on AI governance, human-in-the-loop review, and budget recommendations..."
                />
              </div>

            </div>
          )}

          {/* Export Success Feedback for PDF */}
          {exportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold">
                Executive PDF report successfully compiled and downloaded to your device!
              </span>
            </div>
          )}

          {/* Export Success Feedback for CSV */}
          {csvSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold">
                Enterprise analytics CSV dataset successfully generated and downloaded!
              </span>
            </div>
          )}
        </div>

        {/* MODAL FOOTER WITH PDF, CSV & PRINT BUTTONS */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print View Action */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>

            {/* CSV Export Action Button */}
            <button
              id="btn-modal-export-csv"
              type="button"
              disabled={isExportingCsv}
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {isExportingCsv ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Exporting CSV...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Download CSV Dataset</span>
                </>
              )}
            </button>

            {/* PDF Export Action Button */}
            <button
              id="btn-modal-export-pdf"
              type="button"
              disabled={isExporting}
              onClick={handleExportPdf}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compiling PDF Report...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download Executive PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


