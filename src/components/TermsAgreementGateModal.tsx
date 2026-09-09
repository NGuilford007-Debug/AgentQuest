import React, { useState, useRef } from "react";
import { LegalDocumentItem } from "../types";
import { INITIAL_LEGAL_DOCUMENTS } from "../data/initialLegalDocs";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  FileText, 
  Sparkles,
  Check,
  X,
  ListFilter,
  BookOpen,
  Copy,
  Printer,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Download
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { fireCelebration } from "../utils/confetti";

interface TermsAgreementGateModalProps {
  isOpen: boolean;
  onAcceptTerms: (signerInfo: { name: string; organization: string; acceptedAt: string }) => void;
  legalDocuments?: LegalDocumentItem[];
  userEmail?: string;
  userName?: string;
  canDismiss?: boolean;
  onClose?: () => void;
}

export const TermsAgreementGateModal: React.FC<TermsAgreementGateModalProps> = ({
  isOpen,
  onAcceptTerms,
  legalDocuments = INITIAL_LEGAL_DOCUMENTS,
  userEmail = "user@organization.com",
  userName = "Enterprise Member",
  canDismiss = true,
  onClose
}) => {
  // Check if previously accepted in persistent localStorage
  const [previouslyAcceptedInfo] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("agentflow_tos_accepted");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  const [agreeTerms, setAgreeTerms] = useState<boolean>(() => Boolean(previouslyAcceptedInfo) || true);
  const [signerName, setSignerName] = useState<string>(
    () => previouslyAcceptedInfo?.name || userName || "Alex Mercer"
  );
  const [organizationName, setOrganizationName] = useState<string>(
    () => previouslyAcceptedInfo?.organization || "Enterprise Workspace"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeContractIndex, setActiveContractIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"full" | "summary">("full");
  const [textSize, setTextSize] = useState<"normal" | "large">("normal");
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentDoc = legalDocuments[activeContractIndex] || legalDocuments[0];

  const handleConfirmAgreement = () => {
    if (!agreeTerms) {
      setErrorMessage("Please confirm you agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (!signerName.trim()) {
      setErrorMessage("Please provide your authorized signer name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const signerInfo = {
      name: signerName.trim(),
      organization: organizationName.trim() || "Enterprise Workspace",
      acceptedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        "agentflow_tos_accepted",
        JSON.stringify({
          ...signerInfo,
          version: "v3.7-ENTERPRISE",
          userEmail,
        })
      );
      sessionStorage.setItem("agentflow_terms_accepted_session", "true");
    } catch (e) {
      console.warn("Could not save tos acceptance:", e);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      fireCelebration();
      onAcceptTerms(signerInfo);
    }, 300);
  };

  const handleDismissOrPreview = () => {
    try {
      sessionStorage.setItem("agentflow_terms_accepted_session", "true");
    } catch (e) {
      console.warn("Could not save session preview:", e);
    }
    if (onClose) {
      onClose();
    } else {
      onAcceptTerms({
        name: signerName.trim() || "Preview Guest",
        organization: organizationName.trim() || "Evaluation Session",
        acceptedAt: new Date().toISOString(),
      });
    }
  };

  const handleCopyDocumentContent = () => {
    if (!currentDoc) return;
    navigator.clipboard.writeText(
      `${currentDoc.title || currentDoc.name}\nVersion: ${currentDoc.version}\nEffective Date: ${currentDoc.effectiveDate}\n\n${currentDoc.content}`
    );
    setCopiedDocId(currentDoc.id);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  // High-contrast, clean typography renderers for markdown legal prose
  const isLarge = textSize === "large";
  const markdownComponents = {
    h1: ({ children, ...props }: any) => (
      <h1 className={`${isLarge ? "text-2xl" : "text-xl"} font-black text-slate-950 dark:text-white mt-6 mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-800 tracking-tight`} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className={`${isLarge ? "text-xl" : "text-lg"} font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2.5 tracking-tight border-b border-slate-200/80 dark:border-slate-800/60 pb-1.5`} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className={`${isLarge ? "text-lg" : "text-base"} font-bold text-indigo-700 dark:text-indigo-400 mt-4 mb-2`} {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }: any) => (
      <p className={`${isLarge ? "text-base leading-8" : "text-sm sm:text-[15px] leading-relaxed"} text-slate-800 dark:text-slate-200 mb-4 font-normal`} {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className={`list-disc pl-6 space-y-2 ${isLarge ? "text-base leading-8" : "text-sm sm:text-[15px] leading-relaxed"} text-slate-800 dark:text-slate-200 mb-4`} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className={`list-decimal pl-6 space-y-2 ${isLarge ? "text-base leading-8" : "text-sm sm:text-[15px] leading-relaxed"} text-slate-800 dark:text-slate-200 mb-4`} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className={`${isLarge ? "text-base" : "text-sm sm:text-[15px]"} text-slate-800 dark:text-slate-200 leading-relaxed`} {...props}>
        {children}
      </li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-bold text-slate-950 dark:text-white" {...props}>
        {children}
      </strong>
    ),
    hr: (props: any) => (
      <hr className="border-slate-200 dark:border-slate-800 my-6" {...props} />
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className={`border-l-4 border-indigo-600 pl-4 py-2.5 my-4 bg-indigo-50/80 dark:bg-indigo-950/40 ${isLarge ? "text-base" : "text-sm"} text-slate-900 dark:text-slate-100 rounded-r-2xl font-medium`} {...props}>
        {children}
      </blockquote>
    ),
  };

  return (
    <div 
      id="modal-terms-of-service-gate" 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden transition-all duration-300 my-auto flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shadow-xs shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                  Terms of Service & Enterprise Agreement
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  SLA Active
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {legalDocuments.length} Schedules
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Review the binding enterprise agreements, autonomous AI safety policy, and customer data protections.
              </p>
            </div>
          </div>

          {(canDismiss || onClose) && (
            <button
              type="button"
              id="btn-close-terms-modal"
              onClick={handleDismissOrPreview}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Close or explore preview"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* High-Contrast Core Commitments Ribbon */}
        <div className="px-6 sm:px-8 py-2.5 bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold truncate">Zero Model Training on Customer Data</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold truncate">Human-in-the-Loop Governance</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold truncate">99.9% Uptime Enterprise SLA</span>
          </div>
        </div>

        {/* Document Navigation & Typography Toolbar */}
        <div className="px-6 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          {/* Document Tab Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none max-w-full">
            {legalDocuments.map((doc, idx) => (
              <button
                key={doc.id}
                type="button"
                id={`btn-tab-legal-doc-${idx}`}
                onClick={() => {
                  setActiveContractIndex(idx);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeContractIndex === idx
                    ? "bg-indigo-600 text-white shadow-xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{doc.name}</span>
              </button>
            ))}
          </div>

          {/* Reading Controls Toolbar */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Text Size Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTextSize("normal")}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  textSize === "normal"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
                title="Normal text size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setTextSize("large")}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  textSize === "large"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
                title="Large readable text size"
              >
                A+
              </button>
            </div>

            {/* Full Contract vs Summary Pill */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("full")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "full"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Full Text</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("summary")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "summary"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ListFilter className="w-3 h-3" />
                <span>Key Clauses</span>
              </button>
            </div>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyDocumentContent}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 transition-colors"
              title="Copy agreement text to clipboard"
            >
              {copiedDocId === currentDoc?.id ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Dedicated Scrollable High-Contrast Legal Text Container */}
        <div className="px-6 sm:px-8 py-3 flex-1 overflow-hidden flex flex-col min-h-0">
          <div 
            ref={scrollContainerRef}
            id="legal-text-scrollable-container"
            className="flex-1 overflow-y-auto rounded-2xl bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-inner text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 scroll-smooth"
            tabIndex={0}
            aria-label="Scrollable Legal Agreement Text"
          >
            {/* Header info inside the text container */}
            <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                  {currentDoc.category ? currentDoc.category.replace(/_/g, " ") : "Legal Schedule"}
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-slate-950 dark:text-white mt-1">
                  {currentDoc.title || currentDoc.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold">
                  {currentDoc.version}
                </span>
                <span>Effective: {currentDoc.effectiveDate}</span>
              </div>
            </div>

            {/* View Mode 1: Full Document Markdown */}
            {viewMode === "full" && (
              <div className="legal-prose text-slate-900 dark:text-slate-100 font-sans max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {currentDoc.content}
                </ReactMarkdown>
              </div>
            )}

            {/* View Mode 2: Key Clauses Summary */}
            {viewMode === "summary" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed">
                  <strong className="font-bold">Executive Summary:</strong> {currentDoc.summary}
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-2">
                  Key Clauses & Critical Protections
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {currentDoc.keyClauses && currentDoc.keyClauses.length > 0 ? (
                    currentDoc.keyClauses.map((clause, cIdx) => (
                      <div 
                        key={cIdx} 
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                            {clause.heading}
                          </h5>
                          {clause.importance && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              clause.importance === "critical"
                                ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
                                : clause.importance === "high"
                                ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                                : "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
                            }`}>
                              {clause.importance}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {clause.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No clause highlights specified for this schedule.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
            <span>Scroll container to read all provisions • Text size adjustable (A / A+)</span>
            <span>Document {activeContractIndex + 1} of {legalDocuments.length}</span>
          </div>
        </div>

        {/* Signature & Acceptance Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5 bg-white dark:bg-slate-900 shrink-0">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <span className="font-bold">Notice:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 transition-colors">
            <input
              type="checkbox"
              id="checkbox-accept-terms-and-privacy"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (e.target.checked) setErrorMessage(null);
              }}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shrink-0"
            />
            <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              I confirm on behalf of my enterprise that I have read and agree to the <strong>Master Terms of Service</strong>,{" "}
              <strong>AI Safety & Acceptable Use Policy</strong>, and{" "}
              <strong>Enterprise Data Privacy Addendum</strong>.
            </span>
          </label>

          {/* Signer Credential Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Authorized Signer Name
              </label>
              <input
                type="text"
                id="input-signer-name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Full Legal Name"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Organization / Enterprise Name
              </label>
              <input
                type="text"
                id="input-organization-name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Company / Enterprise Team"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-0.5">
            <button
              type="button"
              id="btn-preview-guest-mode"
              onClick={handleDismissOrPreview}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto text-center"
            >
              Explore in Preview Mode
            </button>

            <button
              type="button"
              id="btn-confirm-agree-terms-of-service"
              onClick={handleConfirmAgreement}
              disabled={!agreeTerms || isSubmitting}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
              <span>Accept Terms & Enter Workspace</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
