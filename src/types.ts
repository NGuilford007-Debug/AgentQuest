export type AutonomyLevel = "autonomous" | "hitl" | "shadow";

export type Department = 
  | "Engineering" 
  | "Sales & CRM" 
  | "Customer Support" 
  | "DevOps & SecOps" 
  | "Finance & Legal" 
  | "Human Resources" 
  | "HR & People Ops"
  | "Operations"
  | "Product"
  | "Security"
  | "Marketing";

export type PermissionCategory = 
  | "CRM & Sales" 
  | "DevOps & Cloud" 
  | "Communication" 
  | "Databases & Storage" 
  | "HR & Legal" 
  | "Support & Helpdesk"
  | "Productivity & Workspace"
  | "Payments & Billing"
  | "Analytics & Warehouses"
  | "Custom APIs & Webhooks";

export interface PermissionScope {
  id: string;
  category: PermissionCategory;
  name: string;
  code: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  iconName: string;
  enabledByDefault?: boolean;
  appId?: string; // Links to ConnectedApp ID
  appName?: string;
  endpointPreview?: string;
  httpMethod?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  isCustom?: boolean;
  docUrl?: string;
}

export type AuthType = "OAuth2" | "Bearer Token" | "API Key" | "Basic Auth" | "Webhook Secret" | "IAM Role";

export interface ConnectedApp {
  id: string;
  name: string;
  provider: string; // e.g. "Google", "Atlassian", "GitHub", "Salesforce", "Stripe", "Slack", "Notion", "Datadog", "Custom"
  category: PermissionCategory;
  iconName: string;
  status: "connected" | "disconnected" | "expiring_soon" | "sandbox_active";
  authType: AuthType;
  baseUrl?: string;
  grantedScopes: string[]; // permission codes or IDs
  lastTested?: string;
  latencyMs?: number;
  rateLimitRemaining?: number;
  rateLimitTotal?: number;
  environment: "Production" | "Staging / Sandbox";
  description: string;
  docUrl?: string;
  apiKeyPlaceholder?: string;
  isCustom?: boolean;
}

export interface ApiAuditLog {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  appId: string;
  appName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  status: 200 | 201 | 400 | 401 | 403 | 429 | 500;
  latencyMs: number;
  payloadSnippet: string;
  responseSnippet: string;
}

export type ModelProvider = 
  | "Google Gemini" 
  | "Anthropic" 
  | "OpenAI" 
  | "Meta / Ollama" 
  | "DeepSeek" 
  | "Mistral" 
  | "Custom / Self-Hosted";

export type ModelCategory = 
  | "Multimodal & Fast" 
  | "Deep Reasoning" 
  | "Low Latency" 
  | "Custom / Enterprise"
  | "Code & Tool Specialist";

export interface AiModel {
  id: string; // model slug / identifier
  name: string;
  provider: ModelProvider;
  description: string;
  contextWindow: string; // e.g. "1M Tokens", "200k", "128k"
  latencyTier: "Ultra-Fast (<0.5s)" | "Balanced (~1-2s)" | "Deep Reasoning (~3-5s)";
  costTier: "$" | "$$" | "$$$";
  category: ModelCategory;
  isCustom?: boolean;
  endpointUrl?: string;
  apiKeyEnv?: string;
  tags: string[];
  recommendedRole?: string;
  parameters?: {
    temperatureDefault: number;
    maxTokens?: number;
    topP?: number;
    reasoningEffort?: "low" | "medium" | "high";
  };
  createdDate?: string;
}

export interface ModelBenchmarkResult {
  modelId: string;
  latencyMs: number;
  tokensPerSec: number;
  accuracyScore: number;
  sampleOutput: string;
  testPrompt: string;
  timestamp: string;
}

