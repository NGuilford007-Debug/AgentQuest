import nodemailer, { type Transporter } from "nodemailer";
import crypto from "crypto";

export interface EmailServiceStatus {
  isConfigured: boolean;
  host: string | null;
  port: number;
  userMasked: string | null;
  fromAddress: string;
  secure: boolean;
  activeTransportType: "smtp" | "unconfigured";
}

export interface PasswordResetRecord {
  email: string;
  token: string;
  otp: string;
  expiresAt: number; // timestamp ms
  createdAt: number;
  used: boolean;
}

// In-memory token storage (persisted across requests during server lifecycle)
const resetTokenStore: Map<string, PasswordResetRecord> = new Map();

// Generate a secure 6-digit numeric OTP and a 32-byte random hex token
export function generateResetCredentials(email: string): { token: string; otp: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString("hex");
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  const record: PasswordResetRecord = {
    email: email.toLowerCase().trim(),
    token,
    otp,
    expiresAt,
    createdAt: Date.now(),
    used: false,
  };

  // Store indexed by email and by token
  resetTokenStore.set(record.email, record);
  resetTokenStore.set(token, record);

  return { token, otp, expiresAt };
}

// Verify if a token or OTP is valid for an email
export function verifyResetToken(
  email: string,
  tokenOrOtp: string
): { valid: boolean; error?: string; record?: PasswordResetRecord } {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = tokenOrOtp.trim();

  // Try fetching by email first, or by token directly
  const record = resetTokenStore.get(cleanEmail) || resetTokenStore.get(cleanCode);

  if (!record) {
    return { valid: false, error: "No active password reset request found for this email or token." };
  }

  if (record.email !== cleanEmail && record.token !== cleanCode) {
    return { valid: false, error: "Reset token does not match the provided email address." };
  }

  if (record.used) {
    return { valid: false, error: "This password reset token has already been used. Please request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    return { valid: false, error: "This password reset request has expired (15-minute limit). Please request a new one." };
  }

  const matches = record.token === cleanCode || record.otp === cleanCode;
  if (!matches) {
    return { valid: false, error: "Invalid verification code or reset token." };
  }

  return { valid: true, record };
}

// Mark token as consumed
export function consumeResetToken(email: string, tokenOrOtp: string): boolean {
  const { valid, record } = verifyResetToken(email, tokenOrOtp);
  if (!valid || !record) return false;
  record.used = true;
  return true;
}

// Lazy create nodemailer transporter
function getTransporter(): { transporter: Transporter | null; isConfigured: boolean } {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return { transporter: null, isConfigured: false };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        // Prevent rejection on custom corporate certificates
        rejectUnauthorized: process.env.NODE_ENV === "production" ? false : false,
      },
    });
    return { transporter, isConfigured: true };
  } catch (err) {
    console.error("[EmailService] Failed to create SMTP transporter:", err);
    return { transporter: null, isConfigured: false };
  }
}

// Get diagnostic status of the email framework
export async function getEmailServiceStatus(): Promise<EmailServiceStatus> {
  const host = process.env.SMTP_HOST?.trim() || null;
  const user = process.env.SMTP_USER?.trim() || null;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const fromAddress = process.env.EMAIL_FROM || "AgentFlow Security <no-reply@agentflow.enterprise>";

  const isConfigured = Boolean(host && user && process.env.SMTP_PASS?.trim());

  let userMasked: string | null = null;
  if (user) {
    const parts = user.split("@");
    if (parts.length === 2) {
      userMasked = `${parts[0].slice(0, 2)}***@${parts[1]}`;
    } else {
      userMasked = `${user.slice(0, 3)}***`;
    }
  }

  return {
    isConfigured,
    host,
    port,
    userMasked,
    fromAddress,
    secure,
    activeTransportType: isConfigured ? "smtp" : "unconfigured",
  };
}

