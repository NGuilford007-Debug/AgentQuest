import { enterpriseDb, ImmutableAuditBlock, ComplianceSignature, EnterpriseRole, sha256 } from "./storageService";

export interface LogAuditOptions {
  tenantId: string;
  userId: string;
  actorRole: EnterpriseRole;
  actionType: string;
  summary: string;
  resourceId?: string;
  agentId?: string;
  workflowId?: string;
  inputPayload?: any;
  outputPayload?: any;
  dlpRedactionsCount?: number;
  status?: "SUCCESS" | "WARNING" | "BLOCKED_BY_POLICY" | "HITL_PENDING";
  metadata?: Record<string, any>;
}

/**
 * Appends a cryptographically verified, immutable block to the compliance audit ledger.
 */
export function recordAuditBlock(options: LogAuditOptions): ImmutableAuditBlock {
  const inputStr = typeof options.inputPayload === "string" 
    ? options.inputPayload 
    : JSON.stringify(options.inputPayload || "");
  const outputStr = typeof options.outputPayload === "string" 
    ? options.outputPayload 
    : JSON.stringify(options.outputPayload || "");

  return enterpriseDb.appendAuditBlock({
    timestamp: new Date().toISOString(),
    tenantId: options.tenantId || "system",
    userId: options.userId || "anonymous",
    actorRole: options.actorRole || "OPERATOR",
    actionType: options.actionType,
    resourceId: options.resourceId,
    agentId: options.agentId,
    workflowId: options.workflowId,
    summary: options.summary,
    inputHash: sha256(inputStr),
    outputHash: outputStr ? sha256(outputStr) : undefined,
    dlpRedactionsCount: options.dlpRedactionsCount || 0,
    status: options.status || "SUCCESS",
    metadata: options.metadata,
  });
}

/**
 * Signs and seals an enterprise legal or compliance document with cryptographic attestation.
 */
export function signComplianceDocument(params: {
  tenantId: string;
  documentId: string;
  documentTitle: string;
  documentVersion: string;
  documentContent: string;
  signerEmail: string;
  signerName: string;
  signerRole: EnterpriseRole;
  ipAddress: string;
  userAgent: string;
}): ComplianceSignature {
  const docHash = sha256(params.documentContent);
  const timestamp = new Date().toISOString();
  
  // Create cryptographic attestation hash over document, signer, timestamp, and IP
  const attestationPayload = `${params.tenantId}|${params.documentId}|${docHash}|${params.signerEmail}|${timestamp}|${params.ipAddress}`;
  const signatureAttestationHash = sha256(attestationPayload);

  const signature: ComplianceSignature = {
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tenantId: params.tenantId,
    documentId: params.documentId,
    documentTitle: params.documentTitle,
    documentVersion: params.documentVersion,
    documentSha256: docHash,
    signerEmail: params.signerEmail,
    signerName: params.signerName,
    signerRole: params.signerRole,
    signedAt: timestamp,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    signatureAttestationHash,
    status: "valid",
  };

  enterpriseDb.recordComplianceSignature(signature);

  // Also log to immutable audit ledger
  recordAuditBlock({
    tenantId: params.tenantId,
    userId: params.signerEmail,
    actorRole: params.signerRole,
    actionType: "COMPLIANCE_DOCUMENT_SIGNED",
    resourceId: params.documentId,
    summary: `Executed legally binding cryptographic signature for "${params.documentTitle}" (v${params.documentVersion})`,
    inputPayload: { documentId: params.documentId, docHash },
    outputPayload: { signatureAttestationHash },
    status: "SUCCESS",
    metadata: {
      documentTitle: params.documentTitle,
      version: params.documentVersion,
      ip: params.ipAddress,
    },
  });

  return signature;
}

/**
 * Returns complete verification diagnostics for the compliance audit trail.
 */
export function verifyComplianceLedger() {
  return enterpriseDb.verifyLedgerIntegrity();
}
