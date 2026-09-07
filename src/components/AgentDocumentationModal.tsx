import React, { useState, useMemo } from "react";
import Markdown from "react-markdown";
import JSZip from "jszip";
import { 
  Agent, 
  Workflow, 
  WorkflowNode, 
  WorkflowConnection, 
  AiModel, 
  PermissionScope 
} from "../types";
import { 
  generateAgentReadme, 
  generateAgentSlug 
} from "../utils/agentReadmeGenerator";
import { fireCelebration } from "../utils/confetti";
import { 
  X, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Archive, 
  Layers, 
  Sparkles, 
  Code, 
  Eye, 
  CheckSquare, 
  Square, 
  Bot, 
  Workflow as WorkflowIcon, 
  ExternalLink,
  Loader2,
  FileCode,
  Share2
} from "lucide-react";

interface AgentDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current agent being configured in the builder
  currentAgentData: {
    id?: string;
    name: string;
    role: string;
    department: string;
    description: string;
    model: string;
    temperature: number;
    autonomyLevel: string;
    assignedUserName?: string;
    assignedTeam?: string;
    selectedPermissions?: string[];
    systemPrompt: string;
  };
  currentWorkflow?: Workflow | null;
  workflows?: Workflow[];
  allAgents?: Agent[];
  availableModels?: AiModel[];
  availablePermissions?: PermissionScope[];
}

