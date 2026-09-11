export interface DlpFinding {
  type: 
    | "AWS_ACCESS_KEY"
    | "STRIPE_SECRET_KEY"
    | "GOOGLE_API_KEY"
    | "GITHUB_TOKEN"
    | "JWT_TOKEN"
    | "PRIVATE_KEY_BLOCK"
    | "DATABASE_CONNECTION_URI"
    | "CREDIT_CARD_PAN"
    | "US_SSN"
    | "PHONE_NUMBER"
    | "EMAIL_ADDRESS"
    | "GENERIC_API_SECRET";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  count: number;
  sampleMasked: string;
}

export interface DlpScanResult {
  hasViolations: boolean;
  sanitizedText: string;
  totalRedactionsCount: number;
  criticalViolationsCount: number;
  findings: DlpFinding[];
  riskScore: number; // 0 to 100
}

// Luhn check for Credit Card numbers
function isValidLuhn(digits: string): boolean {
  const clean = digits.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(clean)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export interface DlpConfig {
  maskPii?: boolean;
  maskCredentials?: boolean;
  maskEmails?: boolean;
  strictMode?: boolean;
}

/**
 * Enterprise Data Loss Prevention & Credential Masking Engine
 * Scans, detects, and redacts sensitive credentials, secrets, and PII
 * before payloads reach AI models, external webhooks, or public client views.
 */
export function scanAndMaskDlp(
  text: string,
  config: DlpConfig = { maskPii: true, maskCredentials: true, maskEmails: false }
): DlpScanResult {
  if (!text || typeof text !== "string") {
    return {
      hasViolations: false,
      sanitizedText: text || "",
      totalRedactionsCount: 0,
      criticalViolationsCount: 0,
      findings: [],
      riskScore: 0,
    };
  }

  let sanitized = text;
  const findings: DlpFinding[] = [];
  let totalRedactions = 0;
  let criticalCount = 0;

  // 1. Private RSA / EC / SSH Keys (CRITICAL)
  const privateKeyRegex = /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/g;
  const privateKeyMatches = sanitized.match(privateKeyRegex);
  if (privateKeyMatches && privateKeyMatches.length > 0) {
    findings.push({
      type: "PRIVATE_KEY_BLOCK",
      severity: "CRITICAL",
      description: "Cryptographic private key block (RSA/EC/SSH)",
      count: privateKeyMatches.length,
      sampleMasked: "[REDACTED_RSA_PRIVATE_KEY_BLOCK]",
    });
    totalRedactions += privateKeyMatches.length;
    criticalCount += privateKeyMatches.length;
    sanitized = sanitized.replace(privateKeyRegex, "[REDACTED_RSA_PRIVATE_KEY_BLOCK]");
  }

  // 2. Stripe Secret Keys (CRITICAL)
  const stripeKeyRegex = /\b(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}\b/g;
  const stripeMatches = sanitized.match(stripeKeyRegex);
  if (stripeMatches && stripeMatches.length > 0) {
    findings.push({
      type: "STRIPE_SECRET_KEY",
      severity: "CRITICAL",
      description: "Stripe API Secret / Restricted Access Key",
      count: stripeMatches.length,
      sampleMasked: "[REDACTED_STRIPE_SECRET_KEY]",
    });
    totalRedactions += stripeMatches.length;
    criticalCount += stripeMatches.length;
    sanitized = sanitized.replace(stripeKeyRegex, "[REDACTED_STRIPE_SECRET_KEY]");
  }

  // 3. AWS Access Key IDs (CRITICAL)
  const awsKeyRegex = /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g;
  const awsMatches = sanitized.match(awsKeyRegex);
  if (awsMatches && awsMatches.length > 0) {
    findings.push({
      type: "AWS_ACCESS_KEY",
      severity: "CRITICAL",
      description: "AWS IAM Access Key ID",
      count: awsMatches.length,
      sampleMasked: "[REDACTED_AWS_ACCESS_KEY]",
    });
    totalRedactions += awsMatches.length;
    criticalCount += awsMatches.length;
    sanitized = sanitized.replace(awsKeyRegex, "[REDACTED_AWS_ACCESS_KEY]");
  }

  // 4. Google API Keys (HIGH)
  const googleKeyRegex = /\bAIza[0-9A-Za-z\-_]{35}\b/g;
  const googleMatches = sanitized.match(googleKeyRegex);
  if (googleMatches && googleMatches.length > 0) {
    findings.push({
      type: "GOOGLE_API_KEY",
      severity: "HIGH",
      description: "Google Cloud / Gemini API Key",
      count: googleMatches.length,
      sampleMasked: "[REDACTED_GOOGLE_API_KEY]",
    });
    totalRedactions += googleMatches.length;
    sanitized = sanitized.replace(googleKeyRegex, "[REDACTED_GOOGLE_API_KEY]");
  }

  // 5. GitHub Personal Access Tokens (HIGH)
  const githubTokenRegex = /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36,255}\b/g;
  const githubMatches = sanitized.match(githubTokenRegex);
  if (githubMatches && githubMatches.length > 0) {
    findings.push({
      type: "GITHUB_TOKEN",
      severity: "HIGH",
      description: "GitHub Personal Access Token",
      count: githubMatches.length,
      sampleMasked: "[REDACTED_GITHUB_ACCESS_TOKEN]",
    });
    totalRedactions += githubMatches.length;
    sanitized = sanitized.replace(githubTokenRegex, "[REDACTED_GITHUB_ACCESS_TOKEN]");
  }

  // 6. Database Connection Strings with Passwords (CRITICAL)
  const dbUriRegex = /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^:\s\/]+:[^@\s\/]+@[^\s"']+/g;
  const dbMatches = sanitized.match(dbUriRegex);
  if (dbMatches && dbMatches.length > 0) {
    findings.push({
      type: "DATABASE_CONNECTION_URI",
      severity: "CRITICAL",
      description: "Database Connection URI with embedded plaintext credentials",
      count: dbMatches.length,
      sampleMasked: "[REDACTED_DATABASE_CONNECTION_URI]",
    });
    totalRedactions += dbMatches.length;
    criticalCount += dbMatches.length;
    sanitized = sanitized.replace(dbUriRegex, "[REDACTED_DATABASE_CONNECTION_URI]");
  }

  // 7. JWT Tokens (MEDIUM)
  const jwtRegex = /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_\-\.\+\/=]{10,}\b/g;
  const jwtMatches = sanitized.match(jwtRegex);
  if (jwtMatches && jwtMatches.length > 0) {
    findings.push({
      type: "JWT_TOKEN",
      severity: "MEDIUM",
      description: "JSON Web Token (JWT) bearer session token",
      count: jwtMatches.length,
      sampleMasked: "[REDACTED_JWT_TOKEN]",
    });
    totalRedactions += jwtMatches.length;
    sanitized = sanitized.replace(jwtRegex, "[REDACTED_JWT_TOKEN]");
  }

  if (config.maskPii) {
    // 8. US Social Security Numbers (CRITICAL PII)
    const ssnRegex = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;
    const ssnMatches = sanitized.match(ssnRegex);
    if (ssnMatches && ssnMatches.length > 0) {
      findings.push({
        type: "US_SSN",
        severity: "CRITICAL",
        description: "US Social Security Number (PII)",
        count: ssnMatches.length,
        sampleMasked: "[REDACTED_SSN_***-**-****]",
      });
      totalRedactions += ssnMatches.length;
      criticalCount += ssnMatches.length;
      sanitized = sanitized.replace(ssnRegex, "[REDACTED_SSN_***-**-****]");
    }

    // 9. Credit Card Numbers (CRITICAL PII / PCI-DSS)
    const ccCandidateRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b|\b\d{15,16}\b/g;
    let ccCount = 0;
    sanitized = sanitized.replace(ccCandidateRegex, (match) => {
      if (isValidLuhn(match)) {
        ccCount++;
        return "[REDACTED_CREDIT_CARD_PAN]";
      }
      return match;
    });
    if (ccCount > 0) {
      findings.push({
        type: "CREDIT_CARD_PAN",
        severity: "CRITICAL",
        description: "PCI-DSS Protected Credit Card Primary Account Number (PAN)",
        count: ccCount,
        sampleMasked: "[REDACTED_CREDIT_CARD_PAN]",
      });
      totalRedactions += ccCount;
      criticalCount += ccCount;
    }

    // 10. Phone Numbers (MEDIUM PII)
    const phoneRegex = /\b(?:\+?1[-. ]?)?\(?[2-9]\d{2}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g;
    const phoneMatches = sanitized.match(phoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
      findings.push({
        type: "PHONE_NUMBER",
        severity: "MEDIUM",
        description: "Direct Dial / Mobile Phone Number (PII)",
        count: phoneMatches.length,
        sampleMasked: "[REDACTED_PHONE_NUMBER]",
      });
      totalRedactions += phoneMatches.length;
      sanitized = sanitized.replace(phoneRegex, "[REDACTED_PHONE_NUMBER]");
    }
  }

  // 11. Optional Email Address Masking (e.g. j***@corp.com)
  if (config.maskEmails) {
    const emailRegex = /\b([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g;
    sanitized = sanitized.replace(emailRegex, (_full, user, domain) => {
      const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
      return `${maskedUser}@${domain}`;
    });
  }

  const riskScore = Math.min(100, criticalCount * 35 + (totalRedactions - criticalCount) * 15);

  return {
    hasViolations: totalRedactions > 0,
    sanitizedText: sanitized,
    totalRedactionsCount: totalRedactions,
    criticalViolationsCount: criticalCount,
    findings,
    riskScore,
  };
}
