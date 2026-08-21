import React, { useState } from "react";
import { 
  X, 
  Search, 
  Image as ImageIcon, 
  FileText, 
  Check, 
  Plus, 
  Folder, 
  UploadCloud, 
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { AssetItem, AssetDirectory } from "../types";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: AssetItem[];
  directories?: AssetDirectory[];
  onSelectMedia: (asset: AssetItem) => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectMedia,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "image" | "document" | "diagram">("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");

  const filtered = assets.filter((asset) => {
    if (selectedType !== "all" && asset.type !== selectedType) return false;
    if (selectedDept !== "all" && asset.department !== selectedDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        asset.title.toLowerCase().includes(q) ||
        asset.description.toLowerCase().includes(q) ||
        (asset.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Media & Asset Library Inserter
              </h2>
              <p className="text-xs text-slate-500">
                Select generated artwork, diagrams, or documents to insert directly into your prompt.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 bg-slate-50/30 dark:bg-slate-900/50">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images, vector logos, mockups, documents..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Formats</option>
              <option value="image">Images & Visuals</option>
              <option value="diagram">Diagrams & Blueprints</option>
              <option value="document">Documents & Sheets</option>
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Departments</option>
              <option value="Marketing">Marketing</option>
              <option value="Engineering">Engineering</option>
              <option value="Operations">Operations</option>
              <option value="Finance & Legal">Finance & Legal</option>
            </select>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <ImageIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium">No media found matching criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    onSelectMedia(asset);
                    onClose();
                  }}
                  className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-900 overflow-hidden mb-2 relative">
                    {asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {asset.type === "image" ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                      </div>
                    )}

                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[9px] font-bold text-white uppercase">
                      {asset.type}
                    </div>
                  </div>

                  {/* Title & metadata */}
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {asset.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {asset.department} • {asset.fileSize || "1.2 MB"}
                  </p>

                  {/* 1-click select overlay */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                    <span>Insert into Prompt</span>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} media assets available</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