export const AgentDocumentationModal: React.FC<AgentDocumentationModalProps> = ({
  isOpen,
  onClose,
  currentAgentData,
  currentWorkflow,
  workflows = [],
  allAgents = [],
  availableModels = [],
  availablePermissions = [],
}) => {
  const [activeTab, setActiveTab] = useState<"rendered" | "raw" | "batch_export">("rendered");
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Batch Export state
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(() => {
    return allAgents.map((a) => a.id);
  });
  const [batchFormat, setBatchFormat] = useState<"zip" | "combined_md" | "json">("zip");

  // Generate README for current agent
  const currentReadme = useMemo(() => {
    return generateAgentReadme({
      agent: {
        id: currentAgentData.id,
        name: currentAgentData.name,
        role: currentAgentData.role,
        department: currentAgentData.department,
        description: currentAgentData.description,
        model: currentAgentData.model,
        temperature: currentAgentData.temperature,
        autonomyLevel: currentAgentData.autonomyLevel,
        assignedTo: {
          userName: currentAgentData.assignedUserName || "Alex Mercer",
          team: currentAgentData.assignedTeam || "Operations",
        },
        permissions: currentAgentData.selectedPermissions,
        systemPrompt: currentAgentData.systemPrompt,
      },
      workflow: currentWorkflow,
      workflowNodes: currentWorkflow?.nodes,
      workflowConnections: currentWorkflow?.connections,
      availableModels,
      availablePermissions,
    });
  }, [currentAgentData, currentWorkflow, availableModels, availablePermissions]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copy single README to clipboard
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(currentReadme);
      setCopied(true);
      showToast("README.md copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Unable to copy to clipboard.");
    }
  };

  // Download single README.md
  const handleDownloadSingleReadme = () => {
    const filename = `${generateAgentSlug(currentAgentData.name)}-README.md`;
    const blob = new Blob([currentReadme], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    fireCelebration();
    showToast(`Downloaded ${filename}`);
  };

  // Toggle agent selection for batch export
  const toggleAgentSelection = (id: string) => {
    if (selectedAgentIds.includes(id)) {
      setSelectedAgentIds(selectedAgentIds.filter((item) => item !== id));
    } else {
      setSelectedAgentIds([...selectedAgentIds, id]);
    }
  };

  const handleSelectAllAgents = () => {
    if (selectedAgentIds.length === allAgents.length) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds(allAgents.map((a) => a.id));
    }
  };

  // Execute Batch Export
  const handleRunBatchExport = async () => {
    const agentsToExport = allAgents.filter((a) => selectedAgentIds.includes(a.id));
    if (agentsToExport.length === 0) {
      showToast("Please select at least one agent to export.");
      return;
    }

    setIsExportingZip(true);
    const dateStr = new Date().toISOString().split("T")[0];

    try {
      if (batchFormat === "zip") {
        const zip = new JSZip();

        // 1. Generate individual READMEs in the ZIP
        let indexDoc = `# Enterprise AI Agent Workforce — Documentation Index\n\n`;
        indexDoc += `**Export Date:** ${new Date().toUTCString()}\n`;
        indexDoc += `**Total Agents Exported:** ${agentsToExport.length}\n\n`;
        indexDoc += `| Agent Name | Department | Autonomy Level | Model | Workflow Nodes | README File |\n`;
        indexDoc += `| :--- | :--- | :--- | :--- | :---: | :--- |\n`;

        for (const agent of agentsToExport) {
          const agentWf =
            workflows.find((w) => w.agentId === agent.id) ||
            workflows.find((w) => w.department === agent.department) ||
            workflows[0];

          const readmeContent = generateAgentReadme({
            agent,
            workflow: agentWf,
            workflowNodes: agentWf?.nodes,
            workflowConnections: agentWf?.connections,
            availableModels,
            availablePermissions,
          });

          const filename = `${generateAgentSlug(agent.name)}-README.md`;
          zip.file(`agents/${filename}`, readmeContent);

          const nodeCount = agentWf?.nodes?.length || 0;
          indexDoc += `| **${agent.name}** | ${agent.department} | \`${agent.autonomyLevel}\` | \`${agent.model}\` | ${nodeCount} nodes | [\`${filename}\`](./agents/${filename}) |\n`;
        }

        zip.file("README.md", indexDoc);

        // Generate and download zip
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `agentflow-documentation-bundle-${dateStr}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        fireCelebration();
        showToast(`Successfully generated ZIP archive with ${agentsToExport.length} agents!`);
      } else if (batchFormat === "combined_md") {
        // Combined master markdown
        let combinedMd = `# Enterprise AI Workforce Architecture Master Guide\n\n`;
        combinedMd += `> Generated on ${new Date().toUTCString()} for AgentFlow Enterprise\n\n`;
        combinedMd += `## 📋 Workforce Table of Contents\n\n`;

        agentsToExport.forEach((agent, i) => {
          combinedMd += `${i + 1}. [${agent.name} (${agent.department})](#${generateAgentSlug(agent.name)})\n`;
        });
        combinedMd += `\n---\n\n`;

        for (const agent of agentsToExport) {
          const agentWf =
            workflows.find((w) => w.agentId === agent.id) ||
            workflows.find((w) => w.department === agent.department) ||
            workflows[0];

          const readmeContent = generateAgentReadme({
            agent,
            workflow: agentWf,
            workflowNodes: agentWf?.nodes,
            workflowConnections: agentWf?.connections,
            availableModels,
            availablePermissions,
          });

          combinedMd += `<a id="${generateAgentSlug(agent.name)}"></a>\n\n`;
          combinedMd += `${readmeContent}\n\n`;
          combinedMd += `\n---\n\n`;
        }

        const blob = new Blob([combinedMd], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `agentflow-all-agents-documentation-${dateStr}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        fireCelebration();
        showToast(`Master Documentation downloaded (${agentsToExport.length} agents)!`);
      } else if (batchFormat === "json") {
        // Structured JSON manifest
        const manifest = {
          version: "1.0.0",
          exportedAt: new Date().toISOString(),
          workspace: "AgentFlow Enterprise",
          totalAgents: agentsToExport.length,
          agents: agentsToExport.map((agent) => {
            const agentWf =
              workflows.find((w) => w.agentId === agent.id) ||
              workflows.find((w) => w.department === agent.department) ||
              workflows[0];

            return {
              id: agent.id,
              name: agent.name,
              role: agent.role,
              department: agent.department,
              model: agent.model,
              autonomyLevel: agent.autonomyLevel,
              systemPrompt: agent.systemPrompt,
              permissions: agent.permissions,
              workflow: agentWf
                ? {
                    id: agentWf.id,
                    name: agentWf.name,
                    nodes: agentWf.nodes,
                    connections: agentWf.connections,
                  }
                : null,
            };
          }),
        };

        const blob = new Blob([JSON.stringify(manifest, null, 2)], {
          type: "application/json;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `agentflow-manifest-export-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        fireCelebration();
        showToast(`Exported JSON manifest for ${agentsToExport.length} agents!`);
      }
    } catch (err) {
      console.error(err);
      showToast("Error during batch export. Please try again.");
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Agent Documentation & Architecture README
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800">
                  {currentAgentData.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Auto-generated system specifications, prompt directives, and connected workflow nodes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Copy README Markdown to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy MD"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSingleReadme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download README.md for this agent"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("rendered")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "rendered"
                  ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Rendered Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "raw"
                  ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw README.md</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={() => setActiveTab("batch_export")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "batch_export"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Batch Export Documentation</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                {allAgents.length} Agents
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <WorkflowIcon className="w-3.5 h-3.5 text-blue-500" />
              {currentWorkflow?.nodes?.length || 0} Workflow Nodes Included
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Rendered Markdown */}
          {activeTab === "rendered" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Highlight summary card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-blue-50 dark:from-slate-800/60 dark:to-slate-800/40 border border-teal-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    MD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Agent Architecture Specification (README.md)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Grounded in real-time prompt guidelines, autonomy tiers, and current canvas node graph.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSingleReadme}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.md)</span>
                  </button>
                </div>
              </div>

              {/* Rendered Container */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="markdown-body prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
                  <Markdown>{currentReadme}</Markdown>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Raw Markdown Source */}
          {activeTab === "raw" && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Raw Markdown Content (`README.md`)
                </span>
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy to Clipboard"}</span>
                </button>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[58vh]">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                  {currentReadme}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Batch Export Drawer */}
          {activeTab === "batch_export" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Batch Export Header Notice */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
                    <Archive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Batch Export Agent Documentation
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Generate comprehensive technical documentation for multiple agents at once, including their custom system prompts, assigned permission gates, and execution workflow nodes.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isExportingZip || selectedAgentIds.length === 0}
                  onClick={handleRunBatchExport}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  {isExportingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Packaging Export...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export {selectedAgentIds.length} Selected Agents</span>
                    </>
                  )}
                </button>
              </div>

              {/* Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Export Package Format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBatchFormat("zip")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      batchFormat === "zip"
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                        <Archive className="w-4 h-4 text-indigo-500" />
                        <span>ZIP Archive of READMEs</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Individual README.md files for each agent inside a clean zip folder with a master index.
                      </p>
                    </div>
                    <span className="mt-2 inline-block text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      .zip bundle
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchFormat("combined_md")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      batchFormat === "combined_md"
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                        <FileText className="w-4 h-4 text-teal-500" />
                        <span>Master Consolidated .md</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        A single comprehensive operations manual linking all agent architecture blueprints.
                      </p>
                    </div>
                    <span className="mt-2 inline-block text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                      ALL_AGENTS_GUIDE.md
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchFormat("json")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      batchFormat === "json"
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                        <FileCode className="w-4 h-4 text-amber-500" />
                        <span>Architecture JSON Manifest</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Structured machine-readable data containing prompts, node graphs, and permissions.
                      </p>
                    </div>
                    <span className="mt-2 inline-block text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                      .json specification
                    </span>
                  </button>
                </div>
              </div>

              {/* Agent Selection List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllAgents}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {selectedAgentIds.length === allAgents.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>
                        {selectedAgentIds.length === allAgents.length
                          ? "Deselect All"
                          : "Select All Agents"}
                      </span>
                    </button>
                    <span className="text-xs text-slate-400">
                      ({selectedAgentIds.length} of {allAgents.length} selected)
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    Includes prompt templates and canvas node stages
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto pr-1">
                  {allAgents.map((agent) => {
                    const isSelected = selectedAgentIds.includes(agent.id);
                    const agentWf =
                      workflows.find((w) => w.agentId === agent.id) ||
                      workflows.find((w) => w.department === agent.department) ||
                      workflows[0];
                    const nodeCount = agentWf?.nodes?.length || 0;

                    return (
                      <div
                        key={agent.id}
                        onClick={() => toggleAgentSelection(agent.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="text-indigo-600 dark:text-indigo-400 shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {agent.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span>{agent.department}</span>
                              <span>•</span>
                              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                                {nodeCount} nodes
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${
                            agent.autonomyLevel === "autonomous"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : agent.autonomyLevel === "hitl"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {agent.autonomyLevel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {toastMessage ? (
              <span className="font-bold text-teal-600 dark:text-teal-400 animate-in fade-in">
                {toastMessage}
              </span>
            ) : (
              <span>
                Generated from system prompt ({currentAgentData.systemPrompt.length} chars) &amp;{" "}
                {currentWorkflow?.nodes?.length || 0} canvas workflow nodes.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadSingleReadme}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
