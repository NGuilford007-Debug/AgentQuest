import { Agent, Workflow, WorkflowNode, WorkflowConnection, AiModel, PermissionScope } from "../types";

export interface GenerateReadmeOptions {
  agent: {
    id?: string;
    name: string;
    role: string;
    department: string;
    description: string;
    model: string;
    temperature: number;
    autonomyLevel: string;
    assignedTo?: {
      userName: string;
      team: string;
    };
    permissions?: string[];
    systemPrompt: string;
    monetization?: any;
    stats?: {
      tasksCompleted: number;
      hoursSaved: number;
      successRate: number;
      avgLatencySec: number;
      xpGenerated: number;
    };
  };
  workflow?: Workflow | null;
  workflowNodes?: WorkflowNode[];
  workflowConnections?: WorkflowConnection[];
  availableModels?: AiModel[];
  availablePermissions?: PermissionScope[];
}

export function generateAgentSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "agent";
}

export function generateAgentReadme({
  agent,
  workflow,
  workflowNodes,
  workflowConnections,
  availableModels = [],
  availablePermissions = [],
}: GenerateReadmeOptions): string {
  const modelObj = availableModels.find((m) => m.id === agent.model);
  const modelName = modelObj?.name || agent.model;
  const modelProvider = modelObj?.provider || "Google Gemini";
  const modelContext = modelObj?.contextWindow || "1M Tokens";
  const latencyTier = modelObj?.latencyTier || "Fast (~1s)";

  // Determine nodes to document
  const nodes: WorkflowNode[] =
    workflowNodes || (workflow?.nodes && workflow.nodes.length > 0 ? workflow.nodes : []);
  const connections: WorkflowConnection[] =
    workflowConnections || (workflow?.connections && workflow.connections.length > 0 ? workflow.connections : []);

  // Filter permissions granted to this agent
  const grantedPerms = (agent.permissions || [])
    .map((pId) => availablePermissions.find((p) => p.id === pId || p.code === pId))
    .filter(Boolean) as PermissionScope[];

  // Autonomy badge description
  const autonomyDescriptions: Record<string, string> = {
    autonomous: "Autonomous Execution — Fully hands-off execution without requiring approval gates.",
    hitl: "Human-in-the-Loop (HITL) — High-risk actions pause for human operator review.",
    shadow: "Shadow / Observability Mode — Operates in dry-run mode for evaluation and verification.",
  };
  const autonomyNote = autonomyDescriptions[agent.autonomyLevel] || "Human-in-the-Loop";

  // Build Mermaid diagram of workflow nodes if available
  let mermaidDiagram = "";
  if (nodes.length > 0) {
    mermaidDiagram = "```mermaid\ngraph LR\n";
    nodes.forEach((n) => {
      const sanitizedName = n.name.replace(/["[\]()]/g, "");
      const typeLabel = n.type.replace(/_/g, " ").toUpperCase();
      if (n.type === "trigger") {
        mermaidDiagram += `  node_${n.id.replace(/-/g, "_")}(["🚀 ${sanitizedName}\\n(${typeLabel})"])\n`;
      } else if (n.type === "condition") {
        mermaidDiagram += `  node_${n.id.replace(/-/g, "_")}{"⚡ ${sanitizedName}\\n(${typeLabel})"}\n`;
      } else if (n.type === "human_review") {
        mermaidDiagram += `  node_${n.id.replace(/-/g, "_")}["👤 ${sanitizedName}\\n(HITL REVIEW)"]\n`;
      } else {
        mermaidDiagram += `  node_${n.id.replace(/-/g, "_")}["⚙️ ${sanitizedName}\\n(${typeLabel})"]\n`;
      }
    });

    if (connections.length > 0) {
      connections.forEach((conn) => {
        const fromId = `node_${conn.from.replace(/-/g, "_")}`;
        const toId = `node_${conn.to.replace(/-/g, "_")}`;
        const label = conn.label ? `|${conn.label}|` : "";
        mermaidDiagram += `  ${fromId} -->${label} ${toId}\n`;
      });
    } else {
      // Connect sequentially as fallback
      for (let i = 0; i < nodes.length - 1; i++) {
        const fromId = `node_${nodes[i].id.replace(/-/g, "_")}`;
        const toId = `node_${nodes[i + 1].id.replace(/-/g, "_")}`;
        mermaidDiagram += `  ${fromId} --> ${toId}\n`;
      }
    }
    mermaidDiagram += "```";
  }

  // Build workflow nodes table
  let nodesTable = "";
  if (nodes.length > 0) {
    nodesTable = `| Step # | Node Name | Stage Type | Description | Key Configuration & App |
| :---: | :--- | :--- | :--- | :--- |
${nodes
  .map((n, idx) => {
    const typeBadge = `\`${n.type.replace(/_/g, " ").toUpperCase()}\``;
    const app = n.config.sourceApp || n.config.actionTarget || "Internal Pipeline";
    const action = n.config.aiAction ? `AI Action: ${n.config.aiAction}` : n.config.triggerType ? `Trigger: ${n.config.triggerType}` : "";
    const detail = [app, action].filter(Boolean).join(" • ") || "Default pipeline config";
    return `| **${idx + 1}** | **${n.name}** | ${typeBadge} | ${n.description || "Processes workflow payload"} | \`${detail}\` |`;
  })
  .join("\n")}`;
  } else {
    nodesTable = "_No active workflow pipeline nodes attached yet. Connect nodes in the Workflow Canvas to expand execution stages._";
  }

  // Detailed Node breakdowns
  let detailedNodes = "";
  if (nodes.length > 0) {
    detailedNodes = nodes
      .map((n, idx) => {
        const configEntries = Object.entries(n.config || {})
          .filter(([k, v]) => v !== undefined && v !== "" && typeof v !== "object")
          .map(([k, v]) => `  - **${k}:** \`${String(v)}\``)
          .join("\n");

        return `#### Stage ${idx + 1}: ${n.name}
- **Node Identifier:** \`${n.id}\`
- **Node Type:** \`${n.type}\`
- **Functional Description:** ${n.description || "Executes designated stage logic within the automation pipeline."}
- **Stage Configuration:**
${configEntries || "  - Standard default node settings"}
${
  n.config.promptTemplate
    ? `
