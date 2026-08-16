import React, { useState } from "react";
import { Agent, ApiAuditLog, ConnectedApp, PermissionCategory, PermissionScope } from "../types";
import { AVAILABLE_PERMISSIONS, INITIAL_CONNECTED_APPS, INITIAL_API_AUDIT_LOGS } from "../data/initialData";
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  AlertTriangle, 
  Sliders, 
  ShieldAlert, 
  FileText,
  KeyRound,
  Eye,
  Info,
  Globe,
  Plus,
  Zap,
  Play,
  Activity,
  Layers,
  Server,
  Code,
  Search,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { AppIntegrationModal } from "./AppIntegrationModal";

interface PermissionsMatrixProps {
  agents: Agent[];
  permissions?: PermissionScope[];
  connectedApps?: ConnectedApp[];
  auditLogs?: ApiAuditLog[];
  onToggleAgentPermission: (agentId: string, permId: string) => void;
  onBatchTogglePermissions?: (agentId: string, grantAll: boolean) => void;
  onSaveConnectedApp?: (app: ConnectedApp, newPermissions: PermissionScope[]) => void;
  onDeleteConnectedApp?: (appId: string) => void;
  onRewardXP?: (amount: number, hours?: number) => void;
}

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  agents,
  permissions = AVAILABLE_PERMISSIONS,
  connectedApps = INITIAL_CONNECTED_APPS,
  auditLogs = INITIAL_API_AUDIT_LOGS,
  onToggleAgentPermission,
  onBatchTogglePermissions,
  onSaveConnectedApp,
  onDeleteConnectedApp,
  onRewardXP,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"matrix" | "apps" | "audit" | "custom_api">("matrix");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("all");

  // Security Governance Toggles
  const [enablePiiMasking, setEnablePiiMasking] = useState(true);
  const [strictAuditLogging, setStrictAuditLogging] = useState(true);
  const [sandboxModeOnly, setSandboxModeOnly] = useState(false);

  // App Integration Modal state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ConnectedApp | null>(null);

  // Live Ping Testing State for Apps Hub
  const [testingAppId, setTestingAppId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latencyMs: number; status: number; message: string }>>({});

  // Live Audit Stream State
  const [liveLogs, setLiveLogs] = useState<ApiAuditLog[]>(auditLogs);
  const [selectedLog, setSelectedLog] = useState<ApiAuditLog | null>(null);
  const [isSimulatingCall, setIsSimulatingCall] = useState(false);

  // Category list
  const categories: string[] = [
    "all",
    "Productivity & Workspace",
    "CRM & Sales",
    "DevOps & Cloud",
    "Communication",
    "Databases & Storage",
    "Payments & Billing",
    "Analytics & Warehouses",
    "Support & Helpdesk",
    "HR & Legal",
    "Custom APIs & Webhooks",
  ];

  const filteredPermissions = permissions.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (selectedRiskFilter !== "all" && p.riskLevel !== selectedRiskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.appName && p.appName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleTestPingApp = async (app: ConnectedApp) => {
    setTestingAppId(app.id);
    await new Promise((r) => setTimeout(r, 550));
    const randomLatency = Math.floor(Math.random() * 35) + 14;
    setPingResults((prev) => ({
      ...prev,
      [app.id]: {
        latencyMs: randomLatency,
        status: 200,
        message: `Endpoint ${app.baseUrl || "service"} reachable. Handshake verified.`,
      },
    }));
    setTestingAppId(null);
    if (onRewardXP) onRewardXP(25);
  };

  const handleSimulateApiCall = () => {
    setIsSimulatingCall(true);
    setTimeout(() => {
      const sampleEndpoints = [
        { app: "Google Workspace", endpoint: "/gmail/v1/users/me/messages/send", method: "POST" as const, agent: agents[0] || { id: "ag-1", name: "SentryOps", avatar: "" } },
        { app: "GitHub Enterprise", endpoint: "/repos/org/app/pulls/884/comments", method: "POST" as const, agent: agents[0] || { id: "ag-1", name: "SentryOps", avatar: "" } },
        { app: "Salesforce CRM", endpoint: "/services/data/v58.0/sobjects/Contact", method: "POST" as const, agent: agents[1] || { id: "ag-2", name: "RevPulse SDR", avatar: "" } },
        { app: "Notion Knowledge Wiki", endpoint: "/v1/search", method: "POST" as const, agent: agents[2] || { id: "ag-3", name: "DocuCraft", avatar: "" } },
      ];
      const picked = sampleEndpoints[Math.floor(Math.random() * sampleEndpoints.length)];
      const newLog: ApiAuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentId: picked.agent.id,
        agentName: picked.agent.name,
        appId: `app-${picked.app.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        appName: picked.app,
        endpoint: picked.endpoint,
        method: picked.method,
        status: 200,
        latencyMs: Math.floor(Math.random() * 40) + 15,
        payloadSnippet: JSON.stringify({ action: "automated_step_execution", timestamp: new Date().toISOString() }),
        responseSnippet: JSON.stringify({ status: "success", transactionId: `tx_${Math.random().toString(36).substring(2, 9)}` }),
      };
      setLiveLogs((prev) => [newLog, ...prev]);
      setIsSimulatingCall(false);
      if (onRewardXP) onRewardXP(50);
    }, 450);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Enterprise App & API Access Hub</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
              {connectedApps.length} Apps • {permissions.length} Scopes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fine-grained Role-Based Access Control (RBAC) governing autonomous agent actions across Google Workspace, external SaaS, and custom APIs.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingApp(null);
              setIsAppModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect App / API</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>SOC2 / GDPR Enforced</span>
          </div>
        </div>
      </div>

      {/* Enterprise Security Governance Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              Automated PII Masking & Scrubbing
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sanitizes SSN, API Tokens & Passwords before external payload transmission.
            </p>
          </div>
          <button
            onClick={() => setEnablePiiMasking(!enablePiiMasking)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
              enablePiiMasking ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                enablePiiMasking ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              Strict Audit Logs & Provenance
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cryptographically signed telemetry recorded for every outbound API request.
            </p>
          </div>
          <button
            onClick={() => setStrictAuditLogging(!strictAuditLogging)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
              strictAuditLogging ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                strictAuditLogging ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              Global Sandbox Quarantine Mode
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Restricts all agents from executing production destructive write/delete calls.
            </p>
          </div>
          <button
            onClick={() => setSandboxModeOnly(!sandboxModeOnly)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
              sandboxModeOnly ? "bg-amber-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                sandboxModeOnly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab("matrix")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "matrix"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Agent Access Matrix</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === "matrix" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
            {permissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("apps")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "apps"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Connected Apps & Integrations</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === "apps" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
            {connectedApps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "audit"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live API Audit Stream</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === "audit" ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
            {liveLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: AGENT ACCESS MATRIX */}
      {activeSubTab === "matrix" && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scopes, apps, endpoints (e.g. Gmail, PR, Stripe, drive:readonly)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Risk Level Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                <Filter className="w-3.5 h-3.5" /> Risk:
              </span>
              <select
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk Only</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* PERMISSIONS MATRIX TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5 min-w-[280px]">Permission Scope & App</th>
                    <th className="px-3 py-3.5 min-w-[180px]">Endpoint / API Code</th>
                    {agents.map((ag) => (
                      <th key={ag.id} className="px-4 py-3.5 text-center min-w-[140px]">
                        <div className="flex flex-col items-center">
                          <img
                            src={ag.avatar}
                            alt={ag.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 mb-1"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                            {ag.name.split(" ")[0]}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            {ag.department.split(" ")[0]}
                          </span>
                          {onBatchTogglePermissions && (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => onBatchTogglePermissions(ag.id, true)}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold"
                                title="Grant all visible scopes"
                              >
                                All
                              </button>
                              <button
                                type="button"
                                onClick={() => onBatchTogglePermissions(ag.id, false)}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 font-bold"
                                title="Revoke all scopes"
                              >
                                None
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={2 + agents.length} className="px-5 py-8 text-center text-slate-400">
                        No permission scopes match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((perm) => {
                      const isRiskHigh = perm.riskLevel === "high" || perm.riskLevel === "critical";

                      return (
                        <tr key={perm.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-start gap-2.5">
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                                <DynamicIcon name={perm.iconName} className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{perm.name}</span>
                                  {perm.appName && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                      {perm.appName}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                  {perm.description}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                      isRiskHigh
                                        ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                                        : perm.riskLevel === "medium"
                                        ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                        : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                    }`}
                                  >
                                    {perm.riskLevel} Risk
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    • {perm.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5">
                            <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              {perm.httpMethod && (
                                <span
                                  className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                                    perm.httpMethod === "GET"
                                      ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                      : perm.httpMethod === "POST"
                                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                      : perm.httpMethod === "PATCH"
                                      ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                      : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                  }`}
                                >
                                  {perm.httpMethod}
                                </span>
                              )}
                              <span>{perm.code}</span>
                            </div>
                            {perm.endpointPreview && (
                              <div className="font-mono text-[9px] text-slate-400 truncate max-w-[190px] mt-0.5" title={perm.endpointPreview}>
                                {perm.endpointPreview}
                              </div>
                            )}
                          </td>

                          {/* Agent check cells */}
                          {agents.map((ag) => {
                            const isEnabled = ag.permissions.includes(perm.id);

                            return (
                              <td key={ag.id} className="px-4 py-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => onToggleAgentPermission(ag.id, perm.id)}
                                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                    isEnabled
                                      ? "bg-blue-600 text-white shadow-xs hover:bg-blue-700"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                                  }`}
                                  title={isEnabled ? `Revoke ${perm.name} from ${ag.name}` : `Grant ${perm.name} to ${ag.name}`}
                                >
                                  {isEnabled ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONNECTED APPS & INTEGRATIONS HUB */}
      {activeSubTab === "apps" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Enterprise Connected Applications ({connectedApps.length})
              </h2>
              <p className="text-xs text-slate-400">
                Active OAuth2 grants, API keys, and enterprise SaaS connectors available for workflow automation.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingApp(null);
                setIsAppModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect New App</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedApps.map((app) => {
              const ping = pingResults[app.id];
              const isTesting = testingAppId === app.id;

              return (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Icon & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <DynamicIcon name={app.iconName} className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                            {app.name}
                          </h3>
                          <div className="text-[10px] text-slate-400">
                            {app.provider} • {app.authType}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          app.status === "connected"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : app.status === "sandbox_active"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {app.description}
                    </p>

                    {/* Scopes pill list */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Authorized Scopes ({app.grantedScopes.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {app.grantedScopes.map((sc) => (
                          <span
                            key={sc}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono"
                          >
                            {sc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Telemetry Metrics: Latency & Rate Limit */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Endpoint Latency:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {ping ? `${ping.latencyMs}ms` : `${app.latencyMs || 22}ms`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Rate Limit Quota:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {app.rateLimitRemaining || 4900}/{app.rateLimitTotal || 5000} req/hr
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleTestPingApp(app)}
                      disabled={isTesting}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing Ping...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test Ping</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingApp(app);
                          setIsAppModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Edit
                      </button>

                      {app.isCustom && onDeleteConnectedApp && (
                        <button
                          type="button"
                          onClick={() => onDeleteConnectedApp(app.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete custom app"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE API AUDIT STREAM */}
      {activeSubTab === "audit" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Real-Time API Invocation Telemetry & Audit Stream</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-400">
                Inspect live HTTP requests, status codes, payload structures, and response bodies generated by AI agents.
              </p>
            </div>

            <button
              onClick={handleSimulateApiCall}
              disabled={isSimulatingCall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Agent API Call</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {liveLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          log.method === "GET"
                            ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : log.method === "POST"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {log.method}
                      </span>

                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="font-mono text-slate-800 dark:text-slate-200 truncate">{log.endpoint}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                            {log.appName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Invoked by <strong>{log.agentName}</strong> at {log.timestamp}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        HTTP {log.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {log.latencyMs}ms
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transform transition-transform ${
                          selectedLog?.id === log.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Payload Inspector */}
                  {selectedLog?.id === log.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Request Payload (Sanitized PII):
                        </div>
                        <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                          {log.payloadSnippet}
                        </pre>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Response Body (200 OK):
                        </div>
                        <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                          {log.responseSnippet}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: App Integration & API Connector */}
      <AppIntegrationModal
        isOpen={isAppModalOpen}
        onClose={() => {
          setIsAppModalOpen(false);
          setEditingApp(null);
        }}
        existingApp={editingApp}
        onSaveApp={(newApp, newPerms) => {
          if (onSaveConnectedApp) {
            onSaveConnectedApp(newApp, newPerms);
          }
          if (onRewardXP) onRewardXP(150);
        }}
      />
    </div>
  );
};
