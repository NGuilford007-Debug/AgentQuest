import { enterpriseDb, EnterpriseRole } from "./storageService";
import { recordAuditBlock } from "./auditComplianceService";
import { scanAndMaskDlp } from "./dlpService";

export interface WorkflowNode {
  id: string;
  type: string; // 'trigger' | 'action' | 'condition' | 'permission_gate' | 'human_review' | 'ai_prompt'
  title: string;
  config?: Record<string, any>;
}

export interface WorkflowStepResult {
  nodeId: string;
  nodeTitle: string;
  type: string;
  status: "COMPLETED" | "SKIPPED" | "BLOCKED" | "WAITING_APPROVAL";
  output: any;
  durationMs: number;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  tenantId: string;
  status: "SUCCESS" | "BLOCKED_BY_DLP" | "WAITING_HITL_APPROVAL" | "FAILED";
  summary: string;
  steps: WorkflowStepResult[];
  hitlTicket?: {
    ticketId: string;
    nodeId: string;
    reason: string;
    pendingAction: string;
  };
  totalDurationMs: number;
  dlpRedactionsCount: number;
}

// In-memory active HITL tickets for real-time human approval
const activeHitlTickets = new Map<string, {
  ticketId: string;
  executionId: string;
  workflowId: string;
  tenantId: string;
  nodeId: string;
  payload: any;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}>();

/**
 * Orchestrates step-by-step workflow execution with DLP scanning and HITL gates.
 */
