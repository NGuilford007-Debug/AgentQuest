import React, { useState } from "react";
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Download, 
  FileDown,
  RefreshCw, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Layers, 
  ArrowUpRight, 
  AlertTriangle,
  Award,
  Zap,
  CheckCircle2
} from "lucide-react";
import Markdown from "react-markdown";
import { generateRoiExecutiveSummaryPdfReport } from "../utils/pdfExport";

export interface RoiExecutiveReport {
  reportTitle: string;
  period: string;
  generatedAt: string;
  modelUsed: string;
  isSimulated?: boolean;
  executionsAnalyzedCount: number;
  executiveSummary: string;
  headlineMetrics: Array<{
    label: string;
    value: string;
    subtext: string;
    trend: string;
  }>;
  departmentalImpacts: Array<{
    department: string;
    hoursSaved: number;
    impactSummary: string;
    efficiencyGain: string;
  }>;
  operationalHighlights: string[];
  governanceAndQualityAudit: {
    complianceRate: string;
    discrepancyAnalysis: string;
    humanInTheLoopEfficiency: string;
  };
  strategicRecommendations: Array<{
    recommendation: string;
    priority: "High" | "Medium" | "Strategic" | string;
    expectedImpact: string;
  }>;
  fullMarkdownReport: string;
}

interface ROISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: RoiExecutiveReport | null;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

export const ROISummaryModal: React.FC<ROISummaryModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading = false,
  onRegenerate,
}) => {
  const [activeTab, setActiveTab] = useState<"document" | "departments" | "governance" | "recommendations">("document");
  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyMarkdown = async () => {
    if (!report?.fullMarkdownReport) return;
    try {
      await navigator.clipboard.writeText(report.fullMarkdownReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report:", err);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report?.fullMarkdownReport) return;
    const blob = new Blob([report.fullMarkdownReport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ROI-Executive-Report-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      setIsGeneratingPdf(true);
      await generateRoiExecutiveSummaryPdfReport(report, "Apex Enterprise");
    } catch (err) {
      console.error("Failed to generate executive PDF report:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div 
      id="modal-roi-summary" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="roi-summary-modal-title"
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="roi-summary-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {report?.reportTitle || "Executive ROI & Telemetry Impact Report"}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                  <span>Gemini AI Interpreted</span>
                </span>
                {report?.modelUsed && (
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {report.modelUsed}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {report?.period || "Telemetry Evaluation"} • {report?.executionsAnalyzedCount || 0} Task Executions Analyzed • Generated {report?.generatedAt}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              id="btn-copy-roi-summary"
              type="button"
              onClick={handleCopyMarkdown}
              disabled={!report || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Copy markdown to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              id="btn-download-roi-summary"
              type="button"
              onClick={handleDownloadMarkdown}
              disabled={!report || isLoading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Download as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              id="btn-download-pdf-roi-summary"
              type="button"
              onClick={handleDownloadPdf}
              disabled={!report || isLoading || isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Download Executive Summary Report as PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Creating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {onRegenerate && (
              <button
                id="btn-regenerate-roi-summary"
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer disabled:opacity-50"
                title="Regenerate with Gemini AI"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            <button
              id="btn-close-roi-summary-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Sparkles className="w-8 h-8 text-amber-200 animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Interpreting Execution History with Gemini AI...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Analyzing task records, hours liberated, departmental velocity, and quality feedback to synthesize your executive impact briefing.
                </p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* 1. EXECUTIVE SYNOPSIS CALLOUT */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Executive Synopsis</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {report.executiveSummary}
                </p>
              </div>

              {/* 2. HEADLINE METRICS 4-GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {report.headlineMetrics?.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {m.label}
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {m.value}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="truncate">{m.subtext}</span>
                      {m.trend && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 shrink-0">
                          {m.trend}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 3. TABS NAVIGATION */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                <button
                  id="tab-roi-summary-document"
                  type="button"
                  onClick={() => setActiveTab("document")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "document"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Executive Report</span>
                </button>

                <button
                  id="tab-roi-summary-departments"
                  type="button"
                  onClick={() => setActiveTab("departments")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "departments"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Department Velocity ({report.departmentalImpacts?.length || 0})</span>
                </button>

                <button
                  id="tab-roi-summary-governance"
                  type="button"
                  onClick={() => setActiveTab("governance")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "governance"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Quality & Governance</span>
                </button>

                <button
                  id="tab-roi-summary-recommendations"
                  type="button"
                  onClick={() => setActiveTab("recommendations")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "recommendations"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Strategic Actions ({report.strategicRecommendations?.length || 0})</span>
                </button>
              </div>

              {/* 4. TAB CONTENT PANELS */}
              {activeTab === "document" && (
                <div className="space-y-4">
                  {/* Operational Highlights Pills */}
                  {report.operationalHighlights?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span>Observed Execution Milestones</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {report.operationalHighlights.map((hl, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rendered Markdown Document */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed markdown-body max-h-96 overflow-y-auto shadow-inner">
                    <Markdown>{report.fullMarkdownReport}</Markdown>
                  </div>
                </div>
              )}

              {activeTab === "departments" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {report.departmentalImpacts?.map((dept, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {dept.department}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {dept.efficiencyGain}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        <span>{dept.hoursSaved}</span>
                        <span className="text-xs text-slate-400 font-normal">hours liberated</span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {dept.impactSummary}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "governance" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Quality & Spec Compliance</span>
                      </div>
                      <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                        {report.governanceAndQualityAudit?.complianceRate || "98.4%"}
                      </div>
                      <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                        Execution outputs adhering strictly to parameter specifications, schema boundaries, and safety policies.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span>Human-in-the-Loop Intercepts</span>
                      </div>
                      <p className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed mt-1">
                        {report.governanceAndQualityAudit?.humanInTheLoopEfficiency || "Active oversight prevented unverified side effects."}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Discrepancy & Anomaly Audit</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {report.governanceAndQualityAudit?.discrepancyAnalysis || "All flagged workflows were handled in accordance with enterprise governance rules."}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "recommendations" && (
                <div className="space-y-3">
                  {report.strategicRecommendations?.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              rec.priority === "High"
                                ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                : rec.priority === "Strategic"
                                ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {rec.priority} Priority
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Action #{idx + 1}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {rec.recommendation}
                        </p>
                      </div>

                      <div className="shrink-0 text-right sm:border-l sm:border-slate-100 dark:sm:border-slate-800 sm:pl-4">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          Expected Value
                        </div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {rec.expectedImpact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              No summary report available yet. Click Generate Summary to begin.
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autonomous Telemetry Stream Active</span>
          </div>

          <div className="flex items-center gap-2">
            {report && !isLoading && (
              <button
                id="btn-footer-download-pdf"
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                title="Download Executive Summary Report as PDF"
              >
                {isGeneratingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            )}

            <button
              id="btn-close-roi-summary-bottom"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
