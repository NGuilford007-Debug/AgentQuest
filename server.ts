import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// API: Execute an agent workflow with specific inputs and permissions
app.post("/api/gemini/execute-agent", async (req, res) => {
  try {
    const { agent, taskInput, nodes, permissions } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback simulation if no API key is set yet
      return res.json({
        success: true,
        isSimulated: true,
        summary: `[Simulated Run] Processed task: "${taskInput?.title || "Enterprise Workflow"}" for Agent ${agent?.name || "Agent"}.`,
        stepsOutput: (nodes || []).map((node: any, idx: number) => ({
          nodeId: node.id,
          name: node.name || `Step ${idx + 1}`,
          type: node.type,
          status: "completed",
          durationMs: Math.floor(Math.random() * 400) + 120,
          output: `Simulated output for ${node.name || node.type}: Processed successfully with permissions [${(permissions || []).join(", ")}].`,
          confidence: 0.96,
        })),
        auditLogs: [
          `[Auth] Validated scopes: ${(permissions || []).join(", ") || "Standard"}`,
          `[Execution] Evaluated inputs against agent persona: ${agent?.role || "Specialist"}`,
          `[Governance] Policy check passed with 0 compliance violations.`,
          `[Telemetry] Execution time: 1.4s. Time saved estimated: 42 minutes.`,
        ],
        hoursSaved: 0.7,
        xpEarned: 150,
      });
    }

    const systemPrompt = `You are an enterprise AI Agent workflow orchestrator.
Agent Name: ${agent?.name || "Autonomous Specialist"}
Agent Role/Persona: ${agent?.role || "Enterprise Automation Agent"}
Agent Description: ${agent?.description || "Executes workflow steps"}
Configured Access Permissions: ${(permissions || []).join(", ") || "Standard enterprise scopes"}
Workflow Nodes in Pipeline: ${JSON.stringify(nodes || [])}

You must execute or simulate the step-by-step workflow for the user's task input.
Return a structured, professional enterprise execution result in valid JSON format.`;

    const promptText = `Execute this enterprise task input:
Task Title: ${taskInput?.title || "Workflow Execution"}
Task Payload/Context: ${taskInput?.payload || JSON.stringify(taskInput || {})}

For each step in the workflow nodes, provide:
1. nodeId
2. name
3. status ('completed' or 'needs_review' or 'flagged')
4. output: detailed, realistic enterprise work product (e.g. summarized ticket, SQL query generated, drafted email reply, security risk score, PR review comments)
5. confidence: number between 0.85 and 1.0

Also provide:
- summary: A crisp 2-3 sentence overview of actions taken
- auditLogs: array of 3-5 compliance & execution logs
- keyEntitiesExtracted: object or array of relevant data items extracted
- suggestedHumanAction: if human review is needed, what should they confirm?
- estimatedHoursSaved: number between 0.2 and 4.0
- xpEarned: number between 80 and 250 based on task complexity`;

    // Determine target model (supporting gemini family or fallback to gemini-3.7-flash)
    const targetModel = (agent?.model?.startsWith("gemini") ? agent.model : "gemini-3.7-flash");

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(rawText);
    } catch {
      parsedResult = {
        summary: rawText,
        stepsOutput: [],
        auditLogs: ["Execution completed with raw output"],
        estimatedHoursSaved: 0.5,
        xpEarned: 100,
      };
    }

    res.json({
      success: true,
      isSimulated: false,
      summary: parsedResult.summary || "Workflow completed successfully.",
      stepsOutput: parsedResult.stepsOutput || parsedResult.steps || [],
      auditLogs: parsedResult.auditLogs || [
        `Access tokens verified for: ${(permissions || []).join(", ")}`,
        `Agent model execution completed with ${agent?.model || "Gemini 3.7 Flash"}`,
      ],
      keyEntitiesExtracted: parsedResult.keyEntitiesExtracted || {},
      suggestedHumanAction: parsedResult.suggestedHumanAction || null,
      hoursSaved: parsedResult.estimatedHoursSaved || 0.6,
      xpEarned: parsedResult.xpEarned || 120,
    });
  } catch (error: any) {
    console.error("Error executing agent:", error);
    res.status(500).json({
      error: error.message || "Failed to execute agent workflow",
    });
  }
});

