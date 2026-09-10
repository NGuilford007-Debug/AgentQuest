import crypto from "crypto";
import fs from "fs";
import path from "path";

// Types
export interface PasswordResetRecord {
  email: string;
  token: string;
  otp: string;
  expiresAt: number; // timestamp ms
  createdAt: number;
  used: boolean;
  attempts: number;
  ip?: string;
}

export interface FounderCredential {
  email: string;
  passwordHash: string;
  salt: string;
  updatedAt: string;
  isCustom: boolean;
}

export interface FounderSession {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | "password_reset_requested"
    | "otp_verification_success"
    | "otp_verification_failed"
    | "password_reset_completed"
    | "founder_login_success"
    | "founder_login_failed"
    | "founder_logout"
    | "rate_limit_exceeded"
    | "smtp_test_sent"
    | "session_validated";
  email?: string;
  success: boolean;
  reason?: string;
  ip?: string;
  userAgent?: string;
}

// Data persistence paths
const DATA_DIR = path.join(process.cwd(), "data");
const CREDENTIALS_FILE = path.join(DATA_DIR, "founder_credentials.json");
const RESET_TOKENS_FILE = path.join(DATA_DIR, "auth_resets.json");
const SESSIONS_FILE = path.join(DATA_DIR, "founder_sessions.json");
const AUDIT_LOG_FILE = path.join(DATA_DIR, "auth_audit_log.json");

// Ensure data directory exists
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[AuthService] Could not create data directory:", err);
  }
}

// ==========================================
// 1. PASSWORD HASHING & CREDENTIAL STORE
// ==========================================

export function hashPassword(password: string, saltHex?: string): { hash: string; salt: string } {
  const salt = saltHex || crypto.randomBytes(16).toString("hex");
  // Use Node.js scrypt with standard parameters for secure key derivation
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, storedSalt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString("hex"), "hex");
    const hashBuffer = Buffer.from(storedHash, "hex");
    if (keyBuffer.length !== hashBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch (err) {
    console.error("[AuthService] Password verification error:", err);
    return false;
  }
}

// Default initial password used on first install if not customized
const DEFAULT_FOUNDER_PASSWORD = "AgentFlow2026!";

export function getAuthorizedFounderEmails(): string[] {
  const envEmails = process.env.FOUNDER_EMAILS || process.env.FOUNDER_EMAIL;
  if (envEmails) {
    return envEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["toppgunn321@gmail.com"];
}

export function isAuthorizedFounderEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.toLowerCase().trim();
  const allowed = getAuthorizedFounderEmails();
  return allowed.includes(clean);
}

// Load or initialize founder credential store
let founderCredentialMemory: FounderCredential | null = null;

export function getFounderCredential(): FounderCredential {
  if (founderCredentialMemory) {
    return founderCredentialMemory;
  }

  ensureDataDir();
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.passwordHash && parsed.salt) {
        founderCredentialMemory = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn("[AuthService] Could not read credentials file, falling back to default hash:", err);
    }
  }

  // Initialize with secure hashed default
  const defaultSalt = crypto.randomBytes(16).toString("hex");
  const { hash } = hashPassword(DEFAULT_FOUNDER_PASSWORD, defaultSalt);
  const primaryEmail = getAuthorizedFounderEmails()[0] || "toppgunn321@gmail.com";

  const initialCredential: FounderCredential = {
    email: primaryEmail,
    passwordHash: hash,
    salt: defaultSalt,
    updatedAt: new Date().toISOString(),
    isCustom: false,
  };

  founderCredentialMemory = initialCredential;
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(initialCredential, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AuthService] Could not persist initial credentials file:", err);
  }

  return initialCredential;
}

