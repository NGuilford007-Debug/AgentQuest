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
  RotateCcw
} from "lucide-react";

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
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<WorkflowNode | null>(null);

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

    el.addEventListener("scroll", updateViewport, { passive: true });
    window.addEventListener("resize", updateViewport);

    // Initial read
    updateViewport();

    return () => {
      el.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [canvasRef, updateViewport, zoom]);

  // Dynamic canvas bounds to fit all nodes + comfortable margin
  const bounds = useMemo(() => {
    let maxX = 3200;
    let maxY = 2200;
    nodes.forEach((node) => {
      if (node.position.x + 350 > maxX) maxX = node.position.x + 350;
      if (node.position.y + 250 > maxY) maxY = node.position.y + 250;
    });
    return { width: maxX, height: maxY };
  }, [nodes]);

  // Logical camera coordinates on the canvas
  const logicalViewport = useMemo(() => {
    const logicalX = Math.max(0, viewport.scrollLeft / zoom);
    const logicalY = Math.max(0, viewport.scrollTop / zoom);
    const logicalW = Math.min(bounds.width, viewport.clientWidth / zoom);
    const logicalH = Math.min(bounds.height, viewport.clientHeight / zoom);
    return { x: logicalX, y: logicalY, width: logicalW, height: logicalH };
  }, [viewport, zoom, bounds]);

  // Node color helper for the mini-map SVG
  const getNodeColor = (type: NodeType): { fill: string; stroke: string } => {
    switch (type) {
      case "trigger":
        return { fill: "#f59e0b", stroke: "#d97706" };
      case "data_source":
        return { fill: "#10b981", stroke: "#059669" };
      case "ai_process":
        return { fill: "#6366f1", stroke: "#4f46e5" };
      case "condition":
        return { fill: "#06b6d4", stroke: "#0891b2" };
      case "permission_gate":
        return { fill: "#a855f7", stroke: "#9333ea" };
      case "human_review":
        return { fill: "#f97316", stroke: "#ea580c" };
      case "action_output":
        return { fill: "#3b82f6", stroke: "#2563eb" };
      default:
        return { fill: "#64748b", stroke: "#475569" };
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

      const targetLogicalCenterX = clickRatioX * bounds.width;
      const targetLogicalCenterY = clickRatioY * bounds.height;

      const targetScrollLeft = (targetLogicalCenterX - logicalViewport.width / 2) * zoom;
      const targetScrollTop = (targetLogicalCenterY - logicalViewport.height / 2) * zoom;

      canvasEl.scrollLeft = Math.max(
        0,
        Math.min(bounds.width * zoom - viewport.clientWidth, targetScrollLeft)
      );
      canvasEl.scrollTop = Math.max(
        0,
        Math.min(bounds.height * zoom - viewport.clientHeight, targetScrollTop)
      );
    },
    [bounds, logicalViewport, zoom, canvasRef, viewport]
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

  // Window drag handlers for repositioning the mini-map widget
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

  // Reset mini-map back to default bottom-right position
  const handleResetPosition = () => {
    setMapPosition(null);
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

  // Jump to single node from mini-map click
  const handleNodeClick = (node: WorkflowNode, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const totalErrors = validationReport?.errors.length || 0;

  return (
    <div
      ref={minimapContainerRef}
      id="workflow-minimap-container"
      style={
        mapPosition
          ? {
              left: `${mapPosition.x}px`,
              top: `${mapPosition.y}px`,
            }
          : {
              right: "20px",
              bottom: "20px",
            }
      }
      className={`absolute z-30 select-none transition-shadow ${
        isDraggingWindow ? "shadow-2xl opacity-90 scale-[1.01]" : "shadow-xl"
      }`}
    >
      {/* Collapsed State Pill */}
      {isCollapsed ? (
        <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-lg">
          <button
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
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {totalErrors}
              </span>
            )}
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      ) : (
        /* Expanded Mini-Map Window */
        <div className="w-[260px] rounded-2xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/90 flex flex-col">
          {/* Draggable Header Bar */}
          <div
            onMouseDown={handleWindowDragStart}
            className="px-2.5 py-2 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between cursor-grab active:cursor-grabbing text-slate-700 dark:text-slate-300"
            title="Drag to reposition mini-map"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <Map className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-bold tracking-tight">Mini-Map</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {nodes.length}
              </span>
              {totalErrors > 0 && (
                <span
                  title={`${totalErrors} validation issue${totalErrors > 1 ? "s" : ""}`}
                  className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white flex items-center gap-0.5"
                >
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>{totalErrors}</span>
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
              {mapPosition && (
                <button
                  type="button"
                  onClick={handleResetPosition}
                  title="Snap back to bottom-right"
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={handleFitToContent}
                title="Fit & Center Pipeline"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <LocateFixed className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Minimize Mini-Map"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Radar Map Canvas */}
          <div className="relative w-full h-[160px] bg-slate-100 dark:bg-slate-950/90 overflow-hidden cursor-crosshair">
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
              viewBox={`0 0 ${bounds.width} ${bounds.height}`}
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
                    onClick={(e) => handleNodeClick(node, e)}
                  >
                    {/* Outer glow for selected or invalid nodes */}
                    {(isSelected || hasErrors) && (
                      <rect
                        x={node.position.x - 14}
                        y={node.position.y - 14}
                        width={nodeWidth + 28}
                        height={nodeHeight + 28}
                        rx={20}
                        fill={hasErrors ? "rgba(244, 63, 94, 0.35)" : "rgba(99, 102, 241, 0.35)"}
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
                      strokeWidth={hasErrors ? 16 : isSelected ? 16 : 8}
                      opacity={isHovered ? 1 : 0.9}
                    />

                    {/* Node Header Bar accent */}
                    <rect
                      x={node.position.x}
                      y={node.position.y}
                      width={nodeWidth}
                      height={24}
                      rx={16}
                      fill="rgba(0,0,0,0.15)"
                    />

                    {/* Node Title Text */}
                    <text
                      x={node.position.x + 16}
                      y={node.position.y + 54}
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
                        r={18}
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth={4}
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
                className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] truncate pointer-events-none shadow-md border border-slate-700 flex items-center justify-between"
              >
                <span className="font-semibold truncate">{hoveredNode.name}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold ml-1.5 shrink-0">
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

            <button
              type="button"
              onClick={handleFitToContent}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1"
              title="Fit entire workflow into view"
            >
              <LocateFixed className="w-2.5 h-2.5" />
              <span>Center</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
