import { WorkflowNode, WorkflowConnection, NodeType } from "../types";

export interface WorkflowValidationError {
  id: string;
  type: "broken_connection" | "missing_field" | "structural";
  severity: "error" | "warning";
  title: string;
  message: string;
  nodeId?: string;
  connectionId?: string;
  field?: string;
  port?: "in" | "out" | "true" | "false";
}

export interface WorkflowValidationReport {
  isValid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationError[];
  brokenConnectionIds: Set<string>;
  invalidNodeIds: Set<string>;
  nodeErrorMap: Map<string, string[]>;
  nodeFieldErrors: Map<string, Record<string, string>>;
  brokenNodePorts: Map<string, Set<"in" | "out" | "true" | "false">>;
  stats: {
    totalErrors: number;
    brokenConnectionsCount: number;
    missingFieldsCount: number;
    structuralCount: number;
  };
}

/**
 * Real-time validation check for Workflow Pipelines.
 * Analyzes connections and node configurations to detect broken links,
 * missing configuration fields, and structural pipeline defects.
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): WorkflowValidationReport {
  const errors: WorkflowValidationError[] = [];
  const warnings: WorkflowValidationError[] = [];
  const brokenConnectionIds = new Set<string>();
  const invalidNodeIds = new Set<string>();
  const nodeErrorMap = new Map<string, string[]>();
  const nodeFieldErrors = new Map<string, Record<string, string>>();
  const brokenNodePorts = new Map<string, Set<"in" | "out" | "true" | "false">>();

  // Helper to record node errors
  const recordNodeError = (
    nodeId: string,
    message: string,
    field?: string,
    port?: "in" | "out" | "true" | "false"
  ) => {
    invalidNodeIds.add(nodeId);
    
    const existing = nodeErrorMap.get(nodeId) || [];
    existing.push(message);
    nodeErrorMap.set(nodeId, existing);

    if (field) {
      const fieldMap = nodeFieldErrors.get(nodeId) || {};
      fieldMap[field] = message;
      nodeFieldErrors.set(nodeId, fieldMap);
    }

    if (port) {
      const portSet = brokenNodePorts.get(nodeId) || new Set<"in" | "out" | "true" | "false">();
      portSet.add(port);
      brokenNodePorts.set(nodeId, portSet);
    }
  };

  const nodeMap = new Map<string, WorkflowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // 1. Pipeline-Level Structural Integrity
  if (nodes.length === 0) {
    errors.push({
      id: "err-empty-pipeline",
      type: "structural",
      severity: "error",
      title: "Empty Pipeline Canvas",
      message: "The workflow has no components. Add at least one Trigger and one Action to deploy.",
    });
  } else {
    const hasTrigger = nodes.some((n) => n.type === "trigger");
    if (!hasTrigger) {
      errors.push({
        id: "err-missing-trigger",
        type: "structural",
        severity: "error",
        title: "Missing Entry Trigger",
        message: "The automation pipeline requires an initial Trigger node (e.g. Webhook, Schedule, or Event) to begin execution.",
      });
    }
  }

  // 2. Broken / Dangling / Duplicate Connection Validation
  const connectionKeysSeen = new Set<string>();

  connections.forEach((conn) => {
    const sourceNode = nodeMap.get(conn.from);
    const targetNode = nodeMap.get(conn.to);

    // Dangling source
    if (!sourceNode) {
      brokenConnectionIds.add(conn.id);
      errors.push({
        id: `err-broken-source-${conn.id}`,
        type: "broken_connection",
        severity: "error",
        title: "Broken Connection (Missing Source)",
        message: `Connection #${conn.id.slice(-4)} originates from non-existent node (${conn.from}). The source node may have been removed.`,
        connectionId: conn.id,
      });
      if (targetNode) {
        recordNodeError(targetNode.id, "Connected to a deleted or non-existent source node.", undefined, "in");
      }
      return;
    }

    // Dangling target
    if (!targetNode) {
      brokenConnectionIds.add(conn.id);
      errors.push({
        id: `err-broken-target-${conn.id}`,
        type: "broken_connection",
        severity: "error",
        title: "Broken Connection (Missing Target)",
        message: `Connection from "${sourceNode.name}" points to non-existent node (${conn.to}). The destination node may have been removed.`,
        nodeId: sourceNode.id,
        connectionId: conn.id,
      });
      recordNodeError(sourceNode.id, `Outgoing link points to deleted node (${conn.to}).`, undefined, conn.fromPort || "out");
      return;
    }

    // Self-loop
    if (conn.from === conn.to) {
      brokenConnectionIds.add(conn.id);
      errors.push({
        id: `err-self-loop-${conn.id}`,
        type: "broken_connection",
        severity: "error",
        title: "Invalid Self-Referencing Connection",
        message: `Node "${sourceNode.name}" connects directly into itself, creating an infinite recursion loop.`,
        nodeId: sourceNode.id,
        connectionId: conn.id,
      });
      recordNodeError(sourceNode.id, "Self-referencing loop detected.", undefined, conn.fromPort || "out");
      return;
    }

    // Duplicate Connection
    const portKey = `${conn.from}->${conn.to}@${conn.fromPort || "out"}`;
    if (connectionKeysSeen.has(portKey)) {
      brokenConnectionIds.add(conn.id);
      errors.push({
        id: `err-duplicate-conn-${conn.id}`,
        type: "broken_connection",
        severity: "error",
        title: "Duplicate Connection Cable",
        message: `Multiple identical connections exist between "${sourceNode.name}" and "${targetNode.name}".`,
        nodeId: sourceNode.id,
        connectionId: conn.id,
      });
      return;
    }
    connectionKeysSeen.add(portKey);
  });

  // 3. Node Graph Connectivity & Reachability Validation
  nodes.forEach((node) => {
    const incoming = connections.filter((c) => c.to === node.id && nodeMap.has(c.from));
    const outgoing = connections.filter((c) => c.from === node.id && nodeMap.has(c.to));

    // A. Triggers: Entry points must have outgoing connections
    if (node.type === "trigger") {
      if (outgoing.length === 0) {
        errors.push({
          id: `err-unconnected-trigger-${node.id}`,
          type: "broken_connection",
          severity: "error",
          title: "Unconnected Trigger",
          message: `Trigger "${node.name}" is not wired to any downstream pipeline steps.`,
          nodeId: node.id,
          port: "out",
        });
        recordNodeError(node.id, "Trigger is missing outgoing connection to initiate downstream pipeline actions.", undefined, "out");
      }
    } else {
      // B. Non-Triggers: Must have at least one incoming connection to be reachable
      if (incoming.length === 0) {
        errors.push({
          id: `err-unreachable-node-${node.id}`,
          type: "broken_connection",
          severity: "error",
          title: "Unreachable Pipeline Step",
          message: `Node "${node.name}" has no incoming connection and will never be executed.`,
          nodeId: node.id,
          port: "in",
        });
        recordNodeError(node.id, "Node has no incoming connection from preceding steps.", undefined, "in");
      }
    }

    // C. Condition Nodes: Must route both TRUE and FALSE branches
    if (node.type === "condition") {
      const hasTrueBranch = outgoing.some(
        (c) => c.fromPort === "true" || c.branchType === "true"
      );
      const hasFalseBranch = outgoing.some(
        (c) => c.fromPort === "false" || c.branchType === "false"
      );

      if (!hasTrueBranch) {
        errors.push({
          id: `err-condition-true-branch-${node.id}`,
          type: "broken_connection",
          severity: "error",
          title: "Missing TRUE Branch Route",
          message: `Condition "${node.name}" does not have a connection on its TRUE/Pass branch port.`,
          nodeId: node.id,
          port: "true",
        });
        recordNodeError(node.id, "Condition missing TRUE/Pass branch route.", undefined, "true");
      }

      if (!hasFalseBranch) {
        errors.push({
          id: `err-condition-false-branch-${node.id}`,
          type: "broken_connection",
          severity: "error",
          title: "Missing FALSE Branch Route",
          message: `Condition "${node.name}" does not have a connection on its FALSE/Fallback branch port.`,
          nodeId: node.id,
          port: "false",
        });
        recordNodeError(node.id, "Condition missing FALSE/Fallback branch route.", undefined, "false");
      }
    } else if (node.type !== "action_output" && node.type !== "trigger") {
      // D. Intermediate Nodes: Must route forward unless it is an explicit action_output endpoint
      if (outgoing.length === 0) {
        errors.push({
          id: `err-dead-end-node-${node.id}`,
          type: "broken_connection",
          severity: "error",
          title: "Dead-End Intermediate Step",
          message: `Node "${node.name}" does not route forward to any destination or downstream action.`,
          nodeId: node.id,
          port: "out",
        });
        recordNodeError(node.id, "Intermediate node has no outgoing route.", undefined, "out");
      }
    }

    // 4. Missing Configuration Fields Validation
    if (!node.name || !node.name.trim()) {
      errors.push({
        id: `err-missing-name-${node.id}`,
        type: "missing_field",
        severity: "error",
        title: "Missing Component Name",
        message: `A component on the canvas has an empty name.`,
        nodeId: node.id,
        field: "name",
      });
      recordNodeError(node.id, "Component name cannot be empty.", "name");
    }

    const cfg = node.config || {};

    switch (node.type) {
      case "trigger":
        if (!cfg.triggerType || !cfg.triggerType.trim()) {
          errors.push({
            id: `err-cfg-triggerType-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing Trigger Configuration",
            message: `Trigger "${node.name}" is missing its Trigger Type specification.`,
            nodeId: node.id,
            field: "triggerType",
          });
          recordNodeError(node.id, "Trigger Type is required (e.g. HTTP Webhook, Cron Schedule).", "triggerType");
        }
        break;

      case "data_source":
        if (!cfg.sourceApp || !cfg.sourceApp.trim()) {
          errors.push({
            id: `err-cfg-sourceApp-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing Data Source",
            message: `Data Connector "${node.name}" is missing its Source Application / Connector.`,
            nodeId: node.id,
            field: "sourceApp",
          });
          recordNodeError(node.id, "Source Application is required (e.g. Salesforce, PostgreSQL, Drive).", "sourceApp");
        }
        break;

      case "ai_process":
        if (!cfg.promptTemplate || !cfg.promptTemplate.trim()) {
          errors.push({
            id: `err-cfg-promptTemplate-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing AI Prompt Directive",
            message: `AI Processing step "${node.name}" has an empty prompt directive.`,
            nodeId: node.id,
            field: "promptTemplate",
          });
          recordNodeError(node.id, "Gemini Prompt Directive is required for AI reasoning step.", "promptTemplate");
        }
        if (!cfg.aiAction) {
          errors.push({
            id: `err-cfg-aiAction-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing AI Action Type",
            message: `AI Processing step "${node.name}" has no action mode specified.`,
            nodeId: node.id,
            field: "aiAction",
          });
          recordNodeError(node.id, "AI Action Type is required (e.g. generate, classify, extract).", "aiAction");
        }
        break;

      case "condition":
        if (!cfg.conditionField || !cfg.conditionField.trim()) {
          errors.push({
            id: `err-cfg-conditionField-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing Condition Evaluation Field",
            message: `Condition "${node.name}" is missing the payload field to evaluate.`,
            nodeId: node.id,
            field: "conditionField",
          });
          recordNodeError(node.id, "Payload field to evaluate is required (e.g. confidence, tier).", "conditionField");
        }
        if (!cfg.conditionOperator) {
          errors.push({
            id: `err-cfg-conditionOperator-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing Condition Operator",
            message: `Condition "${node.name}" is missing its comparison operator.`,
            nodeId: node.id,
            field: "conditionOperator",
          });
          recordNodeError(node.id, "Comparison operator is required.", "conditionOperator");
        }
        if (!cfg.conditionValue || !cfg.conditionValue.trim()) {
          errors.push({
            id: `err-cfg-conditionValue-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing Expected Value",
            message: `Condition "${node.name}" is missing the expected comparison value.`,
            nodeId: node.id,
            field: "conditionValue",
          });
          recordNodeError(node.id, "Expected comparison value is required.", "conditionValue");
        }
        break;

      case "human_review":
        if (!cfg.approverRole || !cfg.approverRole.trim()) {
          errors.push({
            id: `err-cfg-approverRole-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing Approver Role",
            message: `Human Review step "${node.name}" has no designated approver role.`,
            nodeId: node.id,
            field: "approverRole",
          });
          recordNodeError(node.id, "Designated Approver Role or specialist is required.", "approverRole");
        }
        break;

      case "action_output":
        if (!cfg.actionTarget || !cfg.actionTarget.trim()) {
          errors.push({
            id: `err-cfg-actionTarget-${node.id}`,
            type: "missing_field",
            severity: "error",
            title: "Missing Action Target",
            message: `Output Action "${node.name}" has no destination system or channel.`,
            nodeId: node.id,
            field: "actionTarget",
          });
          recordNodeError(node.id, "Action Target is required (e.g. Slack Channel, Jira, Corporate Email).", "actionTarget");
        }
        break;

      default:
        break;
    }
  });

  const brokenConnectionsCount = errors.filter((e) => e.type === "broken_connection").length;
  const missingFieldsCount = errors.filter((e) => e.type === "missing_field").length;
  const structuralCount = errors.filter((e) => e.type === "structural").length;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    brokenConnectionIds,
    invalidNodeIds,
    nodeErrorMap,
    nodeFieldErrors,
    brokenNodePorts,
    stats: {
      totalErrors: errors.length,
      brokenConnectionsCount,
      missingFieldsCount,
      structuralCount,
    },
  };
}

/**
 * Automatically cleans up broken connections (dangling endpoints, self-loops, duplicate edges)
 * and fills default configuration values for missing required fields.
 */