export interface AgentMonetizationConfig {
  isMonetized: boolean;
  pricingModel: "subscription" | "pay_per_query" | "usage_tokens" | "fixed_retainer";
  priceAmount: number; // e.g. 49.00 ($/mo) or 0.50 ($/query)
  billingInterval: "monthly" | "yearly" | "per_request" | "per_1k_tokens" | "one_time";
  currency: "USD" | "EUR" | "GBP" | "CAD";
  trialQueriesCount: number; // e.g. 3 free queries before requiring payment
  stripeProductId: string; // e.g. "prod_agent_sentryops_live"
  stripePriceId: string; // e.g. "price_1NxyZa2eZvKYlo2C..."
  stripePaymentLink: string; // e.g. "https://buy.stripe.com/test_agent_paywall_..."
  clientStripeConnectAccountId?: string; // e.g. "acct_1NxyZa2eZvKYlo2C"
  clientRevenueSharePercent: number; // e.g. 90 (meaning 90% goes to client, 10% platform fee)
  totalRevenueEarned: number; // cumulative gross USD
  totalPaidQueriesProcessed: number;
  activePayingSubscribersCount: number;
  publicCheckoutTitle?: string;
  publicOfferingDescription?: string;
  customDomainPaywallUrl?: string;
  paywallEnabled: boolean;
  featuresIncluded?: string[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  department: Department;
  description: string;
  model: string;
  temperature: number;
  autonomyLevel: AutonomyLevel;
  assignedTo: {
    userId: string;
    userName: string;
    team: string;
  };
  permissions: string[]; // PermissionScope ids
  systemPrompt: string;
  status: "active" | "idle" | "paused";
  stats: {
    tasksCompleted: number;
    hoursSaved: number;
    successRate: number; // e.g. 98.4
    avgLatencySec: number;
    xpGenerated: number;
  };
  monetization?: AgentMonetizationConfig;
  createdAt: string;
}

export type NodeType =
  | "trigger"
  | "data_source"
  | "ai_process"
  | "condition"
  | "permission_gate"
  | "human_review"
  | "action_output";

export interface NodePort {
  id: string;
  label: string;
  type: "input" | "output";
}

export type ConditionOperator = 
  | "equals" 
  | "not_equals" 
  | "contains" 
  | "not_contains"
  | "greater_than" 
  | "less_than" 
  | "regex" 
  | "ai_eval";

export interface ConditionRule {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  branch: "true" | "false";
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  categoryName?: string;
  description: string;
  iconName: string;
  position: { x: number; y: number };
  attachedAssetIds?: string[];
  config: {
    triggerType?: string;
    sourceApp?: string;
    aiAction?: "classify" | "extract" | "summarize" | "generate" | "validate" | "code_review";
    promptTemplate?: string;
    requiredPermissions?: string[];
    approverRole?: string;
    actionTarget?: string;
    conditionField?: string;
    conditionOperator?: ConditionOperator;
    conditionValue?: string;
    conditionRules?: ConditionRule[];
    conditionExpression?: string;
    conditionMode?: "all" | "any" | "ai_eval";
    trueBranchLabel?: string;
    falseBranchLabel?: string;
    assignedAssetDirectory?: string;
    [key: string]: any;
  };
  status?: "idle" | "running" | "completed" | "error" | "waiting_review";
}

export interface WorkflowConnection {
  id: string;
  from: string; // source node id
  to: string; // target node id
  label?: string;
  condition?: string;
  branchType?: "true" | "false" | "default" | "custom";
  fromPort?: "out" | "true" | "false";
  toPort?: "in";
}

export interface Workflow {
  id: string;
  agentId: string;
  name: string;
  description: string;
  department: Department;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  isActive: boolean;
  lastRun?: string;
  totalRuns: number;
  avgHoursSavedPerRun: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: "automation" | "speed" | "collaboration" | "governance" | "mastery";
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockedAt?: string;
  xpReward?: number;
  progress: number; // 0 to 100
  businessImpact?: string;
  achievementType?: "approved_automation" | "company_milestone" | "operational_scale" | "governance";
  targetMetric?: string;
  associatedPlaybook?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: "daily" | "weekly" | "milestone";
  current: number;
  target: number;
  unit: string;
  xpReward?: number;
  completed: boolean;
  claimed: boolean;
  expiresIn?: string;
  iconName: string;
  businessGoal?: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  role: string;
  department: Department;
  avatar: string;
  xp: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  streakDays: number;
  streakMultiplier: number;
  hoursSavedTotal: number;
  tasksAutomatedTotal: number;
  costSavedUsd: number;
  accuracyScore: number;
  creditsBalance?: number;
  creditsTotal?: number;
  approvedAutomationsCount?: number;
  autonomousRunRatio?: number;
  companyMilestonesCompleted?: number;
  badges: Badge[];
  quests: Quest[];
}

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  role: string;
  department: Department;
  avatar: string;
  xp: number;
  level: number;
  hoursSaved: number;
  automationsRun: number;
  activeAgents: number;
  isCurrentUser?: boolean;
  streak: number;
  opexSavedUsd?: number;
  autonomyRate?: number;
  approvedPlaybooksCount?: number;
}

