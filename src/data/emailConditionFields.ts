import { ConditionFieldDefinition, ConditionOperator, TriggerRuleCondition, TriggerRuleSet } from "../types";

export const AVAILABLE_CONDITION_FIELDS: {
  key: string;
  label: string;
  category: "User & Profile" | "Pipeline & Execution" | "Agent & Swarm" | "Security & Governance" | "Billing & Finance";
  type: "boolean" | "string" | "number";
  description: string;
  options?: string[];
  defaultValue: string;
  sampleContextValue: any;
}[] = [
  // User & Profile
  {
    key: "user.profileCompleted",
    label: "User Profile Completed",
    category: "User & Profile",
    type: "boolean",
    description: "Whether the user has completed full account & profile onboarding",
    defaultValue: "true",
    sampleContextValue: true
  },
  {
    key: "user.emailVerified",
    label: "Email Address Verified",
    category: "User & Profile",
    type: "boolean",
    description: "Corporate or personal email address verified via token",
    defaultValue: "true",
    sampleContextValue: true
  },
  {
    key: "user.hasCreatedFirstAgent",
    label: "Created First AI Agent",
    category: "User & Profile",
    type: "boolean",
    description: "Whether the user has deployed at least 1 agent to canvas",
    defaultValue: "true",
    sampleContextValue: true
  },
  {
    key: "user.planTier",
    label: "Workspace Plan Tier",
    category: "User & Profile",
    type: "string",
    options: ["starter", "pro", "enterprise", "vip"],
    description: "Active subscription tier of the user workspace",
    defaultValue: "enterprise",
    sampleContextValue: "enterprise"
  },
  {
    key: "user.department",
    label: "User Department",
    category: "User & Profile",
    type: "string",
    options: ["Engineering", "Product", "Operations", "Security", "Finance", "Executive"],
    description: "Assigned business unit or department",
    defaultValue: "Engineering",
    sampleContextValue: "Engineering"
  },
  {
    key: "user.role",
    label: "Workspace Role",
    category: "User & Profile",
    type: "string",
    options: ["developer", "admin", "compliance_officer", "manager", "auditor"],
    description: "RBAC permission level assigned to user",
    defaultValue: "developer",
    sampleContextValue: "developer"
  },

  // Pipeline & Execution
  {
    key: "pipeline.status",
    label: "Pipeline Execution Status",
    category: "Pipeline & Execution",
    type: "string",
    options: ["success", "failure", "warning", "timed_out"],
    description: "Final execution outcome status of the automated workflow",
    defaultValue: "success",
    sampleContextValue: "success"
  },
  {
    key: "pipeline.environment",
    label: "Deployment Environment",
    category: "Pipeline & Execution",
    type: "string",
    options: ["production", "staging", "development"],
    description: "Target deployment tier where pipeline was triggered",
    defaultValue: "production",
    sampleContextValue: "production"
  },
  {
    key: "pipeline.durationMs",
    label: "Execution Duration (ms)",
    category: "Pipeline & Execution",
    type: "number",
    description: "Total execution runtime in milliseconds",
    defaultValue: "2500",
    sampleContextValue: 1840
  },
  {
    key: "pipeline.nodeCount",
    label: "Nodes Executed Count",
    category: "Pipeline & Execution",
    type: "number",
    description: "Total count of graph nodes processed in this run",
    defaultValue: "5",
    sampleContextValue: 8
  },
  {
    key: "pipeline.errorSeverity",
    label: "Pipeline Error Severity",
    category: "Pipeline & Execution",
    type: "string",
    options: ["none", "low", "medium", "critical"],
    description: "Diagnostic severity of any encountered runtime faults",
    defaultValue: "critical",
    sampleContextValue: "none"
  },

  // Agent & Swarm
  {
    key: "agent.driftScore",
    label: "Agent Drift Score (%)",
    category: "Agent & Swarm",
    type: "number",
    description: "Prompt drift / variance percentage (0-100%)",
    defaultValue: "15",
    sampleContextValue: 8
  },
  {
    key: "agent.tokensConsumed",
    label: "Tokens Consumed",
    category: "Agent & Swarm",
    type: "number",
    description: "Total LLM tokens consumed during the execution turn",
    defaultValue: "4000",
    sampleContextValue: 3120
  },
  {
    key: "agent.latencyMs",
    label: "Inference Latency (ms)",
    category: "Agent & Swarm",
    type: "number",
    description: "Round-trip model inference delay in milliseconds",
    defaultValue: "3000",
    sampleContextValue: 920
  },
  {
    key: "agent.status",
    label: "Agent Swarm Health",
    category: "Agent & Swarm",
    type: "string",
    options: ["healthy", "degraded", "faulted", "stopped"],
    description: "Health state reported by the agent supervision cluster",
    defaultValue: "healthy",
    sampleContextValue: "healthy"
  },

  // Security & Governance
  {
    key: "security.riskScore",
    label: "Security Risk Score (0-100)",
    category: "Security & Governance",
    type: "number",
    description: "Calculated risk rating evaluated prior to execution",
    defaultValue: "70",
    sampleContextValue: 15
  },
  {
    key: "governance.requiresDualSignOff",
    label: "Requires Dual Sign-Off",
    category: "Security & Governance",
    type: "boolean",
    description: "Compliance mandate requires secondary human sign-off",
    defaultValue: "true",
    sampleContextValue: true
  },
  {
    key: "governance.approvalStatus",
    label: "HITL Approval Status",
    category: "Security & Governance",
    type: "string",
    options: ["approved", "pending", "rejected"],
    description: "Current state of the human approval gate",
    defaultValue: "approved",
    sampleContextValue: "approved"
  },

  // Billing & Finance
  {
    key: "invoice.amountUsd",
    label: "Invoice Amount ($ USD)",
    category: "Billing & Finance",
    type: "number",
    description: "Total transactional invoice amount in USD",
    defaultValue: "500",
    sampleContextValue: 750
  },
  {
    key: "payment.status",
    label: "Payment Gateway Status",
    category: "Billing & Finance",
    type: "string",
    options: ["succeeded", "pending", "failed"],
    description: "Status returned by Stripe Connect or payment processor",
    defaultValue: "succeeded",
    sampleContextValue: "succeeded"
  },
  {
    key: "customer.isVip",
    label: "Customer is VIP",
    category: "Billing & Finance",
    type: "boolean",
    description: "Designated high-value VIP or strategic account",
    defaultValue: "true",
    sampleContextValue: true
  }
];