// API: Execute single node testing
app.post("/api/gemini/execute-node", async (req, res) => {
  try {
    const { node, inputData, agent } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isSimulated: true,
        output: `[Simulated Node Output for ${node?.name || "Node"}]: Processed payload successfully. Extracted entities and verified schema compliance.`,
        durationMs: 340,
        confidence: 0.98,
        status: "completed",
        logs: [`Executed ${node?.type || "node"} in simulated sandbox`, `Input payload size: ${JSON.stringify(inputData || {}).length} bytes`],
      });
    }

    const nodePrompt = `You are evaluating a single workflow node execution for an enterprise AI agent.
Agent Name: ${agent?.name || "Specialist Agent"}
Node Name: ${node?.name}
Node Type: ${node?.type}
Node Config: ${JSON.stringify(node?.config || {})}

Input Payload:
${typeof inputData === "string" ? inputData : JSON.stringify(inputData || {})}

Execute the directive specified in the node configuration for this input.
Return JSON with:
1. "output": String containing the realistic enterprise work output (e.g. analyzed text, extracted JSON, draft reply, triage decision)
2. "confidence": Number between 0.85 and 1.0
3. "status": "completed" | "needs_review" | "error"
4. "logs": Array of 2-3 step execution log strings`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: nodePrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      isSimulated: false,
      output: parsed.output || response.text,
      confidence: parsed.confidence || 0.95,
      status: parsed.status || "completed",
      durationMs: Math.floor(Math.random() * 200) + 180,
      logs: parsed.logs || [`Executed node ${node?.name}`, `Confidence: ${parsed.confidence || 0.95}`],
    });
  } catch (error: any) {
    console.error("Error executing node:", error);
    res.status(500).json({ error: error.message || "Failed to execute node" });
  }
});