export interface StepExecutionResult {
  nodeId: string;
  name: string;
  type: string;
  status: "completed" | "needs_review" | "flagged" | "failed";
  durationMs?: number;
  output: string;
  confidence: number;
  extractedData?: Record<string, any>;
}

export interface TaskTroubleshootReport {
  id: string;
  taskId: string;
  discrepancyType: "missing_constraints" | "wrong_format" | "hallucination_drift" | "persona_mismatch" | "too_shallow" | "other";
  userFeedback: string;
  diagnosis: string;
  rootCauseCategory: string;
  missingElements: string[];
  optimizedPrompt: string;
  recommendedTemperature: number;
  recommendedModel: string;
  keyFixTips: string[];
  timestamp: string;
}

export interface TaskExecutionRecord {
  id: string;
  agentId: string;
  agentName: string;
  workflowId: string;
  workflowName: string;
  title: string;
  department: Department;
  inputPayload: string;
  status: "running" | "completed" | "needs_review" | "failed" | "approved" | "cancelled" | "rejected" | "discrepancy" | "resolved";
  summary: string;
  generatedOutput?: string;
  prompt?: string;
  stepsOutput: StepExecutionResult[];
  auditLogs: string[];
  keyEntitiesExtracted?: Record<string, any>;
  suggestedHumanAction?: string | null;
  hoursSaved: number;
  xpEarned: number;
  creditsCost?: number;
  tokensConsumed?: number;
  cancelledReason?: string;
  feedback?: {
    isApproved: boolean;
    discrepancyReason?: string;
    userNote?: string;
    troubleshootReport?: TaskTroubleshootReport;
    resolvedAt?: string;
  };
  timestamp: string;
  isSimulated?: boolean;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ActiveTaskSession {
  id: string;
  title: string;
  department: Department;
  description: string;
  checklist: TaskChecklistItem[];
  scratchpad: string;
  startedAt: string;
  elapsedSeconds: number;
  isRunning: boolean;
  assignedAgentId?: string;
}

export interface SaveStateSnapshot {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  agentsCount: number;
  workflowsCount: number;
  executionsCount: number;
  data: {
    agents: Agent[];
    workflows: Workflow[];
    userProfile: EmployeeProfile;
    executionHistory: TaskExecutionRecord[];
    activeTaskSession?: ActiveTaskSession | null;
  };
}

export type WorkplaceVibe = "deep_focus" | "chill_lofi" | "cyber_alert" | "zen_oasis" | "creative_flow" | "social_cafe";

export interface WorkplaceStageItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  bonusEffect: string;
  xpReward: number;
  soundEffectType?: "coffee" | "gong" | "terminal" | "chime" | "laser" | "sip";
}

export interface WorkplaceStage {
  id: string;
  name: string;
  subtitle: string;
  category: "workplace" | "chill_spot";
  vibe: WorkplaceVibe;
  themeColor: {
    bg: string;
    border: string;
    accent: string;
    glow: string;
    bannerGradient: string;
  };
  ambientTrack: "cyber_hum" | "zen_rain" | "lofi_beats" | "binaural_432" | "cafe_chatter" | "vault_pulse";
  ambientTrackTitle: string;
  focusRating: number; // e.g. 96 (%)
  temperature: string; // e.g. "68°F / 20°C"
  energyLoad: string; // e.g. "Optimal (84%)"
  noiseLevel: string; // e.g. "12 dB (Ultra Quiet)"
  buffMultiplier: string; // e.g. "+25% SRE Incident Resolution Speed"
  buffDescription: string;
  bannerImage: string;
  assignedAgentIds: string[];
  interactiveItems: WorkplaceStageItem[];
  defaultThoughts: string[];
}

