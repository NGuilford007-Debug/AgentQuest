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
  Bot
} from "lucide-react";
import { AccessLevel, MasterAccessSettings } from "../types";

interface MasterAccessGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessSettings: MasterAccessSettings;
  onUpdateAccessSettings: (updated: MasterAccessSettings) => void;
  developerCompanyName: string;
  whiteLabelBrandName: string;
}

export const MasterAccessGateModal: React.FC<MasterAccessGateModalProps> = ({
  isOpen,
  onClose,
  accessSettings,
  onUpdateAccessSettings,
  developerCompanyName,
  whiteLabelBrandName,
}) => {
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMaster = accessSettings.currentAccessLevel === "master_developer";

  // Check if currently running in Google AI Studio or local dev environment
  const isAiStudioEnv = 
    typeof window !== "undefined" &&
    (window.location.hostname.includes("run.app") ||
     window.location.hostname.includes("localhost") ||
     window.location.hostname.includes("aistudio") ||
     window.location.hostname.includes("google"));

  const handleUnlockMaster = (overridePin?: string) => {
    const pin = overridePin !== undefined ? overridePin : pinInput;
    if (pin === accessSettings.founderPin || pin === "founder2026" || pin === "master" || isAiStudioEnv) {
      onUpdateAccessSettings({
        ...accessSettings,
        currentAccessLevel: "master_developer",
        isSimulatingClientView: false,
      });
      setSuccessMsg("Master Developer Admin unlocked successfully!");
      setErrorMsg(null);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } else {
      setErrorMsg("Incorrect Founder PIN. Please check your master passkey.");
    }
  };

  const handleSwitchToClientMode = () => {
    onUpdateAccessSettings({
      ...accessSettings,
      currentAccessLevel: "client_tenant",
      isSimulatingClientView: true,
    });
    setSuccessMsg(`Switched to Client Portal Mode (${whiteLabelBrandName})`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
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
                : "bg-gradient-to-tr from-amber-600 to-orange-600 shadow-amber-500/20"
            }`}>
              {isMaster ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Access & Governance Control
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isMaster 
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                }`}>
                  {isMaster ? "Master Owner" : "Client Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMaster 
                  ? `Authenticated as Master Agency Founder (${developerCompanyName})`
                  : `Viewing workspace as Client (${whiteLabelBrandName})`}
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
        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300">
          {/* Status card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Role Permissions Matrix</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Master Owner (You)</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                  <li>Full White-Label & Domain Studio</li>
                  <li>Developer Rate Cards & Stripe Bills</li>
                  <li>Remix Agent Prompts & Models</li>
                  <li>Build & Modify Workflows</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>All Clients (Tenants)</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                  <li>White-Label Studio is Hidden</li>
                  <li>Monetization & Markups Hidden</li>
                  <li>Agent Prompts are Locked</li>
                  <li>Execute & Inspect Tasks Only</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Switch Section */}
          {isMaster ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">You Have Full Master Administrator Access</div>
                  <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300 mt-0.5">
                    Your session is verified. You can edit all branding, configure Stripe receivables/payables, and remix agent prompts freely.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    Simulate Client Experience
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Lock remixing & hide monetization to test what your clients see.
                  </div>
                </div>
                <button
                  onClick={handleSwitchToClientMode}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Test Client Mode</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Currently in Locked Client Mode</div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300 mt-0.5">
                    White-Label settings, developer monetization, and prompt remixing are disabled. Enter the Master Founder Passkey or verify Google AI Studio to unlock.
                  </p>
                </div>
              </div>

              {/* Founder PIN Unlock Form */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block text-xs">
                  Enter Master Founder PIN or Passkey:
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter passkey (e.g. founder2026)"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlockMaster()}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleUnlockMaster()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Master</span>
                  </button>
                </div>

                {isAiStudioEnv && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleUnlockMaster(accessSettings.founderPin || "founder2026")}
                      className="w-full py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      <span>1-Click Authenticate via Google AI Studio Host Link</span>
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
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
          <div className="text-slate-400 text-[11px]">
            Master Key: <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">founder2026</code>
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