export async function executeWorkflowPipeline(params: {
  workflowId: string;
  workflowName: string;
  tenantId: string;
  userId: string;
  actorRole: EnterpriseRole;
  nodes: WorkflowNode[];
  initialPayload: any;
}): Promise<WorkflowExecutionResult> {
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startTime = Date.now();
  const stepResults: WorkflowStepResult[] = [];
  let currentPayload = params.initialPayload;
  let totalDlpRedactions = 0;

  // 1. Initial DLP inspection on incoming task input
  const rawInputStr = typeof currentPayload === "string" ? currentPayload : JSON.stringify(currentPayload || "");
  const dlpResult = scanAndMaskDlp(rawInputStr);
  totalDlpRedactions += dlpResult.totalRedactionsCount;

  if (dlpResult.criticalViolationsCount > 0) {
    recordAuditBlock({
      tenantId: params.tenantId,
      userId: params.userId,
      actorRole: params.actorRole,
      actionType: "WORKFLOW_DLP_BLOCKED",
      workflowId: params.workflowId,
      summary: `Workflow execution halted due to ${dlpResult.criticalViolationsCount} critical credential/PII leaks.`,
      inputPayload: { findings: dlpResult.findings },
      dlpRedactionsCount: totalDlpRedactions,
      status: "BLOCKED_BY_POLICY",
    });

    return {
      executionId,
      workflowId: params.workflowId,
      tenantId: params.tenantId,
      status: "BLOCKED_BY_DLP",
      summary: `Pipeline halted by DLP filter: Detected ${dlpResult.criticalViolationsCount} sensitive credential/PII patterns.`,
      steps: [],
      totalDurationMs: Date.now() - startTime,
      dlpRedactionsCount: totalDlpRedactions,
    };
  }

  // 2. Step-by-step pipeline execution
  for (const node of params.nodes) {
    const nodeStart = Date.now();

    // Check for Human-In-The-Loop gate
    if (node.type === "human_review" || (node.config && node.config.requiresHumanApproval)) {
      const ticketId = `hitl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      activeHitlTickets.set(ticketId, {
        ticketId,
        executionId,
        workflowId: params.workflowId,
        tenantId: params.tenantId,
        nodeId: node.id,
        payload: currentPayload,
        status: "PENDING",
        requestedAt: new Date().toISOString(),
      });

      stepResults.push({
        nodeId: node.id,
        nodeTitle: node.title,
        type: node.type,
        status: "WAITING_APPROVAL",
        output: {
          ticketId,
          message: "Execution paused. Awaiting human administrator sign-off.",
        },
        durationMs: Date.now() - nodeStart,
      });

      recordAuditBlock({
        tenantId: params.tenantId,
        userId: params.userId,
        actorRole: params.actorRole,
        actionType: "WORKFLOW_HITL_PAUSED",
        workflowId: params.workflowId,
        resourceId: ticketId,
        summary: `Workflow paused at HITL Gate: "${node.title}". Created ticket ${ticketId}.`,
        status: "HITL_PENDING",
      });

      return {
        executionId,
        workflowId: params.workflowId,
        tenantId: params.tenantId,
        status: "WAITING_HITL_APPROVAL",
        summary: `Workflow paused at human approval gate "${node.title}". Ticket ${ticketId} generated.`,
        steps: stepResults,
        hitlTicket: {
          ticketId,
          nodeId: node.id,
          reason: node.config?.approvalReason || "Production write requires human authorization.",
          pendingAction: node.title,
        },
        totalDurationMs: Date.now() - startTime,
        dlpRedactionsCount: totalDlpRedactions,
      };
    }

    // Standard node execution
    stepResults.push({
      nodeId: node.id,
      nodeTitle: node.title,
      type: node.type,
      status: "COMPLETED",
      output: {
        executed: true,
        summary: `Processed step "${node.title}" successfully`,
        data: currentPayload,
      },
      durationMs: Date.now() - nodeStart,
    });
  }

  const totalDuration = Date.now() - startTime;

  recordAuditBlock({
    tenantId: params.tenantId,
    userId: params.userId,
    actorRole: params.actorRole,
    actionType: "WORKFLOW_PIPELINE_COMPLETED",
    workflowId: params.workflowId,
    summary: `Executed workflow "${params.workflowName}" (${params.nodes.length} nodes) in ${totalDuration}ms.`,
    inputPayload: { nodesCount: params.nodes.length },
    outputPayload: { stepCount: stepResults.length },
    dlpRedactionsCount: totalDlpRedactions,
    status: "SUCCESS",
  });

  return {
    executionId,
    workflowId: params.workflowId,
    tenantId: params.tenantId,
    status: "SUCCESS",
    summary: `Workflow completed all ${params.nodes.length} nodes in ${totalDuration}ms with 0 policy breaches.`,
    steps: stepResults,
    totalDurationMs: totalDuration,
    dlpRedactionsCount: totalDlpRedactions,
  };
}

/**
 * Resolves a pending HITL ticket (Approve or Reject).
 */
export function resolveHitlTicket(params: {
  ticketId: string;
  decision: "APPROVED" | "REJECTED";
  resolvedBy: string;
  notes?: string;
}): { success: boolean; message: string } {
  const ticket = activeHitlTickets.get(params.ticketId);
  if (!ticket) {
    return { success: false, message: `Ticket ${params.ticketId} not found or expired.` };
  }

  ticket.status = params.decision;
  ticket.resolvedAt = new Date().toISOString();
  ticket.resolvedBy = params.resolvedBy;

  recordAuditBlock({
    tenantId: ticket.tenantId,
    userId: params.resolvedBy,
    actorRole: "OPERATIONS_LEAD",
    actionType: params.decision === "APPROVED" ? "HITL_GATE_APPROVED" : "HITL_GATE_REJECTED",
    resourceId: params.ticketId,
    workflowId: ticket.workflowId,
    summary: `Human Administrator ${params.decision.toLowerCase()} HITL ticket ${params.ticketId}. Notes: ${params.notes || "None"}`,
    status: params.decision === "APPROVED" ? "SUCCESS" : "BLOCKED_BY_POLICY",
  });

  return {
    success: true,
    message: `Ticket ${params.ticketId} successfully marked as ${params.decision}.`,
  };
}

export function getActiveHitlTickets(tenantId?: string) {
  const list = Array.from(activeHitlTickets.values());
  if (tenantId) {
    return list.filter((t) => t.tenantId === tenantId);
  }
  return list;
}
