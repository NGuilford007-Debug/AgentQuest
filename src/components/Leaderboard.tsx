import React, { useState } from "react";
import { LeaderboardUser } from "../types";
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Users, 
  Bot,
  BookmarkCheck,
  Zap,
  DollarSign,
  CheckCircle2,
  Building2,
  Filter,
  ArrowUpDown
} from "lucide-react";

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserId }) => {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"hoursSaved" | "opexSavedUsd" | "automationsRun" | "autonomyRate">("hoursSaved");

  const filteredUsers = users.filter((u) => {
    if (selectedDept === "all") return true;
    return u.department === selectedDept;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "hoursSaved") return b.hoursSaved - a.hoursSaved;
    if (sortBy === "opexSavedUsd") return (b.opexSavedUsd ?? b.hoursSaved * 85) - (a.opexSavedUsd ?? a.hoursSaved * 85);
    if (sortBy === "automationsRun") return b.automationsRun - a.automationsRun;
    if (sortBy === "autonomyRate") return (b.autonomyRate ?? 80) - (a.autonomyRate ?? 80);
    return b.hoursSaved - a.hoursSaved;
  });

  const top3 = sortedUsers.slice(0, 3);
  const currentUser = users.find((u) => u.id === currentUserId || u.isCurrentUser);

  const totalCompanyHours = users.reduce((acc, u) => acc + u.hoursSaved, 0);
  const totalCompanyOpEx = users.reduce((acc, u) => acc + (u.opexSavedUsd || u.hoursSaved * 85), 0);
  const totalCompanyRuns = users.reduce((acc, u) => acc + u.automationsRun, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Departmental Operations & Efficiency Benchmarks</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-departmental telemetry on manual toil eliminated, labor OpEx replaced, and autonomous playbooks.
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs"
          >
            <option value="all">All Departments</option>
            <option value="DevOps & SecOps">DevOps & SecOps</option>
            <option value="Sales & CRM">Sales & CRM</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Engineering">Engineering</option>
            <option value="Finance & Legal">Finance & Legal</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          {/* Metric Sort Toggle */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setSortBy("hoursSaved")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                sortBy === "hoursSaved"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Hours Saved
            </button>
            <button
              onClick={() => setSortBy("opexSavedUsd")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                sortBy === "opexSavedUsd"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              OpEx Replaced ($)
            </button>
            <button
              onClick={() => setSortBy("automationsRun")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                sortBy === "automationsRun"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Total Runs
            </button>
          </div>
        </div>
      </div>

      {/* COMPANY-WIDE AGGREGATE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Total Company Hours Liberated</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalCompanyHours.toFixed(1)} hrs
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Directly reallocated to strategic high-leverage growth
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Cumulative OpEx Cost Replaced</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ${totalCompanyOpEx.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Measured against standard human compensation benchmarks
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Zap className="w-4 h-4 text-purple-500" />
            <span>Autonomous Tasks Dispatched</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalCompanyRuns.toLocaleString()} runs
          </div>
          <div className="text-[11px] text-slate-400">
            Across CRM, SRE alerts, support triage, and finance
          </div>
        </div>
      </div>

      {/* TOP 3 DEPARTMENT EFFICIENCY LEADERS */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Top 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  #2 Department Efficiency Leader
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${(top3[1].opexSavedUsd ?? top3[1].hoursSaved * 85).toLocaleString()} OpEx
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={top3[1].avatar}
                  alt={top3[1].name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {top3[1].department}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lead: {top3[1].name} ({top3[1].role})
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Hours Saved</span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                  {top3[1].hoursSaved}h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Autonomy</span>
                <span className="font-bold text-xs text-emerald-600 font-mono">
                  {top3[1].autonomyRate ?? 88}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Playbooks</span>
                <span className="font-bold text-xs text-blue-600 font-mono">
                  {top3[1].approvedPlaybooksCount ?? 5} Vault
                </span>
              </div>
            </div>
          </div>

          {/* Top 1 (Primary Highlight) */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/80 to-white dark:from-blue-950/30 dark:to-slate-900 border-2 border-blue-500/60 shadow-md space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-600 text-white">
                  #1 Operational Benchmark Leader
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${(top3[0].opexSavedUsd ?? top3[0].hoursSaved * 85).toLocaleString()} OpEx
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={top3[0].avatar}
                  alt={top3[0].name}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-blue-500 shadow-xs"
                />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {top3[0].department}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    Lead: {top3[0].name} ({top3[0].role})
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Hours Liberated</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                  {top3[0].hoursSaved}h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Autonomy Ratio</span>
                <span className="font-extrabold text-sm text-emerald-600 font-mono">
                  {top3[0].autonomyRate ?? 91}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Vault Playbooks</span>
                <span className="font-extrabold text-sm text-blue-600 font-mono">
                  {top3[0].approvedPlaybooksCount ?? 8} Approved
                </span>
              </div>
            </div>
          </div>

          {/* Top 3 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  #3 Department Efficiency Leader
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${(top3[2].opexSavedUsd ?? top3[2].hoursSaved * 85).toLocaleString()} OpEx
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={top3[2].avatar}
                  alt={top3[2].name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {top3[2].department}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lead: {top3[2].name} ({top3[2].role})
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Hours Saved</span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                  {top3[2].hoursSaved}h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Autonomy</span>
                <span className="font-bold text-xs text-emerald-600 font-mono">
                  {top3[2].autonomyRate ?? 84}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Playbooks</span>
                <span className="font-bold text-xs text-blue-600 font-mono">
                  {top3[2].approvedPlaybooksCount ?? 4} Vault
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL BENCHMARK MATRIX TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Operational Department Benchmark Matrix
          </span>
          <span className="text-[11px] text-slate-400">
            Labor value calculated at standard $85/hr corporate rate
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Department & Lead Operator</th>
                <th className="px-5 py-3">Fleet Size</th>
                <th className="px-5 py-3">Vault Playbooks</th>
                <th className="px-5 py-3">Autonomy Rate</th>
                <th className="px-5 py-3">Hours Liberated</th>
                <th className="px-5 py-3 text-right">OpEx Cost Replaced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedUsers.map((user, idx) => {
                const rankNum = idx + 1;
                const isCurrent = user.id === currentUserId || user.isCurrentUser;
                const opexValue = user.opexSavedUsd ?? user.hoursSaved * 85;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-blue-50/60 dark:bg-blue-950/40 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">
                        #{rankNum}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.department}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">
                                YOUR TEAM
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {user.name} • {user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold text-[11px]">
                        {user.activeAgents} Agents
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-blue-600 dark:text-blue-400 font-semibold font-mono">
                      {user.approvedPlaybooksCount ?? 3} Approved
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        {user.autonomyRate ?? 80}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-900 dark:text-white font-bold">
                      {user.hoursSaved} hrs
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${opexValue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
