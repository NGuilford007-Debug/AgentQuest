import React, { useState } from "react";
import { AuthType, ConnectedApp, PermissionCategory, PermissionScope } from "../types";
import { 
  X, 
  Globe, 
  Key, 
  ShieldCheck, 
  Zap, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock, 
  ExternalLink,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Server,
  Code
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

interface AppIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApp: (app: ConnectedApp, permissions: PermissionScope[]) => void;
  existingApp?: ConnectedApp | null;
}

const PRESET_APP_TEMPLATES: Array<{
  name: string;
  provider: string;
  category: PermissionCategory;
  iconName: string;
  authType: AuthType;
  baseUrl: string;
  description: string;
  defaultScopes: Array<{ name: string; code: string; riskLevel: "low" | "medium" | "high" | "critical"; method: "GET" | "POST" | "PATCH" | "DELETE" }>;
}> = [
  {
    name: "Google Workspace",
    provider: "Google",
    category: "Productivity & Workspace",
    iconName: "Globe",
    authType: "OAuth2",
    baseUrl: "https://www.googleapis.com",
    description: "Connect Google Drive, Google Sheets, Gmail, and Google Calendar.",
    defaultScopes: [
      { name: "Google Drive (Read Files)", code: "drive:readonly", riskLevel: "low", method: "GET" },
      { name: "Google Sheets (Append Rows)", code: "sheets:spreadsheets", riskLevel: "medium", method: "POST" },
      { name: "Gmail (Draft Messages)", code: "gmail:compose", riskLevel: "medium", method: "POST" },
      { name: "Google Calendar (Query & Create)", code: "calendar:events", riskLevel: "low", method: "POST" },
    ],
  },
  {
    name: "GitHub Enterprise",
    provider: "GitHub",
    category: "DevOps & Cloud",
    iconName: "GitPullRequest",
    authType: "OAuth2",
    baseUrl: "https://api.github.com",
    description: "Inspect pull requests, run static analysis comments, and trigger Actions workflows.",
    defaultScopes: [
      { name: "PR Inspection & Reviews", code: "github:code_read_comment", riskLevel: "medium", method: "POST" },
      { name: "GitHub Actions CI Dispatch", code: "github:workflow_dispatch", riskLevel: "high", method: "POST" },
    ],
  },
  {
    name: "Slack Workspace",
    provider: "Slack",
    category: "Communication",
    iconName: "MessageSquare",
    authType: "Bearer Token",
    baseUrl: "https://slack.com/api",
    description: "Post interactive notifications, approval cards, and read incident threads.",
    defaultScopes: [
      { name: "Send Channel Notifications", code: "slack:send_notifications", riskLevel: "low", method: "POST" },
      { name: "Read Thread History", code: "slack:channels_history", riskLevel: "medium", method: "GET" },
    ],
  },
  {
    name: "Salesforce CRM",
    provider: "Salesforce",
    category: "CRM & Sales",
    iconName: "TrendingUp",
    authType: "OAuth2",
    baseUrl: "https://enterprise.my.salesforce.com",
    description: "Sync accounts, query leads, update opportunity stages, and log SDR calls.",
    defaultScopes: [
      { name: "Read Leads & Pipeline", code: "salesforce:read", riskLevel: "low", method: "GET" },
      { name: "Update Deals & Log Notes", code: "salesforce:write", riskLevel: "medium", method: "PATCH" },
    ],
  },
  {
    name: "Jira Software Cloud",
    provider: "Atlassian",
    category: "DevOps & Cloud",
    iconName: "CheckSquare",
    authType: "OAuth2",
    baseUrl: "https://api.atlassian.com",
    description: "Manage sprint backlogs, auto-triage bug tickets, and update resolution states.",
    defaultScopes: [
      { name: "Manage Jira Tickets", code: "jira:manage_tickets", riskLevel: "low", method: "POST" },
    ],
  },
  {
    name: "Stripe Billing",
    provider: "Stripe",
    category: "Payments & Billing",
    iconName: "CreditCard",
    authType: "API Key",
    baseUrl: "https://api.stripe.com/v1",
    description: "Query invoice statuses, failed customer charges, and draft refund requests.",
    defaultScopes: [
      { name: "Read Invoices & Charges", code: "stripe:read_invoices", riskLevel: "medium", method: "GET" },
      { name: "Draft Refunds & Adjustments", code: "stripe:manage_billing", riskLevel: "critical", method: "POST" },
    ],
  },
  {
    name: "Notion Knowledge Base",
    provider: "Notion",
    category: "Productivity & Workspace",
    iconName: "BookOpen",
    authType: "Bearer Token",
    baseUrl: "https://api.notion.com/v1",
    description: "Search corporate documentation, read SOP runbooks, and append meeting action items.",
    defaultScopes: [
      { name: "Search & Read Pages", code: "notion:read_pages", riskLevel: "low", method: "POST" },
      { name: "Append Page Blocks", code: "notion:write_blocks", riskLevel: "medium", method: "PATCH" },
    ],
  },
  {
    name: "Datadog Observability",
    provider: "Datadog",
    category: "DevOps & Cloud",
    iconName: "Activity",
    authType: "API Key",
    baseUrl: "https://api.datadoghq.com",
    description: "Query APM traces, error rate spikes, latency percentiles, and pod telemetry.",
    defaultScopes: [
      { name: "Query APM Metrics & Traces", code: "datadog:query_metrics", riskLevel: "low", method: "GET" },
    ],
  },
  {
    name: "Custom REST API / Internal Gateway",
    provider: "Custom / Internal",
    category: "Custom APIs & Webhooks",
    iconName: "Zap",
    authType: "Bearer Token",
    baseUrl: "https://api.internal.company.com/v1",
    description: "Connect to proprietary company microservices, legacy databases, and custom webhooks.",
    defaultScopes: [
      { name: "Custom Gateway Invocations", code: "api:custom_rest_gateway", riskLevel: "medium", method: "POST" },
    ],
  },
];

