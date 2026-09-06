import React from "react";
import { 
  CheckCircle2, 
  Check, 
  AlertCircle, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  MinusCircle 
} from "lucide-react";
import { TaskExecutionRecord } from "../types";

export type ExecutionStatus = TaskExecutionRecord["status"] | string;

export interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  pulse?: boolean;
  className?: string;
  id?: string;
}

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  description: string;
}

export const getStatusConfig = (status: ExecutionStatus): StatusConfig => {
  switch (status) {
    case "resolved":
      return {
        label: "Resolved",
        badgeClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
        dotClass: "bg-emerald-500",
        icon: CheckCircle2,
        iconClass: "text-emerald-600 dark:text-emerald-400",
        description: "Diagnosed and resolved with optimization report",
      };

    case "completed":
      return {
        label: "Completed",
        badgeClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
        dotClass: "bg-emerald-500",
        icon: Check,
        iconClass: "text-emerald-600 dark:text-emerald-400",
        description: "Autonomous task executed and finalized cleanly",
      };

    case "approved":
      return {
        label: "Approved",
        badgeClass: "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/80",
        dotClass: "bg-teal-500",
        icon: ShieldCheck,
        iconClass: "text-teal-600 dark:text-teal-400",
        description: "Human reviewer verified and approved deliverable",
      };

    case "needs_review":
      return {
        label: "Needs Review",
        badgeClass: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/80",
        dotClass: "bg-amber-500 animate-ping",
        icon: AlertCircle,
        iconClass: "text-amber-600 dark:text-amber-400",
        description: "Awaiting human-in-the-loop review and sign-off",
      };

    case "failed":
      return {
        label: "Failed",
        badgeClass: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/90 dark:border-rose-800/80",
        dotClass: "bg-rose-500",
        icon: XCircle,
        iconClass: "text-rose-600 dark:text-rose-400",
        description: "Execution halted with error or gateway timeout",
      };

    case "rejected":
      return {
        label: "Rejected",
        badgeClass: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200/90 dark:border-red-800/80",
        dotClass: "bg-red-500",
        icon: XCircle,
        iconClass: "text-red-600 dark:text-red-400",
        description: "Rejected by reviewer as non-compliant or inaccurate",
      };

    case "discrepancy":
      return {
        label: "Discrepancy",
        badgeClass: "bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-200/90 dark:border-orange-800/80",
        dotClass: "bg-orange-500",
        icon: AlertTriangle,
        iconClass: "text-orange-600 dark:text-orange-400",
        description: "Output deviated from prompt constraints or format",
      };

    case "running":
      return {
        label: "Running",
        badgeClass: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80 animate-pulse",
        dotClass: "bg-blue-500 animate-pulse",
        icon: Loader2,
        iconClass: "text-blue-600 dark:text-blue-400 animate-spin",
        description: "Live model generation in progress",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        badgeClass: "bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        dotClass: "bg-slate-400",
        icon: MinusCircle,
        iconClass: "text-slate-500 dark:text-slate-400",
        description: "Task execution cancelled by operator",
      };

    default:
      return {
        label: String(status).replace(/_/g, " "),
        badgeClass: "bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        dotClass: "bg-slate-400",
        icon: Clock,
        iconClass: "text-slate-500 dark:text-slate-400",
        description: `Status: ${status}`,
      };
  }
};

export const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({
  status,
  size = "xs",
  showIcon = true,
  pulse = false,
  className = "",
  id,
}) => {
  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  const sizeClasses = {
    xs: "text-[10px] px-2 py-0.5 gap-1 font-semibold rounded-full border",
    sm: "text-xs px-2.5 py-0.5 gap-1.5 font-bold rounded-full border",
    md: "text-xs px-3 py-1.5 gap-2 font-bold rounded-xl border shadow-2xs",
  }[size];

  const iconSizes = {
    xs: "w-3 h-3 shrink-0",
    sm: "w-3.5 h-3.5 shrink-0",
    md: "w-4 h-4 shrink-0",
  }[size];

  return (
    <span
      id={id}
      title={`${config.label} — ${config.description}`}
      className={`inline-flex items-center shrink-0 tracking-tight transition-all select-none ${config.badgeClass} ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <IconComponent className={`${iconSizes} ${config.iconClass}`} />
      )}
      <span className="capitalize">{config.label}</span>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 ml-0.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotClass}`} />
        </span>
      )}
    </span>
  );
};
