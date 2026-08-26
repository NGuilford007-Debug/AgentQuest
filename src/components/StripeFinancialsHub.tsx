import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Building2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Wallet,
  Receipt,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu,
  HardDrive,
  Users,
  Copy,
  Check,
  Smartphone,
  Globe,
  Zap,
  Sparkles
} from "lucide-react";
import {
  StripeReceivableInvoice,
  StripePayableBill,
  StripeAccountStatus,
  TenantBillingRecord,
  DeveloperCompanyProfile,
  RateCardConfig
} from "../types";
import { 
  initRevenueCat, 
  getRevenueCatCustomerInfo, 
  getRevenueCatOfferings, 
  presentRevenueCatPaywall,
  checkHasEntitlement,
  REVENUECAT_API_KEY,
  getRevenueCatUserId
} from "../services/revenuecat";
import type { CustomerInfo, Offerings } from "@revenuecat/purchases-js";

interface StripeFinancialsHubProps {
  tenantsBilling: TenantBillingRecord[];
  developerProfile: DeveloperCompanyProfile;
  rateCard: RateCardConfig;
  onOpenWebAppGuide?: () => void;
}

export const StripeFinancialsHub: React.FC<StripeFinancialsHubProps> = ({
  tenantsBilling,
  developerProfile,
  rateCard,
  onOpenWebAppGuide,
}) => {
  const [activeTab, setActiveTab] = useState<"receivables" | "payables" | "checkout_terminal" | "revenuecat" | "account_settings">("receivables");
  const [receivables, setReceivables] = useState<StripeReceivableInvoice[]>([]);
  const [payables, setPayables] = useState<StripePayableBill[]>([]);
  
  // RevenueCat Purchases SDK State
  const [rcCustomerInfo, setRcCustomerInfo] = useState<CustomerInfo | null>(null);
  const [rcOfferings, setRcOfferings] = useState<Offerings | null>(null);
  const [isRcLoading, setIsRcLoading] = useState(false);
  const [rcNotice, setRcNotice] = useState<string | null>(null);
  const [rcAppUserId, setRcAppUserId] = useState<string>(() => getRevenueCatUserId());

  // Load RevenueCat info on mount or tab switch
  useEffect(() => {
    let isMounted = true;
    const loadRc = async () => {
      try {
        setIsRcLoading(true);
        initRevenueCat(developerProfile.developerEmail || "toppgunn321@gmail.com");
        setRcAppUserId(getRevenueCatUserId());
        const [info, offs] = await Promise.all([
          getRevenueCatCustomerInfo(),
          getRevenueCatOfferings(),
        ]);
        if (isMounted) {
          setRcCustomerInfo(info);
          setRcOfferings(offs);
        }
      } catch (err) {
        console.warn("RevenueCat load error in FinancialsHub:", err);
      } finally {
        if (isMounted) setIsRcLoading(false);
      }
    };
    loadRc();
    return () => { isMounted = false; };
  }, [developerProfile.developerEmail]);

  const handleTestRcPaywall = async () => {
    setIsRcLoading(true);
    setRcNotice(null);
    try {
      const result = await presentRevenueCatPaywall(rcOfferings?.current || undefined);
      if (result.customerInfo) setRcCustomerInfo(result.customerInfo);
      if (result.success) {
        showNotification("RevenueCat purchase complete! 'SyncSchedule Pro' entitlement unlocked.");
      } else if (result.error) {
        setRcNotice(`RevenueCat result: ${result.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Paywall test failed";
      setRcNotice(`RevenueCat notice: ${msg}`);
    } finally {
      setIsRcLoading(false);
    }
  };

  const handleCheckRcEntitlements = async () => {
    setIsRcLoading(true);
    setRcNotice(null);
    try {
      const info = await getRevenueCatCustomerInfo();
      setRcCustomerInfo(info);
      const isPro = await checkHasEntitlement("SyncSchedule Pro");
      if (isPro) {
        setRcNotice("👑 'SyncSchedule Pro' entitlement is ACTIVE in RevenueCat!");
        showNotification("'SyncSchedule Pro' entitlement is ACTIVE!");
      } else {
        const activeKeys = info?.entitlements?.active ? Object.keys(info.entitlements.active) : [];
        setRcNotice(
          activeKeys.length > 0 
            ? `Active RevenueCat Entitlements: ${activeKeys.join(", ")}` 
            : "No active entitlements found yet for this App User ID."
        );
      }
    } catch (e) {
      setRcNotice("Error contacting RevenueCat API.");
    } finally {
      setIsRcLoading(false);
    }
  };
  const [stripeStatus, setStripeStatus] = useState<StripeAccountStatus>({
    hasSecretKey: false,
    isLiveMode: false,
    publishableKey: "pk_test_sample_agentflow_dev",
    accountId: "acct_agentflow_founder_sandbox",
    accountEmail: developerProfile.developerEmail || "toppgunn321@gmail.com",
    businessName: `${developerProfile.companyName} (Founder Entity)`,
    defaultCurrency: "usd",
    availableBalance: 4850.34,
    pendingBalance: 1280.00,
    payoutsEnabled: true,
    chargesEnabled: true,
    webhookConfigured: false,
    liveTransactionsCount: 7,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [filterReceivableStatus, setFilterReceivableStatus] = useState<string>("all");
  const [filterPayableStatus, setFilterPayableStatus] = useState<string>("all");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Receivable Modal State
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [newInvTenantId, setNewInvTenantId] = useState<string>(tenantsBilling[1]?.tenantId || "ten-2");
  const [newInvDueDate, setNewInvDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [newInvBaseFee, setNewInvBaseFee] = useState<number>(499);
  const [newInvAiTokensMillion, setNewInvAiTokensMillion] = useState<number>(35);
  const [newInvStorageGb, setNewInvStorageGb] = useState<number>(180);

  // New Payable Modal State
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [newBillVendorName, setNewBillVendorName] = useState("");
  const [newBillCategory, setNewBillCategory] = useState<StripePayableBill["vendorCategory"]>("Contractor & Prompt Engineer");
  const [newBillEmail, setNewBillEmail] = useState("");
  const [newBillAmount, setNewBillAmount] = useState<number>(350);
  const [newBillDueDate, setNewBillDueDate] = useState<string>(
    new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0]
  );
  const [newBillPayoutMethod, setNewBillPayoutMethod] = useState<StripePayableBill["payoutMethod"]>("stripe_connect_transfer");
  const [newBillDescription, setNewBillDescription] = useState("");

  // Interactive Terminal Test State
  const [terminalTenant, setTerminalTenant] = useState(tenantsBilling[1]?.tenantName || "Apex Logistics AI");
  const [terminalAmount, setTerminalAmount] = useState(250);
  const [terminalItem, setTerminalItem] = useState("AI Inference Token Credit Top-Up (150M Tokens)");
  const [terminalResultUrl, setTerminalResultUrl] = useState<string | null>(null);

  // Fetch live or initial data from backend API
  const fetchStripeData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, recRes, payRes] = await Promise.all([
        fetch("/api/stripe/status").then((r) => r.json()),
        fetch("/api/stripe/receivables").then((r) => r.json()),
        fetch("/api/stripe/payables").then((r) => r.json()),
      ]);

      if (statusRes.success) setStripeStatus(statusRes);
      if (recRes.success) setReceivables(recRes.receivables || []);
      if (payRes.success) setPayables(payRes.payables || []);
    } catch (err) {
      console.warn("Failed to fetch Stripe backend, using local fallback state", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStripeData();
  }, []);

  // Aggregated Financial Metrics
  const totalReceivablesGross = useMemo(() => {
    return receivables.reduce((sum, r) => sum + r.amount, 0);
  }, [receivables]);

  const totalReceivablesCollected = useMemo(() => {
    return receivables.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.amount, 0);
  }, [receivables]);

  const totalReceivablesOutstanding = useMemo(() => {
    return receivables.filter((r) => r.status === "open").reduce((sum, r) => sum + r.amount, 0);
  }, [receivables]);

  const totalPayablesGross = useMemo(() => {
    return payables.reduce((sum, p) => sum + p.amount, 0);
  }, [payables]);

  const totalPayablesDispatched = useMemo(() => {
    return payables.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  }, [payables]);

  const totalPayablesPending = useMemo(() => {
    return payables.filter((p) => p.status === "pending_approval" || p.status === "scheduled").reduce((sum, p) => sum + p.amount, 0);
  }, [payables]);

  const netRetainedCash = totalReceivablesCollected - totalPayablesDispatched;

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handler: Create Receivable Invoice
  const handleCreateReceivableInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTenant = tenantsBilling.find((t) => t.tenantId === newInvTenantId) || tenantsBilling[0];

    const aiRate = (rateCard.aiTokenCostPerMillionIn + rateCard.aiTokenCostPerMillionOut) / 2 * rateCard.aiTokenMarkupMultiplier;
    const storageRate = rateCard.storageBaseCostPerGbMonth * rateCard.storageMarkupMultiplier;

    const lineItems = [
      {
        id: `li-${Date.now()}-1`,
        description: `${selectedTenant?.plan || "SaaS Platform"} Subscription`,
        category: "subscription_base" as const,
        quantity: 1,
        unitPrice: Number(newInvBaseFee),
        amount: Number(newInvBaseFee),
      },
      {
        id: `li-${Date.now()}-2`,
        description: `Metered Gemini AI Tokens (${newInvAiTokensMillion}M tokens)`,
        category: "metered_ai_tokens" as const,
        quantity: Number(newInvAiTokensMillion),
        unitPrice: Number(aiRate.toFixed(2)),
        amount: Number((newInvAiTokensMillion * aiRate).toFixed(2)),
      },
      {
        id: `li-${Date.now()}-3`,
        description: `Cloud Storage Allocation (${newInvStorageGb} GB)`,
        category: "metered_storage" as const,
        quantity: Number(newInvStorageGb),
        unitPrice: Number(storageRate.toFixed(2)),
        amount: Number((newInvStorageGb * storageRate).toFixed(2)),
      },
    ];

    try {
      const res = await fetch("/api/stripe/receivables/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenant.tenantId,
          tenantName: selectedTenant.tenantName,
          customerEmail: selectedTenant.contactEmail,
          lineItems,
          dueDate: newInvDueDate,
          autoCharge: true,
        }),
      }).then((r) => r.json());

      if (res.success && res.invoice) {
        setReceivables((prev) => [res.invoice, ...prev]);
        setIsCreateInvoiceOpen(false);
        showNotification(`Invoice ${res.invoice.invoiceNumber} created and Stripe Checkout Link generated.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Pay Receivable Invoice
  const handlePayReceivable = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/stripe/receivables/${invoiceId}/pay`, {
        method: "POST",
      }).then((r) => r.json());

      if (res.success) {
        setReceivables((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "paid", paidAt: new Date().toISOString().split("T")[0] } : inv))
        );
        showNotification(res.message || "Payment processed successfully via Stripe.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Create Payable Bill
  const handleCreatePayableBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/stripe/payables/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: newBillVendorName,
          vendorCategory: newBillCategory,
          vendorEmail: newBillEmail,
          amount: newBillAmount,
          dueDate: newBillDueDate,
          payoutMethod: newBillPayoutMethod,
          description: newBillDescription || `${newBillCategory} Invoice Settlement`,
        }),
      }).then((r) => r.json());

      if (res.success && res.bill) {
        setPayables((prev) => [res.bill, ...prev]);
        setIsCreateBillOpen(false);
        setNewBillVendorName("");
        setNewBillEmail("");
        showNotification(`Payable bill ${res.bill.billNumber} for $${res.bill.amount} recorded.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Execute Payout
  const handleExecutePayout = async (billId: string) => {
    try {
      const res = await fetch(`/api/stripe/payables/${billId}/payout`, {
        method: "POST",
      }).then((r) => r.json());

      if (res.success) {
        setPayables((prev) =>
          prev.map((b) => (b.id === billId ? { ...b, status: "paid", paidAt: new Date().toISOString().split("T")[0] } : b))
        );
        showNotification(res.message || "Stripe Connect payout dispatched.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Test Checkout Session Generator
  const handleCreateTestCheckout = async () => {
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName: terminalTenant,
          amount: terminalAmount,
          itemName: terminalItem,
          customerEmail: "billing@client.com",
        }),
      }).then((r) => r.json());

      if (res.success) {
        setTerminalResultUrl(res.checkoutUrl);
        showNotification("Stripe Checkout URL created successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered lists
  const filteredReceivables = useMemo(() => {
    if (filterReceivableStatus === "all") return receivables;
    return receivables.filter((r) => r.status === filterReceivableStatus);
  }, [receivables, filterReceivableStatus]);

  const filteredPayables = useMemo(() => {
    if (filterPayableStatus === "all") return payables;
    return payables.filter((p) => p.status === filterPayableStatus);
  }, [payables, filterPayableStatus]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Banner & Mode Status */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Stripe Financials Engine: Receivables & Payables
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
              stripeStatus.hasSecretKey
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
            }`}>
              {stripeStatus.hasSecretKey ? "Stripe Live Connected" : "Stripe Sandbox Simulation"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automate customer billing collections (Receivables), contractor & vendor payouts (Payables), and connect transfers with itemized audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          {onOpenWebAppGuide && (
            <button
              onClick={onOpenWebAppGuide}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-indigo-500/20 hover:opacity-95 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web App Launch Guide</span>
            </button>
          )}

          <button
            onClick={fetchStripeData}
            disabled={isLoading}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
            title="Refresh Stripe Balances"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receivables Collected */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Accounts Receivable (Collected)</span>
            <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
            ${totalReceivablesCollected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <span>${totalReceivablesOutstanding.toFixed(2)} Open / Due</span>
          </div>
        </div>

        {/* Payables Dispatched */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Accounts Payable (Dispatched)</span>
            <div className="p-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
            ${totalPayablesDispatched.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
            <span>${totalPayablesPending.toFixed(2)} Pending Approval</span>
          </div>
        </div>

        {/* Net Retained Cash */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md shadow-purple-500/20">
          <div className="flex items-center justify-between text-purple-100 text-xs font-medium">
            <span>Net Retained Cash Margin</span>
            <div className="p-1 rounded bg-white/20 text-white">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-1.5 tracking-tight">
            ${netRetainedCash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-100 font-semibold mt-1">
            <span>{(totalReceivablesCollected > 0 ? (netRetainedCash / totalReceivablesCollected * 100).toFixed(1) : 0)}% Operating Cash Efficiency</span>
          </div>
        </div>

        {/* Available Stripe Balance */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Stripe Account Balance</span>
            <div className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5 tracking-tight">
            ${stripeStatus.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            +${stripeStatus.pendingBalance.toFixed(2)} pending 2-day payout
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("receivables")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "receivables"
                ? "bg-purple-600 text-white shadow-xs shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Receivables (Customer Invoices)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-white text-[10px] font-bold">
              {receivables.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("payables")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "payables"
                ? "bg-purple-600 text-white shadow-xs shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Payables (Vendor & Contractor Bills)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-white text-[10px] font-bold">
              {payables.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("checkout_terminal")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "checkout_terminal"
                ? "bg-purple-600 text-white shadow-xs shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live Checkout Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab("revenuecat")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "revenuecat"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-xs shadow-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>RevenueCat Subscriptions</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              v1.53
            </span>
          </button>

          <button
            onClick={() => setActiveTab("account_settings")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "account_settings"
                ? "bg-purple-600 text-white shadow-xs shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Stripe Keys & Webhooks</span>
          </button>
        </div>

        {/* Action Button depending on tab */}
        {activeTab === "receivables" && (
          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Customer Invoice</span>
          </button>
        )}

        {activeTab === "payables" && (
          <button
            onClick={() => setIsCreateBillOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Vendor Bill</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACCOUNTS RECEIVABLE (CUSTOMER INVOICES) */}
      {/* ========================================================================= */}
      {activeTab === "receivables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Status:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {["all", "paid", "open", "draft"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterReceivableStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      filterReceivableStatus === st
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredReceivables.length} of {receivables.length} invoices
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Customer / Organization</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Line Items</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredReceivables.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                          <button
                            onClick={() => copyToClipboard(inv.invoiceNumber, inv.id)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Invoice Number"
                          >
                            {copiedId === inv.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400">{inv.issuedDate}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>{inv.tenantName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{inv.customerEmail}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          ${inv.amount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">{inv.currency}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-0.5 max-w-xs">
                          {inv.lineItems.map((li, idx) => (
                            <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                              • {li.description} (${li.amount.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                        {inv.dueDate}
                        {inv.paidAt && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Paid on {inv.paidAt}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 border ${
                          inv.status === "paid"
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : inv.status === "open"
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-300"
                        }`}>
                          {inv.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                          {inv.status === "open" && <Clock className="w-3 h-3" />}
                          <span>{inv.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== "paid" && (
                            <button
                              onClick={() => handlePayReceivable(inv.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                            >
                              Charge Card / Pay
                            </button>
                          )}

                          {inv.receiptUrl && (
                            <a
                              href={inv.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                              title="View Stripe Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </a>
                          )}

                          {inv.stripeCheckoutSessionUrl && inv.status !== "paid" && (
                            <a
                              href={inv.stripeCheckoutSessionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                              title="Open Customer Checkout Link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACCOUNTS PAYABLE (VENDOR BILLS & DISPATCHED PAYOUTS) */}
      {/* ========================================================================= */}
      {activeTab === "payables" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Status:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {["all", "pending_approval", "scheduled", "paid"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterPayableStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      filterPayableStatus === st
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredPayables.length} of {payables.length} payable bills
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Bill #</th>
                    <th className="py-3 px-3">Vendor / Recipient</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payout Method</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredPayables.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{bill.billNumber}</span>
                          <button
                            onClick={() => copyToClipboard(bill.billNumber, bill.id)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Bill ID"
                          >
                            {copiedId === bill.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400">Due {bill.dueDate}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {bill.vendorName}
                        </div>
                        <div className="text-[11px] text-slate-500">{bill.vendorEmail}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] border border-indigo-200 dark:border-indigo-800">
                          {bill.vendorCategory}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">{bill.description}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          ${bill.amount.toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {bill.payoutMethod.replace(/_/g, " ")}
                        </div>
                        {bill.stripeTransferId && (
                          <div className="text-[10px] text-purple-600 font-mono">
                            {bill.stripeTransferId}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 border ${
                          bill.status === "paid"
                            ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : bill.status === "pending_approval"
                            ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                        }`}>
                          {bill.status === "paid" && <CheckCircle2 className="w-3 h-3" />}
                          {bill.status === "pending_approval" && <AlertCircle className="w-3 h-3" />}
                          {bill.status === "scheduled" && <Clock className="w-3 h-3" />}
                          <span>{bill.status.replace("_", " ")}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {bill.status !== "paid" ? (
                          <button
                            onClick={() => handleExecutePayout(bill.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ml-auto"
                          >
                            <Send className="w-3 h-3" />
                            <span>Dispatch Payout</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid {bill.paidAt}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE CHECKOUT TERMINAL & PAYMENT LINK GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "checkout_terminal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Create Instant Stripe Checkout Session</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate hosted Stripe payment links for client subscriptions, wallet credit deposits, or custom retainers.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Select Tenant / Client:
                </label>
                <select
                  value={terminalTenant}
                  onChange={(e) => setTerminalTenant(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {tenantsBilling.map((t) => (
                    <option key={t.tenantId} value={t.tenantName}>
                      {t.tenantName} ({t.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Item Description / Purpose:
                </label>
                <input
                  type="text"
                  value={terminalItem}
                  onChange={(e) => setTerminalItem(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Credit Wallet Deposit (100M Tokens)"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Amount in USD ($):
                </label>
                <div className="flex gap-2">
                  {[100, 250, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTerminalAmount(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        terminalAmount === preset
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                  <input
                    type="number"
                    value={terminalAmount}
                    onChange={(e) => setTerminalAmount(Number(e.target.value))}
                    className="w-28 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateTestCheckout}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Generate Hosted Stripe Checkout Link</span>
              </button>
            </div>

            {terminalResultUrl && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center justify-between">
                  <span>Stripe Checkout Link Ready:</span>
                  <a
                    href={terminalResultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-600 dark:text-purple-400 font-bold underline flex items-center gap-1"
                  >
                    <span>Open Payment Window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={terminalResultUrl}
                    className="w-full text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-slate-700 dark:text-slate-300 font-mono select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(terminalResultUrl, "checkout-url")}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shrink-0"
                    title="Copy Link"
                  >
                    {copiedId === "checkout-url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payables Automated Settlement Info */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Stripe Connect & Split Settlement Engine</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                How funds flow from client payments into your developer balance and vendor payouts.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Customer Pays via Stripe</div>
                  <div className="text-slate-500 mt-0.5">
                    Tenant pays $499 subscription + metered AI overages via Card, Apple Pay, or ACH Direct Debit.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Founder Company Retains Profit Markup (80%-95%)</div>
                  <div className="text-slate-500 mt-0.5">
                    Your developer entity immediately captures the 4.0x–5.0x rate card profit markup as retained earnings.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Automated Payables Dispatch</div>
                  <div className="text-slate-500 mt-0.5">
                    Wholesale Google Cloud & Gemini API costs ($0.075/1M tokens) are settled via ACH, while contractor prompt engineers receive Stripe Connect transfers.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REVENUECAT IN-APP & WEB PURCHASES GATEWAY */}
      {/* ========================================================================= */}
      {activeTab === "revenuecat" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-bold shadow-md">
                    <Sparkles className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span>RevenueCat Purchases & Web Paywall Engine</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                        @revenuecat/purchases-js
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Cross-platform subscription management, mobile & web in-app purchases, and entitlement unlocking.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCheckRcEntitlements}
                  disabled={isRcLoading}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRcLoading ? "animate-spin text-amber-500" : ""}`} />
                  <span>Sync Entitlements</span>
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {rcNotice && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2">
                <span>{rcNotice}</span>
                <button
                  onClick={() => setRcNotice(null)}
                  className="text-amber-700 dark:text-amber-400 hover:underline text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Entitlement</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>SyncSchedule Pro</span>
                  {rcCustomerInfo && "SyncSchedule Pro" in rcCustomerInfo.entitlements.active ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      Inactive / Gate
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Entitlements Count</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {rcCustomerInfo?.entitlements?.active ? Object.keys(rcCustomerInfo.entitlements.active).length : 0}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {rcCustomerInfo?.entitlements?.active && Object.keys(rcCustomerInfo.entitlements.active).length > 0
                    ? Object.keys(rcCustomerInfo.entitlements.active).join(", ")
                    : "No active subscriptions"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Current RC Offering</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {rcOfferings?.current?.identifier || "Standard Offering"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {rcOfferings?.current?.availablePackages?.length || 0} packages available
                </div>
              </div>
            </div>

            {/* Live Paywall Launch & Code Test Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-amber-500/5 to-orange-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Interactive RevenueCat Paywall Trigger
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Test the native web paywall component. When purchased, RevenueCat will grant the <code>SyncSchedule Pro</code> entitlement to this user session.
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">App User ID:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{rcAppUserId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Public API Key:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{REVENUECAT_API_KEY}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestRcPaywall}
                    disabled={isRcLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Present Paywall (purchases.presentPaywall)</span>
                  </button>
                </div>
              </div>

              {/* Code Snippet Reference */}
              <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400">RevenueCat Integration Pattern</span>
                  <span>@revenuecat/purchases-js</span>
                </div>
                <pre className="overflow-x-auto text-slate-300 leading-relaxed">
{`import { Purchases } from "@revenuecat/purchases-js";

// 1. Configure SDK
const purchases = Purchases.configure({
  apiKey: "${REVENUECAT_API_KEY}",
  appUserId: Purchases.generateRevenueCatAnonymousAppUserId(),
});

// 2. Check Customer Entitlements
const customerInfo = await purchases.getCustomerInfo();
if ("SyncSchedule Pro" in customerInfo.entitlements.active) {
  // Grant user access to entitlement
}

// 3. Present Paywall
const offerings = await purchases.getOfferings();
const result = await purchases.presentPaywall({
  offering: offerings.current
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STRIPE KEYS & SECRETS CONFIGURATION */}
      {/* ========================================================================= */}
      {activeTab === "account_settings" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Stripe Production & Sandbox Credentials</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure your secret API keys to transition from sandbox simulation to live credit card and bank processing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Environment Variable Setup (.env / Settings):
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] overflow-x-auto">
                    <div># Set in Google AI Studio Settings or .env</div>
                    <div className="text-purple-400">STRIPE_SECRET_KEY="sk_test_..."</div>
                    <div className="text-indigo-400">VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."</div>
                    <div className="text-emerald-400">STRIPE_WEBHOOK_SECRET="whsec_..."</div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>• <strong>Lazy Initialized:</strong> If keys are not present, the app continues to operate flawlessly with an interactive sandbox simulator.</p>
                <p>• <strong>Security First:</strong> Secret keys remain 100% server-side on your Cloud Run instance.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Current Stripe Account Status:
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Connected Entity:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{developerProfile.companyName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Founder Account:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{developerProfile.developerEmail}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Charges & Payouts:</span>
                    <span className="font-bold text-emerald-600">Enabled (Active)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Webhook Status:</span>
                    <span className="font-mono text-[11px] text-purple-600">/api/stripe/webhook (Listening)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ISSUE NEW RECEIVABLE INVOICE */}
      {/* ========================================================================= */}
      {isCreateInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Issue Itemized Receivable Invoice</span>
              </h3>
              <button
                onClick={() => setIsCreateInvoiceOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReceivableInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Select Tenant:
                </label>
                <select
                  value={newInvTenantId}
                  onChange={(e) => {
                    setNewInvTenantId(e.target.value);
                    const tenant = tenantsBilling.find((t) => t.tenantId === e.target.value);
                    if (tenant) {
                      setNewInvBaseFee(tenant.basePlanFee);
                      setNewInvAiTokensMillion(Math.round((tenant.promptTokensUsed + tenant.completionTokensUsed) / 1_000_000));
                      setNewInvStorageGb(Math.round(tenant.storageUsedGb));
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {tenantsBilling.map((t) => (
                    <option key={t.tenantId} value={t.tenantId}>
                      {t.tenantName} ({t.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Base Plan ($):
                  </label>
                  <input
                    type="number"
                    value={newInvBaseFee}
                    onChange={(e) => setNewInvBaseFee(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    AI Tokens (M):
                  </label>
                  <input
                    type="number"
                    value={newInvAiTokensMillion}
                    onChange={(e) => setNewInvAiTokensMillion(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Storage (GB):
                  </label>
                  <input
                    type="number"
                    value={newInvStorageGb}
                    onChange={(e) => setNewInvStorageGb(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Invoice Payment Due Date:
                </label>
                <input
                  type="date"
                  value={newInvDueDate}
                  onChange={(e) => setNewInvDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex justify-between items-center">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Estimated Total Amount:</span>
                <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                  ${(Number(newInvBaseFee) + (newInvAiTokensMillion * 1.5) + (newInvStorageGb * 0.1)).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateInvoiceOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  Generate Invoice & Stripe Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD NEW PAYABLE BILL */}
      {/* ========================================================================= */}
      {isCreateBillOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Record Outgoing Payable Bill / Vendor Invoice</span>
              </h3>
              <button
                onClick={() => setIsCreateBillOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayableBill} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Vendor / Contractor Name:
                </label>
                <input
                  type="text"
                  required
                  value={newBillVendorName}
                  onChange={(e) => setNewBillVendorName(e.target.value)}
                  placeholder="e.g. Prompt Engineering Contractor or AI Model Vendor"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Category:
                  </label>
                  <select
                    value={newBillCategory}
                    onChange={(e) => setNewBillCategory(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Google Cloud Infra">Google Cloud Infra</option>
                    <option value="Contractor & Prompt Engineer">Contractor & Prompt Engineer</option>
                    <option value="AI Model API Vendor">AI Model API Vendor</option>
                    <option value="Affiliate & Partner Payout">Affiliate & Partner Payout</option>
                    <option value="Software License">Software License</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Vendor Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={newBillEmail}
                    onChange={(e) => setNewBillEmail(e.target.value)}
                    placeholder="billing@vendor.com"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Amount ($ USD):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newBillAmount}
                    onChange={(e) => setNewBillAmount(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Payout Method:
                  </label>
                  <select
                    value={newBillPayoutMethod}
                    onChange={(e) => setNewBillPayoutMethod(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="stripe_connect_transfer">Stripe Connect Transfer</option>
                    <option value="instant_card_payout">Instant Card Payout</option>
                    <option value="ach_direct_deposit">ACH Direct Deposit</option>
                    <option value="wire_transfer">Wire Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Description / Service Scope:
                </label>
                <input
                  type="text"
                  value={newBillDescription}
                  onChange={(e) => setNewBillDescription(e.target.value)}
                  placeholder="e.g. Milestone 2 Agent Template Development"
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateBillOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Save Payable Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
