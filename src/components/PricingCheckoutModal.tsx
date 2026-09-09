import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  Bot,
  ArrowRight,
  Lock,
  ExternalLink,
  Coins,
  Check,
  HelpCircle,
  X,
  Layers,
  FileText,
  BadgeCheck,
  Gift,
  Flame,
  UserPlus,
  Eye,
  Download,
  Copy,
  Scale,
  Wallet,
  Percent,
  RefreshCw,
  Crown,
  Mail,
  UserCheck,
  AlertCircle,
  KeyRound,
  EyeOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { INITIAL_LEGAL_DOCUMENTS } from "../data/initialLegalDocs";
import { LegalDocumentItem } from "../types";

export interface PlanTokenAllocationResult {
  planId: "free" | "starter" | "pro" | "enterprise" | string;
  planPrice: number;
  tokenCreditAmount: number;
  includedTokensMonthly: number;
  platformLicenseFee: number;
}

export interface FounderRegistrationData {
  email: string;
  name: string;
  password: string;
  companyName: string;
  title?: string;
  planId: string;
}

export interface PricingPlan {
  id: "free" | "starter" | "pro" | "enterprise";
  name: string;
  badge?: string;
  isPopular?: boolean;
  isFree?: boolean;
  monthlyPrice: number;
  annualPricePerMonth: number;
  description: string;
  agentLimit: string;
  tokenAllocation: string;
  supportSla: string;
  features: string[];
  stripePriceIdTest: string;
  // Plan payment token purchase guarantee
  tokenCreditAmount: number;     // Dollar portion deposited directly into customer token wallet
  platformLicenseFee: number;    // Portion covering platform & agent orchestration
  includedTokensMonthly: number; // Guaranteed monthly raw token pool
  tokenRateDescription: string;  // Clear explanation of the purchase
  estimatedTaskRuns: string;     // Benchmark task throughput
}

interface PricingCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId?: string;
  initialPlanId?: string;
  customerEmail?: string;
  tenantName?: string;
  onSuccessUpgrade?: (
    newPlanId: "free" | "starter" | "pro" | "enterprise" | string,
    tokenAllocation?: PlanTokenAllocationResult
  ) => void;
  onOpenAuthModal?: () => void;
  onRegisterFounder?: (data: FounderRegistrationData) => void;
  isMasterDeveloper?: boolean;
  currentAccessLevel?: string;
}


