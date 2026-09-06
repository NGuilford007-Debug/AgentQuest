import React, { useState } from "react";
import { ActionEmailTrigger, DispatchedEmail } from "../types";
import { 
  Workflow as WorkflowIcon, 
  AlertTriangle, 
  Bot, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  DollarSign, 
  Shirt, 
  Inbox, 
  Search, 
  Check, 
  Send, 
  Sliders, 
  Lock, 
  RotateCcw, 
  Filter, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  Zap,
  Mail,
  Fingerprint
} from "lucide-react";

interface ActionTriggersPanelProps {
  triggers: ActionEmailTrigger[];
  onToggleTrigger: (triggerId: string) => void;
  onToggleShaProof: (triggerId: string) => void;
  onChangeCondition: (triggerId: string, condition: ActionEmailTrigger["triggerCondition"]) => void;
  onUpdateRecipientEmail: (triggerId: string, email: string) => void;
  onSimulateTrigger: (trigger: ActionEmailTrigger) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onResetDefaults: () => void;
  onOpenConditionBuilder?: (triggerId: string) => void;
}

export const ActionTriggersPanel: React.FC<ActionTriggersPanelProps> = ({
  triggers,
  onToggleTrigger,
  onToggleShaProof,
  onChangeCondition,
  onUpdateRecipientEmail,
  onSimulateTrigger,
  onEnableAll,
  onDisableAll,
  onResetDefaults,
  onOpenConditionBuilder,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Actions" },
    { id: "pipeline", label: "Pipeline & Reliability" },
    { id: "agent", label: "Agent Swarm" },
    { id: "governance", label: "HITL Governance" },
    { id: "billing", label: "Billing & Revenue" },
    { id: "user", label: "User Onboarding" },
  ];

  const filteredTriggers = triggers.filter((t) => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCount = triggers.filter((t) => t.enabled).length;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Workflow": return <WorkflowIcon className="w-4 h-4 text-indigo-500" />;
      case "AlertTriangle": return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case "Bot": return <Bot className="w-4 h-4 text-violet-500" />;
      case "UserCheck": return <UserCheck className="w-4 h-4 text-amber-500" />;
      case "ShieldCheck": return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case "Activity": return <Activity className="w-4 h-4 text-cyan-500" />;
      case "Sparkles": return <Sparkles className="w-4 h-4 text-yellow-500" />;
      case "DollarSign": return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case "Shirt": return <Shirt className="w-4 h-4 text-pink-500" />;
      case "Inbox": return <Inbox className="w-4 h-4 text-blue-500" />;
      default: return <Zap className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Overview & Quick Stats Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Action Triggers & Email Notification Rules
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activeCount} / {triggers.length} Active Triggers
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Toggle which system events, agent completions, and workflow executions automatically dispatch emails. Dispatches include execution telemetry, B2B receipts, onboarding tours, and critical SRE alerts.
            </p>
          </div>

          {/* Batch Quick Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-enable-all-email-triggers"
              onClick={onEnableAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Enable All
            </button>
            <button
              type="button"
              id="btn-disable-all-email-triggers"
              onClick={onDisableAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Disable All
            </button>
            <button
              type="button"
              id="btn-reset-default-email-triggers"
              onClick={onResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
              title="Reset to recommended production defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter actions or email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Action Triggers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTriggers.map((trig) => (
          <div
            key={trig.id}
            id={`trigger-card-${trig.id}`}
            className={`rounded-2xl border transition-all p-4 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs ${
              trig.enabled
                ? "border-indigo-200 dark:border-indigo-900/60 ring-1 ring-indigo-500/10"
                : "border-slate-200 dark:border-slate-800 opacity-80"
            }`}
          >
            <div>
              {/* Header: Icon, Name & Toggle Switch */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {renderIcon(trig.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {trig.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {trig.templateType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {trig.description}
                    </p>
                  </div>
                </div>

                {/* Main Toggle Switch */}
                <button
                  type="button"
                  id={`toggle-${trig.id}`}
                  onClick={() => onToggleTrigger(trig.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    trig.enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                  title={trig.enabled ? "Trigger Active: Click to Mute" : "Trigger Muted: Click to Enable"}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      trig.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Trigger Settings Matrix */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
                {/* Recipient Field */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>Recipient Email:</span>
                  </span>
                  <input
                    type="email"
                    value={trig.recipientEmail}
                    onChange={(e) => onUpdateRecipientEmail(trig.id, e.target.value)}
                    className="px-2 py-1 text-[11px] font-mono font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 max-w-[200px] text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Filter Condition Dropdown */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <span>Trigger Condition:</span>
                  </span>
                  <select
                    value={trig.triggerCondition}
                    onChange={(e) => onChangeCondition(trig.id, e.target.value as ActionEmailTrigger["triggerCondition"])}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="always">Always (Every Execution)</option>
                    <option value="custom_logic">Custom Logic (Condition Builder)</option>
                    <option value="on_failure_only">On Failure / Warning Only</option>
                    <option value="critical_only">Critical Severity Only</option>
                    <option value="vip_only">VIP / Enterprise Accounts Only</option>
                  </select>
                </div>

                {/* Condition Builder Quick Status Row */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-[11px] text-indigo-950 dark:text-indigo-200 font-medium truncate">
                      {trig.ruleSet?.enabled && trig.ruleSet.conditions.length > 0 ? (
                        <span>
                          Rules: <strong className="font-semibold text-indigo-700 dark:text-indigo-300">{trig.ruleSet.description || `${trig.ruleSet.conditions[0]?.field} (${trig.ruleSet.conditions.length} conditions)`}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-500">Condition Builder: No rules</span>
                      )}
                    </span>
                  </div>
                  {onOpenConditionBuilder && (
                    <button
                      type="button"
                      id={`btn-configure-conditions-${trig.id}`}
                      onClick={() => onOpenConditionBuilder(trig.id)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 flex items-center gap-1 transition-colors active:scale-95"
                      title="Open Condition Builder to edit trigger logic"
                    >
                      <span>Condition Builder</span>
                    </button>
                  )}
                </div>

                {/* SHA-256 Cryptographic Proof Checkbox */}
                <div className="flex items-center justify-between gap-2">
                  <label 
                    htmlFor={`sha-proof-${trig.id}`}
                    className="text-[11px] text-slate-500 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Fingerprint className="w-3 h-3 text-slate-400" />
                    <span>SHA-256 Audit Proof:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id={`sha-proof-${trig.id}`}
                      type="checkbox"
                      checked={trig.includeSha256Proof}
                      onChange={() => onToggleShaProof(trig.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {trig.includeSha256Proof ? "Verified Immutable" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Stats & Test Trigger Button */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-400">
                <span>Triggered </span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                  {trig.totalTriggered} times
                </span>
                {trig.lastTriggered && (
                  <span className="text-slate-400 ml-1">({trig.lastTriggered})</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {onOpenConditionBuilder && (
                  <button
                    type="button"
                    onClick={() => onOpenConditionBuilder(trig.id)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition-colors active:scale-95"
                    title="Open Condition Builder for this trigger"
                  >
                    <Sliders className="w-3 h-3 text-indigo-500" />
                    <span>Logic</span>
                  </button>
                )}

                <button
                  type="button"
                  id={`btn-simulate-${trig.id}`}
                  onClick={() => onSimulateTrigger(trig)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  title="Simulate this event and dispatch an email to the recipient"
                >
                  <Send className="w-3 h-3" />
                  <span>Simulate & Send</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
