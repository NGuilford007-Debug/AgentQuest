import React, { useState } from "react";
import { LeaderboardUser } from "../types";
import { 
  Trophy, 
  Crown, 
  Flame, 
  Clock, 
  Zap, 
  TrendingUp, 
  Medal, 
  Users, 
  Bot,
  Filter
} from "lucide-react";

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserId }) => {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<"weekly" | "all_time">("all_time");

  const filteredUsers = users.filter((u) => {
    if (selectedDept === "all") return true;
    return u.department === selectedDept;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => b.xp - a.xp);
  const top3 = sortedUsers.slice(0, 3);
  const remaining = sortedUsers.slice(3);

  const currentUser = users.find((u) => u.id === currentUserId);
  const topUser = sortedUsers[0];
  const xpToNextRank = topUser && currentUser && currentUser.id !== topUser.id
    ? topUser.xp - currentUser.xp
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Enterprise Productivity Leaderboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Recognizing top automators, time-savers, and AI orchestration champions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Departments</option>
            <option value="DevOps & SecOps">DevOps & SecOps</option>
            <option value="Sales & CRM">Sales & CRM</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Engineering">Engineering</option>
            <option value="Finance & Legal">Finance & Legal</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          {/* Timeframe Toggle */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setTimeframe("weekly")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeframe === "weekly"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Weekly Sprint
            </button>
            <button
              onClick={() => setTimeframe("all_time")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeframe === "all_time"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              All-Time Hall of Fame
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM CARDS */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 */}
          <div className="order-2 md:order-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative shadow-sm">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] border border-white dark:border-slate-800 shadow-xs">
              🥈 Rank #2
            </div>
            <img
              src={top3[1].avatar}
              alt={top3[1].name}
              className="w-16 h-16 rounded-full mx-auto border-2 border-slate-300 dark:border-slate-600 object-cover mt-2"
            />
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {top3[1].name}
              </div>
              <div className="text-xs text-slate-400">{top3[1].department}</div>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">XP</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {top3[1].xp.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Saved</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {top3[1].hoursSaved}h
                </span>
              </div>
            </div>
          </div>

          {/* Rank 1 (Center Hero) */}
          <div className="order-1 md:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400/80 dark:border-amber-500/80 text-center space-y-3 relative shadow-md scale-105">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              <span>Rank #1 Champion</span>
            </div>
            <img
              src={top3[0].avatar}
              alt={top3[0].name}
              className="w-20 h-20 rounded-full mx-auto border-3 border-amber-400 object-cover mt-2 shadow-sm"
            />
            <div>
              <div className="font-extrabold text-base text-slate-900 dark:text-white">
                {top3[0].name}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                {top3[0].role} • {top3[0].department}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs pt-3 border-t border-amber-200/50 dark:border-amber-900/50">
              <div>
                <span className="text-slate-400 block text-[10px]">Total XP</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm font-mono">
                  {top3[0].xp.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Hours Liberated</span>
                <span className="font-extrabold text-emerald-600 text-sm font-mono">
                  {top3[0].hoursSaved}h
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Streak</span>
                <span className="font-extrabold text-amber-500 flex items-center gap-0.5 justify-center">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  {top3[0].streak}d
                </span>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="order-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative shadow-sm">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-700 text-white font-bold text-[11px] shadow-xs">
              🥉 Rank #3
            </div>
            <img
              src={top3[2].avatar}
              alt={top3[2].name}
              className="w-16 h-16 rounded-full mx-auto border-2 border-amber-700/60 object-cover mt-2"
            />
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {top3[2].name}
              </div>
              <div className="text-xs text-slate-400">{top3[2].department}</div>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">XP</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {top3[2].xp.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Saved</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {top3[2].hoursSaved}h
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CURRENT USER POSITION CALLOUT */}
      {currentUser && xpToNextRank > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <strong>Rank #{currentUser.rank} Standing:</strong> You are only{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                {xpToNextRank.toLocaleString()} XP
              </span>{" "}
              away from claiming the <strong>#1 Champion Rank</strong>!
            </div>
          </div>
          <span className="font-bold text-[11px] bg-blue-600 text-white px-3 py-1 rounded-lg">
            Deploy Workflows to Close Gap
          </span>
        </div>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
          Complete Enterprise Ranking Matrix
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Employee & Role</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Level</th>
                <th className="px-5 py-3">Time Saved</th>
                <th className="px-5 py-3">Automations</th>
                <th className="px-5 py-3 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedUsers.map((user, idx) => {
                const rankNum = idx + 1;
                const isCurrent = user.id === currentUserId;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-blue-50/50 dark:bg-blue-950/30 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          rankNum === 1
                            ? "bg-amber-400 text-slate-950"
                            : rankNum === 2
                            ? "bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white"
                            : rankNum === 3
                            ? "bg-amber-700 text-white"
                            : "text-slate-500 font-mono"
                        }`}
                      >
                        {rankNum}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      {user.department}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                        Lv. {user.level}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {user.hoursSaved}h
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono">
                      {user.automationsRun}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {user.xp.toLocaleString()} XP
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