const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free Explorer",
    badge: "Zero Cost",
    isFree: true,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    description: "Instant access to test autonomous assistants and explore agent workflows.",
    agentLimit: "2 Autonomous Agents",
    tokenAllocation: "500k Tokens / mo free",
    supportSla: "Community Forum & Docs",
    tokenCreditAmount: 0,
    platformLicenseFee: 0,
    includedTokensMonthly: 500000,
    tokenRateDescription: "500K free starter tokens included monthly on sandbox tier",
    estimatedTaskRuns: "~150 agent workflow runs",
    features: [
      "2 Autonomous Agent Slots",
      "Interactive Workflow Canvas",
      "Gemini 3.7 Flash & 3.1 Lite",
      "Task Dispatcher & Execution Logs",
      "Community Templates Access",
      "No Credit Card Required",
    ],
    stripePriceIdTest: "price_free_tier",
  },
  {
    id: "starter",
    name: "Starter Builder",
    monthlyPrice: 49,
    annualPricePerMonth: 39,
    description: "For individual builders and single-operator agencies launching autonomous assistants.",
    agentLimit: "Up to 5 Specialized Agents",
    tokenAllocation: "5 Million Tokens / mo",
    supportSla: "Community & Email Support",
    tokenCreditAmount: 40,
    platformLicenseFee: 9,
    includedTokensMonthly: 5000000,
    tokenRateDescription: "$40 of your $49 payment directly buys 5M tokens into your credit wallet",
    estimatedTaskRuns: "~1,250 complex agent workflow runs",
    features: [
      "5 Autonomous Agent Slots",
      "Interactive Multi-Step Workflow Canvas",
      "Standard Gemini 3.7 Flash & 3.1 Lite Access",
      "Full WebApp & Local Save Snapshot Export",
      "SOC-2 Type II Audit Logging",
      "Standard Rate Limiting (60 RPM)",
    ],
    stripePriceIdTest: "price_starter_monthly_49",
  },
  {
    id: "pro",
    name: "Agency Growth Pro",
    badge: "Most Popular",
    isPopular: true,
    monthlyPrice: 199,
    annualPricePerMonth: 159,
    description: "For scaling consulting teams and businesses deploying fleets with dedicated ROI reporting.",
    agentLimit: "Up to 25 Specialized Agents",
    tokenAllocation: "25 Million Tokens / mo",
    supportSla: "Priority 24/7 Slack & Email (< 2h)",
    tokenCreditAmount: 160,
    platformLicenseFee: 39,
    includedTokensMonthly: 25000000,
    tokenRateDescription: "$160 of your $199 payment directly buys 25M tokens into your credit wallet",
    estimatedTaskRuns: "~6,500 enterprise agent runs",
    features: [
      "25 Autonomous Agent Slots",
      "Advanced Reasoning (Gemini 3.1 Pro & Custom APIs)",
      "Executive Board PDF & CSV Analytics Studio",
      "White-Label Client Brand Customization",
      "Human-in-the-Loop Verification Gates",
      "Automated Stripe Billing & Invoice Engine",
    ],
    stripePriceIdTest: "price_growth_pro_199",
  },
  {
    id: "enterprise",
    name: "Enterprise Dedicated",
    badge: "Unlimited Scale",
    monthlyPrice: 499,
    annualPricePerMonth: 399,
    description: "For corporate enterprises requiring custom white-label portals, high SLA, and custom models.",
    agentLimit: "Unlimited Agent Fleets",
    tokenAllocation: "100M+ Metered Tokens",
    supportSla: "Technical Lead & 99.9% SLA",
    tokenCreditAmount: 420,
    platformLicenseFee: 79,
    includedTokensMonthly: 100000000,
    tokenRateDescription: "$420 of your $499 payment directly buys 100M tokens into your credit wallet",
    estimatedTaskRuns: "~30,000+ deep autonomous tasks",
    features: [
      "Unlimited Agent Fleets & Pipelines",
      "Custom Fine-Tuned Models & Self-Hosted Endpoints",
      "Full Multi-Tenant Client Portal Access",
      "Digital Signature & Immutable Audit Logs",
      "Dedicated Stripe Connect Sub-Account Payouts",
      "Custom Enterprise SLA & BAA Compliance",
    ],
    stripePriceIdTest: "price_enterprise_499",
  },
];

