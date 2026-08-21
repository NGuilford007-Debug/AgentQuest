import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { 
  Agent, 
  TaskExecutionRecord, 
  Workflow, 
  AssetItem, 
  ApprovedAutomation 
} from "../types";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Zap, 
  Loader2, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Sliders, 
  RotateCcw, 
  CheckCircle2, 
  Wand2, 
  Plus, 
  Flame, 
  Layers, 
  RefreshCw,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Award
} from "lucide-react";
import { AiTextEnhancer } from "./AiTextEnhancer";
import { MediaPickerModal } from "./MediaPickerModal";
import { fireCelebration } from "../utils/confetti";

interface SmartChatProps {
  agents: Agent[];
  workflows: Workflow[];
  assets: AssetItem[];
  executionHistory: TaskExecutionRecord[];
  onTaskCompleted: (record: TaskExecutionRecord) => void;
  onSaveApprovedAutomation?: (automation: ApprovedAutomation) => void;
  onNavigateToStudio?: () => void;
  onNavigateToImageStudio?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  role?: string;
  text: string;
  timestamp: string;
  modelUsed?: string;
  attachedMedia?: AssetItem[];
  smartActions?: string[];
  executionId?: string;
  isAutoExecuting?: boolean;
}

export const SmartChat: React.FC<SmartChatProps> = ({
  agents,
  workflows,
  assets,
  executionHistory,
  onTaskCompleted,
  onSaveApprovedAutomation,
  onNavigateToStudio,
  onNavigateToImageStudio,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [autoModelSelection, setAutoModelSelection] = useState<boolean>(true);
  const [manualModelOverride, setManualModelOverride] = useState<string>("gemini-3.7-flash");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState<boolean>(false);
  const [attachedMediaList, setAttachedMediaList] = useState<AssetItem[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "msg-welcome",
        sender: "agent",
        agentId: currentAgent?.id,
        agentName: currentAgent?.name || "Agent Intelligence",
        agentAvatar: currentAgent?.avatar,
        role: currentAgent?.role,
        text: `👋 Greetings! I am **${currentAgent?.name || "Your Autonomous Agent"}**, ready to execute tasks, analyze complex data, generate full documents, or dispatch workflows. \n\n*Auto Mode is currently **${isAutoMode ? "ACTIVE" : "MANUAL"}** with dynamic context model routing.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: "gemini-3.7-flash",
        smartActions: [
          "Analyze Redis latency spikes and generate fix script",
          "Draft personalized enterprise cold email proposal",
          "Create Solarpunk shirt vector graphic mockup",
          "Summarize Q3 financial operational ROI"
        ]
      }
    ];
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Context-aware automatic model routing
  const determineOptimalModel = async (prompt: string, mediaCount: number) => {
    if (!autoModelSelection) return manualModelOverride;
    try {
      const res = await fetch("/api/gemini/select-model-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mediaCount }),
      });
      const data = await res.json();
      return data.recommendedModel || "gemini-3.7-flash";
    } catch {
      return "gemini-3.7-flash";
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || !currentAgent || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachedMedia: attachedMediaList.length > 0 ? [...attachedMediaList] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    const mediaForContext = [...attachedMediaList];
    setAttachedMediaList([]);
    setIsProcessing(true);

    try {
      const targetModel = await determineOptimalModel(textToSend, mediaForContext.length);

      let mediaContext = "";
      if (mediaForContext.length > 0) {
        mediaContext = `\n\n[ATTACHED MEDIA ASSETS]:\n` + 
          mediaForContext.map((m) => `- ${m.title} (${m.type}, ${m.department}): ${m.url}`).join("\n");
      }

      const res = await fetch("/api/gemini/prompt-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: {
            ...currentAgent,
            model: targetModel,
          },
          prompt: textToSend,
          context: mediaContext,
          temperature: currentAgent.temperature || 0.2,
        }),
      });

      const data = await res.json();
      const generatedText = data.generatedOutput || data.summary || "Task executed successfully.";

      // Generate dynamic smart suggestion action chips
      const suggestions: string[] = [];
      const lower = textToSend.toLowerCase();
      if (lower.includes("code") || lower.includes("script") || lower.includes("query")) {
        suggestions.push("Run automated unit test suite", "Deploy to Staging environment", "Export as TypeScript module");
      } else if (lower.includes("email") || lower.includes("proposal") || lower.includes("sales")) {
        suggestions.push("Generate CRM follow-up sequence", "Create executive PDF slide", "Calculate customer ROI");
      } else if (lower.includes("image") || lower.includes("shirt") || lower.includes("graphic")) {
        suggestions.push("Open in AI Image Studio", "Save asset to Media Library", "Export print-ready SVG");
      } else {
        suggestions.push("Automate into recurring pipeline", "Save to Approved Automations Vault", "Generate executive briefing");
      }

      const agentMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "agent",
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        agentAvatar: currentAgent.avatar,
        role: currentAgent.role,
        text: generatedText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed || targetModel,
        smartActions: isAutoMode ? suggestions : undefined,
      };

      setMessages((prev) => [...prev, agentMessage]);

      // Record task execution telemetry
      const newRecord: TaskExecutionRecord = {
        id: `exec-${Date.now()}`,
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        workflowId: "wf-smart-chat",
        workflowName: `${currentAgent.name} Smart Chat`,
        department: currentAgent.department,
        inputPayload: textToSend,
        status: isAutoMode ? "completed" : "needs_review",
        title: textToSend.slice(0, 60),
        prompt: textToSend,
        generatedOutput: generatedText,
        summary: data.summary || `Executed via ${currentAgent.name}`,
        stepsOutput: [],
        auditLogs: [`[Executed] Smart Chat dispatch via ${currentAgent.name}`],
        timestamp: new Date().toISOString(),
        hoursSaved: data.hoursSaved || 0.6,
        xpEarned: data.xpEarned || 140,
        creditsCost: data.creditsCost || 10,
        tokensConsumed: data.tokensConsumed || 500,
      };

      onTaskCompleted(newRecord);

      // Auto-save to automations vault if high value
      if (isAutoMode && onSaveApprovedAutomation) {
        onSaveApprovedAutomation({
          id: `auto-chat-${Date.now()}`,
          title: textToSend.slice(0, 50),
          description: generatedText.slice(0, 100) + "...",
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          agentAvatar: currentAgent.avatar,
          department: currentAgent.department,
          modelUsed: data.modelUsed || targetModel,
          sourcePrompt: textToSend,
          generatedContent: generatedText,
          suggestedActions: suggestions,
          category: "automation",
          approvedAt: new Date().toISOString(),
          status: "active",
          estimatedHoursSaved: 0.8,
          tags: [currentAgent.department, "Smart Chat", "Auto Mode"],
          isBookmarked: false,
        });
      }

      fireCelebration();
    } catch (err) {
      console.error("Smart Chat execution failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: "system",
          text: `⚠️ Execution failed or timed out. Please retry or adjust parameters.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-900 text-slate-100">
      {/* LEFT SIDEBAR: AGENT FLEET & QUICK CONTROLS */}
      <div className="w-full md:w-80 lg:w-88 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 p-4 space-y-4 overflow-y-auto">
        {/* Workspace Mode Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Orchestration Mode</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isAutoMode 
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
            }`}>
              {isAutoMode ? "🚀 AUTO MODE" : "⚙️ MANUAL MODE"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setIsAutoMode(true)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                isAutoMode
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Auto</span>
            </button>
            <button
              onClick={() => setIsAutoMode(false)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                !isAutoMode
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Manual</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            {isAutoMode 
              ? "Autonomous execution: Auto-approves suggestions, logs saved hours, and offers 1-click chained workflows." 
              : "Manual mode: Requires approval checkpoints before saving deliverables to the vault."}
          </p>
        </div>

        {/* AI Model Architecture Switcher */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Model Routing</span>
            </span>
            <button
              onClick={() => setAutoModelSelection(!autoModelSelection)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all border ${
                autoModelSelection
                  ? "bg-purple-600/30 text-purple-300 border-purple-500/50"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {autoModelSelection ? "🧠 Auto-Select: ON" : "Manual Select"}
            </button>
          </div>

          {!autoModelSelection ? (
            <select
              value={manualModelOverride}
              onChange={(e) => setManualModelOverride(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            >
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Fast & Balanced)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Deep Reasoning)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra-Low Latency)</option>
            </select>
          ) : (
            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-900/50 text-[11px] text-purple-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse text-purple-400" />
              <span>Smart router auto-selects model based on code, length, and task depth.</span>
            </div>
          )}
        </div>

        {/* Agent Roster Select List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Agent Fleet ({agents.length})
          </span>

          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? "bg-slate-800 border-purple-500 shadow-md shadow-purple-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/80"
                }`}
              >
                <div className="relative">
                  <img
                    src={agent.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"}
                    alt={agent.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{agent.name}</h4>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">{agent.model.split("-")[0]}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{agent.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
        {/* Chat Active Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentAgent?.avatar}
              alt={currentAgent?.name}
              className="w-10 h-10 rounded-2xl object-cover border border-purple-500/40 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">{currentAgent?.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {currentAgent?.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{currentAgent?.department} • Model: <span className="text-purple-300 font-mono">{currentAgent?.model}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToImageStudio && (
              <button
                onClick={onNavigateToImageStudio}
                className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-800 flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Image Studio</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Thread List */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {!isUser ? (
                  <img
                    src={msg.agentAvatar || currentAgent?.avatar}
                    alt={msg.agentName}
                    className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-700 mt-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-2 max-w-2xl ${isUser ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-200">{isUser ? "You" : msg.agentName}</span>
                    <span>• {msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-purple-300">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>

                  {/* Attached Media Cards if user provided */}
                  {msg.attachedMedia && msg.attachedMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachedMedia.map((media) => (
                        <div
                          key={media.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs"
                        >
                          <img
                            src={media.url}
                            alt={media.title}
                            className="w-8 h-8 rounded-lg object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-medium text-slate-200 max-w-[140px] truncate">{media.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white rounded-tr-xs shadow-md shadow-blue-600/20"
                        : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs shadow-xl"
                    }`}
                  >
                    <div className="prose prose-invert prose-xs max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>

                  {/* Agent Action Toolbar & Smart Suggestion Chips */}
                  {!isUser && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Result</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Smart Dynamic Action Chips */}
                      {msg.smartActions && msg.smartActions.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1 mb-1.5">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Suggested Follow-Up Actions:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.smartActions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(action)}
                                className="text-[11px] px-3 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/70 hover:border-purple-600 transition-all text-left flex items-center gap-1.5 active:scale-95 shadow-xs"
                              >
                                <span>{action}</span>
                                <ArrowRight className="w-3 h-3 text-purple-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 max-w-xl">
              <img
                src={currentAgent?.avatar}
                alt={currentAgent?.name}
                className="w-8 h-8 rounded-xl object-cover border border-purple-500/40 mt-1"
                referrerPolicy="no-referrer"
              />
              <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 text-xs text-purple-400 flex items-center gap-2 shadow-xl animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {currentAgent?.name} is synthesizing response via foundational model...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Attachment Tools */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          {/* Active Attached Media Preview */}
          {attachedMediaList.length > 0 && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">Attached:</span>
              {attachedMediaList.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-200 border border-slate-700"
                >
                  <img src={m.url} alt={m.title} className="w-4 h-4 rounded object-cover" referrerPolicy="no-referrer" />
                  <span className="max-w-[100px] truncate">{m.title}</span>
                  <button
                    onClick={() => setAttachedMediaList((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
            {/* Media Insert Button */}
            <button
              type="button"
              onClick={() => setIsMediaPickerOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors"
              title="Insert photo or document from Media Library"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Input Text Area */}
            <textarea
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask ${currentAgent?.name} anything or assign a task... (Shift+Enter for new line)`}
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden resize-none max-h-32 py-1.5 leading-relaxed"
            />

            {/* AI Text Enhancer Button */}
            <AiTextEnhancer
              value={inputPrompt}
              onApply={(enhanced) => setInputPrompt(enhanced)}
              contextType="prompt"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() || isProcessing}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-all shadow-md shadow-purple-600/30 active:scale-95 flex items-center justify-center"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Clever Media Library Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        assets={assets}
        onSelectMedia={(selected) => {
          setAttachedMediaList((prev) => [...prev, selected]);
        }}
      />
    </div>
  );
};
