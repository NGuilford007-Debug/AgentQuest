import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { enterpriseDb, EnterpriseRole, VaultSecret } from "./storageService";

// Master AES-256-GCM Vault Key (derived from environment or secure fallback)
const VAULT_KEY = crypto
  .createHash("sha256")
  .update(process.env.AUTH_SESSION_SECRET || "agentflow-enterprise-vault-master-key-seed-2026")
  .digest();

export const ROLE_PERMISSIONS: Record<EnterpriseRole, string[]> = {
  SUPER_ADMIN: ["*"],
  FOUNDER: ["*"],
  SECURITY_AUDITOR: [
    "audit:read",
    "audit:verify",
    "compliance:read",
    "compliance:sign",
    "dlp:inspect",
    "tenants:read",
    "vault:read_metadata",
  ],
  OPERATIONS_LEAD: [
    "agents:read",
    "agents:create",
    "agents:edit",
    "agents:execute",
    "workflows:execute",
    "hitl:approve",
    "hitl:reject",
    "billing:read",
    "billing:create_invoice",
    "tenants:read",
  ],
  OPERATOR: [
    "agents:read",
    "agents:execute",
    "workflows:execute",
    "tasks:dispatch",
    "analytics:read",
  ],
  VIEWER: [
    "agents:read",
    "workflows:read",
    "analytics:read",
  ],
};

export function hasPermission(role: EnterpriseRole, requiredPermission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  return perms.includes(requiredPermission);
}

/**
 * Express middleware to isolate requests to a valid tenant.
 */
export function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant-apex-01";
  const tenant = enterpriseDb.getTenant(tenantId);
  
  // Attach tenant to request object
  (req as any).tenant = tenant || {
    id: tenantId,
    name: "Enterprise Workspace",
    plan: "enterprise",
    status: "active",
  };
  (req as any).tenantId = tenantId;

  next();
}

/**
 * Express middleware to verify user role authorization.
 */
export function requireRole(allowedRoles: EnterpriseRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.headers["x-actor-role"] as EnterpriseRole) || "SUPER_ADMIN"; // Fallback to founder admin in demo
    if (!allowedRoles.includes(role) && role !== "SUPER_ADMIN" && role !== "FOUNDER") {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role "${role}" lacks required authorization [${allowedRoles.join(", ")}].`,
      });
    }
    (req as any).actorRole = role;
    next();
  };
}

/**
 * Encrypts a plaintext secret using AES-256-GCM before saving into the vault.
 */
export function encryptVaultPayload(plaintext: string): {
  encryptedPayload: string;
  iv: string;
  tag: string;
  maskedValue: string;
} {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", VAULT_KEY, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  // Generate safe display mask (e.g. sk_live_••••••••12a4)
  let maskedValue = "••••••••";
  if (plaintext.length > 8) {
    maskedValue = `${plaintext.slice(0, 4)}••••••••${plaintext.slice(-4)}`;
  }

  return {
    encryptedPayload: encrypted,
    iv: iv.toString("hex"),
    tag,
    maskedValue,
  };
}

/**
 * Decrypts an encrypted vault secret.
 */
export function decryptVaultPayload(encryptedPayload: string, ivHex: string, tagHex: string): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", VAULT_KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(encryptedPayload, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Secure Vault API: Store new secret
 */
export function storeVaultSecret(params: {
  tenantId: string;
  keyName: string;
  secretValue: string;
  category: VaultSecret["category"];
  createdBy: string;
}): VaultSecret {
  const { encryptedPayload, iv, tag, maskedValue } = encryptVaultPayload(params.secretValue);
  const secret: VaultSecret = {
    id: `sec-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    tenantId: params.tenantId,
    keyName: params.keyName,
    maskedValue,
    encryptedPayload,
    iv,
    tag,
    category: params.category,
    createdBy: params.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return enterpriseDb.saveVaultSecret(secret);
}

/**
 * Generates standard SAML 2.0 Service Provider Metadata XML.
 */
export function generateSamlSpMetadata(appUrl: string): string {
  const entityId = `${appUrl}/saml/metadata`;
  const acsUrl = `${appUrl}/api/auth/sso/saml/acs`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="1" isDefault="true"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
}