- **Stage Prompt Template:**
\`\`\`
${n.config.promptTemplate}
\`\`\`
`
    : ""
}`;
      })
      .join("\n\n");
  }

  // Build permissions table
  let permissionsTable = "";
  if (grantedPerms.length > 0) {
    permissionsTable = `| Permission Name | Category | Scope Code | Risk Level |
| :--- | :--- | :--- | :---: |
${grantedPerms
  .map(
    (p) =>
      `| **${p.name}** | ${p.category} | \`${p.code}\` | \`${p.riskLevel.toUpperCase()}\` |`
  )
  .join("\n")}`;
  } else {
    permissionsTable = "_No external OAuth/API scopes assigned. Operates within sandbox execution boundaries._";
  }

  const currentDate = new Date().toISOString().split("T")[0];

  return `# 🤖 ${agent.name}

> **Role:** ${agent.role}  
> **Department:** ${agent.department}  
> **Autonomy Level:** \`${agent.autonomyLevel.toUpperCase()}\` (${autonomyNote})  
> **Foundation Model:** \`${modelName}\` (${modelProvider})  
> **Last Documented:** ${currentDate}

---

## 📌 Executive Summary
${agent.description || "Autonomous enterprise agent engineered for high-throughput workflow execution and process orchestration."}

---

## 🧠 Brain & AI Model Configuration

| Configuration Property | Value | Description |
| :--- | :--- | :--- |
| **Foundation Model** | \`${agent.model}\` (${modelName}) | Multi-turn reasoning and tool invocation core |
| **Provider** | ${modelProvider} | Enterprise GenAI infrastructure |
| **Sampling Temperature** | \`${agent.temperature}\` | ${agent.temperature < 0.4 ? "High determinism & strict policy adherence" : "Dynamic reasoning & adaptive outputs"} |
| **Context Window** | ${modelContext} | Maximum prompt & conversational token context |
| **Latency Benchmark** | ${latencyTier} | Estimated end-to-end response time |
| **Assigned Operator** | ${agent.assignedTo?.userName || "Alex Mercer"} | Primary human administrator & auditor |
| **Assigned Team** | ${agent.assignedTo?.team || "Platform Operations"} | Organizational unit governing this agent |

---

## 📜 System Prompt & Behavioral Instructions

The agent's personality, decision boundaries, and system contract are governed by the following system prompt:

\`\`\`markdown
${agent.systemPrompt.trim()}
\`\`\`

### Key Behavioral Directives
1. **Scope Adherence:** Execute only actions strictly aligned with assigned role as a **${agent.role}**.
2. **Deterministic Outputs:** Format responses according to structured expectations and schema standards.
3. **Escalation Protocol:** In the event of ambiguity, risk escalation, or unassigned permissions, trigger Human-in-the-Loop review.

---

## ⚡ Workflow Pipeline & Execution Nodes

${
  workflow
    ? `This agent is associated with the **"${workflow.name}"** enterprise workflow (${workflow.department} department).`
    : "This agent operates across assigned workflow canvas nodes and event-driven pipelines."
}

### Pipeline Sequence Diagram

${mermaidDiagram || "_Workflow diagram unavailable_"}

### Pipeline Stages Overview

${nodesTable}

${
  detailedNodes
    ? `### Detailed Stage Configuration

${detailedNodes}`
    : ""
}

---

## 🛡️ Access Control & Granted Permissions

The agent has been provisioned with the following OAuth, API, and system permissions:

${permissionsTable}

---

## 📈 Operational SLAs & Metrics

| Metric | Target / Benchmark | Current Status |
| :--- | :--- | :--- |
| **Tasks Completed** | Uncapped throughput | \`${agent.stats?.tasksCompleted ?? 0}\` tasks |
| **Estimated Hours Saved** | Continuous ROI | \`${agent.stats?.hoursSaved ?? 0}\` hours |
| **Task Success Rate** | > 98.0% target | \`${agent.stats?.successRate ?? 100.0}%\` |
| **Average Latency** | Sub-2.0 seconds | \`${agent.stats?.avgLatencySec ?? 1.2}s\` |

---

## 🔐 Security & Governance Protocols

1. **Human-in-the-Loop (HITL) Gate:** ${
    agent.autonomyLevel === "autonomous"
      ? "Fully automated dispatch with continuous telemetry auditing."
      : "Mandatory human review gate before external payloads or mutations execute."
  }
2. **Data Minimization:** Sanitizes PII before sending context to external APIs.
3. **Audit Trail:** Every execution is logged in the immutable task ledger with cryptographic run IDs and timestamps.

---
*Documentation auto-generated by AgentFlow Enterprise Architecture Studio on ${new Date().toUTCString()}*
`;
}
