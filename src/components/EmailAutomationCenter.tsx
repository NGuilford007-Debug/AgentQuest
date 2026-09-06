import React, { useState, useMemo } from "react";
import { 
  ALL_PLATFORM_FEATURES, 
  SAMPLE_ACTION_RECEIPTS, 
  INITIAL_DISPATCHED_EMAILS,
  generateWelcomeEmailHtml, 
  generateActionReceiptHtml,
  PlatformFeatureItem
} from "../data/emailTemplates";
import { ActionReceiptDetails, DispatchedEmail, EmployeeProfile, Workflow, ActionEmailTrigger, TriggerRuleSet } from "../types";
import { playInteractiveSound } from "../utils/audioSynth";
import { fireCelebration } from "../utils/confetti";
import { ActionTriggersPanel } from "./ActionTriggersPanel";
import { WorkflowMetricsPanel } from "./WorkflowMetricsPanel";
import { ConditionBuilder } from "./ConditionBuilder";
import { INITIAL_ACTION_TRIGGERS, createSimulatedTriggerEmail } from "../data/emailActionTriggers";
import { evaluateTriggerRuleSet, getDefaultTestContext } from "../data/emailConditionFields";
import { 
  Mail, 
  Send, 
  Inbox, 
  Receipt, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  Copy, 
  RotateCcw, 
  Smartphone, 
  Monitor, 
  Code, 
  FileText, 
  Check, 
  Search, 
  ExternalLink, 
  Layers, 
  Bot, 
  Zap, 
  Workflow as WorkflowIcon, 
  DollarSign, 
  AlertCircle, 
  ThumbsUp, 
  Sliders,
  ChevronRight,
  ChevronDown,
  Activity,
  BarChart3,
  TrendingUp,
  Filter
} from "lucide-react";

interface EmailAutomationCenterProps {
  userProfile: EmployeeProfile;
  workflows: Workflow[];
  developerCompanyName?: string;
  onNavigateToTab?: (tab: string) => void;
  onUpdateWorkflow?: (updated: Workflow) => void;
}

