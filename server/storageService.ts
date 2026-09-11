import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface TenantRecord {
  id: string;
  name: string;
  domain: string;
  plan: "starter" | "professional" | "enterprise";
  status: "active" | "suspended" | "trial";
  createdAt: string;
  seatsQuota: number;
  creditsQuota: number;
  creditsUsed: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  customBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export type EnterpriseRole = 
  | "SUPER_ADMIN"
  | "FOUNDER"
  | "SECURITY_AUDITOR"
  | "OPERATIONS_LEAD"
  | "OPERATOR"
  | "VIEWER";

export interface UserAccount {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: EnterpriseRole;
  isActive: boolean;
  mfaEnabled: boolean;
  ssoProvider?: "saml" | "google" | "local";
  createdAt: string;
  lastLoginAt?: string;
}

export interface ImmutableAuditBlock {
  index: number;
  id: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  actorRole: EnterpriseRole;
  actionType: string;
  resourceId?: string;
  agentId?: string;
  workflowId?: string;
  summary: string;
  inputHash: string;
  outputHash?: string;
  dlpRedactionsCount: number;
  status: "SUCCESS" | "WARNING" | "BLOCKED_BY_POLICY" | "HITL_PENDING";
  metadata?: Record<string, any>;
  previousHash: string;
  hash: string;
}

export interface ComplianceSignature {
  id: string;
  tenantId: string;
  documentId: string;
  documentTitle: string;
  documentVersion: string;
  documentSha256: string;
  signerEmail: string;
  signerName: string;
  signerRole: EnterpriseRole;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  signatureAttestationHash: string;
  status: "valid" | "revoked";
}

export interface VaultSecret {
  id: string;
  tenantId: string;
  keyName: string;
  maskedValue: string;
  encryptedPayload: string;
  iv: string;
  tag: string;
  category: "api_key" | "database_url" | "webhook_secret" | "oauth_token";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoiceRecord {
  id: string;
  tenantId: string;
  stripeInvoiceId: string;
  amountDueUsd: number;
  amountPaidUsd: number;
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  description: string;
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  paidAt?: string;
  clientRevenueSharePercent: number;
  platformFeeUsd: number;
  clientPayoutUsd: number;
}

interface DatabaseSchema {
  version: number;
  lastUpdated: string;
  tenants: TenantRecord[];
  users: UserAccount[];
  auditLedger: ImmutableAuditBlock[];
  complianceSignatures: ComplianceSignature[];
  vaultSecrets: VaultSecret[];
  billingInvoices: BillingInvoiceRecord[];
  taskExecutions: any[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "enterprise-db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to compute SHA-256
export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Helper for cryptographic audit block hashing
export function computeBlockHash(
  index: number,
  timestamp: string,
  tenantId: string,
  actionType: string,
  summary: string,
  previousHash: string
): string {
  const payload = `${index}|${timestamp}|${tenantId}|${actionType}|${summary}|${previousHash}`;
  return sha256(payload);
}

// Initial seed data for Enterprise multi-tenant environment
const GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
const GENESIS_SUMMARY = "Enterprise Security & Compliance Ledger Initialized with SOC2 Type II attestation baseline";
const genesisTimestamp = "2026-01-01T00:00:00.000Z";
const genesisHash = computeBlockHash(0, genesisTimestamp, "system", "SYSTEM_GENESIS_INITIALIZATION", GENESIS_SUMMARY, GENESIS_PREV_HASH);

const INITIAL_DB: DatabaseSchema = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  tenants: [
    {
      id: "tenant-apex-01",
      name: "Apex Financial Global",
      domain: "apexfin.com",
      plan: "enterprise",
      status: "active",
      createdAt: "2026-01-15T08:00:00Z",
      seatsQuota: 50,
      creditsQuota: 250000,
      creditsUsed: 42800,
      stripeCustomerId: "cus_apex_corp_01",
      stripeSubscriptionId: "sub_enterprise_annual_01",
      customBranding: {
        companyName: "Apex Financial",
        primaryColor: "#4f46e5",
      },
    },
    {
      id: "tenant-global-02",
      name: "Global Logistics Corp",
      domain: "globallogistics.com",
      plan: "professional",
      status: "active",
      createdAt: "2026-03-10T10:30:00Z",
      seatsQuota: 25,
      creditsQuota: 100000,
      creditsUsed: 18450,
      stripeCustomerId: "cus_global_logistics_02",
      stripeSubscriptionId: "sub_pro_monthly_02",
      customBranding: {
        companyName: "Global Logistics",
        primaryColor: "#0284c7",
      },
    },
    {
      id: "tenant-internal-corp",
      name: "AgentFlow Enterprise Core",
      domain: "agentflow.enterprise",
      plan: "enterprise",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      seatsQuota: 999,
      creditsQuota: 1000000,
      creditsUsed: 5420,
    },
  ],
  users: [
    {
      id: "usr-founder",
      tenantId: "tenant-internal-corp",
      email: "toppgunn321@gmail.com",
      name: "Founder & Lead Architect",
      role: "FOUNDER",
      isActive: true,
      mfaEnabled: true,
      ssoProvider: "local",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "usr-sec-audit",
      tenantId: "tenant-internal-corp",
      email: "compliance@agentflow.enterprise",
      name: "Chief Information Security Officer",
      role: "SECURITY_AUDITOR",
      isActive: true,
      mfaEnabled: true,
      ssoProvider: "local",
      createdAt: "2026-01-10T00:00:00Z",
    },
    {
      id: "usr-apex-admin",
      tenantId: "tenant-apex-01",
      email: "admin@apexfin.com",
      name: "Sarah Jenkins",
      role: "OPERATIONS_LEAD",
      isActive: true,
      mfaEnabled: true,
      ssoProvider: "saml",
      createdAt: "2026-01-15T08:30:00Z",
    },
  ],
  auditLedger: [
    {
      index: 0,
      id: "audit-block-genesis",
      timestamp: genesisTimestamp,
      tenantId: "system",
      userId: "system-kernel",
      actorRole: "SUPER_ADMIN",
      actionType: "SYSTEM_GENESIS_INITIALIZATION",
      summary: "Enterprise Security & Compliance Ledger Initialized with SOC2 Type II attestation baseline",
      inputHash: sha256("GENESIS_BOOT_PAYLOAD"),
      outputHash: sha256("GENESIS_SUCCESS"),
      dlpRedactionsCount: 0,
      status: "SUCCESS",
      previousHash: GENESIS_PREV_HASH,
      hash: genesisHash,
    },
  ],
  complianceSignatures: [
    {
      id: "sig-soc2-baseline",
      tenantId: "tenant-internal-corp",
      documentId: "doc-soc2-governance",
      documentTitle: "SOC 2 Type II Autonomous AI Security & Continuous Audit Policy",
      documentVersion: "2026.4",
      documentSha256: sha256("SOC2_POLICY_TEXT_STUB_2026"),
      signerEmail: "toppgunn321@gmail.com",
      signerName: "Lead System Architect",
      signerRole: "FOUNDER",
      signedAt: "2026-02-01T14:30:00Z",
      ipAddress: "127.0.0.1",
      userAgent: "AgentFlow-Enterprise-Core/2.0",
      signatureAttestationHash: sha256("SIG_ATTESTATION_SOC2_INITIAL"),
      status: "valid",
    },
  ],
  vaultSecrets: [],
  billingInvoices: [
    {
      id: "inv-init-001",
      tenantId: "tenant-apex-01",
      stripeInvoiceId: "in_1OwApexCorporateInvoice",
      amountDueUsd: 12500,
      amountPaidUsd: 12500,
      currency: "USD",
      status: "paid",
      description: "Enterprise Fleet License - Q1 2026 (50 Agent Seats)",
      hostedInvoiceUrl: "https://pay.stripe.com/invoice/in_1OwApexCorporateInvoice",
      createdAt: "2026-01-15T08:45:00Z",
      paidAt: "2026-01-15T09:12:00Z",
      clientRevenueSharePercent: 90,
      platformFeeUsd: 1250,
      clientPayoutUsd: 11250,
    },
  ],
  taskExecutions: [],
};

class EnterpriseDatabase {
  private db: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        // Validate basic integrity
        if (parsed && Array.isArray(parsed.auditLedger) && Array.isArray(parsed.tenants)) {
          if (parsed.auditLedger.length > 0 && parsed.auditLedger[0].id === "audit-block-genesis") {
            parsed.auditLedger[0].timestamp = genesisTimestamp;
            parsed.auditLedger[0].summary = GENESIS_SUMMARY;
            parsed.auditLedger[0].previousHash = GENESIS_PREV_HASH;
            parsed.auditLedger[0].hash = genesisHash;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[Enterprise DB] Warning reading database file, restoring defaults:", err);
    }
    // Write fresh database
    this.saveSync(INITIAL_DB);
    return JSON.parse(JSON.stringify(INITIAL_DB));
  }

  private saveSync(data: DatabaseSchema): void {
    try {
      data.lastUpdated = new Date().toISOString();
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error("[Enterprise DB] Error persisting database:", err);
    }
  }

  private persist(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    setTimeout(() => {
      this.saveSync(this.db);
      this.isSaving = false;
    }, 15);
  }

  // --- Tenants ---
  public getTenants(): TenantRecord[] {
    return this.db.tenants;
  }

  public getTenant(id: string): TenantRecord | undefined {
    return this.db.tenants.find((t) => t.id === id);
  }

  public saveTenant(tenant: TenantRecord): TenantRecord {
    const idx = this.db.tenants.findIndex((t) => t.id === tenant.id);
    if (idx >= 0) {
      this.db.tenants[idx] = tenant;
    } else {
      this.db.tenants.push(tenant);
    }
    this.persist();
    return tenant;
  }

  // --- Users & RBAC ---
  public getUsers(tenantId?: string): UserAccount[] {
    if (tenantId) {
      return this.db.users.filter((u) => u.tenantId === tenantId);
    }
    return this.db.users;
  }

  public getUserByEmail(email: string): UserAccount | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: UserAccount): UserAccount {
    const idx = this.db.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.db.users[idx] = user;
    } else {
      this.db.users.push(user);
    }
    this.persist();
    return user;
  }

  // --- Immutable Audit Ledger ---
  public getAuditLedger(limit = 100, tenantId?: string): ImmutableAuditBlock[] {
    let list = this.db.auditLedger;
    if (tenantId && tenantId !== "system") {
      list = list.filter((b) => b.tenantId === tenantId || b.tenantId === "system");
    }
    return list.slice(-limit).reverse();
  }

  public appendAuditBlock(blockData: Omit<ImmutableAuditBlock, "index" | "id" | "previousHash" | "hash">): ImmutableAuditBlock {
    const lastBlock = this.db.auditLedger[this.db.auditLedger.length - 1];
    const index = lastBlock ? lastBlock.index + 1 : 0;
    const previousHash = lastBlock ? lastBlock.hash : GENESIS_PREV_HASH;
    const id = `audit-block-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const hash = computeBlockHash(index, blockData.timestamp, blockData.tenantId, blockData.actionType, blockData.summary, previousHash);

    const fullBlock: ImmutableAuditBlock = {
      index,
      id,
      previousHash,
      hash,
      ...blockData,
    };

    this.db.auditLedger.push(fullBlock);
    this.persist();
    return fullBlock;
  }

  public verifyLedgerIntegrity(): {
    isValid: boolean;
    blocksChecked: number;
    corruptedIndex: number | null;
    tamperReason?: string;
  } {
    const ledger = this.db.auditLedger;
    if (ledger.length === 0) {
      return { isValid: true, blocksChecked: 0, corruptedIndex: null };
    }

    for (let i = 0; i < ledger.length; i++) {
      const current = ledger[i];
      const expectedPrev = i === 0 ? GENESIS_PREV_HASH : ledger[i - 1].hash;

      if (current.previousHash !== expectedPrev) {
        return {
          isValid: false,
          blocksChecked: i,
          corruptedIndex: i,
          tamperReason: `Previous hash pointer mismatch at block #${i}. Expected: ${expectedPrev.slice(0, 16)}..., Found: ${current.previousHash.slice(0, 16)}...`,
        };
      }

      const calculatedHash = computeBlockHash(
        current.index,
        current.timestamp,
        current.tenantId,
        current.actionType,
        current.summary,
        current.previousHash
      );

      if (calculatedHash !== current.hash) {
        return {
          isValid: false,
          blocksChecked: i,
          corruptedIndex: i,
          tamperReason: `Cryptographic payload hash mismatch at block #${i}. Block content modified.`,
        };
      }
    }

    return {
      isValid: true,
      blocksChecked: ledger.length,
      corruptedIndex: null,
    };
  }

  // --- Compliance Signatures ---
  public getSignatures(tenantId?: string): ComplianceSignature[] {
    if (tenantId) {
      return this.db.complianceSignatures.filter((s) => s.tenantId === tenantId);
    }
    return this.db.complianceSignatures;
  }

  public recordComplianceSignature(signature: ComplianceSignature): ComplianceSignature {
    this.db.complianceSignatures.push(signature);
    this.persist();
    return signature;
  }

  // --- Billing Invoices ---
  public getInvoices(tenantId?: string): BillingInvoiceRecord[] {
    if (tenantId) {
      return this.db.billingInvoices.filter((inv) => inv.tenantId === tenantId);
    }
    return this.db.billingInvoices;
  }

  public saveInvoice(invoice: BillingInvoiceRecord): BillingInvoiceRecord {
    const idx = this.db.billingInvoices.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      this.db.billingInvoices[idx] = invoice;
    } else {
      this.db.billingInvoices.push(invoice);
    }
    this.persist();
    return invoice;
  }

  // --- Vault Secrets ---
  public getVaultSecrets(tenantId: string): VaultSecret[] {
    return this.db.vaultSecrets.filter((s) => s.tenantId === tenantId);
  }

  public saveVaultSecret(secret: VaultSecret): VaultSecret {
    const idx = this.db.vaultSecrets.findIndex((s) => s.id === secret.id);
    if (idx >= 0) {
      this.db.vaultSecrets[idx] = secret;
    } else {
      this.db.vaultSecrets.push(secret);
    }
    this.persist();
    return secret;
  }

  public deleteVaultSecret(id: string, tenantId: string): boolean {
    const initLen = this.db.vaultSecrets.length;
    this.db.vaultSecrets = this.db.vaultSecrets.filter((s) => !(s.id === id && s.tenantId === tenantId));
    if (this.db.vaultSecrets.length !== initLen) {
      this.persist();
      return true;
    }
    return false;
  }
}

export const enterpriseDb = new EnterpriseDatabase();
