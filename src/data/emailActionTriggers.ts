import { ActionEmailTrigger, DispatchedEmail } from "../types";

export const INITIAL_ACTION_TRIGGERS: ActionEmailTrigger[] = [
  {
    id: "trig-wf-deploy",
    name: "Production Pipeline Deployed & Verified",
    description: "Dispatches cryptographic action receipt with node count, cable topology, and SHA-256 verification hash upon deployment.",
    category: "pipeline",
    iconName: "Workflow",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "always",
    includeSha256Proof: true,
    templateType: "receipt",
    totalTriggered: 142,
    lastTriggered: "10 mins ago"
  },
  {
    id: "trig-wf-failure",
    name: "Workflow Execution Failure & Incident Spike",
    description: "Immediately alerts on-call SREs and engineering leads if a node encounters an unhandled exception or circuit breaker trips.",
    category: "pipeline",
    iconName: "AlertTriangle",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "critical_only",
    includeSha256Proof: true,
    templateType: "alert",
    totalTriggered: 14,
    lastTriggered: "2 days ago"
  },
  {
    id: "trig-agent-swarm",
    name: "Autonomous Agent Swarm Execution Completed",
    description: "Dispatches multi-agent telemetry summary report including token consumption, model routing, and output artifact links.",
    category: "agent",
    iconName: "Bot",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "always",
    includeSha256Proof: true,
    templateType: "receipt",
    totalTriggered: 428,
    lastTriggered: "32 mins ago"
  },
  {
    id: "trig-hitl-pending",
    name: "Human-In-The-Loop (HITL) Review Required",
    description: "Notifies designated approvers when a sensitive production action or database mutation requires one-click sign-off.",
    category: "governance",
    iconName: "UserCheck",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "always",
    includeSha256Proof: true,
    templateType: "alert",
    totalTriggered: 89,
    lastTriggered: "1 hour ago"
  },
  {
    id: "trig-hitl-approved",
    name: "Governance & Compliance Sign-Off Approved",
    description: "Issues dual-authorization compliance receipt referencing GDPR, SOC2 masking, and enterprise legal clauses.",
    category: "governance",
    iconName: "ShieldCheck",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "always",
    includeSha256Proof: true,
    templateType: "receipt",
    totalTriggered: 86,
    lastTriggered: "1 hour ago"
  },
  {
    id: "trig-agent-drift",
    name: "Agent Prompt Drift & Health Degradation (<85%)",
    description: "Monitors agent response variance and sends diagnostic alert if semantic drift or latency degradation is detected.",
    category: "agent",
    iconName: "Activity",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "on_failure_only",
    includeSha256Proof: false,
    templateType: "alert",
    totalTriggered: 7,
    lastTriggered: "3 days ago"
  },
  {
    id: "trig-user-onboarding",
    name: "New Team Member & Customer Onboarding",
    description: "Dispatches the comprehensive 17-workspace feature tour, interactive canvas guide, and developer orientation manual.",
    category: "user",
    iconName: "Sparkles",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "custom_logic",
    includeSha256Proof: false,
    templateType: "tour",
    totalTriggered: 218,
    lastTriggered: "15 mins ago",
    ruleSet: {
      enabled: true,
      matchType: "ALL",
      description: "Only send welcome email if user completes profile setup and email verification",
      conditions: [
        {
          id: "cond-onboard-profile",
          field: "user.profileCompleted",
          operator: "is_true",
          value: "true",
          valueType: "boolean"
        },
        {
          id: "cond-onboard-verified",
          field: "user.emailVerified",
          operator: "is_true",
          value: "true",
          valueType: "boolean"
        }
      ]
    }
  },
  {
    id: "trig-stripe-billing",
    name: "Stripe Connect Subscription & B2B Invoice Billed",
    description: "Dispatches itemized transactional invoice receipt with line items, developer rate cards, and payout ledger confirmation.",
    category: "billing",
    iconName: "DollarSign",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "always",
    includeSha256Proof: true,
    templateType: "receipt",
    totalTriggered: 64,
    lastTriggered: "Yesterday"
  },
  {
    id: "trig-asset-ingest",
    name: "Digital Asset & Apparel Shirt Mockup Ingested",
    description: "Dispatches vectorized print specs, CMYK color profiles, and resolution checklist receipt upon asset binding.",
    category: "pipeline",
    iconName: "Shirt",
    enabled: false,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "always",
    includeSha256Proof: true,
    templateType: "receipt",
    totalTriggered: 31,
    lastTriggered: "4 days ago"
  },
  {
    id: "trig-inbound-triage",
    name: "Inbound Support Webhook Ingestion & Auto-Reply",
    description: "Ingests customer inquiry via webhook, uses Gemini to classify intent, and auto-dispatches tailored resolution email.",
    category: "user",
    iconName: "Inbox",
    enabled: true,
    recipientEmail: "toppgunn321@gmail.com",
    triggerCondition: "always",
    includeSha256Proof: false,
    templateType: "triage",
    totalTriggered: 506,
    lastTriggered: "5 mins ago"
  }
];