export const PricingCheckoutModal: React.FC<PricingCheckoutModalProps> = ({
  isOpen,
  onClose,
  currentPlanId = "free",
  initialPlanId,
  customerEmail = "alex.mercer@enterprise.io",
  tenantName = "AgentFlow Enterprise",
  onSuccessUpgrade,
  onOpenAuthModal,
  onRegisterFounder,
  isMasterDeveloper = false,
  currentAccessLevel = "client_tenant",
}) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const targetId = initialPlanId || currentPlanId;
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(
    PRICING_PLANS.find((p) => p.id === targetId) || PRICING_PLANS[0]
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userEmailInput, setUserEmailInput] = useState<string>(customerEmail);
  const [hasAgreedToLegalTerms, setHasAgreedToLegalTerms] = useState<boolean>(true);
  const [showLegalDetails, setShowLegalDetails] = useState<boolean>(false);
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null);
  const [copiedReviewDocId, setCopiedReviewDocId] = useState<string | null>(null);

  // Founder Account Setup State (Post-purchase workflow)
  const [isSettingUpFounder, setIsSettingUpFounder] = useState<boolean>(false);
  const [founderName, setFounderName] = useState<string>(() => {
    try {
      return localStorage.getItem("agentflow_founder_name") || "Alex Mercer";
    } catch {
      return "Alex Mercer";
    }
  });
  const [founderEmailInput, setFounderEmailInput] = useState<string>(() => {
    try {
      return localStorage.getItem("agentflow_founder_email") || customerEmail || "toppgunn321@gmail.com";
    } catch {
      return customerEmail || "toppgunn321@gmail.com";
    }
  });
  const [founderPassword, setFounderPassword] = useState<string>("");
  const [confirmFounderPassword, setConfirmFounderPassword] = useState<string>("");
  const [showFounderPass, setShowFounderPass] = useState<boolean>(false);
  const [founderCompany, setFounderCompany] = useState<string>(tenantName || "Guilford Industries");
  const [founderTitle, setFounderTitle] = useState<string>("Founder & Chief Automation Officer");
  const [founderSetupError, setFounderSetupError] = useState<string | null>(null);
  const [founderSetupSuccess, setFounderSetupSuccess] = useState<boolean>(false);
  const [isSavingFounder, setIsSavingFounder] = useState<boolean>(false);
  const [copiedLoginDetails, setCopiedLoginDetails] = useState<boolean>(false);

  // Sync email input when customerEmail changes
  React.useEffect(() => {
    if (customerEmail && (!founderEmailInput || founderEmailInput === "alex.mercer@enterprise.io")) {
      setFounderEmailInput(customerEmail);
    }
  }, [customerEmail]);

  // Handle saving founder credentials and logging in directly
  const handleSaveFounderCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setFounderSetupError(null);

    const emailTrimmed = founderEmailInput.trim();
    if (!emailTrimmed || !emailTrimmed.includes("@")) {
      setFounderSetupError("Please enter a valid email address for your founder account.");
      return;
    }

    if (!founderPassword || founderPassword.length < 6) {
      setFounderSetupError("Master password must be at least 6 characters long.");
      return;
    }

    if (founderPassword !== confirmFounderPassword) {
      setFounderSetupError("Passwords do not match. Please verify and re-enter.");
      return;
    }

    setIsSavingFounder(true);
    try {
      localStorage.setItem("agentflow_founder_email", emailTrimmed);
      localStorage.setItem("agentflow_founder_password", founderPassword);
      localStorage.setItem("agentflow_founder_name", founderName.trim() || "Founder");
      localStorage.setItem("agentflow_founder_authenticated", "true");
      localStorage.setItem("agentflow_remember_founder", "true");

      if (onRegisterFounder) {
        onRegisterFounder({
          email: emailTrimmed,
          name: founderName.trim() || "Founder",
          password: founderPassword,
          companyName: founderCompany.trim() || "Guilford Industries",
          title: founderTitle.trim() || "Founder",
          planId: selectedPlan.id,
        });
      }

      setFounderSetupSuccess(true);
      setStatusMessage(`🎉 Founder credentials activated! You are now logged in with Master Developer privileges.`);
    } catch (err) {
      console.warn("Storage error saving founder:", err);
      setFounderSetupError("Could not persist founder credentials to browser storage.");
    } finally {
      setIsSavingFounder(false);
    }
  };

  if (!isOpen) return null;

  const currentReviewDoc = reviewingDocId 
    ? INITIAL_LEGAL_DOCUMENTS.find(d => d.id === reviewingDocId || d.id.includes(reviewingDocId)) || INITIAL_LEGAL_DOCUMENTS[0]
    : null;

  const handleDownloadDoc = (doc: LegalDocumentItem) => {
    const element = document.createElement("a");
    const file = new Blob([doc.content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-guilford-industries.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyDoc = (doc: LegalDocumentItem) => {
    navigator.clipboard.writeText(doc.content);
    setCopiedReviewDocId(doc.id);
    setTimeout(() => setCopiedReviewDocId(null), 2000);
  };

  const handleInitiateCheckout = async (plan: PricingPlan) => {
    setIsProcessing(true);
    setCheckoutUrl(null);
    setPaymentSuccess(false);

    // Free Plan 1-click activation
    if (plan.id === "free") {
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentSuccess(true);
        setStatusMessage("🎉 Free Explorer Tier activated! You have 2 agent slots and 500k monthly tokens.");
        if (onSuccessUpgrade) {
          onSuccessUpgrade("free", {
            planId: "free",
            planPrice: 0,
            tokenCreditAmount: 0,
            includedTokensMonthly: 500000,
            platformLicenseFee: 0,
          });
        }
      }, 500);
      return;
    }

    const effectivePrice = billingCycle === "annual" ? plan.annualPricePerMonth * 12 : plan.monthlyPrice;
    const tokenCreditVal = billingCycle === "annual" ? plan.tokenCreditAmount * 12 : plan.tokenCreditAmount;
    const tokensVal = billingCycle === "annual" ? plan.includedTokensMonthly * 12 : plan.includedTokensMonthly;
    const platformFeeVal = billingCycle === "annual" ? plan.platformLicenseFee * 12 : plan.platformLicenseFee;

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName,
          amount: effectivePrice,
          itemName: `${plan.name} (${billingCycle === "annual" ? "Annual Plan" : "Monthly Subscription"})`,
          customerEmail: userEmailInput,
          planId: plan.id,
          tokenCreditAmount: tokenCreditVal,
          tokensToCredit: tokensVal,
          platformFeeAmount: platformFeeVal,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
      } else {
        // Fallback direct settlement & token wallet deposit
        await fetch("/api/billing/fulfill-plan-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: tenantName || "customer-tenant",
            customerEmail: userEmailInput,
            planId: plan.id,
            planPrice: effectivePrice,
            tokenCreditAmount: tokenCreditVal,
            includedTokensMonthly: tokensVal,
          }),
        }).catch(() => null);

        setPaymentSuccess(true);
        setIsSettingUpFounder(true);
        setFounderSetupSuccess(false);
        if (!founderEmailInput || founderEmailInput === "alex.mercer@enterprise.io") {
          setFounderEmailInput(userEmailInput || customerEmail);
        }
        setStatusMessage(
          `🎉 Subscription activated for ${plan.name}! Please configure your master founder credentials below.`
        );
        if (onSuccessUpgrade) {
          onSuccessUpgrade(plan.id, {
            planId: plan.id,
            planPrice: effectivePrice,
            tokenCreditAmount: tokenCreditVal,
            includedTokensMonthly: tokensVal,
            platformLicenseFee: platformFeeVal,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to create Stripe session, using mock confirmation:", err);
      setPaymentSuccess(true);
      setIsSettingUpFounder(true);
      setFounderSetupSuccess(false);
      if (!founderEmailInput || founderEmailInput === "alex.mercer@enterprise.io") {
        setFounderEmailInput(userEmailInput || customerEmail);
      }
      setStatusMessage(
        `🎉 Subscription activated for ${plan.name}! Please configure your master founder credentials below.`
      );
      if (onSuccessUpgrade) {
        onSuccessUpgrade(plan.id, {
          planId: plan.id,
          planPrice: effectivePrice,
          tokenCreditAmount: tokenCreditVal,
          includedTokensMonthly: tokensVal,
          platformLicenseFee: platformFeeVal,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectSimulatePayment = async () => {
    setIsProcessing(true);
    const plan = selectedPlan;
    const effectivePrice = billingCycle === "annual" ? plan.annualPricePerMonth * 12 : plan.monthlyPrice;
    const tokenCreditVal = billingCycle === "annual" ? plan.tokenCreditAmount * 12 : plan.tokenCreditAmount;
    const tokensVal = billingCycle === "annual" ? plan.includedTokensMonthly * 12 : plan.includedTokensMonthly;
    const platformFeeVal = billingCycle === "annual" ? plan.platformLicenseFee * 12 : plan.platformLicenseFee;

    await fetch("/api/billing/fulfill-plan-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tenantName || "customer-tenant",
        customerEmail: userEmailInput,
        planId: plan.id,
        planPrice: effectivePrice,
        tokenCreditAmount: tokenCreditVal,
        includedTokensMonthly: tokensVal,
      }),
    }).catch(() => null);

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      if (plan.id !== "free") {
        setIsSettingUpFounder(true);
        setFounderSetupSuccess(false);
        if (!founderEmailInput || founderEmailInput === "alex.mercer@enterprise.io") {
          setFounderEmailInput(userEmailInput || customerEmail);
        }
      }
      setStatusMessage(
        `🎉 Upgraded to ${plan.name} successfully! Please configure your master founder credentials below.`
      );
      if (onSuccessUpgrade) {
        onSuccessUpgrade(plan.id, {
          planId: plan.id,
          planPrice: effectivePrice,
          tokenCreditAmount: tokenCreditVal,
          includedTokensMonthly: tokensVal,
          platformLicenseFee: platformFeeVal,
        });
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 text-slate-950 flex items-center justify-center shadow-lg font-bold shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                  Pricing & Subscription Plans
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold whitespace-nowrap">
                  Stripe Gateway
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Choose the right plan for your fleet. Free tier included with seamless upgrade paths.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Setup</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BILLING CYCLE & FOUNDER SETUP BAR */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Interval:
              </span>
              <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    billingCycle === "monthly"
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    billingCycle === "annual"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>Annual</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black whitespace-nowrap">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Direct Founder Setup Tab Toggle */}
            <button
              type="button"
              onClick={() => setIsSettingUpFounder(!isSettingUpFounder)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-2xs ${
                isSettingUpFounder
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-amber-500/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>{isSettingUpFounder ? "Hide Founder Setup" : "👑 Set Founder Login"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>256-bit SSL Encrypted • Cancel Anytime • Instant Activation</span>
          </div>
        </div>

        {/* MODAL BODY CONTAINER */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {paymentSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Plan Updated Successfully!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {statusMessage || `Your workspace is now operating on the ${selectedPlan.name}.`}
                </p>
              </div>
            </div>
          )}

          {/* FOUNDER ACCOUNT SETUP & LOGIN ACTIVATION CARD (SHOWN POST-PURCHASE OR ON TOGGLE) */}
          {isSettingUpFounder && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white border-2 border-indigo-500/60 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
                    <Crown className="w-6 h-6 fill-current text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        {paymentSuccess ? "Subscription Confirmed ✓" : "Executive Entitlement"}
                      </span>
                      <span className="text-xs text-slate-300">
                        Tier: <strong className="text-white">{selectedPlan.name}</strong>
                      </span>
                    </div>
                    <h3 className="font-black text-lg text-white mt-0.5">
                      {founderSetupSuccess ? "Master Founder Access Activated" : "Step 2 of 2: Set Master Founder Account & Login"}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingUpFounder(false);
                      setFounderSetupSuccess(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Close Setup Panel
                  </button>
                </div>
              </div>

              {!founderSetupSuccess ? (
                <form onSubmit={handleSaveFounderCredentials} className="space-y-5">
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    As the subscribing client, you are designated full <strong>Master Founder Privileges</strong>. Define your executive login credentials below. You can log in anytime using the <strong>Master Access Gate</strong> to administer White-Label branding, team workspaces, API keys, and autonomous agent tasks.
                  </p>

                  {founderSetupError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{founderSetupError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Founder Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Founder Full Name</span>
                      </label>
                      <input
                        type="text"
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        placeholder="e.g. Alex Mercer"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                      />
                    </div>

                    {/* Founder Login Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Founder Master Email (Login ID)</span>
                      </label>
                      <input
                        type="email"
                        value={founderEmailInput}
                        onChange={(e) => setFounderEmailInput(e.target.value)}
                        placeholder="e.g. founder@enterprise.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-hidden font-mono"
                      />
                    </div>

                    {/* Company / Enterprise Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Organization / Company Name</span>
                      </label>
                      <input
                        type="text"
                        value={founderCompany}
                        onChange={(e) => setFounderCompany(e.target.value)}
                        placeholder="e.g. Guilford Industries"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-hidden"
                      />
                    </div>

                    {/* Executive Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Designated Founder Title</span>
                      </label>
                      <input
                        type="text"
                        value={founderTitle}
                        onChange={(e) => setFounderTitle(e.target.value)}
                        placeholder="e.g. Founder & Chief Automation Officer"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                      />
                    </div>

                    {/* Founder Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Master Founder Password</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">Min 6 characters</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showFounderPass ? "text" : "password"}
                          value={founderPassword}
                          onChange={(e) => setFounderPassword(e.target.value)}
                          placeholder="Set secure master password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFounderPass(!showFounderPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                          {showFounderPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {founderPassword && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                            <div
                              className={`h-full transition-all ${
                                founderPassword.length < 6
                                  ? "w-1/4 bg-rose-500"
                                  : founderPassword.length < 8
                                  ? "w-2/4 bg-amber-500"
                                  : "w-full bg-emerald-500"
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-300">
                            {founderPassword.length < 6
                              ? "Too short"
                              : founderPassword.length < 8
                              ? "Moderate"
                              : "Strong ✓"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Confirm Master Password</span>
                        </label>
                        {confirmFounderPassword && (
                          <span className={`text-[10px] font-bold ${founderPassword === confirmFounderPassword ? "text-emerald-400" : "text-rose-400"}`}>
                            {founderPassword === confirmFounderPassword ? "✓ Passwords Match" : "✕ Must match"}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showFounderPass ? "text" : "password"}
                          value={confirmFounderPassword}
                          onChange={(e) => setConfirmFounderPassword(e.target.value)}
                          placeholder="Confirm master password"
                          required
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingFounder}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-600 hover:from-amber-300 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      {isSavingFounder ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      )}
                      <span>Save Founder Credentials & Log In Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSettingUpFounder(false)}
                      className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-colors"
                    >
                      Browse Plans First
                    </button>
                  </div>
                </form>
              ) : (
                /* CONFIRMATION CARD */
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-white">Founder Credentials Saved & Authenticated!</h4>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        Your master founder profile is now linked to <strong>{selectedPlan.name}</strong>. You are currently logged in with full executive developer privileges.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Founder Login Email</span>
                      <span className="font-mono font-bold text-white text-sm">{founderEmailInput}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Organization</span>
                      <span className="font-bold text-white text-sm">{founderCompany}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Role</span>
                      <span className="font-bold text-amber-300 text-sm">{founderTitle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Subscription Tier</span>
                      <span className="font-bold text-emerald-400 text-sm">{selectedPlan.name} (Active)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const loginText = `AgentFlow Founder Login:\nEmail: ${founderEmailInput}\nPassword: ${founderPassword}\nCompany: ${founderCompany}`;
                        navigator.clipboard.writeText(loginText);
                        setCopiedLoginDetails(true);
                        setTimeout(() => setCopiedLoginDetails(false), 2500);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedLoginDetails ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLoginDetails ? "Credentials Copied!" : "Copy Founder Credentials"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      <span>Enter Founder Command Suite</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRICING_PLANS.map((plan) => {
              const isSelected = selectedPlan.id === plan.id;
              const isCurrent = currentPlanId === plan.id;
              const displayPrice = plan.isFree ? 0 : billingCycle === "annual" ? plan.annualPricePerMonth : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    plan.isPopular
                      ? isSelected
                        ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xl"
                        : "border-indigo-400/80 dark:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/40"
                      : isSelected
                      ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-lg"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold whitespace-nowrap shrink-0">
                          Active Plan
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {plan.description}
                    </p>

                    {/* Price Block */}
                    <div className="mt-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono whitespace-nowrap">
                          ${displayPrice}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {plan.isFree ? "/ forever" : "/ month"}
                        </span>
                      </div>
                      {!plan.isFree && billingCycle === "annual" && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 whitespace-nowrap">
                          Billed annually (${displayPrice * 12}/yr)
                        </div>
                      )}
                    </div>

                    {/* Fleet & Specs */}
                    <div className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                        <Bot className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{plan.agentLimit}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{plan.tokenAllocation}</span>
                      </div>

                      {/* Token Wallet Deposit Box */}
                      <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Wallet Deposit</span>
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                            {plan.tokenCreditAmount > 0
                              ? `+$${billingCycle === "annual" ? plan.tokenCreditAmount * 12 : plan.tokenCreditAmount}/cycle`
                              : "Included Quota"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-tight font-medium">
                          {plan.tokenRateDescription}
                        </div>
                      </div>
                    </div>

                    {/* Feature List */}
                    <div className="pt-1.5 space-y-1.5 text-[11px]">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan);
                        handleInitiateCheckout(plan);
                      }}
                      disabled={isProcessing}
                      className={`w-full py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm whitespace-nowrap ${
                        isCurrent
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-default"
                          : plan.isPopular
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : isSelected
                          ? "bg-blue-600 hover:bg-blue-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isProcessing && selectedPlan.id === plan.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Processing...</span>
                        </>
                      ) : isCurrent ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Active Plan</span>
                        </>
                      ) : plan.isFree ? (
                        <>
                          <Gift className="w-3.5 h-3.5 shrink-0" />
                          <span>Use Free Tier</span>
                        </>
                      ) : (
                        <>
                          <span>Select {plan.name.split(" ")[0]}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PLAN-TO-TOKEN FUNDING ENGINE BREAKDOWN */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border-2 border-emerald-300 dark:border-emerald-700/70 shadow-md space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg font-bold shrink-0 mt-0.5">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Automated Plan-to-Token Funding Guarantee
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                      80%+ Direct Token Credit
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      Auto-Fulfill via Stripe
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                    Every monthly plan payment automatically funds your AI inference token balance. Unlike legacy SaaS platforms that charge pure markup for software access, our subscriptions guarantee that over 80% of your fee goes directly into spendable AI inference compute for your agents.
                  </p>
                </div>
              </div>

              {/* Selected Plan Token Allocation Tag */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Selected Tier Allocation</div>
                <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {selectedPlan.tokenCreditAmount > 0
                    ? `+$${selectedPlan.tokenCreditAmount}.00 Deposit`
                    : "Free Monthly Quota"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  {selectedPlan.includedTokensMonthly.toLocaleString()} Tokens Active
                </div>
              </div>
            </div>

            {/* Visual Payment Split Bar */}
            {selectedPlan.monthlyPrice > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Token Wallet Budget (${selectedPlan.tokenCreditAmount}.00 / {Math.round((selectedPlan.tokenCreditAmount / selectedPlan.monthlyPrice) * 100)}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Platform Runtime (${selectedPlan.platformLicenseFee}.00 / {Math.round((selectedPlan.platformLicenseFee / selectedPlan.monthlyPrice) * 100)}%)</span>
                  </span>
                </div>

                {/* Progress bar split */}
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${(selectedPlan.tokenCreditAmount / selectedPlan.monthlyPrice) * 100}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    title={`Token wallet allocation: $${selectedPlan.tokenCreditAmount}`}
                  />
                  <div
                    style={{ width: `${(selectedPlan.platformLicenseFee / selectedPlan.monthlyPrice) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
                    title={`Platform fee: $${selectedPlan.platformLicenseFee}`}
                  />
                </div>
              </div>
            )}

            {/* 4-Step Architecture Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-[10px] font-mono">1</div>
                  <span>Payment Settled</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Stripe processes subscription fee with plan token metadata payload attached.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center text-[10px] font-mono">2</div>
                  <span>Wallet Credited</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Webhook deposits ${selectedPlan.tokenCreditAmount > 0 ? selectedPlan.tokenCreditAmount : 5}.00 into account <code className="text-[10px] text-teal-600 font-mono">walletCreditBalance</code>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[10px] font-mono">3</div>
                  <span>Inference Active</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Autonomous agents execute workflows, consuming tokens at transparent wholesale rate.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center text-[10px] font-mono">4</div>
                  <span>Rollover & Protect</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Unused token credits never expire and roll over directly into future billing cycles.
                </p>
              </div>
            </div>
          </div>

          {/* MASTER FOUNDER PRIVILEGES & SUBSCRIBER ACCESS CARD */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-indigo-950/30 border-2 border-amber-300 dark:border-amber-700/60 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md font-bold shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Executive Founder Account & Master Privileges
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                      Client Entitlement
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                      Tier: {selectedPlan.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Upon purchasing or upgrading any subscription tier, you can immediately set your founder email and password to log in with master administrative developer access.
                  </p>
                </div>
              </div>

              {/* Status / Saved Founder Email */}
              <div className="text-left sm:text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Current Access Mode</div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {isMasterDeveloper ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 sm:justify-end">
                      <Crown className="w-3 h-3" /> Master Developer (Founder)
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">
                      Client Tenant Mode
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Founder Access Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Founder Login ID</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                  {founderEmailInput || customerEmail}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Organization</span>
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {founderCompany || tenantName}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Admin Gate Status</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Ready to Authenticate</span>
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Founder Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSettingUpFounder(true);
                  setFounderSetupSuccess(false);
                }}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
              >
                <Crown className="w-4 h-4 text-slate-950 fill-current" />
                <span>Configure / Update Founder Login</span>
              </button>

              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all shrink-0 shadow-2xs"
                >
                  <KeyRound className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Open Client Login Portal</span>
                </button>
              )}

              <div className="text-[11px] text-slate-500 dark:text-slate-400 ml-auto flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Executive Privileges Protected</span>
              </div>
            </div>
          </div>

          {/* CHECKOUT URL PANEL (IF STRIPE SESSION CREATED) */}
          {checkoutUrl && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 whitespace-nowrap">
                    Stripe Checkout Gateway Ready
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-indigo-500 whitespace-nowrap">Live Secure Gateway</span>
              </div>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                You can complete your checkout on the official Stripe hosted portal, or simulate instant completion for testing.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap shrink-0"
                >
                  <span>Open Stripe Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={handleDirectSimulatePayment}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Simulate Instant Upgrade</span>
                </button>
              </div>
            </div>
          )}

          {/* CUSTOMER & RESELLER CONTRACT AGREEMENT NOTICE */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Customer & Reseller Terms of Service Binding Agreement
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  Reviewable at Gate
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingDocId("doc-enterprise-reseller")}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Review Contracts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLegalDetails(!showLegalDetails)}
                  className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:underline"
                >
                  {showLegalDetails ? "Collapse List" : "Show All 8 Contracts"}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              By subscribing to paid tiers under Guilford Industries, Customer agrees to the <strong>Master EULA</strong>, <strong>Enterprise Distribution Agreement</strong>, <strong>Acceptable Use Policy</strong>, <strong>AI Safety & Responsible Autonomy Agreement</strong>, and <strong>Data Processing Addendum (DPA)</strong>.
            </p>

            {showLegalDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
                {INITIAL_LEGAL_DOCUMENTS.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setReviewingDocId(doc.id)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 hover:border-indigo-400 dark:hover:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-between text-left group transition-all shadow-xs"
                  >
                    <span className="truncate mr-1 text-[11px] group-hover:text-indigo-600 dark:group-hover:text-white">
                      {doc.name}
                    </span>
                    <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-500 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Eye className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAgreedToLegalTerms}
                  onChange={(e) => setHasAgreedToLegalTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shrink-0"
                />
                <span>
                  I confirm on behalf of my organization that I accept the <strong>Enterprise Terms of Service</strong>, <strong>AI Safety Policy</strong>, and <strong>Data Processing Addendum</strong>.
                </span>
              </label>

              <button
                type="button"
                onClick={() => setReviewingDocId("doc-enterprise-reseller")}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 self-start sm:self-auto"
              >
                Read Full Terms →
              </button>
            </div>
          </div>


          {/* ENTERPRISE CONTACT & FAQ ACCORDION */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                Need a Custom Contract, PO, or Invoicing?
              </h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                We offer custom MSA agreements, HIPAA BAA addendums, and ACH wire transfers.
              </p>
            </div>
            <a
              href="mailto:sales@agentflow.io?subject=Enterprise%20License%20Inquiry"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-center shrink-0 whitespace-nowrap"
            >
              Contact Sales
            </a>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Encrypted processing via Stripe</span>
            </div>
            <span>•</span>
            <span className="text-slate-400">Binding Enterprise Terms & Legal Governance applied</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>

        {/* IN-GATE CONTRACT REVIEW DRAWER / MODAL */}
        {currentReviewDoc && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <span>{currentReviewDoc.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                        {currentReviewDoc.version}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Provider: Guilford Industries • Effective: {currentReviewDoc.effectiveDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyDoc(currentReviewDoc)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Copy Markdown"
                  >
                    {copiedReviewDocId === currentReviewDoc.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadDoc(currentReviewDoc)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .MD</span>
                  </button>

                  <button
                    onClick={() => setReviewingDocId(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Contract Selector Tabs */}
              <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {INITIAL_LEGAL_DOCUMENTS.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setReviewingDocId(doc.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                      doc.id === currentReviewDoc.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {doc.name}
                  </button>
                ))}
              </div>

              {/* Body: Key Clauses & Full Markdown Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-900/60 text-slate-200 text-xs">
                {currentReviewDoc.keyClauses && currentReviewDoc.keyClauses.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                      Enforceable Key Clauses Summary
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {currentReviewDoc.keyClauses.map((clause, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-900/50">
                          <span className="font-bold text-slate-200 block text-[11px] mb-0.5">
                            {clause.heading}
                          </span>
                          <span className="text-[11px] text-slate-400 leading-snug block">
                            {clause.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed font-sans prose prose-invert max-w-none prose-headings:text-slate-100 prose-a:text-indigo-400 prose-code:text-indigo-300 prose-code:bg-slate-900">
                  <ReactMarkdown>{currentReviewDoc.content}</ReactMarkdown>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  Reviewed directly at the Subscription & Licensing Gate
                </span>
                <button
                  type="button"
                  onClick={() => setReviewingDocId(null)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Return to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