export type HealthSeverity = "healthy" | "warning" | "critical";

export interface HealthIssue {
  id: string;
  type: "high_failure_rate" | "low_roi" | "high_latency" | "temperature_drift" | "vague_prompt" | "permission_mismatch";
  title: string;
  description: string;
  impact: string;
  metricValue: string;
  severity: "warning" | "critical";
}

export interface AgentHealthRecommendation {
  summary: string;
  rootCauses: string[];
  recommendedTemperature: number;
  temperatureReasoning: string;
  recommendedAutonomyLevel: AutonomyLevel;
  autonomyReasoning: string;
  recommendedModel: string;
  recommendedPermissions?: string[];
  suggestedPrompt: string;
  promptImprovements: string[];
  predictedSuccessRateBoost: number; // e.g. 18 (%)
  predictedHoursSavedBoost: number; // e.g. 35 (%)
  roiImprovementSummary: string;
}

export interface AgentHealthDiagnostic {
  agentId: string;
  healthScore: number; // 0 - 100
  status: HealthSeverity;
  failureRate: number; // e.g. 32 (%)
  roiScore: number; // e.g. 3.4x
  costPerTaskUsd: number;
  valuePerTaskUsd: number;
  issues: HealthIssue[];
  recommendation?: AgentHealthRecommendation;
  lastAnalyzedAt?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  department: Department;
  avatar: string;
  description: string;
  model: string;
  temperature: number;
  autonomyLevel: AutonomyLevel;
  permissions: string[];
  systemPrompt: string;
  category: string;
  tags: string[];
  difficultyTier: "Beginner" | "Intermediate" | "Advanced" | "Enterprise";
  estimatedHoursSavedPerMonth: number;
  featured?: boolean;
  recommendedWorkflowNodes?: string[];
  suggestedPrompts?: string[];
}

export interface GamifiedMilestone {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tier: "tier_1" | "tier_2" | "tier_3" | "tier_4" | "tier_5";
  tierName: string;
  tierLevel: number;
  category: "agents" | "prompts" | "workflows" | "governance" | "impact" | "automations" | "revenue";
  iconName: string;
  currentValue: number;
  targetValue: number;
  metricLabel: string;
  xpReward?: number;
  perkReward: string;
  perkIcon?: string;
  completed: boolean;
  claimed: boolean;
  unlockedAt?: string;
  businessImpact?: string;
  operationalCapability?: string;
  isCompanyMilestone?: boolean;
  isAutomationAchievement?: boolean;
  isApprovedAutomationAchievement?: boolean;
}

export type CompanyMilestone = GamifiedMilestone;

export interface PromptSnippet {
  id: string;
  title: string;
  category: "structure" | "reasoning" | "governance" | "tone" | "guardrails";
  description: string;
  snippet: string;
  iconName: string;
}

export type AssetType = "image" | "document" | "template" | "vector_svg" | "code_snippet";

export interface AssetItem {
  id: string;
  title: string;
  description: string;
  type: AssetType;
  department: Department;
  category: string; // e.g. "Apparel & Shirt Designs", "Brand Guidelines", "System Architecture", "Financial Templates"
  directory: string; // e.g. "creative/apparel/shirts", "creative/marketing/banners", "engineering/specs", "finance/invoices"
  url: string; // Image URL or download/preview resource
  thumbnailUrl?: string;
  fileSize: string; // e.g. "2.4 MB"
  dimensions?: string; // e.g. "2048 x 2048"
  format: string; // e.g. "PNG", "SVG", "PDF", "MD"
  tags: string[];
  createdAt: string;
  isLocallyGenerated?: boolean;
  generationPrompt?: string;
  attachedWorkflowCount?: number;
  metadata?: {
    colorPalette?: string[];
    author?: string;
    style?: string;
    targetChannel?: string;
    aspectRatio?: string;
    revision?: number;
    [key: string]: any;
  };
}

