import { ActionReceiptDetails, DispatchedEmail } from "../types";

export interface PlatformFeatureItem {
  id: string;
  name: string;
  category: "Core Workspaces" | "Intelligence & Execution" | "Enterprise & Operations";
  badge: string;
  summary: string;
  keyCapabilities: string[];
  recommendedAction: string;
}

export const ALL_PLATFORM_FEATURES: PlatformFeatureItem[] = [
  {
    id: "chat",
    name: "Agent Stack Chat",
    category: "Core Workspaces",
    badge: "Gemini 2.5 Multi-Agent",
    summary: "Real-time collaborative workspace where autonomous AI agents communicate, debate, and co-execute complex engineering and operational tasks.",
    keyCapabilities: [
      "Dynamic agent summoning and auto-orchestration based on domain context",
      "Interactive file attachments, code snippet analysis, and real-time streaming tokens",
      "Instant translation of conversational briefs into executable workflow graphs"
    ],
    recommendedAction: "Summon @DevOpsPilot or @SalesOutreach in Stack Chat to test autonomous agent collaboration."
  },
  {
    id: "imagestudio",
    name: "AI Image Studio",
    category: "Core Workspaces",
    badge: "Google Imagen 3",
    summary: "Generative creative studio producing photo-realistic marketing assets, UI wireframes, brand vectors, and apparel merchandise designs.",
    keyCapabilities: [
      "Targeted aspect ratio rendering (1:1, 16:9, 9:16, 4:3, 3:4) with negative prompt weighting",
      "Specialized apparel and shirt mockup generation with printable vector separation specs",
      "Direct asset saving into the centralized enterprise media library"
    ],
    recommendedAction: "Generate a high-resolution concept graphic or merchandise shirt print in the Image Studio."
  },
  {
    id: "dashboard",
    name: "Executive Mission Control Dashboard",
    category: "Enterprise & Operations",
    badge: "Real-Time Telemetry",
    summary: "C-suite operational dashboard summarizing financial return on investment (ROI), projected monthly recurring revenue (MRR), and agent velocity.",
    keyCapabilities: [
      "Live calculation of developer hours saved, operational cost reductions, and efficiency multipliers",
      "Visual departmental coverage breakdown and active workflow concurrency metrics",
      "One-click executive PDF report generation and CSV audit ledger downloads"
    ],
    recommendedAction: "Review executive metrics and download your company's latest efficiency audit report."
  },
  {
    id: "agents",
    name: "AI Agent Fleet Roster",
    category: "Intelligence & Execution",
    badge: "Autonomous Fleet",
    summary: "Enterprise roster of role-specialized autonomous agents spanning DevOps, Customer Support, Sales Outbound, Financial Compliance, and QA.",
    keyCapabilities: [
      "Custom system prompt editing, few-shot examples, and domain guardrails",
      "Autonomy configuration (Autonomous execution, Human-In-The-Loop review, or Shadow logging)",
      "Instant agent cloning, role re-assignment, and cross-departmental permission binding"
    ],
    recommendedAction: "Inspect agent system prompts and adjust autonomy levels to match your team's compliance requirements."
  },
  {
    id: "studio",
    name: "Visual Workflow Studio & Graph Canvas",
    category: "Core Workspaces",
    badge: "Draggable Mini-Map",
    summary: "Visual drag-and-drop pipeline canvas for constructing complex automation graphs with conditional branching, asset binders, and real-time validation.",
    keyCapabilities: [
      "Draggable Radar Mini-Map with interactive viewfinder, click-to-pan, and fit-to-content controls",
      "Real-time pipeline diagnostics detecting broken connections, orphan nodes, and missing config fields",
      "Interactive SVG cable routing with conditional TRUE/FALSE branches and one-click auto-repair"
    ],
    recommendedAction: "Open Workflow Studio to inspect the visual cable graph and navigate using the new draggable Mini-Map."
  },
  {
    id: "health",
    name: "Agent Health, Drift & Telemetry Monitor",
    category: "Intelligence & Execution",
    badge: "Auto-Healing Engine",
    summary: "Live observability telemetry tracking agent prompt drift, latency anomalies, token degradation, and error spikes across active fleets.",
    keyCapabilities: [
      "Sub-85% success rate alerts and automated drift diagnostics",
      "One-click AI Prompt Auto-Healing engine to restore degraded agents to peak reliability",
      "Chaos engineering injection to simulate real-world API rate limits and network degradation"
    ],
    recommendedAction: "Check agent health scores and trigger the Auto-Heal prompt optimizer on any flagged agent."
  },
  {
    id: "dispatcher",
    name: "Task Dispatcher & HITL Review Queue",
    category: "Intelligence & Execution",
    badge: "Governance Queue",
    summary: "Enterprise command center for executing pipelines, reviewing raw JSON payloads, and approving Human-In-The-Loop decisions.",
    keyCapabilities: [
      "Step-by-step pipeline execution playback with token breakdown and duration tracking",
      "Human-In-The-Loop (HITL) gatekeeper requiring manager approval before external dispatch",
      "Direct conversion of high-performing workflow runs into reusable approved automations"
    ],
    recommendedAction: "Queue a live task run and approve any pending HITL governance checkpoints."
  },
  {
    id: "automations",
    name: "Approved Automations Vault & Runbooks",
    category: "Intelligence & Execution",
    badge: "Verified Playbooks",
    summary: "Centralized repository of validated enterprise playbooks and pre-approved automations ready for immediate production invocation.",
    keyCapabilities: [
      "Tagged automation library categorized by SRE, Customer Support, Outreach, and Finance",
      "Estimated hours saved and confidence scores for every certified playbook",
      "One-click execution triggers with direct integration into Slack, Jira, and GitHub"
    ],
    recommendedAction: "Browse approved runbooks and bookmark your department's critical operational workflows."
  },
  {
    id: "assets",
    name: "Media & Digital Asset Gallery",
    category: "Core Workspaces",
    badge: "Multi-Department Folders",
    summary: "Centralized media and documentation asset repository with multi-departmental directory segregation and drag-and-drop workflow binding.",
    keyCapabilities: [
      "Structured directory trees (e.g. creative/apparel/shirts, marketing/campaigns, legal/policies)",
      "High-resolution image viewing, SVG vector downloads, and PDF attachment indexing",
      "Batch attachment of digital assets directly to workflow canvas nodes"
    ],
    recommendedAction: "Upload creative graphics or apparel design specifications into the Asset Gallery."
  },
  {
    id: "permissions",
    name: "App & API Permissions Hub (RBAC)",
    category: "Enterprise & Operations",
    badge: "Zero-Trust Security",
    summary: "Zero-trust governance center managing third-party SaaS integrations, Google Workspace OAuth, and Role-Based Access Control scopes.",
    keyCapabilities: [
      "Scoped permissions for Salesforce, Google Drive, Jira, GitHub, Slack, Datadog, and PostgreSQL",
      "Masking and sanitization of PII, credit cards, passwords, and GDPR-sensitive attributes",
      "Real-time API audit logging with cryptographic verification timestamps"
    ],
    recommendedAction: "Audit connected app credentials and verify permission scopes across all departments."
  },
  {
    id: "legal",
    name: "Terms, Legalities & SLA Center",
    category: "Enterprise & Operations",
    badge: "Persistent Signatures",
    summary: "Legal compliance suite housing Master Services Agreements, Terms of Service, Privacy Policies, DPAs, and SLA contracts with cross-session signature gates.",
    keyCapabilities: [
      "Persistent localStorage signature tracking with re-fillable company and signatory metadata",
      "Dismissible review mode allowing teams to reference legal documentation without re-signing",
      "Comprehensive acceptable use and prohibited AI conduct definitions"
    ],
    recommendedAction: "Review the Master Services Agreement and verify your company's persistent signed terms status."
  },
  {
    id: "gamification",
    name: "Company Milestones & Developer Quests",
    category: "Enterprise & Operations",
    badge: "XP & Streaks",
    summary: "Gamified progression framework rewarding developers and operators with experience points (XP), skill badges, and leveling ranks.",
    keyCapabilities: [
      "Dynamic quest checklist (deploy workflows, heal agents, verify legal terms, connect APIs)",
      "Daily streak multipliers amplifying productivity XP and hours-saved calculations",
      "Level progression unlocking advanced autonomy privileges and architect titles"
    ],
    recommendedAction: "Complete an active daily quest to claim your XP reward and boost your level rank."
  },
  {
    id: "leaderboard",
    name: "Department Benchmarks & Leaderboard",
    category: "Enterprise & Operations",
    badge: "OpEx Efficiency",
    summary: "Cross-departmental productivity leaderboard comparing efficiency metrics, automations completed, and total hours saved.",
    keyCapabilities: [
      "Real-time ranking of top individual contributors and operational teams",
      "Department-level ROI benchmarks and cost reduction leaderboards",
      "Recognition badges celebrating top automation engineers and compliance stewards"
    ],
    recommendedAction: "Check your standing on the leaderboard and compare productivity across departments."
  },
  {
    id: "analytics",
    name: "Deep ROI & Observability Analytics",
    category: "Enterprise & Operations",
    badge: "Financial Observability",
    summary: "Comprehensive analytical engine charting historical cost reduction curves, token consumption trends, and execution latencies.",
    keyCapabilities: [
      "Longitudinal financial telemetry charting quarterly cost avoidance against traditional manual labor",
      "Token utilization heatmaps and model cost optimization recommendations",
      "Exportable analytics packets formatted for enterprise stakeholders and board decks"
    ],
    recommendedAction: "Analyze financial trajectory charts to project next quarter's automation savings."
  },
  {
    id: "whitelabel",
    name: "White-Label Studio & Multi-Tenancy",
    category: "Enterprise & Operations",
    badge: "Custom Agency SaaS",
    summary: "Multi-tenant branding suite enabling full platform white-labeling, custom agency subdomains, personalized logos, and client lock controls.",
    keyCapabilities: [
      "Custom primary and secondary brand color palette customization with live CSS injection",
      "Custom favicon, company logo, support email, and copyright footer customization",
      "Master Developer vs. Client view toggle with read-only client lock enforcement"
    ],
    recommendedAction: "Configure custom white-label branding and preview the restricted client tenant portal."
  },
  {
    id: "monetization",
    name: "Monetization & Stripe Billing Hub",
    category: "Enterprise & Operations",
    badge: "Stripe Connect",
    summary: "Complete financial infrastructure managing client billing, Stripe Connect payouts, custom developer rate cards, and subscription tiers.",
    keyCapabilities: [
      "Hourly rate card customization, markup multipliers, and managed agent maintenance fees",
      "Stripe Connect invoice dispatch with automated payment reconciliation",
      "Client payout ledger tracking net revenue, platform fees, and gross developer margins"
    ],
    recommendedAction: "Set your company's developer rate card and simulate a recurring client invoice payout."
  },
  {
    id: "workplaces",
    name: "Workplaces, Lounges & Ambient Stages",
    category: "Core Workspaces",
    badge: "Spatial Environments",
    summary: "Dynamic operational environments featuring ambient audio soundscapes, focus HUD states, and collaborative virtual agency lounges.",
    keyCapabilities: [
      "Curated work environments (e.g. Incident War Room, Zen Lounge, Cyberpunk Studio, Executive Suite)",
      "Integrated audio synthesizer generating generative binaural beats and ambient cafe soundscapes",
      "Distraction-free Focus HUD mode maximizing canvas real estate"
    ],
    recommendedAction: "Switch workplace themes and enable ambient zone audio to enter deep focus mode."
  }
];

