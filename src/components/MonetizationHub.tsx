import React, { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  HardDrive, 
  Cpu, 
  Layers, 
  Zap, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Sliders, 
  Calculator, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet, 
  Lock, 
  Unlock, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  FileText,
  PieChart,
  Percent,
  Coins,
  Bot
} from "lucide-react";
import { 
  DeveloperCompanyProfile, 
  RateCardConfig, 
  TenantBillingRecord, 
  FinancialMetricSnapshot,
  TenantProfile,
  Agent,
  ClientStripeConnectProfile,
  ClientAgentTransaction,
  ClientPayoutRecord
} from "../types";
import { ProjectedRevenueDashboard } from "./ProjectedRevenueDashboard";
import { StripeFinancialsHub } from "./StripeFinancialsHub";
import { WebAppDeploymentModal } from "./WebAppDeploymentModal";
import { ClientAgentMonetizationHub } from "./ClientAgentMonetizationHub";

interface MonetizationHubProps {
  developerProfile: DeveloperCompanyProfile;
  rateCard: RateCardConfig;
  tenantsBilling: TenantBillingRecord[];
  financialHistory: FinancialMetricSnapshot[];
  onUpdateDeveloperProfile: (profile: DeveloperCompanyProfile) => void;
  onUpdateRateCard: (rateCard: RateCardConfig) => void;
  onUpdateTenantsBilling: (tenants: TenantBillingRecord[]) => void;
  tenants: TenantProfile[];
  agents?: Agent[];
  clientStripeProfiles?: ClientStripeConnectProfile[];
  clientTransactions?: ClientAgentTransaction[];
  clientPayouts?: ClientPayoutRecord[];
  onUpdateAgent?: (updatedAgent: Agent) => void;
  onAddTransaction?: (transaction: ClientAgentTransaction) => void;
  onAddPayout?: (payout: ClientPayoutRecord) => void;
  onUpdateClientProfile?: (profile: ClientStripeConnectProfile) => void;
}

