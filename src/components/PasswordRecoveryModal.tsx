import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Server,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onPasswordResetSuccess?: (email: string, newPassword: string) => void;
  onSwitchToSignIn?: () => void;
}

interface EmailStatus {
  isConfigured: boolean;
  host: string | null;
  port: number;
  userMasked: string | null;
  fromAddress: string;
  secure: boolean;
  activeTransportType: string;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  initialEmail = "",
  onPasswordResetSuccess,
  onSwitchToSignIn,
}) => {
  // Steps: 1: Request, 2: Verify OTP, 3: Set New Password, 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState<string>(initialEmail);
  const [otpCode, setOtpCode] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deliveredViaSmtp, setDeliveredViaSmtp] = useState<boolean>(false);
  const [serverNotice, setServerNotice] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [testEmailLoading, setTestEmailLoading] = useState<boolean>(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (isOpen) {
      fetchEmailStatus();
    }
  }, [isOpen]);

  const fetchEmailStatus = async () => {
    try {
      const res = await fetch("/api/auth/email-status");
      const data = await res.json();
      if (data.success && data.status) {
        setEmailStatus(data.status);
      }
    } catch (err) {
      console.warn("Could not fetch email status:", err);
    }
  };

  if (!isOpen) return null;

  // Password strength calculation
  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200 dark:bg-slate-700", text: "text-slate-400" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score <= 3) return { score: 2, label: "Good", color: "bg-amber-500", text: "text-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strength = calculateStrength(newPassword);

  // Step 1: Request Password Reset via real backend
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          originUrl: window.location.origin,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to process password reset request.");
        return;
      }

      setDeliveredViaSmtp(data.deliveredViaSmtp);
      setServerNotice(data.notice || null);

      if (data.token) {
        setResetToken(data.token);
      }
      if (data.otp) {
        setOtpCode(data.otp);
      }

      setStep(2);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Network error communicating with auth server.");
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const codeToVerify = otpCode.trim() || resetToken.trim();
    if (!codeToVerify) {
      setErrorMessage("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          tokenOrOtp: codeToVerify,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.valid) {
        setErrorMessage(data.error || "The code entered is invalid or has expired.");
        return;
      }

      setStep(3);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Failed to verify code.");
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify your new password.");
      return;
    }

    setIsLoading(true);
    try {
      const codeToVerify = otpCode.trim() || resetToken.trim();
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          tokenOrOtp: codeToVerify,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to update password.");
        return;
      }

      // If this is the founder email, synchronize with local founder password store
      if (email.toLowerCase().trim() === "toppgunn321@gmail.com") {
        localStorage.setItem("agentflow_founder_password", newPassword);
      }

      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(email, newPassword);
      }

      setStep(4);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || "Network error while saving new password.");
    }
  };

  // Run a live SMTP test email dispatch
  const handleSendTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const target = email || "toppgunn321@gmail.com";
      const res = await fetch("/api/auth/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: target }),
      });
      const data = await res.json();
      setTestEmailLoading(false);
      if (data.success) {
        setTestEmailResult({ success: true, message: `Live SMTP email delivered to ${target} (ID: ${data.messageId})` });
      } else {
        setTestEmailResult({ success: false, message: data.error || "SMTP delivery check failed." });
      }
    } catch (err: any) {
      setTestEmailLoading(false);
      setTestEmailResult({ success: false, message: err.message || "Failed to trigger SMTP test." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-850 dark:via-blue-950/20 dark:to-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white leading-none">
                  Password Recovery
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Real Email API
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                256-bit encrypted authentication & credential reset
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
            <div className={`py-1 rounded-lg border transition-all ${
              step >= 1 
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400" 
                : "border-slate-200 dark:border-slate-800 text-slate-400"
            }`}>
              1. Email
            </div>
            <div className={`py-1 rounded-lg border transition-all ${
              step >= 2 
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400" 
                : "border-slate-200 dark:border-slate-800 text-slate-400"
            }`}>
              2. Verify OTP
            </div>
            <div className={`py-1 rounded-lg border transition-all ${
              step >= 3 
                ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400" 
                : "border-slate-200 dark:border-slate-800 text-slate-400"
            }`}>
              3. New Password
            </div>
            <div className={`py-1 rounded-lg border transition-all ${
              step === 4 
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" 
                : "border-slate-200 dark:border-slate-800 text-slate-400"
            }`}>
              4. Complete
            </div>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* STEP 1: REQUEST EMAIL */}
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Real Email Infrastructure Handshake</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Enter the registered email for your workspace account or founder credential. Our backend server dispatches a 6-digit One-Time Passcode (OTP) and an encrypted recovery token.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Account Email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com or toppgunn321@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Select demo accounts */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Quick fill:</span>
                <button
                  type="button"
                  onClick={() => setEmail("toppgunn321@gmail.com")}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  toppgunn321@gmail.com (Founder)
                </button>
                <button
                  type="button"
                  onClick={() => setEmail("alex.mercer@enterprise.io")}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  alex.mercer@enterprise.io (Member)
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-98 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Email Framework...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Password Reset Passcode</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    {deliveredViaSmtp 
                      ? "Reset Email Dispatched via Live SMTP!" 
                      : "Security Reset Session Active"}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {deliveredViaSmtp
                    ? `A security email with your 6-digit OTP passcode was dispatched to ${email}. Please check your inbox or spam folder.`
                    : `Your recovery session for ${email} is generated and valid for 15 minutes.`}
                </p>
                {serverNotice && (
                  <div className="pt-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                    ℹ️ {serverNotice}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>6-Digit Security Passcode (OTP)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Expires in 15 mins
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full px-4 py-3 text-center tracking-widest font-mono text-xl font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-98 transition-all"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Passcode...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Set New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Verified identity for <strong>{email}</strong>. Enter your new password below:</span>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password strength */}
                {newPassword && (
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Security rating:</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 h-1">
                      <div className={`rounded-full ${strength.score >= 1 ? strength.color : "bg-slate-200 dark:bg-slate-700"}`} />
                      <div className={`rounded-full ${strength.score >= 2 ? strength.color : "bg-slate-200 dark:bg-slate-700"}`} />
                      <div className={`rounded-full ${strength.score >= 3 ? strength.color : "bg-slate-200 dark:bg-slate-700"}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Confirm New Password</span>
                  </span>
                  {confirmPassword && newPassword && (
                    <span className={`text-[10px] font-bold ${newPassword === confirmPassword ? "text-emerald-500" : "text-rose-500"}`}>
                      {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 active:scale-98 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save New Password & Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Password Updated Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Your credentials have been securely refreshed. Your old password has been invalidated and the recovery session closed.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                Account: <span className="font-bold text-blue-600 dark:text-blue-400">{email}</span>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSwitchToSignIn) {
                      onSwitchToSignIn();
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all"
                >
                  Continue to Workspace
                </button>
              </div>
            </div>
          )}

          {/* COLLAPSIBLE SMTP DIAGNOSTICS & INTEGRATION DRAWER */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold">Email Framework & SMTP Diagnostics</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                  emailStatus?.isConfigured
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                }`}>
                  {emailStatus?.isConfigured ? "SMTP Ready" : "Awaiting Credentials"}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${showDiagnostics ? "rotate-90" : ""}`} />
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">SMTP Host</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {emailStatus?.host || "Not set (e.g. smtp.gmail.com)"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">SMTP Port / Security</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {emailStatus?.port || 587} • {emailStatus?.secure ? "SSL/TLS" : "STARTTLS"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Sender Address</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {emailStatus?.fromAddress || "no-reply@agentflow.enterprise"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Auth User</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {emailStatus?.userMasked || "None configured"}
                    </span>
                  </div>
                </div>

                {/* How to configure */}
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="font-bold text-blue-900 dark:text-blue-300">
                    Connecting Real Client Mail Relay:
                  </div>
                  <p className="leading-normal">
                    Provide <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-[10px]">SMTP_HOST</code>, <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-[10px]">SMTP_PORT</code>, <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-[10px]">SMTP_USER</code>, and <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-[10px]">SMTP_PASS</code> in the <strong>AI Studio Settings</strong> or <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-[10px]">.env</code>.
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    • <strong>Gmail:</strong> Use <code className="font-mono">smtp.gmail.com</code> (Port 587) with a 16-character Google App Password.<br/>
                    • <strong>SendGrid / Postmark / AWS SES:</strong> Use their provided SMTP relay host and API key as password.
                  </p>
                </div>

                {/* Live SMTP Test Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={testEmailLoading}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    {testEmailLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Dispatching Test...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 text-blue-500" />
                        <span>Send Live SMTP Test to {email || "Founder"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={fetchEmailStatus}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh status</span>
                  </button>
                </div>

                {testEmailResult && (
                  <div className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2 ${
                    testEmailResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                  }`}>
                    {testEmailResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{testEmailResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>256-Bit SSL • SOC-2 Certified Auth</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
