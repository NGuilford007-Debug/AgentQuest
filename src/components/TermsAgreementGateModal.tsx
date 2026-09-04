import React, { useState, useMemo } from "react";
import { LegalDocumentItem } from "../types";
import { INITIAL_LEGAL_DOCUMENTS } from "../data/initialLegalDocs";
import { 
  Scale, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  FileText, 
  ChevronRight, 
  Check,
  Building,
  AlertTriangle,
  Sparkles,
  Info,
  Search,
  Download,
  Copy,
  Maximize2,
  Minimize2,
  BookOpen,
  Filter,
  X
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
  userName = "Enterprise User",
  canDismiss = false,
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

  const [selectedDocId, setSelectedDocId] = useState<string>(legalDocuments[0]?.id || "doc-enterprise-reseller");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"full" | "clauses">("full");
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Agreement Checkboxes (prefilled true if already accepted previously)
  const [agreeMasterTos, setAgreeMasterTos] = useState<boolean>(() => Boolean(previouslyAcceptedInfo));
  const [agreeAiSafety, setAgreeAiSafety] = useState<boolean>(() => Boolean(previouslyAcceptedInfo));
  const [agreePrivacyDpa, setAgreePrivacyDpa] = useState<boolean>(() => Boolean(previouslyAcceptedInfo));
  
  // Signer Credentials
  const [signerName, setSignerName] = useState<string>(
    () => previouslyAcceptedInfo?.name || userName
  );
  const [organizationName, setOrganizationName] = useState<string>(
    () => previouslyAcceptedInfo?.organization || "Guilford Enterprise Client"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "All Contracts" },
    { id: "terms_of_service", label: "Terms & Reseller" },
    { id: "acceptable_use", label: "AUP & Safety" },
    { id: "privacy_policy", label: "Privacy & DPA" },
    { id: "other", label: "Authorizations" },
  ];

  const filteredDocs = useMemo(() => {
    return legalDocuments.filter((doc) => {
      const matchesCategory = activeCategory === "all" || doc.category === activeCategory;
      const matchesSearch = 
        !searchQuery.trim() ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [legalDocuments, activeCategory, searchQuery]);

  const selectedDoc = legalDocuments.find((d) => d.id === selectedDocId) || filteredDocs[0] || legalDocuments[0];
  const allChecked = agreeMasterTos && agreeAiSafety && agreePrivacyDpa && signerName.trim().length > 0;

  const handleDownloadDoc = (doc: LegalDocumentItem) => {
    const element = document.createElement("a");
    const file = new Blob([doc.content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-guilford-industries.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyDoc = (doc: LegalDocumentItem) => {
    navigator.clipboard.writeText(doc.content);
    setCopiedDocId(doc.id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const handleConfirmAgreement = () => {
    if (!allChecked) {
      setErrorMessage("Please review and select the agreement boxes and confirm your name to continue.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const signerInfo = {
      name: signerName.trim(),
      organization: organizationName.trim() || "Enterprise Workspace",
      acceptedAt: new Date().toISOString(),
    };

    // Store in localStorage for persistent compliance verification
    try {
      localStorage.setItem("agentflow_tos_accepted", JSON.stringify({
        ...signerInfo,
        version: "v1.0-ENTERPRISE",
        userEmail,
        documentsAccepted: legalDocuments.map(d => ({ id: d.id, name: d.name, version: d.version }))
      }));
    } catch (e) {
      console.warn("Could not save tos acceptance to localStorage:", e);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      fireCelebration();
      onAcceptTerms(signerInfo);
    }, 400);
  };

  const handleAgreeToAll = () => {
    setAgreeMasterTos(true);
    setAgreeAiSafety(true);
    setAgreePrivacyDpa(true);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className={`bg-slate-900 border border-slate-700/80 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? "max-w-[98vw] h-[96vh]" : "max-w-6xl max-h-[92vh]"
      }`}>
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-xs shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Guilford Industries Legal & Terms Governance Gate
                </h2>
                {previouslyAcceptedInfo ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Permanently Accepted & Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Required Onboarding Gate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {previouslyAcceptedInfo
                  ? `Agreements accepted by ${previouslyAcceptedInfo.name || "Authorized Signer"} (${new Date(previouslyAcceptedInfo.acceptedAt).toLocaleDateString()}). You can review clauses or update your signature below.`
                  : "Review, examine clauses, and accept the enterprise contracts for your workspace before proceeding."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleAgreeToAll}
              className="text-xs px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold border border-indigo-500/40 transition-colors whitespace-nowrap"
            >
              Select All Agreements
            </button>
            {(canDismiss || onClose) && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-colors"
                title="Close and return to workspace"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search clauses or terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Content Area: Dual Column (Left Doc Selector, Right Markdown Content) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden bg-slate-950/60">
          {/* Left Navigation: Documents Index */}
          <div className="md:col-span-4 border-r border-slate-800/80 p-4 overflow-y-auto space-y-2 max-h-[300px] md:max-h-none">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center justify-between">
              <span>Binding Contracts ({filteredDocs.length})</span>
              <span className="text-indigo-400 font-mono">Guilford Industries</span>
            </div>

            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all border ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm ring-1 ring-indigo-500/30"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-900 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold truncate">{doc.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {doc.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Area: Document Markdown Content & Key Clauses */}
          <div className="md:col-span-8 p-5 overflow-y-auto space-y-4 max-h-[420px] md:max-h-none bg-slate-900/40">
            {selectedDoc && (
              <div className="space-y-4">
                {/* Doc Meta Header */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      {selectedDoc.title}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-1 font-mono flex-wrap">
                      <span>Provider: Guilford Industries</span>
                      <span>•</span>
                      <span>Version: {selectedDoc.version}</span>
                      <span>•</span>
                      <span>Effective: {selectedDoc.effectiveDate}</span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-sans font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Enforceable
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
                      <button
                        onClick={() => setViewMode("full")}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          viewMode === "full" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Full Contract
                      </button>
                      <button
                        onClick={() => setViewMode("clauses")}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                          viewMode === "clauses" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Key Clauses
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopyDoc(selectedDoc)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      title="Copy contract markdown"
                    >
                      {copiedDocId === selectedDoc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDownloadDoc(selectedDoc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-xs"
                      title="Download markdown file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .MD</span>
                    </button>
                  </div>
                </div>

                {/* Key Clauses Callout */}
                {viewMode === "clauses" && selectedDoc.keyClauses && selectedDoc.keyClauses.length > 0 && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-3">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                      Enforceable Key Clauses Summary
                    </span>
                    <div className="grid grid-cols-1 gap-2.5 text-xs">
                      {selectedDoc.keyClauses.map((clause, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-indigo-900/60">
                          <span className="font-bold text-slate-200 block text-xs mb-1">
                            {clause.heading}
                          </span>
                          <span className="text-xs text-slate-400 leading-relaxed block">
                            {clause.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Markdown Viewer */}
                {viewMode === "full" && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans prose prose-invert max-w-none prose-headings:text-slate-100 prose-a:text-indigo-400 prose-code:text-indigo-300 prose-code:bg-slate-900">
                    <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Agreement Checkboxes & Signoff Bar */}
        <div className="bg-slate-950 border-t border-slate-800 p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-xs text-rose-200 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Checkbox 1 */}
            <label className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 flex items-start gap-3 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={agreeMasterTos}
                onChange={(e) => setAgreeMasterTos(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 shrink-0"
              />
              <span className="text-xs text-slate-300 leading-snug">
                I agree to the <strong>Master Terms of Service & EULA</strong> and <strong>Enterprise Distribution Agreement</strong>.
              </span>
            </label>

            {/* Checkbox 2 */}
            <label className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 flex items-start gap-3 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={agreeAiSafety}
                onChange={(e) => setAgreeAiSafety(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 shrink-0"
              />
              <span className="text-xs text-slate-300 leading-snug">
                I accept the <strong>AI Safety, Autonomy Rules & AUP</strong>, committing to human oversight for high-risk operations.
              </span>
            </label>

            {/* Checkbox 3 */}
            <label className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 flex items-start gap-3 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={agreePrivacyDpa}
                onChange={(e) => setAgreePrivacyDpa(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 shrink-0"
              />
              <span className="text-xs text-slate-300 leading-snug">
                I accept the <strong>Data Privacy Policy & DPA</strong>, with zero customer data retention for model re-training.
              </span>
            </label>
          </div>

          {/* Digital Signature Fields & Confirm Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold whitespace-nowrap">Authorized Signer:</span>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold whitespace-nowrap">Organization:</span>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Organization / Company"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="button"
              id="btn-confirm-agree-terms-of-service"
              onClick={handleConfirmAgreement}
              disabled={!allChecked || isSubmitting}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              )}
              <span>
                {previouslyAcceptedInfo ? "Update Signature & Enter Workspace" : "Accept Terms & Enter AgentFlow"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

