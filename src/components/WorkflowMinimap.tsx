import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  WorkflowNode, 
  WorkflowConnection, 
  NodeType 
} from "../types";
import { WorkflowValidationReport } from "../utils/workflowValidation";
import { 
  Map, 
  Move, 
  GripHorizontal, 
  ZoomIn, 
  ZoomOut, 
  LocateFixed, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  RotateCcw,
  Search,
  Compass,
  Maximize2,
  Minimize2,
  CornerDownRight,
  Crosshair,
  CheckCircle2,
  Layers,
  Sparkles,
  GitFork,
  ShieldCheck,
  UserCheck,
  Send,
  X
} from "lucide-react";

export type MinimapCorner = "bottom-right" | "bottom-left" | "top-right";

export interface WorkflowMinimapProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  selectedNodeId: string | null;
  selectedNodeIds?: string[];
  validationReport?: WorkflowValidationReport;
  canvasRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  onSelectNode?: (nodeId: string) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  isMinimapVisible?: boolean;
  onToggleMinimapVisible?: () => void;
}

export const WorkflowMinimap: React.FC<WorkflowMinimapProps> = ({
  nodes,
  connections,
  selectedNodeId,
  selectedNodeIds = [],
  validationReport,
  canvasRef,
  zoom,
  setZoom,
  onSelectNode,
  containerRef,
  isMinimapVisible = true,
  onToggleMinimapVisible,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<WorkflowNode | null>(null);
  const [isExpandedRadar, setIsExpandedRadar] = useState<boolean>(false);
  const [showQuickJump, setShowQuickJump] = useState<boolean>(false);
  const [quickJumpSearch, setQuickJumpSearch] = useState<string>("");
  const [quickJumpFilter, setQuickJumpFilter] = useState<string>("all");
  const [dockCorner, setDockCorner] = useState<MinimapCorner>("bottom-right");
  const [viewMode, setViewMode] = useState<"full" | "pipeline">("full");
  const [currentErrorCycleIndex, setCurrentErrorCycleIndex] = useState<number>(0);

  // Dragging the mini-map container window
  const [mapPosition, setMapPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingWindow, setIsDraggingWindow] = useState<boolean>(false);
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; initialX: number; initialY: number }>({
    startMouseX: 0,
    startMouseY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Panning main canvas via mini-map viewfinder
  const [isPanningViewport, setIsPanningViewport] = useState<boolean>(false);
  const mapSvgRef = useRef<SVGSVGElement>(null);
  const minimapContainerRef = useRef<HTMLDivElement>(null);

  // Main canvas viewport tracking
  const [viewport, setViewport] = useState({
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 1000,
    clientHeight: 700,
  });

  // Update viewport info on canvas scroll and window resize
  const updateViewport = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    setViewport({
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
    });
  }, [canvasRef]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    updateViewport();

    const handleScroll = () => {
      updateViewport();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateViewport);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateViewport);
    };
  }, [canvasRef, updateViewport, zoom]);

  // Full virtual canvas dimensions (base: 3200 x 2200)
  const fullBounds = useMemo(() => {
    let maxX = 3200;
    let maxY = 2200;
    nodes.forEach((node) => {
      if (node.position.x + 350 > maxX) maxX = node.position.x + 350;
      if (node.position.y + 250 > maxY) maxY = node.position.y + 250;
    });
    return { minX: 0, minY: 0, width: maxX, height: maxY };
  }, [nodes]);

  // Tightly fitted pipeline extents bounding box
  const pipelineBounds = useMemo(() => {
    if (nodes.length === 0) return fullBounds;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + 240);
      maxY = Math.max(maxY, n.position.y + 120);
    });
    const padding = 100;
    const boundedMinX = Math.max(0, minX - padding);
    const boundedMinY = Math.max(0, minY - padding);
    const boundedWidth = Math.max(800, (maxX - minX) + padding * 2);
    const boundedHeight = Math.max(600, (maxY - minY) + padding * 2);
    return {
      minX: boundedMinX,
      minY: boundedMinY,
      width: boundedWidth,
      height: boundedHeight,
    };
  }, [nodes, fullBounds]);

  const currentBounds = viewMode === "pipeline" ? pipelineBounds : fullBounds;

  // Viewport camera rect mapped to mini-map logical coordinates
  const logicalViewport = useMemo(() => {
    const unscaledScrollLeft = viewport.scrollLeft / zoom;
    const unscaledScrollTop = viewport.scrollTop / zoom;
    const unscaledClientWidth = viewport.clientWidth / zoom;
    const unscaledClientHeight = viewport.clientHeight / zoom;

    return {
      x: unscaledScrollLeft,
      y: unscaledScrollTop,
      width: unscaledClientWidth,
      height: unscaledClientHeight,
    };
  }, [viewport, zoom]);

  // Palette color styles by node type
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case "trigger":
        return { fill: "#10b981", stroke: "#059669", bgLight: "bg-emerald-500", text: "text-emerald-500" };
      case "data_source":
        return { fill: "#06b6d4", stroke: "#0891b2", bgLight: "bg-cyan-500", text: "text-cyan-500" };
      case "ai_process":
        return { fill: "#6366f1", stroke: "#4f46e5", bgLight: "bg-indigo-500", text: "text-indigo-500" };
      case "condition":
        return { fill: "#f59e0b", stroke: "#d97706", bgLight: "bg-amber-500", text: "text-amber-500" };
      case "permission_gate":
        return { fill: "#a855f7", stroke: "#9333ea", bgLight: "bg-purple-500", text: "text-purple-500" };
      case "human_review":
        return { fill: "#f97316", stroke: "#ea580c", bgLight: "bg-orange-500", text: "text-orange-500" };
      case "action_output":
        return { fill: "#3b82f6", stroke: "#2563eb", bgLight: "bg-blue-500", text: "text-blue-500" };
      default:
        return { fill: "#64748b", stroke: "#475569", bgLight: "bg-slate-500", text: "text-slate-500" };
    }
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case "trigger":
        return <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />;
      case "condition":
        return <GitFork className="w-3 h-3 text-amber-500 shrink-0" />;
      case "permission_gate":
        return <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />;
      case "human_review":
        return <UserCheck className="w-3 h-3 text-orange-500 shrink-0" />;
      case "action_output":
        return <Send className="w-3 h-3 text-blue-500 shrink-0" />;
      default:
        return <Layers className="w-3 h-3 text-indigo-500 shrink-0" />;
    }
  };

  // Center canvas on coordinates from mini-map click or drag
  const navigateCanvasToMapPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svgEl = mapSvgRef.current;
      const canvasEl = canvasRef.current;
      if (!svgEl || !canvasEl) return;

      const rect = svgEl.getBoundingClientRect();
      const clickRatioX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const clickRatioY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      const targetLogicalCenterX = currentBounds.minX + clickRatioX * currentBounds.width;
      const targetLogicalCenterY = currentBounds.minY + clickRatioY * currentBounds.height;

      const targetScrollLeft = (targetLogicalCenterX - logicalViewport.width / 2) * zoom;
      const targetScrollTop = (targetLogicalCenterY - logicalViewport.height / 2) * zoom;

      canvasEl.scrollLeft = Math.max(
        0,
        Math.min(fullBounds.width * zoom - viewport.clientWidth, targetScrollLeft)
      );
      canvasEl.scrollTop = Math.max(
        0,
        Math.min(fullBounds.height * zoom - viewport.clientHeight, targetScrollTop)
      );
    },
    [currentBounds, fullBounds, logicalViewport, zoom, canvasRef, viewport]
  );

  // Mini-map SVG pointer interactions (panning main canvas)
  const handleMapPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPanningViewport(true);
    navigateCanvasToMapPoint(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isPanningViewport) return;

    const handlePointerMove = (e: PointerEvent) => {
      navigateCanvasToMapPoint(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      setIsPanningViewport(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isPanningViewport, navigateCanvasToMapPoint]);

  // Window drag handler for repositioning mini-map freely
  const handleWindowDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const containerEl = containerRef?.current || minimapContainerRef.current?.parentElement;
    const currentEl = minimapContainerRef.current;
    if (!containerEl || !currentEl) return;

    const parentRect = containerEl.getBoundingClientRect();
    const currentRect = currentEl.getBoundingClientRect();

    const currentX = currentRect.left - parentRect.left;
    const currentY = currentRect.top - parentRect.top;

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };

    setIsDraggingWindow(true);
  };

  useEffect(() => {
    if (!isDraggingWindow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const containerEl = containerRef?.current || minimapContainerRef.current?.parentElement;
      const currentEl = minimapContainerRef.current;
      if (!containerEl || !currentEl) return;

      const parentRect = containerEl.getBoundingClientRect();
      const currentRect = currentEl.getBoundingClientRect();

      const deltaX = e.clientX - dragStartRef.current.startMouseX;
      const deltaY = e.clientY - dragStartRef.current.startMouseY;

      let newX = dragStartRef.current.initialX + deltaX;
      let newY = dragStartRef.current.initialY + deltaY;

      // Clamp within parent container boundaries
      const maxX = parentRect.width - currentRect.width - 12;
      const maxY = parentRect.height - currentRect.height - 12;

      newX = Math.max(12, Math.min(maxX, newX));
      newY = Math.max(12, Math.min(maxY, newY));

      setMapPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingWindow(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingWindow, containerRef]);

  // Reset mini-map back to corner dock
  const handleResetPosition = () => {
    setMapPosition(null);
  };

  // Toggle corner dock
  const handleCycleCorner = () => {
    setMapPosition(null);
    setDockCorner((prev) => {
      if (prev === "bottom-right") return "bottom-left";
      if (prev === "bottom-left") return "top-right";
      return "bottom-right";
    });
  };

  // Recenter & Fit all nodes inside the viewport
  const handleFitToContent = () => {
    const canvasEl = canvasRef.current;
    if (!canvasEl || nodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + 230);
      maxY = Math.max(maxY, n.position.y + 120);
    });

    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const availableWidth = canvasEl.clientWidth;
    const availableHeight = canvasEl.clientHeight;

    const optimalZoom = Math.min(
      1.1,
      Math.max(0.5, Math.min(availableWidth / contentWidth, availableHeight / contentHeight))
    );

    setZoom(parseFloat(optimalZoom.toFixed(2)));

    // Scroll to center on the nodes
    setTimeout(() => {
      if (!canvasRef.current) return;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      canvasRef.current.scrollTo({
        left: centerX * optimalZoom - availableWidth / 2,
        top: centerY * optimalZoom - availableHeight / 2,
        behavior: "smooth",
      });
    }, 60);
  };

  // Jump to single node from mini-map click or quick jump
  const handleJumpToNode = (node: WorkflowNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSelectNode) onSelectNode(node.id);

    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const targetX = (node.position.x + 115) * zoom - canvasEl.clientWidth / 2;
    const targetY = (node.position.y + 60) * zoom - canvasEl.clientHeight / 2;

    canvasEl.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: "smooth",
    });
  };

  // Jump to next node with validation issue
  const handleJumpToNextError = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!validationReport || validationReport.errors.length === 0) return;

    const errorNodeIds = Array.from(validationReport.nodeErrorMap.keys());
    if (errorNodeIds.length === 0) return;

    const nextIndex = currentErrorCycleIndex % errorNodeIds.length;
    const targetNodeId = errorNodeIds[nextIndex];
    const targetNode = nodes.find((n) => n.id === targetNodeId);

    if (targetNode) {
      handleJumpToNode(targetNode);
      setCurrentErrorCycleIndex((prev) => prev + 1);
    }
  };

  const totalErrors = validationReport?.errors.length || 0;

  // Filtered nodes for quick jump search
  const filteredQuickJumpNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch = n.name.toLowerCase().includes(quickJumpSearch.toLowerCase()) ||
        n.type.toLowerCase().includes(quickJumpSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (quickJumpFilter === "all") return true;
      if (quickJumpFilter === "issues") {
        return validationReport?.nodeErrorMap.has(n.id);
      }
      return n.type === quickJumpFilter;
    });
  }, [nodes, quickJumpSearch, quickJumpFilter, validationReport]);

  if (!isMinimapVisible) return null;

  // Corner positioning style when not manually dragged
  const getCornerStyle = () => {
    if (mapPosition) {
      return {
        left: `${mapPosition.x}px`,
        top: `${mapPosition.y}px`,
      };
    }
    switch (dockCorner) {
      case "bottom-left":
        return { left: "20px", bottom: "20px" };
      case "top-right":
        return { right: "20px", top: "70px" };
      case "bottom-right":
      default:
        return { right: "20px", bottom: "20px" };
    }
  };

  const minimapWidthClass = isExpandedRadar ? "w-[360px]" : "w-[270px]";
  const minimapCanvasHeightClass = isExpandedRadar ? "h-[220px]" : "h-[160px]";

  return (
    <div
      ref={minimapContainerRef}
      id="workflow-minimap-container"
      style={getCornerStyle()}
      className={`absolute z-30 select-none transition-shadow ${
        isDraggingWindow ? "shadow-2xl opacity-90 scale-[1.01]" : "shadow-xl"
      }`}
    >
      {/* Collapsed State Pill */}
      {isCollapsed ? (
        <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-lg">
          <button
            id="btn-minimap-expand"
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Expand Mini-Map"
          >
            <Map className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mini-Map</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
              {nodes.length}
            </span>
            {totalErrors > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {totalErrors}
              </span>
            )}
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      ) : (
        /* Expanded Mini-Map Window */
        <div className={`${minimapWidthClass} rounded-2xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 flex flex-col transition-all duration-200`}>
          {/* Draggable Header Bar */}
          <div
            onMouseDown={handleWindowDragStart}
            className="px-2.5 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between cursor-grab active:cursor-grabbing text-slate-700 dark:text-slate-300"
            title="Drag to reposition anywhere on canvas"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <Map className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-bold tracking-tight">Mini-Map</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {nodes.length}
              </span>
              {totalErrors > 0 && (
                <button
                  id="btn-minimap-jump-error"
                  type="button"
                  onClick={handleJumpToNextError}
                  title={`${totalErrors} validation issues. Click to jump to next broken node.`}
                  className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-0.5 transition-colors animate-pulse"
                >
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>{totalErrors}</span>
                </button>
              )}
            </div>

            {/* Header Quick Controls */}
            <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
              {/* Quick Jump Search Button */}
              <button
                id="btn-minimap-quick-jump"
                type="button"
                onClick={() => setShowQuickJump(!showQuickJump)}
                title="Quick Jump to Pipeline Node (Search & Filter)"
                className={`p-1 rounded transition-colors ${
                  showQuickJump 
                    ? "bg-indigo-600 text-white" 
                    : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
              </button>

              {/* View Extents Toggle (Pipeline Focus vs Full Workspace) */}
              <button
                type="button"
                onClick={() => setViewMode((v) => (v === "full" ? "pipeline" : "full"))}
                title={viewMode === "full" ? "Focus on Pipeline Nodes" : "View Full Infinite Canvas"}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-[10px] font-bold"
              >
                {viewMode === "full" ? "Full" : "Fit"}
              </button>

              {/* Resize Radar Toggle */}
              <button
                type="button"
                onClick={() => setIsExpandedRadar(!isExpandedRadar)}
                title={isExpandedRadar ? "Compact Radar Size" : "Expand Radar Size for Large Pipelines"}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isExpandedRadar ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>

              {/* Corner Dock / Reset Button */}
              <button
                type="button"
                onClick={mapPosition ? handleResetPosition : handleCycleCorner}
                title={mapPosition ? "Snap back to corner dock" : `Cycle dock corner (Current: ${dockCorner})`}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {mapPosition ? <RotateCcw className="w-3 h-3" /> : <CornerDownRight className="w-3 h-3" />}
              </button>

              {/* Minimize Mini-Map */}
              <button
                id="btn-minimap-minimize"
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Minimize Mini-Map"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* QUICK-JUMP NODE SEARCH OVERLAY */}
          {showQuickJump && (
            <div className="p-2.5 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Quick jump to node..."
                  value={quickJumpSearch}
                  onChange={(e) => setQuickJumpSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  autoFocus
                />
                {quickJumpSearch && (
                  <button onClick={() => setQuickJumpSearch("")} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setQuickJumpFilter("all")}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    quickJumpFilter === "all"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All ({nodes.length})
                </button>
                {totalErrors > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuickJumpFilter("issues")}
                    className={`px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                      quickJumpFilter === "issues"
                        ? "bg-rose-600 text-white"
                        : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>Issues ({totalErrors})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setQuickJumpFilter("trigger")}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    quickJumpFilter === "trigger"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Triggers
                </button>
                <button
                  type="button"
                  onClick={() => setQuickJumpFilter("condition")}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    quickJumpFilter === "condition"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Decisions
                </button>
              </div>

              {/* Node Jump List */}
              <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredQuickJumpNodes.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs italic">
                    No matching pipeline nodes found
                  </div>
                ) : (
                  filteredQuickJumpNodes.map((n) => {
                    const hasErrors = validationReport?.nodeErrorMap.has(n.id);
                    const isSelected = selectedNodeId === n.id || selectedNodeIds.includes(n.id);

                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          handleJumpToNode(n);
                          setShowQuickJump(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getNodeIcon(n.type)}
                          <span className="truncate">{n.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasErrors && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Has validation issue" />
                          )}
                          <span className="text-[9px] font-mono text-slate-400">
                            ({Math.round(n.position.x)}, {Math.round(n.position.y)})
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Interactive Radar Map Canvas */}
          <div className={`relative w-full ${minimapCanvasHeightClass} bg-slate-100 dark:bg-slate-950/90 overflow-hidden cursor-crosshair`}>
            {/* Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.4) 1px, transparent 1px)`,
                backgroundSize: "16px 16px",
              }}
            />

            {/* SVG Mini-Map Rendering */}
            <svg
              ref={mapSvgRef}
              viewBox={`${currentBounds.minX} ${currentBounds.minY} ${currentBounds.width} ${currentBounds.height}`}
              preserveAspectRatio="none"
              onPointerDown={handleMapPointerDown}
              className="w-full h-full block"
            >
              {/* Mini Connection Paths */}
              {connections.map((conn) => {
                const source = nodes.find((n) => n.id === conn.from);
                const target = nodes.find((n) => n.id === conn.to);
                if (!source || !target) return null;

                const isConditionSource = source.type === "condition";
                const isTrue = conn.branchType === "true" || conn.fromPort === "true";
                const isFalse = conn.branchType === "false" || conn.fromPort === "false";
                const isBroken = validationReport?.brokenConnectionIds.has(conn.id);

                const startX = source.position.x + 230;
                const startY = source.position.y + (isConditionSource ? (isTrue ? 35 : 85) : 60);
                const endX = target.position.x;
                const endY = target.position.y + 60;

                const midX = (startX + endX) / 2;
                const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                let strokeColor = "#94a3b8"; // Slate
                if (isBroken) strokeColor = "#f43f5e";
                else if (isTrue) strokeColor = "#10b981";
                else if (isFalse) strokeColor = "#f43f5e";
                else strokeColor = "#6366f1";

                return (
                  <path
                    key={conn.id}
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isBroken ? 18 : 12}
                    strokeDasharray={isBroken ? "24,16" : undefined}
                    opacity={0.7}
                  />
                );
              })}

              {/* Mini Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id || selectedNodeIds.includes(node.id);
                const colors = getNodeColor(node.type);
                const hasErrors = validationReport?.nodeErrorMap.has(node.id);
                const isHovered = hoveredNode?.id === node.id;

                const nodeWidth = 230;
                const nodeHeight = 85;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => handleJumpToNode(node, e)}
                  >
                    {/* Outer glow for selected or invalid nodes */}
                    {(isSelected || hasErrors) && (
                      <rect
                        x={node.position.x - 14}
                        y={node.position.y - 14}
                        width={nodeWidth + 28}
                        height={nodeHeight + 28}
                        rx={20}
                        fill={hasErrors ? "rgba(244, 63, 94, 0.45)" : "rgba(99, 102, 241, 0.45)"}
                      />
                    )}

                    {/* Node Body Card */}
                    <rect
                      x={node.position.x}
                      y={node.position.y}
                      width={nodeWidth}
                      height={nodeHeight}
                      rx={16}
                      fill={colors.fill}
                      stroke={
                        hasErrors
                          ? "#f43f5e"
                          : isSelected
                          ? "#ffffff"
                          : isHovered
                          ? "#ffffff"
                          : colors.stroke
                      }
                      strokeWidth={hasErrors ? 18 : isSelected ? 18 : 8}
                      opacity={isHovered ? 1 : 0.92}
                    />

                    {/* Node Header Bar accent */}
                    <rect
                      x={node.position.x}
                      y={node.position.y}
                      width={nodeWidth}
                      height={24}
                      rx={16}
                      fill="rgba(0,0,0,0.2)"
                    />

                    {/* Node Title Text */}
                    <text
                      x={node.position.x + 16}
                      y={node.position.y + 56}
                      fontSize={34}
                      fontWeight="bold"
                      fill="#ffffff"
                      fontFamily="system-ui, sans-serif"
                    >
                      {node.name.length > 13 ? `${node.name.slice(0, 12)}…` : node.name}
                    </text>

                    {/* Error warning badge */}
                    {hasErrors && (
                      <circle
                        cx={node.position.x + nodeWidth - 10}
                        cy={node.position.y + 10}
                        r={20}
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth={5}
                      />
                    )}
                  </g>
                );
              })}

              {/* Viewport Viewfinder Camera Box (Draggable / Navigable) */}
              <g className="cursor-grab active:cursor-grabbing">
                <rect
                  x={logicalViewport.x}
                  y={logicalViewport.y}
                  width={logicalViewport.width}
                  height={logicalViewport.height}
                  fill="rgba(99, 102, 241, 0.18)"
                  stroke="#6366f1"
                  strokeWidth={14}
                  strokeDasharray="30, 16"
                  rx={16}
                />
                {/* Viewfinder Center Crosshair Dot */}
                <circle
                  cx={logicalViewport.x + logicalViewport.width / 2}
                  cy={logicalViewport.y + logicalViewport.height / 2}
                  r={22}
                  fill="#6366f1"
                  opacity={0.8}
                />
                <circle
                  cx={logicalViewport.x + logicalViewport.width / 2}
                  cy={logicalViewport.y + logicalViewport.height / 2}
                  r={8}
                  fill="#ffffff"
                />
              </g>
            </svg>

            {/* Hover Tooltip for hovered node */}
            {hoveredNode && (
              <div
                className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-slate-900/95 text-white text-[10px] truncate pointer-events-none shadow-md border border-slate-700 flex items-center justify-between animate-in fade-in"
              >
                <span className="font-bold truncate">{hoveredNode.name}</span>
                <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-bold ml-1.5 shrink-0">
                  {hoveredNode.type.replace("_", " ")}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Zoom & Quick Controls Bar */}
          <div className="px-2.5 py-1.5 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, parseFloat((z - 0.1).toFixed(2))))}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono text-[10px] font-bold w-10 text-center text-slate-700 dark:text-slate-200">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.5, parseFloat((z + 0.1).toFixed(2))))}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFitToContent}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1"
                title="Fit and center entire workflow pipeline into canvas viewport"
              >
                <LocateFixed className="w-2.5 h-2.5" />
                <span>Fit Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
