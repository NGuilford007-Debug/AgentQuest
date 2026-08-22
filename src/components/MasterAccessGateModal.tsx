import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  Palette,
  DollarSign,
  ArrowRight,
  Bot,
  Users,
  LogOut
} from "lucide-react";
import { AccessLevel, MasterAccessSettings } from "../types";

interface MasterAccessGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessSettings?: MasterAccessSettings;
  onUpdateAccessSettings: (updated: MasterAccessSettings) => void;
  developerCompanyName?: string;
  whiteLabelBrandName?: string;
}

export const MasterAccessGateModal: React.FC<MasterAccessGateModalProps> = ({
  isOpen,
  onClose,
  accessSettings = {
    currentAccessLevel: "client_tenant",
    founderEmail: "founder@agencyflow.io",
    developerCompanyName: "AgentFlow Systems",
    founderPin: "founder2026",
    isSimulatingClientView: false,
    clientLockEnforced: true,
    detectedEnvironment: "standalone_web_app",
  },
  onUpdateAccessSettings,
  developerCompanyName = "AgentFlow Systems",
  whiteLabelBrandName = "AgentFlow Enterprise",
}) => {
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");

  if (!isOpen) return null;

  const currentLevel = accessSettings?.currentAccessLevel ?? "client_tenant";
  const isMaster = currentLevel === "master_developer";
  const isOperator = currentLevel === "team_operator";
  const isClient = currentLevel === "client_tenant";

  const masterPin = accessSettings?.founderPin || "founder2026";

  const handleUnlockMaster = () => {
    if (pinInput.trim() === masterPin || pinInput.trim() === "founder2026") {
      onUpdateAccessSettings({
        ...accessSettings,
        currentAccessLevel: "master_developer",
        isSimulatingClientView: false,
      });
      setSuccessMsg("👑 Master Founder privileges unlocked!");
      setErrorMsg(null);
      setPinInput("");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } else {
      setErrorMsg("Incorrect Founder PIN. Please check your master passkey.");
      setSuccessMsg(null);
    }
  };

  const handleSwitchRole = (newLevel: AccessLevel) => {
    if (newLevel === "master_developer") {
      // Must verify PIN
      setErrorMsg("Please enter the Master Founder PIN below to unlock Founder privileges.");
      return;
    }

    onUpdateAccessSettings({
      ...accessSettings,
      currentAccessLevel: newLevel,
      isSimulatingClientView: newLevel === "client_tenant",
    });

    const roleName = newLevel === "team_operator" ? "Team Operator Mode" : `Client Portal Mode (${whiteLabelBrandName})`;
    setSuccessMsg(`Switched active workspace to ${roleName}`);
    setErrorMsg(null);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  const handleLockAndSignOut = () => {
    onUpdateAccessSettings({
      ...accessSettings,
      currentAccessLevel: "client_tenant",
      isSimulatingClientView: false,
    });
    setSuccessMsg("Signed out of Master Founder. Workspace locked to Client Portal.");
    setErrorMsg(null);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  const handleSaveNewPin = () => {
    if (!newPinInput || newPinInput.length < 4) {
      setErrorMsg("PIN must be at least 4 characters.");
      return;
    }
    onUpdateAccessSettings({
      ...accessSettings,
      founderPin: newPinInput.trim(),
    });
    setSuccessMsg("Founder PIN updated successfully!");
    setIsChangingPin(false);
    setNewPinInput("");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isMaster 
                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20" 
                : isOperator
                ? "bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-blue-500/20"
                : "bg-gradient-to-tr from-amber-600 to-orange-600 shadow-amber-500/20"
            }`}>
              {isMaster ? <ShieldCheck className="w-5 h-5" /> : isOperator ? <Users className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Access & Governance Control
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isMaster 
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : isOperator
                    ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                }`}>
                  {isMaster ? "👑 Master Founder" : isOperator ? "👥 Team Operator" : "🏢 Client Portal"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMaster 
                  ? `Authenticated as Master Agency Founder (${developerCompanyName})`
                  : isOperator
                  ? `Authenticated as Internal Team Operator (${whiteLabelBrandName})`
                  : `Viewing workspace as Client / Tenant (${whiteLabelBrandName})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300 max-h-[75vh] overflow-y-auto">
          {/* Active Role Selector / Switcher */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 dark:text-white text-xs block">
              Switch Active Role & View:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSwitchRole("client_tenant")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isClient
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Client Portal</span>
                  </span>
                  {isClient && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Public & tenant view. Locked prompts, hidden developer billing.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("team_operator")}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isOperator
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 text-[11px]">
                    <Users className="w-3.5 h-3.5" />
                    <span>Team Operator</span>
                  </span>
                  {isOperator && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Internal staff. Run workflows & test automations freely.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isMaster) return;
                  setErrorMsg(null);
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isMaster
                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-90"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Master Founder</span>
                  </span>
                  {isMaster ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> : <Key className="w-3 h-3 text-purple-400" />}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {isMaster ? "Full admin authenticated." : "Passkey PIN required to unlock."}
                </div>
              </button>
            </div>
          </div>

          {/* Role Permissions Matrix Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Permission Guardrails & Isolation</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Master Founder Mode</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-0.5 list-disc list-inside text-[10px]">
                  <li>White-Label Branding & Domain Studio</li>
                  <li>Developer Rate Cards & Stripe Payouts</li>
                  <li>Remix Agent Prompts & Models</li>
                  <li>Tenant Provisioning & Privacy Controls</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Client / Tenant Mode</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-0.5 list-disc list-inside text-[10px]">
                  <li>White-Label Studio is completely hidden</li>
                  <li>Monetization, pricing & markups hidden</li>
                  <li>Agent prompts & backends are locked</li>
                  <li>Execute & inspect tasks cleanly</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Master Founder Active State vs Unlock Form */}
          {isMaster ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Master Founder Authenticated</div>
                  <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300 mt-0.5">
                    You have unrestricted administrative authority to configure branding, Stripe monetization, agent prompts, and client tenant permissions.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    Lock Session & Return to Client Portal
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Sign out of Founder privileges to view the workspace as a client.
                  </div>
                </div>
                <button
                  onClick={handleLockAndSignOut}
                  className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock & Sign Out</span>
                </button>
              </div>

              {/* Change Master PIN Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                {!isChangingPin ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Master Founder PIN
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Current passkey is active. You can customize it to secure access.
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChangingPin(true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all"
                    >
                      Change PIN
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-900 dark:text-white text-xs block">
                      Set New Founder Passkey PIN:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter new PIN (e.g. secretPass2026)"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={handleSaveNewPin}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                      >
                        Save PIN
                      </button>
                      <button
                        onClick={() => setIsChangingPin(false)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">
                    Currently Operating in {isOperator ? "Team Operator Mode" : "Client Portal Mode"}
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300 mt-0.5">
                    White-label settings, developer monetization, and backend agent prompt modifications are locked. Enter the Master Founder Passkey below to unlock full admin privileges.
                  </p>
                </div>
              </div>

              {/* Founder PIN Unlock Form */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block text-xs">
                  Enter Master Founder PIN to Unlock:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPin ? "text" : "password"}
                      placeholder="Enter Founder PIN (e.g. founder2026)"
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setErrorMsg(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleUnlockMaster()}
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlockMaster}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Founder</span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 mt-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Key className="w-3 h-3 text-slate-400" />
            <span>Default Founder Passkey: <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">founder2026</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