export function autoRepairWorkflow(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): { repairedNodes: WorkflowNode[]; repairedConnections: WorkflowConnection[]; repairsCount: number } {
  let repairsCount = 0;
  const nodeMap = new Map<string, WorkflowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // 1. Prune dangling, self-referencing, and duplicate connections
  const seenKeys = new Set<string>();
  const repairedConnections = connections.filter((conn) => {
    const hasSource = nodeMap.has(conn.from);
    const hasTarget = nodeMap.has(conn.to);
    const isSelfLoop = conn.from === conn.to;
    const portKey = `${conn.from}->${conn.to}@${conn.fromPort || "out"}`;
    const isDuplicate = seenKeys.has(portKey);

    if (!hasSource || !hasTarget || isSelfLoop || isDuplicate) {
      repairsCount++;
      return false;
    }
    seenKeys.add(portKey);
    return true;
  });

  // 2. Auto-fill missing required configuration fields with sane enterprise defaults
  const repairedNodes = nodes.map((node) => {
    let modified = false;
    const cfg = { ...(node.config || {}) };
    let newName = node.name;

    if (!newName || !newName.trim()) {
      newName = `Pipeline Step (${node.type.replace("_", " ")})`;
      modified = true;
      repairsCount++;
    }

    switch (node.type) {
      case "trigger":
        if (!cfg.triggerType || !cfg.triggerType.trim()) {
          cfg.triggerType = "HTTP Webhook";
          modified = true;
          repairsCount++;
        }
        break;
      case "data_source":
        if (!cfg.sourceApp || !cfg.sourceApp.trim()) {
          cfg.sourceApp = "Internal Warehouse DB";
          modified = true;
          repairsCount++;
        }
        break;
      case "ai_process":
        if (!cfg.promptTemplate || !cfg.promptTemplate.trim()) {
          cfg.promptTemplate = "Analyze the payload data, identify key operational parameters, and output structured remediation JSON.";
          modified = true;
          repairsCount++;
        }
        if (!cfg.aiAction) {
          cfg.aiAction = "generate";
          modified = true;
          repairsCount++;
        }
        break;
      case "condition":
        if (!cfg.conditionField || !cfg.conditionField.trim()) {
          cfg.conditionField = "confidence";
          modified = true;
          repairsCount++;
        }
        if (!cfg.conditionOperator) {
          cfg.conditionOperator = "greater_than";
          modified = true;
          repairsCount++;
        }
        if (!cfg.conditionValue || !cfg.conditionValue.trim()) {
          cfg.conditionValue = "0.85";
          modified = true;
          repairsCount++;
        }
        if (!cfg.trueBranchLabel) {
          cfg.trueBranchLabel = "Pass / High Confidence";
          modified = true;
        }
        if (!cfg.falseBranchLabel) {
          cfg.falseBranchLabel = "Fallback / Review";
          modified = true;
        }
        break;
      case "human_review":
        if (!cfg.approverRole || !cfg.approverRole.trim()) {
          cfg.approverRole = "Automation Lead Specialist";
          modified = true;
          repairsCount++;
        }
        break;
      case "action_output":
        if (!cfg.actionTarget || !cfg.actionTarget.trim()) {
          cfg.actionTarget = "Enterprise Slack / Notification Feed";
          modified = true;
          repairsCount++;
        }
        break;
    }

    return modified ? { ...node, name: newName, config: cfg } : node;
  });

  return { repairedNodes, repairedConnections, repairsCount };
}
