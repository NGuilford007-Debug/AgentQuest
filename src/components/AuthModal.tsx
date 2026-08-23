import React, { useState } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  Zap,
  Bot,
  CreditCard,
  Eye,
  EyeOff,
  Check,
  Gift,
  Flame,
  Globe,
  Sliders,
  HelpCircle
} from "lucide-react";
import { EmployeeProfile, Department } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: EmployeeProfile;
  onAuthSuccess: (updatedProfile: Partial<EmployeeProfile>, chosenPlan?: "free" | "starter" | "pro" | "enterprise") => void;
  onOpenPricingPlans: () => void;
  initialMode?: "signup" | "signin";
  initialPlan?: "free" | "starter" | "pro" | "enterprise";
}

const DEPARTMENTS: Department[] = [
  "Engineering",
  "DevOps & SecOps",
  "Customer Support",
  "Sales & CRM",
  "Finance & Legal",
  "Marketing",
  "Product",
  "Operations"
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onAuthSuccess,
  onOpenPricingPlans,
  initialMode = "signup",
  initialPlan = "free"
}) => {
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [selectedTier, setSelectedTier] = useState<"free" | "starter" | "pro" | "enterprise">(initialPlan);
  const [fullName, setFullName] = useState<string>(userProfile.name || "Alex Mercer");
  const [email, setEmail] = useState<string>(userProfile.email || "alex.mercer@enterprise.io");
  const [password, setPassword] = useState<string>("••••••••••••");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>(userProfile.organizationName || "AgentFlow Enterprise");
  const [department, setDepartment] = useState<Department>(userProfile.department || "DevOps & SecOps");
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (mode === "signup" && (!fullName || fullName.trim().length < 2)) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (mode === "signup" && !agreeTerms) {
      setErrorMessage("Please accept the terms of service to proceed.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const isFree = selectedTier === "free";
      
      const updatedData: Partial<EmployeeProfile> = {
        name: fullName.trim() || userProfile.name,
        email: email.trim(),
        organizationName: companyName.trim() || "AgentFlow Enterprise",
        department: department,
        subscriptionPlan: selectedTier,
        isAuthenticated: true,
        creditsBalance: isFree ? (userProfile.creditsBalance || 2500) : 25000,
        creditsTotal: isFree ? (userProfile.creditsTotal || 5000) : 50000,
      };

      onAuthSuccess(updatedData, selectedTier);
      setSuccessMessage(
        mode === "signup"
          ? isFree 
            ? "🎉 Welcome! Your Free Explorer account is ready." 
            : `🎉 Account created! Connecting you to ${selectedTier.toUpperCase()} plan.`
          : "👋 Welcome back! Authenticated successfully."
      );

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (!isFree) {
          onOpenPricingPlans();
        }
      }, 1200);
    }, 700);
  };

  const handleSocialAuth = (provider: "Google" | "GitHub" | "SSO") => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const updatedData: Partial<EmployeeProfile> = {
        name: provider === "Google" ? "Alex Mercer" : "Dev Lead",
        email: provider === "Google" ? "alex.mercer@gmail.com" : "dev@github-sso.io",
        organizationName: companyName || "AgentFlow Enterprise",
        subscriptionPlan: selectedTier,
        isAuthenticated: true,
      };
      onAuthSuccess(updatedData, selectedTier);
      setSuccessMessage(`✅ Signed in with ${provider} successfully!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (selectedTier !== "free") {
          onOpenPricingPlans();
        }
      }, 1000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden my-auto animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white relative border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg font-bold">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {mode === "signup" ? "Get Started with AgentFlow" : "Sign In to Your Workspace"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 whitespace-nowrap">
                    Free Access Tier Included
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {mode === "signup"
                    ? "Create your account with zero commitment. Instant access to autonomous agents."
                    : "Access your autonomous AI agents, saved workflows, and metrics."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                mode === "signup"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Create Free Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                mode === "signin"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Sign In Existing
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 text-xs max-h-[72vh] overflow-y-auto">
          
          {/* Quick SSO Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSocialAuth("Google")}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold text-slate-750 dark:text-slate-200 flex items-center justify-center gap-2 shadow-2xs transition-all whitespace-nowrap shrink-0"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth("GitHub")}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold text-slate-750 dark:text-slate-200 flex items-center justify-center gap-2 shadow-2xs transition-all whitespace-nowrap shrink-0"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub / SSO</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="shrink-0 mx-3 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Or continue with email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>
          </div>

          {/* TIER SELECTION CARDS (FOR SIGN UP) */}
          {mode === "signup" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-white text-xs block">
                  Select Starting Tier:
                </label>
                <button
                  type="button"
                  onClick={onOpenPricingPlans}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Compare All Plans</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                {/* FREE EXPLORER TIER */}
                <button
                  type="button"
                  onClick={() => setSelectedTier("free")}
                  className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all ${
                    selectedTier === "free"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" />
                        <span>Free Explorer</span>
                      </span>
                      {selectedTier === "free" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                      $0 <span className="text-[10px] font-normal text-slate-500">/ forever</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      2 Autonomous Agents, 500k free monthly tokens, essential tools.
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>No credit card needed</span>
                  </div>
                </button>

                {/* STARTER TIER */}
                <button
                  type="button"
                  onClick={() => setSelectedTier("starter")}
                  className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all ${
                    selectedTier === "starter"
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Starter Plan</span>
                      </span>
                      {selectedTier === "starter" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                      $49 <span className="text-[10px] font-normal text-slate-500">/ month</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      5 Agent Slots, 5M Tokens, Workflow Canvas & audit logs.
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    <span>Stripe Checkout</span>
                  </div>
                </button>

                {/* PRO GROWTH TIER */}
                <button
                  type="button"
                  onClick={() => setSelectedTier("pro")}
                  className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                    selectedTier === "pro"
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300"
                  }`}
                >
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-bl-lg uppercase">
                    Popular
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>Agency Pro</span>
                      </span>
                      {selectedTier === "pro" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                      $199 <span className="text-[10px] font-normal text-slate-500">/ month</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                      25 Agent Slots, 25M Tokens, PDF/CSV Reports & White-Label.
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Full Scale Fleet</span>
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* AUTH FORM */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {mode === "signup" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>Organization / Team</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Automation Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>Work / Personal Email</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Password</span>
                </span>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => alert("Password reset link sent to your registered email.")}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-slate-400" />
                  <span>Department Focus</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "signup" && (
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  I agree to the{" "}
                  <a 
                    href="https://drive.google.com/drive/folders/10dW5JZ1xdTZqWYOhqF3RDxBlJdJzIiVW" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service & Legalities
                  </a>{" "}
                  and 256-bit SOC-2 compliant autonomous agent governance rules.
                </span>
              </label>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-98 transition-all whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "signup"
                        ? selectedTier === "free"
                          ? "Activate Free Explorer Workspace"
                          : `Continue to ${selectedTier.toUpperCase()} Subscription`
                        : "Sign In to Workspace"}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>256-bit SSL • SOC-2 Type II Certified</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