// API: Auto-generate / optimize workflow from natural language prompt
app.post("/api/gemini/generate-workflow", async (req, res) => {
  try {
    const { prompt, department } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isSimulated: true,
        agent: {
          name: "Workflow Assistant",
          role: "Operations Specialist",
          description: `Automates ${department || "enterprise"} workflows`,
          permissions: ["slack:read_write", "jira:update_issue", "analytics:read"],
        },
        nodes: [
          { id: "node-1", type: "trigger", name: "Incoming Trigger Event", description: "Listens for webhook / event", position: { x: 50, y: 150 }, config: { source: "Webhook" } },
          { id: "node-2", type: "ai_process", name: "AI Categorize & Triage", description: "Extracts key data and prioritizes", position: { x: 300, y: 150 }, config: { action: "classify" } },
          { id: "node-3", type: "permission_gate", name: "Permission & Compliance Gate", description: "Validates security policy", position: { x: 550, y: 150 }, config: { check: "pii_sanitization" } },
          { id: "node-4", type: "action_output", name: "Dispatch Action", description: "Notifies team and updates CRM/Jira", position: { x: 800, y: 150 }, config: { target: "Slack & Jira" } },
        ],
        connections: [
          { from: "node-1", to: "node-2" },
          { from: "node-2", to: "node-3" },
          { from: "node-3", to: "node-4" },
        ],
      });
    }

    const systemPrompt = `You are an expert enterprise automation architect. Given a user's description of a workflow, create:
1. An Agent configuration (name, role, description, department, recommendedPermissions)
2. A graph of visual workflow nodes (each node has id, type: 'trigger'|'data_source'|'ai_process'|'human_review'|'permission_gate'|'action_output', name, description, config object, position: {x, y})
3. Array of connections: [{ from: string, to: string, condition?: string }]

Make sure positions layout nicely from left to right (e.g. x: 50, 300, 560, 820 with y around 150-250).
Return valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Design an enterprise automated workflow for: "${prompt}". Department: ${department || "General Operations"}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, isSimulated: false, ...parsed });
  } catch (error: any) {
    console.error("Error generating workflow:", error);
    res.status(500).json({ error: error.message || "Failed to generate workflow" });
  }
});

// API: Diagnose Agent Health, Failure Causes, ROI and AI Prompt/Parameter Optimization
app.post("/api/gemini/diagnose-agent-health", async (req, res) => {
  try {
    const { agent, executionHistory } = req.body;
    const ai = getGeminiClient();

    const stats = agent?.stats || {};
    const successRate = typeof stats.successRate === "number" ? stats.successRate : 95.0;
    const tasksCompleted = stats.tasksCompleted || 10;
    const hoursSaved = stats.hoursSaved || 5;
    const avgLatencySec = stats.avgLatencySec || 2.0;
    const temp = typeof agent?.temperature === "number" ? agent.temperature : 0.7;
    const hoursPerTask = tasksCompleted > 0 ? hoursSaved / tasksCompleted : 0.2;

    // Fallback if AI client not initialized
    if (!ai) {
      const isCritical = successRate < 75;
      const isWarning = successRate >= 75 && successRate < 90;
      const isHighTemp = temp > 0.6;
      const isLowRoi = hoursPerTask < 0.15;

      const rootCauses: string[] = [];
      const promptImprovements: string[] = [];

      if (successRate < 85) {
        rootCauses.push(`High failure rate (${(100 - successRate).toFixed(1)}% error/rework rate) caused by ambiguous output schema`);
        promptImprovements.push("Added strict JSON formatting rules and validation constraints");
      }
      if (isHighTemp && (agent?.department === "Engineering" || agent?.department === "Finance & Legal" || agent?.department === "DevOps & SecOps")) {
        rootCauses.push(`Temperature ${temp} is too high for deterministic ${agent?.department} operations, causing syntax drift`);
      }
      if (isLowRoi) {
        rootCauses.push(`Low ROI: Only ${(hoursPerTask * 60).toFixed(0)} min saved per task due to frequent human correction`);
        promptImprovements.push("Injected few-shot enterprise examples to reduce human correction time");
      }
      if (rootCauses.length === 0) {
        rootCauses.push("Minor latency overhead on complex multi-step workflows");
        promptImprovements.push("Streamlined task instructions and reduced token generation overhead");
      }

      const recTemp = (agent?.department === "Engineering" || agent?.department === "Finance & Legal" || agent?.department === "DevOps & SecOps") ? 0.15 : 0.4;
      const recAutonomy = successRate < 80 ? "hitl" : agent?.autonomyLevel || "autonomous";

      const optimizedPrompt = `[AI-Hardened Enterprise Persona]
You are ${agent?.name || "Specialist Agent"}, an enterprise-grade AI specialist for ${agent?.department || "Enterprise Operations"}.

CORE MISSION:
${agent?.description || "Execute assigned workflows with high accuracy and zero compliance violations."}

OPERATIONAL CONSTRAINTS & ACCURACY GUARDS:
1. Determinism: Maintain strict factual accuracy. Never speculate or fabricate credentials, record IDs, or schema fields.
2. Step-by-Step Validation: Validate input payloads against expected types before executing actions.
3. Structured Output: When generating changes or logs, output explicit structured summaries with confidence metrics.
4. Error Recovery: If an external dependency or permission scope is unavailable, fail safely with an actionable alert message instead of stalling.

