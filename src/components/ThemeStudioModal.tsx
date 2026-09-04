import React, { useState, useMemo } from "react";
import { 
  WorkplaceZoneTheme, 
  ALL_WORKPLACE_THEMES, 
  getWorkplaceTheme 
} from "../utils/workplaceThemes";
import { 
  Palette, 
  Check, 
  Sparkles, 
  X, 
  Volume2, 
  VolumeX, 
  Dices, 
  Sliders, 
  Layers, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Eye, 
  ArrowRight,
  Maximize2
} from "lucide-react";
import { playInteractiveSound } from "../utils/audioSynth";

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
  isPlayingAudio?: boolean;
  onToggleAudio?: () => void;
}

type FilterCategory = "all" | "cyber" | "luxe" | "tactical" | "nature" | "classic";

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({
  isOpen,
  onClose,
  activeThemeId,
  onSelectTheme,
  isPlayingAudio = false,
  onToggleAudio,
}) => {
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(activeThemeId);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [notification, setNotification] = useState<string | null>(null);

  // Sync preview with incoming active theme if opened fresh
  React.useEffect(() => {
    if (isOpen) {
      setSelectedPreviewId(activeThemeId);
    }
  }, [isOpen, activeThemeId]);

  const previewTheme = useMemo(() => {
    return getWorkplaceTheme(selectedPreviewId);
  }, [selectedPreviewId]);

  const activeTheme = useMemo(() => {
    return getWorkplaceTheme(activeThemeId);
  }, [activeThemeId]);

  const filteredThemes = useMemo(() => {
    if (activeCategory === "all") return ALL_WORKPLACE_THEMES;
    return ALL_WORKPLACE_THEMES.filter((t) => t.themeFamily === activeCategory);
  }, [activeCategory]);

  const handleApplyTheme = (themeId: string) => {
    onSelectTheme(themeId);
    setSelectedPreviewId(themeId);
    playInteractiveSound("chime");
    const theme = getWorkplaceTheme(themeId);
    setNotification(`✨ Applied "${theme.name}" as global workspace theme!`);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleRandomizeTheme = () => {
    const available = ALL_WORKPLACE_THEMES.filter((t) => t.id !== selectedPreviewId);
    const random = available[Math.floor(Math.random() * available.length)];
    if (random) {
      setSelectedPreviewId(random.id);
      playInteractiveSound("click");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden transition-all"
        style={{
          boxShadow: `0 0 50px -10px ${previewTheme.colors.primary}33, 0 25px 50px -12px rgba(0, 0, 0, 0.7)`
        }}
      >
        {/* Dynamic Ambient Aura Banner in Modal Header */}
        <div 
          className="absolute top-0 left-0 right-0 h-44 pointer-events-none opacity-40 transition-all duration-700"
          style={{ background: previewTheme.colors.ambientAura }}
        />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-7 pt-5 pb-4 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/10 transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${previewTheme.colors.primary}40, ${previewTheme.colors.secondary}20)`,
                boxShadow: `0 0 20px ${previewTheme.colors.primary}30`
              }}
            >
              {previewTheme.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Theme Studio & Environmental Aura
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {ALL_WORKPLACE_THEMES.length} Curated Themes
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switch app-wide aesthetics, radiant aura glows, color schemes, and cognitive productivity buffs.
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomizeTheme}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
              title="Roll a random theme"
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>Surprise Me</span>
            </button>

            {onToggleAudio && (
              <button
                onClick={onToggleAudio}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs border ${
                  isPlayingAudio
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-700"
                }`}
                title="Toggle ambient background soundscape"
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Ambient Active</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Muted</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert if applied */}
        {notification && (
          <div className="relative z-20 mx-5 mt-3 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-bold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Main Content: Split View (Themes Catalog + Live Preview Sandbox) */}
        <div className="relative z-10 flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
          
          {/* Left Column: Theme Picker Catalog with Category Filter */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Category Filter Pills */}
            <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-b border-slate-800/60">
              {(
                [
                  { id: "all", label: "All Themes", emoji: "✨" },
                  { id: "cyber", label: "Cyber & Synth", emoji: "⚡" },
                  { id: "luxe", label: "Luxe & Minimal", emoji: "👑" },
                  { id: "nature", label: "Nature & Zen", emoji: "🎋" },
                  { id: "tactical", label: "Tactical SRE", emoji: "🛡️" },
                  { id: "classic", label: "Social Classic", emoji: "☕" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? "bg-slate-100 text-slate-950 shadow-md"
                      : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Themes Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 max-h-[55vh] md:max-h-none">
              {filteredThemes.map((theme) => {
                const isGloballyActive = theme.id === activeThemeId;
                const isCurrentlyPreviewed = theme.id === selectedPreviewId;

                return (
                  <div
                    key={theme.id}
                    onClick={() => {
                      setSelectedPreviewId(theme.id);
                      playInteractiveSound("click");
                    }}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isCurrentlyPreviewed
                        ? `bg-slate-900/90 ${theme.colors.accentBorderStrong} ${theme.colors.accentGlow}`
                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Left info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border border-white/10 transition-transform group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}15)`,
                        }}
                      >
                        {theme.emoji}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-extrabold truncate ${isCurrentlyPreviewed ? theme.colors.accentText : "text-white group-hover:text-slate-100"}`}>
                            {theme.name}
                          </h4>
                          {isGloballyActive && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              Active
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">
                            {theme.vibe}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {theme.tagline}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            {theme.buffMultiplier}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right action / Palette swatch */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                        <div 
                          className="w-3 h-3 rounded-full border border-white/20 shadow-xs" 
                          style={{ backgroundColor: theme.colors.primary }}
                          title={`Primary: ${theme.colors.primary}`}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border border-white/20 shadow-xs" 
                          style={{ backgroundColor: theme.colors.secondary }}
                          title={`Secondary: ${theme.colors.secondary}`}
                        />
                      </div>

                      {isGloballyActive ? (
                        <button
                          disabled
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-default"
                        >
                          Active
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTheme(theme.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 text-white ${
                            isCurrentlyPreviewed
                              ? `bg-gradient-to-r ${theme.colors.buttonGradient}`
                              : "bg-slate-800 hover:bg-slate-700 border border-slate-700"
                          }`}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Visual Sandbox & Theme Inspector */}
          <div className="w-full md:w-80 lg:w-96 p-5 flex flex-col justify-between bg-slate-900/60 overflow-y-auto shrink-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live UI Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  {previewTheme.shortName}
                </span>
              </div>

              {/* Sandbox Card */}
              <div 
                className="mt-4 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden"
                style={{
                  borderColor: `${previewTheme.colors.primary}60`,
                  backgroundColor: "#0b101b",
                  boxShadow: `0 0 25px ${previewTheme.colors.primary}20`
                }}
              >
                {/* Glow pill */}
                <div 
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-50"
                  style={{ backgroundColor: previewTheme.colors.primary }}
                />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{previewTheme.emoji}</span>
                    <span className="text-xs font-bold text-white">{previewTheme.name}</span>
                  </div>
                  <span 
                    className="text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase"
                    style={{
                      backgroundColor: `${previewTheme.colors.primary}20`,
                      color: previewTheme.colors.primary,
                      border: `1px solid ${previewTheme.colors.primary}40`
                    }}
                  >
                    Sample Card
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {previewTheme.tagline}
                </p>

                {/* Sample interactive element */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Cognitive Buff</span>
                    <span className="font-bold text-slate-200">{previewTheme.buffMultiplier}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Ambient Sound</span>
                    <span className="font-medium text-slate-300 truncate max-w-[140px]">
                      {previewTheme.ambientTrackTitle}
                    </span>
                  </div>
                </div>

                {/* Sample Action Button Preview */}
                <button
                  className={`w-full mt-4 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r ${previewTheme.colors.buttonGradient}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute Workflow Action</span>
                </button>
              </div>

              {/* Color Swatches Spec */}
              <div className="mt-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Color Chemistry
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                    <div 
                      className="w-5 h-5 rounded-lg border border-white/20 shadow-xs" 
                      style={{ backgroundColor: previewTheme.colors.primary }}
                    />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Primary</div>
                      <div className="text-xs font-mono font-bold text-white">{previewTheme.colors.primary}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
                    <div 
                      className="w-5 h-5 rounded-lg border border-white/20 shadow-xs" 
                      style={{ backgroundColor: previewTheme.colors.secondary }}
                    />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Secondary</div>
                      <div className="text-xs font-mono font-bold text-white">{previewTheme.colors.secondary}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Apply Bar in Sidebar */}
            <div className="pt-5 mt-5 border-t border-slate-800">
              {previewTheme.id === activeThemeId ? (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <span className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Currently Active Global Theme
                  </span>
                </div>
              ) : (
                <button
                  id="btn-confirm-apply-theme"
                  onClick={() => handleApplyTheme(previewTheme.id)}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-extrabold text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 bg-gradient-to-r ${previewTheme.colors.buttonGradient}`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Apply "{previewTheme.shortName}" Globally</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-5 sm:px-7 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTheme.colors.primary }} />
            <span>Active Global Theme: <strong className="text-white">{activeTheme.name}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