export const SAMPLE_ACTION_RECEIPTS: ActionReceiptDetails[] = [
  {
    receiptId: "RCP-WF-98241",
    actionType: "workflow_deployment",
    title: "Production Workflow Pipeline Deployed & Verified",
    summary: "The automated SRE Incident Remediation & Auto-Recovery pipeline was compiled, cryptographically verified, and deployed to live production runtime.",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: "Verified",
    actorName: "Alex Mercer",
    actorEmail: "toppgunn321@gmail.com",
    metadata: [
      { label: "Pipeline Name", value: "SRE Incident Remediation Pipeline" },
      { label: "Graph Topology", value: "7 Nodes • 8 SVG Cables • 2 Branches" },
      { label: "Target Environment", value: "Production Cloud Run Cluster (us-east1)" },
      { label: "Validation Status", value: "Zero Errors • Security Sanitizer Verified" },
      { label: "Execution Latency", value: "245ms / cycle" },
    ],
    tokensUsed: 4280,
    costEstimateUsd: 142.50,
    hoursSaved: 2.4,
    transactionHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
  },
  {
    receiptId: "RCP-AG-44102",
    actionType: "agent_dispatch",
    title: "Autonomous Agent Swarm Execution Completed",
    summary: "Collaborative 3-agent swarm (DevOpsPilot, SentinelSec, SupportPilot) successfully processed ticket triage, log correlation, and patch verification.",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: "Completed",
    actorName: "Autonomous Dispatcher",
    actorEmail: "toppgunn321@gmail.com",
    metadata: [
      { label: "Agents Invoked", value: "DevOpsPilot, SentinelSec, SupportPilot" },
      { label: "Model Architecture", value: "Google Gemini 2.5 Flash Enterprise" },
      { label: "Task Classification", value: "Infrastructure Anomaly Triage" },
      { label: "Artifacts Produced", value: "Executive Summary, Remediation Patch, Post-Mortem" },
    ],
    tokensUsed: 12450,
    costEstimateUsd: 210.00,
    hoursSaved: 3.5,
    transactionHash: "0x4a92c81120fef76498be52e93b1d98d2ca0199e4b3708819d2719ba7145b2011"
  },
  {
    receiptId: "RCP-INV-88194",
    actionType: "subscription_upgrade",
    title: "Enterprise Master Developer License Invoice",
    summary: "Monthly platform subscription tier renewed successfully via Stripe Connect. Full Master Developer access unlocked across all client tenant accounts.",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    status: "Verified",
    actorName: "Guilford Industries Billing",
    actorEmail: "toppgunn321@gmail.com",
    metadata: [
      { label: "Invoice Number", value: "INV-2026-88194" },
      { label: "Plan Tier", value: "Enterprise Master Developer (Unlimited)" },
      { label: "Billing Period", value: "Monthly Recurring (Stripe ID: sub_1N9xKQ2)" },
      { label: "Payment Method", value: "MasterCard ending in •••• 4242" },
      { label: "Tax Exemption Status", value: "Verified B2B Enterprise (VAT #US-991204)" },
    ],
    costEstimateUsd: 1499.00,
    transactionHash: "0x9812efdca8271bb84018274ac092bbf18274092bba71449281726aaff018291a"
  },
  {
    receiptId: "RCP-AST-32091",
    actionType: "asset_ingest",
    title: "Department Apparel & Shirt Vector Spec Registered",
    summary: "High-resolution graphic vector asset and print specification package registered into creative/apparel/shirts and linked to Apparel Mockup AI.",
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    status: "Completed",
    actorName: "Alex Mercer",
    actorEmail: "toppgunn321@gmail.com",
    metadata: [
      { label: "Asset Directory", value: "creative/apparel/shirts" },
      { label: "Asset Title", value: "Cyberpunk Agency Tee - High Res Vector Print" },
      { label: "Color Profiles", value: "CMYK Separation (Pantone 802 C, Process Black)" },
      { label: "File Size & Checksum", value: "24.8 MB • SHA-256 Verified" },
      { label: "Workflow Binder", value: "Apparel Shirt & Graphic Mockup AI (Node wf-node-apparel-01)" }
    ],
    hoursSaved: 1.2,
    transactionHash: "0x12a99182bbfaec809271649982736511aab091827651817290bbfaec091827bb"
  },
  {
    receiptId: "RCP-SEC-10940",
    actionType: "hitl_approval",
    title: "Security & Governance Human-in-the-Loop Sign-Off",
    summary: "Senior Lead Architect signed off on elevated database mutation permissions and PII unmasking protocol for GDPR subject compliance request.",
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    status: "Verified",
    actorName: "Lead Security Counsel",
    actorEmail: "toppgunn321@gmail.com",
    metadata: [
      { label: "Governance Protocol", value: "HITL Stage-2 Dual Authorization" },
      { label: "Subject Request", value: "DSR-2026-7782 (GDPR Right to Be Forgotten)" },
      { label: "PII Sanitizer", value: "Passed Zero-Leakage Data Masking Engine" },
      { label: "Legal SLA Contract", value: "Enterprise MSA Clause 14.3 (SecOps Signed)" }
    ],
    hoursSaved: 1.5,
    transactionHash: "0x661829bbdaec77182900bb1726aabcf091827bbec0918274091827bbdaec9911"
  }
];