export interface AssetDirectory {
  id: string;
  path: string;
  name: string;
  department: Department;
  iconName: string;
  description: string;
  itemCount: number;
}

export interface DnsRecord {
  type: "CNAME" | "TXT" | "A" | "MX";
  host: string;
  value: string;
  status: "verified" | "propagating" | "unverified";
  ttl: string;
}

export interface FeatureToggles {
  enableGamification: boolean;
  enableAssetGallery: boolean;
  enableHealthDiagnostics: boolean;
  enableWorkplaceStages: boolean;
  enableModelManager: boolean;
  enableRoiAnalytics: boolean;
  enableCustomApps: boolean;
  enablePublicApiGateway: boolean;
  enableWatermark: boolean;
  watermarkText: string;
}

export interface WhiteLabelConfig {
  id: string;
  brandName: string;
  companyName: string;
  tagline: string;
  logoUrl?: string;
  logoIcon: string;
  faviconUrl?: string;
  customDomain: string;
  cnameVerified: boolean;
  primaryColor: string;
  accentColor: string;
  surfaceTheme: "slate" | "zinc" | "neutral" | "sapphire" | "emerald" | "amber";
  clientPortalMode: boolean;
  featureToggles: FeatureToggles;
  support: {
    supportEmail: string;
    docsUrl: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
    customCopyright: string;
  };
  aiVoice: {
    assistantName: string;
    systemPersonaTone: "executive" | "technical" | "friendly" | "creative" | "clinical";
    customPromptPrefix: string;
  };
  dnsRecords: DnsRecord[];
  commercialPlan: "Starter Agency" | "Growth SaaS" | "Enterprise White-Label" | "Custom Dedicated";
  monthlySeats: number;
  storageQuotaGb: number;
  apiTokensIssued: number;
}

export interface TenantProfile {
  id: string;
  name: string;
  industry: string;
  createdAt: string;
  config: WhiteLabelConfig;
}

// ----------------------------------------------------
// Monetization, Unit Economics & Developer Profit Types
// ----------------------------------------------------

export interface DeveloperCompanyProfile {
  companyName: string;
  developerEmail: string;
  founderAccessGranted: boolean;
  developerInternalTenantId: string;
  payoutAccount: {
    isStripeConnected: boolean;
    accountHolder: string;
    payoutCadence: "Daily" | "Weekly" | "Monthly";
    currency: "USD" | "EUR" | "GBP" | "CAD";
    lastPayoutAmount: number;
    lastPayoutDate: string;
  };
}

export interface RateCardConfig {
  // Raw Cost (What Google Cloud & Gemini actually charges you)
  storageBaseCostPerGbMonth: number; // e.g. 0.020 ($/GB)
  aiTokenCostPerMillionIn: number;    // e.g. 0.075 ($/1M prompt tokens)
  aiTokenCostPerMillionOut: number;   // e.g. 0.300 ($/1M completion tokens)
  imageGenCostPerUnit: number;        // e.g. 0.040 ($/image)

  // Markup Multipliers (How you turn a profit)
  storageMarkupMultiplier: number;    // e.g. 5.0x (charges $0.10/GB -> 400% profit)
  aiTokenMarkupMultiplier: number;    // e.g. 4.0x (charges $0.30/1M in, $1.20/1M out -> 300% profit)
  imageGenMarkupMultiplier: number;   // e.g. 5.0x (charges $0.20/image -> 400% profit)
  
  // Base Subscription Pricing Tiers ($/month)
  starterTierMonthlyFee: number;      // e.g. $149
  growthTierMonthlyFee: number;       // e.g. $499
  enterpriseTierMonthlyFee: number;   // e.g. $1,499
}

export interface TenantBillingRecord {
  tenantId: string;
  tenantName: string;
  plan: "Starter Agency" | "Growth SaaS" | "Enterprise White-Label" | "Custom Dedicated" | "Developer Free Tier";
  isInternalDeveloper: boolean; // TRUE = 100% Free Lifetime VIP Compute & Storage for your company
  contactEmail: string;
  billingStatus: "paid" | "overage_due" | "auto_recharged" | "free_developer_pass";
  