export interface ConditionPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  recommendedFor: string;
  ruleSet: TriggerRuleSet;
}

export const CONDITION_PRESETS: ConditionPreset[] = [
  {
    id: "preset-profile-completed",
    name: "User Profile Setup Completed",
    badge: "Recommended for Onboarding",
    description: "Only dispatch email if the user has finalized their account profile and verified their corporate email address.",
    recommendedFor: "trig-user-onboarding",
    ruleSet: {
      enabled: true,
      matchType: "ALL",
      description: "Only send welcome email if user completes profile setup",
      conditions: [
        {
          id: "cond-preset-1",
          field: "user.profileCompleted",
          operator: "is_true",
          value: "true",
          valueType: "boolean"
        },
        {
          id: "cond-preset-2",
          field: "user.emailVerified",
          operator: "is_true",
          value: "true",
          valueType: "boolean"
        }
      ]
    }
  },
  {
    id: "preset-prod-deploy",
    name: "Production Pipeline Verification Only",
    badge: "Enterprise Pipeline",
    description: "Dispatches receipts exclusively for deployments targeting the Production environment with verified zero errors.",
    recommendedFor: "trig-wf-deploy",
    ruleSet: {
      enabled: true,
      matchType: "ALL",
      description: "Only send receipts for successful production releases",
      conditions: [
        {
          id: "cond-preset-3",
          field: "pipeline.environment",
          operator: "equals",
          value: "production",
          valueType: "string"
        },
        {
          id: "cond-preset-4",
          field: "pipeline.status",
          operator: "equals",
          value: "success",
          valueType: "string"
        }
      ]
    }
  },
  {
    id: "preset-critical-incidents",
    name: "Critical Incident Alerts",
    badge: "SRE & On-Call",
    description: "Trigger incident alerts only when error severity is Critical or the security risk score exceeds 70.",
    recommendedFor: "trig-wf-failure",
    ruleSet: {
      enabled: true,
      matchType: "ANY",
      description: "Alert on critical errors or high risk score",
      conditions: [
        {
          id: "cond-preset-5",
          field: "pipeline.errorSeverity",
          operator: "equals",
          value: "critical",
          valueType: "string"
        },
        {
          id: "cond-preset-6",
          field: "security.riskScore",
          operator: "greater_than",
          value: "70",
          valueType: "number"
        }
      ]
    }
  },
  {
    id: "preset-high-value-invoices",
    name: "High-Value Transaction ($500+)",
    badge: "Finance & Accounts",
    description: "Dispatches transactional receipts only for successfully billed invoices with a total exceeding $500 USD.",
    recommendedFor: "trig-stripe-billing",
    ruleSet: {
      enabled: true,
      matchType: "ALL",
      description: "Receipts for invoices > $500 USD",
      conditions: [
        {
          id: "cond-preset-7",
          field: "invoice.amountUsd",
          operator: "greater_than",
          value: "500",
          valueType: "number"
        },
        {
          id: "cond-preset-8",
          field: "payment.status",
          operator: "equals",
          value: "succeeded",
          valueType: "string"
        }
      ]
    }
  },
  {
    id: "preset-vip-enterprise",
    name: "VIP / Enterprise Accounts Only",
    badge: "Account Management",
    description: "Filter notifications so they are only dispatched for enterprise-tier subscriptions or accounts tagged VIP.",
    recommendedFor: "trig-agent-swarm",
    ruleSet: {
      enabled: true,
      matchType: "ANY",
      description: "Notify only for VIP or Enterprise tier accounts",
      conditions: [
        {
          id: "cond-preset-9",
          field: "user.planTier",
          operator: "equals",
          value: "enterprise",
          valueType: "string"
        },
        {
          id: "cond-preset-10",
          field: "customer.isVip",
          operator: "is_true",
          value: "true",
          valueType: "boolean"
        }
      ]
    }
  }
];

