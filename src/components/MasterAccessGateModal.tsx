import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  Users,
  Building2,
  Mail,
  Check
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
    currentAccessLevel: "master_developer",
    founderEmail: "toppgunn321@gmail.com",
    developerCompanyName: "Guilford Industries",
    isSimulatingClientView: false,
    clientLockEnforced: false,
    detectedEnvironment: "standalone_web_app",
  },
  onUpdateAccessSettings,
  developerCompanyName = "Guilford Industries",
  whiteLabelBrandName = "Guilford Enterprise",
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentLevel = accessSettings?.currentAccessLevel ?? "master_developer";
  const isMaster = currentLevel === "master_developer";
  const isOperator = currentLevel === "team_operator";
  const isClient = currentLevel === "client_tenant";
  const founderEmail = accessSettings?.founderEmail || "toppgunn321@gmail.com";

  const handleSwitchRole = (newLevel: AccessLevel) => {
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
        : `Client Portal Mode (${whiteLabelBrandName})`;

    setSuccessMsg(`Switched active workspace to ${roleName}`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 600);
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
                  Workspace Role & View Switcher
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
                  ? `Testing workspace as Internal Team Operator (${whiteLabelBrandName})`
                  : `Testing workspace as Client / Tenant (${whiteLabelBrandName})`}
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
          {/* Account Authentication Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-2xs">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Direct Founder Access Active
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-mono">
                  {founderEmail}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Direct Access</span>
            </span>
          </div>

          {/* Active Role Selector / Switcher */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 dark:text-white text-xs block">
              Select Workspace Mode to Preview or Operate:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSwitchRole("master_developer")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isMaster
                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20 shadow-xs"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Master Founder</span>
                  </span>
                  {isMaster && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Full admin privileges, White-Label Studio, Monetization Hub & prompt controls.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("team_operator")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isOperator
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-xs">
                    <Users className="w-4 h-4" />
                    <span>Team Operator</span>
                  </span>
                  {isOperator && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Internal staff view. Orchestrate workflows, test automations, manage tasks.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRole("client_tenant")}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isClient
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20 shadow-xs"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Client Portal</span>
                  </span>
                  {isClient && <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  End-client view. Hides monetization markups and locks agent system prompts.
                </div>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Role Permissions Matrix Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Permission Guardrails & Isolation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Master Founder Privileges</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-0.5 list-disc list-inside text-[10px]">
                  <li>White-Label Branding & Domain Studio</li>
                  <li>Developer Rate Cards & Stripe Payouts</li>
                  <li>Full Agent Prompt & Model Editing</li>
                  <li>Tenant Provisioning & Privacy Controls</li>
                </ul>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Client / Tenant Sandbox</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-0.5 list-disc list-inside text-[10px]">
                  <li>White-Label Studio is hidden</li>
                  <li>Monetization & profit markups hidden</li>
                  <li>Agent prompts & backends protected</li>
                  <li>Clean customer execution environment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant view switching • No PIN required</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