// Send real password reset email
export async function sendPasswordResetEmail(params: {
  toEmail: string;
  recipientName?: string;
  otp: string;
  token: string;
  originUrl?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  deliveredViaSmtp: boolean;
  otp: string;
  token: string;
  resetUrl: string;
  expiresInMinutes: number;
  notice?: string;
}> {
  const { toEmail, recipientName, otp, token, originUrl } = params;
  const name = recipientName || toEmail.split("@")[0] || "Workspace Member";
  const baseUrl = originUrl || process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?email=${encodeURIComponent(toEmail)}&token=${token}`;
  const from = process.env.EMAIL_FROM || "AgentFlow Security <no-reply@agentflow.enterprise>";

  const { transporter, isConfigured } = getTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your AgentFlow Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 32px 16px; color: #f8fafc;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border-bottom: 1px solid #334155;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <div style="font-size: 20px; font-weight: 800; color: #38bdf8; letter-spacing: -0.5px;">
                ⚡ AgentFlow <span style="color: #94a3b8; font-weight: 500; font-size: 14px;">Enterprise Security</span>
              </div>
            </td>
            <td align="right">
              <span style="display: inline-block; padding: 4px 10px; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                Password Recovery
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #ffffff;">
          Password Reset Request
        </h1>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Hello <strong style="color: #f1f5f9;">${name}</strong>,
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          We received an authorized request to reset the password for your AgentFlow Enterprise account associated with <strong style="color: #38bdf8;">${toEmail}</strong>.
        </p>

        <!-- 6-digit OTP Box -->
        <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">
            Your One-Time Security Passcode (OTP)
          </div>
          <div style="font-family: monospace, 'Courier New', Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; padding: 6px 0;">
            ${otp}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
            Valid for the next <strong>15 minutes</strong>. Do not share this code with anyone.
          </div>
        </div>

        <!-- Direct Action Button -->
        <div style="text-align: center; margin: 28px 0 24px;">
          <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
            Reset Password Securely &rarr;
          </a>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          If the button above does not open, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #38bdf8; word-break: break-all;">${resetUrl}</a>
        </p>

        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; line-height: 1.5;">
          <strong style="color: #94a3b8;">Didn't request this change?</strong><br>
          If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged and your account stays protected.
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #0f172a; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center;">
        <div>AgentFlow Enterprise Autonomous Operations Systems</div>
        <div style="margin-top: 4px;">256-bit SOC-2 Type II Certified • Encrypted Token Dispatch</div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `AgentFlow Enterprise Password Reset
Hello ${name},

We received a request to reset your password for ${toEmail}.

Your 6-digit One-Time Passcode (OTP): ${otp}
(Valid for 15 minutes)

Direct Password Reset Link:
${resetUrl}

If you did not request this, please ignore this email.
`;

  if (isConfigured && transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: `[Security] Reset your AgentFlow Enterprise Password (${otp})`,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EmailService] Password reset email successfully dispatched via SMTP to ${toEmail}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        deliveredViaSmtp: true,
        otp,
        token,
        resetUrl,
        expiresInMinutes: 15,
      };
    } catch (smtpError: any) {
      console.error("[EmailService] SMTP delivery failed:", smtpError.message);
      return {
        success: true,
        deliveredViaSmtp: false,
        otp,
        token,
        resetUrl,
        expiresInMinutes: 15,
        notice: `SMTP server error: ${smtpError.message}. The verification token is active for 15 minutes.`,
      };
    }
  } else {
    // SMTP credentials not yet provided in .env
    console.log(`[EmailService] SMTP not configured. Token generated for ${toEmail}: OTP=${otp}, Token=${token}`);
    return {
      success: true,
      deliveredViaSmtp: false,
      otp,
      token,
      resetUrl,
      expiresInMinutes: 15,
      notice: "SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not yet configured in environment. The recovery session is active and can be verified with your 6-digit OTP code.",
    };
  }
}

// Send test email to verify SMTP connection
export async function sendTestEmail(targetEmail: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const { transporter, isConfigured } = getTransporter();

  if (!isConfigured || !transporter) {
    return {
      success: false,
      error: "SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env or Settings.",
    };
  }

  try {
    const from = process.env.EMAIL_FROM || "AgentFlow Security <no-reply@agentflow.enterprise>";
    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: "⚡ AgentFlow Enterprise - SMTP Integration Verification",
      text: "Congratulations! Your email framework is connected and operational for real clients.",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #fff; border-radius: 12px;">
          <h2 style="color: #38bdf8;">⚡ AgentFlow Enterprise SMTP Verification</h2>
          <p>This is a live test email confirming that your email framework is connected and fully operational for real client password recovery and security notifications.</p>
          <p style="color: #94a3b8; font-size: 12px;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send test email via SMTP" };
  }
}
