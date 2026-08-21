import React, { useState, useMemo } from "react";
import { Agent, TaskExecutionRecord } from "../types";
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Users2, 
  Zap, 
  Sparkles, 
  Sliders, 
  ArrowUpRight, 
  FileDown, 
  Layers, 
  CheckCircle2,
  Calendar,
  BarChart3,
  Scale,
  ShieldCheck,
  RefreshCw,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { ForecastSummaryData } from "../utils/pdfExport";

interface ROIForecastSectionProps {
  agents: Agent[];
  executionHistory: TaskExecutionRecord[];
  onOpenPdfModal: () => void;
  onUpdateForecastData?: (data: ForecastSummaryData) => void;
}

export const ROIForecastSection: React.FC<ROIForecastSectionProps> = ({
  agents,
  executionHistory,
  onOpenPdfModal,
  onUpdateForecastData,
}) => {
  // Scenario state
  const [selectedHorizonMonths, setSelectedHorizonMonths] = useState<number>(12); // 3, 6, 12, 24, 36
  const [growthScenario, setGrowthScenario] = useState<"conservative" | "expected" | "aggressive">("expected");
  const [loadedHourlyRate, setLoadedHourlyRate] = useState<number>(85);
  const [fleetExpansionCount, setFleetExpansionCount] = useState<number>(Math.max(agents.length, 10));
  const [efficiencyGainFactor, setEfficiencyGainFactor] = useState<number>(1.35); // 1.0x to 2.5x
  const [apiCostPerTask, setApiCostPerTask] = useState<number>(0.038); // $0.038 / execution
  const [activeChartTab, setActiveChartTab] = useState<"financial" | "throughput_fte" | "departments">("financial");

  // Base live metrics from current fleet
  const activeAgentCount = Math.max(1, agents.length);
  const totalHistoricHours = agents.reduce((acc, a) => acc + a.stats.hoursSaved, 0) + 
    executionHistory.reduce((acc, e) => acc + (e.hoursSaved || 0), 0);
  const totalHistoricTasks = agents.reduce((acc, a) => acc + a.stats.tasksCompleted, 0) + executionHistory.length;

  // Average hours saved per task from actual executions
  const avgHoursPerTask = totalHistoricTasks > 0 
    ? Math.max(0.4, parseFloat((totalHistoricHours / totalHistoricTasks).toFixed(2)))
    : 0.65;

  // Baseline monthly run-rate per agent
  const baseMonthlyTasksPerAgent = Math.max(45, Math.round(totalHistoricTasks / activeAgentCount) || 60);

  // Scenario Monthly Growth Rates
  const scenarioGrowthRates = {
    conservative: 0.08, // 8% MoM
    expected: 0.20,     // 20% MoM
    aggressive: 0.38,   // 38% MoM
  };

  const currentMonthlyGrowthRate = scenarioGrowthRates[growthScenario];

  // Mathematical Forecast Engine: Generate Month-by-Month Projected Data
  const { forecastTimeline, summaryData } = useMemo(() => {
    const timeline: any[] = [];
    const now = new Date();
    
    let cumulativeHours = 0;
    let cumulativeGrossSavings = 0;
    let cumulativeAiCost = 0;
    let cumulativeNetSavings = 0;
    let cumulativeTasks = 0;

    const targetMonths = selectedHorizonMonths;

    for (let m = 1; m <= targetMonths; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const monthLabel = monthDate.toLocaleDateString("en-US", { month: "short", year: targetMonths > 12 ? "2-digit" : undefined });

      // Gradual fleet expansion ramp
      const progressFraction = Math.min(1, m / Math.min(12, targetMonths));
      const effectiveFleetSize = activeAgentCount + (fleetExpansionCount - activeAgentCount) * progressFraction;

      // Compound growth in tasks per agent due to team delegation & efficiency gains
      const compoundMultiplier = Math.pow(1 + currentMonthlyGrowthRate, m - 1);
      const learningCurveEfficiency = 1 + (efficiencyGainFactor - 1) * (m / targetMonths);

      const monthlyTasks = Math.round(
        effectiveFleetSize * baseMonthlyTasksPerAgent * compoundMultiplier * learningCurveEfficiency
      );

      const monthlyHours = parseFloat((monthlyTasks * avgHoursPerTask).toFixed(1));
      const monthlyGrossSavings = Math.round(monthlyHours * loadedHourlyRate);
      const monthlyAiCost = Math.round(monthlyTasks * apiCostPerTask);
      const monthlyNetSavings = monthlyGrossSavings - monthlyAiCost;
      
      // 1 Full Time Employee (FTE) ~ 160 productive working hours/month
      const monthlyFteEquivalent = parseFloat((monthlyHours / 160).toFixed(1));

      cumulativeTasks += monthlyTasks;
      cumulativeHours += monthlyHours;
      cumulativeGrossSavings += monthlyGrossSavings;
      cumulativeAiCost += monthlyAiCost;
      cumulativeNetSavings += monthlyNetSavings;

      // Departmental distribution projection
      const deptSupport = Math.round(monthlyGrossSavings * 0.34);
      const deptEngineering = Math.round(monthlyGrossSavings * 0.28);
      const deptDevops = Math.round(monthlyGrossSavings * 0.18);
      const deptSales = Math.round(monthlyGrossSavings * 0.12);
      const deptOps = Math.round(monthlyGrossSavings * 0.08);

      timeline.push({
        month: m,
        monthName: monthLabel,
        effectiveFleetSize: Math.round(effectiveFleetSize),
        tasks: monthlyTasks,
        cumulativeTasks,
        hours: monthlyHours,
        cumulativeHours: parseFloat(cumulativeHours.toFixed(1)),
        fteEquivalent: monthlyFteEquivalent,
        grossSavings: monthlyGrossSavings,
        aiCost: monthlyAiCost,
        netSavings: monthlyNetSavings,
        cumulativeGross: cumulativeGrossSavings,
        cumulativeNet: cumulativeNetSavings,
        cumulativeAiCost: cumulativeAiCost,
        deptSupport,
        deptEngineering,
        deptDevops,
        deptSales,
        deptOps,
      });
    }

    // 12-Month Anchor or Full-Horizon Anchor
    const final12Mo = timeline[Math.min(11, timeline.length - 1)] || timeline[timeline.length - 1];

    const summary: ForecastSummaryData = {
      totalHistoricalHours: parseFloat(totalHistoricHours.toFixed(1)),
      totalHistoricalCostSaved: Math.round(totalHistoricHours * loadedHourlyRate),
      totalTasks: totalHistoricTasks,
      qualityRate: 98.4,
      hourlyRate: loadedHourlyRate,
      projected12MoHours: final12Mo ? final12Mo.cumulativeHours : 0,
      projected12MoGrossSavings: final12Mo ? final12Mo.cumulativeGross : 0,
      projected12MoNetValue: final12Mo ? final12Mo.cumulativeNet : 0,
      projected12MoTasks: final12Mo ? final12Mo.cumulativeTasks : 0,
      projectedFteLiberated: final12Mo ? parseFloat((final12Mo.cumulativeHours / 1920).toFixed(1)) : 0, // 1,920 hrs/yr FTE
      growthScenarioName: growthScenario === "conservative" ? "Conservative (8% MoM)" : growthScenario === "expected" ? "Balanced (20% MoM)" : "Hyper-Scale (38% MoM)",
      monthlyProjections: [
        timeline[0],
        timeline[2] || timeline[timeline.length - 1],
        timeline[5] || timeline[timeline.length - 1],
        timeline[11] || timeline[timeline.length - 1],
      ].filter(Boolean),
      departmentBreakdown: [
        { name: "Customer Support", hours: Math.round(cumulativeHours * 0.34), costSaved: Math.round(cumulativeGrossSavings * 0.34), percent: 34 },
        { name: "Engineering", hours: Math.round(cumulativeHours * 0.28), costSaved: Math.round(cumulativeGrossSavings * 0.28), percent: 28 },
        { name: "DevOps & SecOps", hours: Math.round(cumulativeHours * 0.18), costSaved: Math.round(cumulativeGrossSavings * 0.18), percent: 18 },
        { name: "Sales & CRM", hours: Math.round(cumulativeHours * 0.12), costSaved: Math.round(cumulativeGrossSavings * 0.12), percent: 12 },
        { name: "Operations & HR", hours: Math.round(cumulativeHours * 0.08), costSaved: Math.round(cumulativeGrossSavings * 0.08), percent: 8 },
      ],
    };

    return { forecastTimeline: timeline, summaryData: summary };
  }, [
    selectedHorizonMonths,
    growthScenario,
    loadedHourlyRate,
    fleetExpansionCount,
    efficiencyGainFactor,
    apiCostPerTask,
    activeAgentCount,
    totalHistoricHours,
    totalHistoricTasks,
    avgHoursPerTask,
    baseMonthlyTasksPerAgent,
  ]);

  // Inform parent of updated summary data if callback provided
  React.useEffect(() => {
    if (onUpdateForecastData) {
      onUpdateForecastData(summaryData);
    }
  }, [summaryData, onUpdateForecastData]);

  // Milestones for tabular inspection
  const milestoneIndices = [
    { label: "Month 1 (Immediate)", idx: 0 },
    { label: "Month 3 (Quarterly)", idx: 2 },
    { label: "Month 6 (Mid-Year)", idx: 5 },
    { label: "Month 12 (Annual)", idx: 11 },
    { label: "Month 24 (Year 2)", idx: 23 },
    { label: "Month 36 (Year 3)", idx: 35 },
  ].filter((m) => m.idx < forecastTimeline.length);

  // Custom Chart Tooltip for Forecast
  const ForecastChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 bg-slate-900/95 text-white border border-slate-700 rounded-2xl shadow-2xl text-xs space-y-2 backdrop-blur-md">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{label} Projection</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Predictive Model</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-6 text-[11px]">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold">
                {typeof entry.value === "number" && entry.name.toLowerCase().includes("cost") || entry.name.toLowerCase().includes("saving") || entry.name.toLowerCase().includes("net")
                  ? `$${Math.round(entry.value).toLocaleString()}`
                  : typeof entry.value === "number" && entry.name.toLowerCase().includes("fte")
                  ? `+${entry.value.toFixed(1)} FTEs`
                  : typeof entry.value === "number" && entry.name.toLowerCase().includes("hours")
                  ? `${entry.value.toLocaleString()} hrs`
                  : `${entry.value.toLocaleString()}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      
      {/* SECTION HEADER WITH SCENARIOS & EXPORT ACTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-md">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Predictive Enterprise ROI & Financial Growth Forecast</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-800">
                THROUGHPUT-DRIVEN AI MODEL
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Simulate future financial return and workforce liberation based on current active agent throughput, task delegation velocity, and fleet expansion targets.
          </p>
        </div>

        {/* Action Controls: PDF Export + Horizon Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Horizon Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            {[
              { label: "6 Mo", val: 6 },
              { label: "1 Year", val: 12 },
              { label: "2 Years", val: 24 },
              { label: "3 Years", val: 36 },
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setSelectedHorizonMonths(item.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedHorizonMonths === item.val
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Export PDF Button */}
          <button
            id="btn-export-roi-pdf"
            type="button"
            onClick={onOpenPdfModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white text-xs font-bold shadow-md flex items-center gap-2 border border-slate-700 active:scale-95 transition-all"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 PREDICTIVE FORECAST KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Net Financial Value */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span>Projected {selectedHorizonMonths}-Mo Net ROI</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            ${summaryData.projected12MoNetValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>After deducting all LLM compute & API costs</span>
          </div>
        </div>

        {/* Metric 2: FTE Capacity Equivalent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200 dark:border-blue-800/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-xs font-bold">
            <span>Capacity Liberated</span>
            <Users2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
            +{summaryData.projectedFteLiberated.toFixed(1)} FTEs
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Equivalent to {summaryData.projected12MoHours.toLocaleString()} manual engineering hours
          </div>
        </div>

        {/* Metric 3: Task Turnaround & Velocity */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200 dark:border-purple-800/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 text-xs font-bold">
            <span>Autonomous Throughput</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
            {summaryData.projected12MoTasks.toLocaleString()} runs
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Across {fleetExpansionCount} projected autonomous agents
          </div>
        </div>

        {/* Metric 4: Cost-to-Value Multiplier */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold">
            <span>Infrastructure ROI Multiple</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {(
              summaryData.projected12MoGrossSavings /
              Math.max(1, summaryData.projected12MoGrossSavings - summaryData.projected12MoNetValue)
            ).toFixed(1)}x Return
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            &lt; 5 days payback breakeven velocity
          </div>
        </div>
      </div>

      {/* INTERACTIVE FORECAST TUNER & GROWTH SCENARIO PRESETS */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Interactive Forecast Parameters & Growth Assumptions
            </h3>
          </div>

          {/* Scenario Selector Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setGrowthScenario("conservative")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                growthScenario === "conservative"
                  ? "bg-slate-800 text-white dark:bg-slate-700 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Conservative (8% MoM)
            </button>
            <button
              type="button"
              onClick={() => setGrowthScenario("expected")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                growthScenario === "expected"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Balanced (20% MoM)
            </button>
            <button
              type="button"
              onClick={() => setGrowthScenario("aggressive")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                growthScenario === "aggressive"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Hyper-Scale (38% MoM)
            </button>
          </div>
        </div>

        {/* Interactive Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          
          {/* Slider 1: Loaded Hourly Rate */}
          <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Loaded Employee Rate:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${loadedHourlyRate}/hr</span>
            </div>
            <input
              type="range"
              min="45"
              max="220"
              step="5"
              value={loadedHourlyRate}
              onChange={(e) => setLoadedHourlyRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$45 (Junior)</span>
              <span>$220 (Principal)</span>
            </div>
          </div>

          {/* Slider 2: Fleet Size Expansion */}
          <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Target Fleet Size:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{fleetExpansionCount} Agents</span>
            </div>
            <input
              type="range"
              min={activeAgentCount}
              max="35"
              step="1"
              value={fleetExpansionCount}
              onChange={(e) => setFleetExpansionCount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{activeAgentCount} Current</span>
              <span>35 Enterprise</span>
            </div>
          </div>

          {/* Slider 3: Efficiency & Complexity Multiplier */}
          <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Learning Curve Multiplier:</span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{efficiencyGainFactor.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={efficiencyGainFactor}
              onChange={(e) => setEfficiencyGainFactor(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1.0x Baseline</span>
              <span>2.5x Max Speed</span>
            </div>
          </div>

          {/* Slider 4: AI Compute & API Buffer */}
          <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">AI Compute Cost / Task:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${apiCostPerTask.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.12"
              step="0.005"
              value={apiCostPerTask}
              onChange={(e) => setApiCostPerTask(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>$0.01 (Fast LLM)</span>
              <span>$0.12 (Heavy Reasoning)</span>
            </div>
          </div>

        </div>
      </div>

      {/* RECHARTS VISUALIZATIONS SECTION */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Dynamic Visual Forecast Trajectory
            </h3>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto">
            <button
              onClick={() => setActiveChartTab("financial")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === "financial"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Financial ROI Curve ($)
            </button>
            <button
              onClick={() => setActiveChartTab("throughput_fte")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === "throughput_fte"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Throughput & FTE Capacity
            </button>
            <button
              onClick={() => setActiveChartTab("departments")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeChartTab === "departments"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Department Cumulative
            </button>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-80 pt-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === "financial" ? (
              <AreaChart data={forecastTimeline} margin={{ top: 10, right: 25, left: 10, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ForecastChartTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                <Area
                  type="monotone"
                  dataKey="cumulativeNet"
                  name="Cumulative Net Financial ROI"
                  stroke="#059669"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNetSavings)"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeGross"
                  name="Gross Labor Cost Liberated"
                  stroke="#2563eb"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorGrossSavings)"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeAiCost"
                  name="AI Compute / API Overhead"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </AreaChart>
            ) : activeChartTab === "throughput_fte" ? (
              <ComposedChart data={forecastTimeline} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  yAxisId="left" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#8b5cf6" 
                  fontSize={11} 
                  tickLine={false}
                  unit=" FTE"
                />
                <Tooltip content={<ForecastChartTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                <Bar 
                  yAxisId="left" 
                  dataKey="tasks" 
                  name="Monthly Tasks Executed" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="fteEquivalent" 
                  name="Full-Time Employee (FTE) Equivalent Liberated" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                />
              </ComposedChart>
            ) : (
              <AreaChart data={forecastTimeline} margin={{ top: 10, right: 25, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip content={<ForecastChartTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                <Area type="monotone" dataKey="deptSupport" stackId="1" name="Customer Support" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.8} />
                <Area type="monotone" dataKey="deptEngineering" stackId="1" name="Engineering" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                <Area type="monotone" dataKey="deptDevops" stackId="1" name="DevOps & SecOps" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.8} />
                <Area type="monotone" dataKey="deptSales" stackId="1" name="Sales & CRM" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
                <Area type="monotone" dataKey="deptOps" stackId="1" name="Operations & HR" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* MILESTONE FINANCIAL MATRIX TABLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Quarterly & Annual Financial Trajectory Milestones</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Model: {growthScenario.toUpperCase()} @ ${loadedHourlyRate}/hr
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Timeline Milestone</th>
                <th className="p-3 text-right">Fleet Size</th>
                <th className="p-3 text-right">Monthly Tasks</th>
                <th className="p-3 text-right">Monthly Hours</th>
                <th className="p-3 text-right">FTE Equiv</th>
                <th className="p-3 text-right">Cumul. Gross Savings</th>
                <th className="p-3 text-right text-emerald-600 dark:text-emerald-400">Cumul. Net Enterprise ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {milestoneIndices.map((item, idx) => {
                const point = forecastTimeline[item.idx];
                if (!point) return null;
                return (
                  <tr 
                    key={item.label}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/40"
                    }`}
                  >
                    <td className="p-3 font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{item.label}</span>
                    </td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                      {point.effectiveFleetSize} agents
                    </td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                      {point.tasks.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                      {point.hours.toLocaleString()} hrs
                    </td>
                    <td className="p-3 text-right text-purple-600 dark:text-purple-400 font-bold">
                      +{point.fteEquivalent.toFixed(1)} FTE
                    </td>
                    <td className="p-3 text-right text-slate-800 dark:text-slate-200">
                      ${point.cumulativeGross.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      ${point.cumulativeNet.toLocaleString()}
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
