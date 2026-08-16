import React, { useState } from "react";
import { AssetItem, AssetDirectory, Department, AssetType } from "../types";
import { INITIAL_ASSET_DIRECTORIES } from "../data/initialAssets";
import { 
  Folder, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Eye, 
  Shirt, 
  Palette, 
  Network, 
  BookOpen, 
  Layers, 
  ExternalLink, 
  RefreshCw, 
  Tag, 
  Grid, 
  List, 
  X, 
  ArrowUpRight, 
  FolderPlus,
  UploadCloud,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Wand2
} from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { fireCelebration } from "../utils/confetti";

interface AssetGalleryProps {
  assets: AssetItem[];
  directories?: AssetDirectory[];
  onAddAsset: (newAsset: AssetItem) => void;
  onDeleteAsset: (assetId: string) => void;
  onUpdateAsset?: (updated: AssetItem) => void;
  onAttachToWorkflowNode?: (asset: AssetItem, workflowId?: string, nodeId?: string) => void;
  isPickerMode?: boolean;
  selectedAssetIds?: string[];
  onSelectAssetForNode?: (asset: AssetItem) => void;
  onClosePicker?: () => void;
}

export const AssetGallery: React.FC<AssetGalleryProps> = ({
  assets,
  directories = INITIAL_ASSET_DIRECTORIES,
  onAddAsset,
  onDeleteAsset,
  onUpdateAsset,
  onAttachToWorkflowNode,
  isPickerMode = false,
  selectedAssetIds = [],
  onSelectAssetForNode,
  onClosePicker,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedDirectory, setSelectedDirectory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<"all" | "local" | "presets">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Inspection Modal
  const [inspectedAsset, setInspectedAsset] = useState<AssetItem | null>(null);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  // Local Asset Generation / Upload Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [genTitle, setGenTitle] = useState<string>("");
  const [genDescription, setGenDescription] = useState<string>("");
  const [genDepartment, setGenDepartment] = useState<Department>("Marketing");
  const [genDirectory, setGenDirectory] = useState<string>("creative/apparel/shirts");
  const [genCategory, setGenCategory] = useState<string>("Apparel & Shirt Designs");
  const [genType, setGenType] = useState<AssetType>("image");
  const [genPrompt, setGenPrompt] = useState<string>("");
  const [genStylePreset, setGenStylePreset] = useState<string>("Cyberpunk Neon");
  const [genCustomUrl, setGenCustomUrl] = useState<string>("");
  const [genTags, setGenTags] = useState<string>("Apparel, Shirt Design, Merch");
  const [isGeneratingLocally, setIsGeneratingLocally] = useState<boolean>(false);

  // Creative apparel presets for fast 1-click inspiration
  const APPAREL_INSPIRATIONS = [
    {
      title: "Solarpunk Bio-Architecture Graphic Tee",
      prompt: "Solarpunk futuristic city with cascading vertical gardens and solar sails, clean white backdrop, vector streetwear screenprint",
      category: "Apparel & Shirt Designs",
      directory: "creative/apparel/shirts",
      department: "Marketing" as Department,
      style: "Solarpunk Botanical",
      url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
    },
    {
      title: "Quantum Neural Chip Oversized Crewneck",
      prompt: "Isometric glowing quantum processor core with floating logic gates, dark matte fabric texture, metallic copper and electric teal print",
      category: "Apparel & Shirt Designs",
      directory: "creative/apparel/shirts",
      department: "Marketing" as Department,
      style: "Cyberpunk Hardware",
      url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
    },
    {
      title: "Distressed SRE War-Room Incident Tee",
      prompt: "Vintage distressed aviation typography 'SRE STATUS 200 OK' with tactical grid overlay, washed charcoal cotton wash",
      category: "Apparel & Shirt Designs",
      directory: "creative/apparel/shirts",
      department: "Engineering" as Department,
      style: "Vintage Technical",
      url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    },
  ];

  // Filtering Logic
  const filteredAssets = assets.filter((asset) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = asset.title.toLowerCase().includes(q);
      const matchDesc = asset.description.toLowerCase().includes(q);
      const matchDir = asset.directory.toLowerCase().includes(q);
      const matchTags = asset.tags.some((t) => t.toLowerCase().includes(q));
      const matchPrompt = asset.generationPrompt?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchDir && !matchTags && !matchPrompt) return false;
    }

    // Department filter
    if (selectedDepartment !== "all" && asset.department !== selectedDepartment) {
      return false;
    }

    // Directory filter
    if (selectedDirectory !== "all" && asset.directory !== selectedDirectory) {
      return false;
    }

    // Type filter
    if (selectedType !== "all" && asset.type !== selectedType) {
      return false;
    }

    // Local vs Presets
    if (filterSource === "local" && !asset.isLocallyGenerated) return false;
    if (filterSource === "presets" && asset.isLocallyGenerated) return false;

    return true;
  });

  const totalLocalCount = assets.filter((a) => a.isLocallyGenerated).length;
  const creativeApparelCount = assets.filter((a) => a.directory.includes("creative/apparel")).length;

  const handleCopyPath = (asset: AssetItem) => {
    const textToCopy = `asset_ref("${asset.directory}/${asset.id}", type="${asset.type}")`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAssetId(asset.id);
    setTimeout(() => setCopiedAssetId(null), 2000);
  };

  const handleCreateLocalAsset = () => {
    if (!genTitle.trim()) return;

    setIsGeneratingLocally(true);

    setTimeout(() => {
      // Default fallback images matching department/style
      let finalUrl = genCustomUrl.trim();
      if (!finalUrl) {
        if (genDirectory.includes("shirt") || genCategory.includes("Apparel")) {
          finalUrl = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";
        } else if (genDepartment === "Engineering") {
          finalUrl = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80";
        } else if (genDepartment === "Finance & Legal") {
          finalUrl = "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80";
        } else {
          finalUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
        }
      }

      const parsedTags = genTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const newAsset: AssetItem = {
        id: `asset-local-${Date.now()}`,
        title: genTitle,
        description: genDescription || `Locally generated ${genCategory} asset for ${genDepartment} department automation tasks.`,
        type: genType,
        department: genDepartment,
        category: genCategory,
        directory: genDirectory,
        url: finalUrl,
        thumbnailUrl: finalUrl,
        fileSize: `${(Math.random() * 3 + 1.5).toFixed(1)} MB`,
        dimensions: genType === "image" ? "3600 x 4800 px (300 DPI)" : undefined,
        format: genType === "image" ? "PNG" : genType === "vector_svg" ? "SVG" : "PDF",
        tags: parsedTags.length > 0 ? parsedTags : ["Local Generation", genDepartment],
        createdAt: new Date().toISOString().split("T")[0],
        isLocallyGenerated: true,
        generationPrompt: genPrompt || `${genStylePreset} design for ${genTitle}`,
        attachedWorkflowCount: 0,
        metadata: {
          style: genStylePreset,
          author: "Alex Mercer (Local Studio)",
          aspectRatio: "3:4",
        },
      };

      onAddAsset(newAsset);
      setIsGeneratingLocally(false);
      setIsCreateModalOpen(false);
      setGenTitle("");
      setGenDescription("");
      setGenPrompt("");
      setGenCustomUrl("");
      fireCelebration();
    }, 600);
  };

  const handleApplyPresetInspiration = (item: typeof APPAREL_INSPIRATIONS[0]) => {
    setGenTitle(item.title);
    setGenPrompt(item.prompt);
    setGenCategory(item.category);
    setGenDirectory(item.directory);
    setGenDepartment(item.department);
    setGenStylePreset(item.style);
    setGenCustomUrl(item.url);
    setGenType("image");
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 dark:bg-slate-950 select-none ${isPickerMode ? "p-0" : "p-6"}`}>
      {/* Top Header & Context Stats */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Enterprise Asset Gallery & Local Storage</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                    {assets.length} Total Assets
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Organize, generate, and attach department images, shirt designs, specs, and templates directly to agent workflow pipelines.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isPickerMode && onClosePicker && (
              <button
                onClick={onClosePicker}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Close Picker
              </button>
            )}

            <button
              id="btn-open-generate-asset-modal"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate / Add Local Asset</span>
            </button>
          </div>
        </div>

        {/* Directory Quick Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => {
              setSelectedDirectory("all");
              setSelectedDepartment("all");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedDirectory === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>All Directories ({assets.length})</span>
          </button>

          {directories.map((dir) => {
            const count = assets.filter((a) => a.directory === dir.path).length;
            const isSelected = selectedDirectory === dir.path;
            return (
              <button
                key={dir.id}
                onClick={() => {
                  setSelectedDirectory(dir.path);
                  setSelectedDepartment(dir.department);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                }`}
              >
                <DynamicIcon name={dir.iconName} className="w-3.5 h-3.5" />
                <span>{dir.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search shirt designs, prompt keywords, SVG brand marks, PDF specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Dropdown */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Departments</option>
              <option value="Marketing">Creative & Marketing</option>
              <option value="Engineering">Engineering & DevOps</option>
              <option value="Finance & Legal">Finance & Legal</option>
              <option value="Customer Support">Customer Support</option>
              <option value="HR & People Ops">HR & People</option>
            </select>

            {/* Type Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Asset Types</option>
              <option value="image">Images & Shirts (PNG/JPG)</option>
              <option value="vector_svg">Vector SVGs</option>
              <option value="document">Documents (PDF/Doc)</option>
              <option value="template">Templates (CSV/Sheets)</option>
              <option value="code_snippet">Code & Schemas</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Source Pill Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setFilterSource("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterSource === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSource("local")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  filterSource === "local"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Local Gen ({totalLocalCount})</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Asset Display */}
      {filteredAssets.length === 0 ? (
        <div className="flex-1 p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center">
            <Folder className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No assets found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting your search keywords, department filter, or generate a new apparel/document asset.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700"
          >
            Generate New Asset
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-12">
          {filteredAssets.map((asset) => {
            const isAttached = selectedAssetIds.includes(asset.id);

            return (
              <div
                key={asset.id}
                className={`group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isAttached
                    ? "ring-2 ring-indigo-500 border-indigo-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer" onClick={() => setInspectedAsset(asset)}>
                  <img
                    src={asset.url}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider">
                      {asset.format}
                    </span>
                    {asset.isLocallyGenerated && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Local Gen</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedAsset(asset);
                      }}
                      className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-md"
                      title="Inspect Asset"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPath(asset);
                      }}
                      className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-md"
                      title="Copy Reference"
                    >
                      {copiedAssetId === asset.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Directory pill bottom */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-md text-slate-200 font-semibold truncate block">
                      📁 {asset.directory}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                        {asset.title}
                      </h3>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {asset.description}
                    </p>

                    {/* Tag list */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {asset.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {asset.fileSize} {asset.dimensions ? `• ${asset.dimensions.split(" ")[0]}` : ""}
                    </span>

                    {isPickerMode ? (
                      <button
                        onClick={() => onSelectAssetForNode && onSelectAssetForNode(asset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          isAttached
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {isAttached ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>{isAttached ? "Attached" : "Attach"}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setInspectedAsset(asset)}
                          className="px-2 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onDeleteAsset(asset.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-3">Directory / Path</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Format / Size</th>
                <th className="py-3 px-3">Workflows</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={asset.url}
                        alt={asset.title}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{asset.title}</span>
                          {asset.isLocallyGenerated && (
                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {asset.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {asset.directory}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                      {asset.department}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">
                    <span className="font-bold">{asset.format}</span> ({asset.fileSize})
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500">
                    {asset.attachedWorkflowCount || 0} active
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopyPath(asset)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Copy Reference"
                      >
                        {copiedAssetId === asset.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setInspectedAsset(asset)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100"
                      >
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: INSPECT ASSET DETAILS */}
      {inspectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Left: High Res Image Preview */}
            <div className="md:w-1/2 bg-slate-950 flex items-center justify-center p-6 relative">
              <img
                src={inspectedAsset.url}
                alt={inspectedAsset.title}
                referrerPolicy="no-referrer"
                className="max-h-96 w-auto object-contain rounded-xl shadow-lg"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase">
                  {inspectedAsset.format}
                </span>
              </div>
            </div>

            {/* Right: Metadata, Prompt, Palette, Directory */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {inspectedAsset.category}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {inspectedAsset.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setInspectedAsset(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {inspectedAsset.description}
                </p>

                {/* Directory & Reference Box */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Directory Path:</div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold flex items-center justify-between">
                    <span>{inspectedAsset.directory}</span>
                    <button
                      onClick={() => handleCopyPath(inspectedAsset)}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 text-[10px] text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1"
                    >
                      {copiedAssetId === inspectedAsset.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Ref</span>
                    </button>
                  </div>
                </div>

                {/* Prompt Breakdown if locally generated */}
                {inspectedAsset.generationPrompt && (
                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                    <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Generation Prompt:</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-snug">
                      "{inspectedAsset.generationPrompt}"
                    </p>
                  </div>
                )}

                {/* Color Palette if present */}
                {inspectedAsset.metadata?.colorPalette && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Color Palette Extract:</div>
                    <div className="flex items-center gap-2">
                      {inspectedAsset.metadata.colorPalette.map((hex, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-[10px] font-mono text-slate-500">{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <a
                  href={inspectedAsset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Asset</span>
                </a>

                {isPickerMode && onSelectAssetForNode ? (
                  <button
                    onClick={() => {
                      onSelectAssetForNode(inspectedAsset);
                      setInspectedAsset(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                  >
                    Attach to Node
                  </button>
                ) : (
                  <button
                    onClick={() => setInspectedAsset(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LOCAL ASSET GENERATION / STORAGE STUDIO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Local Asset Generation & Directory Storage
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create creative shirt designs, marketing graphics, or specs to attach to automated pipelines.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Inspiration Presets for Apparel & Shirt Designs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Quick Creative Shirt Design Inspirations (1-Click Fill):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {APPAREL_INSPIRATIONS.map((insp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPresetInspiration(insp)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 hover:border-indigo-400 text-left space-y-1 transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 truncate">
                      {insp.title}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">
                      {insp.style} • {insp.department}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyberpunk Neon Samurai Graphic Tee"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={genDepartment}
                  onChange={(e) => {
                    const dept = e.target.value as Department;
                    setGenDepartment(dept);
                    if (dept === "Marketing") {
                      setGenDirectory("creative/apparel/shirts");
                      setGenCategory("Apparel & Shirt Designs");
                    } else if (dept === "Engineering") {
                      setGenDirectory("engineering/blueprints/system");
                      setGenCategory("System Architecture & Specs");
                    } else if (dept === "Finance & Legal") {
                      setGenDirectory("finance/templates/invoices");
                      setGenCategory("Invoices & Compliance Sheets");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="Marketing">Creative & Marketing</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="HR & People Ops">HR & People Ops</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Directory Path
                </label>
                <input
                  type="text"
                  placeholder="creative/apparel/shirts"
                  value={genDirectory}
                  onChange={(e) => setGenDirectory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asset Format / Type
                </label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as AssetType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="image">Graphic Image (PNG / Print 300 DPI)</option>
                  <option value="vector_svg">Vector SVG Graphic</option>
                  <option value="document">Document / PDF Spec</option>
                  <option value="template">Spreadsheet Template / CSV</option>
                  <option value="code_snippet">JSON Schema / Code</option>
                </select>
              </div>
            </div>

            {/* Prompt / Generation Directive */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Generation Prompt / Design Directive
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cyberpunk neon samurai mask with kanji typography, 300 DPI silk screen vector graphic for black oversized apparel tee."
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Optional Custom Image URL */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Image / Preview URL (Optional - Leave blank for auto-generation)
              </label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/... or data:image/png..."
                value={genCustomUrl}
                onChange={(e) => setGenCustomUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="Apparel, Shirt Design, Merch, Cyberpunk"
                value={genTags}
                onChange={(e) => setGenTags(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLocalAsset}
                disabled={!genTitle.trim() || isGeneratingLocally}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingLocally ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{isGeneratingLocally ? "Synthesizing Asset..." : "Save to Local Asset Gallery"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