export const INITIAL_DISPATCHED_EMAILS: DispatchedEmail[] = [
  {
    id: "mail-welcome-01",
    type: "welcome_features",
    recipientEmail: "toppgunn321@gmail.com",
    recipientName: "Alex Mercer",
    subject: "Welcome to AgentFlow Enterprise — Complete Platform Feature Tour & Capabilities Guide",
    previewText: "Your enterprise automation workspace is ready. Explore all 17 flagship modules, visual workflow canvas, autonomous agents, and monetization tools.",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: "Opened",
    featureTourIncluded: true,
    plainText: `Welcome to AgentFlow Enterprise!

Hello Alex Mercer,

Welcome to your unified enterprise AI workspace. Below is your comprehensive guide to every single feature, tool, and capability available on the platform:

1. AGENT STACK CHAT: Multi-agent auto-orchestrated reasoning & collaboration with Gemini 2.5.
2. AI IMAGE STUDIO: Creative visual generation powered by Google Imagen 3 with apparel shirt specs.
3. EXECUTIVE MISSION CONTROL DASHBOARD: Real-time ROI calculations, MRR forecasts, and audit reports.
4. AI AGENT FLEET ROSTER: Autonomous role-specialized agents (SDR, DevOps, Research, Compliance).
5. VISUAL WORKFLOW STUDIO: Visual node graph builder with the new Draggable Mini-Map and real-time validation.
6. AGENT HEALTH & DRIFT DIAGNOSTICS: Telemetry tracking, error rates, and one-click AI auto-healing.
7. TASK DISPATCHER & HITL QUEUE: Execution orchestrator with Human-In-The-Loop approval gates.
8. AUTOMATIONS VAULT: Curated library of enterprise-tested playbooks and production automations.
9. MEDIA & ASSET GALLERY: Multi-department categorized asset repository with apparel/shirt directories.
10. APP & API PERMISSIONS HUB: RBAC security matrix, zero-trust API secret vaults, and SaaS connectors.
11. LEGAL GOVERNANCE & SLA CENTER: Enterprise legal suite with persistent cross-session signature gates.
12. COMPANY MILESTONES & QUESTS: Gamified developer progression, leveling system, XP, and streak multipliers.
13. DEPARTMENT BENCHMARKS & LEADERBOARD: Cross-departmental OpEx efficiency metrics and hours saved.
14. DEEP ROI ANALYTICS: High-precision financial metrics and compute cost avoidance curves.
15. WHITE-LABEL STUDIO: Multi-tenant rebranding engine with custom client subdomains and branding locks.
16. MONETIZATION & STRIPE HUB: Client billing, developer rate cards, and automated Stripe Connect payouts.
17. WORKPLACES & LOUNGES SIMULATOR: Dynamic environments with generative ambient soundscapes and focus HUD.

To get started, visit your Workflow Studio or launch an agent in Stack Chat.

Best regards,
Guilford Industries Automation Team`,
    htmlContent: ""
  },
  {
    id: "mail-receipt-01",
    type: "action_receipt",
    recipientEmail: "toppgunn321@gmail.com",
    recipientName: "Alex Mercer",
    subject: "Action Receipt: SRE Incident Remediation Pipeline Deployed [RCP-WF-98241]",
    previewText: "Official action receipt for your recent production workflow deployment. 7 nodes verified, zero errors.",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    status: "Delivered",
    receiptData: SAMPLE_ACTION_RECEIPTS[0],
    plainText: `ACTION EXECUTION RECEIPT
Receipt ID: RCP-WF-98241
Status: VERIFIED & COMPLETED
Date: ${SAMPLE_ACTION_RECEIPTS[0].timestamp}
Action: Production Workflow Pipeline Deployed & Verified

SUMMARY:
${SAMPLE_ACTION_RECEIPTS[0].summary}

METRICS & TELEMETRY:
- Pipeline Name: SRE Incident Remediation Pipeline
- Graph Topology: 7 Nodes • 8 SVG Cables • 2 Branches
- Target Environment: Production Cloud Run Cluster (us-east1)
- Tokens Used: 4,280 tokens
- Cost Reduction: $142.50
- Hours Saved: 2.4 hrs
- Verification Hash: 0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069

This receipt is cryptographically recorded in your enterprise audit log.`,
    htmlContent: ""
  }
];