export const EmailAutomationCenter: React.FC<EmailAutomationCenterProps> = ({
  userProfile,
  workflows,
  developerCompanyName = "Guilford Industries",
  onNavigateToTab,
  onUpdateWorkflow
}) => {
  // Navigation tabs within the email center
  const [activeSubTab, setActiveSubTab] = useState<"welcome" | "receipts" | "triggers" | "conditions" | "metrics" | "triage" | "outbox">("conditions");
  const [conditionBuilderTargetId, setConditionBuilderTargetId] = useState<string>("trig-user-onboarding");

  // Dispatched emails store
  const [dispatchedEmails, setDispatchedEmails] = useState<DispatchedEmail[]>(INITIAL_DISPATCHED_EMAILS);

  // Action Triggers State
  const [actionTriggers, setActionTriggers] = useState<ActionEmailTrigger[]>(() => {
    try {
      const saved = localStorage.getItem("agentflow_email_action_triggers_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return INITIAL_ACTION_TRIGGERS;
  });

  const activeTriggersCount = actionTriggers.filter((t) => t.enabled).length;

  const handleUpdateTriggerRuleSet = (triggerId: string, ruleSet: TriggerRuleSet) => {
    setActionTriggers((prev) => {
      const next: ActionEmailTrigger[] = prev.map((t) => 
        t.id === triggerId 
          ? { ...t, ruleSet, triggerCondition: "custom_logic" as const } 
          : t
      );
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSimulateTriggerWithContext = (
    trigger: ActionEmailTrigger,
    context: Record<string, any>,
    suppressed: boolean
  ) => {
    if (suppressed) {
      showToast(`Simulated Event: Email for "${trigger.name}" was SUPPRESSED because condition rules evaluated to FALSE.`);
      return;
    }

    const newEmail = createSimulatedTriggerEmail(trigger, userProfile.name || "Alex Mercer");
    if (trigger.ruleSet?.description) {
      newEmail.previewText = `[Condition Verified: ${trigger.ruleSet.description}] ${newEmail.previewText}`;
    }
    setDispatchedEmails((prev) => [newEmail, ...prev]);
    setActionTriggers((prev) => {
      const next = prev.map((t) => (t.id === trigger.id ? { ...t, totalTriggered: (t.totalTriggered || 0) + 1, lastTriggered: "Just now" } : t));
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleToggleActionTrigger = (triggerId: string) => {
    setActionTriggers((prev) => {
      const next = prev.map((t) => t.id === triggerId ? { ...t, enabled: !t.enabled } : t);
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    const target = actionTriggers.find((t) => t.id === triggerId);
    const nextState = !target?.enabled;
    playInteractiveSound(nextState ? "chime" : "click");
    showToast(`Email trigger "${target?.name || 'Action'}" is now ${nextState ? "ACTIVE" : "MUTED"}.`);
  };

  const handleToggleShaProof = (triggerId: string) => {
    setActionTriggers((prev) => {
      const next = prev.map((t) => t.id === triggerId ? { ...t, includeSha256Proof: !t.includeSha256Proof } : t);
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    playInteractiveSound("click");
  };

  const handleChangeCondition = (triggerId: string, condition: ActionEmailTrigger["triggerCondition"]) => {
    setActionTriggers((prev) => {
      const next = prev.map((t) => t.id === triggerId ? { ...t, triggerCondition: condition } : t);
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    playInteractiveSound("click");
  };

  const handleUpdateRecipientEmail = (triggerId: string, email: string) => {
    setActionTriggers((prev) => {
      const next = prev.map((t) => t.id === triggerId ? { ...t, recipientEmail: email } : t);
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSimulateTrigger = (trigger: ActionEmailTrigger) => {
    // If trigger has active custom logic conditions, check them first
    if (trigger.ruleSet?.enabled && trigger.ruleSet.conditions.length > 0) {
      const testContext = getDefaultTestContext();
      // Ensure user profile setup matches live user context
      const evalRes = evaluateTriggerRuleSet(trigger.ruleSet, testContext);
      if (!evalRes.overallMatch) {
        playInteractiveSound("click");
        showToast(`Trigger SUPPRESSED: Conditions not met (${trigger.ruleSet.description || 'Custom rules'}). Check Condition Builder.`);
        return;
      }
    }

    playInteractiveSound("laser");
    fireCelebration();
    const newEmail = createSimulatedTriggerEmail(trigger, userProfile.name || "Alex Mercer");
    setDispatchedEmails((prev) => [newEmail, ...prev]);
    setActionTriggers((prev) => {
      const next = prev.map((t) => t.id === trigger.id ? { ...t, totalTriggered: (t.totalTriggered || 0) + 1, lastTriggered: "Just now" } : t);
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast(`Simulated "${trigger.name}"! Email dispatched to ${trigger.recipientEmail} & logged to Outbox.`);
  };

  const handleEnableAllTriggers = () => {
    setActionTriggers((prev) => {
      const next = prev.map((t) => ({ ...t, enabled: true }));
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    playInteractiveSound("chime");
    showToast("All action email triggers ENABLED.");
  };

  const handleDisableAllTriggers = () => {
    setActionTriggers((prev) => {
      const next = prev.map((t) => ({ ...t, enabled: false }));
      try {
        localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    playInteractiveSound("click");
    showToast("All action email triggers MUTED.");
  };

  const handleResetDefaults = () => {
    setActionTriggers(INITIAL_ACTION_TRIGGERS);
    try {
      localStorage.setItem("agentflow_email_action_triggers_v1", JSON.stringify(INITIAL_ACTION_TRIGGERS));
    } catch (e) {}
    playInteractiveSound("chime");
    showToast("Reset action triggers to production defaults.");
  };

  // Workflow Email Toggle & Simulation
  const handleToggleWorkflowEmail = (workflowId: string) => {
    const target = workflows.find((w) => w.id === workflowId);
    if (!target) return;
    const nextVal = !(target.emailNotificationsEnabled ?? true);
    const updated: Workflow = {
      ...target,
      emailNotificationsEnabled: nextVal
    };
    if (onUpdateWorkflow) {
      onUpdateWorkflow(updated);
    }
    playInteractiveSound(nextVal ? "chime" : "click");
    showToast(`Workflow "${target.name}" email alerts ${nextVal ? "ENABLED" : "MUTED"}`);
  };

  const handleSimulateWorkflowRun = (wf: Workflow) => {
    playInteractiveSound("laser");
    fireCelebration();
    const nowTime = new Date().toISOString();
    const receiptId = `RCP-WF-${Math.floor(100000 + Math.random() * 900000)}`;
    const newRuns = (wf.totalRuns || 0) + 1;
    const newEmails = (wf.totalEmailsSent || 0) + (wf.emailNotificationsEnabled !== false ? 1 : 0);

    if (onUpdateWorkflow) {
      onUpdateWorkflow({
        ...wf,
        totalRuns: newRuns,
        totalEmailsSent: newEmails,
        lastRun: "Just now",
        lastEmailDispatched: "Just now"
      });
    }

    if (wf.emailNotificationsEnabled !== false) {
      const newEmail: DispatchedEmail = {
        id: `dispatch-${Date.now()}`,
        type: "action_receipt",
        recipientEmail: "toppgunn321@gmail.com",
        recipientName: userProfile.name || "Alex Mercer",
        subject: `ACTION RECEIPT: ${wf.name} Executed Successfully [#${receiptId}]`,
        previewText: `Pipeline ${wf.name} executed successfully. Duration: 242ms. 100% Success.`,
        htmlContent: `<div style="font-family: sans-serif; padding: 20px;"><h2>ACTION RECEIPT: ${wf.name}</h2><p>Pipeline: ${wf.name} (${wf.department})</p><p>Duration: 242ms</p><p>Status: 100% Success</p></div>`,
        plainText: `WORKFLOW EXECUTION ACTION RECEIPT\nPipeline: ${wf.name}\nDepartment: ${wf.department}\nNodes Executed: ${wf.nodes.length}\nDuration: 242ms\nStatus: 100% SUCCESS\nRecipient: toppgunn321@gmail.com`,
        timestamp: nowTime,
        status: "Delivered"
      };
      setDispatchedEmails((prev) => [newEmail, ...prev]);
      showToast(`Pipeline "${wf.name}" executed! Action receipt dispatched to toppgunn321@gmail.com`);
    } else {
      showToast(`Pipeline "${wf.name}" executed (Email notifications are muted for this pipeline).`);
    }
  };

  // Welcome Email State
  const [welcomeRecipientName, setWelcomeRecipientName] = useState<string>(userProfile.name || "Alex Mercer");
  const [welcomeRecipientEmail, setWelcomeRecipientEmail] = useState<string>("toppgunn321@gmail.com");
  const [welcomeSubject, setWelcomeSubject] = useState<string>("Welcome to AgentFlow Enterprise — Complete Platform Feature Tour & Capabilities Guide");
  const [autoWelcomeOnSignup, setAutoWelcomeOnSignup] = useState<boolean>(true);
  const [welcomeDevicePreview, setWelcomeDevicePreview] = useState<"desktop" | "mobile" | "code" | "text">("desktop");
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>("chat");
  const [featureSearchQuery, setFeatureSearchQuery] = useState<string>("");

  // Action Receipts State
  const [selectedReceiptIndex, setSelectedReceiptIndex] = useState<number>(0);
  const [receiptRecipientEmail, setReceiptRecipientEmail] = useState<string>("toppgunn321@gmail.com");
  const [receiptDevicePreview, setReceiptDevicePreview] = useState<"visual" | "html" | "text">("visual");
  const [autoReceiptsOnDeploy, setAutoReceiptsOnDeploy] = useState<boolean>(true);

  // Inbound Triage State
  const [inboundSender, setInboundSender] = useState<string>("lead-devops@acmecorp.io");
  const [inboundSubject, setInboundSubject] = useState<string>("Inquiry: How does the workflow canvas mini-map and agent auto-healing work?");
  const [inboundBody, setInboundBody] = useState<string>(
    "Hi team, our company is evaluating AgentFlow Enterprise for 40 SRE engineers. We saw your visual workflow studio with draggable mini-map and the auto-healing telemetry. Could you send us an overview of all platform features and an example execution receipt for our security review?"
  );
  const [isTriaging, setIsTriaging] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<{
    sentiment: "positive" | "urgent" | "neutral";
    intent: string;
    urgencyScore: number;
    recommendedReplySubject: string;
    recommendedReplyBody: string;
    suggestedAttachments: string[];
  } | null>(null);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<boolean>(false);

  // Active email payload modal
  const [inspectingEmail, setInspectingEmail] = useState<DispatchedEmail | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
    showToast("Content copied to clipboard!");
  };

  // Welcome email HTML & plaintext
  const welcomeHtml = useMemo(() => {
    return generateWelcomeEmailHtml(welcomeRecipientName, developerCompanyName);
  }, [welcomeRecipientName, developerCompanyName]);

  const currentReceipt = SAMPLE_ACTION_RECEIPTS[selectedReceiptIndex] || SAMPLE_ACTION_RECEIPTS[0];
  const receiptHtml = useMemo(() => {
    return generateActionReceiptHtml(currentReceipt, developerCompanyName);
  }, [currentReceipt, developerCompanyName]);

  // Dispatch Welcome Email
  const handleDispatchWelcomeEmail = () => {
    playInteractiveSound("chime");
    fireCelebration();

    const newEmail: DispatchedEmail = {
      id: `mail-welcome-${Date.now()}`,
      type: "welcome_features",
      recipientEmail: welcomeRecipientEmail,
      recipientName: welcomeRecipientName,
      subject: welcomeSubject,
      previewText: "Your enterprise automation workspace is ready. Explore all 17 flagship modules, visual workflow canvas, autonomous agents, and monetization tools.",
      timestamp: new Date().toISOString(),
      status: "Delivered",
      featureTourIncluded: true,
      htmlContent: welcomeHtml,
      plainText: `Welcome to AgentFlow Enterprise! Complete tour of all 17 platform features dispatched to ${welcomeRecipientEmail}.`,
    };

    setDispatchedEmails((prev) => [newEmail, ...prev]);
    showToast(`Welcome Feature Guide dispatched to ${welcomeRecipientEmail}!`);
  };

  // Dispatch Action Receipt
  const handleDispatchReceipt = () => {
    playInteractiveSound("laser");
    fireCelebration();

    const newEmail: DispatchedEmail = {
      id: `mail-receipt-${Date.now()}`,
      type: "action_receipt",
      recipientEmail: receiptRecipientEmail,
      recipientName: welcomeRecipientName,
      subject: `Action Receipt: ${currentReceipt.title} [${currentReceipt.receiptId}]`,
      previewText: currentReceipt.summary,
      timestamp: new Date().toISOString(),
      status: "Delivered",
      receiptData: currentReceipt,
      htmlContent: receiptHtml,
      plainText: `Action Receipt ${currentReceipt.receiptId} for ${currentReceipt.title}. Verified status.`,
    };

    setDispatchedEmails((prev) => [newEmail, ...prev]);
    showToast(`Action Receipt #${currentReceipt.receiptId} dispatched to ${receiptRecipientEmail}!`);
  };

  // Run AI Inbound Triage Simulation
  const handleRunInboundTriage = () => {
    setIsTriaging(true);
    playInteractiveSound("click");

    setTimeout(() => {
      setIsTriaging(false);
      setTriageResult({
        sentiment: "positive",
        intent: "Platform Evaluation & Security Review",
        urgencyScore: 88,
        recommendedReplySubject: `Re: ${inboundSubject} — Comprehensive Feature Tour & Audit Proof`,
        recommendedReplyBody: `Hello,

Thank you for considering AgentFlow Enterprise for your SRE engineering team!

We are pleased to provide:
1. Complete Feature Guide covering all 17 workspaces (including our new Draggable Mini-Map, SVG cable routing, and AI prompt drift auto-healing).
2. Official Action Execution Receipt (#RCP-WF-98241) demonstrating zero-error cryptographic pipeline verification and token telemetry.

Please let us know if your security review team requires a custom live test sandbox.

Best regards,
Enterprise Solutions Team
${developerCompanyName}`,
        suggestedAttachments: [
          "Complete-Platform-Feature-Tour-17-Workspaces.html",
          "Production-Deployment-Receipt-RCP-WF-98241.pdf"
        ]
      });
      playInteractiveSound("chime");
      showToast("AI Inbound Triage complete: Auto-reply formulated with feature tour and receipt attachments!");
    }, 900);
  };

  // Send Triage Auto-Response
  const handleSendTriageAutoReply = () => {
    if (!triageResult) return;
    playInteractiveSound("laser");
    fireCelebration();

    const newEmail: DispatchedEmail = {
      id: `mail-triage-${Date.now()}`,
      type: "inbound_triage",
      recipientEmail: inboundSender,
      recipientName: "Prospective SRE Lead",
      subject: triageResult.recommendedReplySubject,
      previewText: triageResult.recommendedReplyBody.slice(0, 100) + "...",
      timestamp: new Date().toISOString(),
      status: "Delivered",
      plainText: triageResult.recommendedReplyBody,
      htmlContent: generateWelcomeEmailHtml("Prospective SRE Lead", developerCompanyName)
    };

    setDispatchedEmails((prev) => [newEmail, ...prev]);
    showToast(`Context-aware response sent to ${inboundSender}!`);
  };

  const filteredFeatures = useMemo(() => {
    if (!featureSearchQuery.trim()) return ALL_PLATFORM_FEATURES;
    const q = featureSearchQuery.toLowerCase();
    return ALL_PLATFORM_FEATURES.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [featureSearchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-indigo-200 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white">
                  Email Automations & Transactional Receipts
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Active Dispatcher
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated platform feature tours, cryptographic action receipts, and intelligent inbound support triage.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Recipient Info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400 font-medium">Default Mailbox:</span>
            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              toppgunn321@gmail.com
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab("welcome");
              handleDispatchWelcomeEmail();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Welcome Tour</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          type="button"
          id="tab-email-action-triggers"
          onClick={() => setActiveSubTab("triggers")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "triggers"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Action Triggers & Notification Rules</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
            {activeTriggersCount} Active
          </span>
        </button>

        <button
          type="button"
          id="tab-email-condition-builder"
          onClick={() => setActiveSubTab("conditions")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "conditions"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-500" />
          <span>Condition Builder (Logic Triggers)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
            Live Logic
          </span>
        </button>

        <button
          type="button"
          id="tab-workflow-metrics-telemetry"
          onClick={() => setActiveSubTab("metrics")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "metrics"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Workflow Metrics & Telemetry</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
            99.4% SLA
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("welcome")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "welcome"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Welcome Email & Feature Tour (17 Workspaces)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("receipts")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "receipts"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Action Receipts & Telemetry Proofs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            5 Templates
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("triage")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "triage"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inbound Support Triage Simulator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("outbox")}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === "outbox"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Outbox & Audit Delivery Ledger</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {dispatchedEmails.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB: ACTION TRIGGERS & NOTIFICATION RULES */}
      {activeSubTab === "triggers" && (
        <ActionTriggersPanel
          triggers={actionTriggers}
          onToggleTrigger={handleToggleActionTrigger}
          onToggleShaProof={handleToggleShaProof}
          onChangeCondition={handleChangeCondition}
          onUpdateRecipientEmail={handleUpdateRecipientEmail}
          onSimulateTrigger={handleSimulateTrigger}
          onEnableAll={handleEnableAllTriggers}
          onDisableAll={handleDisableAllTriggers}
          onResetDefaults={handleResetDefaults}
          onOpenConditionBuilder={(triggerId) => {
            setConditionBuilderTargetId(triggerId);
            setActiveSubTab("conditions");
          }}
        />
      )}

      {/* SUB-TAB: CONDITION BUILDER (LOGIC TRIGGERS) */}
      {activeSubTab === "conditions" && (
        <ConditionBuilder
          triggers={actionTriggers}
          selectedTriggerId={conditionBuilderTargetId}
          onSelectTrigger={(id) => setConditionBuilderTargetId(id)}
          onUpdateTriggerRuleSet={handleUpdateTriggerRuleSet}
          onSimulateTriggerWithContext={handleSimulateTriggerWithContext}
          showToast={showToast}
        />
      )}

      {/* SUB-TAB: WORKFLOW METRICS & EXECUTION TELEMETRY */}
      {activeSubTab === "metrics" && (
        <WorkflowMetricsPanel
          workflows={workflows}
          onToggleWorkflowEmail={handleToggleWorkflowEmail}
          onSimulateWorkflowRun={handleSimulateWorkflowRun}
          onOpenWorkflowCanvas={(wfId) => {
            if (onNavigateToTab) {
              onNavigateToTab("studio");
            }
          }}
        />
      )}

      {/* SUB-TAB 1: WELCOME EMAIL & FULL FEATURE GUIDE */}
      {activeSubTab === "welcome" && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Dispatch Settings & Feature Explorer */}
          <div className="w-full lg:w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto p-6 space-y-6">
            {/* Quick Dispatch Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Dispatch Configuration
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">
                  Sends complete 17-feature tour
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={welcomeRecipientName}
                    onChange={(e) => setWelcomeRecipientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={welcomeRecipientEmail}
                    onChange={(e) => setWelcomeRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={welcomeSubject}
                  onChange={(e) => setWelcomeSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={autoWelcomeOnSignup}
                    onChange={(e) => setAutoWelcomeOnSignup(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Automatically send on new user sign-up</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(welcomeHtml)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    {copiedState ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedState ? "Copied" : "Copy HTML"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDispatchWelcomeEmail}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Welcome Email</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Catalog Explorer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Platform Features in Email Tour (17 Workspaces)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Every workspace and capability detailed inside the welcome communication.
                  </p>
                </div>
                <div className="relative w-44">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search features..."
                    value={featureSearchQuery}
                    onChange={(e) => setFeatureSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredFeatures.map((feat, idx) => {
                  const isExpanded = expandedFeatureId === feat.id;
                  return (
                    <div
                      key={feat.id}
                      className={`rounded-xl border transition-all ${
                        isExpanded
                          ? "bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 shadow-xs"
                          : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)}
                        className="w-full p-3 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {feat.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {feat.category} • {feat.badge}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                            {feat.badge}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-300 animate-in fade-in">
                          <p className="text-xs leading-relaxed">{feat.summary}</p>
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Core Capabilities:
                            </div>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                              {feat.keyCapabilities.map((cap, cIdx) => (
                                <li key={cIdx}>{cap}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            💡 Pro-Tip: {feat.recommendedAction}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Rendered Email Preview */}
          <div className="w-full lg:w-1/2 flex flex-col bg-slate-100 dark:bg-slate-950 p-6 overflow-hidden">
            {/* Viewport & Device Toggles */}
            <div className="mb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => setWelcomeDevicePreview("desktop")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    welcomeDevicePreview === "desktop"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWelcomeDevicePreview("mobile")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    welcomeDevicePreview === "mobile"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWelcomeDevicePreview("code")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    welcomeDevicePreview === "code"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML Source</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWelcomeDevicePreview("text")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    welcomeDevicePreview === "text"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Plain Text</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                Live Responsive Render
              </span>
            </div>

            {/* Email Container Canvas */}
            <div className="flex-1 overflow-y-auto flex justify-center items-start">
              {welcomeDevicePreview === "desktop" && (
                <div className="w-full max-w-[680px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                  <div
                    dangerouslySetInnerHTML={{ __html: welcomeHtml }}
                    className="p-2"
                  />
                </div>
              )}

              {welcomeDevicePreview === "mobile" && (
                <div className="w-[375px] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-slate-800">
                  <div className="h-6 bg-slate-800 w-full flex items-center justify-center">
                    <div className="w-20 h-3 bg-black rounded-full" />
                  </div>
                  <div className="max-h-[640px] overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: welcomeHtml }} />
                  </div>
                </div>
              )}

              {welcomeDevicePreview === "code" && (
                <div className="w-full h-full bg-slate-900 rounded-2xl p-4 overflow-auto font-mono text-xs text-indigo-300 border border-slate-800">
                  <pre>{welcomeHtml}</pre>
                </div>
              )}

              {welcomeDevicePreview === "text" && (
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl p-6 overflow-auto font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {INITIAL_DISPATCHED_EMAILS[0].plainText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ACTION RECEIPTS & TELEMETRY */}
      {activeSubTab === "receipts" && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Template Selector & Parameters */}
          <div className="w-full lg:w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto p-6 space-y-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Action Receipt Generator
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">
                  Cryptographic transaction audit
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Select Action Scenario
                </label>
                <div className="space-y-2">
                  {SAMPLE_ACTION_RECEIPTS.map((rec, rIdx) => {
                    const isSelected = selectedReceiptIndex === rIdx;
                    return (
                      <button
                        key={rec.receiptId}
                        type="button"
                        onClick={() => setSelectedReceiptIndex(rIdx)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {rec.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Receipt #{rec.receiptId} • {rec.status}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                          {rec.actionType.replace("_", " ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Recipient Mailbox
                </label>
                <input
                  type="email"
                  value={receiptRecipientEmail}
                  onChange={(e) => setReceiptRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={autoReceiptsOnDeploy}
                    onChange={(e) => setAutoReceiptsOnDeploy(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Dispatch automatic receipt on workflow deploy</span>
                </label>

                <button
                  type="button"
                  onClick={handleDispatchReceipt}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Action Receipt</span>
                </button>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Live Receipt Verification Proofs
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Hours Saved</div>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">
                    {currentReceipt.hoursSaved || "N/A"} hrs
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Value</div>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">
                    ${currentReceipt.costEstimateUsd?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  SHA-256 DIGITAL FINGERPRINT:
                </div>
                <div className="break-all">{currentReceipt.transactionHash}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Receipt Preview */}
          <div className="w-full lg:w-1/2 flex flex-col bg-slate-100 dark:bg-slate-950 p-6 overflow-hidden">
            <div className="mb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => setReceiptDevicePreview("visual")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    receiptDevicePreview === "visual"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Visual Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptDevicePreview("html")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    receiptDevicePreview === "html"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  HTML Code
                </button>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(receiptHtml)}
                className="px-3 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Receipt Code</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex justify-center items-start">
              {receiptDevicePreview === "visual" ? (
                <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                  <div dangerouslySetInnerHTML={{ __html: receiptHtml }} />
                </div>
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-2xl p-4 overflow-auto font-mono text-xs text-emerald-300 border border-slate-800">
                  <pre>{receiptHtml}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INBOUND TRIAGE SIMULATOR */}
      {activeSubTab === "triage" && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6 overflow-y-auto">
          {/* Left: Inbound Message Form */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Simulated Inbound Customer Inquiry
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Gmail / Zendesk Webhook
                </span>
              </div>

              {/* Preset Scenarios */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Load Preset Customer Scenario:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInboundSender("procurement@enterprise-fintech.co");
                      setInboundSubject("Request for Full Platform Feature Guide & MSA Contract");
                      setInboundBody(
                        "Hello, our procurement committee is reviewing AgentFlow. Could you dispatch your full feature guide covering all 17 workspaces, security permissions, and white-label options?"
                      );
                    }}
                    className="p-2 text-left text-xs rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    🏢 Enterprise Feature Tour Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInboundSender("devops-lead@cloudscale.io");
                      setInboundSubject("Execution Proof: Did my SRE Pipeline Deploy Successfully?");
                      setInboundBody(
                        "Hi Support, we just ran the SRE Incident auto-recovery pipeline from the canvas. Can you confirm the transaction receipt and token usage?"
                      );
                    }}
                    className="p-2 text-left text-xs rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    🧾 Action Receipt Verification
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Sender Email
                  </label>
                  <input
                    type="email"
                    value={inboundSender}
                    onChange={(e) => setInboundSender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={inboundSubject}
                    onChange={(e) => setInboundSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={4}
                    value={inboundBody}
                    onChange={(e) => setInboundBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isTriaging}
                onClick={handleRunInboundTriage}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isTriaging ? "Analyzing with Gemini AI..." : "Run AI Triage & Compose Auto-Reply"}</span>
              </button>
            </div>
          </div>

          {/* Right: AI Triage Output & Auto-Reply */}
          <div className="w-full lg:w-1/2 space-y-4">
            {triageResult ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 shadow-lg space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      AI Triage Analysis Complete
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Sentiment: {triageResult.sentiment}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Priority: {triageResult.urgencyScore}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Detected Intent & Topic:
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {triageResult.intent}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Auto-Formulated Response Email:
                  </div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {triageResult.recommendedReplySubject}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {triageResult.recommendedReplyBody}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Dynamic Attachments Attached:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {triageResult.suggestedAttachments.map((att, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <FileText className="w-3 h-3 text-indigo-500" />
                        <span>{att}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSendTriageAutoReply}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Send Auto-Reply</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Awaiting Inbound Simulation
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click "Run AI Triage" to analyze the customer inquiry and auto-formulate a context-aware response containing platform feature guides and execution receipts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: OUTBOX & DELIVERY AUDIT LEDGER */}
      {activeSubTab === "outbox" && (
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Dispatched Communications & Outbox
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited history of all automated welcome guides and action receipts.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Recorded: {dispatchedEmails.length}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dispatchedEmails.map((email) => (
                  <tr
                    key={email.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{email.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {email.type === "welcome_features" ? "Feature Tour" : email.type === "action_receipt" ? "Action Receipt" : "Triage Response"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {email.recipientEmail}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {email.subject}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(email.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectingEmail(email)}
                        className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Payload</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Email Payload Modal */}
      {inspectingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Email Delivery Payload: {inspectingEmail.subject}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEmail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-1"
              >
                Close ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">Recipient:</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {inspectingEmail.recipientName} ({inspectingEmail.recipientEmail})
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Status:</div>
                  <div className="font-bold text-emerald-600">
                    {inspectingEmail.status}
                  </div>
                </div>
              </div>

              {inspectingEmail.htmlContent ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-white overflow-y-auto max-h-[400px]">
                  <div dangerouslySetInnerHTML={{ __html: inspectingEmail.htmlContent }} />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {inspectingEmail.plainText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
