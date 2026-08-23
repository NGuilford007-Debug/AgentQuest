import React, { useState } from "react";
import { LegalDocumentItem, EmployeeProfile } from "../types";
import { 
  Scale, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Search, 
  Lock, 
  AlertTriangle, 
  FileCode, 
  Clock, 
  Building, 
  Check, 
  Copy,
  Info
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LegalGovernanceCenterProps {
  documents: LegalDocumentItem[];
  userProfile?: EmployeeProfile;
  onOpenPricing?: (planId?: string) => void;
  onOpenTermsGate?: () => void;
  onUpdateDocuments?: (docs: LegalDocumentItem[]) => void;
  onAcceptDocument?: (docId: string) => void;
  companyName?: string;
  brandName?: string;
  isMasterDeveloper?: boolean;
}

export const LegalGovernanceCenter: React.FC<LegalGovernanceCenterProps> = ({
  documents,
  userProfile,
  onOpenPricing,
  onOpenTermsGate,
  onUpdateDocuments,
  onAcceptDocument,
  companyName = "Guilford Industries",
  brandName = "AgentFlow",
  isMasterDeveloper = true
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || "doc-enterprise-reseller");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") return matchesSearch;
    return matchesSearch && doc.category === activeCategory;
  });

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  const handleDownloadDoc = (doc: LegalDocumentItem) => {
    const element = document.createElement("a");
    const file = new Blob([doc.content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 px-6 py-6 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Enterprise Compliance & Governance
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active Legal Framework
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Terms of Service & Legalities
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Official enterprise terms of service, AI governance, autonomous agent operation boundaries, and GDPR/CCPA data privacy agreements bound to {companyName}.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {onOpenTermsGate && (
              <button
                onClick={onOpenTermsGate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                title="Review terms and agreement sign-off dialog"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span>Review Terms Gate</span>
              </button>
            )}

            <button
              onClick={() => selectedDoc && handleDownloadDoc(selectedDoc)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 border border-indigo-400/30 transition-all active:scale-95"
              title="Download selected legal document as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Contract (.MD)</span>
            </button>

            <button
              onClick={() => {
                if (selectedDoc) {
                  handleCopyContent(selectedDoc.content, selectedDoc.id);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copiedDocId === selectedDoc?.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Agreement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Governance Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Navigation Sidebar */}
        <div className="w-full lg:w-80 border-r border-slate-800/80 bg-slate-950/60 p-4 space-y-4 shrink-0 flex flex-col">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search legal documents & clauses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-3">
            {[
              { id: "all", label: "All Contracts (8)" },
              { id: "terms_of_service", label: "Enterprise & EULA" },
              { id: "privacy_policy", label: "Privacy & Data" },
              { id: "ai_ethics", label: "AI Safety" },
              { id: "acceptable_use", label: "Acceptable Use" },
              { id: "compliance", label: "Compliance & DPA" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Document Cards List */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDoc?.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 group ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-500/10 text-white"
                      : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold truncate text-slate-100 group-hover:text-white">
                      {doc.name}
                    </span>
                    {doc.isAcceptedByCurrentUser && (
                      <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0" title="Terms Accepted">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 mt-1">
                    <span className="font-mono">{doc.version}</span>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {doc.category.replace(/_/g, " ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Document Viewport */}
        {selectedDoc ? (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950 p-6 lg:p-8 space-y-6 overflow-y-auto">
            {/* Document Header Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {selectedDoc.category.replace(/_/g, " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedDoc.version}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Legally Binding & Active
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {selectedDoc.title}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    Enterprise Tenant: <strong className="text-slate-200">{companyName}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Effective Date: <strong className="text-slate-200">{selectedDoc.effectiveDate}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    Last Audit: <strong className="text-slate-200">{selectedDoc.lastReviewed}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => handleCopyContent(selectedDoc.content, selectedDoc.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copiedDocId === selectedDoc.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadDoc(selectedDoc)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export .MD</span>
                </button>
              </div>
            </div>

            {/* Key Enforceable Clauses Grid */}
            {selectedDoc.keyClauses && selectedDoc.keyClauses.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Key Legal Clauses & Operational Safeguards
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedDoc.keyClauses.map((clause, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {clause.heading}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          clause.importance === "critical"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : clause.importance === "high"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}>
                          {clause.importance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {clause.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Full Text Body */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-inner">
              <div className="prose prose-invert prose-indigo max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-hr:border-slate-800 prose-a:text-indigo-400 prose-strong:text-white">
                <ReactMarkdown>
                  {selectedDoc.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Acceptance Signoff & Bottom Banner */}
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Compliance & Master Agreement Status
                  </h4>
                  <p className="text-xs text-slate-400">
                    This document is legally binding across all autonomous agent dispatches, API invocations, and tenant users.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Terms Accepted & Enforced
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
            Select a document from the left list to view terms of service.
          </div>
        )}
      </div>
    </div>
  );
};