// Helper to generate beautifully styled HTML for Welcome Email
export function generateWelcomeEmailHtml(recipientName: string = "Alex Mercer", companyName: string = "Guilford Industries"): string {
  const featureRows = ALL_PLATFORM_FEATURES.map((feature, idx) => `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; background: #eef2ff; padding: 3px 8px; border-radius: 6px;">
          ${feature.category}
        </span>
        <span style="font-size: 11px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 3px 8px; border-radius: 6px;">
          ${feature.badge}
        </span>
      </div>
      <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">
        ${idx + 1}. ${feature.name}
      </h3>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569; line-height: 1.5;">
        ${feature.summary}
      </p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">
          Core Capabilities:
        </div>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.6;">
          ${feature.keyCapabilities.map(cap => `<li>${cap}</li>`).join("")}
        </ul>
      </div>
      <div style="font-size: 11px; color: #6366f1; font-weight: 600; font-style: italic;">
        💡 Pro-Tip: ${feature.recommendedAction}
      </div>
    </div>
  `).join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #f8fafc; padding: 28px; border-radius: 16px; color: #0f172a;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 28px; border-radius: 14px; color: #ffffff; text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px;">
          ${companyName} Platform Guide
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
          Welcome to AgentFlow Enterprise
        </h1>
        <p style="margin: 0; font-size: 14px; color: #c7d2fe; max-width: 520px; margin: 0 auto; line-height: 1.5;">
          Your high-velocity autonomous automation operating system. Below is your complete tour of all 17 features and enterprise modules.
        </p>
      </div>

      <!-- Greeting & Intro -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
          Hello ${recipientName},
        </h2>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569; line-height: 1.6;">
          Your enterprise tenant is provisioned and ready for live execution. Whether you are orchestrating multi-agent reasoning, building drag-and-drop workflow pipelines with our visual radar mini-map, generating creative merchandise apparel assets, or monetizing automated playbooks with Stripe Connect — this platform houses every tool your enterprise needs.
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <span style="background: #eef2ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">17 Modular Workspaces</span>
          <span style="background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">Google Gemini 2.5 & Imagen 3</span>
          <span style="background: #fdf2f8; color: #be185d; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">Zero-Trust RBAC Governance</span>
        </div>
      </div>

      <!-- Feature Tour Heading -->
      <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #1e293b;">
          Comprehensive Feature Catalog (17 Modules)
        </h2>
        <span style="font-size: 12px; color: #64748b; font-weight: 600;">Full Platform Index</span>
      </div>

      <!-- Feature Cards -->
      ${featureRows}

      <!-- Next Steps Call-to-Action -->
      <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-top: 24px;">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700;">Ready to Build Your First Pipeline?</h3>
        <p style="margin: 0 0 16px 0; font-size: 12px; color: #e0e7ff; line-height: 1.5;">
          Open the Workflow Studio, explore the draggable Mini-Map, and trigger a live simulation test in seconds.
        </p>
        <a href="#studio" style="display: inline-block; background: #ffffff; color: #4338ca; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 18px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Open Workflow Studio
        </a>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 28px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        Sent by ${companyName} Automated Dispatch Engine • Security Verified • 
        <a href="#legal" style="color: #6366f1; text-decoration: none;">Terms & SLAs</a>
      </div>
    </div>
  `;
}

// Helper to generate beautifully styled HTML for Action Receipts
export function generateActionReceiptHtml(receipt: ActionReceiptDetails, companyName: string = "Guilford Industries"): string {
  const metadataRows = receipt.metadata.map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #64748b; width: 38%;">${item.label}</td>
      <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #0f172a;">${item.value}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); color: #0f172a;">
      <!-- Receipt Header Bar -->
      <div style="background: #0f172a; padding: 24px; color: #ffffff; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 10px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">
            ${companyName} • Action Receipt
          </div>
          <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 800;">
            ${receipt.title}
          </h2>
          <div style="font-size: 12px; color: #94a3b8; font-family: monospace;">
            Receipt #: ${receipt.receiptId}
          </div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #059669; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 3px 10px; border-radius: 12px;">
            ${receipt.status}
          </span>
          <div style="font-size: 10px; color: #64748b; margin-top: 6px;">
            ${new Date(receipt.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      <!-- Action Summary -->
      <div style="padding: 20px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
          Execution Summary
        </div>
        <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
          ${receipt.summary}
        </p>
      </div>

      <!-- Detailed Breakdown Table -->
      <div style="padding: 16px 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
          Transaction & Verification Metrics
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <tbody>
            ${metadataRows}
            ${receipt.tokensUsed ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #64748b;">Gemini Compute Tokens</td>
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #4f46e5;">${receipt.tokensUsed.toLocaleString()} tokens</td>
              </tr>
            ` : ""}
            ${receipt.hoursSaved ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #64748b;">Manual Labor Saved</td>
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #059669;">${receipt.hoursSaved} hours</td>
              </tr>
            ` : ""}
            ${receipt.costEstimateUsd ? `
              <tr style="border-bottom: 1px solid #f1f5f9; background: #f0fdf4;">
                <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #166534;">Financial Impact / Value</td>
                <td style="padding: 10px 12px; font-size: 14px; font-weight: 800; color: #15803d;">$${receipt.costEstimateUsd.toFixed(2)} USD</td>
              </tr>
            ` : ""}
          </tbody>
        </table>
      </div>

      <!-- Cryptographic Hash Audit Proof -->
      ${receipt.transactionHash ? `
        <div style="padding: 14px 24px; background: #f1f5f9; border-top: 1px solid #e2e8f0; font-family: monospace; font-size: 10px; color: #64748b; word-break: break-all;">
          <div style="font-weight: 700; color: #475569; margin-bottom: 2px;">SHA-256 AUDIT PROOF HASH:</div>
          <div>${receipt.transactionHash}</div>
        </div>
      ` : ""}

      <!-- Footer Bar -->
      <div style="padding: 16px 24px; background: #fafafa; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8;">
        <div>Authorized by: <strong style="color: #334155;">${receipt.actorName}</strong> (${receipt.actorEmail})</div>
        <div>Immutable Enterprise Receipt</div>
      </div>
    </div>
  `;
}