export const AppIntegrationModal: React.FC<AppIntegrationModalProps> = ({
  isOpen,
  onClose,
  onSaveApp,
  existingApp,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    existingApp ? existingApp.provider : PRESET_APP_TEMPLATES[0].name
  );
  const [name, setName] = useState(existingApp?.name || PRESET_APP_TEMPLATES[0].name);
  const [provider, setProvider] = useState(existingApp?.provider || PRESET_APP_TEMPLATES[0].provider);
  const [category, setCategory] = useState<PermissionCategory>(
    existingApp?.category || PRESET_APP_TEMPLATES[0].category
  );
  const [iconName, setIconName] = useState(existingApp?.iconName || PRESET_APP_TEMPLATES[0].iconName);
  const [authType, setAuthType] = useState<AuthType>(existingApp?.authType || "OAuth2");
  const [baseUrl, setBaseUrl] = useState(existingApp?.baseUrl || PRESET_APP_TEMPLATES[0].baseUrl);
  const [environment, setEnvironment] = useState<"Production" | "Staging / Sandbox">(
    existingApp?.environment || "Production"
  );
  const [description, setDescription] = useState(
    existingApp?.description || PRESET_APP_TEMPLATES[0].description
  );
  const [apiKeyVal, setApiKeyVal] = useState("");
  const [customScopes, setCustomScopes] = useState<
    Array<{
      id: string;
      name: string;
      code: string;
      riskLevel: "low" | "medium" | "high" | "critical";
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      endpoint: string;
    }>
  >(() => {
    if (existingApp) {
      return existingApp.grantedScopes.map((sc, idx) => ({
        id: `sc-${idx}`,
        name: `${existingApp.name} Access (${sc})`,
        code: sc,
        riskLevel: "medium",
        method: "POST",
        endpoint: existingApp.baseUrl || "",
      }));
    }
    return PRESET_APP_TEMPLATES[0].defaultScopes.map((sc, idx) => ({
      id: `sc-${idx}`,
      name: sc.name,
      code: sc.code,
      riskLevel: sc.riskLevel,
      method: sc.method,
      endpoint: `${PRESET_APP_TEMPLATES[0].baseUrl}/endpoint-${idx + 1}`,
    }));
  });

  // Test Ping Simulation State
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    status: number;
    latencyMs: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (tplName: string) => {
    setSelectedTemplate(tplName);
    const matched = PRESET_APP_TEMPLATES.find((t) => t.name === tplName);
    if (matched) {
      setName(matched.name);
      setProvider(matched.provider);
      setCategory(matched.category);
      setIconName(matched.iconName);
      setAuthType(matched.authType);
      setBaseUrl(matched.baseUrl);
      setDescription(matched.description);
      setCustomScopes(
        matched.defaultScopes.map((sc, idx) => ({
          id: `sc-${idx}-${Date.now()}`,
          name: sc.name,
          code: sc.code,
          riskLevel: sc.riskLevel,
          method: sc.method,
          endpoint: `${matched.baseUrl}/v1/resource`,
        }))
      );
      setPingResult(null);
    }
  };

  const handleAddScope = () => {
    const newIdx = customScopes.length + 1;
    setCustomScopes((prev) => [
      ...prev,
      {
        id: `scope-${Date.now()}`,
        name: `${name} Custom Endpoint #${newIdx}`,
        code: `${provider.toLowerCase().replace(/[^a-z0-9]/g, "_")}:action_${newIdx}`,
        riskLevel: "medium",
        method: "POST",
        endpoint: `${baseUrl}/v1/custom-${newIdx}`,
      },
    ]);
  };

  const handleRemoveScope = (scopeId: string) => {
    setCustomScopes((prev) => prev.filter((s) => s.id !== scopeId));
  };

  const handleRunTestPing = async () => {
    setIsTestingPing(true);
    setPingResult(null);

    // Simulate real handshake / latency measurement
    await new Promise((r) => setTimeout(r, 650));

    const simLatency = Math.floor(Math.random() * 45) + 12;
    setIsTestingPing(false);
    setPingResult({
      success: true,
      status: 200,
      latencyMs: simLatency,
      message: `Handshake verified with ${baseUrl}. Response code 200 OK (${simLatency}ms). All scopes valid.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appId = existingApp?.id || `app-${provider.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

    const newApp: ConnectedApp = {
      id: appId,
      name: name.trim(),
      provider: provider.trim(),
      category,
      iconName,
      status: environment === "Staging / Sandbox" ? "sandbox_active" : "connected",
      authType,
      baseUrl: baseUrl.trim(),
      grantedScopes: customScopes.map((s) => s.code),
      lastTested: "Just now",
      latencyMs: pingResult ? pingResult.latencyMs : 24,
      rateLimitRemaining: 4950,
      rateLimitTotal: 5000,
      environment,
      description: description.trim(),
      docUrl: baseUrl,
      isCustom: provider.toLowerCase().includes("custom") || provider.toLowerCase().includes("internal"),
    };

    const newPermissions: PermissionScope[] = customScopes.map((s) => ({
      id: `perm-${s.code.replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-3)}`,
      category,
      name: s.name,
      code: s.code,
      description: `Grants AI agents permission to call ${name} (${s.code}) via ${s.method} requests.`,
      riskLevel: s.riskLevel,
      iconName,
      appId,
      appName: name,
      endpointPreview: s.endpoint,
      httpMethod: s.method,
      isCustom: newApp.isCustom,
    }));

    onSaveApp(newApp, newPermissions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {existingApp ? `Configure ${existingApp.name}` : "Connect App & API Integration"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant agents authenticated access to enterprise SaaS, Google Workspace, APIs, and Webhooks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Presets Picker (if creating new) */}
          {!existingApp && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Integration Template or Custom API:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_APP_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.name;
                  return (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl.name)}
                      className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                        <DynamicIcon name={tpl.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{tpl.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{tpl.authType}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* App Core Config Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Application Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Google Workspace"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Provider / Vendor
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Google, Atlassian, Internal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                API Base URL Endpoint
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Authentication Method
              </label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as AuthType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="OAuth2">OAuth 2.0 (User Consent & Scopes)</option>
                <option value="Bearer Token">Bearer Token / JWT</option>
                <option value="API Key">API Key (Header X-API-Key)</option>
                <option value="Webhook Secret">HMAC Webhook Secret</option>
                <option value="IAM Role">IAM Role / Service Account</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PermissionCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="Productivity & Workspace">Productivity & Workspace</option>
                <option value="CRM & Sales">CRM & Sales</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Communication">Communication</option>
                <option value="Databases & Storage">Databases & Storage</option>
                <option value="Payments & Billing">Payments & Billing</option>
                <option value="Analytics & Warehouses">Analytics & Warehouses</option>
                <option value="Support & Helpdesk">Support & Helpdesk</option>
                <option value="HR & Legal">HR & Legal</option>
                <option value="Custom APIs & Webhooks">Custom APIs & Webhooks</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="Production">Production Live Network</option>
                <option value="Staging / Sandbox">Staging / Sandbox Isolation</option>
              </select>
            </div>
          </div>

          {/* Credentials Input Simulation */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                <span>Credentials & Token Configuration</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Encrypted with AES-256</span>
              </span>
            </div>

            <input
              type="password"
              value={apiKeyVal}
              onChange={(e) => setApiKeyVal(e.target.value)}
              placeholder={
                authType === "OAuth2"
                  ? "OAuth Client Secret / Token (Auto-managed via Google / Vendor SSO)"
                  : authType === "API Key"
                  ? "Enter API Key (e.g. sk_live_... or dd_api_key_...)"
                  : "Enter Bearer Token (e.g. xoxb-... or jwt_...)"
              }
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Scopes & Endpoints Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Granted Permission Scopes & Endpoints ({customScopes.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Granular actions AI agents are authorized to execute on this connector.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddScope}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scope</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {customScopes.map((scope, idx) => (
                <div
                  key={scope.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        scope.method === "GET"
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          : scope.method === "POST"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : scope.method === "PATCH"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {scope.method}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {scope.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">
                        code: {scope.code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        scope.riskLevel === "critical" || scope.riskLevel === "high"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          : scope.riskLevel === "medium"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {scope.riskLevel}
                    </span>
                    {customScopes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScope(scope.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Ping Diagnostic Box */}
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Connection Handshake & Latency Verification</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Sends an authenticated probe request to verify API endpoint availability.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunTestPing}
                disabled={isTestingPing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
              >
                {isTestingPing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Test Ping</span>
                  </>
                )}
              </button>
            </div>

            {pingResult && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Connection Successful</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono">
                      HTTP {pingResult.status} OK • {pingResult.latencyMs}ms
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {pingResult.message}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{existingApp ? "Save Configuration" : "Authorize & Connect App"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