export interface ThroughputMetricDay {
  day: string;
  date: string;
  workflowRuns: number;
  emailsDispatched: number;
  hoursSaved: number;
  successRate: number;
}

export const SEVEN_DAY_WORKFLOW_METRICS: ThroughputMetricDay[] = [
  { day: "Mon", date: "Aug 31", workflowRuns: 198, emailsDispatched: 176, hoursSaved: 88.4, successRate: 99.5 },
  { day: "Tue", date: "Sep 01", workflowRuns: 245, emailsDispatched: 220, hoursSaved: 112.5, successRate: 99.2 },
  { day: "Wed", date: "Sep 02", workflowRuns: 310, emailsDispatched: 284, hoursSaved: 144.2, successRate: 99.7 },
  { day: "Thu", date: "Sep 03", workflowRuns: 275, emailsDispatched: 250, hoursSaved: 126.8, successRate: 100.0 },
  { day: "Fri", date: "Sep 04", workflowRuns: 382, emailsDispatched: 345, hoursSaved: 178.0, successRate: 99.1 },
  { day: "Sat", date: "Sep 05", workflowRuns: 184, emailsDispatched: 162, hoursSaved: 82.6, successRate: 100.0 },
  { day: "Sun (Today)", date: "Sep 06", workflowRuns: 198, emailsDispatched: 148, hoursSaved: 109.6, successRate: 99.6 },
];

export const EMAIL_CATEGORY_DISTRIBUTION = [
  { category: "Action Receipts & Proofs", percentage: 48, count: 760, color: "bg-indigo-500" },
  { category: "Feature Onboarding Tours", percentage: 22, count: 350, color: "bg-violet-500" },
  { category: "Inbound Triage Auto-Replies", percentage: 18, count: 285, color: "bg-emerald-500" },
  { category: "Incident Alerts & HITL Gates", percentage: 12, count: 190, color: "bg-amber-500" }
];

export function createSimulatedTriggerEmail(trigger: ActionEmailTrigger, recipientName: string = "Alex Mercer"): DispatchedEmail {
  const timestamp = new Date().toISOString();
  const id = `dispatch-trig-${Date.now()}`;
  const randomHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  
  let subject = `[Action Trigger] ${trigger.name}`;
  let plainText = ``;

  if (trigger.templateType === "alert") {
    subject = `⚠️ URGENT ALERT: ${trigger.name} - Telemetry Event Triggered`;
    plainText = `SYSTEM INCIDENT / DRIFT ALERT
===============================================
Trigger ID: ${trigger.id}
Event: ${trigger.name}
Timestamp: ${timestamp}
Recipient: ${trigger.recipientEmail}
Condition: ${trigger.triggerCondition}

Description:
${trigger.description}

Telemetry Diagnostics:
- Severity: CRITICAL / P1
- Nodes Monitored: Active Fleet
- Auto-Remediation: Activated
- SHA-256 Audit Hash: ${trigger.includeSha256Proof ? randomHash : "N/A"}

Please review your AgentFlow Executive Mission Control or Workflow Canvas to inspect live telemetry.`;
  } else if (trigger.templateType === "tour") {
    subject = `Welcome to AgentFlow Enterprise — 17-Workspace Platform Tour & Capabilities Manual`;
    plainText = `WELCOME TO AGENTFLOW ENTERPRISE
===============================================
Hello ${recipientName},

Your onboarding notification trigger has fired. You now have access to all 17 enterprise workspaces including:
1. Agent Stack Multi-Agent Chat
2. AI Image Studio (Imagen 3)
3. Visual Workflow Studio & Mini-Map Canvas
4. Executive Mission Control
...and 13 more operational centers!

Recipient: ${trigger.recipientEmail}
Dispatched at: ${timestamp}`;
  } else {
    subject = `ACTION RECEIPT: ${trigger.name} — Execution Proof #${id.slice(-6).toUpperCase()}`;
    plainText = `CRYPTOGRAPHIC ACTION EXECUTION RECEIPT
===============================================
Receipt ID: ${id.toUpperCase()}
Action Trigger: ${trigger.name}
Category: ${trigger.category.toUpperCase()}
Timestamp: ${timestamp}
Recipient: ${trigger.recipientEmail}
Delivery Status: DELIVERED (TLS 1.3 Verified)

Audit Metadata:
- Platform Engine: AgentFlow Enterprise v2.4
- SHA-256 Checksum: ${randomHash}
- Audit Proof: VERIFIED IMMUTABLE

Thank you for automating with AgentFlow Enterprise.`;
  }

  return {
    id,
    type: trigger.templateType === "tour" ? "welcome_features" : trigger.templateType === "triage" ? "inbound_triage" : "action_receipt",
    recipientEmail: trigger.recipientEmail,
    recipientName,
    subject,
    previewText: plainText.slice(0, 110),
    htmlContent: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6;"><h2>${subject}</h2><pre style="background: #f8fafc; padding: 15px; border-radius: 8px; font-family: monospace;">${plainText}</pre></div>`,
    plainText,
    timestamp,
    status: "Delivered"
  };
}
