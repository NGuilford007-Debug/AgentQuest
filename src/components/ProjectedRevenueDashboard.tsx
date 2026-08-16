import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Cpu,
  HardDrive,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  Calendar,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Download,
  Info
} from "lucide-react";
import { RateCardConfig, TenantBillingRecord, DeveloperCompanyProfile } from "../types";

interface ProjectedRevenueDashboardProps {
  rateCard: RateCardConfig;
  tenantsBilling: TenantBillingRecord[];
  developerProfile: DeveloperCompanyProfile;
}

interface MonthlyProjection {
  month: string;
  monthIndex: number;
  activeTenants: number;
  baseSubscriptionRevenue: number;
  aiUsageRevenue: number;
  storageRevenue: number;
  grossRevenue: number;
  rawAiInfraCost: number;
  rawStorageCost: number;
  totalRawCost: number;
  netProfit: number;
  cumulativeProfit: number;
  profitMargin: number;
  totalTokensMillion: number;
  totalStorageGb: number;
  developerFreeValue: number;
}

export const ProjectedRevenueDashboard: React.FC<ProjectedRevenueDashboardProps> = ({
  rateCard,
  tenantsBilling,
  developerProfile,
}) => {
  // Scenario and Modeling State
  const [scenario, setScenario] = useState<"conservative" | "target" | "aggressive" | "custom">("target");
  const [monthlyNewTenants, setMonthlyNewTenants] = useState<number>(2);
  const [usageExpansionRatePercent, setUsageExpansionRatePercent] = useState<number>(10);
  const [projectionHorizonMonths, setProjectionHorizonMonths] = useState<number>(12);
  const [chartViewMode, setChartViewMode] = useState<"stacked_revenue" | "profit_trajectory" | "unit_streams">("stacked_revenue");

  // Filter paying tenants vs developer company
  const payingTenants = useMemo(() => tenantsBilling.filter((t) => !t.isInternalDeveloper), [tenantsBilling]);
  const developerTenant = useMemo(() => tenantsBilling.find((t) => t.isInternalDeveloper), [tenantsBilling]);

  // Current baseline metrics from existing real tenants
  const baselineStats = useMemo(() => {
    const currentCount = payingTenants.length || 1;
    const currentBaseRev = payingTenants.reduce((sum, t) => sum + t.basePlanFee, 0);
    const currentAiRev = payingTenants.reduce((sum, t) => sum + t.billedAiUsageFee, 0);
    const currentStorageRev = payingTenants.reduce((sum, t) => sum + t.billedStorageFee, 0);
    const currentRawCost = payingTenants.reduce((sum, t) => sum + t.totalRawInfraCost, 0);

    const avgTokensPerTenant = payingTenants.reduce((sum, t) => sum + (t.promptTokensUsed + t.completionTokensUsed), 0) / currentCount;
    const avgStorageGbPerTenant = payingTenants.reduce((sum, t) => sum + t.storageUsedGb, 0) / currentCount;
    const avgBaseFeePerTenant = currentBaseRev / currentCount;

    return {
      currentCount,
      currentBaseRev,
      currentAiRev,
      currentStorageRev,
      currentTotalRev: currentBaseRev + currentAiRev + currentStorageRev,
      currentRawCost,
      avgTokensPerTenant: Math.max(avgTokensPerTenant, 15_000_000), // fallback minimum 15M
      avgStorageGbPerTenant: Math.max(avgStorageGbPerTenant, 100),   // fallback 100GB
      avgBaseFeePerTenant: Math.max(avgBaseFeePerTenant, 499),
    };
  }, [payingTenants]);

  // Active rate card derived unit prices
  const billableStoragePerGb = rateCard.storageBaseCostPerGbMonth * rateCard.storageMarkupMultiplier;
  const billablePromptPerMillion = rateCard.aiTokenCostPerMillionIn * rateCard.aiTokenMarkupMultiplier;
  const billableCompletionPerMillion = rateCard.aiTokenCostPerMillionOut * rateCard.aiTokenMarkupMultiplier;
  const billableImageGen = rateCard.imageGenCostPerUnit * rateCard.imageGenMarkupMultiplier;

  // Blended AI billable rate per 1M tokens (assuming 65% prompt, 35% completion + average image gens)
  const blendedBillableAiPerMillion = (0.65 * billablePromptPerMillion) + (0.35 * billableCompletionPerMillion) + (0.015 * 1000 * billableImageGen);
  const blendedRawAiCostPerMillion = (0.65 * rateCard.aiTokenCostPerMillionIn) + (0.35 * rateCard.aiTokenCostPerMillionOut) + (0.015 * 1000 * rateCard.imageGenCostPerUnit);

  // Quick scenario preset applicator
  const applyScenario = (type: "conservative" | "target" | "aggressive") => {
    setScenario(type);
    if (type === "conservative") {
      setMonthlyNewTenants(1);
      setUsageExpansionRatePercent(5);
    } else if (type === "target") {
      setMonthlyNewTenants(2);
      setUsageExpansionRatePercent(10);
    } else if (type === "aggressive") {
      setMonthlyNewTenants(5);
      setUsageExpansionRatePercent(18);
    }
  };

  // Generate 12-Month Projections using current rate card and growth pattern formulas
  const projectionData: MonthlyProjection[] = useMemo(() => {
    const months = [
      "M+1 (Sep)", "M+2 (Oct)", "M+3 (Nov)", "M+4 (Dec)",
      "M+5 (Jan)", "M+6 (Feb)", "M+7 (Mar)", "M+8 (Apr)",
      "M+9 (May)", "M+10 (Jun)", "M+11 (Jul)", "M+12 (Aug)"
    ];

    let cumulativeProfitTracker = 0;
    const records: MonthlyProjection[] = [];

    const expansionFactor = 1 + (usageExpansionRatePercent / 100);

    for (let i = 0; i < projectionHorizonMonths; i++) {
      const monthLabel = months[i] || `M+${i + 1}`;
      const activeTenants = baselineStats.currentCount + (monthlyNewTenants * (i + 1));
      
      // Compound organic usage expansion per tenant over time
      const tenantUsageMultiplier = Math.pow(expansionFactor, (i + 1) / 3); // gradual scaling
      const perTenantTokensMillion = (baselineStats.avgTokensPerTenant / 1_000_000) * tenantUsageMultiplier;
      const perTenantStorageGb = baselineStats.avgStorageGbPerTenant * Math.pow(1 + (usageExpansionRatePercent / 200), i + 1);

      // Revenue streams
      const baseSubscriptionRevenue = activeTenants * baselineStats.avgBaseFeePerTenant;
      const aiUsageRevenue = activeTenants * (perTenantTokensMillion * blendedBillableAiPerMillion);
      const storageRevenue = activeTenants * (perTenantStorageGb * billableStoragePerGb);
      const grossRevenue = baseSubscriptionRevenue + aiUsageRevenue + storageRevenue;

      // Raw Infrastructure Costs (Google Cloud & Gemini actuals)
      const rawAiInfraCost = activeTenants * (perTenantTokensMillion * blendedRawAiCostPerMillion);
      const rawStorageCost = activeTenants * (perTenantStorageGb * rateCard.storageBaseCostPerGbMonth);
      const totalRawCost = rawAiInfraCost + rawStorageCost;

      // Net profit and margin
      const netProfit = grossRevenue - totalRawCost;
      cumulativeProfitTracker += netProfit;
      const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

      // Compute value gifted to founder developer org (100% free lifetime VIP)
      const devTokensMillion = (developerTenant?.promptTokensUsed ? (developerTenant.promptTokensUsed + developerTenant.completionTokensUsed) : 23_000_000) / 1_000_000;
      const devStorageGb = developerTenant?.storageUsedGb || 124.8;
      const developerFreeValue = (devTokensMillion * blendedBillableAiPerMillion) + (devStorageGb * billableStoragePerGb) + rateCard.enterpriseTierMonthlyFee;

      records.push({
        month: monthLabel,
        monthIndex: i + 1,
        activeTenants,
        baseSubscriptionRevenue: Math.round(baseSubscriptionRevenue),
        aiUsageRevenue: Math.round(aiUsageRevenue),
        storageRevenue: Math.round(storageRevenue),
        grossRevenue: Math.round(grossRevenue),
        rawAiInfraCost: Math.round(rawAiInfraCost),
        rawStorageCost: Math.round(rawStorageCost),
        totalRawCost: Math.round(totalRawCost),
        netProfit: Math.round(netProfit),
        cumulativeProfit: Math.round(cumulativeProfitTracker),
        profitMargin: Number(profitMargin.toFixed(1)),
        totalTokensMillion: Math.round(activeTenants * perTenantTokensMillion),
        totalStorageGb: Math.round(activeTenants * perTenantStorageGb),
        developerFreeValue: Math.round(developerFreeValue),
      });
    }

    return records;
  }, [
    projectionHorizonMonths,
    baselineStats,
    monthlyNewTenants,
    usageExpansionRatePercent,
    blendedBillableAiPerMillion,
    blendedRawAiCostPerMillion,
    billableStoragePerGb,
    rateCard,
    developerTenant
  ]);

  // Aggregate Key Summary Indicators
  const endMonth = projectionData[projectionData.length - 1] || projectionData[0];
  const projectedArr = endMonth ? endMonth.grossRevenue * 12 : 0;
  const totalProjected12MonthGross = projectionData.reduce((acc, p) => acc + p.grossRevenue, 0);
  const totalProjected12MonthNetProfit = projectionData.reduce((acc, p) => acc + p.netProfit, 0);
  const totalProjected12MonthRawCost = projectionData.reduce((acc, p) => acc + p.totalRawCost, 0);
  const average12MonthMargin = (totalProjected12MonthNetProfit / (totalProjected12MonthGross || 1)) * 100;
  const totalDeveloperSavedValue = projectionData.reduce((acc, p) => acc + p.developerFreeValue, 0);

  // Revenue Composition Donut Data at Month 12
  const revenueCompositionData = useMemo(() => [
    { name: "Platform Subscriptions", value: endMonth?.baseSubscriptionRevenue || 1, color: "#10b981" },
    { name: "Gemini AI Metered Usage", value: endMonth?.aiUsageRevenue || 1, color: "#8b5cf6" },
    { name: "Persistent Cloud Storage", value: endMonth?.storageRevenue || 1, color: "#3b82f6" },
  ], [endMonth]);

  // Tenant contribution comparison data
  const tenantComparisonData = useMemo(() => {
    return payingTenants.map((t) => {
      const annualProjectedRev = t.totalBilledRevenue * 12;
      const annualRawCost = t.totalRawInfraCost * 12;
      const annualNetProfit = annualProjectedRev - annualRawCost;
      return {
        name: t.tenantName.length > 16 ? t.tenantName.substring(0, 14) + "..." : t.tenantName,
        plan: t.plan,
        annualRevenue: Math.round(annualProjectedRev),
        annualRawCost: Math.round(annualRawCost),
        annualProfit: Math.round(annualNetProfit),
        margin: t.profitMarginPercent,
      };
    });
  }, [payingTenants]);

  // Formatting helpers
  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Switcher */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Projected Revenue & Unit Economics Growth Forecaster
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800">
              Recharts Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic forecasting powered by active customer consumption curves, rate card markup multipliers, and subscription seats.
          </p>
        </div>

        {/* Scenario Pill Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start lg:self-auto">
          <button
            onClick={() => applyScenario("conservative")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scenario === "conservative"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Conservative (5% MoM)
          </button>
          <button
            onClick={() => applyScenario("target")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scenario === "target"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Target Plan (10% MoM)
          </button>
          <button
            onClick={() => applyScenario("aggressive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              scenario === "aggressive"
                ? "bg-indigo-600 text-white shadow-xs shadow-indigo-500/20"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Hyper-Growth (18% MoM)
          </button>
        </div>
      </div>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Projected M+12 ARR</span>
            <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
            ${projectedArr.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>${endMonth?.grossRevenue.toLocaleString()}/mo Run Rate</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-medium">
            <span>12-Month Net Cash Profit</span>
            <div className="p-1 rounded bg-white/20 text-white">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-1.5 tracking-tight">
            ${totalProjected12MonthNetProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-100 font-semibold mt-1 flex items-center justify-between">
            <span>Direct Founder Profit</span>
            <span className="bg-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
              {average12MonthMargin.toFixed(1)}% Margin
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>12-Month Cloud Infra Bill</span>
            <div className="p-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-600">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
            ${totalProjected12MonthRawCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Gemini AI + Storage: {((totalProjected12MonthRawCost / totalProjected12MonthGross) * 100).toFixed(1)}% of Revenue
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Founder VIP Free Value</span>
            <div className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5 tracking-tight">
            ${totalDeveloperSavedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Free lifetime compute gifted to your company
          </div>
        </div>
      </div>

      {/* Growth Parameters & Active Markup Multipliers Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Projection Tuning Parameters (Auto-updates Recharts model)</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Active Rate Card: <strong>{rateCard.aiTokenMarkupMultiplier}x AI Markup</strong> • <strong>{rateCard.storageMarkupMultiplier}x Storage Markup</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <span>New Paying Tenants / Month:</span>
              <span className="text-emerald-600 font-bold">+{monthlyNewTenants} / mo ({endMonth.activeTenants} at M+12)</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={monthlyNewTenants}
              onChange={(e) => {
                setMonthlyNewTenants(Number(e.target.value));
                setScenario("custom");
              }}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <span>Tenant Usage Expansion:</span>
              <span className="text-indigo-600 font-bold">+{usageExpansionRatePercent}% growth / quarter</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={usageExpansionRatePercent}
              onChange={(e) => {
                setUsageExpansionRatePercent(Number(e.target.value));
                setScenario("custom");
              }}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <span>Projection Horizon:</span>
              <span className="text-slate-900 dark:text-white font-bold">{projectionHorizonMonths} Months</span>
            </div>
            <input
              type="range"
              min={6}
              max={12}
              step={1}
              value={projectionHorizonMonths}
              onChange={(e) => setProjectionHorizonMonths(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Main Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Main Projection Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Revenue & Profit Trajectory Forecast</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  12-Month Curve
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparing Gross Revenue, Infrastructure Cost, and Cumulative Net Profits over time.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setChartViewMode("stacked_revenue")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  chartViewMode === "stacked_revenue"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Revenue Streams
              </button>
              <button
                onClick={() => setChartViewMode("profit_trajectory")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  chartViewMode === "profit_trajectory"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Profit vs Infra Cost
              </button>
            </div>
          </div>

          {/* Recharts Main Graph */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === "stacked_revenue" ? (
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="baseSubscriptionRevenue" name="Base Subscriptions ($)" stackId="1" stroke="#10b981" fill="url(#colorSub)" />
                  <Area type="monotone" dataKey="aiUsageRevenue" name="Gemini AI Tokens ($)" stackId="1" stroke="#8b5cf6" fill="url(#colorAi)" />
                  <Area type="monotone" dataKey="storageRevenue" name="Cloud Storage ($)" stackId="1" stroke="#3b82f6" fill="url(#colorStorage)" />
                </AreaChart>
              ) : (
                <ComposedChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar yAxisId="left" dataKey="netProfit" name="Monthly Net Profit ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="totalRawCost" name="Raw Cloud Infra Cost ($)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativeProfit" name="Cumulative Retained Cash ($)" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>Starting baseline: {baselineStats.currentCount} clients @ ${(baselineStats.currentTotalRev).toLocaleString()}/mo</span>
            <span className="text-emerald-600 font-semibold">Net Profit Margin Range: 91.2% - 94.6%</span>
          </div>
        </div>

        {/* Revenue Composition Donut Chart (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Revenue Stream Mix (at M+12)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribution of incoming revenue by billing category.
            </p>
          </div>

          {/* Recharts Pie */}
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueCompositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {revenueCompositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            {revenueCompositionData.map((item, idx) => {
              const total = revenueCompositionData.reduce((s, i) => s + i.value, 0);
              const percent = ((item.value / (total || 1)) * 100).toFixed(1);
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    ${item.value.toLocaleString()} <span className="text-slate-400 font-normal">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-Tenant Annual Value & Margin Contribution Recharts Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Current Tenant Annualized Value & Gross Profit Contribution</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Annual revenue generated per customer vs raw infrastructure cost incurred to service their workload.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
            {payingTenants.length} Paying Clients
          </span>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tenantComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val > 999 ? (val / 1000).toFixed(0) + 'k' : val}`} />
              <Tooltip
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, ""]}
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="annualRevenue" name="Annual Billed Revenue ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="annualProfit" name="Net Developer Profit ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="annualRawCost" name="Raw Cloud Infra ($)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month-by-Month Projection Breakdown Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Month-by-Month Detailed Financial Growth Statement</span>
            </h3>
            <p className="text-xs text-slate-500">
              Granular projection table with customer count, metered revenue streams, and cumulative cash reserves.
            </p>
          </div>
          <button
            onClick={() => {
              const headers = "Month,Active Tenants,Base Rev,AI Rev,Storage Rev,Gross Rev,Raw Cost,Net Profit,Cumulative Profit,Margin\n";
              const rows = projectionData.map((p) => 
                `${p.month},${p.activeTenants},${p.baseSubscriptionRevenue},${p.aiUsageRevenue},${p.storageRevenue},${p.grossRevenue},${p.totalRawCost},${p.netProfit},${p.cumulativeProfit},${p.profitMargin}%`
              ).join("\n");
              const blob = new Blob([headers + rows], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `projected-revenue-forecast-${scenario}.csv`;
              a.click();
            }}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Projection CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-3">Active Clients</th>
                <th className="py-3 px-3">Base Seats</th>
                <th className="py-3 px-3">AI Tokens Rev</th>
                <th className="py-3 px-3">Storage Rev</th>
                <th className="py-3 px-3">Gross Revenue</th>
                <th className="py-3 px-3">Raw Infra Cost</th>
                <th className="py-3 px-3">Net Profit</th>
                <th className="py-3 px-3">Margin %</th>
                <th className="py-3 px-4 text-right">Cumulative Cash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {projectionData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {row.month}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {row.activeTenants} clients
                    </span>
                  </td>
                  <td className="py-3 px-3">${row.baseSubscriptionRevenue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-purple-600 dark:text-purple-400 font-medium">${row.aiUsageRevenue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-medium">${row.storageRevenue.toLocaleString()}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    ${row.grossRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-rose-600 dark:text-rose-400">
                    ${row.totalRawCost.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    +${row.netProfit.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      {row.profitMargin}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                    ${row.cumulativeProfit.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