export function updateFounderPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.length < 8) {
    return false;
  }

  const current = getFounderCredential();
  const salt = crypto.randomBytes(16).toString("hex");
  const { hash } = hashPassword(newPassword, salt);

  const updated: FounderCredential = {
    ...current,
    passwordHash: hash,
    salt,
    updatedAt: new Date().toISOString(),
    isCustom: true,
  };

  founderCredentialMemory = updated;
  ensureDataDir();
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(updated, null, 2), "utf-8");
    logAuthEvent({
      action: "password_reset_completed",
      email: updated.email,
      success: true,
      reason: "Password successfully updated and hashed with scrypt salt",
    });
    return true;
  } catch (err) {
    console.error("[AuthService] Failed to persist updated founder password:", err);
    return false;
  }
}

// ==========================================
// 2. FOUNDER SESSIONS (CAPABILITY TOKENS)
// ==========================================

const activeSessions: Map<string, FounderSession> = new Map();

function loadSessions(): void {
  ensureDataDir();
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
      const list: FounderSession[] = JSON.parse(raw);
      const now = Date.now();
      for (const sess of list) {
        if (sess.expiresAt > now) {
          activeSessions.set(sess.token, sess);
        }
      }
    } catch {
      // ignore
    }
  }
}

function persistSessions(): void {
  ensureDataDir();
  try {
    const list = Array.from(activeSessions.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

loadSessions();

export function issueFounderSession(email: string, userAgent?: string, ip?: string): FounderSession {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days session

  const session: FounderSession = {
    token,
    email: email.toLowerCase().trim(),
    createdAt: now,
    expiresAt,
    ip,
    userAgent,
  };

  activeSessions.set(token, session);
  persistSessions();

  logAuthEvent({
    action: "founder_login_success",
    email,
    success: true,
    ip,
    userAgent,
    reason: "New capability session token issued",
  });

  return session;
}

export function validateFounderSession(token: string): { valid: boolean; email?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false };
  }

  const session = activeSessions.get(token);
  if (!session) {
    return { valid: false };
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    persistSessions();
    return { valid: false };
  }

  return { valid: true, email: session.email };
}

export function revokeFounderSession(token: string): boolean {
  if (!token) return false;
  const existed = activeSessions.delete(token);
  if (existed) {
    persistSessions();
  }
  return existed;
}

// ==========================================
// 3. PERSISTENT PASSWORD RESET TOKENS & SECURE OTP
// ==========================================

// Composite token store:
// tokensById: "token:<token>" -> PasswordResetRecord
// activeTokenByEmail: "email:<email>" -> token
const tokensById: Map<string, PasswordResetRecord> = new Map();
const activeTokenByEmail: Map<string, string> = new Map();

function loadResetTokens(): void {
  ensureDataDir();
  if (fs.existsSync(RESET_TOKENS_FILE)) {
    try {
      const raw = fs.readFileSync(RESET_TOKENS_FILE, "utf-8");
      const list: PasswordResetRecord[] = JSON.parse(raw);
      const now = Date.now();
      for (const rec of list) {
        if (!rec.used && rec.expiresAt > now) {
          tokensById.set(rec.token, rec);
          activeTokenByEmail.set(rec.email.toLowerCase().trim(), rec.token);
        }
      }
    } catch {
      // ignore
    }
  }
}

function persistResetTokens(): void {
  ensureDataDir();
  try {
    const list = Array.from(tokensById.values());
    fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

loadResetTokens();

// Periodic cleanup of expired tokens (every 60 seconds)
setInterval(() => {
  const now = Date.now();
  let changed = false;

  for (const [tokenId, record] of tokensById.entries()) {
    if (record.used || now > record.expiresAt) {
      tokensById.delete(tokenId);
      const currentActive = activeTokenByEmail.get(record.email);
      if (currentActive === tokenId) {
        activeTokenByEmail.delete(record.email);
      }
      changed = true;
    }
  }

  // Also clean up expired sessions
  for (const [sessId, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(sessId);
      changed = true;
    }
  }

  if (changed) {
    persistResetTokens();
    persistSessions();
  }
}, 60 * 1000);

// Generate cryptographically secure OTP & Token with auto-cleanup & storage
export function generateResetCredentials(
  email: string,
  ip?: string
): { token: string; otp: string; expiresAt: number } {
  const cleanEmail = email.toLowerCase().trim();

  // Invalidate any existing active token for this email to prevent dual token confusion
  const existingToken = activeTokenByEmail.get(cleanEmail);
  if (existingToken) {
    const oldRec = tokensById.get(existingToken);
    if (oldRec) {
      oldRec.used = true;
    }
    tokensById.delete(existingToken);
    activeTokenByEmail.delete(cleanEmail);
  }

  // Cryptographically secure 6-digit numeric OTP [100000 - 999999]
  const otp = crypto.randomInt(100000, 1000000).toString();
  // 32-byte (64 hex chars) high entropy token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  const record: PasswordResetRecord = {
    email: cleanEmail,
    token,
    otp,
    expiresAt,
    createdAt: Date.now(),
    used: false,
    attempts: 0,
    ip,
  };

  tokensById.set(token, record);
  activeTokenByEmail.set(cleanEmail, token);
  persistResetTokens();

  logAuthEvent({
    action: "password_reset_requested",
    email: cleanEmail,
    success: true,
    ip,
    reason: "New reset token and OTP generated",
  });

  return { token, otp, expiresAt };
}

// Verify token or OTP with rate limiting & timing-safe checks
export function verifyResetToken(
  email: string,
  tokenOrOtp: string
): { valid: boolean; error?: string; record?: PasswordResetRecord } {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = tokenOrOtp.trim();

  if (!cleanEmail || !cleanCode) {
    return { valid: false, error: "Email and verification code are required." };
  }

  // Locate the record either via active email reference or token lookup
  let record: PasswordResetRecord | undefined = tokensById.get(cleanCode);
  if (!record) {
    const activeToken = activeTokenByEmail.get(cleanEmail);
    if (activeToken) {
      record = tokensById.get(activeToken);
    }
  }

  if (!record) {
    return {
      valid: false,
      error: "No active password reset request found. Please request a new verification code.",
    };
  }

  // Check email identity
  if (record.email !== cleanEmail) {
    return {
      valid: false,
      error: "The provided reset code does not match this email address.",
    };
  }

  // Check if already consumed
  if (record.used) {
    return {
      valid: false,
      error: "This verification code has already been used. Please request a new one.",
    };
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    return {
      valid: false,
      error: "This verification code has expired (15-minute limit). Please request a new one.",
    };
  }

  // Check brute force attempt limit (Max 5 attempts)
  if (record.attempts >= 5) {
    record.used = true;
    persistResetTokens();
    logAuthEvent({
      action: "otp_verification_failed",
      email: cleanEmail,
      success: false,
      reason: "Max verification attempts exceeded (locked out)",
    });
    return {
      valid: false,
      error: "Too many failed attempts. For your security, this code has been revoked. Please request a new one.",
    };
  }

  // Constant-time comparison for OTP and Token
  const isOtpMatch = (() => {
    if (cleanCode.length !== record.otp.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(record.otp));
    } catch {
      return false;
    }
  })();

  const isTokenMatch = (() => {
    if (cleanCode.length !== record.token.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(record.token));
    } catch {
      return false;
    }
  })();

  if (!isOtpMatch && !isTokenMatch) {
    record.attempts += 1;
    persistResetTokens();
    const remaining = Math.max(0, 5 - record.attempts);
    logAuthEvent({
      action: "otp_verification_failed",
      email: cleanEmail,
      success: false,
      reason: `Invalid code provided. ${remaining} attempts remaining.`,
    });
    return {
      valid: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining before lockout.`,
    };
  }

  logAuthEvent({
    action: "otp_verification_success",
    email: cleanEmail,
    success: true,
  });

  return { valid: true, record };
}

// Mark reset token consumed
export function consumeResetToken(email: string, tokenOrOtp: string): boolean {
  const { valid, record } = verifyResetToken(email, tokenOrOtp);
  if (!valid || !record) {
    return false;
  }
  record.used = true;
  tokensById.delete(record.token);
  activeTokenByEmail.delete(record.email);
  persistResetTokens();
  return true;
}

// ==========================================
// 4. RATE LIMITING & BRUTE-FORCE PROTECTION
// ==========================================

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore: Map<string, RateLimitBucket> = new Map();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= maxRequests) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - bucket.count,
    retryAfterSec: 0,
  };
}

// ==========================================
// 5. INPUT VALIDATION & TYPO DETECTION
// ==========================================

const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
];

const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
};

export function validateEmail(email: string): {
  valid: boolean;
  cleanEmail: string;
  error?: string;
  suggestion?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, cleanEmail: "", error: "Email address is required." };
  }

  const clean = email.toLowerCase().trim();

  if (clean.length > 254) {
    return { valid: false, cleanEmail: clean, error: "Email address exceeds maximum length of 254 characters." };
  }

  // RFC 5322 regex format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, cleanEmail: clean, error: "Please provide a valid email format (e.g. user@example.com)." };
  }

  // Check for common typos in domain
  const domain = clean.split("@")[1];
  if (domain && DOMAIN_TYPOS[domain]) {
    const suggestedDomain = DOMAIN_TYPOS[domain];
    const username = clean.split("@")[0];
    return {
      valid: true,
      cleanEmail: clean,
      suggestion: `Did you mean ${username}@${suggestedDomain}?`,
    };
  }

  return { valid: true, cleanEmail: clean };
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
  score: number;
} {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password cannot be empty.", score: 0 };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long.", score: 1 };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password cannot exceed 128 characters.", score: 1 };
  }

  let score = 0;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Password must include both letters and numbers.",
      score,
    };
  }

  return { valid: true, score };
}

// ==========================================
// 6. STRUCTURED AUDIT TRAIL LOGGING
// ==========================================

const memoryAuditLogs: AuditLogEntry[] = [];

function loadAuditLogs(): void {
  ensureDataDir();
  if (fs.existsSync(AUDIT_LOG_FILE)) {
    try {
      const raw = fs.readFileSync(AUDIT_LOG_FILE, "utf-8");
      const list: AuditLogEntry[] = JSON.parse(raw);
      memoryAuditLogs.push(...list.slice(-500));
    } catch {
      // ignore
    }
  }
}

function persistAuditLogs(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(memoryAuditLogs.slice(-500), null, 2), "utf-8");
  } catch {
    // ignore
  }
}

loadAuditLogs();

export function logAuthEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
  const logItem: AuditLogEntry = {
    id: `LOG-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  memoryAuditLogs.push(logItem);
  if (memoryAuditLogs.length > 500) {
    memoryAuditLogs.shift();
  }

  // Structured console log
  console.log(
    `[Security Audit] ${logItem.timestamp} | ${logItem.action} | success=${logItem.success} | email=${logItem.email || "n/a"} | ip=${logItem.ip || "n/a"} | ${logItem.reason || ""}`
  );

  persistAuditLogs();
}

export function getRecentAuditLogs(limit: number = 50): AuditLogEntry[] {
  return memoryAuditLogs.slice(-limit).reverse();
}

// ==========================================
// 7. ENVIRONMENT VALIDATION AT STARTUP
// ==========================================

export function validateAuthEnvironment(): {
  valid: boolean;
  warnings: string[];
  diagnostics: Record<string, boolean | string>;
} {
  const warnings: string[] = [];
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);
  const isFounderConfigured = Boolean(process.env.FOUNDER_EMAILS || process.env.FOUNDER_EMAIL);

  if (!isSmtpConfigured) {
    warnings.push(
      "SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not detected. Password recovery is operating in development mode with secure in-session OTP delivery."
    );
  }

  if (!isFounderConfigured) {
    warnings.push(
      "FOUNDER_EMAILS not set in environment. Defaulting authorized founder to toppgunn321@gmail.com."
    );
  }

  return {
    valid: true,
    warnings,
    diagnostics: {
      smtpConfigured: isSmtpConfigured,
      smtpHost: smtpHost || "none",
      founderEmailConfigured: isFounderConfigured,
      nodeEnv: process.env.NODE_ENV || "development",
      tlsVerificationStrict: process.env.NODE_ENV === "production",
    },
  };
}
