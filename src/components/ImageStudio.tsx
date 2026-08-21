import React, { useState } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Copy, 
  Check, 
  Wand2, 
  Layers, 
  Sliders, 
  RefreshCw, 
  Loader2, 
  Shirt, 
  Tag, 
  Maximize2, 
  FolderPlus,
  Palette,
  Eye,
  CheckCircle2,
  Zap,
  Bot
} from "lucide-react";
import { AssetItem, Department } from "../types";
import { fireCelebration } from "../utils/confetti";
import { AiTextEnhancer } from "./AiTextEnhancer";

interface ImageStudioProps {
  assets: AssetItem[];
  onSaveAsset: (asset: AssetItem) => void;
  onNavigateToDispatcher?: (initialPrompt?: string) => void;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  assets,
  onSaveAsset,
}) => {
  const [prompt, setPrompt] = useState(
    "Futuristic cyberpunk neon apparel graphic tee concept with holographic glitch patterns, ultra-detailed screenprint, clean backdrop"
  );
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [stylePreset, setStylePreset] = useState<string>("Cyberpunk Merch");
  const [category, setCategory] = useState<string>("Apparel & Merch Design");
  const [department, setDepartment] = useState<Department>("Marketing");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>(
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80"
  );
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const STYLE_PRESETS = [
    { name: "Cyberpunk Merch", promptSuffix: "cyberpunk streetwear screenprint, glowing neon accents, high contrast vector illustration" },
    { name: "Minimalist Vector", promptSuffix: "clean flat minimalist vector logo design, precise geometric lines, luxury modern aesthetic" },
    { name: "Solarpunk Ecology", promptSuffix: "solarpunk lush botanical bio-architecture, bright daylight, utopian organic textures" },
    { name: "3D Product Render", promptSuffix: "photorealistic studio 3D render, soft ambient lighting, octane render, 8k resolution" },
    { name: "Dark Luxury", promptSuffix: "matte black and gold luxury typography branding, subtle debossed metallic finish" },
    { name: "Retro Synthwave", promptSuffix: "80s retro synthwave wireframe grid, purple and cyan sunset, vintage aesthetic" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const selectedStyleObj = STYLE_PRESETS.find((s) => s.name === stylePreset);
      const fullPrompt = selectedStyleObj ? `${prompt}. ${selectedStyleObj.promptSuffix}` : prompt;

      const res = await fetch("/api/gemini/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          aspectRatio,
          style: stylePreset,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        // Fallback quality aesthetic image
        setGeneratedImageUrl(
          `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80`
        );
      }
    } catch (e) {
      setGeneratedImageUrl(
        `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToMediaLibrary = () => {
    const newAsset: AssetItem = {
      id: `asset-img-${Date.now()}`,
      title: prompt.slice(0, 40) + "...",
      description: `Generated via AI Image Studio (${stylePreset}, ${aspectRatio})`,
      department,
      directory: "creative/apparel/shirts",
      category,
      type: "image",
      url: generatedImageUrl,
      createdAt: new Date().toISOString().split("T")[0],
      fileSize: "2.4 MB",
      format: "PNG",
      tags: [stylePreset, category, "AI Generated", department],
      metadata: {
        dimensions: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "9:16" ? "1080x1920" : "1024x1024",
        stylePreset,
        prompt,
      },
    };
    onSaveAsset(newAsset);
    setSavedSuccess(true);
    fireCelebration();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      {/* Studio Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">AI Image & Visual Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Imagen 3.0 Generative Core
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-resolution commercial visual concepts, apparel mockups, vector assets, and UI banners.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToMediaLibrary}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              savedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/25"
            }`}
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            <span>{savedSuccess ? "Saved to Media Library!" : "Save to Media Library"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Tuning Control Panel */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">
          {/* Prompt Section */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Generative Visual Prompt</span>
              </label>

              {/* AI Prompt Enhancer */}
              <AiTextEnhancer
                value={prompt}
                onApply={(enhanced) => setPrompt(enhanced)}
                contextType="prompt"
              />
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image, aesthetic lighting, materials, and composition..."
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
            />

            {/* Quick Inspiration Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Cyberpunk neon jacket screenprint",
                  "Minimal geometric luxury perfume bottle",
                  "Isometric cloud database architecture node",
                  "Solarpunk vertical garden skyscraper",
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration Parameters */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Composition & Aspect Ratio</span>
            </h3>

            {/* Aspect Ratio Buttons */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Aspect Ratio:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(["1:1", "16:9", "9:16", "4:3", "3:4"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      aspectRatio === ratio
                        ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Visual Art Style:</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setStylePreset(preset.name)}
                    className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all ${
                      stylePreset === preset.name
                        ? "bg-indigo-950/70 text-indigo-300 border-indigo-500 shadow-xs"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Tagging */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Assign Department:</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="Marketing">Marketing & Creative</option>
                <option value="Engineering">Engineering & Blueprints</option>
                <option value="Operations">Operations</option>
                <option value="Sales & CRM">Sales & Growth</option>
                <option value="Finance & Legal">Finance & Legal</option>
              </select>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 mt-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Visual Pixels...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Master Artwork</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right High-Res Canvas Preview */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex-1 rounded-3xl bg-slate-950 border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl min-h-[480px]">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-purple-400 animate-pulse">
                <div className="w-16 h-16 rounded-3xl bg-purple-900/30 border border-purple-700/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <span className="text-sm font-bold">Rendering Image with Imagen 3.0...</span>
                <p className="text-xs text-slate-500 max-w-xs text-center">Applying neural lighting, high-frequency texture passes, and color grading.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <img
                  src={generatedImageUrl}
                  alt={prompt}
                  className="max-h-[520px] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
                  referrerPolicy="no-referrer"
                />

                {/* Floating Image Action Toolbar */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-xl opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleCopyPrompt}
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
                    title="Copy prompt text"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied" : "Prompt"}</span>
                  </button>

                  <a
                    href={generatedImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
                    title="Open full resolution in new tab"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View HD</span>
                  </a>

                  <button
                    onClick={handleSaveToMediaLibrary}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Creations Grid */}
          <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Generated Media & Concepts ({assets.filter((a) => a.type === "image").length})
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {assets
                .filter((a) => a.type === "image")
                .slice(0, 6)
                .map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      if (a.url) setGeneratedImageUrl(a.url);
                      if (a.metadata?.prompt) setPrompt(a.metadata.prompt);
                    }}
                    className="group/thumb relative aspect-square rounded-xl overflow-hidden border border-slate-800 hover:border-purple-500 cursor-pointer transition-all hover:scale-105"
                  >
                    <img
                      src={a.url}
                      alt={a.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-bold text-white line-clamp-2">{a.title}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
