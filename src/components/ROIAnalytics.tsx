import React from "react";
import { Agent, TaskExecutionRecord } from "../types";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  CheckCircle2,
  Users2,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

interface ROIAnalyticsProps {
  agents: Agent[];
  executionHistory: TaskExecutionRecord[];
}

export const ROIAnalytics: React.FC<ROIAnalyticsProps> = ({ agents, executionHistory }) => {
  const totalHours = agents.reduce((acc, a) => acc + a.stats.hoursSaved, 0);
  const totalTasks = agents.reduce((acc, a) => acc + a.stats.tasksCompleted, 0);
  const blendedHourlyCost = 85; // $85/hr standard enterprise engineer/SDR/specialist loaded cost
  const totalDollarSaved = Math.round(totalHours * blendedHourlyCost);

  const departmentBreakdown = [
    { name: "Customer Support", hours: 460, color: "bg-blue-500", percent: 43 },
    { name: "Sales & CRM", hours: 298, color: "bg-indigo-500", percent: 28 },
    { name: "DevOps & SecOps", hours: 184.5, color: "bg-purple-500", percent: 18 },
    { name: "Finance & Legal", hours: 112.5, color: "bg-amber-500", percent: 11 },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>Enterprise ROI & Operational Telemetry</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time measurement of human toil reduction, cost efficiency, and agent throughput.
        </p>
      </div>

      {/* 4 Big Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Hours Liberated</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalHours.toLocaleString()} hrs
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+38.4 hrs this week</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Direct Cost Saved</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ${totalDollarSaved.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Based on $85/hr blended capacity
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Task Turnaround Acceleration</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            1,200x
          </div>
          <div className="text-[11px] text-slate-400">
            From 45 mins manual &rarr; 1.8s AI
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Zero-Touch Autonomy Rate</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            96.4%
          </div>
          <div className="text-[11px] text-slate-400">
            Only 3.6% triggered human review
          </div>
        </div>
      </div>

      {/* Department Breakdown & Efficiency Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Users2 className="w-4 h-4 text-blue-500" />
            <span>Time Saved by Department</span>
          </h3>

          <div className="space-y-3 pt-1">
            {departmentBreakdown.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{dept.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {dept.hours} hrs ({dept.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${dept.color} rounded-full`}
                    style={{ width: `${dept.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Highest Impact Automated Pipelines</span>
          </h3>

          <div className="space-y-3 pt-1">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{agent.role}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 font-mono">
                    +{agent.stats.hoursSaved}h Saved
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {agent.stats.tasksCompleted} executions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
