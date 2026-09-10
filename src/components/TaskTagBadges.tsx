import React from "react";
import { Building2, Folder, Tag, Plus } from "lucide-react";
import { TaskExecutionRecord } from "../types";

interface TaskTagBadgesProps {
  task: TaskExecutionRecord;
  onEditTags?: (task: TaskExecutionRecord) => void;
  onSelectClient?: (client: string) => void;
  onSelectProject?: (project: string) => void;
  onSelectTag?: (tag: string) => void;
  compact?: boolean;
}

export const TaskTagBadges: React.FC<TaskTagBadgesProps> = ({
  task,
  onEditTags,
  onSelectClient,
  onSelectProject,
  onSelectTag,
  compact = false,
}) => {
  const hasClient = Boolean(task.client && task.client.trim() !== "");
  const hasProject = Boolean(task.project && task.project.trim() !== "");
  const hasTags = Boolean(task.tags && task.tags.length > 0);

  if (!hasClient && !hasProject && !hasTags) {
    if (!onEditTags) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditTags(task);
        }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-medium text-slate-400 hover:text-blue-600 hover:border-blue-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
        title="Assign Client, Project, or Tags"
      >
        <Plus className="w-2.5 h-2.5" />
        <span>Add metadata / tags</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Client Badge */}
      {hasClient && (
        <span
          onClick={(e) => {
            if (onSelectClient && task.client) {
              e.stopPropagation();
              onSelectClient(task.client);
            }
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 ${
            onSelectClient ? "hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer" : ""
          }`}
          title={`Client: ${task.client}`}
        >
          <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
          <span className="truncate max-w-[130px]">{task.client}</span>
        </span>
      )}

      {/* Project Badge */}
      {hasProject && (
        <span
          onClick={(e) => {
            if (onSelectProject && task.project) {
              e.stopPropagation();
              onSelectProject(task.project);
            }
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 ${
            onSelectProject ? "hover:bg-cyan-100 dark:hover:bg-cyan-900/60 cursor-pointer" : ""
          }`}
          title={`Project: ${task.project}`}
        >
          <Folder className="w-3 h-3 text-cyan-500 shrink-0" />
          <span className="truncate max-w-[130px]">{task.project}</span>
        </span>
      )}

      {/* Tag Badges */}
      {hasTags &&
        task.tags?.map((tag) => (
          <span
            key={tag}
            onClick={(e) => {
              if (onSelectTag) {
                e.stopPropagation();
                onSelectTag(tag);
              }
            }}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 ${
              onSelectTag ? "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300 cursor-pointer" : ""
            }`}
            title={`Tag: #${tag}`}
          >
            <Tag className="w-2.5 h-2.5 text-slate-400" />
            <span>#{tag}</span>
          </span>
        ))}

      {/* Quick Edit Trigger */}
      {onEditTags && !compact && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditTags(task);
          }}
          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
          title="Edit Client, Project, and Tags"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};
