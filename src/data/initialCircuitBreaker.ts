import { CircuitBreakerConfig, CircuitBreakerIncident, CircuitBreakerState } from "../types";

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  isEnabled: true,
  maxSpendVelocityUsdPerMin: 12.0, // Hard stop if agent burns >$12.00 in any 60-second window
  maxCallsVelocityPerMin: 30,     // Hard stop if >30 requests dispatched in 60 seconds
  maxConsecutiveFailures: 3,     // Quarantine agent after 3 identical consecutive failures
  maxLoopRepetitions: 3,         // Trip if identical input/output signature loops 3x
  autoQuarantineAgent: true,
  cooldownSeconds: 90,
};

export const INITIAL_CIRCUIT_BREAKER_INCIDENTS: CircuitBreakerIncident[] = [
  {
    id: "inc-cb-901",
    timestamp: "18 minutes ago",
    agentId: "agent-growth-1",
    agentName: "Campaign Ad Spend Allocator",
    triggerType: "loop_detected",
    triggerMetricValue: "3 identical prompt iterations in 42s",
    thresholdLimit: "Max 2 identical loop cycles",
    actionTaken: "quarantined",
    estimatedTokensPreserved: 64000,
    estimatedUsdSaved: 19.20,
    status: "resolved",
  },
  {
    id: "inc-cb-902",
    timestamp: "2 hours ago",
    agentId: "agent-eng-sync",
    agentName: "GitHub PR Code Reviewer",
    triggerType: "spend_velocity",
    triggerMetricValue: "$15.40 / min",
    thresholdLimit: "$12.00 / min ceiling",
    actionTaken: "halted",
    estimatedTokensPreserved: 128000,
    estimatedUsdSaved: 38.40,
    status: "overridden",
  },
];

export const INITIAL_CIRCUIT_BREAKER_STATE: CircuitBreakerState = {
  status: "armed",
  currentSpendVelocityUsdPerMin: 1.45,
  currentCallsVelocityPerMin: 4,
  consecutiveFailures: 0,
  incidents: INITIAL_CIRCUIT_BREAKER_INCIDENTS,
  config: DEFAULT_CIRCUIT_BREAKER_CONFIG,
};

export const CLEAN_CIRCUIT_BREAKER_STATE: CircuitBreakerState = {
  status: "armed",
  currentSpendVelocityUsdPerMin: 0,
  currentCallsVelocityPerMin: 0,
  consecutiveFailures: 0,
  incidents: [],
  config: DEFAULT_CIRCUIT_BREAKER_CONFIG,
};
