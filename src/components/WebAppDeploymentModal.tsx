import React, { useState } from "react";
import {
  Globe,
  Smartphone,
  Server,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Terminal,
  Cpu,
  Zap,
  Lock,
  ArrowRight
} from "lucide-react";

interface WebAppDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export const WebAppDeploymentModal: React.FC<WebAppDeploymentModalProps> = ({
  isOpen,
  onClose,
  appName = "AgentFlow Enterprise",
}) => {
  const [activeTab, setActiveTab] = useState<"instant_live" | "pwa" | "custom_domain" | "docker_export">("instant_live");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const dockerfileSnippet = `# Production Multi-Stage Dockerfile for ${appName}
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["npm", "start"]`;

  const dockerComposeSnippet = `version: '3.8'
services:
  ${appName.toLowerCase().replace(/\s+/g, "-")}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
      - VITE_STRIPE_PUBLISHABLE_KEY=\${VITE_STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
    restart: unless-stopped`;

  const manifestSnippet = `{
  "name": "${appName} - Autonomous AI Agency OS",
  "short_name": "${appName.split(" ")[0]}",
  "description": "Multi-tenant autonomous AI agent orchestrator with Stripe receivables and payables.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#090d16",
  "theme_color": "#7c3aed",
  "icons": [
    {
      "src": "/icon.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                How to Make This into a Production Web App
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deploy, host, install as a PWA, or connect your custom domain in 4 simple methods.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto">
          {[
            { id: "instant_live", label: "1. Instant Live Web App", icon: Zap },
            { id: "pwa", label: "2. Install as PWA (App Store Alternative)", icon: Smartphone },
            { id: "custom_domain", label: "3. Custom Domain & DNS", icon: Globe },
            { id: "docker_export", label: "4. Export / Docker / VPS", icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-purple-600 text-purple-600 dark:text-purple-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {/* TAB 1: INSTANT LIVE WEB APP */}
          {activeTab === "instant_live" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    Good News: This is Already a Full-Stack Web Application!
                  </div>
                  <p className="text-emerald-800/90 dark:text-emerald-300 mt-1">
                    Your application is built with a production-ready <strong>Node.js + Express backend</strong> and <strong>React + Vite + Tailwind frontend</strong> running on port 3000 in a containerized Google Cloud Run environment.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-purple-600" />
                    <span>Instant Live Sharing Link</span>
                  </div>
                  <p className="text-slate-500">
                    Use the <strong>Share</strong> button in Google AI Studio top-right bar to publish a live URL that any tenant or customer can access from any web browser worldwide.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>Server-Side Secrets Protection</span>
                  </div>
                  <p className="text-slate-500">
                    Your Gemini API key, Stripe Secret Key, and webhook signatures remain secure on the backend server and are never exposed to browser client code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PWA (PROGRESSIVE WEB APP) */}
          {activeTab === "pwa" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Turn into an Installable Mobile & Desktop App (PWA)
                </h4>
                <p className="text-slate-500 mt-1">
                  Progressive Web Apps allow your clients to install {appName} directly on their iPhone, Android, or Mac/Windows Dock with an app icon and standalone window experience.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                    public/manifest.json
                  </span>
                  <button
                    onClick={() => copyCode(manifestSnippet, "manifest")}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                  >
                    {copiedSection === "manifest" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy manifest.json</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-[11px]">
                  {manifestSnippet}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">iOS Installation (Safari):</div>
                  <div className="text-slate-500 mt-1">Tap Share Icon (⎋) → Select &quot;Add to Home Screen&quot;.</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">Chrome / Edge (Desktop & Android):</div>
                  <div className="text-slate-500 mt-1">Click the &quot;Install App&quot; icon in the address bar (⊕).</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM DOMAIN & DNS */}
          {activeTab === "custom_domain" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Connect Your Custom Domain (e.g. app.yourcompany.com)
                </h4>
                <p className="text-slate-500 mt-1">
                  Point any domain from Cloudflare, GoDaddy, Namecheap, or Google Domains directly to your web app.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">DNS Record Type</th>
                      <th className="py-2.5 px-4">Host / Name</th>
                      <th className="py-2.5 px-4">Target Value</th>
                      <th className="py-2.5 px-4">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    <tr>
                      <td className="py-3 px-4 font-bold text-purple-600">CNAME</td>
                      <td className="py-3 px-4">app</td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">ghs.googlehosted.com</td>
                      <td className="py-3 px-4 text-slate-500">Auto (300s)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-purple-600">A Record (Apex)</td>
                      <td className="py-3 px-4">@</td>
                      <td className="py-3 px-4 text-slate-900 dark:text-white">216.239.32.21</td>
                      <td className="py-3 px-4 text-slate-500">Auto (300s)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <span>SSL/TLS certificates are automatically provisioned with free automatic renewal.</span>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT / DOCKER / VPS */}
          {activeTab === "docker_export" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Deploy to Any Server (Docker / Railway / Vercel / Cloud Run)
                </h4>
                <p className="text-slate-500 mt-1">
                  Export your project as a ZIP or GitHub repo from the top-right Settings menu, and run with Docker.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px]">Dockerfile:</span>
                  <button
                    onClick={() => copyCode(dockerfileSnippet, "dockerfile")}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all"
                  >
                    {copiedSection === "dockerfile" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Dockerfile</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto font-mono text-[11px]">
                  {dockerfileSnippet}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">1-Line CLI Build & Run Command:</div>
                <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
                  docker build -t agentflow-app . &amp;&amp; docker run -p 3000:3000 --env-file .env agentflow-app
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <div className="text-slate-500 text-xs">
            Ready for production client onboarding & Stripe processing.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
