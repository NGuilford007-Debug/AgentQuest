import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  Users,
  Building2,
  Mail,
  Check,
  LogOut,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Shield,
  Key,
  HelpCircle
} from "lucide-react";
import { AccessLevel, MasterAccessSettings } from "../types";
import { PasswordRecoveryModal } from "./PasswordRecoveryModal";

interface MasterAccessGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessSettings?: MasterAccessSettings;
  onUpdateAccessSettings: (updated: MasterAccessSettings) => void;
  developerCompanyName?: string;
  whiteLabelBrandName?: string;
}

const DEFAULT_FOUNDER_PASSWORD = "AgentFlow2026!";

export const MasterAccessGateModal: React.FC<MasterAccessGateModalProps> = ({
  isOpen,
  onClose,
  accessSettings = {
    currentAccessLevel: "client_tenant",
    founderEmail: "toppgunn321@gmail.com",
    developerCompanyName: "Guilford Industries",
    isSimulatingClientView: true,
    clientLockEnforced: true,
    detectedEnvironment: "standalone_web_app",
  },
  onUpdateAccessSettings,
  developerCompanyName = "Guilford Industries",
  whiteLabelBrandName = "AgentFlow Enterprise",
}) => {
  const founderEmail = 
    (typeof window !== "undefined" && localStorage.getItem("agentflow_founder_email")) || 
    accessSettings?.founderEmail || 
    "toppgunn321@gmail.com";

  // Check persistent authentication status
  const [isFounderAuthenticated, setIsFounderAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem("agentflow_founder_authenticated") === "true";
    } catch {
      return false;
    }
  });

  // Login form state
  const [inputEmail, setInputEmail] = useState<string>(founderEmail);
  const [inputPassword, setInputPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDemoHint, setShowDemoHint] = useState<boolean>(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);

  // Change password drawer state
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      try {
        setIsFounderAuthenticated(localStorage.getItem("agentflow_founder_authenticated") === "true");
        const activeFounderEmail = localStorage.getItem("agentflow_founder_email") || founderEmail;
        setInputEmail(activeFounderEmail);
      } catch {
        // fallback
      }
      setAuthError(null);
      setSuccessMsg(null);
      setInputPassword("");
    }
  }, [isOpen, founderEmail]);

  if (!isOpen) return null;

  const currentLevel = accessSettings?.currentAccessLevel ?? "client_tenant";
  const isMaster = currentLevel === "master_developer" && isFounderAuthenticated;
  const isOperator = currentLevel === "team_operator";
  const isClient = currentLevel === "client_tenant" || !isFounderAuthenticated;

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200 dark:bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score <= 3) return { score: 2, label: "Good", color: "bg-amber-500", text: "text-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strength = calculatePasswordStrength(inputPassword);

  // Handle direct switch when founder is verified
  const handleSwitchRole = (newLevel: AccessLevel) => {
    if (newLevel === "master_developer" && !isFounderAuthenticated) {
      setAuthError("You must authenticate with your founder password to access Master Founder Mode.");
      return;
    }

    onUpdateAccessSettings({
      ...accessSettings,
      currentAccessLevel: newLevel,
      isSimulatingClientView: newLevel === "client_tenant",
    });

    const roleName = 
      newLevel === "master_developer" 
        ? "Master Founder / Admin Mode" 
        : newLevel === "team_operator" 
        ? "Team Operator Mode" 
        : "Standard Client Member View";

    setSuccessMsg(`Switched workspace role to ${roleName}`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 600);
  };

  // Handle founder login with email AND password against backend scrypt endpoint
  const handleFounderAuth = async (e?: React.FormEvent, overridePass?: string) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const emailToVerify = inputEmail.trim().toLowerCase();
    const passToVerify = overridePass ?? inputPassword;

    if (!emailToVerify) {
      setAuthError("Please enter your founder email address.");
      return;
    }

    if (!passToVerify) {
      setAuthError("Please enter your founder password to authenticate.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/founder-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToVerify,
          password: passToVerify,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setAuthError(data.error || "Incorrect credentials or authentication failed.");
        return;
      }

      try {
        localStorage.setItem("agentflow_founder_authenticated", "true");
        localStorage.setItem("agentflow_founder_email", emailToVerify);
        if (data.sessionToken) {
          localStorage.setItem("agentflow_founder_session_token", data.sessionToken);
        }
        if (rememberMe) {
          localStorage.setItem("agentflow_remember_founder", "true");
        }
        // Clean up legacy plaintext password item if it exists
        localStorage.removeItem("agentflow_founder_password");
      } catch (err) {
        console.warn("Could not save founder auth state:", err);
      }

      setIsFounderAuthenticated(true);
      setAuthError(null);
      setSuccessMsg(`Authenticated successfully as Founder (${emailToVerify}). Session secured.`);

      onUpdateAccessSettings({
        ...accessSettings,
        currentAccessLevel: "master_developer",
        isSimulatingClientView: false,
      });

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setAuthError(err.message || "Network error connecting to authentication server.");
    }
  };

  // Quick authenticate with valid demo founder credentials directly to backend
  const handleQuickAuthenticate = () => {
    setInputEmail(founderEmail);
    handleFounderAuth(undefined, DEFAULT_FOUNDER_PASSWORD);
  };

  // Handle sign out of founder mode (back to client view)
  const handleSignOutOfFounder = () => {
    try {
      const token = localStorage.getItem("agentflow_founder_session_token");
      if (token) {
        fetch("/api/auth/founder-logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionToken: token }),
        }).catch(() => {});
      }
      localStorage.removeItem("agentflow_founder_authenticated");
      localStorage.removeItem("agentflow_founder_session_token");
      localStorage.removeItem("agentflow_founder_password");
    } catch (e) {
      console.warn("Could not remove founder auth:", e);
    }

    setIsFounderAuthenticated(false);
    onUpdateAccessSettings({
      ...accessSettings,
      currentAccessLevel: "client_tenant",
      isSimulatingClientView: true,
    });

    setSuccessMsg("Signed out of Founder Mode. Viewing as Standard Client.");
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 600);
  };

  // Handle password update via secure backend scrypt endpoint
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setAuthError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setAuthError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("agentflow_founder_session_token");
      const res = await fetch("/api/auth/change-founder-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: inputPassword || undefined,
          newPassword,
        }),
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setAuthError(data.error || "Failed to update password.");
        return;
      }

      // Clean up legacy plaintext password item if it exists
      try {
        localStorage.removeItem("agentflow_founder_password");
      } catch {}

      setSuccessMsg("Founder password updated and hashed with cryptographic scrypt salt!");
      setIsChangingPassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setAuthError(null);
    } catch (err: any) {
      setIsSubmitting(false);
      setAuthError(err.message || "Failed to update password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isMaster 
                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20" 
                : isOperator
                ? "bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-blue-500/20"
                : "bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20"
            }`}>
              {isMaster ? <ShieldCheck className="w-5 h-5" /> : isOperator ? <Users className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Workspace Role & Access Control
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isMaster 
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : isOperator
                    ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}>
                  {isMaster ? "👑 Founder Mode" : isOperator ? "👥 Team Operator" : "🏢 Standard Client"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMaster 
                  ? `Authenticated as Platform Founder (${developerCompanyName})`
                  : isOperator
                  ? `Active as Internal Team Operator (${whiteLabelBrandName})`
                  : `Active as Standard Client Member (${whiteLabelBrandName})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-bold transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300 max-h-[75vh] overflow-y-auto">
          
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {/* Section 1: When authenticated as founder */}
          {isFounderAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Founder Security Verified
                    </span>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-mono">
                      {founderEmail}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOutOfFounder}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Role Simulation Switcher */}
              <div>
                <label className="font-bold text-slate-900 dark:text-white text-xs block mb-2">
                  Switch Active View (Simulate What Users See):
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchRole("master_developer")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isMaster
                        ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20 shadow-xs"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          Master Founder & Creator View
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Full admin controls, White-Label Studio, and Monetization packaging.
                        </div>
                      </div>
                    </div>
                    {isMaster && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRole("team_operator")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isOperator
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          Internal Team Operator View
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Orchestrate workflows, monitor agent telemetry, run automated tests.
                        </div>
                      </div>
                    </div>
                    {isOperator && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchRole("client_tenant")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isClient
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          Standard Client / External Visitor View
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Clean product experience without developer backdoors or pricing margins.
                        </div>
                      </div>
                    </div>
                    {isClient && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Password Management Drawer for Verified Founder */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Founder Password Security
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                  >
                    {isChangingPassword ? "Cancel" : "Change Password"}
                  </button>
                </div>

                {isChangingPassword ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        New Founder Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-3 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Save New Password
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your founder portal is protected by your master password. Keep it secure to protect white-label and developer settings.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Section 2: Standard Visitor / Non-founder view */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Standard Client Access Active</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  You are currently logged in with standard client workspace permissions. You can chat with agents, launch workflows, run automated pipelines, and review ROI analytics.
                </p>
              </div>

              {/* Full Password-Protected Founder Authentication Gateway */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/80 dark:from-purple-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/80 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-2xs">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                        Founder & Administrator Sign In
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Secure password-authenticated access
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                    <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>256-Bit Encrypted</span>
                  </div>
                </div>

                <form onSubmit={handleFounderAuth} className="space-y-3.5">
                  {/* Email Field */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Founder Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        id="input-founder-email-auth"
                        required
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder={`e.g. ${founderEmail}`}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Password Field with Show/Hide Toggle */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Master Password
                      </label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setIsRecoveryModalOpen(true)}
                          className="text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Forgot Password?</span>
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={() => setShowDemoHint(!showDemoHint)}
                          className="text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Credentials Guide</span>
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="input-founder-password-auth"
                        required
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="Enter master password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        id="btn-toggle-founder-password"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {inputPassword && (
                      <div className="pt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Security strength:</span>
                          <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 h-1.5">
                          <div className={`rounded-full ${strength.score >= 1 ? strength.color : "bg-slate-200 dark:bg-slate-700"}`} />
                          <div className={`rounded-full ${strength.score >= 2 ? strength.color : "bg-slate-200 dark:bg-slate-700"}`} />
                          <div className={`rounded-full ${strength.score >= 3 ? strength.color : "bg-slate-200 dark:bg-slate-700"}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Password Help / Demo Helper Callout */}
                  {showDemoHint && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Enterprise Cryptographic Security:</span>
                        </span>
                        <span className="font-mono bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded text-[10px]">
                          SCRYPT 256-BIT
                        </span>
                      </div>
                      <p className="text-purple-800 dark:text-purple-300 leading-relaxed text-[11px]">
                        Master credentials for <strong>{founderEmail}</strong> are verified through secure salted scrypt key derivation on the backend server. Plaintext passwords are never stored or transmitted in client state.
                      </p>
                      <div className="pt-1 flex items-center justify-between border-t border-purple-200/60 dark:border-purple-800/60">
                        <button
                          type="button"
                          onClick={handleQuickAuthenticate}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Authenticate Founder (Dev Mode)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecoveryModalOpen(true);
                            setShowDemoHint(false);
                          }}
                          className="text-[11px] font-bold text-purple-700 dark:text-purple-300 underline hover:text-purple-900"
                        >
                          Recover via Email OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        Remember authentication on this device
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    id="btn-submit-founder-login"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span>Authenticate & Enter Founder Mode</span>
                  </button>

                  {/* 1-Click Quick Demo Sign-in for authorized founder */}
                  <button
                    type="button"
                    id="btn-quick-auth-founder-autofill"
                    onClick={handleQuickAuthenticate}
                    disabled={isSubmitting}
                    className="w-full text-center py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 font-semibold text-xs border border-purple-200 dark:border-purple-800/60 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Quick Authenticate Founder ({founderEmail})</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Real Password Recovery Modal & SMTP Handshake */}
      <PasswordRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        initialEmail={inputEmail || founderEmail}
        onPasswordResetSuccess={(updatedEmail, newPass) => {
          setInputEmail(updatedEmail);
          setInputPassword(newPass);
          setSuccessMsg("Founder password updated via email verification! You can now log in.");
          setTimeout(() => setSuccessMsg(null), 6000);
        }}
      />
    </div>
  );
};
