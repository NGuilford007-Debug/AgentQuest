import React, { useState, useMemo } from "react";
import {
  DollarSign,
  CreditCard,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Search,
  Filter,
  Plus,
  Sliders,
  Wallet,
  Receipt,
  Users,
  Code,
  Globe,
  Sparkles,
  AlertCircle,
  Download,
  Terminal,
  Lock,
  ChevronRight,
  Eye,
  Bot
} from "lucide-react";
import {
  Agent,
  ClientStripeConnectProfile,
  ClientAgentTransaction,
  ClientPayoutRecord,
  TenantProfile,
  AgentMonetizationConfig,
  Department
} from "../types";

interface ClientAgentMonetizationHubProps {
  agents: Agent[];
  tenants: TenantProfile[];
  clientStripeProfiles: ClientStripeConnectProfile[];
  clientTransactions: ClientAgentTransaction[];
  clientPayouts: ClientPayoutRecord[];
  onUpdateAgent: (updatedAgent: Agent) => void;
  onAddTransaction: (transaction: ClientAgentTransaction) => void;
  onAddPayout: (payout: ClientPayoutRecord) => void;
  onUpdateClientProfile: (profile: ClientStripeConnectProfile) => void;
}

export const ClientAgentMonetizationHub: React.FC<ClientAgentMonetizationHubProps> = ({
  agents,
  tenants,
  clientStripeProfiles,
  clientTransactions,
  clientPayouts,
  onUpdateAgent,
  onAddTransaction,
  onAddPayout,
  onUpdateClientProfile,
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    clientStripeProfiles[0]?.tenantId || "ten-2"
  );
  const [activeSubTab, setActiveSubTab] = useState<
    "fleet" | "terminal" | "payouts" | "transactions" | "storefront"
  >("fleet");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Edit / Monetize Agent Modal State
  const [editingAgentMonetization, setEditingAgentMonetization] = useState<Agent | null>(null);
  const [editIsMonetized, setEditIsMonetized] = useState(true);
  const [editPricingModel, setEditPricingModel] = useState<AgentMonetizationConfig["pricingModel"]>("subscription");
  const [editPriceAmount, setEditPriceAmount] = useState<number>(149);
  const [editBillingInterval, setEditBillingInterval] = useState<AgentMonetizationConfig["billingInterval"]>("monthly");
  const [editCurrency, setEditCurrency] = useState<AgentMonetizationConfig["currency"]>("USD");
  const [editTrialQueries, setEditTrialQueries] = useState<number>(5);
  const [editPublicTitle, setEditPublicTitle] = useState("");
  const [editPublicDesc, setEditPublicDesc] = useState("");
  const [editPaywallEnabled, setEditPaywallEnabled] = useState(true);

  // Live Stripe Checkout Terminal State
  const [termAgentId, setTermAgentId] = useState<string>(agents[0]?.id || "agent-1");
  const [termCustomerName, setTermCustomerName] = useState("Jonathan Vance");
  const [termCustomerEmail, setTermCustomerEmail] = useState("jonathan.vance@techcorp.io");
  const [termCustomerCompany, setTermCustomerCompany] = useState("TechCorp Enterprises");
  const [termCardNumber, setTermCardNumber] = useState("4242 •••• •••• 4242");
  const [termCardExpiry, setTermCardExpiry] = useState("12/28");
  const [termCardCvc, setTermCardCvc] = useState("888");
  const [termUnits, setTermUnits] = useState<number>(1);
  const [termQuerySnippet, setTermQuerySnippet] = useState("Review and triage our production incident logs from AWS ECS cluster.");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [terminalReceipt, setTerminalReceipt] = useState<ClientAgentTransaction | null>(null);

  // Instant Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmountInput, setPayoutAmountInput] = useState<number>(1500);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Filter Transactions State
  const [txSearchQuery, setTxSearchQuery] = useState("");
  const [txFilterAgent, setTxFilterAgent] = useState("all");
  const [txFilterPricing, setTxFilterPricing] = useState("all");

  // Active Client Profile
  const activeProfile = useMemo(() => {
    return (
      clientStripeProfiles.find((p) => p.tenantId === selectedTenantId) ||
      clientStripeProfiles[0] || {
        tenantId: "ten-2",
        tenantName: "Apex Enterprise Solutions",
        isStripeConnected: true,
        stripeAccountId: "acct_client_apex_01",
        stripeAccountEmail: "billing@apexsolutions.io",
        accountHolderName: "Apex Enterprise Holdings LLC",
        bankName: "Silicon Valley Bank (SVB)",
        bankAccountLast4: "8492",
        accountType: "express" as const,
        status: "verified" as const,
        availableStripeBalance: 3840.5,
        pendingStripeBalance: 985.0,
        totalAgentGrossRevenue: 12116.5,
        totalPlatformFeesPaid: 1211.65,
        totalClientNetEarnings: 10904.85,
        lifetimePayoutsTransferred: 7064.35,
        defaultPayoutCadence: "instant" as const,
        currency: "USD" as const,
        lastPayoutDate: "2026-08-18",
        lastPayoutAmount: 2450.0,
        customDomainPaywallUrl: "https://agents.apexenterprise.ai",
      }
    );
  }, [clientStripeProfiles, selectedTenantId]);

  // Aggregate Calculations for selected tenant or all
  const filteredTransactions = useMemo(() => {
    return clientTransactions.filter((tx) => {
      const matchTenant = selectedTenantId === "all" || tx.tenantId === selectedTenantId;
      const matchSearch =
        !txSearchQuery ||
        tx.customerName.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.customerEmail.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.agentName.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        tx.stripePaymentIntentId.toLowerCase().includes(txSearchQuery.toLowerCase());
      const matchAgent = txFilterAgent === "all" || tx.agentId === txFilterAgent;
      const matchPricing = txFilterPricing === "all" || tx.pricingModel === txFilterPricing;
      return matchTenant && matchSearch && matchAgent && matchPricing;
    });
  }, [clientTransactions, selectedTenantId, txSearchQuery, txFilterAgent, txFilterPricing]);

  const totalGrossRevenue = useMemo(() => {
    if (selectedTenantId === "all") {
      return clientTransactions.reduce((acc, tx) => acc + tx.grossAmount, 0);
    }
    return clientTransactions
      .filter((tx) => tx.tenantId === selectedTenantId)
      .reduce((acc, tx) => acc + tx.grossAmount, 0);
  }, [clientTransactions, selectedTenantId]);

  const totalClientNetRevenue = useMemo(() => {
    if (selectedTenantId === "all") {
      return clientTransactions.reduce((acc, tx) => acc + tx.clientNetAmount, 0);
    }
    return clientTransactions
      .filter((tx) => tx.tenantId === selectedTenantId)
      .reduce((acc, tx) => acc + tx.clientNetAmount, 0);
  }, [clientTransactions, selectedTenantId]);

  const totalPlatformFees = totalGrossRevenue - totalClientNetRevenue;

  const monetizedAgentsCount = useMemo(() => {
    return agents.filter((a) => a.monetization?.isMonetized).length;
  }, [agents]);

  const totalSubscribersCount = useMemo(() => {
    return agents.reduce((acc, a) => acc + (a.monetization?.activePayingSubscribersCount || 0), 0);
  }, [agents]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleOpenMonetizationModal = (agent: Agent) => {
    setEditingAgentMonetization(agent);
    if (agent.monetization) {
      setEditIsMonetized(agent.monetization.isMonetized);
      setEditPricingModel(agent.monetization.pricingModel);
      setEditPriceAmount(agent.monetization.priceAmount);
      setEditBillingInterval(agent.monetization.billingInterval);
      setEditCurrency(agent.monetization.currency);
      setEditTrialQueries(agent.monetization.trialQueriesCount);
      setEditPublicTitle(agent.monetization.publicCheckoutTitle || agent.name);
      setEditPublicDesc(agent.monetization.publicOfferingDescription || agent.description);
      setEditPaywallEnabled(agent.monetization.paywallEnabled);
    } else {
      setEditIsMonetized(true);
      setEditPricingModel("subscription");
      setEditPriceAmount(149);
      setEditBillingInterval("monthly");
      setEditCurrency("USD");
      setEditTrialQueries(5);
      setEditPublicTitle(agent.name);
      setEditPublicDesc(agent.description);
      setEditPaywallEnabled(true);
    }
  };

  const handleSaveMonetization = () => {
    if (!editingAgentMonetization) return;

    const existingMon = editingAgentMonetization.monetization;
    const stripeProdId = existingMon?.stripeProductId || `prod_agent_${editingAgentMonetization.id.replace(/-/g, "_")}`;
    const stripePriceId = existingMon?.stripePriceId || `price_1Nxy_${Date.now()}`;
    const stripeLink =
      existingMon?.stripePaymentLink ||
      `https://buy.stripe.com/test_${editingAgentMonetization.id}_${editPriceAmount}`;

    const updatedConfig: AgentMonetizationConfig = {
      isMonetized: editIsMonetized,
      pricingModel: editPricingModel,
      priceAmount: editPriceAmount,
      billingInterval: editBillingInterval,
      currency: editCurrency,
      trialQueriesCount: editTrialQueries,
      stripeProductId: stripeProdId,
      stripePriceId: stripePriceId,
      stripePaymentLink: stripeLink,
      clientStripeConnectAccountId: activeProfile.stripeAccountId,
      clientRevenueSharePercent: 90,
      totalRevenueEarned: existingMon?.totalRevenueEarned || 0,
      totalPaidQueriesProcessed: existingMon?.totalPaidQueriesProcessed || 0,
      activePayingSubscribersCount: existingMon?.activePayingSubscribersCount || 0,
      publicCheckoutTitle: editPublicTitle,
      publicOfferingDescription: editPublicDesc,
      customDomainPaywallUrl: `${activeProfile.customDomainPaywallUrl || "https://agents.apexenterprise.ai"}/${editingAgentMonetization.id}`,
      paywallEnabled: editPaywallEnabled,
      featuresIncluded: existingMon?.featuresIncluded || [
        "Instant 24/7 Agent SLA Response",
        "Direct API & Webhook Web Access",
        "Encrypted context execution",
        "Weekly performance analytics"
      ]
    };

    const updatedAgent: Agent = {
      ...editingAgentMonetization,
      monetization: updatedConfig,
    };

    onUpdateAgent(updatedAgent);
    setEditingAgentMonetization(null);
    setActionSuccessMsg(`Successfully configured Stripe monetization for ${updatedAgent.name}!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Process Simulated Payment in Terminal
  const handleProcessTerminalPayment = () => {
    const targetAgent = agents.find((a) => a.id === termAgentId) || agents[0];
    if (!targetAgent) return;

    setIsProcessingPayment(true);

    setTimeout(() => {
      const mon = targetAgent.monetization;
      const unitPrice = mon?.priceAmount || 149;
      const gross = mon?.pricingModel === "pay_per_query" ? unitPrice * termUnits : unitPrice;
      const platformFee = Number((gross * 0.1).toFixed(2));
      const clientNet = Number((gross - platformFee).toFixed(2));

      const newTx: ClientAgentTransaction = {
        id: `tx-stripe-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tenantId: activeProfile.tenantId,
        tenantName: activeProfile.tenantName,
        agentId: targetAgent.id,
        agentName: targetAgent.name,
        agentAvatar: targetAgent.avatar,
        department: targetAgent.department,
        customerName: termCustomerName,
        customerEmail: termCustomerEmail,
        customerCompany: termCustomerCompany,
        pricingModel: mon?.pricingModel || "subscription",
        grossAmount: gross,
        platformFeeAmount: platformFee,
        clientNetAmount: clientNet,
        stripePaymentIntentId: `pi_3Mtw${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        stripeReceiptUrl: `https://pay.stripe.com/receipts/${activeProfile.stripeAccountId}/pi_${Date.now()}`,
        status: "succeeded",
        querySnippet: termQuerySnippet,
        apiTokensUsed: Math.floor(Math.random() * 15000) + 4000,
        billingPeriod:
          mon?.pricingModel === "subscription"
            ? `${new Date().toLocaleString("default", { month: "short" })} 2026 - ${new Date(Date.now() + 30 * 86400000).toLocaleString("default", { month: "short" })} 2026`
            : undefined,
      };

      onAddTransaction(newTx);

      // Update Agent monetization totals
      const updatedAgent: Agent = {
        ...targetAgent,
        monetization: {
          ...(targetAgent.monetization || {
            isMonetized: true,
            pricingModel: "subscription",
            priceAmount: 149,
            billingInterval: "monthly",
            currency: "USD",
            trialQueriesCount: 5,
            stripeProductId: `prod_${targetAgent.id}`,
            stripePriceId: `price_${targetAgent.id}`,
            stripePaymentLink: `https://buy.stripe.com/test_${targetAgent.id}`,
            clientRevenueSharePercent: 90,
            totalRevenueEarned: 0,
            totalPaidQueriesProcessed: 0,
            activePayingSubscribersCount: 0,
            paywallEnabled: true,
          }),
          totalRevenueEarned: (targetAgent.monetization?.totalRevenueEarned || 0) + gross,
          totalPaidQueriesProcessed: (targetAgent.monetization?.totalPaidQueriesProcessed || 0) + 1,
          activePayingSubscribersCount:
            mon?.pricingModel === "subscription"
              ? (targetAgent.monetization?.activePayingSubscribersCount || 0) + 1
              : targetAgent.monetization?.activePayingSubscribersCount || 0,
        },
      };
      onUpdateAgent(updatedAgent);

      // Update Client Stripe Profile balances
      const updatedProfile: ClientStripeConnectProfile = {
        ...activeProfile,
        availableStripeBalance: activeProfile.availableStripeBalance + clientNet,
        totalAgentGrossRevenue: activeProfile.totalAgentGrossRevenue + gross,
        totalPlatformFeesPaid: activeProfile.totalPlatformFeesPaid + platformFee,
        totalClientNetEarnings: activeProfile.totalClientNetEarnings + clientNet,
      };
      onUpdateClientProfile(updatedProfile);

      setTerminalReceipt(newTx);
      setIsProcessingPayment(false);
      setActionSuccessMsg(`Stripe payment succeeded! Credited +$${clientNet.toFixed(2)} to ${activeProfile.tenantName}'s Stripe balance.`);
    }, 1200);
  };

  // Trigger Instant Bank Payout
  const handleExecutePayout = () => {
    if (payoutAmountInput <= 0 || payoutAmountInput > activeProfile.availableStripeBalance) {
      alert("Invalid payout amount or exceeds available Stripe balance.");
      return;
    }

    setIsProcessingPayout(true);

    setTimeout(() => {
      const newPayout: ClientPayoutRecord = {
        id: `payout-${Date.now()}`,
        payoutId: `po_1MtwInstant${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        tenantId: activeProfile.tenantId,
        timestamp: new Date().toISOString(),
        amount: payoutAmountInput,
        currency: "USD",
        bankName: activeProfile.bankName,
        bankAccountLast4: activeProfile.bankAccountLast4,
        status: "paid",
        arrivalDate: `${new Date().toISOString().split("T")[0]} (Instant Payout)`,
        stripeTransferReference: `STRIPE-CONNECT-INSTANT-PAYOUT-${activeProfile.tenantId.toUpperCase()}`,
      };

      onAddPayout(newPayout);

      const updatedProfile: ClientStripeConnectProfile = {
        ...activeProfile,
        availableStripeBalance: Number((activeProfile.availableStripeBalance - payoutAmountInput).toFixed(2)),
        lifetimePayoutsTransferred: Number((activeProfile.lifetimePayoutsTransferred + payoutAmountInput).toFixed(2)),
        lastPayoutDate: new Date().toISOString().split("T")[0],
        lastPayoutAmount: payoutAmountInput,
      };
      onUpdateClientProfile(updatedProfile);

      setIsProcessingPayout(false);
      setIsPayoutModalOpen(false);
      setActionSuccessMsg(`Instant Payout Sent! Transferred $${payoutAmountInput.toFixed(2)} to ${activeProfile.bankName} (ending in ${activeProfile.bankAccountLast4}).`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }, 1000);
  };

  const selectedAgentForTerminal = agents.find((a) => a.id === termAgentId) || agents[0];

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              {actionSuccessMsg}
            </p>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Client Tenant Selector Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Stripe Connect Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified Bank Payouts Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Client Agent Monetization & Stripe Revenue Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Allow your clients to turn their AI agents into revenue-generating paid services. End-customers can subscribe or pay per task via Stripe, with 90% direct payouts to the client's bank.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Tenant Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {clientStripeProfiles.map((p) => (
                <option key={p.tenantId} value={p.tenantId} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {p.tenantName} ({p.stripeAccountId})
                </option>
              ))}
              <option value="all" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                All Client Tenants (Aggregated)
              </option>
            </select>
          </div>

          {/* Instant Payout Button */}
          <button
            onClick={() => {
              setPayoutAmountInput(activeProfile.availableStripeBalance);
              setIsPayoutModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Wallet className="w-4 h-4" />
            Instant Bank Payout (${activeProfile.availableStripeBalance.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Top Level Financial Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Agent Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Agent Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ${totalGrossRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +28.4%
            </span>
            <span className="text-slate-500">processed via Stripe</span>
          </div>
        </div>

        {/* Client Net Earnings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Client Net Payout (90%)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            ${totalClientNetRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Platform Fee (10%):</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">${totalPlatformFees.toFixed(2)}</span>
          </div>
        </div>

        {/* Available for Instant Payout */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Available Stripe Balance</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            ${activeProfile.availableStripeBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Pending Clearing:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">${activeProfile.pendingStripeBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Paying Customers & Monetized Agents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Monetized Fleet & Clients</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {totalSubscribersCount} <span className="text-base font-medium text-slate-500">Paying Users</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Active Paid Agents:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{monetizedAgentsCount} of {agents.length} Agents</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("fleet")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeSubTab === "fleet"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Bot className="w-4 h-4" />
          Agent Pricing & Paywalls ({monetizedAgentsCount} Live)
        </button>

        <button
          onClick={() => setActiveSubTab("terminal")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeSubTab === "terminal"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Terminal className="w-4 h-4" />
          Stripe Checkout Simulator
        </button>

        <button
          onClick={() => setActiveSubTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeSubTab === "transactions"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Customer Payment Ledger ({clientTransactions.length})
        </button>

        <button
          onClick={() => setActiveSubTab("payouts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeSubTab === "payouts"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Wallet className="w-4 h-4" />
          Bank Payouts & Stripe Connect
        </button>

        <button
          onClick={() => setActiveSubTab("storefront")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeSubTab === "storefront"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Globe className="w-4 h-4" />
          Public Hosted Storefront & Embeds
        </button>
      </div>

      {/* SUB-TAB 1: AGENT MONETIZATION FLEET */}
      {activeSubTab === "fleet" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Client Monetized Agents Fleet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure paywalls, recurring subscription rates, pay-per-query fees, and trial limits per agent.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Auto-Sync with Stripe Product Catalog:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold rounded">
                Live Enabled
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((agent) => {
              const mon = agent.monetization;
              const isMon = mon?.isMonetized ?? false;

              return (
                <div
                  key={agent.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all relative flex flex-col justify-between ${
                    isMon
                      ? "border-indigo-200 dark:border-indigo-900/60 ring-1 ring-indigo-500/10"
                      : "border-slate-200 dark:border-slate-800 opacity-85"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {agent.name}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {agent.department}
                          </span>
                        </div>
                      </div>

                      {/* Monetization Status Badge */}
                      {isMon ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Paid Agent
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Internal Only
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                      {mon?.publicOfferingDescription || agent.description}
                    </p>

                    {/* Pricing Display */}
                    {isMon ? (
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 mb-4 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">Price Rate:</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            ${mon?.priceAmount.toFixed(2)}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {mon?.pricingModel === "subscription"
                                ? "/month"
                                : mon?.pricingModel === "pay_per_query"
                                ? "/task query"
                                : mon?.pricingModel === "usage_tokens"
                                ? "/1k tokens"
                                : " retainer"}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span>Cumulative Earnings:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ${(mon?.totalRevenueEarned || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Paying Customers:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {mon?.activePayingSubscribersCount || 0} active
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-dashed border-slate-300 dark:border-slate-700 text-center mb-4">
                        <p className="text-xs text-slate-500">
                          Not currently monetized. Click below to set pricing and enable Stripe paywall.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2">
                    {isMon && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={mon?.stripePaymentLink || ""}
                          className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300 select-all"
                        />
                        <button
                          onClick={() => copyToClipboard(mon?.stripePaymentLink || "", `link-${agent.id}`)}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                          title="Copy Stripe Payment Link"
                        >
                          {copiedKey === `link-${agent.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenMonetizationModal(agent)}
                        className="flex-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {isMon ? "Configure Stripe Pricing" : "Monetize Agent with Stripe"}
                      </button>

                      {isMon && (
                        <button
                          onClick={() => {
                            setTermAgentId(agent.id);
                            setActiveSubTab("terminal");
                          }}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1"
                          title="Test Payment Terminal"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STRIPE CHECKOUT SIMULATOR & TERMINAL */}
      {activeSubTab === "terminal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Terminal Controls */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <Terminal className="w-4 h-4" /> Live Customer Purchase Sandbox
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Simulate External Customer Buying Agent Access
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Experience the exact Stripe payment flow an external customer goes through when paying for your client's agent.
              </p>
            </div>

            {/* Select Agent */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target AI Agent to Purchase:
              </label>
              <select
                value={termAgentId}
                onChange={(e) => setTermAgentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.monetization?.isMonetized ? `$${a.monetization.priceAmount} - ${a.monetization.pricingModel}` : "Free Internal - will create test charge"})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Full Name:
                </label>
                <input
                  type="text"
                  value={termCustomerName}
                  onChange={(e) => setTermCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Email (Stripe Receipt):
                </label>
                <input
                  type="email"
                  value={termCustomerEmail}
                  onChange={(e) => setTermCustomerEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Organization (Optional):
              </label>
              <input
                type="text"
                value={termCustomerCompany}
                onChange={(e) => setTermCustomerCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {selectedAgentForTerminal?.monetization?.pricingModel === "pay_per_query" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity of Agent Tasks / Queries to Purchase:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={termUnits}
                    onChange={(e) => setTermUnits(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-bold text-sm text-slate-900 dark:text-white w-12 text-right">
                    {termUnits} tasks
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Paid Prompt / Task to Dispatch:
              </label>
              <textarea
                rows={2}
                value={termQuerySnippet}
                onChange={(e) => setTermQuerySnippet(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Simulated Stripe Credit Card Element */}
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Stripe Secure Pay Elements
                </span>
                <span className="font-mono text-[11px] text-indigo-300">TEST MODE (4242)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={termCardNumber}
                    onChange={(e) => setTermCardNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={termCardExpiry}
                    onChange={(e) => setTermCardExpiry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs font-mono text-center text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={termCardCvc}
                    onChange={(e) => setTermCardCvc(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs font-mono text-center text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleProcessTerminalPayment}
              disabled={isProcessingPayment}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Charging via Stripe Connect & Crediting Client Balance...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Process $
                  {(
                    (selectedAgentForTerminal?.monetization?.pricingModel === "pay_per_query"
                      ? (selectedAgentForTerminal?.monetization?.priceAmount || 0.75) * termUnits
                      : selectedAgentForTerminal?.monetization?.priceAmount || 149)
                  ).toFixed(2)}{" "}
                  Stripe Payment
                </>
              )}
            </button>
          </div>

          {/* Right Column: Interactive Order Breakdown & Live Receipt */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" /> Revenue Split Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Target Agent:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedAgentForTerminal.name}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Receiving Client Account:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {activeProfile.tenantName}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Stripe Destination Account:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {activeProfile.stripeAccountId}
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 space-y-1.5">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Customer Charge Amount (Gross):</span>
                    <span className="font-bold">
                      $
                      {(
                        (selectedAgentForTerminal?.monetization?.pricingModel === "pay_per_query"
                          ? (selectedAgentForTerminal?.monetization?.priceAmount || 0.75) * termUnits
                          : selectedAgentForTerminal?.monetization?.priceAmount || 149)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Client Net Payout (90%):</span>
                    <span>
                      +$
                      {(
                        ((selectedAgentForTerminal?.monetization?.pricingModel === "pay_per_query"
                          ? (selectedAgentForTerminal?.monetization?.priceAmount || 0.75) * termUnits
                          : selectedAgentForTerminal?.monetization?.priceAmount || 149) *
                          0.9)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Platform Infrastructure Fee (10%):</span>
                    <span>
                      -$
                      {(
                        ((selectedAgentForTerminal?.monetization?.pricingModel === "pay_per_query"
                          ? (selectedAgentForTerminal?.monetization?.priceAmount || 0.75) * termUnits
                          : selectedAgentForTerminal?.monetization?.priceAmount || 149) *
                          0.1)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Processed Receipt Card */}
            {terminalReceipt && (
              <div className="p-5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl shadow-sm space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Succeeded via Stripe Connect
                  </span>
                  <span className="text-xs font-mono text-slate-500">{terminalReceipt.stripePaymentIntentId}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {terminalReceipt.agentName} Access Granted
                  </h4>
                  <p className="text-xs text-slate-500">
                    Billed to {terminalReceipt.customerName} ({terminalReceipt.customerEmail})
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client Net Credited:</span>
                    <span className="font-bold text-emerald-600">+${terminalReceipt.clientNetAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tokens Dispatched:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{terminalReceipt.apiTokensUsed?.toLocaleString()} tokens</span>
                  </div>
                </div>

                <a
                  href={terminalReceipt.stripeReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Official Stripe Receipt
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: BANK PAYOUTS & STRIPE CONNECT */}
      {activeSubTab === "payouts" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeProfile.tenantName} Stripe Connect Account
                  </h2>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    KYC Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct deposit routing connected to {activeProfile.bankName} (ending in {activeProfile.bankAccountLast4}).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPayoutAmountInput(activeProfile.availableStripeBalance);
                    setIsPayoutModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  Initiate Instant Payout to Bank
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-xs text-slate-500">Stripe Connect ID</span>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {activeProfile.stripeAccountId}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-xs text-slate-500">Default Payout Schedule</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">
                  {activeProfile.defaultPayoutCadence} (Direct to Bank)
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-xs text-slate-500">Lifetime Paid Out to Bank</span>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  ${activeProfile.lifetimePayoutsTransferred.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-xs text-slate-500">Last Payout Date & Amount</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  ${(activeProfile.lastPayoutAmount || 0).toFixed(2)} on {activeProfile.lastPayoutDate || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Payouts History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bank Direct Transfer & Payout History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Payout ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Bank Destination</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Stripe Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {clientPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {p.payoutId}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {new Date(p.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${p.amount.toFixed(2)} {p.currency}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {p.bankName} (****{p.bankAccountLast4})
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {p.stripeTransferReference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CUSTOMER PAYMENT LEDGER */}
      {activeSubTab === "transactions" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Live Customer Payment Transactions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time ledger of external customer payments received for AI agents via Stripe.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, agent, or PI..."
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <select
                value={txFilterAgent}
                onChange={(e) => setTxFilterAgent(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <select
                value={txFilterPricing}
                onChange={(e) => setTxFilterPricing(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Pricing Models</option>
                <option value="subscription">Subscription</option>
                <option value="pay_per_query">Pay Per Task</option>
                <option value="fixed_retainer">Retainer</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Customer & Company</th>
                  <th className="p-3">Purchased Agent</th>
                  <th className="p-3">Pricing Tier</th>
                  <th className="p-3">Gross Charge</th>
                  <th className="p-3">Client Net (90%)</th>
                  <th className="p-3">Stripe PI ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{tx.customerName}</div>
                      <div className="text-[11px] text-slate-500">{tx.customerEmail}</div>
                      {tx.customerCompany && (
                        <div className="text-[10px] text-indigo-500 font-medium">{tx.customerCompany}</div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={tx.agentAvatar} alt={tx.agentName} className="w-6 h-6 rounded-md object-cover" />
                        <span className="font-medium text-slate-900 dark:text-white">{tx.agentName}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {tx.pricingModel.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      ${tx.grossAmount.toFixed(2)}
                    </td>

                    <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                      +${tx.clientNetAmount.toFixed(2)}
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {tx.stripePaymentIntentId}
                    </td>

                    <td className="p-3 text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>

                    <td className="p-3 text-right">
                      {tx.stripeReceiptUrl ? (
                        <a
                          href={tx.stripeReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          Receipt <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PUBLIC HOSTED STOREFRONT & EMBED WIDGETS */}
      {activeSubTab === "storefront" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Public Agent Paywall Storefront & Embed Widgets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share direct checkout pages with prospective clients or embed an AI Agent Paywall widget on any website.
              </p>
            </div>

            {/* Storefront Link Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 flex-1">
                <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0 font-medium">Public Storefront URL:</span>
                <input
                  type="text"
                  readOnly
                  value={activeProfile.customDomainPaywallUrl || "https://agents.apexenterprise.ai"}
                  className="flex-1 bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyToClipboard(
                      activeProfile.customDomainPaywallUrl || "https://agents.apexenterprise.ai",
                      "storefront-url"
                    )
                  }
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-100"
                >
                  {copiedKey === "storefront-url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy URL
                </button>
              </div>
            </div>

            {/* Embeddable Snippet */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Embeddable JavaScript Paywall Widget (Webflow, WordPress, Next.js):
              </span>
              <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800">
{`<!-- AgentFlow Stripe Connect AI Paywall Widget -->
<script 
  src="https://cdn.agentflow.app/sdk/v1/agent-paywall.js" 
  data-client-id="${activeProfile.stripeAccountId}"
  data-agent-id="${agents[0]?.id || 'agent-1'}"
  data-theme="dark"
  data-currency="USD"
  async>
</script>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE AGENT STRIPE MONETIZATION */}
      {editingAgentMonetization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={editingAgentMonetization.avatar}
                  alt={editingAgentMonetization.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Monetize {editingAgentMonetization.name} with Stripe
                  </h3>
                  <span className="text-xs text-slate-500">
                    Connect payout stream to {activeProfile.tenantName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingAgentMonetization(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Enable Stripe Paywall for this Agent
                  </h4>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Allow external clients to subscribe or pay per task execution.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsMonetized}
                  onChange={(e) => setEditIsMonetized(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Pricing Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Billing Model:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditPricingModel("subscription");
                      setEditBillingInterval("monthly");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editPricingModel === "subscription"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 ring-1 ring-indigo-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Recurring Subscription</div>
                    <div className="text-[11px] text-slate-500">e.g. $149/month for 24/7 access</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditPricingModel("pay_per_query");
                      setEditBillingInterval("per_request");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      editPricingModel === "pay_per_query"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 ring-1 ring-indigo-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Pay-Per-Task Query</div>
                    <div className="text-[11px] text-slate-500">e.g. $0.75 per resolved support ticket</div>
                  </button>
                </div>
              </div>

              {/* Price Rate in USD */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price Amount ($ USD):
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      value={editPriceAmount}
                      onChange={(e) => setEditPriceAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Free Trial Queries:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={editTrialQueries}
                    onChange={(e) => setEditTrialQueries(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Public Storefront Copy */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Public Offering Headline:
                </label>
                <input
                  type="text"
                  value={editPublicTitle}
                  onChange={(e) => setEditPublicTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Public Value Proposition & Features:
                </label>
                <textarea
                  rows={2}
                  value={editPublicDesc}
                  onChange={(e) => setEditPublicDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setEditingAgentMonetization(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMonetization}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Save & Sync to Stripe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSTANT STRIPE BANK PAYOUT */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Instant Bank Payout
                  </h3>
                  <span className="text-xs text-slate-500">Stripe Connect Direct Transfer</span>
                </div>
              </div>

              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Destination Bank Account:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {activeProfile.bankName} (****{activeProfile.bankAccountLast4})
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Available Balance:</span>
                  <span className="font-bold text-emerald-600">
                    ${activeProfile.availableStripeBalance.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payout Amount to Transfer:
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={activeProfile.availableStripeBalance}
                    value={payoutAmountInput}
                    onChange={(e) => setPayoutAmountInput(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Zero-fee instant transfer via Stripe Connect ACH / RTP Network.
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecutePayout}
                disabled={isProcessingPayout || payoutAmountInput <= 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                {isProcessingPayout ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing Instant Transfer...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm Transfer ${payoutAmountInput.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
