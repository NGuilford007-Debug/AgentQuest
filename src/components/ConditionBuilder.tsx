import React, { useState, useMemo } from "react";
import { ActionEmailTrigger, ConditionOperator, TriggerRuleCondition, TriggerRuleSet } from "../types";
import { 
  AVAILABLE_CONDITION_FIELDS, 
  CONDITION_PRESETS, 
  evaluateTriggerRuleSet, 
  getDefaultTestContext,
  getNestedValue
} from "../data/emailConditionFields";
import { playInteractiveSound } from "../utils/audioSynth";
import { fireCelebration } from "../utils/confetti";
import { 
  Sliders, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ShieldAlert, 
  Mail, 
  UserCheck, 
  Bot, 
  Workflow as WorkflowIcon, 
  DollarSign, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Info, 
  Play, 
  Flame, 
  Eye, 
  FileText,
  Clock,
  Layers,
  HelpCircle,
  Send
} from "lucide-react";

interface ConditionBuilderProps {
  triggers: ActionEmailTrigger[];
  selectedTriggerId?: string;
  onSelectTrigger?: (id: string) => void;
  onUpdateTriggerRuleSet: (triggerId: string, ruleSet: TriggerRuleSet) => void;
  onSimulateTriggerWithContext?: (trigger: ActionEmailTrigger, context: Record<string, any>, suppressed: boolean) => void;
  showToast: (message: string) => void;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  triggers,
  selectedTriggerId,
  onSelectTrigger,
  onUpdateTriggerRuleSet,
  onSimulateTriggerWithContext,
  showToast
}) => {
  // Active trigger being configured (defaults to onboarding welcome email or first trigger)
  const [activeId, setActiveId] = useState<string>(() => {
    if (selectedTriggerId && triggers.some((t) => t.id === selectedTriggerId)) {
      return selectedTriggerId;
    }
    const onboarding = triggers.find((t) => t.id === "trig-user-onboarding");
    return onboarding ? onboarding.id : (triggers[0]?.id || "trig-user-onboarding");
  });

  const currentTrigger = useMemo(() => {
    return triggers.find((t) => t.id === activeId) || triggers[0];
  }, [triggers, activeId]);

  // Working copy of ruleSet for the active trigger
  const [workingRuleSet, setWorkingRuleSet] = useState<TriggerRuleSet>(() => {
    if (currentTrigger?.ruleSet) {
      return JSON.parse(JSON.stringify(currentTrigger.ruleSet));
    }
    return {
      enabled: true,
      matchType: "ALL",
      description: "Only send welcome email if user completes profile setup",
      conditions: [
        {
          id: `cond-${Date.now()}-1`,
          field: "user.profileCompleted",
          operator: "is_true",
          value: "true",
          valueType: "boolean"
        },
        {
          id: `cond-${Date.now()}-2`,
          field: "user.emailVerified",
          operator: "is_true",
          value: "true",
          valueType: "boolean"
        }
      ]
    };
  });

  // When active trigger changes, synchronize working copy
  const handleSelectTrigger = (id: string) => {
    setActiveId(id);
    if (onSelectTrigger) onSelectTrigger(id);
    const trig = triggers.find((t) => t.id === id);
    if (trig?.ruleSet) {
      setWorkingRuleSet(JSON.parse(JSON.stringify(trig.ruleSet)));
    } else {
      setWorkingRuleSet({
        enabled: true,
        matchType: "ALL",
        description: `Custom condition rules for ${trig?.name || "Trigger"}`,
        conditions: [
          {
            id: `cond-${Date.now()}-1`,
            field: "user.profileCompleted",
            operator: "is_true",
            value: "true",
            valueType: "boolean"
          }
        ]
      });
    }
    playInteractiveSound("click");
  };

  // Test Context Simulator Payload
  const [testContext, setTestContext] = useState<Record<string, any>>(() => {
    return getDefaultTestContext();
  });

  // Evaluate rule set against current test context in real-time
  const evaluation = useMemo(() => {
    return evaluateTriggerRuleSet(workingRuleSet, testContext);
  }, [workingRuleSet, testContext]);

  // Preset Application
  const handleApplyPreset = (presetId: string) => {
    const preset = CONDITION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newRuleSet = JSON.parse(JSON.stringify(preset.ruleSet));
    setWorkingRuleSet(newRuleSet);
    playInteractiveSound("chime");
    showToast(`Loaded preset: "${preset.name}"`);
  };

  // Add a new condition
  const handleAddCondition = () => {
    const newCond: TriggerRuleCondition = {
      id: `cond-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      field: "user.profileCompleted",
      operator: "is_true",
      value: "true",
      valueType: "boolean"
    };
    setWorkingRuleSet((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCond]
    }));
    playInteractiveSound("click");
  };

  // Remove condition
  const handleRemoveCondition = (conditionId: string) => {
    setWorkingRuleSet((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== conditionId)
    }));
    playInteractiveSound("click");
  };

  // Update specific condition field
  const handleUpdateCondition = (conditionId: string, updates: Partial<TriggerRuleCondition>) => {
    setWorkingRuleSet((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => {
        if (c.id !== conditionId) return c;
        const updated = { ...c, ...updates };
        // If field changed, adapt defaultValue & valueType
        if (updates.field && updates.field !== c.field) {
          const fieldDef = AVAILABLE_CONDITION_FIELDS.find((f) => f.key === updates.field);
          if (fieldDef) {
            updated.valueType = fieldDef.type;
            if (fieldDef.type === "boolean") {
              updated.operator = "is_true";
              updated.value = "true";
            } else {
              updated.operator = "equals";
              updated.value = fieldDef.defaultValue;
            }
          }
        }
        return updated;
      })
    }));
  };

  // Toggle match type (ALL vs ANY)
  const handleToggleMatchType = (type: "ALL" | "ANY") => {
    setWorkingRuleSet((prev) => ({
      ...prev,
      matchType: type
    }));
    playInteractiveSound("click");
  };

  // Toggle rule set enabled
  const handleToggleEnabled = () => {
    const nextState = !workingRuleSet.enabled;
    setWorkingRuleSet((prev) => ({
      ...prev,
      enabled: nextState
    }));
    playInteractiveSound(nextState ? "chime" : "click");
  };

  // Save changes to current trigger
  const handleSaveRules = () => {
    if (!currentTrigger) return;
    onUpdateTriggerRuleSet(currentTrigger.id, workingRuleSet);
    playInteractiveSound("laser");
    fireCelebration();
    showToast(`Saved Condition Builder rules for "${currentTrigger.name}"!`);
  };

  // Fast test scenarios
  const handleLoadScenario = (scenarioKey: "incomplete_profile" | "complete_profile" | "vip_user" | "critical_fault") => {
    const base = getDefaultTestContext();
    if (scenarioKey === "incomplete_profile") {
      base.user.profileCompleted = false;
      base.user.emailVerified = false;
      setTestContext(base);
      playInteractiveSound("click");
      showToast("Loaded Scenario: User has NOT finished profile setup (Welcome email suppressed).");
    } else if (scenarioKey === "complete_profile") {
      base.user.profileCompleted = true;
      base.user.emailVerified = true;
      base.user.planTier = "enterprise";
      setTestContext(base);
      playInteractiveSound("chime");
      showToast("Loaded Scenario: User finished full profile onboarding (Welcome email will send).");
    } else if (scenarioKey === "vip_user") {
      base.customer.isVip = true;
      base.user.planTier = "enterprise";
      base.invoice.amountUsd = 1250;
      setTestContext(base);
      playInteractiveSound("chime");
      showToast("Loaded Scenario: VIP Enterprise account.");
    } else if (scenarioKey === "critical_fault") {
      base.pipeline.errorSeverity = "critical";
      base.pipeline.status = "failure";
      base.security.riskScore = 85;
      setTestContext(base);
      playInteractiveSound("laser");
      showToast("Loaded Scenario: Critical infrastructure failure.");
    }
  };

  // Test Dispatch Now simulation
  const handleTestDispatch = () => {
    if (!currentTrigger) return;
    if (onSimulateTriggerWithContext) {
      onSimulateTriggerWithContext(currentTrigger, testContext, !evaluation.overallMatch);
    }
    if (evaluation.overallMatch) {
      playInteractiveSound("laser");
      fireCelebration();
      showToast(`Trigger evaluated to TRUE! Email dispatched to ${currentTrigger.recipientEmail}`);
    } else {
      playInteractiveSound("click");
      showToast(`Trigger evaluated to FALSE! Email suppressed because conditions were not met.`);
    }
  };

  const getTriggerIcon = (category: string) => {
    switch (category) {
      case "pipeline":
        return <WorkflowIcon className="w-4 h-4 text-indigo-500" />;
      case "agent":
        return <Bot className="w-4 h-4 text-purple-500" />;
      case "governance":
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case "billing":
        return <DollarSign className="w-4 h-4 text-amber-500" />;
      case "user":
      default:
        return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Email Condition Builder & Trigger Logic</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                    Rule Engine v2.4
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Define granular boolean conditions and field filters that govern when automated emails are sent or suppressed.
                </p>
              </div>
            </div>
          </div>

          {/* PRESET PICKER & SAVE BUTTON */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <select
                aria-label="Load Pre-Built Logic Preset"
                onChange={(e) => {
                  if (e.target.value) {
                    handleApplyPreset(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>
                  ⚡ Load Logic Preset...
                </option>
                {CONDITION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.badge})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              id="btn-save-condition-rules"
              onClick={handleSaveRules}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply Rules</span>
            </button>
          </div>
        </div>

        {/* SELECT TRIGGER SELECTOR CAROUSEL */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 block">
            Target Email Action:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {triggers.map((trig) => {
              const isSelected = trig.id === activeId;
              const hasCustomRules = trig.ruleSet && trig.ruleSet.conditions.length > 0;
              return (
                <button
                  key={trig.id}
                  type="button"
                  onClick={() => handleSelectTrigger(trig.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getTriggerIcon(trig.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? "text-indigo-950 dark:text-indigo-200" : "text-slate-800 dark:text-slate-200"}`}>
                        {trig.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {trig.recipientEmail}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    <span className={`font-mono px-1.5 py-0.5 rounded-full ${
                      trig.id === "trig-user-onboarding"
                        ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {trig.id === "trig-user-onboarding" ? "Profile Onboarding" : trig.category}
                    </span>
                    {hasCustomRules ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>{trig.ruleSet?.conditions.length} Rules</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Default</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE TRIGGER BANNER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
            {getTriggerIcon(currentTrigger?.category || "user")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Configuring: {currentTrigger?.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                {currentTrigger?.recipientEmail}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentTrigger?.description}
            </p>
          </div>
        </div>

        {/* RULESET ENABLED SWITCH & MATCH TYPE */}
        <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Enforce Rules:
            </span>
            <button
              type="button"
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                workingRuleSet.enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
              title={workingRuleSet.enabled ? "Custom Rules Active" : "Custom Rules Bypassed"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  workingRuleSet.enabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* MATCH COMBINATOR TOGGLE */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 font-medium">Match:</span>
            <button
              type="button"
              onClick={() => handleToggleMatchType("ALL")}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                workingRuleSet.matchType === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
              }`}
              title="All conditions must evaluate to TRUE (AND logic)"
            >
              ALL (AND)
            </button>
            <button
              type="button"
              onClick={() => handleToggleMatchType("ANY")}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                workingRuleSet.matchType === "ANY"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
              }`}
              title="At least one condition must evaluate to TRUE (OR logic)"
            >
              ANY (OR)
            </button>
          </div>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: RULES BUILDER (LEFT) + SIMULATOR TEST BENCH (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONDITION RULES LIST */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Condition Statements ({workingRuleSet.conditions.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Evaluated in real-time
              </span>
            </div>

            {/* RULESET DESCRIPTION INPUT */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Rule Policy Description:
              </label>
              <input
                type="text"
                value={workingRuleSet.description || ""}
                onChange={(e) => setWorkingRuleSet((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Only send welcome email if user completes profile setup"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* CONDITIONS ROWS */}
            <div className="space-y-3 pt-1">
              {workingRuleSet.conditions.map((cond, idx) => {
                const fieldDef = AVAILABLE_CONDITION_FIELDS.find((f) => f.key === cond.field);
                const evalItem = evaluation.results.find((r) => r.conditionId === cond.id);
                const isMatched = evalItem?.matched ?? false;

                return (
                  <div
                    key={cond.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isMatched
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                        : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {idx === 0 ? "IF" : workingRuleSet.matchType === "ALL" ? "AND" : "OR"} #{idx + 1}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {fieldDef?.category || "Custom Parameter"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Badge in Test Context */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            isMatched
                              ? "bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {isMatched ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Condition Met</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-amber-600" />
                              <span>Not Met</span>
                            </>
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(cond.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remove condition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* FIELDS, OPERATOR, VALUE CONTROLS */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      {/* FIELD SELECT */}
                      <div className="sm:col-span-5">
                        <select
                          aria-label="Condition Field"
                          value={cond.field}
                          onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <optgroup label="User & Profile">
                            {AVAILABLE_CONDITION_FIELDS.filter((f) => f.category === "User & Profile").map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} ({f.key})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Pipeline & Execution">
                            {AVAILABLE_CONDITION_FIELDS.filter((f) => f.category === "Pipeline & Execution").map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} ({f.key})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Agent & Swarm">
                            {AVAILABLE_CONDITION_FIELDS.filter((f) => f.category === "Agent & Swarm").map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} ({f.key})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Security & Governance">
                            {AVAILABLE_CONDITION_FIELDS.filter((f) => f.category === "Security & Governance").map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} ({f.key})
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Billing & Finance">
                            {AVAILABLE_CONDITION_FIELDS.filter((f) => f.category === "Billing & Finance").map((f) => (
                              <option key={f.key} value={f.key}>
                                {f.label} ({f.key})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* OPERATOR SELECT */}
                      <div className="sm:col-span-3">
                        <select
                          aria-label="Condition Operator"
                          value={cond.operator}
                          onChange={(e) => handleUpdateCondition(cond.id, { operator: e.target.value as ConditionOperator })}
                          className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="equals">equals (==)</option>
                          <option value="not_equals">not equals (!=)</option>
                          <option value="is_true">is TRUE</option>
                          <option value="is_false">is FALSE</option>
                          <option value="greater_than">greater than (&gt;)</option>
                          <option value="less_than">less than (&lt;)</option>
                          <option value="contains">contains</option>
                          <option value="is_empty">is empty</option>
                          <option value="is_not_empty">is not empty</option>
                        </select>
                      </div>

                      {/* VALUE INPUT / OPTIONS */}
                      <div className="sm:col-span-4">
                        {cond.operator === "is_true" || cond.operator === "is_false" || cond.operator === "is_empty" || cond.operator === "is_not_empty" ? (
                          <div className="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                            {cond.operator === "is_true" ? "TRUE" : cond.operator === "is_false" ? "FALSE" : "Implicit"}
                          </div>
                        ) : fieldDef?.options ? (
                          <select
                            aria-label="Condition Target Value"
                            value={cond.value}
                            onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {fieldDef.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={fieldDef?.type === "number" ? "number" : "text"}
                            value={cond.value}
                            onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                            placeholder="Target value..."
                            className="w-full px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* LIVE EVALUATION EXPLANATION */}
                    <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                      <span className="truncate">{evalItem?.explanation}</span>
                      <span className="text-slate-400 shrink-0 ml-2">
                        Field Value: <strong className="text-slate-700 dark:text-slate-300">{String(evalItem?.actualValue ?? "undefined")}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ADD CONDITION BUTTON */}
            <button
              type="button"
              id="btn-add-condition-rule"
              onClick={handleAddCondition}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Condition Rule</span>
            </button>

            {/* PLAIN ENGLISH LOGIC STATEMENT */}
            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-indigo-700 dark:text-indigo-400">
                <Info className="w-3.5 h-3.5" />
                <span>Natural Language Logic Policy</span>
              </div>
              <p className="leading-relaxed">
                {workingRuleSet.enabled ? (
                  <>
                    Dispatches automated email to <strong>{currentTrigger?.recipientEmail}</strong> only when{" "}
                    <span className="font-bold underline">
                      {workingRuleSet.matchType === "ALL" ? "ALL OF THE FOLLOWING" : "AT LEAST ONE OF THE FOLLOWING"}
                    </span>{" "}
                    conditions evaluate to true:{" "}
                    {workingRuleSet.conditions.map((c, i) => (
                      <span key={c.id} className="font-mono font-semibold bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.5 rounded text-[11px] mr-1">
                        [{i + 1}] {c.field} {c.operator} {c.operator === "is_true" || c.operator === "is_false" ? "" : c.value}
                      </span>
                    ))}
                    . Otherwise, email delivery is suppressed.
                  </>
                ) : (
                  <>
                    Condition rules are currently <strong>MUTED</strong>. All trigger events will dispatch directly without filtering.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE TEST BENCH & SIMULATOR */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Real-Time Condition Simulator
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Sandboxed
              </span>
            </div>

            {/* FAST SCENARIOS BAR */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Test Scenarios:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  id="scenario-incomplete-profile"
                  onClick={() => handleLoadScenario("incomplete_profile")}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors text-left"
                >
                  ❌ Profile Incomplete
                </button>
                <button
                  type="button"
                  id="scenario-complete-profile"
                  onClick={() => handleLoadScenario("complete_profile")}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors text-left"
                >
                  ✅ Profile Completed
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadScenario("vip_user")}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-300 hover:bg-purple-100 transition-colors text-left"
                >
                  👑 VIP Enterprise Account
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadScenario("critical_fault")}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 hover:bg-red-100 transition-colors text-left"
                >
                  🚨 Critical Failure Spike
                </button>
              </div>
            </div>

            {/* TEST CONTEXT CONTROLS */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Inspect / Tweak Test Variables:
              </label>

              {/* USER PROFILE COMPLETED TOGGLE (The primary case!) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    user.profileCompleted
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Has user finished onboarding setup?
                  </p>
                </div>
                <button
                  type="button"
                  id="toggle-test-profile-completed"
                  onClick={() => {
                    setTestContext((prev) => ({
                      ...prev,
                      user: {
                        ...prev.user,
                        profileCompleted: !prev.user?.profileCompleted
                      }
                    }));
                    playInteractiveSound("click");
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors font-mono ${
                    testContext.user?.profileCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300"
                  }`}
                >
                  {testContext.user?.profileCompleted ? "TRUE (Setup Done)" : "FALSE (Incomplete)"}
                </button>
              </div>

              {/* USER EMAIL VERIFIED TOGGLE */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    user.emailVerified
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Corporate email verified token
                  </p>
                </div>
                <button
                  type="button"
                  id="toggle-test-email-verified"
                  onClick={() => {
                    setTestContext((prev) => ({
                      ...prev,
                      user: {
                        ...prev.user,
                        emailVerified: !prev.user?.emailVerified
                      }
                    }));
                    playInteractiveSound("click");
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors font-mono ${
                    testContext.user?.emailVerified
                      ? "bg-emerald-600 text-white"
                      : "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300"
                  }`}
                >
                  {testContext.user?.emailVerified ? "TRUE (Verified)" : "FALSE (Unconfirmed)"}
                </button>
              </div>

              {/* USER PLAN TIER */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    user.planTier
                  </p>
                  <p className="text-[10px] text-slate-400">Subscription level</p>
                </div>
                <select
                  aria-label="Test User Plan Tier"
                  value={testContext.user?.planTier || "enterprise"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTestContext((prev) => ({
                      ...prev,
                      user: { ...prev.user, planTier: val }
                    }));
                  }}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="starter">starter</option>
                  <option value="pro">pro</option>
                  <option value="enterprise">enterprise</option>
                  <option value="vip">vip</option>
                </select>
              </div>

              {/* PIPELINE STATUS */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    pipeline.status
                  </p>
                  <p className="text-[10px] text-slate-400">Workflow execution result</p>
                </div>
                <select
                  aria-label="Test Pipeline Status"
                  value={testContext.pipeline?.status || "success"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTestContext((prev) => ({
                      ...prev,
                      pipeline: { ...prev.pipeline, status: val }
                    }));
                  }}
                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="success">success</option>
                  <option value="failure">failure</option>
                  <option value="warning">warning</option>
                </select>
              </div>
            </div>

            {/* SIMULATOR EVALUATION BANNER */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                evaluation.overallMatch
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                  : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-950 dark:text-red-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {evaluation.overallMatch ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider">
                    {evaluation.overallMatch
                      ? "Conditions Met: Email Will Dispatch"
                      : "Conditions Not Met: Email Suppressed"}
                  </h5>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {evaluation.summary}
                  </p>
                </div>
              </div>

              {/* CONDITION BREAKDOWN CHIPS */}
              <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50 space-y-1 text-[11px] font-mono">
                {evaluation.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="truncate">{r.explanation}</span>
                    <span
                      className={`font-bold ${
                        r.matched ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {r.matched ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TEST DISPATCH BUTTON */}
            <button
              type="button"
              id="btn-simulate-condition-trigger"
              onClick={handleTestDispatch}
              className={`w-full py-2.5 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                evaluation.overallMatch
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {evaluation.overallMatch
                  ? `Simulate Dispatch to ${currentTrigger?.recipientEmail}`
                  : "Simulate Suppressed Event"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