  // Base Fee
  basePlanFee: number;

  // Metered Storage Metrics
  storageUsedGb: number;
  storageQuotaGb: number;
  rawStorageCost: number;
  billedStorageFee: number;

  // Metered AI Inference Metrics
  promptTokensUsed: number;
  completionTokensUsed: number;
  imagesGeneratedCount: number;
  rawAiInfraCost: number;
  billedAiUsageFee: number;

  // Financial Aggregates
  totalRawInfraCost: number;
  totalBilledRevenue: number;
  netProfit: number;
  profitMarginPercent: number;

  // Wallet / Balance
  walletCreditBalance: number;
  autoRechargeEnabled: boolean;
  autoRechargeThreshold: number;
  autoRechargeAmount: number;
  lastInvoiceDate: string;
  invoiceHistoryCount: number;
}

export interface FinancialMetricSnapshot {
  period: string; // e.g. "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"
  grossRevenue: number;
  rawInfraCost: number;
  netProfit: number;
  marginPercent: number;
  activePaidTenants: number;
}

export interface MonetizationState {
  developerCompany: DeveloperCompanyProfile;
  rateCard: RateCardConfig;
  tenantsBilling: TenantBillingRecord[];
  developerBypassActive: boolean; // When true, your current workspace session has unlimited free AI & storage
}

// =========================================================================
// STRIPE INTEGRATION: RECEIVABLES (INCOMING REVENUE) & PAYABLES (OUTGOING BILLS)
// =========================================================================

export interface StripeReceivableInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0801"
  tenantId: string;
  tenantName: string;
  customerEmail: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  stripeCheckoutSessionUrl?: string;
  amount: number; // total amount in USD
  subtotal: number;
  tax: number;
  currency: string; // e.g. "usd"
  status: "draft" | "open" | "paid" | "uncollectible" | "void" | "refunded";
  issuedDate: string;
  dueDate: string;
  paidAt?: string;
  paymentMethodType?: "card" | "us_bank_account" | "sepa_debit" | "apple_pay" | "google_pay";
  receiptUrl?: string;
  lineItems: {
    id: string;
    description: string;
    category: "subscription_base" | "metered_ai_tokens" | "metered_storage" | "image_generation" | "custom_service";
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  autoCharge: boolean;
}

export interface StripePayableBill {
  id: string;
  billNumber: string; // e.g. "BILL-2026-042"
  vendorName: string;
  vendorCategory: "Google Cloud Infra" | "Contractor & Prompt Engineer" | "AI Model API Vendor" | "Affiliate & Partner Payout" | "Software License";
  vendorEmail: string;
  stripeRecipientAccountId?: string; // Stripe Connect / Custom Account id
  stripeTransferId?: string;
  stripePayoutId?: string;
  amount: number; // amount in USD
  currency: string;
  status: "pending_approval" | "scheduled" | "processing" | "paid" | "failed" | "cancelled";
  dueDate: string;
  paidAt?: string;
  payoutMethod: "stripe_connect_transfer" | "instant_card_payout" | "ach_direct_deposit" | "wire_transfer";
  description: string;
  invoiceFileReference?: string;
  approvedBy?: string;
  notes?: string;
}

export interface StripeAccountStatus {
  hasSecretKey: boolean;
  isLiveMode: boolean;
  publishableKey?: string;
  accountId?: string;
  accountEmail?: string;
  businessName?: string;
  defaultCurrency: string;
  availableBalance: number;
  pendingBalance: number;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  webhookConfigured: boolean;
  liveTransactionsCount: number;
}

export interface WebAppDeploymentConfig {
  appName: string;
  shortName: string;
  appDescription: string;
  displayMode: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
  iconUrl: string;
  customDomain?: string;
  isPwaInstalled: boolean;
}

// ----------------------------------------------------
// Master Developer vs. Client Access Gate
// ----------------------------------------------------

export type AccessLevel = "master_developer" | "client_tenant";

