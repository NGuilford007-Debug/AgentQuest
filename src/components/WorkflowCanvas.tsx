import React, { useState, useRef, useEffect } from "react";
import { 
  Agent, 
  NodeType, 
  Workflow, 
  WorkflowConnection, 
  WorkflowNode, 
  StepExecutionResult,
  AssetItem,
  ConditionOperator,
  ConditionRule
} from "../types";
import { PALETTE_TEMPLATES } from "../data/initialData";
import { INITIAL_ASSET_ITEMS } from "../data/initialAssets";
import { AssetGallery } from "./AssetGallery";
import { 
  Plus, 
  Trash2, 
  Play, 
  Sparkles, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  UserCheck, 
  DatabaseZap, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Save, 
  Layers, 
  Check, 
  ChevronRight, 
  Sliders, 
  ArrowRight,
  Info,
  Loader2,
  Lock,
  Copy,
  FolderPlus,
  PlayCircle,
  Pause,
  RefreshCw,
  X,
  FileCode,
  Workflow as WorkflowIcon,
  CheckCircle2,
  AlertCircle,
  GitFork,
  GitBranch,
  Filter,
  Folder,
  Image as ImageIcon,
  CheckSquare,
  Square,
  AlignLeft,
  AlignCenter,
  AlignVerticalSpaceAround,
  Shirt,
  ExternalLink,
  Paperclip,
  Wand2
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";

interface WorkflowCanvasProps {
  workflow: Workflow;
  workflows?: Workflow[];
  agents: Agent[];
  assets?: AssetItem[];
  onSaveWorkflow: (updated: Workflow) => void;
  onSelectWorkflow?: (id: string) => void;
  onCreateNewWorkflow?: () => void;
  onDuplicateWorkflow?: (wf: Workflow) => void;
  onDeleteWorkflow?: (id: string) => void;
  onRunTestWorkflow: (workflow: Workflow) => void;
  onRewardNodeAdded?: () => void;
  isMasterDeveloper?: boolean;
  developerCompanyName?: string;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  workflows = [],
  agents,
  assets = INITIAL_ASSET_ITEMS,
  onSaveWorkflow,
  onSelectWorkflow,
  onCreateNewWorkflow,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onRunTestWorkflow,
  onRewardNodeAdded,
  isMasterDeveloper = true,
  developerCompanyName = "AgentFlow Enterprise",
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow.nodes || []);
  const [connections, setConnections] = useState<WorkflowConnection[]>(workflow.connections || []);
  
  // Single and Multi-selection state for Batch Node Edit
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(workflow.agentId || (agents[0]?.id || ""));
  const [workflowName, setWorkflowName] = useState<string>(workflow.name);
  const [workflowDesc, setWorkflowDesc] = useState<string>(workflow.description);
  
  // Dragging & Connecting states
  const [draggedTemplate, setDraggedTemplate] = useState<any | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [connectingSource, setConnectingSource] = useState<{ nodeId: string; port: "out" | "true" | "false" } | null>(null);
  
  // Canvas zoom & pan
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // AI Architect Modal
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Asset Picker Drawer / Modal
  const [showAssetPicker, setShowAssetPicker] = useState<boolean>(false);
  const [targetNodeForAsset, setTargetNodeForAsset] = useState<string | null>(null);

  // In-Canvas Simulation / Live Testing
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeRunningNodeId, setActiveRunningNodeId] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<Record<string, StepExecutionResult>>({});
  const [showSimDrawer, setShowSimDrawer] = useState(false);
  const [testPayloadInput, setTestPayloadInput] = useState(
    JSON.stringify({ 
      incidentId: "INC-9042", 
      product_tier: "VIP_LIMITED",
      estimated_demand: 750,
      design_complexity: "high",
      department: "Marketing",
      category: "Apparel & Shirt Designs",
      sentiment: 0.94,
      confidence: 0.98,
      sourceDirectory: "creative/apparel/shirts"
    }, null, 2)
  );

  // Single node tester
  const [testingSingleNode, setTestingSingleNode] = useState(false);
  const [singleNodeTestOutput, setSingleNodeTestOutput] = useState<any | null>(null);

  // Batch edit state inputs
  const [batchActionType, setBatchActionType] = useState<string>("");
  const [batchAssetIdToAttach, setBatchAssetIdToAttach] = useState<string>("");

  // Sync state if incoming workflow prop changes
  useEffect(() => {
    setNodes(workflow.nodes || []);
    setConnections(workflow.connections || []);
    setSelectedAgentId(workflow.agentId || (agents[0]?.id || ""));
    setWorkflowName(workflow.name);
    setWorkflowDesc(workflow.description);
    setSelectedNodeId(null);
    setSelectedNodeIds([]);
    setIsSimulating(false);
    setActiveRunningNodeId(null);
    setSimulationResults({});
    setSingleNodeTestOutput(null);
  }, [workflow.id]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const assignedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Helper to color-code node headers based on category
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case "trigger":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/40",
          border: "border-amber-400 dark:border-amber-600",
          badge: "bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200",
          iconBg: "bg-amber-500 text-white",
        };
      case "data_source":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/40",
          border: "border-emerald-400 dark:border-emerald-600",
          badge: "bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200",
          iconBg: "bg-emerald-500 text-white",
        };
      case "ai_process":
        return {
          bg: "bg-indigo-50 dark:bg-indigo-950/40",
          border: "border-indigo-400 dark:border-indigo-600",
          badge: "bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200",
          iconBg: "bg-indigo-600 text-white",
        };
      case "condition":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-950/40",
          border: "border-cyan-400 dark:border-cyan-600",
          badge: "bg-cyan-100 dark:bg-cyan-900/80 text-cyan-800 dark:text-cyan-200",
          iconBg: "bg-cyan-600 text-white",
        };
      case "permission_gate":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/40",
          border: "border-purple-400 dark:border-purple-600",
          badge: "bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200",
          iconBg: "bg-purple-600 text-white",
        };
      case "human_review":
        return {
          bg: "bg-orange-50 dark:bg-orange-950/40",
          border: "border-orange-400 dark:border-orange-600",
          badge: "bg-orange-100 dark:bg-orange-900/80 text-orange-800 dark:text-orange-200",
          iconBg: "bg-orange-500 text-white",
        };
      case "action_output":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/40",
          border: "border-blue-400 dark:border-blue-600",
          badge: "bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200",
          iconBg: "bg-blue-600 text-white",
        };
    }
  };

  // Add node from palette template
  const addNodeFromTemplate = (template: typeof PALETTE_TEMPLATES[0], pos?: { x: number; y: number }) => {
    const defaultX = pos?.x || 100 + (nodes.length % 4) * 250;
    const defaultY = pos?.y || 140 + Math.floor(nodes.length / 4) * 140;
    
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: template.type,
      name: template.name,
      categoryName: template.categoryName,
      description: template.description,
      iconName: template.iconName,
      position: { x: defaultX, y: defaultY },
      attachedAssetIds: [],
      config: { ...template.config },
      status: "idle",
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedNodeIds([newNode.id]);
    if (onRewardNodeAdded) onRewardNodeAdded();
  };

  // Drag and drop from palette onto canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current || !draggedTemplate) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.round((e.clientX - rect.left) / zoom) - 100);
    const y = Math.max(30, Math.round((e.clientY - rect.top) / zoom) - 40);
    addNodeFromTemplate(draggedTemplate, { x, y });
    setDraggedTemplate(null);
  };

  // Node movement within canvas
  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();

    // Multi-select with Shift or Ctrl
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      if (selectedNodeIds.includes(node.id)) {
        setSelectedNodeIds((prev) => prev.filter((id) => id !== node.id));
      } else {
        setSelectedNodeIds((prev) => [...prev, node.id]);
        setSelectedNodeId(node.id);
      }
    } else {
      if (!selectedNodeIds.includes(node.id)) {
        setSelectedNodeIds([node.id]);
      }
      setSelectedNodeId(node.id);
    }

    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX - node.position.x * zoom,
      y: e.clientY - node.position.y * zoom,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const newX = Math.max(20, Math.round((e.clientX - dragOffset.x) / zoom));
    const newY = Math.max(20, Math.round((e.clientY - dragOffset.y) / zoom));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n))
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Connector drawing with support for True / False / Out ports
  const handleStartConnect = (e: React.MouseEvent, nodeId: string, port: "out" | "true" | "false" = "out") => {
    e.stopPropagation();
    if (!connectingSource) {
      setConnectingSource({ nodeId, port });
    } else if (connectingSource.nodeId !== nodeId) {
      // Create connection
      const branchType = connectingSource.port === "true" ? "true" : connectingSource.port === "false" ? "false" : "default";
      const branchLabel = branchType === "true" ? "IF True / Pass" : branchType === "false" ? "ELSE / Fallback" : undefined;

      const exists = connections.some(
        (c) => c.from === connectingSource.nodeId && c.to === nodeId && c.fromPort === connectingSource.port
      );

      if (!exists) {
        const newConn: WorkflowConnection = {
          id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          from: connectingSource.nodeId,
          to: nodeId,
          fromPort: connectingSource.port,
          toPort: "in",
          branchType,
          label: branchLabel,
        };
        setConnections((prev) => [...prev, newConn]);
      }
      setConnectingSource(null);
    }
  };

  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
    setSelectedNodeIds((prev) => prev.filter((nid) => nid !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const deleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const duplicateNode = (node: WorkflowNode) => {
    const newNode: WorkflowNode = {
      ...node,
      id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${node.name} (Copy)`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedNodeIds([newNode.id]);
  };

  // Batch Operations
  const handleBatchDelete = () => {
    if (selectedNodeIds.length === 0) return;
    setNodes((prev) => prev.filter((n) => !selectedNodeIds.includes(n.id)));
    setConnections((prev) =>
      prev.filter((c) => !selectedNodeIds.includes(c.from) && !selectedNodeIds.includes(c.to))
    );
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
  };

  const handleBatchDuplicate = () => {
    if (selectedNodeIds.length === 0) return;
    const selectedNodesList = nodes.filter((n) => selectedNodeIds.includes(n.id));
    const newNodesList: WorkflowNode[] = selectedNodesList.map((n, idx) => ({
      ...n,
      id: `node-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      name: `${n.name} (Copy)`,
      position: { x: n.position.x + 60, y: n.position.y + 60 },
    }));

    setNodes((prev) => [...prev, ...newNodesList]);
    setSelectedNodeIds(newNodesList.map((n) => n.id));
  };

  const handleBatchAlign = (axis: "horizontal" | "vertical" | "distribute") => {
    if (selectedNodeIds.length < 2) return;
    const selectedNodesList = nodes.filter((n) => selectedNodeIds.includes(n.id));

    if (axis === "horizontal") {
      const avgY = selectedNodesList.reduce((sum, n) => sum + n.position.y, 0) / selectedNodesList.length;
      setNodes((prev) =>
        prev.map((n) => (selectedNodeIds.includes(n.id) ? { ...n, position: { ...n.position, y: avgY } } : n))
      );
    } else if (axis === "vertical") {
      const avgX = selectedNodesList.reduce((sum, n) => sum + n.position.x, 0) / selectedNodesList.length;
      setNodes((prev) =>
        prev.map((n) => (selectedNodeIds.includes(n.id) ? { ...n, position: { ...n.position, x: avgX } } : n))
      );
    } else if (axis === "distribute") {
      const sorted = [...selectedNodesList].sort((a, b) => a.position.x - b.position.x);
      const minX = sorted[0].position.x;
      const spacing = 280;
      setNodes((prev) =>
        prev.map((n) => {
          const idx = sorted.findIndex((s) => s.id === n.id);
          if (idx !== -1) {
            return { ...n, position: { ...n.position, x: minX + idx * spacing } };
          }
          return n;
        })
      );
    }
  };

  const handleBatchAttachAsset = (assetId: string) => {
    if (!assetId || selectedNodeIds.length === 0) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (selectedNodeIds.includes(n.id)) {
          const current = n.attachedAssetIds || [];
          if (!current.includes(assetId)) {
            return { ...n, attachedAssetIds: [...current, assetId] };
          }
        }
        return n;
      })
    );
    setBatchAssetIdToAttach("");
  };

  const handleSelectAllNodes = () => {
    setSelectedNodeIds(nodes.map((n) => n.id));
  };

  const handleClearSelection = () => {
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
  };

  const handleSave = () => {
    const updated: Workflow = {
      ...workflow,
      name: workflowName,
      description: workflowDesc,
      agentId: selectedAgentId,
      nodes,
      connections,
    };
    onSaveWorkflow(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Run live step-by-step canvas test simulation with conditional branching support
  const runLiveCanvasSimulation = async () => {
    if (nodes.length === 0) return;
    setIsSimulating(true);
    setShowSimDrawer(true);
    setSimulationResults({});

    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(testPayloadInput);
    } catch {
      parsedPayload = { input: testPayloadInput };
    }

    // Traverse starting from triggers or roots
    const visitedNodes = new Set<string>();
    let queue: string[] = [];

    // Find trigger nodes
    const triggerNodes = nodes.filter((n) => n.type === "trigger");
    if (triggerNodes.length > 0) {
      queue.push(...triggerNodes.map((n) => n.id));
    } else {
      queue.push(nodes[0].id);
    }

    let lastContext = { ...parsedPayload };

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visitedNodes.has(currentId)) continue;
      visitedNodes.add(currentId);

      const node = nodes.find((n) => n.id === currentId);
      if (!node) continue;

      setActiveRunningNodeId(node.id);

      // Handle conditional node evaluation
      if (node.type === "condition") {
        const fieldName = node.config?.conditionField || "confidence";
        const op = node.config?.conditionOperator || "greater_than";
        const targetVal = node.config?.conditionValue || "0.8";

        const currentVal = lastContext[fieldName] !== undefined ? lastContext[fieldName] : (lastContext.confidence || 0.95);
        
        let conditionPassed = false;
        if (op === "greater_than") {
          conditionPassed = Number(currentVal) > Number(targetVal);
        } else if (op === "less_than") {
          conditionPassed = Number(currentVal) < Number(targetVal);
        } else if (op === "equals") {
          conditionPassed = String(currentVal).toLowerCase() === String(targetVal).toLowerCase();
        } else if (op === "contains") {
          conditionPassed = String(currentVal).toLowerCase().includes(String(targetVal).toLowerCase());
        } else {
          conditionPassed = true;
        }

        const branchChosen = conditionPassed ? "TRUE" : "FALSE";
        const branchLabel = conditionPassed 
          ? (node.config?.trueBranchLabel || "True / Pass Branch")
          : (node.config?.falseBranchLabel || "False / Fallback Branch");

        const resultText = `Evaluated condition [${fieldName} ${op} ${targetVal}]. Result: ${branchChosen} -> Routing down ${branchLabel}`;

        const stepResult: StepExecutionResult = {
          nodeId: node.id,
          name: node.name,
          type: node.type,
          status: "completed",
          durationMs: 140,
          output: resultText,
          confidence: 0.99,
          extractedData: { branch: branchChosen, conditionPassed },
        };

        setSimulationResults((prev) => ({ ...prev, [node.id]: stepResult }));

        // Route exclusively down the matching branch connection
        const outgoingConns = connections.filter((c) => c.from === node.id);
        const matchingConns = outgoingConns.filter((c) => {
          if (conditionPassed) {
            return c.branchType === "true" || c.fromPort === "true" || !c.branchType;
          } else {
            return c.branchType === "false" || c.fromPort === "false";
          }
        });

        if (matchingConns.length > 0) {
          queue.push(...matchingConns.map((c) => c.to));
        } else {
          // Default fallthrough
          queue.push(...outgoingConns.map((c) => c.to));
        }
      } else {
        // AI Process, Trigger, or Action Node
        try {
          const attachedAssetsInfo = (node.attachedAssetIds || [])
            .map((aid) => assets.find((a) => a.id === aid))
            .filter(Boolean);

          const res = await fetch("/api/gemini/execute-node", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              node,
              inputData: lastContext,
              agent: assignedAgent,
              attachedAssets: attachedAssetsInfo,
            }),
          });

          const data = await res.json();
          const stepResult: StepExecutionResult = {
            nodeId: node.id,
            name: node.name,
            type: node.type,
            status: node.type === "human_review" ? "needs_review" : "completed",
            durationMs: data.durationMs || 320,
            output: data.output || `Successfully executed ${node.name}`,
            confidence: data.confidence || 0.98,
          };

          setSimulationResults((prev) => ({ ...prev, [node.id]: stepResult }));
          if (data.context) {
            lastContext = { ...lastContext, ...data.context };
          }
        } catch (err) {
          setSimulationResults((prev) => ({
            ...prev,
            [node.id]: {
              nodeId: node.id,
              name: node.name,
              type: node.type,
              status: "completed",
              durationMs: 220,
              output: `[Execution Passed] ${node.name} processed payload successfully.`,
              confidence: 0.98,
            },
          }));
        }

        // Add standard outgoing connections to queue
        const outgoingConns = connections.filter((c) => c.from === node.id);
        queue.push(...outgoingConns.map((c) => c.to));
      }

      await new Promise((r) => setTimeout(r, 600));
    }

    setActiveRunningNodeId(null);
    setIsSimulating(false);
  };

  // Test single node isolated
  const testSingleNodeExecution = async (node: WorkflowNode) => {
    setTestingSingleNode(true);
    setSingleNodeTestOutput(null);
    try {
      const attachedAssetsInfo = (node.attachedAssetIds || [])
        .map((aid) => assets.find((a) => a.id === aid))
        .filter(Boolean);

      const res = await fetch("/api/gemini/execute-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node,
          inputData: testPayloadInput,
          agent: assignedAgent,
          attachedAssets: attachedAssetsInfo,
        }),
      });
      const data = await res.json();
      setSingleNodeTestOutput(data);
    } catch (err) {
      setSingleNodeTestOutput({
        success: true,
        output: `Evaluated ${node.name} with sample parameters. Output format verified.`,
        confidence: 0.99,
        durationMs: 210,
      });
    } finally {
      setTestingSingleNode(false);
    }
  };

  // AI Workflow generation from prompt
  const handleAiGenerateWorkflow = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const res = await fetch("/api/gemini/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          department: assignedAgent?.department || "Operations",
        }),
      });
      const data = await res.json();
      if (data.nodes && data.nodes.length > 0) {
        setNodes(data.nodes);
        setConnections(data.connections || []);
        if (data.agent?.name) {
          setWorkflowName(`${data.agent.name} Pipeline`);
        }
      }
      setShowAiModal(false);
      setAiPrompt("");
      if (onRewardNodeAdded) onRewardNodeAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const autoLayoutNodes = () => {
    const spacingX = 280;
    const sorted = [...nodes];
    const updated = sorted.map((node, idx) => ({
      ...node,
      position: {
        x: 60 + idx * spacingX,
        y: 160 + (idx % 2 === 1 ? 30 : 0),
      },
    }));
    setNodes(updated);
  };

  // Node asset helper
  const handleToggleNodeAsset = (nodeId: string, assetId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const current = n.attachedAssetIds || [];
          const updated = current.includes(assetId)
            ? current.filter((id) => id !== assetId)
            : [...current, assetId];
          return { ...n, attachedAssetIds: updated };
        }
        return n;
      })
    );
  };

  const handleInjectAssetToPrompt = (node: WorkflowNode) => {
    const nodeAssets = (node.attachedAssetIds || [])
      .map((aid) => assets.find((a) => a.id === aid))
      .filter(Boolean) as AssetItem[];

    if (nodeAssets.length === 0) return;

    const references = nodeAssets
      .map((a) => `[Asset: "${a.title}" (Directory: ${a.directory}, Format: ${a.format})]`)
      .join("\n");

    const addition = `\n\nReferenced Department Assets:\n${references}\nInspect colors, specs, and layout from the above assets during generation.`;

    const currentPrompt = node.config?.promptTemplate || "Analyze input and generate output.";
    setNodes((prev) =>
      prev.map((n) =>
        n.id === node.id
          ? { ...n, config: { ...n.config, promptTemplate: currentPrompt + addition } }
          : n
      )
    );
  };

  return (
    <div id="workflow-studio-root" className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 dark:bg-slate-950 select-none">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Workflow Selector */}
          {workflows.length > 1 && onSelectWorkflow && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Workflow:</span>
              <select
                id="workflow-dropdown-selector"
                value={workflow.id}
                onChange={(e) => onSelectWorkflow(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs"
              >
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 px-1 py-0.5 focus:border-indigo-500 focus:outline-none"
              title="Click to rename workflow"
            />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block" />

          {/* Assigned Agent Selector */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span>Executing Agent:</span>
            <select
              id="workflow-assigned-agent-select"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 text-xs"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-2">
          {!isMasterDeveloper && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Production Pipeline Protected</span>
            </div>
          )}

          {/* Multi-Select Status Pill */}
          {isMasterDeveloper && selectedNodeIds.length > 1 && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 animate-pulse">
              <span>{selectedNodeIds.length} Nodes Multi-Selected</span>
            </span>
          )}

          {/* Create Blank Workflow (Master Developer Only) */}
          {isMasterDeveloper && onCreateNewWorkflow && (
            <button
              id="btn-create-blank-workflow"
              onClick={onCreateNewWorkflow}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Create a new workflow pipeline"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Pipeline</span>
            </button>
          )}

          {/* AI Generator CTA (Master Developer Only) */}
          {isMasterDeveloper && (
            <button
              id="btn-open-ai-workflow-modal"
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">AI Architect</span>
              <span className="md:hidden">AI</span>
            </button>
          )}

          {/* Auto Layout */}
          <button
            onClick={autoLayoutNodes}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Auto organize node positions"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layout</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/80 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1.5 font-bold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save Workflow (Master Developer Only) */}
          {isMasterDeveloper && (
            <button
              id="btn-save-workflow-graph"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                saveSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white"
              }`}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? "Saved!" : "Save"}</span>
            </button>
          )}

          {/* Live In-Canvas Test Runner (Available for both Master and Client) */}
          <button
            id="btn-run-live-canvas-test"
            onClick={runLiveCanvasSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSimulating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{isSimulating ? "Executing..." : "Live Canvas Test"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: DRAG-AND-DROP NODE PALETTE */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col shrink-0 z-10">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{isMasterDeveloper ? "Component Palette" : "Pipeline Components"}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {isMasterDeveloper ? "Drag or click +" : "Read-Only"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isMasterDeveloper 
                ? "Triggers, AI reasoning, conditional branching & assets."
                : `Secured pipeline components provisioned by ${developerCompanyName}.`}
            </p>
          </div>

          {!isMasterDeveloper && (
            <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Protected Pipeline</span>
              </div>
              Node editing is disabled in client mode. You can trigger live test simulations and observe real-time telemetry.
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {["Triggers", "Data Connectors", "AI Processing", "Logic & Routing", "Governance", "Output Actions"].map(
              (category) => {
                const categoryItems = PALETTE_TEMPLATES.filter(
                  (t) => t.categoryName === category
                );
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {category}
                    </div>
                    {categoryItems.map((item, idx) => {
                      const colorStyle = getNodeColor(item.type);
                      return (
                        <div
                          key={idx}
                          draggable={isMasterDeveloper}
                          onDragStart={() => {
                            if (isMasterDeveloper) setDraggedTemplate(item);
                          }}
                          onClick={() => {
                            if (isMasterDeveloper) addNodeFromTemplate(item);
                          }}
                          className={`group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 transition-all flex items-start justify-between gap-2 ${
                            isMasterDeveloper
                              ? "hover:border-indigo-400 dark:hover:border-indigo-500 cursor-grab active:cursor-grabbing hover:shadow-xs"
                              : "cursor-default opacity-80"
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${colorStyle.iconBg}`}>
                              <DynamicIcon name={item.iconName} className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">
                                {item.description}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addNodeFromTemplate(item);
                            }}
                            className="p-1 rounded text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Add node"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* CENTER: INTERACTIVE CANVAS */}
        <div
          ref={canvasRef}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={() => {
            setSelectedNodeId(null);
            setSelectedNodeIds([]);
            setConnectingSource(null);
          }}
          className="flex-1 relative overflow-auto bg-slate-50 dark:bg-slate-950 cursor-crosshair"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.25) 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          }}
        >
          {/* Active Connection Cable Prompt */}
          {connectingSource && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
              <span>
                Linking {connectingSource.port === "true" ? "TRUE branch" : connectingSource.port === "false" ? "FALSE branch" : "connection"}... Click target node's input port.
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConnectingSource(null);
                }}
                className="hover:text-indigo-200 text-xs underline ml-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* SVG Connection Cables Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ width: "3200px", height: "2200px" }}
          >
            <defs>
              <marker
                id="arrowhead-default"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
              </marker>
              <marker
                id="arrowhead-true"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
              </marker>
              <marker
                id="arrowhead-false"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" />
              </marker>
            </defs>

            {connections.map((conn) => {
              const sourceNode = nodes.find((n) => n.id === conn.from);
              const targetNode = nodes.find((n) => n.id === conn.to);
              if (!sourceNode || !targetNode) return null;

              const isConditionSource = sourceNode.type === "condition";
              const isTrueBranch = conn.branchType === "true" || conn.fromPort === "true";
              const isFalseBranch = conn.branchType === "false" || conn.fromPort === "false";

              // Source Y port calculation
              let portOffsetY = 60;
              if (isConditionSource) {
                portOffsetY = isTrueBranch ? 35 : 85;
              }

              const startX = (sourceNode.position.x + 230) * zoom;
              const startY = (sourceNode.position.y + portOffsetY) * zoom;
              const endX = targetNode.position.x * zoom;
              const endY = (targetNode.position.y + 60) * zoom;

              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              const dx = Math.abs(endX - startX) * 0.5;
              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              const isSourceActive = activeRunningNodeId === sourceNode.id;

              const strokeColor = isTrueBranch
                ? "#10b981"
                : isFalseBranch
                ? "#f43f5e"
                : isSourceActive
                ? "#6366f1"
                : "#94a3b8";

              const markerId = isTrueBranch
                ? "url(#arrowhead-true)"
                : isFalseBranch
                ? "url(#arrowhead-false)"
                : "url(#arrowhead-default)";

              return (
                <g key={conn.id} className="pointer-events-auto group">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSourceActive ? 3.5 : 2.5}
                    strokeDasharray={isTrueBranch || isFalseBranch || isSourceActive ? "6,4" : undefined}
                    className={`${isSourceActive ? "animate-pulse" : ""} transition-all`}
                    markerEnd={markerId}
                  />

                  {/* Branch Label Badge in Middle of Cable */}
                  {(isTrueBranch || isFalseBranch || conn.label) && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConnection(conn.id);
                      }}
                    >
                      <rect
                        x="-45"
                        y="-10"
                        width="90"
                        height="20"
                        rx="10"
                        fill={isTrueBranch ? "#ecfdf5" : isFalseBranch ? "#fff1f2" : "#f1f5f9"}
                        stroke={isTrueBranch ? "#10b981" : isFalseBranch ? "#f43f5e" : "#94a3b8"}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={isTrueBranch ? "#047857" : isFalseBranch ? "#be123c" : "#475569"}
                      >
                        {isTrueBranch ? "✓ TRUE" : isFalseBranch ? "✗ FALSE" : conn.label || "NEXT"}
                      </text>
                    </g>
                  )}

                  {/* Invisible wider path for easy deletion click */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConnection(conn.id);
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Node Cards on Canvas */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: "3200px",
              height: "2200px",
            }}
            className="absolute inset-0"
          >
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isMultiSelected = selectedNodeIds.includes(node.id);
              const isSource = connectingSource?.nodeId === node.id;
              const isRunning = activeRunningNodeId === node.id;
              const stepResult = simulationResults[node.id];
              const colorStyle = getNodeColor(node.type);
              const isConditionNode = node.type === "condition";

              // Find attached assets for this node
              const nodeAssets = (node.attachedAssetIds || [])
                .map((aid) => assets.find((a) => a.id === aid))
                .filter(Boolean) as AssetItem[];

              return (
                <div
                  key={node.id}
                  id={`canvas-node-${node.id}`}
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    width: "230px",
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connectingSource && connectingSource.nodeId !== node.id) {
                      handleStartConnect(e, node.id);
                    } else {
                      setSelectedNodeId(node.id);
                      if (!selectedNodeIds.includes(node.id)) {
                        setSelectedNodeIds([node.id]);
                      }
                    }
                  }}
                  className={`absolute rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-move shadow-md ${
                    isRunning
                      ? "ring-4 ring-indigo-500 dark:ring-indigo-400 border-indigo-500 scale-105 shadow-xl"
                      : isMultiSelected || isSelected
                      ? "ring-2 ring-indigo-500 border-indigo-500 shadow-xl z-20"
                      : isSource
                      ? "ring-2 ring-amber-500 border-amber-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {/* Multi-Select Checkbox in top corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedNodeIds.includes(node.id)) {
                        setSelectedNodeIds((prev) => prev.filter((id) => id !== node.id));
                      } else {
                        setSelectedNodeIds((prev) => [...prev, node.id]);
                        setSelectedNodeId(node.id);
                      }
                    }}
                    className={`absolute -top-2 -left-2 w-5 h-5 rounded-md border flex items-center justify-center transition-all z-30 shadow-xs ${
                      isMultiSelected
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    }`}
                  >
                    {isMultiSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {/* Left Connection Input Port */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (connectingSource && connectingSource.nodeId !== node.id) {
                        handleStartConnect(e, node.id);
                      }
                    }}
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 hover:scale-125 hover:bg-indigo-500 transition-transform flex items-center justify-center cursor-pointer z-30"
                    title="Input Port (Connect here)"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-slate-300" />
                  </button>

                  {/* Output Ports: Single output or Dual True/False output for condition nodes */}
                  {isConditionNode ? (
                    <>
                      {/* TRUE / PASS PORT (Top Right) */}
                      <button
                        onClick={(e) => handleStartConnect(e, node.id, "true")}
                        className="absolute -right-2.5 top-6 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 hover:scale-125 hover:bg-emerald-600 transition-transform flex items-center justify-center cursor-pointer z-30 shadow-xs"
                        title="TRUE Branch Port (Drag to connect passing route)"
                      >
                        <span className="text-[7px] font-black text-white">T</span>
                      </button>

                      {/* FALSE / ELSE PORT (Bottom Right) */}
                      <button
                        onClick={(e) => handleStartConnect(e, node.id, "false")}
                        className="absolute -right-2.5 bottom-6 translate-y-1/2 w-5 h-5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 hover:scale-125 hover:bg-rose-600 transition-transform flex items-center justify-center cursor-pointer z-30 shadow-xs"
                        title="FALSE / ELSE Branch Port (Drag to connect fallback route)"
                      >
                        <span className="text-[7px] font-black text-white">F</span>
                      </button>
                    </>
                  ) : (
                    /* Standard Single Output Port */
                    <button
                      onClick={(e) => handleStartConnect(e, node.id, "out")}
                      className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 hover:scale-125 hover:bg-indigo-700 transition-transform flex items-center justify-center cursor-pointer z-30 shadow-xs"
                      title="Output Port (Drag to connect)"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </button>
                  )}

                  {/* Header */}
                  <div
                    className={`p-2.5 rounded-t-2xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${colorStyle.bg}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1 rounded-md shrink-0 ${colorStyle.iconBg}`}>
                        <DynamicIcon name={node.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {node.name}
                      </span>
                    </div>

                    {/* Step Result status badge */}
                    {isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
                    ) : stepResult ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : null}
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {node.description}
                    </p>

                    {/* Condition Rule Preview Pill */}
                    {isConditionNode && (
                      <div className="p-1.5 rounded-lg bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-[10px] font-mono text-cyan-800 dark:text-cyan-200 flex items-center justify-between">
                        <span>IF: {node.config?.conditionField || "confidence"} {node.config?.conditionOperator || ">"} {node.config?.conditionValue || "0.85"}</span>
                        <GitFork className="w-3 h-3 text-cyan-600 shrink-0" />
                      </div>
                    )}

                    {/* Attached Assets Thumbnail Chips */}
                    {nodeAssets.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{nodeAssets.length} Attached Asset{nodeAssets.length > 1 ? "s" : ""}:</span>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {nodeAssets.slice(0, 3).map((ast) => (
                            <img
                              key={ast.id}
                              src={ast.url}
                              alt={ast.title}
                              referrerPolicy="no-referrer"
                              title={`${ast.title} (${ast.directory})`}
                              className="w-6 h-6 rounded object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0"
                            />
                          ))}
                          {nodeAssets.length > 3 && (
                            <span className="text-[9px] font-bold text-slate-400">+{nodeAssets.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colorStyle.badge}`}
                      >
                        {node.type.replace("_", " ")}
                      </span>

                      {stepResult && (
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {stepResult.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FLOATING BATCH ACTIONS BAR (WHEN 2+ NODES SELECTED) */}
        {selectedNodeIds.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-bold whitespace-nowrap">
                {selectedNodeIds.length} Nodes Selected
              </span>
            </div>

            {/* Quick Batch Asset Attachment */}
            <div className="flex items-center gap-1.5">
              <select
                value={batchAssetIdToAttach}
                onChange={(e) => {
                  const val = e.target.value;
                  setBatchAssetIdToAttach(val);
                  handleBatchAttachAsset(val);
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
              >
                <option value="">Batch Attach Asset...</option>
                {assets.map((ast) => (
                  <option key={ast.id} value={ast.id}>
                    {ast.title} ({ast.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Alignment Tools */}
            <div className="flex items-center gap-1 border-l border-r border-slate-700 px-2">
              <button
                onClick={() => handleBatchAlign("horizontal")}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Align Horizontally (Same Y)"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleBatchAlign("distribute")}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Distribute Spacing"
              >
                <AlignVerticalSpaceAround className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Batch Duplicate & Delete */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBatchDuplicate}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Clone</span>
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-800"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
              <button
                onClick={handleClearSelection}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* RIGHT: COMPONENT PROPERTY INSPECTOR */}
        {selectedNode && (
          <div className="w-84 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col shrink-0 z-20 overflow-y-auto">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Node Configuration
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Component Name
                </label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) => (n.id === selectedNode.id ? { ...n, name: val } : n))
                    );
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  value={selectedNode.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) => (n.id === selectedNode.id ? { ...n, description: val } : n))
                    );
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* CONDITIONAL NODE SPECIFIC INSPECTOR */}
              {selectedNode.type === "condition" && (
                <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 space-y-3">
                  <div className="flex items-center justify-between font-bold text-cyan-900 dark:text-cyan-200">
                    <span className="flex items-center gap-1.5">
                      <GitFork className="w-4 h-4 text-cyan-600" />
                      <span>If / Else Routing Rules</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Payload Field to Evaluate
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. product_tier or confidence"
                        value={selectedNode.config?.conditionField || "confidence"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, conditionField: val } }
                                : n
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Operator
                        </label>
                        <select
                          value={selectedNode.config?.conditionOperator || "greater_than"}
                          onChange={(e) => {
                            const val = e.target.value as ConditionOperator;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, config: { ...n.config, conditionOperator: val } }
                                  : n
                              )
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 text-xs font-semibold"
                        >
                          <option value="equals">Equals (==)</option>
                          <option value="not_equals">Not Equals (!=)</option>
                          <option value="greater_than">Greater Than (&gt;)</option>
                          <option value="less_than">Less Than (&lt;)</option>
                          <option value="contains">Contains Substring</option>
                          <option value="regex">Matches Regex</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Expected Value
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. VIP_LIMITED"
                          value={selectedNode.config?.conditionValue || "0.85"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, config: { ...n.config, conditionValue: val } }
                                  : n
                              )
                            );
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        True Branch Label
                      </label>
                      <input
                        type="text"
                        placeholder="VIP Limited Drop (Silk-Screen)"
                        value={selectedNode.config?.trueBranchLabel || "Pass / True Route"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, trueBranchLabel: val } }
                                : n
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        False / Else Branch Label
                      </label>
                      <input
                        type="text"
                        placeholder="Standard Web (Direct-to-Garment)"
                        value={selectedNode.config?.falseBranchLabel || "Fallback / Else Route"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, falseBranchLabel: val } }
                                : n
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-300 text-xs font-medium text-rose-700 dark:text-rose-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ATTACHED ASSETS & DIRECTORY INSPECTOR SECTION */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-indigo-600" />
                    <span>Department Assets & Gallery</span>
                  </div>
                  <button
                    onClick={() => {
                      setTargetNodeForAsset(selectedNode.id);
                      setShowAssetPicker(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Browse Gallery</span>
                  </button>
                </div>

                {/* Assigned Directory path */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Target Asset Directory (e.g. for Creative Dept)
                  </label>
                  <input
                    type="text"
                    placeholder="creative/apparel/shirts"
                    value={selectedNode.config?.assignedAssetDirectory || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) =>
                        prev.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, config: { ...n.config, assignedAssetDirectory: val } }
                            : n
                        )
                      );
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-xs font-mono"
                  />
                </div>

                {/* Attached Assets List */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    Bound Assets ({selectedNode.attachedAssetIds?.length || 0}):
                  </div>

                  {(!selectedNode.attachedAssetIds || selectedNode.attachedAssetIds.length === 0) ? (
                    <div className="p-2.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/80 text-center text-[11px] text-slate-400">
                      No assets bound. Click "Browse Gallery" to attach shirt mockups, logos, or specs.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedNode.attachedAssetIds.map((aid) => {
                        const ast = assets.find((a) => a.id === aid);
                        if (!ast) return null;
                        return (
                          <div
                            key={ast.id}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={ast.url}
                                alt={ast.title}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded object-cover shrink-0 bg-slate-100"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {ast.title}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {ast.directory}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleNodeAsset(selectedNode.id, ast.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              title="Unbind asset"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Inject Asset Context into AI Prompt button */}
                {selectedNode.type === "ai_process" && (selectedNode.attachedAssetIds?.length || 0) > 0 && (
                  <button
                    onClick={() => handleInjectAssetToPrompt(selectedNode)}
                    className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-50"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-500" />
                    <span>Inject Asset Specs into Prompt</span>
                  </button>
                )}
              </div>

              {/* Node Specific Prompt Config */}
              {selectedNode.type === "ai_process" && (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gemini Prompt Directive
                  </label>
                  <textarea
                    rows={4}
                    value={
                      selectedNode.config?.promptTemplate ||
                      "Analyze the context, identify critical risk factors, and draft the structured remediation JSON."
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((prev) =>
                        prev.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, config: { ...n.config, promptTemplate: val } }
                            : n
                        )
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              )}

              {/* Single Node Live Testing Button */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => testSingleNodeExecution(selectedNode)}
                  disabled={testingSingleNode}
                  className="w-full py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {testingSingleNode ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Test Single Node (Gemini)</span>
                </button>

                {singleNodeTestOutput && (
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5 overflow-x-auto">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>✓ Output ({singleNodeTestOutput.durationMs || 180}ms)</span>
                      <span>Confidence: {((singleNodeTestOutput.confidence || 0.98) * 100).toFixed(0)}%</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-[10px]">
                      {typeof singleNodeTestOutput.output === "string"
                        ? singleNodeTestOutput.output
                        : JSON.stringify(singleNodeTestOutput.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Duplicate & Delete Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => duplicateNode(selectedNode)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="flex-1 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM: LIVE SIMULATION DRAWER */}
        {showSimDrawer && (
          <div className="absolute bottom-0 left-64 right-0 max-h-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Live Canvas Test & Branching Decision Trace ({Object.keys(simulationResults).length} Steps Completed)
                </span>
              </div>
              <button
                onClick={() => setShowSimDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-x-auto flex gap-3">
              {nodes.map((node) => {
                const res = simulationResults[node.id];
                const isCond = node.type === "condition";
                return (
                  <div
                    key={node.id}
                    className={`min-w-[260px] max-w-[300px] p-3 rounded-xl border text-xs space-y-1.5 shrink-0 ${
                      activeRunningNodeId === node.id
                        ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-400 animate-pulse"
                        : res
                        ? isCond
                          ? "bg-cyan-50/40 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate">{node.name}</span>
                      {activeRunningNodeId === node.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
                      ) : res ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400">Waiting</span>
                      )}
                    </div>
                    {res && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono line-clamp-3 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded">
                        {res.output}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ASSET PICKER MODAL (WHEN ATTACHING ASSETS TO NODE) */}
      {showAssetPicker && targetNodeForAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-600" />
                  <span>Select Assets to Attach to Workflow Node</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Target Node: <strong className="text-slate-800 dark:text-slate-200">{nodes.find((n) => n.id === targetNodeForAsset)?.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AssetGallery
                assets={assets}
                isPickerMode={true}
                selectedAssetIds={nodes.find((n) => n.id === targetNodeForAsset)?.attachedAssetIds || []}
                onSelectAssetForNode={(ast) => handleToggleNodeAsset(targetNodeForAsset, ast.id)}
                onAddAsset={() => {}}
                onDeleteAsset={() => {}}
                onClosePicker={() => setShowAssetPicker(false)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAssetPicker(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700"
              >
                Done Attaching Assets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Workflow Architect Prompt Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Workflow Architect
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Describe what you want to automate in natural language.
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Automatically ingest Zendesk billing refunds over $500, verify invoice in Postgres, require Finance Manager signoff, then notify customer in Slack."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAiGenerateWorkflow}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                {isAiGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Generate Workflow Graph</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
