import { LegalDocumentItem } from "../types";

export const INITIAL_LEGAL_DOCUMENTS: LegalDocumentItem[] = [
  {
    id: "doc-enterprise-reseller",
    name: "Enterprise & Reseller Distribution Agreement",
    category: "terms_of_service",
    title: "AgentFlow Enterprise / Reseller Agreement",
    version: "v1.0-ENTERPRISE",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Commercial contract governing enterprise licensing, white-label distribution, downstream tenant provisioning, multi-tenant billing models, and reseller responsibilities with Guilford Industries.",
    keyClauses: [
      {
        heading: "1. Agreement Hierarchy & Precedence",
        description: "Incorporates Order Forms, EULA, AUP, Safety Agreement, Credential Agreement, High-Risk Policy, Privacy Policy, DPA, and SLA. Order of precedence: Mandatory law → Negotiated Order Form → DPA → Enterprise Agreement.",
        importance: "critical"
      },
      {
        heading: "2. White-Label & Reseller Distribution Rights",
        description: "Authorized customers can brand workspaces (custom logos, domains, and palettes) and provision downstream client tenants, while underlying technology remains proprietary to Guilford Industries / AgentFlow.",
        importance: "critical"
      },
      {
        heading: "3. Downstream Customer Flow-Down Obligations",
        description: "Resellers must ensure downstream end customers are contractually bound to terms substantially consistent with AgentFlow Terms, AUP, Safety, and Privacy rules.",
        importance: "high"
      },
      {
        heading: "4. Multi-Tenant Logical Isolation & Direct Billing Options",
        description: "Strict isolation across tenant boundaries, supporting Direct Billing, Reseller Billing, and Hybrid billing settlement models.",
        importance: "high"
      }
    ],
    content: `# AgentFlow Enterprise / Reseller Agreement
**Effective Date:** August 23, 2026  
**Version:** 1.0  
**Legal Entity:** Guilford Industries ("AgentFlow," "Provider," "we," "us," or "our")  

---

This Enterprise / Reseller Agreement ("Agreement") is entered into by and between **Guilford Industries**, a commercial enterprise entity ("AgentFlow," "Provider," "we," "us," or "our"), and the subscribing Customer or Reseller ("Customer," "Reseller," "you," or "your").

AgentFlow and Customer are each a "Party" and collectively the "Parties."
This Agreement governs Customer's enterprise use, resale, white-label distribution, embedding, provisioning, and administration of the AgentFlow Enterprise platform ("Platform" or "Services").

---

### 1. Agreement Structure
This Agreement incorporates the following documents:
1. this Enterprise / Reseller Agreement;
2. applicable Order Forms;
3. AgentFlow Terms of Service / EULA;
4. Acceptable Use Policy ("AUP");
5. AI Agent Safety and Responsible Autonomy Agreement;
6. Credential and Connected Service Authorization Agreement;
7. High-Risk and Restricted Use Policy;
8. Privacy Policy;
9. Data Processing Addendum ("DPA");
10. applicable Security Documentation; and
11. applicable Service Level Agreement ("SLA").

**Order of Precedence:**  
Mandatory law → negotiated Order Form → DPA for data-processing matters → this Agreement → applicable product policies → general documentation.

---

### 2. Enterprise Services
AgentFlow provides Customer with access to:
* AI Agents & multi-Agent orchestration;
* Agent Stack Chat & Digital Workspaces;
* Workflow automation & Tool execution;
* API integrations, code execution & security tools;
* ROI Analytics, billing & metering functionality;
* AI Image Studio & Asset Libraries;
* Role-Based Access Control (RBAC) & audit logs;
* White-label functionality & embedded interfaces;
* Tenant management & custom Agent creation/monetization;
* Enterprise reporting & compliance audit logs.

---

### 3. Enterprise Account & Tenant Isolation
Customer may establish one or more enterprise Workspaces containing Users, Administrators, Agents, Tools, Workflows, Connected Services, and Credentials. Each downstream tenant is logically and cryptographically isolated. Customer is responsible for activity conducted through its account.

---

### 4. White-Label & Reseller Rights
1. **Branding & Distribution:** Subject to applicable subscriptions and Order Forms, Customer may market, demonstrate, provision authorized sub-tenants, and configure custom logos, colors, typography, and domains.
2. **Restrictions:** Customer may not claim ownership of underlying software, reverse engineer the Platform, or remove legally required notices.
3. **Downstream Flow-Down:** Resellers must ensure all downstream End Customers accept terms providing protections consistent with AgentFlow EULA, AUP, Safety, and Privacy standards.

---

### 5. AI Outputs & Human Oversight
- AgentFlow generates probabilistic outputs (text, code, analyses, workflows). Customer must review outputs before relying upon them for critical operations.
- Customer is responsible for configuring autonomy levels, Tools, Credentials, spending limits, and Human-in-the-Loop (HITL) approval gates.

---

### 6. Billing, Usage & Commercial Terms
- Direct, Reseller, or Hybrid billing models established in Order Forms.
- Authoritative metered resource calculation based on tokens, compute duration, API invocations, and storage.

---

### 7. Signatures
**AGENTFLOW (Guilford Industries)**  
By Authorized Officer & Cryptographic Platform Attestation.  
**CUSTOMER / RESELLER**  
Accepted electronically upon plan provisioning and workspace activation.`
  },
  {
    id: "doc-master-tos-eula",
    name: "Master Terms of Service & EULA (End-User License)",
    category: "terms_of_service",
    title: "Master Terms of Service & End-User License Agreement",
    version: "v1.0-ENTERPRISE",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Foundational contract governing software access, probabilistic AI disclosures, autonomous agent authorizations, tool executions, connected credentials, liability caps, and indemnification for all paying users.",
    keyClauses: [
      {
        heading: "1. Probabilistic AI Systems & No Accuracy Guarantee",
        description: "Agent outputs and actions are probabilistic and nondeterministic. AgentFlow is an automation and decision-support platform, not a substitute for human professional judgment.",
        importance: "critical"
      },
      {
        heading: "2. Autonomous Agent Operation & Customer Oversight",
        description: "Customers determine and configure autonomy tiers, permissions, and tool access. Human oversight is mandatory for financial, employment, legal, health, and production workflows.",
        importance: "critical"
      },
      {
        heading: "3. Tool Invocation & Third-Party System Interactions",
        description: "Agents invoke tools (code execution, SQL querying, webhooks, REST APIs) affecting external systems. Customer represents it holds full authority over connected credentials.",
        importance: "high"
      },
      {
        heading: "4. Limitation of Liability & 12-Month Cap",
        description: "Liability is strictly limited to direct damages capped at amounts paid in the preceding 12 months, excluding indirect, punitive, or consequential damages.",
        importance: "high"
      }
    ],
    content: `# AgentFlow Enterprise
## Master Terms of Service and End-User License Agreement
**Effective Date:** August 23, 2026  
**Last Updated:** August 23, 2026  

---

These Master Terms of Service and End-User License Agreement ("Agreement") govern access to and use of **AgentFlow Enterprise** ("AgentFlow," the "Platform," "Service," "we," "us," or "our"), including its software, websites, applications, APIs, workspaces, AI agents, automation tools, workflow systems, integrations, documentation, and related services.

By creating an account, accessing the Platform, clicking an acceptance button, executing an order form, or otherwise using AgentFlow, you ("Customer," "User," or "you") agree to be bound by this Agreement. If you are accepting on behalf of an organization, you represent and warrant that you have authority to bind that organization.

---

### 1. Definitions
- **"Agent"**: An artificial-intelligence software agent configured or provided through AgentFlow that may generate content, analyze information, invoke tools, execute workflows, or communicate with connected services.
- **"Agent Action"**: An action performed, attempted, proposed, or initiated by an Agent through a tool, workflow, API, integration, or connected service.
- **"Customer Data"**: Information, files, prompts, credentials, configurations, datasets, or communications submitted to or processed through AgentFlow.
- **"Connected Service"**: A third-party service, application, API, database, repository, cloud environment, or external system connected to AgentFlow.
- **"Workspace"**: An organizational environment within AgentFlow in which Users, Agents, workflows, data, permissions, and configurations are managed.

---

### 2. License and Right to Use
Subject to this Agreement and applicable subscription tiers, we grant Customer a limited, non-exclusive, non-transferable, non-sublicensable right during the subscription period to access and use AgentFlow for internal business operations. Ownership of all software, models, systems, interfaces, and intellectual property remains with AgentFlow and its licensors.

---

### 3. AI Agents & Probabilistic Systems
Customer acknowledges that AgentFlow incorporates artificial-intelligence systems that may produce probabilistic, nondeterministic, incomplete, or unexpected results. Agents are decision-support and automation systems, not a substitute for human professional judgment.

---

### 4. Autonomous Agent Operation & Human Oversight
Customer is responsible for selecting Agents, configuring permissions, establishing autonomy thresholds, selecting tools, and determining when human approval is required. Customer must maintain human oversight for workflows involving:
- financial transactions;
- employment decisions;
- legal decisions;
- safety-critical operations;
- production infrastructure;
- deletion or modification of important data.

---

### 5. Customer Data & Intellectual Property
Customer retains all rights in Customer Data. AgentFlow receives only a limited license to host, process, and transmit data to provide the Service, execute Agent instructions, operate Workflows, and maintain security. Customer outputs may be used by Customer subject to applicable laws and third-party terms.

---

### 6. Disclaimers & Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, AGENTFLOW IS PROVIDED "AS IS" AND "AS AVAILABLE". AGENTFLOW'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL NOT EXCEED AMOUNTS PAID BY CUSTOMER DURING THE 12-MONTH PERIOD PRECEDING THE CLAIM.`
  },
  {
    id: "doc-privacy-policy",
    name: "Enterprise Data Privacy Policy",
    category: "privacy_policy",
    title: "AgentFlow Enterprise Privacy Policy",
    version: "v1.0-GDPR-CCPA",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Enterprise privacy framework detailing account processing, prompt handling, agent memory, zero model-training retention, GDPR/CCPA data subject rights, and tenant isolation controls.",
    keyClauses: [
      {
        heading: "1. No Foundation Model Training on Customer Data",
        description: "AgentFlow will not use Customer Data (prompts, inputs, outputs, credentials, or internal documents) to train generalized foundation models without express written authorization.",
        importance: "critical"
      },
      {
        heading: "2. Encrypted Credential & OAuth Secret Handling",
        description: "OAuth tokens, API keys, and connection credentials are encrypted using industry-standard secret management and never exposed to ordinary prompt contexts.",
        importance: "critical"
      },
      {
        heading: "3. Data Subject Rights & Controller/Processor Roles",
        description: "For workspace data, Customer acts as the Data Controller and AgentFlow acts as the Data Processor under GDPR, CCPA, and applicable state privacy statutes.",
        importance: "high"
      },
      {
        heading: "4. Immutable Execution Logs & Audit Telemetry",
        description: "Agent execution timestamps, tool calls, token consumption, and security events are recorded for auditability and customer inspection.",
        importance: "standard"
      }
    ],
    content: `# AgentFlow Enterprise
## Privacy Policy
**Effective Date:** August 23, 2026  
**Last Updated:** August 23, 2026  

---

This Privacy Policy explains how **AgentFlow** ("AgentFlow," "we," "us," or "our") collects, uses, discloses, retains, and protects information when you use AgentFlow Enterprise, including its websites, applications, AI agents, workspaces, APIs, integrations, and related services.

---

### 1. Privacy Principles
- Collect only information reasonably necessary to provide and secure the Service;
- Process Customer Data strictly according to applicable contractual instructions;
- Maintain technical and organizational safeguards (RBAC, tenant isolation, encryption);
- Never use Customer Data to train generalized foundation models;
- Provide transparent subprocessor and third-party integration disclosures.

---

### 2. Information We Process
1. **Account & Organization:** Name, email, organization identifier, roles, permissions, billing metadata.
2. **Prompts & Inputs:** Instructions, uploaded files, documents, and code submitted to Agents.
3. **Agent Outputs & Memory:** Generated text, code, workflows, reports, and contextual task memory.
4. **Execution Telemetry & Audit Logs:** Tool invocations, timestamps, token usage, API request status, security events.
5. **Credentials:** OAuth tokens and API secrets stored in encrypted secret-management infrastructure.

---

### 3. AI Processing & Third-Party Models
Prompts and inputs may be transmitted to authorized model infrastructure (e.g. Gemini 3.7 Pro/Flash APIs) strictly for runtime inference. Customer Data is never retained for global model pre-training.

---

### 4. Data Subject Rights & International Transfers
Users in the EEA, UK, California, and other jurisdictions retain rights of access, rectification, erasure, portability, and restriction. Processing is backed by Standard Contractual Clauses (SCCs) and Data Processing Addendums.`
  },
  {
    id: "doc-aup",
    name: "Acceptable Use Policy (AUP)",
    category: "acceptable_use",
    title: "AgentFlow Enterprise Acceptable Use Policy",
    version: "v1.0",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Strict operational boundaries prohibiting unauthorized penetration testing, malware deployment, phishing, automated spam, prompt injection abuse, and multi-agent coordination attacks.",
    keyClauses: [
      {
        heading: "1. Prohibition on Unauthorized Cyber Activity",
        description: "Penetration testing, vulnerability scanning, and security audits are strictly limited to systems for which Customer has verifiable written authorization.",
        importance: "critical"
      },
      {
        heading: "2. Prompt Injection & Safeguard Circumvention",
        description: "Users must not attempt to bypass RBAC, defeat approval gates, disable audit logging, or manipulate agents to circumvent safety boundaries.",
        importance: "critical"
      },
      {
        heading: "3. Prohibited High-Risk Autonomous Control",
        description: "Autonomous agents must not be configured as sole decision-makers for life-critical, weapons, emergency services, or high-impact financial wire systems.",
        importance: "high"
      },
      {
        heading: "4. Multi-Agent Coordinated Abuse Ban",
        description: "Users are forbidden from distributing prohibited actions across multiple swarm agents to evade rate limits, audit checks, or platform safeguards.",
        importance: "high"
      }
    ],
    content: `# AgentFlow Enterprise
## Acceptable Use Policy (AUP)
**Effective Date:** August 23, 2026  

---

This Acceptable Use Policy ("AUP") governs prohibited and restricted uses of AgentFlow Enterprise. By accessing the Platform, Customer and all authorized users agree to comply with this AUP.

---

### 1. General Principles
- Use AgentFlow only for lawful, authorized purposes;
- Apply the principle of least privilege across all agent credentials;
- Maintain human oversight for all consequential actions;
- Immediately disable or restrict an Agent operating outside its authorized scope.

---

### 2. Strictly Prohibited Activities
1. **Unauthorized Access & Exploitation:** Bypassing authentication, stealing credentials, unauthorized penetration testing, deploying ransomware or wipers, or escalating privileges.
2. **Phishing & Deceptive Communications:** Automated impersonation, business email compromise, social engineering, or fraudulent customer support.
3. **Malicious Automation & Spam:** Mass unsolicited communications, automated harassment, artificial engagement manipulation.
4. **Prompt Injection & Safety Circumvention:** Manipulating agents to bypass authorization boundaries, expose secrets, or circumvent RBAC and approval gates.
5. **Weapons & Life-Critical Systems:** Autonomously controlling weapons, targeting systems, emergency life-support, or critical physical infrastructure.`
  },
  {
    id: "doc-safety-autonomy",
    name: "AI Agent Safety & Responsible Autonomy Agreement",
    category: "ai_ethics",
    title: "AI Agent Safety and Responsible Autonomy Agreement",
    version: "v1.0-SAFETY",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Framework for controlled agent autonomy tiers (Advisory, Assisted, Controlled, Autonomous), human-in-the-loop approval gates, emergency kill-switches, and runaway loop mitigations.",
    keyClauses: [
      {
        heading: "1. Fundamental Operating Principle",
        description: "An Agent may act only within the authority, permissions, tools, data, and autonomy boundaries established by the Customer.",
        importance: "critical"
      },
      {
        heading: "2. Four-Tier Autonomy Architecture",
        description: "Level 0 (Advisory), Level 1 (Assisted / Human Approval Required), Level 2 (Controlled / Pre-Approved Bounds), Level 3 (Autonomous / Bounded Execution), Level 4 (Restricted / High-Impact).",
        importance: "critical"
      },
      {
        heading: "3. Runaway Loop & Resource Consumption Limits",
        description: "Workflows must establish recursion limits, retry limits, token consumption budgets, and emergency shutdown mechanisms.",
        importance: "high"
      },
      {
        heading: "4. Human Override & Emergency Kill Switch",
        description: "Authorized administrators maintain instant capability to pause agents, reject pending actions, and revoke credentials.",
        importance: "high"
      }
    ],
    content: `# AgentFlow Enterprise
## AI Agent Safety and Responsible Autonomy Agreement
**Effective Date:** August 23, 2026  

---

This AI Agent Safety and Responsible Autonomy Agreement ("Safety Agreement") establishes the controls, responsibilities, and operating expectations for deploying autonomous AI agents through AgentFlow Enterprise.

---

### 1. Autonomy Tiers
- **Level 0 (Advisory):** Analysis and recommendations only; no external write executions.
- **Level 1 (Assisted):** Agent prepares actions; explicit human confirmation required before dispatch.
- **Level 2 (Controlled):** Autonomous execution restricted to pre-approved categories and safe parameters.
- **Level 3 (Autonomous):** Autonomous multi-step execution across authorized tools within configured spending and resource limits.
- **Level 4 (Restricted):** High-impact enterprise operations requiring dual-custody authorization.

---

### 2. Human-in-the-Loop & Approval Gates
Consequential actions (database migrations, financial disbursements, external mass dispatches, production code pushes) must enforce cryptographic approval gates requiring operator sign-off.

---

### 3. Runaway Prevention & Emergency Kill Switch
The platform enforces rate limits, execution timeouts, recursion counters, and an instant **Emergency Kill Switch** allowing operators to immediately suspend any runaway swarm or compromised workflow.`
  },
  {
    id: "doc-credential-auth",
    name: "Credential & Connected Service Authorization Agreement",
    category: "compliance",
    title: "Credential and Connected Service Authorization Agreement",
    version: "v1.0",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Terms governing third-party API keys, OAuth delegations (Google Drive, GitHub, Slack, Jira, Stripe), secret isolation, token rotation, and least-privilege scoping.",
    keyClauses: [
      {
        heading: "1. Lawful Authority & Delegation Scope",
        description: "Customer represents and warrants that it holds legitimate organizational authority to connect each credential and delegate actions to automated agents.",
        importance: "critical"
      },
      {
        heading: "2. Secrets Must Never Be Exposed in Prompts",
        description: "API keys, passwords, and private keys must be stored in encrypted secret vaults and never hardcoded into prompts or user instructions.",
        importance: "critical"
      },
      {
        heading: "3. Separation of Production & Development Credentials",
        description: "Experimental agents and testing workflows must utilize dedicated non-production credentials.",
        importance: "high"
      },
      {
        heading: "4. Rapid Credential Revocation Procedures",
        description: "Customers maintain the right and duty to rotate or revoke credentials immediately upon suspected compromise or user offboarding.",
        importance: "high"
      }
    ],
    content: `# AgentFlow Enterprise
## Credential and Connected Service Authorization Agreement
**Effective Date:** August 23, 2026  

---

This Agreement governs the connection, management, and delegation of credentials, authentication tokens, API keys, and Connected Services across AgentFlow Enterprise.

---

### 1. Scope & Authority
Customer authorizes AgentFlow to use connected credentials (OAuth tokens, API keys, database connection strings, webhook secrets) solely to execute customer-configured agent actions.

---

### 2. Least-Privilege & Secret Management
- Credentials must be scoped to the minimum required permissions (e.g. read-only wherever write is unnecessary);
- All secrets are stored using AES-256 encryption in tenant-isolated secret vaults;
- System instructions and user prompts are actively scanned to redact and block raw API keys from entering model contexts.

---

### 3. Emergency Revocation
Customers may instantly disconnect any integration or revoke OAuth delegations via the **Permissions & API Matrix** at any time.`
  },
  {
    id: "doc-high-risk-policy",
    name: "High-Risk & Restricted Use Policy",
    category: "compliance",
    title: "AgentFlow Enterprise High-Risk and Restricted Use Policy",
    version: "v1.0",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Safety standards categorizing Level 1 (Standard) through Level 4 (Critical) risks, restricting autonomous decision-making in healthcare, legal, finance, employment, and safety systems.",
    keyClauses: [
      {
        heading: "1. Four Risk Levels (Standard to Critical)",
        description: "Level 1 (Standard drafting/summarizing), Level 2 (Elevated customer comms/code), Level 3 (High-Risk production/finance), Level 4 (Critical life-safety/infrastructure).",
        importance: "critical"
      },
      {
        heading: "2. Healthcare & Medical Decision Restrictions",
        description: "Agents may assist with administrative documentation but must not act as autonomous decision-makers for medical diagnosis or clinical treatment.",
        importance: "critical"
      },
      {
        heading: "3. Regulated Employment & Hiring Decisions",
        description: "Agents must not be the sole decision-makers for hiring, firing, promotion, or compensation without meaningful human review.",
        importance: "high"
      },
      {
        heading: "4. Autonomous Financial Transactions Controls",
        description: "Material financial disbursements and trading operations require hard transaction caps, dual-signature approvals, and audit trails.",
        importance: "high"
      }
    ],
    content: `# AgentFlow Enterprise
## High-Risk and Restricted Use Policy
**Effective Date:** August 23, 2026  

---

This Policy establishes additional requirements for deploying AgentFlow in environments where an AI Agent's output or autonomous action could result in significant physical, financial, legal, employment, or privacy harm.

---

### 1. Risk Classification Matrix
- **Level 1 (Standard):** Low-consequence drafting, internal research, brainstorming, formatting.
- **Level 2 (Elevated):** Customer support, internal database querying, code generation, sales workflows.
- **Level 3 (High Risk):** Production infrastructure, financial transactions, employee evaluation, sensitive PII.
- **Level 4 (Critical):** Life-critical medical systems, emergency dispatch, aviation, weapons, critical infrastructure.

---

### 2. Mandatory Human Oversight Standard
For all Level 3 and Level 4 deployments, human review must be meaningful, qualified, and empowered with authority to reject, stop, or override agent recommendations before real-world execution.`
  },
  {
    id: "doc-dpa",
    name: "Data Processing Addendum (DPA)",
    category: "compliance",
    title: "AgentFlow Enterprise Data Processing Addendum (DPA)",
    version: "v1.0-GDPR-CCPA",
    effectiveDate: "2026-08-23",
    lastReviewed: "2026-08-23",
    status: "active",
    sourceType: "native_template",
    isAcceptedByCurrentUser: true,
    acceptedAt: "2026-08-23T10:00:00.000Z",
    summary: "Standard contractual data processing addendum pursuant to Article 28 GDPR, UK GDPR, and CCPA/CPRA, outlining subprocessor registers, technical security measures, breach notifications, and international transfer mechanisms.",
    keyClauses: [
      {
        heading: "1. Processor Obligations & Documented Instructions",
        description: "AgentFlow processes Customer Personal Data solely on documented instructions from the Customer to provide the Services, operate workflows, and maintain security.",
        importance: "critical"
      },
      {
        heading: "2. Technical & Organizational Security Measures",
        description: "Implementation of TLS 1.3 transit encryption, AES-256 rest encryption, role-based access control, tenant isolation, and vulnerability management.",
        importance: "critical"
      },
      {
        heading: "3. Subprocessor Authorization & Register",
        description: "Customer grants general authorization for verified infrastructure and AI model subprocessors with advance notice of material changes.",
        importance: "high"
      },
      {
        heading: "4. Security Incident Notification & Assistance",
        description: "AgentFlow commits to notifying Customer without undue delay upon confirming a Security Incident affecting Customer Personal Data.",
        importance: "high"
      }
    ],
    content: `# AgentFlow Enterprise
## Data Processing Addendum (DPA)
**Effective Date:** August 23, 2026  

---

This Data Processing Addendum ("DPA") governs the Processing of Personal Data by **AgentFlow** ("Processor") on behalf of **Customer** ("Controller") in connection with AgentFlow Enterprise.

---

### 1. Processing Scope & Roles
- **Customer as Controller:** Determines purposes, categories of personal data, and legal bases.
- **AgentFlow as Processor:** Processes data strictly in accordance with Customer's documented instructions to provide agent orchestration and workflow execution.

---

### 2. Security of Processing
AgentFlow maintains comprehensive administrative, physical, and technical measures including tenant cryptographic isolation, role-based access control, encrypted credential vaults, and continuous audit logging.

---

### 3. International Transfers & Subprocessors
Transfers from the EEA or UK rely upon Standard Contractual Clauses (SCCs) and UK IDTA addenda. Material subprocessors are maintained in an authoritative subprocessor register.`
  }
];
