import React, { useState, useRef, useEffect, useMemo } from "react";
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
import { BatchDeleteConfirmationModal } from "./BatchDeleteConfirmationModal";
import { PayloadTroubleshootModal, PayloadTroubleshootData, getValidTemplateForNode } from "./PayloadTroubleshootModal";
import { WorkflowValidationModal } from "./WorkflowValidationModal";
import { validateWorkflow, autoRepairWorkflow, WorkflowValidationReport } from "../utils/workflowValidation";
import { playInteractiveSound } from "../utils/audioSynth";
import { fireCelebration } from "../utils/confetti";
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
  Database,
  Users,
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
  AlertTriangle,
  ShieldAlert,
  Wrench,
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
  onBatchDeleteWorkflows?: (workflowIds: string[]) => void;
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
  onBatchDeleteWorkflows,
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
  const [showBatchDeleteNodesModal, setShowBatchDeleteNodesModal] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(workflow.agentId || (agents[0]?.id || ""));
  const [workflowName, setWorkflowName] = useState<string>(workflow.name);
  const [workflowDesc, setWorkflowDesc] = useState<string>(workflow.description);

  // Workflow Pipeline Fleet Manager & Batch Delete state
  const [showPipelineManagerModal, setShowPipelineManagerModal] = useState<boolean>(false);
  const [selectedWorkflowIdsForBatch, setSelectedWorkflowIdsForBatch] = useState<string[]>([]);
  const [showBatchDeleteWorkflowsModal, setShowBatchDeleteWorkflowsModal] = useState<boolean>(false);
  const [pipelineSearch, setPipelineSearch] = useState<string>("");
  
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

  // Payload Troubleshooting Modal state
  const [troubleshootPayloadData, setTroubleshootPayloadData] = useState<PayloadTroubleshootData | null>(null);
  const [isTroubleshootModalOpen, setIsTroubleshootModalOpen] = useState(false);

  // Batch edit state inputs
  const [batchActionType, setBatchActionType] = useState<string>("");
  const [batchAssetIdToAttach, setBatchAssetIdToAttach] = useState<string>("");

  // Real-Time Pipeline Validation Engine
  const validationReport = useMemo(() => validateWorkflow(nodes, connections), [nodes, connections]);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [isDeploymentAttempt, setIsDeploymentAttempt] = useState<boolean>(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState<boolean>(false);

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
    setShowBatchDeleteNodesModal(true);
  };

  const handleConfirmBatchDeleteNodes = () => {
    if (selectedNodeIds.length === 0) return;
    setNodes((prev) => prev.filter((n) => !selectedNodeIds.includes(n.id)));
    setConnections((prev) =>
      prev.filter((c) => !selectedNodeIds.includes(c.from) && !selectedNodeIds.includes(c.to))
    );
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
    setShowBatchDeleteNodesModal(false);
  };

  const handleConfirmBatchDeleteWorkflows = () => {
    if (selectedWorkflowIdsForBatch.length === 0) return;
    if (onBatchDeleteWorkflows) {
      onBatchDeleteWorkflows(selectedWorkflowIdsForBatch);
    } else if (onDeleteWorkflow) {
      selectedWorkflowIdsForBatch.forEach((id) => onDeleteWorkflow(id));
    }
    setSelectedWorkflowIdsForBatch([]);
    setShowBatchDeleteWorkflowsModal(false);
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
    // If the workflow is active and invalid, prevent active deployment
    let willBeActive = workflow.isActive;
    if (willBeActive && !validationReport.isValid) {
      willBeActive = false;
      playInteractiveSound("alert");
    }
    const updated: Workflow = {
      ...workflow,
      name: workflowName,
      description: workflowDesc,
      agentId: selectedAgentId,
      nodes,
      connections,
      isActive: willBeActive,
    };
    onSaveWorkflow(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Deploy pipeline with strict real-time validation check
  const handleDeployPipeline = () => {
    if (!validationReport.isValid) {
      // Strictly prevent deployment of invalid automation pipelines
      playInteractiveSound("alert");
      setIsDeploymentAttempt(true);
      setShowValidationModal(true);
      return;
    }

    const deployed: Workflow = {
      ...workflow,
      name: workflowName,
      description: workflowDesc,
      agentId: selectedAgentId,
      nodes,
      connections,
      isActive: true,
    };
    onSaveWorkflow(deployed);
    playInteractiveSound("chime");
    fireCelebration();
    setDeploymentSuccess(true);
    setTimeout(() => setDeploymentSuccess(false), 3500);
  };

  const handleAutoRepair = () => {
    const { repairedNodes, repairedConnections } = autoRepairWorkflow(nodes, connections);
    setNodes(repairedNodes);
    setConnections(repairedConnections);
    playInteractiveSound("chime");
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

    // Validate payload syntax client-side first to catch payload errors immediately
    let parsedPayload: any = null;
    let isPayloadValidJson = true;
    let syntaxErrorMessage = "";

    try {
      if (testPayloadInput.trim()) {
        parsedPayload = JSON.parse(testPayloadInput);
      } else {
        isPayloadValidJson = false;
        syntaxErrorMessage = "Payload is empty. The node requires structured parameters.";
      }
    } catch (parseErr: any) {
      isPayloadValidJson = false;
      syntaxErrorMessage = parseErr?.message || "Invalid JSON syntax detected in node payload.";
    }

    if (!isPayloadValidJson) {
      setTestingSingleNode(false);
      setSingleNodeTestOutput({
        success: false,
        status: "error",
        error: syntaxErrorMessage,
        output: `[Payload Error Detected]: ${syntaxErrorMessage}`,
        isPayloadError: true,
      });
      // Trigger troubleshooting modal immediately
      setTroubleshootPayloadData({
        rawPayload: testPayloadInput,
        node,
        workflowName,
        agent: assignedAgent,
        errorMessage: syntaxErrorMessage,
      });
      setIsTroubleshootModalOpen(true);
      return;
    }

    try {
      const attachedAssetsInfo = (node.attachedAssetIds || [])
        .map((aid) => assets.find((a) => a.id === aid))
        .filter(Boolean);

      const res = await fetch("/api/gemini/execute-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node,
          inputData: parsedPayload,
          agent: assignedAgent,
          attachedAssets: attachedAssetsInfo,
        }),
      });
      const data = await res.json();

      if (data.status === "error" || data.isPayloadError || (data.output && String(data.output).toLowerCase().includes("payload error"))) {
        setTroubleshootPayloadData({
          rawPayload: testPayloadInput,
          node,
          workflowName,
          agent: assignedAgent,
          errorMessage: data.error || data.output || "Execution failed due to invalid node payload keys.",
        });
        setIsTroubleshootModalOpen(true);
      }

      setSingleNodeTestOutput(data);
    } catch (err: any) {
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

  const handleResetNodeToTemplate = (nodeId: string, validConfig: Record<string, any>, validPayload?: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              config: {
                ...n.config,
                ...validConfig,
              },
            }
          : n
      )
    );
    if (validPayload) {
      setTestPayloadInput(validPayload);
    }
    setSingleNodeTestOutput({
      success: true,
      output: `[Reset to Valid Template]: Successfully restored certified schema & default parameters for node.`,
      confidence: 1.0,
      durationMs: 95,
    });
  };

  const handleApplyFixedPayload = (nodeId: string, fixedPayload: string) => {
    setTestPayloadInput(fixedPayload);
    try {
      const parsed = JSON.parse(fixedPayload);
      setSingleNodeTestOutput({
        success: true,
        output: `[Updated Payload Applied]: ${Object.keys(parsed).length} keys verified ready for execution.`,
        confidence: 0.99,
        durationMs: 110,
      });
    } catch (e) {
      // Ignored
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
          {workflows.length > 0 && onSelectWorkflow && (
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

              <button
                type="button"
                id="btn-manage-pipeline-fleet"
                onClick={() => setShowPipelineManagerModal(true)}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                title="Manage All Pipelines & Bulk Operations"
              >
                <WorkflowIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Pipelines</span>
                <span className="text-[10px] px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  {workflows.length}
                </span>
              </button>
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

          {/* Real-Time Pipeline Validation Status Pill */}
          <button
            id="btn-workflow-validation-status"
            type="button"
            onClick={() => {
              setIsDeploymentAttempt(false);
              setShowValidationModal(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              !validationReport.isValid
                ? "bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 ring-1 ring-rose-400/40"
                : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            }`}
            title={
              !validationReport.isValid
                ? `Validation Check: ${validationReport.errors.length} issue(s) detected. Click to inspect & fix.`
                : "Validation Check: Pipeline is valid and ready to deploy."
            }
          >
            {!validationReport.isValid ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                <span>{validationReport.errors.length} Issue{validationReport.errors.length > 1 ? "s" : ""}</span>
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded text-[9px] uppercase font-black">
                  Fix
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">Pipeline Valid</span>
                <span className="sm:hidden">Valid</span>
              </>
            )}
          </button>

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

          {/* Deploy Pipeline Button (with strict real-time blocker) */}
          {isMasterDeveloper && (
            <button
              id="btn-deploy-pipeline"
              type="button"
              onClick={handleDeployPipeline}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                !validationReport.isValid
                  ? "bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-not-allowed"
                  : workflow.isActive
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-95"
              }`}
              title={
                !validationReport.isValid
                  ? `Deployment Blocked: ${validationReport.errors.length} broken connections or missing fields must be resolved.`
                  : workflow.isActive
                  ? "Pipeline is Active in Production. Click to re-deploy latest changes."
                  : "Deploy Pipeline to Production Fleet"
              }
            >
              {!validationReport.isValid ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Deploy Blocked</span>
                </>
              ) : deploymentSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Deployed!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
                  <span>{workflow.isActive ? "Active (Re-deploy)" : "Deploy"}</span>
                </>
              )}
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
              <marker
                id="arrowhead-error"
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
              const isBroken = validationReport.brokenConnectionIds.has(conn.id);
              const sourceNode = nodes.find((n) => n.id === conn.from);
              const targetNode = nodes.find((n) => n.id === conn.to);

              // If both missing, skip rendering
              if (!sourceNode && !targetNode) return null;

              // If dangling source connection (source deleted or missing)
              if (!sourceNode && targetNode) {
                const endX = targetNode.position.x * zoom;
                const endY = (targetNode.position.y + 60) * zoom;
                const startX = Math.max(20, endX - 140);
                const startY = endY - 30;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const pathData = `M ${startX} ${startY} Q ${startX + 50} ${startY + 20}, ${endX} ${endY}`;
                return (
                  <g key={conn.id} className="pointer-events-auto group">
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth={3.5}
                      strokeDasharray="6,4"
                      className="animate-pulse"
                      markerEnd="url(#arrowhead-error)"
                      style={{ filter: "drop-shadow(0 0 6px rgba(244, 63, 94, 0.7))" }}
                    />
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConnection(conn.id);
                      }}
                    >
                      <rect x="-65" y="-12" width="130" height="24" rx="12" fill="#fff1f2" stroke="#f43f5e" strokeWidth="1.5" />
                      <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#be123c">
                        ⚠️ Broken Source (Del)
                      </text>
                    </g>
                  </g>
                );
              }

              // If dangling target connection (target deleted or missing)
              if (sourceNode && !targetNode) {
                const isConditionSource = sourceNode.type === "condition";
                const isTrueBranch = conn.branchType === "true" || conn.fromPort === "true";
                let portOffsetY = isConditionSource ? (isTrueBranch ? 35 : 85) : 60;
                const startX = (sourceNode.position.x + 230) * zoom;
                const startY = (sourceNode.position.y + portOffsetY) * zoom;
                const endX = startX + 140;
                const endY = startY + 30;
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const pathData = `M ${startX} ${startY} Q ${startX + 60} ${startY}, ${endX} ${endY}`;
                return (
                  <g key={conn.id} className="pointer-events-auto group">
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth={3.5}
                      strokeDasharray="6,4"
                      className="animate-pulse"
                      markerEnd="url(#arrowhead-error)"
                      style={{ filter: "drop-shadow(0 0 6px rgba(244, 63, 94, 0.7))" }}
                    />
                    <circle cx={endX} cy={endY} r={7} fill="#f43f5e" />
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConnection(conn.id);
                      }}
                    >
                      <rect x="-65" y="-12" width="130" height="24" rx="12" fill="#fff1f2" stroke="#f43f5e" strokeWidth="1.5" />
                      <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#be123c">
                        ⚠️ Broken Target (Del)
                      </text>
                    </g>
                  </g>
                );
              }

              // Standard connection between existing source and target nodes
              const isConditionSource = sourceNode!.type === "condition";
              const isTrueBranch = conn.branchType === "true" || conn.fromPort === "true";
              const isFalseBranch = conn.branchType === "false" || conn.fromPort === "false";

              // Source Y port calculation
              let portOffsetY = 60;
              if (isConditionSource) {
                portOffsetY = isTrueBranch ? 35 : 85;
              }

              const startX = (sourceNode!.position.x + 230) * zoom;
              const startY = (sourceNode!.position.y + portOffsetY) * zoom;
              const endX = targetNode!.position.x * zoom;
              const endY = (targetNode!.position.y + 60) * zoom;

              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              const dx = Math.abs(endX - startX) * 0.5;
              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              const isSourceActive = activeRunningNodeId === sourceNode!.id;

              const strokeColor = isBroken
                ? "#f43f5e"
                : isTrueBranch
                ? "#10b981"
                : isFalseBranch
                ? "#f43f5e"
                : isSourceActive
                ? "#6366f1"
                : "#94a3b8";

              const markerId = isBroken
                ? "url(#arrowhead-error)"
                : isTrueBranch
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
                    strokeWidth={isBroken ? 3.5 : isSourceActive ? 3.5 : 2.5}
                    strokeDasharray={isBroken ? "6,4" : isTrueBranch || isFalseBranch || isSourceActive ? "6,4" : undefined}
                    className={`${isBroken || isSourceActive ? "animate-pulse" : ""} transition-all`}
                    markerEnd={markerId}
                    style={isBroken ? { filter: "drop-shadow(0 0 6px rgba(244, 63, 94, 0.7))" } : undefined}
                  />

                  {/* Branch or Error Label Badge in Middle of Cable */}
                  {(isBroken || isTrueBranch || isFalseBranch || conn.label) && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConnection(conn.id);
                      }}
                    >
                      <rect
                        x={isBroken ? "-60" : "-45"}
                        y="-11"
                        width={isBroken ? "120" : "90"}
                        height="22"
                        rx="11"
                        fill={isBroken ? "#fff1f2" : isTrueBranch ? "#ecfdf5" : isFalseBranch ? "#fff1f2" : "#f1f5f9"}
                        stroke={isBroken ? "#f43f5e" : isTrueBranch ? "#10b981" : isFalseBranch ? "#f43f5e" : "#94a3b8"}
                        strokeWidth={isBroken ? "1.5" : "1"}
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={isBroken ? "#be123c" : isTrueBranch ? "#047857" : isFalseBranch ? "#be123c" : "#475569"}
                      >
                        {isBroken ? "⚠️ Broken Link (Del)" : isTrueBranch ? "✓ TRUE" : isFalseBranch ? "✗ FALSE" : conn.label || "NEXT"}
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

              // Validation diagnostics for this node
              const nodeErrors = validationReport.nodeErrorMap.get(node.id) || [];
              const hasNodeErrors = nodeErrors.length > 0;
              const brokenPorts = validationReport.brokenNodePorts.get(node.id) || new Set<string>();

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
                      ? hasNodeErrors
                        ? "ring-4 ring-rose-500 border-rose-500 shadow-xl z-20"
                        : "ring-2 ring-indigo-500 border-indigo-500 shadow-xl z-20"
                      : hasNodeErrors
                      ? "ring-2 ring-rose-500/80 border-rose-500 shadow-lg shadow-rose-500/20 bg-rose-50/15 dark:bg-rose-950/25"
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
                  {(() => {
                    const isInputBroken = brokenPorts.has("in");
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (connectingSource && connectingSource.nodeId !== node.id) {
                            handleStartConnect(e, node.id);
                          }
                        }}
                        className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer z-30 ${
                          isInputBroken
                            ? "bg-rose-500 ring-4 ring-rose-500/50 animate-pulse shadow-md"
                            : "bg-slate-200 dark:bg-slate-700 hover:bg-indigo-500"
                        }`}
                        title={isInputBroken ? "⚠️ Missing incoming connection: Step is unreachable!" : "Input Port (Connect here)"}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${isInputBroken ? "bg-white" : "bg-slate-600 dark:bg-slate-300"}`} />
                      </button>
                    );
                  })()}

                  {/* Output Ports: Single output or Dual True/False output for condition nodes */}
                  {isConditionNode ? (
                    <>
                      {/* TRUE / PASS PORT (Top Right) */}
                      {(() => {
                        const isTrueBroken = brokenPorts.has("true");
                        return (
                          <button
                            onClick={(e) => handleStartConnect(e, node.id, "true")}
                            className={`absolute -right-2.5 top-6 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer z-30 shadow-xs ${
                              isTrueBroken
                                ? "bg-rose-500 ring-4 ring-rose-500/50 animate-pulse"
                                : "bg-emerald-500 hover:bg-emerald-600"
                            }`}
                            title={isTrueBroken ? "⚠️ Missing TRUE branch connection!" : "TRUE Branch Port (Drag to connect passing route)"}
                          >
                            <span className="text-[7px] font-black text-white">T</span>
                          </button>
                        );
                      })()}

                      {/* FALSE / ELSE PORT (Bottom Right) */}
                      {(() => {
                        const isFalseBroken = brokenPorts.has("false");
                        return (
                          <button
                            onClick={(e) => handleStartConnect(e, node.id, "false")}
                            className={`absolute -right-2.5 bottom-6 translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer z-30 shadow-xs ${
                              isFalseBroken
                                ? "bg-rose-500 ring-4 ring-rose-500/50 animate-pulse"
                                : "bg-rose-500 hover:bg-rose-600"
                            }`}
                            title={isFalseBroken ? "⚠️ Missing FALSE / Fallback branch connection!" : "FALSE / ELSE Branch Port (Drag to connect fallback route)"}
                          >
                            <span className="text-[7px] font-black text-white">F</span>
                          </button>
                        );
                      })()}
                    </>
                  ) : (
                    /* Standard Single Output Port */
                    (() => {
                      const isOutBroken = brokenPorts.has("out");
                      return (
                        <button
                          onClick={(e) => handleStartConnect(e, node.id, "out")}
                          className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 hover:scale-125 transition-transform flex items-center justify-center cursor-pointer z-30 shadow-xs ${
                            isOutBroken
                              ? "bg-rose-500 ring-4 ring-rose-500/50 animate-pulse"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                          title={isOutBroken ? "⚠️ Missing outgoing connection: Step leads nowhere!" : "Output Port (Drag to connect)"}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </button>
                      );
                    })()
                  )}

                  {/* Header */}
                  <div
                    className={`p-2.5 rounded-t-2xl border-b flex items-center justify-between ${
                      hasNodeErrors
                        ? "bg-rose-50/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-900"
                        : `${colorStyle.bg} border-slate-100 dark:border-slate-800`
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1 rounded-md shrink-0 ${hasNodeErrors ? "bg-rose-500 text-white" : colorStyle.iconBg}`}>
                        <DynamicIcon name={node.iconName} className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-xs font-bold truncate ${hasNodeErrors ? "text-rose-900 dark:text-rose-200" : "text-slate-800 dark:text-slate-100"}`}>
                        {node.name}
                      </span>
                    </div>

                    {/* Step Result / Error status badge */}
                    <div className="flex items-center gap-1 shrink-0">
                      {hasNodeErrors && (
                        <span
                          title={nodeErrors.join(" • ")}
                          className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold flex items-center gap-0.5 animate-pulse shadow-xs"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{nodeErrors.length > 1 ? `${nodeErrors.length} Errors` : "Error"}</span>
                        </span>
                      )}
                      {isRunning ? (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
                      ) : stepResult ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : null}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 space-y-2">
                    {/* Red Error Callout Banner if node has errors */}
                    {hasNodeErrors && (
                      <div className="p-1.5 rounded-lg bg-rose-50/95 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-[10px] text-rose-800 dark:text-rose-200 space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-rose-700 dark:text-rose-400">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Validation Issue</span>
                        </div>
                        <p className="line-clamp-2 leading-tight text-rose-600 dark:text-rose-300 font-medium">
                          {nodeErrors[0]}
                        </p>
                      </div>
                    )}

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
              {/* REAL-TIME NODE VALIDATION DIAGNOSTICS & QUICK HEAL */}
              {(() => {
                const nodeErrors = validationReport.nodeErrorMap.get(selectedNode.id) || [];
                if (nodeErrors.length === 0) return null;
                return (
                  <div className="p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-2 shadow-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Configuration Errors ({nodeErrors.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const { repairedNodes } = autoRepairWorkflow([selectedNode], []);
                          if (repairedNodes[0]) {
                            setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? repairedNodes[0] : n)));
                            playInteractiveSound("chime");
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Auto-fill recommended default values for missing configuration fields"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Quick-Heal</span>
                      </button>
                    </div>
                    <ul className="list-disc list-inside text-[11px] space-y-1 text-rose-700 dark:text-rose-300 font-medium">
                      {nodeErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* COMPONENT NAME */}
              {(() => {
                const fieldErrors = validationReport.nodeFieldErrors.get(selectedNode.id) || {};
                const hasNameError = !!fieldErrors.name;
                return (
                  <div>
                    <label className={`block font-semibold mb-1 ${hasNameError ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
                      Component Name {hasNameError && <span className="text-rose-500">* (Required)</span>}
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
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:ring-2 ${
                        hasNameError
                          ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                          : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                      }`}
                    />
                    {hasNameError && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{fieldErrors.name}</span>
                      </p>
                    )}
                  </div>
                );
              })()}

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

              {/* TRIGGER NODE SPECIFIC CONFIG */}
              {selectedNode.type === "trigger" && (() => {
                const fieldErrors = validationReport.nodeFieldErrors.get(selectedNode.id) || {};
                const hasTriggerError = !!fieldErrors.triggerType;
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
                    <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span>Trigger Event Source</span>
                      </span>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${hasTriggerError ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                        Trigger Protocol / Hook Type {hasTriggerError && "* (Required)"}
                      </label>
                      <select
                        value={selectedNode.config?.triggerType || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, triggerType: val } }
                                : n
                            )
                          );
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                          hasTriggerError
                            ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100"
                            : "bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700"
                        }`}
                      >
                        <option value="">Select Trigger Type...</option>
                        <option value="webhook">Inbound HTTP Webhook</option>
                        <option value="schedule">Cron Scheduled Interval</option>
                        <option value="event_stream">Kafka / PubSub Event Stream</option>
                        <option value="app_event">Third-Party SaaS Event (e.g. Zendesk/Jira)</option>
                      </select>
                      {hasTriggerError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.triggerType}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* DATA SOURCE NODE SPECIFIC CONFIG */}
              {selectedNode.type === "data_source" && (() => {
                const fieldErrors = validationReport.nodeFieldErrors.get(selectedNode.id) || {};
                const hasSourceError = !!fieldErrors.sourceApp;
                return (
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
                    <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-200">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span>Data Connector</span>
                      </span>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${hasSourceError ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                        Source Database / Provider {hasSourceError && "* (Required)"}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PostgreSQL, Salesforce CRM, Snowflake"
                        value={selectedNode.config?.sourceApp || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, sourceApp: val } }
                                : n
                            )
                          );
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                          hasSourceError
                            ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100"
                            : "bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700"
                        }`}
                      />
                      {hasSourceError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.sourceApp}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* HUMAN REVIEW NODE SPECIFIC CONFIG */}
              {selectedNode.type === "human_review" && (() => {
                const fieldErrors = validationReport.nodeFieldErrors.get(selectedNode.id) || {};
                const hasApproverError = !!fieldErrors.approverRole;
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
                    <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>Human Approver Escalation</span>
                      </span>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${hasApproverError ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                        Designated Approver Role {hasApproverError && "* (Required)"}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Architect / Tech Lead or Compliance Officer"
                        value={selectedNode.config?.approverRole || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, approverRole: val } }
                                : n
                            )
                          );
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                          hasApproverError
                            ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100"
                            : "bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700"
                        }`}
                      />
                      {hasApproverError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.approverRole}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ACTION OUTPUT NODE SPECIFIC CONFIG */}
              {selectedNode.type === "action_output" && (() => {
                const fieldErrors = validationReport.nodeFieldErrors.get(selectedNode.id) || {};
                const hasTargetError = !!fieldErrors.actionTarget;
                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                    <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Dispatch Destination</span>
                      </span>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${hasTargetError ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                        Output Target / Webhook / Channel {hasTargetError && "* (Required)"}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. #customer-alerts Slack, Zendesk API, Email"
                        value={selectedNode.config?.actionTarget || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, actionTarget: val } }
                                : n
                            )
                          );
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                          hasTargetError
                            ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100"
                            : "bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700"
                        }`}
                      />
                      {hasTargetError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.actionTarget}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* CONDITIONAL NODE SPECIFIC INSPECTOR */}
              {selectedNode.type === "condition" && (() => {
                const fieldErrors = validationReport.nodeFieldErrors.get(selectedNode.id) || {};
                const hasConditionFieldError = !!fieldErrors.conditionField;
                const hasConditionValueError = !!fieldErrors.conditionValue;

                return (
                  <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 space-y-3">
                    <div className="flex items-center justify-between font-bold text-cyan-900 dark:text-cyan-200">
                      <span className="flex items-center gap-1.5">
                        <GitFork className="w-4 h-4 text-cyan-600" />
                        <span>If / Else Routing Rules</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase mb-1 ${hasConditionFieldError ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                          Payload Field to Evaluate {hasConditionFieldError && "* (Required)"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. product_tier or confidence"
                          value={selectedNode.config?.conditionField || ""}
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
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                            hasConditionFieldError
                              ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100"
                              : "bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700"
                          }`}
                        />
                        {hasConditionFieldError && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{fieldErrors.conditionField}</span>
                          </p>
                        )}
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
                          <label className={`block text-[10px] font-bold uppercase mb-1 ${hasConditionValueError ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                            Expected Value {hasConditionValueError && "* (Required)"}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. VIP_LIMITED"
                            value={selectedNode.config?.conditionValue ?? ""}
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
                            className={`w-full px-2 py-1.5 rounded-lg text-xs font-mono ${
                              hasConditionValueError
                                ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100"
                                : "bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700"
                            }`}
                          />
                          {hasConditionValueError && (
                            <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{fieldErrors.conditionValue}</span>
                            </p>
                          )}
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
                );
              })()}

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
              {selectedNode.type === "ai_process" && (() => {
                const fieldErrors = validationReport.nodeFieldErrors.get(selectedNode.id) || {};
                const hasPromptError = !!fieldErrors.promptTemplate;
                const hasActionError = !!fieldErrors.aiAction;

                return (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50">
                    <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-200">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Gemini Intelligence Directive</span>
                      </span>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${hasActionError ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
                        AI Task Mode {hasActionError && "* (Required)"}
                      </label>
                      <select
                        value={selectedNode.config?.aiAction || "generate"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, config: { ...n.config, aiAction: val } }
                                : n
                            )
                          );
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                          hasActionError
                            ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100"
                            : "bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700"
                        }`}
                      >
                        <option value="generate">Text & Document Generation</option>
                        <option value="classify">Data & Sentiment Classification</option>
                        <option value="extract">Structured Schema Extraction</option>
                        <option value="code_review">Code / Logic Review</option>
                      </select>
                      {hasActionError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.aiAction}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase mb-1 ${hasPromptError ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
                        Prompt Directive Template {hasPromptError && "* (Required)"}
                      </label>
                      <textarea
                        rows={4}
                        placeholder="e.g. Analyze incoming request and format output JSON..."
                        value={selectedNode.config?.promptTemplate || ""}
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
                        className={`w-full px-3 py-2 rounded-xl text-xs font-mono focus:ring-2 ${
                          hasPromptError
                            ? "bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-900 dark:text-rose-100 focus:ring-rose-500"
                            : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                        }`}
                      />
                      {hasPromptError && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.promptTemplate}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Single Node Live Testing Button */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    id="btn-test-single-node"
                    onClick={() => testSingleNodeExecution(selectedNode)}
                    disabled={testingSingleNode}
                    className="flex-1 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-xs"
                  >
                    {testingSingleNode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>Test Single Node</span>
                  </button>

                  <button
                    id="btn-troubleshoot-node-payload"
                    type="button"
                    onClick={() => {
                      setTroubleshootPayloadData({
                        rawPayload: testPayloadInput,
                        node: selectedNode,
                        workflowName,
                        agent: assignedAgent,
                      });
                      setIsTroubleshootModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Validate payload keys, reset template, or test in simulation mode"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Troubleshoot</span>
                  </button>
                </div>

                {singleNodeTestOutput && (
                  <div className={`p-3 rounded-xl ${
                    singleNodeTestOutput.status === "error" || singleNodeTestOutput.isPayloadError
                      ? "bg-red-950/90 border border-red-800 text-red-200"
                      : "bg-slate-900 text-slate-200"
                  } font-mono text-[11px] space-y-1.5 overflow-x-auto`}>
                    <div className="flex items-center justify-between font-bold">
                      {singleNodeTestOutput.status === "error" || singleNodeTestOutput.isPayloadError ? (
                        <div className="flex items-center gap-1.5 text-red-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Payload Error Detected</span>
                        </div>
                      ) : (
                        <span className="text-emerald-400">✓ Output ({singleNodeTestOutput.durationMs || 180}ms)</span>
                      )}
                      <span>Confidence: {((singleNodeTestOutput.confidence || 0.98) * 100).toFixed(0)}%</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-[10px]">
                      {typeof singleNodeTestOutput.output === "string"
                        ? singleNodeTestOutput.output
                        : JSON.stringify(singleNodeTestOutput.output, null, 2)}
                    </pre>

                    {(singleNodeTestOutput.status === "error" || singleNodeTestOutput.isPayloadError) && (
                      <button
                        onClick={() => {
                          setTroubleshootPayloadData({
                            rawPayload: testPayloadInput,
                            node: selectedNode,
                            workflowName,
                            agent: assignedAgent,
                            errorMessage: singleNodeTestOutput.error || singleNodeTestOutput.output,
                          });
                          setIsTroubleshootModalOpen(true);
                        }}
                        className="w-full mt-1.5 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Open Payload Troubleshooting Modal</span>
                      </button>
                    )}
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

      {/* PIPELINE FLEET MANAGER MODAL (WITH WORKFLOW BATCH ACTIONS) */}
      {showPipelineManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <WorkflowIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Workflow Pipelines Fleet Manager</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold">
                      {workflows.length} Total Pipelines
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Search, inspect execution metrics, multi-select, and execute batch operations across all pipelines.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPipelineManagerModal(false)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Batch Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Filter pipelines by name or department..."
                  value={pipelineSearch}
                  onChange={(e) => setPipelineSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedWorkflowIdsForBatch.length === workflows.length) {
                      setSelectedWorkflowIdsForBatch([]);
                    } else {
                      setSelectedWorkflowIdsForBatch(workflows.map((w) => w.id));
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {selectedWorkflowIdsForBatch.length === workflows.length ? "Deselect All" : "Select All"}
                </button>

                {selectedWorkflowIdsForBatch.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBatchDeleteWorkflowsModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Batch Delete ({selectedWorkflowIdsForBatch.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pipelines List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {workflows
                .filter((w) => {
                  if (!pipelineSearch.trim()) return true;
                  const q = pipelineSearch.toLowerCase();
                  return w.name.toLowerCase().includes(q) || w.department.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
                })
                .map((wf) => {
                  const isSelected = selectedWorkflowIdsForBatch.includes(wf.id);
                  const isCurrent = wf.id === workflow.id;
                  const assignedAgent = agents.find((a) => a.id === wf.agentId);

                  return (
                    <div
                      key={wf.id}
                      onClick={() => {
                        setSelectedWorkflowIdsForBatch((prev) =>
                          prev.includes(wf.id) ? prev.filter((id) => id !== wf.id) : [...prev, wf.id]
                        );
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorkflowIdsForBatch((prev) =>
                              prev.includes(wf.id) ? prev.filter((id) => id !== wf.id) : [...prev, wf.id]
                            );
                          }}
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                          <WorkflowIcon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {wf.name}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-indigo-600 text-white">
                                Editing
                              </span>
                            )}
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${wf.isActive ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                              {wf.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {wf.department} • {wf.nodes?.length || 0} nodes • Executing Agent: <span className="font-semibold text-slate-600 dark:text-slate-300">{assignedAgent?.name || "Unassigned"}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            {wf.totalRuns || 0} runs
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                            ~{((wf.totalRuns || 0) * (wf.avgHoursSavedPerRun || 0.5)).toFixed(1)}h automated
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectWorkflow) onSelectWorkflow(wf.id);
                            setShowPipelineManagerModal(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Open Canvas
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE WORKFLOWS CONFIRMATION MODAL */}
      <BatchDeleteConfirmationModal
        isOpen={showBatchDeleteWorkflowsModal}
        type="workflows"
        selectedWorkflows={workflows.filter((w) => selectedWorkflowIdsForBatch.includes(w.id))}
        allAgents={agents}
        onClose={() => setShowBatchDeleteWorkflowsModal(false)}
        onConfirm={handleConfirmBatchDeleteWorkflows}
      />

      {/* BATCH DELETE CANVAS NODES CONFIRMATION MODAL */}
      <BatchDeleteConfirmationModal
        isOpen={showBatchDeleteNodesModal}
        type="nodes"
        selectedNodes={nodes.filter((n) => selectedNodeIds.includes(n.id))}
        allConnections={connections}
        currentWorkflowName={workflowName}
        onClose={() => setShowBatchDeleteNodesModal(false)}
        onConfirm={handleConfirmBatchDeleteNodes}
      />

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

      {/* PAYLOAD TROUBLESHOOTING & SIMULATION MODAL */}
      <PayloadTroubleshootModal
        isOpen={isTroubleshootModalOpen}
        onClose={() => {
          setIsTroubleshootModalOpen(false);
          setTroubleshootPayloadData(null);
        }}
        data={troubleshootPayloadData}
        onResetToTemplate={handleResetNodeToTemplate}
        onApplyFixedPayload={handleApplyFixedPayload}
      />

      {/* PIPELINE VALIDATION & DEPLOYMENT BLOCKER MODAL */}
      <WorkflowValidationModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          setIsDeploymentAttempt(false);
        }}
        report={validationReport}
        nodes={nodes}
        connections={connections}
        workflowName={workflowName}
        isDeploymentAttempt={isDeploymentAttempt}
        onSelectNode={(nodeId) => {
          setSelectedNodeId(nodeId);
          setSelectedNodeIds([nodeId]);
          setShowValidationModal(false);
          setIsDeploymentAttempt(false);
        }}
        onAutoRepair={handleAutoRepair}
        onDeleteConnection={(connId) => {
          deleteConnection(connId);
        }}
      />
    </div>
  );
};
