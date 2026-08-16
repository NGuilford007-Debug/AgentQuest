import React, { useState } from "react";
import { 
  WhiteLabelConfig, 
  TenantProfile, 
  FeatureToggles,
  DnsRecord 
} from "../types";
import { 
  Sparkles, 
  Palette, 
  Globe, 
  Sliders, 
  Bot, 
  Code2, 
  ShieldCheck, 
  Check, 
  Copy, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Layers, 
  Zap, 
  Shirt, 
  Activity, 
  Building2, 
  Plus, 
  Trash2, 
  Lock, 
  Info,
  Server,
  Key,
  Flame,
  FileCheck
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { WHITELABEL_PRESETS } from "../data/whiteLabelPresets";

interface WhiteLabelStudioProps {
  currentConfig: WhiteLabelConfig;
  onUpdateConfig: (updated: WhiteLabelConfig) => void;
  tenants: TenantProfile[];
  onSelectTenantPreset: (tenant: TenantProfile) => void;
  onCreateTenant: (newTenant: TenantProfile) => void;
  onDeleteTenant?: (tenantId: string) => void;
}

type StudioTab = "branding" | "domain" | "features" | "aivoice" | "embed";

const COLOR_PRESETS = [
  { name: "Royal Nexus (Blue)", primary: "#3b82f6", accent: "#6366f1", theme: "slate" as const },
  { name: "CyberWear (Amber/Violet)", primary: "#f59e0b", accent: "#8b5cf6", theme: "amber" as const },
  { name: "VeloceSec (Emerald/Cyan)", primary: "#10b981", accent: "#06b6d4", theme: "emerald" as const },
  { name: "Aura BioHealth (Teal)", primary: "#0d9488", accent: "#4f46e5", theme: "sapphire" as const },
  { name: "Crimson Enterprise", primary: "#e11d48", accent: "#f97316", theme: "zinc" as const },
  { name: "Deep Amethyst", primary: "#9333ea", accent: "#ec4899", theme: "sapphire" as const },
];

const LOGO_ICONS = [
  "Bot", "Sparkles", "Shirt", "ShieldCheck", "Zap", "Layers", "Activity", "Cpu", "Building2", "Flame"
];

export const WhiteLabelStudio: React.FC<WhiteLabelStudioProps> = ({
  currentConfig,
  onUpdateConfig,
  tenants,
  onSelectTenantPreset,
  onCreateTenant,
  onDeleteTenant,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>("branding");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dnsCheckLoading, setDnsCheckLoading] = useState(false);
  const [dnsSuccessMsg, setDnsSuccessMsg] = useState(false);
  const [newTenantModal, setNewTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantIndustry, setNewTenantIndustry] = useState("");
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState(currentConfig.logoUrl || "");

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleToggleFeature = (featureKey: keyof FeatureToggles) => {
    onUpdateConfig({
      ...currentConfig,
      featureToggles: {
        ...currentConfig.featureToggles,
        [featureKey]: !currentConfig.featureToggles[featureKey],
      },
    });
  };

  const handleRunDnsCheck = () => {
    setDnsCheckLoading(true);
    setTimeout(() => {
      setDnsCheckLoading(false);
      setDnsSuccessMsg(true);
      onUpdateConfig({
        ...currentConfig,
        cnameVerified: true,
      });
      setTimeout(() => setDnsSuccessMsg(false), 4000);
    }, 1200);
  };

  const handleCreateNewTenant = () => {
    if (!newTenantName.trim()) return;
    const newId = "tenant-" + Date.now();
    const newTenant: TenantProfile = {
      id: newId,
      name: newTenantName.trim(),
      industry: newTenantIndustry.trim() || "General SaaS",
      createdAt: new Date().toISOString().split("T")[0],
      config: {
        ...currentConfig,
        id: newId,
        brandName: newTenantName.trim() + " AI",
        companyName: newTenantName.trim() + " Inc.",
        customDomain: `agents.${newTenantName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      },
    };
    onCreateTenant(newTenant);
    onSelectTenantPreset(newTenant);
    setNewTenantName("");
    setNewTenantIndustry("");
    setNewTenantModal(false);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(currentConfig, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentConfig.brandName.toLowerCase().replace(/\s+/g, "_")}_whitelabel_bundle.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.brandName && parsed.customDomain) {
          onUpdateConfig(parsed);
        }
      } catch (err) {
        alert("Invalid JSON White-Label bundle.");
      }
    };
    reader.readAsText(file);
  };

  const embedHtmlSnippet = `<!-- ${currentConfig.brandName} White-Label Embed Portal -->
<iframe 
  src="https://${currentConfig.customDomain}/embed?client=${currentConfig.id}&theme=${currentConfig.surfaceTheme}" 
  width="100%" 
  height="900px" 
  frameborder="0" 
  allow="clipboard-write; fullscreen"
  style="border-radius: 12px; border: 1px solid #e2e8f0;"
></iframe>`;

  const reactSnippet = `import { AgentFlowPortal } from "@agentflow/embed-sdk";

export function ClientWorkspace() {
  return (
    <AgentFlowPortal
      tenantId="${currentConfig.id}"
      brandName="${currentConfig.brandName}"
      customDomain="${currentConfig.customDomain}"
      primaryColor="${currentConfig.primaryColor}"
      clientPortalMode={true}
    />
  );
}`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-8 min-h-screen">
      {/* Top Banner & White-Label Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  White-Label & Rebranding Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Commercial Ready
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Package, rebrand, and deploy autonomous AI agent workspaces under your own company identity and custom domain.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Client Portal Mode Toggle */}
          <button
            id="whitelabel-client-mode-btn"
            onClick={() => onUpdateConfig({ ...currentConfig, clientPortalMode: !currentConfig.clientPortalMode })}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
              currentConfig.clientPortalMode 
                ? "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600 ring-2 ring-amber-400/40" 
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {currentConfig.clientPortalMode ? (
              <>
                <EyeOff className="w-4 h-4 text-white" />
                <span>Exit Client Preview Mode</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Test Client Preview Mode</span>
              </>
            )}
          </button>

          {/* Export Bundle */}
          <button
            id="whitelabel-export-btn"
            onClick={handleExportJson}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Bundle</span>
          </button>

          {/* Import Bundle */}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          {/* New Tenant Button */}
          <button
            id="whitelabel-new-tenant-btn"
            onClick={() => setNewTenantModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Client Tenant</span>
          </button>
        </div>
      </div>

      {/* Preset Tenant Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active White-Label Workspace Profile
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <span 
                className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                style={{ backgroundColor: currentConfig.primaryColor }}
              />
              <span>{currentConfig.brandName}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                {currentConfig.customDomain}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 whitespace-nowrap">Load Preset:</span>
            {WHITELABEL_PRESETS.map((p) => {
              const isSelected = currentConfig.id === p.config.id || currentConfig.brandName === p.config.brandName;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectTenantPreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: p.config.primaryColor }}
                  />
                  <span>{p.name.split(" (")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Commercial Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Commercial Plan</span>
            <Lock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currentConfig.commercialPlan}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>White-Label Rights Active</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Custom Domain Status</span>
            <Globe className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
            {currentConfig.customDomain}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SSL & CNAME Active</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Monthly Seat Quota</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currentConfig.monthlySeats} Allocated Seats
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Storage: {currentConfig.storageQuotaGb} GB Dedicated
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>API Gateway Tokens</span>
            <Key className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {currentConfig.apiTokensIssued} Headless Keys
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Webhook & SDK Ingress Ready
          </div>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "branding"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Brand & Visuals</span>
        </button>

        <button
          onClick={() => setActiveTab("domain")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "domain"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Custom Domain & DNS</span>
        </button>

        <button
          onClick={() => setActiveTab("features")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "features"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Feature Matrix & Isolation</span>
        </button>

        <button
          onClick={() => setActiveTab("aivoice")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "aivoice"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Voice & Governance</span>
        </button>

        <button
          onClick={() => setActiveTab("embed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "embed"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Embed & Distribution</span>
        </button>
      </div>

      {/* Tab 1: Brand & Visual Identity */}
      {activeTab === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Edit Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                <span>Identity & Naming</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Product / Platform Brand Name
                  </label>
                  <input
                    type="text"
                    value={currentConfig.brandName}
                    onChange={(e) => onUpdateConfig({ ...currentConfig, brandName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. ApexAutomate AI"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Parent Organization / Company Name
                  </label>
                  <input
                    type="text"
                    value={currentConfig.companyName}
                    onChange={(e) => onUpdateConfig({ ...currentConfig, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Apex Global Technologies Ltd."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Platform Tagline / Description
                </label>
                <input
                  type="text"
                  value={currentConfig.tagline}
                  onChange={(e) => onUpdateConfig({ ...currentConfig, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Autonomous Multi-Agent Orchestration & Workflow Engine"
                />
              </div>

              {/* Logo Selection */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Brand Icon / Vector Glyph
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LOGO_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => onUpdateConfig({ ...currentConfig, logoIcon: icon })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition ${
                          currentConfig.logoIcon === icon
                            ? "bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <DynamicIcon name={icon} className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Custom Logo Image URL (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customLogoUrlInput}
                      onChange={(e) => {
                        setCustomLogoUrlInput(e.target.value);
                        onUpdateConfig({ ...currentConfig, logoUrl: e.target.value.trim() });
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://your-domain.com/logo.png"
                    />
                    {currentConfig.logoUrl && (
                      <button
                        onClick={() => {
                          setCustomLogoUrlInput("");
                          onUpdateConfig({ ...currentConfig, logoUrl: undefined });
                        }}
                        className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Color Tokens */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <span>Color Tokens & Theme Engine</span>
              </h2>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Curated Enterprise Color Schemes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => onUpdateConfig({
                        ...currentConfig,
                        primaryColor: preset.primary,
                        accentColor: preset.accent,
                        surfaceTheme: preset.theme,
                      })}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        currentConfig.primaryColor === preset.primary
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex -space-x-1.5">
                        <span className="w-4 h-4 rounded-full border border-white dark:border-slate-900" style={{ backgroundColor: preset.primary }} />
                        <span className="w-4 h-4 rounded-full border border-white dark:border-slate-900" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Hex Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentConfig.primaryColor}
                      onChange={(e) => onUpdateConfig({ ...currentConfig, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={currentConfig.primaryColor}
                      onChange={(e) => onUpdateConfig({ ...currentConfig, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Accent Highlight Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentConfig.accentColor}
                      onChange={(e) => onUpdateConfig({ ...currentConfig, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={currentConfig.accentColor}
                      onChange={(e) => onUpdateConfig({ ...currentConfig, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Client Interface Mockup
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Instant CSS Binding
                </span>
              </div>

              {/* Mock Application Frame */}
              <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-xl">
                {/* Browser Mock Bar */}
                <div className="bg-slate-200 dark:bg-slate-800 px-3 py-2 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-950 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      <span>https://{currentConfig.customDomain}</span>
                    </div>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase">SSL Secured</span>
                  </div>
                </div>

                {/* Simulated Header */}
                <div className="bg-white dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden"
                      style={{ backgroundColor: currentConfig.primaryColor }}
                    >
                      {currentConfig.logoUrl ? (
                        <img src={currentConfig.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <DynamicIcon name={currentConfig.logoIcon} className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {currentConfig.brandName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {currentConfig.companyName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      className="px-2.5 py-1 rounded-lg text-white text-xs font-semibold shadow-sm"
                      style={{ backgroundColor: currentConfig.primaryColor }}
                    >
                      + New Agent
                    </button>
                  </div>
                </div>

                {/* Simulated Content Body */}
                <div className="p-4 space-y-3 bg-slate-50 dark:bg-slate-900/60">
                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Autonomous Apparel & SRE Fleet
                      </div>
                      <div className="text-[11px] text-slate-500">
                        8 Active Multi-Modal Agents
                      </div>
                    </div>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: currentConfig.accentColor }}
                    >
                      Active
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Enterprise Governance Tier
                      </span>
                      <span className="font-mono text-emerald-500 font-bold">Passed</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: "88%", backgroundColor: currentConfig.primaryColor }}
                      />
                    </div>
                  </div>

                  {/* Watermark preview */}
                  {currentConfig.featureToggles.enableWatermark && (
                    <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800">
                      {currentConfig.featureToggles.watermarkText}
                    </div>
                  )}
                </div>
              </div>

              {/* Helper explanation */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <p>
                  Any visual change made here updates your custom header, sidebar, buttons, and badges instantaneously across all connected employee and client accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Domain & DNS Records */}
      {activeTab === "domain" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <span>Custom Subdomain & CNAME Mapping</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Point your organization's domain to our high-availability global edge proxy. Automatic SSL certificates are issued within 120 seconds.
                </p>
              </div>

              <button
                onClick={handleRunDnsCheck}
                disabled={dnsCheckLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dnsCheckLoading ? "animate-spin" : ""}`} />
                <span>{dnsCheckLoading ? "Verifying DNS..." : "Verify DNS Records"}</span>
              </button>
            </div>

            {dnsSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>All DNS records successfully resolved and SSL certificates provisioned for {currentConfig.customDomain}!</span>
              </div>
            )}

            <div className="max-w-xl">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Custom Hostname
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden px-3">
                  <span className="text-xs text-slate-400 font-mono mr-1">https://</span>
                  <input
                    type="text"
                    value={currentConfig.customDomain}
                    onChange={(e) => onUpdateConfig({ ...currentConfig, customDomain: e.target.value.toLowerCase().trim() })}
                    className="flex-1 bg-transparent py-2 text-slate-900 dark:text-white text-sm font-mono focus:outline-none"
                    placeholder="agents.yourcompany.com"
                  />
                </div>
              </div>
            </div>

            {/* DNS Records Table */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Required DNS Host Records
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Host / Name</th>
                      <th className="p-3">Target Value</th>
                      <th className="p-3">TTL</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    {currentConfig.dnsRecords.map((dns, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                            {dns.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">{dns.host}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{dns.value}</td>
                        <td className="p-3 text-slate-400">{dns.ttl}</td>
                        <td className="p-3 font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {dns.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          <button
                            onClick={() => handleCopy(dns.value, `dns-${idx}`)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                            title="Copy target value"
                          >
                            {copiedKey === `dns-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Feature Matrix & Tenant Isolation */}
      {activeTab === "features" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>Feature Flags & Module Packaging</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize which capabilities are visible to this tenant. For example, disable gamification for strict corporate clients, or enable asset galleries for creative design agencies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gamification Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Gamification, XP & Quests</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Employee productivity streaks, XP reward badges, level ranks, and daily quest logs.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFeature("enableGamification")}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    currentConfig.featureToggles.enableGamification ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    currentConfig.featureToggles.enableGamification ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Asset Gallery Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Asset Gallery & Apparel/Vector Hub</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Department asset libraries, shirt design specifications, local generation studio, and canvas bindings.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFeature("enableAssetGallery")}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    currentConfig.featureToggles.enableAssetGallery ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    currentConfig.featureToggles.enableAssetGallery ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Agent Health Diagnostics */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>Agent Health & AI Tuning Monitor</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Real-time error rate telemetry, latency dials, auto-tune healing, and execution health alerts.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFeature("enableHealthDiagnostics")}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    currentConfig.featureToggles.enableHealthDiagnostics ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    currentConfig.featureToggles.enableHealthDiagnostics ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Digital Workspaces & Chill Lounges */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span>Digital Workplaces & Live Stages</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Live office floor simulation, department desk clusters, and breakroom recharge lounges.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFeature("enableWorkplaceStages")}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    currentConfig.featureToggles.enableWorkplaceStages ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    currentConfig.featureToggles.enableWorkplaceStages ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Public API Gateway */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-indigo-500" />
                    <span>Headless Public API Gateway</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Allow external webhooks and third-party developer integrations to trigger agent workflows directly.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFeature("enablePublicApiGateway")}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    currentConfig.featureToggles.enablePublicApiGateway ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    currentConfig.featureToggles.enablePublicApiGateway ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Watermark Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    <span>Custom Footer Watermark</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Display custom confidentiality disclaimer or reseller attribution text on all pages.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFeature("enableWatermark")}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    currentConfig.featureToggles.enableWatermark ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    currentConfig.featureToggles.enableWatermark ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            {/* Custom Watermark Input */}
            {currentConfig.featureToggles.enableWatermark && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Watermark & Compliance Text
                </label>
                <input
                  type="text"
                  value={currentConfig.featureToggles.watermarkText}
                  onChange={(e) => onUpdateConfig({
                    ...currentConfig,
                    featureToggles: {
                      ...currentConfig.featureToggles,
                      watermarkText: e.target.value,
                    },
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Acme Corp Enterprise Protected • SOC2 Type II Certified"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: AI Voice & Governance */}
      {activeTab === "aivoice" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <span>AI Persona & Executive Voice Customizer</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure the default conversational tone and overarching system prompt injected into all agent executions for this client.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assistant Persona Name
                </label>
                <input
                  type="text"
                  value={currentConfig.aiVoice.assistantName}
                  onChange={(e) => onUpdateConfig({
                    ...currentConfig,
                    aiVoice: {
                      ...currentConfig.aiVoice,
                      assistantName: e.target.value,
                    },
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Apex Copilot"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default System Persona Tone
                </label>
                <select
                  value={currentConfig.aiVoice.systemPersonaTone}
                  onChange={(e) => onUpdateConfig({
                    ...currentConfig,
                    aiVoice: {
                      ...currentConfig.aiVoice,
                      systemPersonaTone: e.target.value as any,
                    },
                  })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="executive">Executive & Strategic (C-Suite Summaries)</option>
                  <option value="technical">Technical & SRE (High-Precision Code & Logs)</option>
                  <option value="creative">Creative & Brand (Apparel, Merch & Marketing)</option>
                  <option value="friendly">Friendly & Collaborative (People Ops & Support)</option>
                  <option value="clinical">Clinical & HIPAA (Strict Evidence Triaging)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Global System Prompt Directive (Auto-injected into all Agent steps)
              </label>
              <textarea
                rows={3}
                value={currentConfig.aiVoice.customPromptPrefix}
                onChange={(e) => onUpdateConfig({
                  ...currentConfig,
                  aiVoice: {
                    ...currentConfig.aiVoice,
                    customPromptPrefix: e.target.value,
                  },
                })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                placeholder="You are operating under the governance guidelines of [Company]..."
              />
            </div>

            {/* Support Links */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Support, Compliance & Legal URLs
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Client Support Email
                  </label>
                  <input
                    type="email"
                    value={currentConfig.support.supportEmail}
                    onChange={(e) => onUpdateConfig({
                      ...currentConfig,
                      support: { ...currentConfig.support, supportEmail: e.target.value },
                    })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Documentation URL
                  </label>
                  <input
                    type="text"
                    value={currentConfig.support.docsUrl}
                    onChange={(e) => onUpdateConfig({
                      ...currentConfig,
                      support: { ...currentConfig.support, docsUrl: e.target.value },
                    })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Custom Footer Copyright Statement
                  </label>
                  <input
                    type="text"
                    value={currentConfig.support.customCopyright}
                    onChange={(e) => onUpdateConfig({
                      ...currentConfig,
                      support: { ...currentConfig.support, customCopyright: e.target.value },
                    })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Embed & Commercial Distribution */}
      {activeTab === "embed" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <span>Commercial Distribution & Embed Snippets</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Seamlessly embed this white-labeled portal into your customer's dashboard, mobile container, or intranet.
              </p>
            </div>

            {/* Snippet 1: HTML iFrame */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Standard Web / Intranet iFrame Embed
                </span>
                <button
                  onClick={() => handleCopy(embedHtmlSnippet, "iframe-code")}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {copiedKey === "iframe-code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "iframe-code" ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
                {embedHtmlSnippet}
              </pre>
            </div>

            {/* Snippet 2: React SDK */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  React / Next.js Micro-Frontend SDK
                </span>
                <button
                  onClick={() => handleCopy(reactSnippet, "react-code")}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {copiedKey === "react-code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "react-code" ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
                {reactSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* New Tenant Creation Modal */}
      {newTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Provision New Client Tenant
                </h3>
              </div>
              <button
                onClick={() => setNewTenantModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Create an isolated white-label workspace profile with custom branding, domain, and feature toggles.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenant / Client Name
                </label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Horizon Fintech"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Industry / Target Domain
                </label>
                <input
                  type="text"
                  value={newTenantIndustry}
                  onChange={(e) => setNewTenantIndustry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Banking, E-Commerce, Logistics"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setNewTenantModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewTenant}
                disabled={!newTenantName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 shadow-md shadow-blue-500/20"
              >
                Provision Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