// Helper to extract nested value from object using dotted path e.g. "user.profileCompleted"
export function getNestedValue(obj: Record<string, any>, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// Evaluate single condition
export function evaluateSingleCondition(condition: TriggerRuleCondition, context: Record<string, any>): {
  matched: boolean;
  actualValue: any;
  explanation: string;
} {
  const actualValue = getNestedValue(context, condition.field);
  const operator = condition.operator;
  const targetValue = condition.value;

  let matched = false;

  switch (operator) {
    case "equals":
      matched = String(actualValue).toLowerCase().trim() === String(targetValue).toLowerCase().trim();
      break;
    case "not_equals":
      matched = String(actualValue).toLowerCase().trim() !== String(targetValue).toLowerCase().trim();
      break;
    case "greater_than": {
      const numActual = Number(actualValue);
      const numTarget = Number(targetValue);
      matched = !isNaN(numActual) && !isNaN(numTarget) && numActual > numTarget;
      break;
    }
    case "less_than": {
      const numActual = Number(actualValue);
      const numTarget = Number(targetValue);
      matched = !isNaN(numActual) && !isNaN(numTarget) && numActual < numTarget;
      break;
    }
    case "contains":
      matched = String(actualValue ?? "").toLowerCase().includes(String(targetValue).toLowerCase());
      break;
    case "is_true":
      matched = actualValue === true || String(actualValue).toLowerCase() === "true";
      break;
    case "is_false":
      matched = actualValue === false || String(actualValue).toLowerCase() === "false";
      break;
    case "is_empty":
      matched = actualValue === null || actualValue === undefined || actualValue === "";
      break;
    case "is_not_empty":
      matched = actualValue !== null && actualValue !== undefined && actualValue !== "";
      break;
    case "not_contains":
      matched = !String(actualValue ?? "").toLowerCase().includes(String(targetValue).toLowerCase());
      break;
    case "regex":
      try {
        const re = new RegExp(String(targetValue), "i");
        matched = re.test(String(actualValue ?? ""));
      } catch (e) {
        matched = false;
      }
      break;
    case "ai_eval":
      matched = Boolean(actualValue);
      break;
    default:
      matched = false;
  }

  const opSymbols: Record<ConditionOperator, string> = {
    equals: "==",
    not_equals: "!=",
    greater_than: ">",
    less_than: "<",
    contains: "contains",
    not_contains: "does not contain",
    regex: "matches regex",
    ai_eval: "AI validates",
    is_true: "is TRUE",
    is_false: "is FALSE",
    is_empty: "is empty",
    is_not_empty: "is not empty"
  };

  const explanation = `${condition.field} (${String(actualValue ?? "undefined")}) ${opSymbols[operator]} ${
    operator === "is_true" || operator === "is_false" || operator === "is_empty" || operator === "is_not_empty"
      ? ""
      : targetValue
  } -> ${matched ? "MET" : "NOT MET"}`;

  return {
    matched,
    actualValue,
    explanation
  };
}

// Evaluate entire rule set
export function evaluateTriggerRuleSet(
  ruleSet: TriggerRuleSet | undefined,
  context: Record<string, any>
): {
  overallMatch: boolean;
  active: boolean;
  results: {
    conditionId: string;
    condition: TriggerRuleCondition;
    matched: boolean;
    actualValue: any;
    explanation: string;
  }[];
  summary: string;
} {
  if (!ruleSet || !ruleSet.enabled || !ruleSet.conditions || ruleSet.conditions.length === 0) {
    return {
      overallMatch: true,
      active: false,
      results: [],
      summary: "No condition restrictions applied. Trigger will dispatch on all events."
    };
  }

  const results = ruleSet.conditions.map((cond) => {
    const res = evaluateSingleCondition(cond, context);
    return {
      conditionId: cond.id,
      condition: cond,
      matched: res.matched,
      actualValue: res.actualValue,
      explanation: res.explanation
    };
  });

  const overallMatch =
    ruleSet.matchType === "ALL"
      ? results.every((r) => r.matched)
      : results.some((r) => r.matched);

  const summary = overallMatch
    ? `Conditions satisfied (${ruleSet.matchType === "ALL" ? "ALL met" : "AT LEAST ONE met"}). Email will be sent.`
    : `Conditions NOT satisfied (${ruleSet.matchType === "ALL" ? "1+ failed" : "NONE met"}). Email dispatch suppressed.`;

  return {
    overallMatch,
    active: true,
    results,
    summary
  };
}

// Generate default context payload for testing
export function getDefaultTestContext(): Record<string, any> {
  const context: Record<string, any> = {};
  for (const field of AVAILABLE_CONDITION_FIELDS) {
    const parts = field.key.split(".");
    if (parts.length === 2) {
      if (!context[parts[0]]) context[parts[0]] = {};
      context[parts[0]][parts[1]] = field.sampleContextValue;
    }
  }
  return context;
}