export interface MasterAccessSettings {
  currentAccessLevel: AccessLevel;
  founderEmail: string;
  developerCompanyName: string;
  founderPin: string; // e.g. "founder2026"
  isSimulatingClientView: boolean;
  clientLockEnforced: boolean; // When true, client accounts cannot remix or see white-label
  detectedEnvironment: "google_ai_studio" | "standalone_web_app" | "client_custom_domain";
}

// ----------------------------------------------------
// Approved Automations & Playbooks Vault
// ----------------------------------------------------

export type ApprovedAutomationCategory = 
  | "workflow" 
  | "automation" 
  | "script" 
  | "policy" 
  | "playbook" 
  | "email_template";

export interface ApprovedAutomation {
  id: string;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  department: Department;
  modelUsed: string;
  sourcePrompt: string;
  generatedContent: string;
  suggestedActions: string[];
  category: ApprovedAutomationCategory;
  approvedAt: string;
  status: "active" | "deployed" | "archived";
  workflowId?: string; // If converted to a live studio workflow
  estimatedHoursSaved: number;
  tags: string[];
  isBookmarked?: boolean;
}

// ----------------------------------------------------
// Client Agent Monetization via Stripe Connect Types
// ----------------------------------------------------

export interface ClientStripeConnectProfile {
  tenantId: string;
  tenantName: string;
  isStripeConnected: boolean;
  stripeAccountId: string; // e.g. "acct_1NxyZa2eZvKYlo2C"
  stripeAccountEmail: string;
  accountHolderName: string;
  bankName: string;
  bankAccountLast4: string;
  accountType: "express" | "standard" | "custom";
  status: "verified" | "pending_kyc" | "action_required" | "restricted";
  availableStripeBalance: number;
  pendingStripeBalance: number;
  totalAgentGrossRevenue: number;
  totalPlatformFeesPaid: number;
  totalClientNetEarnings: number;
  lifetimePayoutsTransferred: number;
  defaultPayoutCadence: "instant" | "daily" | "weekly" | "monthly";
  currency: "USD" | "EUR" | "GBP" | "CAD";
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
  customDomainPaywallUrl?: string;
}

export interface ClientAgentTransaction {
  id: string;
  timestamp: string;
  tenantId: string;
  tenantName: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  department: Department;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
  pricingModel: "subscription" | "pay_per_query" | "usage_tokens" | "fixed_retainer";
  grossAmount: number; // in USD
  platformFeeAmount: number; // e.g. 10%
  clientNetAmount: number; // e.g. 90%
  stripePaymentIntentId: string;
  stripeReceiptUrl?: string;
  status: "succeeded" | "processing" | "refunded";
  querySnippet?: string;
  apiTokensUsed?: number;
  billingPeriod?: string;
}

export interface ClientPayoutRecord {
  id: string;
  payoutId: string; // e.g. "po_1NxyZa2eZvKYlo2C..."
  tenantId: string;
  timestamp: string;
  amount: number;
  currency: string;
  bankName: string;
  bankAccountLast4: string;
  status: "paid" | "in_transit" | "pending";
  arrivalDate: string;
  stripeTransferReference: string;
}


export type ReportCategory = 
  | "Executive Briefing"
  | "Financial & ROI Audit"
  | "SRE & Incident Post-Mortem"
  | "Client Proposal & Sales"
  | "Operational Playbook & SOP"
  | "Compliance & Security Review";

export type ReportClassification = "Confidential" | "Internal" | "Executive Board" | "Client Facing";

export interface GeneratedReportDocument {
  id: string;
  title: string;
  category: ReportCategory;
  classification: ReportClassification;
  department: Department;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  modelUsed: string;
  createdAt: string;
  sourcePrompt: string;
  content: string;
  summary: string;
  businessImpactUsd: number;
  hoursSavedEstimated: number;
  wordCount: number;
  tags: string[];
  isPinned?: boolean;
  status: "final" | "draft" | "under_review";
  keyTakeaways?: string[];
  metricsHighlights?: {
    label: string;
    value: string;
    trend?: string;
  }[];
}
