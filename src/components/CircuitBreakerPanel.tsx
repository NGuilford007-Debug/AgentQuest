import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  AlertOctagon,
  RotateCcw,
  Sliders,
  Flame,
  Activity,
  DollarSign,
  History,
  Bot,
  CheckCircle2,
  Lock,
  Unlock,
  Info,
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { CircuitBreakerState, CircuitBreakerConfig, CircuitBreakerIncident } from "../types";

interface CircuitBreakerPanelProps {
  breakerState: CircuitBreakerState;
  onUpdateConfig: (config: CircuitBreakerConfig) => void;
  onResetBreaker: () => void;
  onEmergencyStop: () => void;
  onSimulateBreach: (type: "spend_velocity" | "loop_detected") => void;
}

export const CircuitBreakerPanel: React.FC<CircuitBreakerPanelProps> = ({
  breakerState,
  onUpdateConfig,
  onResetBreaker,
  onEmergencyStop,
  onSimulateBreach,
}) => {
  const [activeTab, setActiveTab] = useState<"live" | "config" | "incidents">("live");
  const [localConfig, setLocalConfig] = useState<CircuitBreakerConfig>(breakerState.config);
  const [isSaved, setIsSaved] = useState(false);

  const isTripped = breakerState.status === "tripped";
  const isEmergencyStopped = breakerState.status === "emergency_stopped";
  const isHealthy = breakerState.status === "armed";

  const spendPercent = Math.min(
    100,
    Math.round(
      (breakerState.currentSpendVelocityUsdPerMin /
        (breakerState.config.maxSpendVelocityUsdPerMin || 1)) *
        100
    )
  );

  const callsPercent = Math.min(
    100,
    Math.round(
      (breakerState.currentCallsVelocityPerMin /
        (breakerState.config.maxCallsVelocityPerMin || 1)) *
        100
    )
  );

  const handleSaveConfig = () => {
    onUpdateConfig(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const totalUsdProtected = breakerState.incidents.reduce(
    (acc, inc) => acc + (inc.estimatedUsdSaved || 0),
    0
  );
  const totalTokensProtected = breakerState.incidents.reduce(
    (acc, inc) => acc + (inc.estimatedTokensPreserved || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Banner & Breaker Status Indicator */}
      <div
        className={`p-6 rounded-3xl border-2 transition-all shadow-md ${
          isTripped
            ? "bg-rose-500/10 border-rose-500/60 dark:bg-rose-950/40 dark:border-rose-700/80"
            : isEmergencyStopped
            ? "bg-amber-500/10 border-amber-500/60 dark:bg-amber-950/40 dark:border-amber-700/80"
            : "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-blue-950/30 border-emerald-400 dark:border-emerald-700/70"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg font-bold shrink-0 mt-0.5 text-white ${
                isTripped
                  ? "bg-rose-600 animate-pulse"
                  : isEmergencyStopped
                  ? "bg-amber-600"
                  : "bg-gradient-to-tr from-emerald-600 to-teal-500"
              }`}
            >
              {isTripped ? (
                <AlertOctagon className="w-6 h-6" />
              ) : isEmergencyStopped ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  Financial Circuit Breakers & Runaway Protection
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                    isTripped
                      ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700"
                      : isEmergencyStopped
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700"
                  }`}
                >
                  {breakerState.status.replace("_", " ")}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Sub-Second Real-Time Guard
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isTripped
                  ? `TRIP ACTIVATED: ${
                      breakerState.trippedReason ||
                      "Agent execution velocity exceeded safety ceiling. High-risk loops frozen to protect client funds."
                    }`
                  : isEmergencyStopped
                  ? "EMERGENCY HALT: All agent dispatches have been manually paused by administrator override."
                  : "Continuous telemetry monitor guarding against recursive loops, prompt injection spam, and unexpected token spikes. If spend or call velocity exceeds thresholds, execution is automatically quarantined."}
              </p>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isTripped || isEmergencyStopped ? (
              <button
                type="button"
                onClick={onResetBreaker}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset & Re-Arm Breaker</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onEmergencyStop}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Emergency Halt All Agents</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSimulateBreach("spend_velocity")}
              disabled={isTripped}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
              title="Trigger a simulated runaway burn loop to observe breaker trip"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Breach</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "live"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Real-Time Velocity Telemetry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "config"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Breaker Thresholds & Policies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("incidents")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "incidents"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Incident Audit Trail ({breakerState.incidents.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE VELOCITY GAUGES & METRICS */}
      {/* ========================================================================= */}
      {activeTab === "live" && (
        <div className="space-y-6">
          {/* Top 3 Velocity Meters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Spend Velocity ($/min) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Spend Velocity (60s rolling)</span>
                </span>
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                    spendPercent > 80
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {spendPercent}% Capacity
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  ${breakerState.currentSpendVelocityUsdPerMin.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400"> / min</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Cap: ${breakerState.config.maxSpendVelocityUsdPerMin.toFixed(2)}/min
                </div>
              </div>

              {/* Visual meter bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${spendPercent}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    spendPercent > 80
                      ? "bg-rose-500"
                      : spendPercent > 50
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Breaker triggers hard freeze if spend exceeds ${breakerState.config.maxSpendVelocityUsdPerMin.toFixed(2)} in 60 seconds.
              </p>
            </div>

            {/* 2. Dispatch Velocity (calls/min) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Call Velocity (60s rolling)</span>
                </span>
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                    callsPercent > 80
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  }`}
                >
                  {callsPercent}% Capacity
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {breakerState.currentCallsVelocityPerMin}
                  <span className="text-xs font-normal text-slate-400"> calls/min</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Cap: {breakerState.config.maxCallsVelocityPerMin} calls/min
                </div>
              </div>

              {/* Visual meter bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${callsPercent}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    callsPercent > 80
                      ? "bg-rose-500"
                      : callsPercent > 50
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Guards against recursive agent loop calls and uncontrolled API fan-outs.
              </p>
            </div>

            {/* 3. Protection Cumulative Yield */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-700/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs text-indigo-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Runaway Capital Protected</span>
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-800 text-indigo-200 font-bold">
                  All-Time
                </span>
              </div>

              <div className="text-2xl font-black font-mono text-emerald-400">
                ${totalUsdProtected.toFixed(2)}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-indigo-800/80">
                <span>Preserved Tokens:</span>
                <span className="font-bold text-white font-mono">
                  {totalTokensProtected.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Quarantined Incidents:</span>
                <span className="font-bold text-white font-mono">
                  {breakerState.incidents.length} Breaches Halted
                </span>
              </div>
            </div>
          </div>

          {/* Autonomous Safety Matrix */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Multi-Agent Auto-Quarantine Matrix</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">Loop Detection Engine</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SHA-256 Signature Match</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Halts agent if 3 identical input/output prompts execute within 60 seconds.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">Consecutive Failure Ceiling</div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Max 3 Attempts</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Quarantines failing agents rather than burning retries indefinitely.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">Cooldown Timer</div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{breakerState.config.cooldownSeconds}s Forced Cooldown</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ensures runaway agent processes terminate cleanly before auto-resuming.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">Tenant Wallet Isolation</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Strict Zero-Balance Halt</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Prepaid balance cannot drop below $0.00; overage debt impossible.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONFIGURATION & POLICIES */}
      {/* ========================================================================= */}
      {activeTab === "config" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Circuit Breaker Trip Thresholds
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adjust parameters that govern automatic agent quarantine and protection rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Max Spend Velocity */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Max Spend Velocity ($/minute)
                </span>
                <span className="font-mono font-black text-emerald-600 text-sm">
                  ${localConfig.maxSpendVelocityUsdPerMin.toFixed(2)}/min
                </span>
              </div>
              <input
                type="range"
                min={2.0}
                max={50.0}
                step={1.0}
                value={localConfig.maxSpendVelocityUsdPerMin}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    maxSpendVelocityUsdPerMin: Number(e.target.value),
                  })
                }
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>$2.00 (Strict)</span>
                <span>$15.00 (Standard)</span>
                <span>$50.00 (High-Volume)</span>
              </div>
            </div>

            {/* 2. Max Call Velocity */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Max Dispatches Velocity (calls/minute)
                </span>
                <span className="font-mono font-black text-blue-600 text-sm">
                  {localConfig.maxCallsVelocityPerMin} calls/min
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={localConfig.maxCallsVelocityPerMin}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    maxCallsVelocityPerMin: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5 (Conservative)</span>
                <span>30 (Standard)</span>
                <span>100 (Enterprise Burst)</span>
              </div>
            </div>

            {/* 3. Consecutive Failures */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Max Consecutive Step Failures
                </span>
                <span className="font-mono font-black text-amber-600 text-sm">
                  {localConfig.maxConsecutiveFailures} failures
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={localConfig.maxConsecutiveFailures}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    maxConsecutiveFailures: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-600"
              />
              <p className="text-[10px] text-slate-400">
                After this many consecutive failures, agent is quarantined to prevent waste.
              </p>
            </div>

            {/* 4. Auto-Quarantine Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Automatic Quarantine on Breach
                </span>
                <input
                  type="checkbox"
                  checked={localConfig.autoQuarantineAgent}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      autoQuarantineAgent: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                When enabled, the specific agent that breached velocity is isolated while other fleet agents continue uninterrupted.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {isSaved && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Policy Saved & Deployed
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Save Breaker Configuration
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INCIDENT AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === "incidents" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Historical Circuit Breaker Incidents
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full forensic log of triggered halts, preserved token counts, and resolutions.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {breakerState.incidents.length} Incident Records
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {breakerState.incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {inc.agentName}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">
                        {inc.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{inc.timestamp}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : inc.status === "overridden"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Breach Trigger:</span>
                    <span className="font-semibold">{inc.triggerMetricValue}</span>
                    <span className="text-[10px] text-slate-400 block">Cap: {inc.thresholdLimit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Action Enforced:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 uppercase font-mono text-[11px]">
                      {inc.actionTaken.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Capital Preserved:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +${inc.estimatedUsdSaved.toFixed(2)} ({inc.estimatedTokensPreserved.toLocaleString()} tokens)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