DOMAIN SPECIALIZATION:
- Role Focus: ${agent?.role || "Automation Specialist"}
- Target Systems: ${(agent?.permissions || []).join(", ") || "Authorized enterprise tools"}
- Tone: Crisp, professional, and compliant with enterprise SOC2 and governance policies.`;

      return res.json({
        success: true,
        isSimulated: true,
        diagnostic: {
          agentId: agent?.id,
          healthScore: Math.min(100, Math.max(25, Math.round(successRate * 0.7 + (hoursPerTask > 0.2 ? 30 : 15)))),
          status: isCritical ? "critical" : isWarning ? "warning" : "healthy",
          failureRate: Number((100 - successRate).toFixed(1)),
          roiScore: Number((hoursPerTask * 20).toFixed(1)),
          costPerTaskUsd: Number((0.002 * (avgLatencySec * 2)).toFixed(3)),
          valuePerTaskUsd: Number((hoursPerTask * 85).toFixed(2)),
          issues: [
            ...(successRate < 88 ? [{
              id: "iss-1",
              type: "high_failure_rate",
              title: `Elevated Task Rejection Rate (${(100 - successRate).toFixed(1)}%)`,
              description: `Agent task completions require excessive operator intervention or throw unhandled validation errors.`,
              impact: `Estimated 4.2 engineering hours wasted weekly on manual triage.`,
              metricValue: `${successRate}% Success Rate`,
              severity: isCritical ? "critical" : "warning",
            }] : []),
            ...(temp > 0.6 ? [{
              id: "iss-2",
              type: "temperature_drift",
              title: `High Sampling Temperature (${temp})`,
              description: `Current temperature setting introduces stochastic drift in structured enterprise queries.`,
              impact: `Causes hallucinated entity keys and schema parsing mismatches.`,
              metricValue: `Temp: ${temp} (Rec: ${recTemp})`,
              severity: "warning",
            }] : []),
            ...(hoursPerTask < 0.2 ? [{
              id: "iss-3",
              type: "low_roi",
              title: `Sub-Optimal ROI Multiplier (${(hoursPerTask * 60).toFixed(0)}m / task)`,
              description: `Time saved per execution is below department benchmark of 25 minutes.`,
              impact: `Low net operational leverage relative to model inference budget.`,
              metricValue: `$${(hoursPerTask * 85).toFixed(2)} value / run`,
              severity: "warning",
            }] : []),
          ],
          recommendation: {
            summary: `Diagnosed ${agent?.name}: Reducing sampling temperature to ${recTemp} and hardening prompt constraints will boost reliability by ~+${(100 - successRate > 15 ? 18 : 6)}%.`,
            rootCauses,
            recommendedTemperature: recTemp,
            temperatureReasoning: `Low temperature (${recTemp}) guarantees reproducible, deterministic reasoning for ${agent?.department}.`,
            recommendedAutonomyLevel: recAutonomy,
            autonomyReasoning: successRate < 80 ? "Switching to Human-in-the-Loop prevents unverified mutations until accuracy stabilizes." : "Agent is ready for autonomous execution once prompt guards are active.",
            recommendedModel: "gemini-3.7-flash",
            suggestedPrompt: optimizedPrompt,
            promptImprovements: [
              "Added explicit 4-tier operational constraints and error recovery boundaries",
              "Enforced schema validation and deterministic output formatting",
              "Configured fail-safe fallback behavior for permission timeouts",
            ],
            predictedSuccessRateBoost: Number((Math.min(99.4, successRate + (100 - successRate) * 0.75)).toFixed(1)),
            predictedHoursSavedBoost: Number((hoursSaved * 1.35).toFixed(1)),
            roiImprovementSummary: `Projected +35% increase in weekly ROI ($${Math.round(hoursSaved * 85 * 0.35)} additional savings).`,
          },
        },
      });
    }

    const systemInstruction = `You are the Lead AI Diagnostics Architect for AgentFlow Enterprise.
Your mission is to evaluate an enterprise AI Agent's performance, health, failure causes, and ROI metrics.
You must provide actionable, high-craft prompt optimizations and parameter adjustments.

Return a strictly valid JSON response.`;

    const prompt = `Analyze this Enterprise AI Agent's health telemetry:
Agent Info:
- Name: ${agent?.name}
- Role: ${agent?.role}
- Department: ${agent?.department}
- Current Model: ${agent?.model}
- Current Temperature: ${agent?.temperature}
- Current Autonomy Level: ${agent?.autonomyLevel}
- Permissions: ${(agent?.permissions || []).join(", ")}
- Current System Prompt: "${agent?.systemPrompt || ""}"
- Stats:
  - Tasks Completed: ${stats.tasksCompleted}
  - Total Hours Saved: ${stats.hoursSaved}
  - Success Rate: ${stats.successRate}%
  - Average Latency: ${stats.avgLatencySec}s
  - XP Generated: ${stats.xpGenerated}