export const MonetizationHub: React.FC<MonetizationHubProps> = ({
  developerProfile,
  rateCard,
  tenantsBilling,
  financialHistory,
  onUpdateDeveloperProfile,
  onUpdateRateCard,
  onUpdateTenantsBilling,
  tenants,
  agents = [],
  clientStripeProfiles = [],
  clientTransactions = [],
  clientPayouts = [],
  onUpdateAgent = () => {},
  onAddTransaction = () => {},
  onAddPayout = () => {},
  onUpdateClientProfile = () => {},
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "client_agents" | "stripe_financials" | "projections" | "ratecard" | "tenants" | "simulator" | "developer_shield">("overview");
  const [isWebAppModalOpen, setIsWebAppModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [selectedTenantInvoice, setSelectedTenantInvoice] = useState<TenantBillingRecord | null>(null);

  // Live Simulator state
  const [simClientCount, setSimClientCount] = useState<number>(15);
  const [simAvgStorageGb, setSimAvgStorageGb] = useState<number>(180);
  const [simAvgTokensMillion, setSimAvgTokensMillion] = useState<number>(25);
  const [simAvgImages, setSimAvgImages] = useState<number>(450);
  const [simPlanDistribution, setSimPlanDistribution] = useState<"mixed" | "growth" | "enterprise">("mixed");

  // Live Execution Test Sandbox
  const [execPromptTokens, setExecPromptTokens] = useState<number>(35000);
  const [execCompletionTokens, setExecCompletionTokens] = useState<number>(12500);
  const [execImagesCount, setExecImagesCount] = useState<number>(2);
  const [execStorageGbIncrement, setExecStorageGbIncrement] = useState<number>(0.25);

  // Totals calculations across all external paying tenants (excluding internal developer free pass)
  const payingTenants = tenantsBilling.filter((t) => !t.isInternalDeveloper);
  const internalDevTenant = tenantsBilling.find((t) => t.isInternalDeveloper);

  const totalGrossRevenue = payingTenants.reduce((acc, t) => acc + t.totalBilledRevenue, 0);
  const totalRawInfraCost = payingTenants.reduce((acc, t) => acc + t.totalRawInfraCost, 0) + (internalDevTenant?.totalRawInfraCost || 0);
  const totalNetProfit = totalGrossRevenue - totalRawInfraCost;
  const blendedProfitMargin = totalGrossRevenue > 0 ? ((totalNetProfit / totalGrossRevenue) * 100) : 0;
  
  const mrr = totalGrossRevenue;
  const arr = mrr * 12;

  // Rate card billable calculations
  const billableStoragePerGb = rateCard.storageBaseCostPerGbMonth * rateCard.storageMarkupMultiplier;
  const billablePromptPerMillion = rateCard.aiTokenCostPerMillionIn * rateCard.aiTokenMarkupMultiplier;
  const billableCompletionPerMillion = rateCard.aiTokenCostPerMillionOut * rateCard.aiTokenMarkupMultiplier;
  const billableImageGen = rateCard.imageGenCostPerUnit * rateCard.imageGenMarkupMultiplier;

  // Sandbox single execution cost vs billable
  const execRawPromptCost = (execPromptTokens / 1_000_000) * rateCard.aiTokenCostPerMillionIn;
  const execRawCompletionCost = (execCompletionTokens / 1_000_000) * rateCard.aiTokenCostPerMillionOut;
  const execRawImageCost = execImagesCount * rateCard.imageGenCostPerUnit;
  const execRawStorageCost = (execStorageGbIncrement / 30) * rateCard.storageBaseCostPerGbMonth;
  const totalExecRawCost = execRawPromptCost + execRawCompletionCost + execRawImageCost + execRawStorageCost;

  const execBilledPrompt = (execPromptTokens / 1_000_000) * billablePromptPerMillion;
  const execBilledCompletion = (execCompletionTokens / 1_000_000) * billableCompletionPerMillion;
  const execBilledImage = execImagesCount * billableImageGen;
  const execBilledStorage = (execStorageGbIncrement / 30) * billableStoragePerGb;
  const totalExecBilled = execBilledPrompt + execBilledCompletion + execBilledImage + execBilledStorage;
  const execNetProfit = totalExecBilled - totalExecRawCost;
  const execProfitMargin = totalExecBilled > 0 ? (execNetProfit / totalExecBilled) * 100 : 0;

  // Simulator projection calculation
  const getSimMonthlyBreakdown = () => {
    let avgBaseFee = 499;
    if (simPlanDistribution === "growth") avgBaseFee = rateCard.growthTierMonthlyFee;
    else if (simPlanDistribution === "enterprise") avgBaseFee = rateCard.enterpriseTierMonthlyFee;
    else avgBaseFee = (rateCard.starterTierMonthlyFee * 0.3) + (rateCard.growthTierMonthlyFee * 0.5) + (rateCard.enterpriseTierMonthlyFee * 0.2);

    const monthlyBaseRev = simClientCount * avgBaseFee;
    
    // Storage
    const clientStorageBilled = simClientCount * (simAvgStorageGb * billableStoragePerGb);
    const clientStorageRaw = simClientCount * (simAvgStorageGb * rateCard.storageBaseCostPerGbMonth);

    // AI Tokens
    const promptShare = simAvgTokensMillion * 0.65;
    const completionShare = simAvgTokensMillion * 0.35;
    const clientAiBilled = simClientCount * (
      (promptShare * billablePromptPerMillion) + 
      (completionShare * billableCompletionPerMillion) + 
      (simAvgImages * billableImageGen)
    );
    const clientAiRaw = simClientCount * (
      (promptShare * rateCard.aiTokenCostPerMillionIn) + 
      (completionShare * rateCard.aiTokenCostPerMillionOut) + 
      (simAvgImages * rateCard.imageGenCostPerUnit)
    );

    const projectedMonthlyGross = monthlyBaseRev + clientStorageBilled + clientAiBilled;
    const projectedMonthlyRaw = clientStorageRaw + clientAiRaw;
    const projectedMonthlyProfit = projectedMonthlyGross - projectedMonthlyRaw;
    const projectedMargin = (projectedMonthlyProfit / projectedMonthlyGross) * 100;

    return {
      monthlyBaseRev,
      clientStorageBilled,
      clientAiBilled,
      projectedMonthlyGross,
      projectedMonthlyRaw,
      projectedMonthlyProfit,
      projectedMargin,
      projectedAnnualProfit: projectedMonthlyProfit * 12,
    };
  };

  const simResults = getSimMonthlyBreakdown();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  const handleTopUpTenantWallet = (tenantId: string, amount: number) => {
    const updated = tenantsBilling.map((t) => {
      if (t.tenantId === tenantId) {
        return {
          ...t,
          walletCreditBalance: t.walletCreditBalance + amount,
          billingStatus: "paid" as const,
        };
      }
      return t;
    });
    onUpdateTenantsBilling(updated);
  };

  const handleToggleDeveloperFreePass = (tenantId: string) => {
    const updated = tenantsBilling.map((t) => {
      if (t.tenantId === tenantId) {
        const willBeInternal = !t.isInternalDeveloper;
        return {
          ...t,
          isInternalDeveloper: willBeInternal,
          billingStatus: willBeInternal ? ("free_developer_pass" as const) : ("paid" as const),
          basePlanFee: willBeInternal ? 0 : rateCard.growthTierMonthlyFee,
          billedStorageFee: willBeInternal ? 0 : t.rawStorageCost * rateCard.storageMarkupMultiplier,
          billedAiUsageFee: willBeInternal ? 0 : t.rawAiInfraCost * rateCard.aiTokenMarkupMultiplier,
          totalBilledRevenue: willBeInternal ? 0 : (rateCard.growthTierMonthlyFee + (t.rawStorageCost * rateCard.storageMarkupMultiplier) + (t.rawAiInfraCost * rateCard.aiTokenMarkupMultiplier)),
        };
      }
      return t;
    });
    onUpdateTenantsBilling(updated);
  };

  const filteredTenants = tenantsBilling.filter((t) => {
    const matchesSearch = t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === "all" || t.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Developer Monetization & Profit Engine
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{blendedProfitMargin.toFixed(1)}% Profit Margin</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Metered infrastructure billing, dynamic gross margin markups, automated customer invoicing, and 100% free lifetime access for your company.
              </p>
            </div>
          </div>
        </div>

        {/* Founder Developer Free Shield Quick Badge & Web App Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWebAppModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-purple-500/20 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>How to Make into Web App?</span>
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                <span>Founder VIP Shield Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300 truncate max-w-[200px]">
                {developerProfile.developerEmail} (Free Lifetime)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "overview"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Financial Overview & KPIs</span>
        </button>

        <button
          onClick={() => setActiveSubTab("client_agents")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "client_agents"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="flex items-center gap-1.5">
            <span>Client Agent Sales & Stripe</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">90% PAYOUT</span>
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("stripe_financials")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "stripe_financials"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span className="flex items-center gap-1.5">
            <span>Stripe Payables & Receivables</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold">STRIPE</span>
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("projections")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "projections"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="flex items-center gap-1.5">
            <span>Projected Revenue (Recharts)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">NEW</span>
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("ratecard")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "ratecard"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Rate Card & Profit Markups</span>
        </button>

        <button
          onClick={() => setActiveSubTab("tenants")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "tenants"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Tenant Metered Billing ({tenantsBilling.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("simulator")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "simulator"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Scale & Profit Forecaster</span>
        </button>

        <button
          onClick={() => setActiveSubTab("developer_shield")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "developer_shield"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Founder Free Access Policy</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FINANCIAL OVERVIEW & UNIT ECONOMICS */}
      {/* ========================================================================= */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Revenue */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Gross Monthly Revenue</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ${totalGrossRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">ARR: ${(arr).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +14.2% MoM
                </span>
              </div>
            </div>

            {/* Raw Infra Cost */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Raw Infrastructure Cost</span>
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ${totalRawInfraCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Gemini API + Cloud Storage</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {((totalRawInfraCost / (totalGrossRevenue || 1)) * 100).toFixed(1)}% of Rev
                </span>
              </div>
            </div>

            {/* Net Developer Profit */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <div className="flex items-center justify-between text-emerald-100 text-xs font-medium">
                <span>Net Developer Cash Profit</span>
                <div className="p-1.5 rounded-lg bg-white/20 text-white">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-white tracking-tight">
                ${totalNetProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-100">
                <span>Direct Profit in Pocket</span>
                <span className="bg-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                  {blendedProfitMargin.toFixed(1)}% Margin
                </span>
              </div>
            </div>

            {/* Paying Tenants & Stripe Payout */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Active Commercial Clients</span>
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {payingTenants.length} <span className="text-xs font-normal text-slate-500">Paid Tenants</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Stripe Payouts:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> {developerProfile.payoutAccount.payoutCadence} Auto
                </span>
              </div>
            </div>
          </div>

          {/* Client Agent Monetization Stripe Spotlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    Client Agent Monetization & Stripe Connect
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    90% Direct Payout
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Clients can monetize agents via monthly subscriptions or pay-per-query Stripe paywalls with automated daily bank payouts.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab("client_agents")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all shrink-0 self-start md:self-auto"
            >
              <span>Open Client Agent Sales Hub</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Projected Revenue Recharts Teaser Callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    12-Month Projected Revenue & Growth Models
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    Active Rate Card Synced
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Explore multi-scenario Recharts growth curves, tenant usage expansion curves, and ARR forecasts for {developerProfile.companyName}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab("projections")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all shrink-0 self-start md:self-auto"
            >
              <span>Open Recharts Forecast Dashboard</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Revenue vs Cost Historical Telemetry Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Gross Revenue vs Infrastructure Costs vs Net Profit (2026)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    8 Months P&L
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tracking scaling unit economics as client workloads and multi-agent workflows expand.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Gross Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Raw Cloud Cost</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-600" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Net Profit</span>
                </div>
              </div>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="h-56 w-full pt-4">
              <div className="h-full flex items-end gap-3 sm:gap-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                {financialHistory.map((item, idx) => {
                  const maxVal = 11000;
                  const revHeight = (item.grossRevenue / maxVal) * 100;
                  const costHeight = (item.rawInfraCost / maxVal) * 100;
                  const profitHeight = (item.netProfit / maxVal) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-14 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                        <div className="font-bold text-emerald-400">{item.period}</div>
                        <div>Revenue: ${item.grossRevenue}</div>
                        <div>Cost: ${item.rawInfraCost}</div>
                        <div className="text-teal-300 font-semibold">Net Profit: ${item.netProfit} ({item.marginPercent}%)</div>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeight}%` }}
                          className="w-1/3 bg-emerald-500 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-400"
                        />
                        {/* Cost Bar */}
                        <div
                          style={{ height: `${Math.max(4, costHeight)}%` }}
                          className="w-1/3 bg-rose-500/80 rounded-t-sm transition-all duration-500 group-hover:bg-rose-400"
                        />
                        {/* Net Profit Bar */}
                        <div
                          style={{ height: `${profitHeight}%` }}
                          className="w-1/3 bg-teal-600 rounded-t-sm transition-all duration-500 group-hover:bg-teal-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {item.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Highlights & Payout summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500">Cost Coverage Factor:</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {(totalGrossRevenue / (totalRawInfraCost || 1)).toFixed(1)}x Revenue Multiplier
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Every $1 spent on Gemini/Storage yields ${(totalGrossRevenue / (totalRawInfraCost || 1)).toFixed(2)}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500">Stripe Auto-Payout Account:</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{developerProfile.payoutAccount.accountHolder}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Last payout: ${developerProfile.payoutAccount.lastPayoutAmount.toLocaleString()} on {developerProfile.payoutAccount.lastPayoutDate}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500">Developer Company Status:</span>
                <div className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Free Lifetime VIP</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Zero fees assessed on {developerProfile.companyName}</p>
              </div>
            </div>
          </div>

          {/* Real-Time Live Execution Cost vs Profit Simulator Sandbox */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live Multi-Agent Task Profit Telemetry (Single Run)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    See exactly how much a single autonomous workflow run costs your infrastructure vs how much you bill the client.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                +{execProfitMargin.toFixed(1)}% Profit on Task
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Prompt Tokens: {execPromptTokens.toLocaleString()}
                </label>
                <input
                  type="range"
                  min={1000}
                  max={200000}
                  step={1000}
                  value={execPromptTokens}
                  onChange={(e) => setExecPromptTokens(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Completion Tokens: {execCompletionTokens.toLocaleString()}
                </label>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={execCompletionTokens}
                  onChange={(e) => setExecCompletionTokens(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Image Generations: {execImagesCount} images
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={execImagesCount}
                  onChange={(e) => setExecImagesCount(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Asset Cache Size: {execStorageGbIncrement} GB
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={5}
                  step={0.05}
                  value={execStorageGbIncrement}
                  onChange={(e) => setExecStorageGbIncrement(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            {/* Execution Comparison Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Raw Google Infra Cost</span>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  ${totalExecRawCost.toFixed(4)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  AI: ${(execRawPromptCost + execRawCompletionCost + execRawImageCost).toFixed(4)} | Disk: ${execRawStorageCost.toFixed(4)}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Billed To Client</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ${totalExecBilled.toFixed(4)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Metered deduction from client credit wallet
                </div>
              </div>

              <div className="bg-emerald-100/70 dark:bg-emerald-950/80 p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 flex flex-col justify-center">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">Your Net Profit on Run</span>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                  +${execNetProfit.toFixed(4)} ({execProfitMargin.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1.1: CLIENT AGENT MONETIZATION & STRIPE CONNECT HUB */}
      {/* ========================================================================= */}
      {activeSubTab === "client_agents" && (
        <ClientAgentMonetizationHub
          agents={agents}
          tenants={tenants}
          clientStripeProfiles={clientStripeProfiles}
          clientTransactions={clientTransactions}
          clientPayouts={clientPayouts}
          onUpdateAgent={onUpdateAgent}
          onAddTransaction={onAddTransaction}
          onAddPayout={onAddPayout}
          onUpdateClientProfile={onUpdateClientProfile}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1.2: STRIPE PAYABLES & RECEIVABLES FINANCIALS HUB */}
      {/* ========================================================================= */}
      {activeSubTab === "stripe_financials" && (
        <StripeFinancialsHub
          tenantsBilling={tenantsBilling}
          developerProfile={developerProfile}
          rateCard={rateCard}
          onOpenWebAppGuide={() => setIsWebAppModalOpen(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1.5: PROJECTED REVENUE DASHBOARD (RECHARTS) */}
      {/* ========================================================================= */}
      {activeSubTab === "projections" && (
        <ProjectedRevenueDashboard
          rateCard={rateCard}
          tenantsBilling={tenantsBilling}
          developerProfile={developerProfile}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RATE CARD & PROFIT MARKUPS */}
      {/* ========================================================================= */}
      {activeSubTab === "ratecard" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Unit Economics & Markup Multiplier Rate Card</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize your profit margins. We automatically apply these markups to raw Google Cloud Storage and Gemini AI token rates to ensure your company generates handsome profits on every byte and token.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Storage Rate Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Cloud Storage Metering</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    +{((rateCard.storageMarkupMultiplier - 1) * 100).toFixed(0)}% Margin
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Raw Google Cloud Storage Cost:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ${rateCard.storageBaseCostPerGbMonth.toFixed(3)} / GB / month
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Client Billable Price:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ${billableStoragePerGb.toFixed(3)} / GB / month
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    <span>Markup Multiplier:</span>
                    <span className="font-bold">{rateCard.storageMarkupMultiplier.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.5}
                    max={10.0}
                    step={0.5}
                    value={rateCard.storageMarkupMultiplier}
                    onChange={(e) =>
                      onUpdateRateCard({
                        ...rateCard,
                        storageMarkupMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1.5x (50% profit)</span>
                    <span>5.0x (400% profit)</span>
                    <span>10.0x (900% profit)</span>
                  </div>
                </div>
              </div>

              {/* Gemini AI Tokens Rate Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-600">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Gemini AI Token Metering</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    +{((rateCard.aiTokenMarkupMultiplier - 1) * 100).toFixed(0)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Raw Input / Output Cost:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ${rateCard.aiTokenCostPerMillionIn.toFixed(3)} / ${rateCard.aiTokenCostPerMillionOut.toFixed(3)} per 1M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Client Billable Input / Output:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${billablePromptPerMillion.toFixed(3)} / ${billableCompletionPerMillion.toFixed(3)} per 1M
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    <span>AI Markup Multiplier:</span>
                    <span className="font-bold">{rateCard.aiTokenMarkupMultiplier.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={10.0}
                    step={0.5}
                    value={rateCard.aiTokenMarkupMultiplier}
                    onChange={(e) =>
                      onUpdateRateCard({
                        ...rateCard,
                        aiTokenMarkupMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>2.0x (100% profit)</span>
                    <span>4.5x (350% profit)</span>
                    <span>10.0x (900% profit)</span>
                  </div>
                </div>
              </div>

              {/* AI Image Generation Rate Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">AI Image Generation (Imagen 3)</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    +{((rateCard.imageGenMarkupMultiplier - 1) * 100).toFixed(0)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Raw Image Gen Cost:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ${rateCard.imageGenCostPerUnit.toFixed(3)} / image
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Client Billable Price:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${billableImageGen.toFixed(3)} / image
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    <span>Image Markup Multiplier:</span>
                    <span className="font-bold">{rateCard.imageGenMarkupMultiplier.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={10.0}
                    step={0.5}
                    value={rateCard.imageGenMarkupMultiplier}
                    onChange={(e) =>
                      onUpdateRateCard({
                        ...rateCard,
                        imageGenMarkupMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>2.0x (100% profit)</span>
                    <span>5.0x (400% profit)</span>
                    <span>10.0x (900% profit)</span>
                  </div>
                </div>
              </div>

              {/* Base Platform Subscription Tiers */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Base Subscription Seat Fees</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    Pure Margin
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Starter Agency</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        value={rateCard.starterTierMonthlyFee}
                        onChange={(e) =>
                          onUpdateRateCard({
                            ...rateCard,
                            starterTierMonthlyFee: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Growth SaaS</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        value={rateCard.growthTierMonthlyFee}
                        onChange={(e) =>
                          onUpdateRateCard({
                            ...rateCard,
                            growthTierMonthlyFee: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Enterprise</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        value={rateCard.enterpriseTierMonthlyFee}
                        onChange={(e) =>
                          onUpdateRateCard({
                            ...rateCard,
                            enterpriseTierMonthlyFee: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Clients pay this fixed monthly fee for workspace hosting and white-label branding, plus usage-based overages.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TENANT METERED BILLING & INVOICING */}
      {/* ========================================================================= */}
      {activeSubTab === "tenants" && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tenant by company or billing email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="all">All Plans</option>
                <option value="Enterprise White-Label">Enterprise White-Label</option>
                <option value="Growth SaaS">Growth SaaS</option>
                <option value="Starter Agency">Starter Agency</option>
                <option value="Developer Free Tier">Developer Free Tier</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tenant Billing Ledger & P&L Statement
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized usage breakdown, gross margin contribution, and credit wallet balances.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {filteredTenants.length} Organizations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Organization & Plan</th>
                    <th className="py-3 px-3">Storage (GB)</th>
                    <th className="py-3 px-3">AI Tokens & Images</th>
                    <th className="py-3 px-3">Raw Infra Cost</th>
                    <th className="py-3 px-3">Billed Client Revenue</th>
                    <th className="py-3 px-3">Net Profit & Margin</th>
                    <th className="py-3 px-3">Wallet Balance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredTenants.map((tenant) => {
                    const isInternal = tenant.isInternalDeveloper;
                    return (
                      <tr 
                        key={tenant.tenantId} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isInternal ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        {/* Org & Plan */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{tenant.tenantName}</span>
                            {isInternal && (
                              <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded uppercase tracking-wider">
                                Founder Pass
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{tenant.contactEmail}</span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{tenant.plan}</span>
                          </div>
                        </td>

                        {/* Storage */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {tenant.storageUsedGb.toFixed(1)} GB
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Quota: {isInternal ? "Unlimited" : `${tenant.storageQuotaGb} GB`}
                          </div>
                        </td>

                        {/* AI Tokens */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {((tenant.promptTokensUsed + tenant.completionTokensUsed) / 1_000_000).toFixed(1)}M Tokens
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {tenant.imagesGeneratedCount} Gen Images
                          </div>
                        </td>

                        {/* Raw Infra Cost */}
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            ${tenant.totalRawInfraCost.toFixed(2)}
                          </span>
                        </td>

                        {/* Billed Revenue */}
                        <td className="py-3.5 px-3">
                          {isInternal ? (
                            <span className="font-bold text-blue-600 dark:text-blue-400">$0.00 (VIP Free)</span>
                          ) : (
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              ${tenant.totalBilledRevenue.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* Net Profit & Margin */}
                        <td className="py-3.5 px-3">
                          {isInternal ? (
                            <span className="text-[11px] text-slate-400">Developer Internal</span>
                          ) : (
                            <div>
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                +${tenant.netProfit.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                                {tenant.profitMarginPercent.toFixed(1)}% margin
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Wallet Balance */}
                        <td className="py-3.5 px-3">
                          {isInternal ? (
                            <span className="text-[11px] text-slate-400">N/A</span>
                          ) : (
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <Wallet className="w-3 h-3 text-emerald-500" />
                                <span>${tenant.walletCreditBalance.toFixed(2)}</span>
                              </div>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                                Auto-Recharge: ON
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isInternal && (
                              <button
                                onClick={() => handleTopUpTenantWallet(tenant.tenantId, 250)}
                                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                                title="Top-up client wallet with +$250"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+$250</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedTenantInvoice(tenant)}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                              title="View & Download Itemized Invoice Statement"
                            >
                              <FileText className="w-3 h-3 text-indigo-500" />
                              <span>Invoice</span>
                            </button>

                            <button
                              onClick={() => handleToggleDeveloperFreePass(tenant.tenantId)}
                              className={`p-1.5 rounded transition-colors ${
                                isInternal 
                                  ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                              title={isInternal ? "Revoke Developer VIP Pass" : "Grant 100% Free Developer Pass"}
                            >
                              {isInternal ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SCALE & PROFIT FORECASTER */}
      {/* ========================================================================= */}
      {activeSubTab === "simulator" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>Interactive Growth & Profit Forecaster</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Calculate your company's projected monthly and annual net profits based on client acquisition targets and average tenant workloads.
              </p>
            </div>

            {/* Interactive Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Number of Clients:</span>
                  <span className="text-emerald-600 font-bold">{simClientCount} Clients</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={simClientCount}
                  onChange={(e) => setSimClientCount(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Avg Storage / Client:</span>
                  <span className="text-emerald-600 font-bold">{simAvgStorageGb} GB</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={1000}
                  step={20}
                  value={simAvgStorageGb}
                  onChange={(e) => setSimAvgStorageGb(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Avg Tokens / Client:</span>
                  <span className="text-emerald-600 font-bold">{simAvgTokensMillion}M Tokens/mo</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={simAvgTokensMillion}
                  onChange={(e) => setSimAvgTokensMillion(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Tier Distribution:</span>
                  <span className="capitalize text-indigo-600 font-bold">{simPlanDistribution}</span>
                </div>
                <select
                  value={simPlanDistribution}
                  onChange={(e) => setSimPlanDistribution(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="mixed">Mixed (Starter/Growth/Enterprise)</option>
                  <option value="growth">Growth SaaS Focused ($499/mo)</option>
                  <option value="enterprise">Enterprise Focused ($1,499/mo)</option>
                </select>
              </div>
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-medium">Projected Monthly Gross Revenue</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  ${simResults.projectedMonthlyGross.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Seats: ${simResults.monthlyBaseRev.toFixed(0)} | Metered AI & Disk: ${(simResults.clientStorageBilled + simResults.clientAiBilled).toFixed(0)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 font-medium">Projected Raw Infrastructure Bill</span>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  ${simResults.projectedMonthlyRaw.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Your actual cost to Google Cloud & Gemini
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20">
                <span className="text-xs text-emerald-100 font-medium">Projected Annual Net Cash Profit</span>
                <div className="text-2xl font-black text-white mt-1">
                  ${simResults.projectedAnnualProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-emerald-100 mt-1 flex items-center justify-between">
                  <span>${simResults.projectedMonthlyProfit.toFixed(0)} / month</span>
                  <span className="bg-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                    {simResults.projectedMargin.toFixed(1)}% Net Margin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DEVELOPER FREE ACCESS SHIELD & FOUNDER VIP POLICY */}
      {/* ========================================================================= */}
      {activeSubTab === "developer_shield" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Developer & Founder Company Free Access Policy
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Zero billing fees, bypassed storage quotas, and unlimited Gemini 2.0 AI token compute for your company forever.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900 dark:text-blue-200">
                  Founder Whitelist Configuration
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                  ACTIVE • UNLIMITED VIP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-medium block mb-1">
                    Developer Founder Email:
                  </label>
                  <input
                    type="email"
                    value={developerProfile.developerEmail}
                    onChange={(e) =>
                      onUpdateDeveloperProfile({
                        ...developerProfile,
                        developerEmail: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-medium block mb-1">
                    Developer Organization Name:
                  </label>
                  <input
                    type="text"
                    value={developerProfile.companyName}
                    onChange={(e) =>
                      onUpdateDeveloperProfile({
                        ...developerProfile,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200/80 dark:border-blue-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-blue-900 dark:text-blue-200 font-medium">Unlimited Gemini Inference</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-blue-900 dark:text-blue-200 font-medium">Uncapped Vector Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-blue-900 dark:text-blue-200 font-medium">$0.00 Lifetime Invoice Exemption</span>
                </div>
              </div>
            </div>

            {/* Payout Bank / Stripe Connect Information */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Stripe Connect Developer Payout Routing
                  </span>
                </div>
                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Stripe Account Connected</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Legal Entity:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {developerProfile.payoutAccount.accountHolder}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Payout Cadence:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {developerProfile.payoutAccount.payoutCadence} (Direct Deposit)
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Currency:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {developerProfile.payoutAccount.currency} ($ USD)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Invoice Modal */}
      {selectedTenantInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Statement of Account</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedTenantInvoice.tenantName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTenantInvoice(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Base Workspace Hosting Fee ({selectedTenantInvoice.plan}):</span>
                  <span className="font-bold">${selectedTenantInvoice.basePlanFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Metered Storage ({selectedTenantInvoice.storageUsedGb.toFixed(1)} GB @ ${billableStoragePerGb.toFixed(3)}/GB):</span>
                  <span className="font-bold">${selectedTenantInvoice.billedStorageFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Metered AI Inference (Prompt/Completion Tokens & Images):</span>
                  <span className="font-bold">${selectedTenantInvoice.billedAiUsageFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-800 pt-2">
                <span>Total Current Period Balance:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ${selectedTenantInvoice.totalBilledRevenue.toFixed(2)}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Gross Developer Margin on this client: <strong>+${selectedTenantInvoice.netProfit.toFixed(2)} ({selectedTenantInvoice.profitMarginPercent.toFixed(1)}%)</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const csv = `Item,Amount\nBase Fee,${selectedTenantInvoice.basePlanFee}\nStorage,${selectedTenantInvoice.billedStorageFee}\nAI Tokens,${selectedTenantInvoice.billedAiUsageFee}\nTotal,${selectedTenantInvoice.totalBilledRevenue}`;
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `invoice-${selectedTenantInvoice.tenantId}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web App Deployment Guide Modal */}
      <WebAppDeploymentModal
        isOpen={isWebAppModalOpen}
        onClose={() => setIsWebAppModalOpen(false)}
        appName={developerProfile.companyName || "AgentFlow Enterprise"}
      />

      {/* Copy notification toast */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs px-4 py-2 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{copiedNotification} copied to clipboard!</span>
        </div>
      )}
    </div>
  );
};