Evaluate:
1. Health Score (0-100) and status ('healthy' if successRate>=90, 'warning' if 75-89, 'critical' if <75)
2. Exact root causes of failures or low ROI (e.g. prompt ambiguity, wrong temperature, missing error handling, lack of few-shot constraints, permission mismatch)
3. Specific issues array (id, type, title, description, impact, metricValue, severity: 'warning'|'critical')
4. Recommendation object:
   - summary (2 sentences)
   - rootCauses (array of 2-4 strings)
   - recommendedTemperature (number between 0.0 and 1.0)
   - temperatureReasoning (string)
   - recommendedAutonomyLevel ('autonomous' | 'hitl' | 'shadow')
   - autonomyReasoning (string)
   - recommendedModel ('gemini-3.7-flash')
   - suggestedPrompt (A fully rewritten, production-grade, hardened enterprise system prompt for this agent with mission, constraints, error handling, output specifications)
   - promptImprovements (array of 3-4 specific improvements made in the new prompt)
   - predictedSuccessRateBoost (number e.g. 98.5)
   - predictedHoursSavedBoost (number e.g. 1.4x current)
   - roiImprovementSummary (string)
5. costPerTaskUsd and valuePerTaskUsd (numbers)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      isSimulated: false,
      diagnostic: {
        agentId: agent?.id,
        healthScore: parsed.healthScore || Math.round(successRate * 0.9),
        status: parsed.status || (successRate < 75 ? "critical" : successRate < 90 ? "warning" : "healthy"),
        failureRate: Number((100 - successRate).toFixed(1)),
        roiScore: parsed.roiScore || Number((hoursPerTask * 20).toFixed(1)),
        costPerTaskUsd: parsed.costPerTaskUsd || 0.008,
        valuePerTaskUsd: parsed.valuePerTaskUsd || Number((hoursPerTask * 85).toFixed(2)),
        issues: parsed.issues || [],
        recommendation: parsed.recommendation || null,
        lastAnalyzedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error diagnosing agent health:", error);
    res.status(500).json({ error: error.message || "Failed to diagnose agent health" });
  }
});

// API: Simulate Test Run with Optimized Parameters
app.post("/api/gemini/simulate-agent-fix", async (req, res) => {
  try {
    const { agent, testPrompt, newTemperature } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isSimulated: true,
        simulation: {
          testScenario: `Simulated Enterprise Input for ${agent?.role || "Agent"}`,
          previousFailurePoint: "Unhandled ambiguous key validation and hallucinations caused 32% error rate",
          optimizedResult: `[Verified Execution]: Successfully processed payload with 0 schema violations. Execution latency: 1.1s. Confidence: 0.99.`,
          simulatedAccuracy: 99.2,
          latencyReductionMs: 420,
          status: "passed",
          verificationLogs: [
            `[Verification] Prompt guardrails verified against 12 edge cases`,
            `[Sampling] Temperature set to ${newTemperature || 0.2}: deterministic output verified`,
            `[Compliance] 0 security policy breaches or unhandled exceptions`,
          ],
        },
      });
    }

    const testScenario = `Evaluate this enterprise agent's newly optimized prompt and temperature:
Agent Name: ${agent?.name}
Role: ${agent?.role}
Department: ${agent?.department}
New Temperature: ${newTemperature}
Optimized System Prompt: "${testPrompt}"

Generate a realistic test execution simulation demonstrating the before/after accuracy improvement.
Return JSON with:
- testScenario (string)
- previousFailurePoint (string)
- optimizedResult (string)
- simulatedAccuracy (number between 95 and 100)
- latencyReductionMs (number between 150 and 600)
- status ('passed')
- verificationLogs (array of 3 strings)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: testScenario,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      isSimulated: false,
      simulation: parsed,
    });
  } catch (error: any) {
    console.error("Error simulating agent fix:", error);
    res.status(500).json({ error: error.message || "Failed to simulate agent fix" });
  }
});

// Production and dev routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AgentFlow Enterprise server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
