import React, { useState } from 'react';
import { Flame, Target, TrendingUp, Trophy } from 'lucide-react';
import { Habit } from '../types/tracker';
import {
  calculateDailyStats,
  calculateOverallStats,
  calculateWeeklyStats,
  getDaysInMonth,
  getWeekdayName,
  isToday,
} from '../utils/trackerUtils';

interface TopDashboardProps {
  year: number;
  monthIndex: number;
  habits: Habit[];
  checks: Record<string, Record<number, boolean>>;
  accentColor: string;
}

export const TopDashboard: React.FC<TopDashboardProps> = ({
  year,
  monthIndex,
  habits,
  checks,
  accentColor,
}) => {
  const [activeDayTooltip, setActiveDayTooltip] = useState<number | null>(null);
  const totalDays = getDaysInMonth(year, monthIndex);
  const dailyStats = calculateDailyStats(habits, checks, year, monthIndex);
  const weeklyStats = calculateWeeklyStats(habits, checks, year, monthIndex);
  const overall = calculateOverallStats(habits, checks, year, monthIndex);

  // SVG Donut calculation
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall.overallPercentage / 100) * circumference;

  return (
    <div id="stats-section" className="space-y-3 mb-3 w-full max-w-full min-w-0">
      {/* Mobile-Friendly Quick KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-full">
        <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-md min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate">
              Completion Rate
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-400" style={{ color: accentColor }}>
              {overall.overallPercentage}%
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp size={16} />
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-md min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate">
              Completed
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-white">
              {overall.totalCompleted}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Trophy size={16} />
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-md min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate">
              Remaining
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-amber-400">
              {overall.totalLeft}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Target size={16} />
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-md min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate">
              Total Goal
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-slate-200">
              {overall.totalGoal}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Flame size={16} />
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Daily Bars (Cols 1-5), Weekly Progress (Cols 6-8), Donut (Cols 9-12) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 w-full max-w-full min-w-0">
        {/* 1. Daily Progress Bar Chart */}
        <div className="md:col-span-2 lg:col-span-5 bg-[#181a20] border border-[#2a2e37] rounded-xl p-3.5 flex flex-col justify-between shadow-lg w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Daily Completion Trend
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Days 1–{totalDays}
            </span>
          </div>

          {/* Bar Chart Container with horizontal scroll on mobile so bars never squish */}
          <div className="overflow-x-auto custom-scrollbar pb-1 touch-pan-x">
            <div className="h-28 min-w-[480px] sm:min-w-full flex items-end gap-1 pt-3 pb-1 relative">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-x-0 top-3 border-b border-[#2a2e37]/40 pointer-events-none">
                <span className="text-[9px] text-slate-500 absolute -top-2 left-0">100%</span>
              </div>
              <div className="absolute inset-x-0 top-1/2 border-b border-[#2a2e37]/40 pointer-events-none">
                <span className="text-[9px] text-slate-500 absolute -top-2 left-0">50%</span>
              </div>

              <div className="w-full h-full flex items-end justify-between gap-[2px] pl-6">
                {dailyStats.slice(0, totalDays).map((stat) => {
                  const dayName = getWeekdayName(year, monthIndex, stat.day);
                  const isFull = stat.percentage === 100;
                  const isTooltipActive = activeDayTooltip === stat.day;

                  return (
                    <div
                      key={stat.day}
                      onClick={() => setActiveDayTooltip(isTooltipActive ? null : stat.day)}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip on hover or mobile tap */}
                      <div
                        className={`transition-opacity absolute bottom-full mb-1 z-30 pointer-events-none bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap ${
                          isTooltipActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        Day {stat.day} ({dayName}): <span className="font-bold text-white">{stat.percentage}%</span>
                        <br />
                        <span className="text-slate-400">{stat.count}/{stat.total} habits</span>
                      </div>

                      {/* Bar */}
                      <div
                        className="w-full rounded-t-xs transition-all duration-300 relative"
                        style={{
                          height: `${Math.max(stat.percentage, 4)}%`,
                          minHeight: stat.percentage > 0 ? '4px' : '2px',
                          backgroundColor: isFull
                            ? accentColor
                            : stat.percentage > 0
                            ? '#e2e8f0'
                            : '#242831',
                        }}
                      />

                      {/* Weekday & Day label */}
                      <div className="flex flex-col items-center mt-1 select-none">
                        <span
                          className={`text-[8px] font-mono leading-none ${
                            isToday(year, monthIndex, stat.day)
                              ? 'text-emerald-400 font-bold'
                              : dayName === 'Sa' || dayName === 'Su'
                              ? 'text-amber-400/90'
                              : 'text-slate-400'
                          }`}
                        >
                          {dayName}
                        </span>
                        <span
                          className={`text-[7.5px] font-mono leading-none mt-0.5 ${
                            isToday(year, monthIndex, stat.day)
                              ? 'text-emerald-300 font-black'
                              : 'text-slate-500'
                          }`}
                        >
                          {stat.day}
                        </span>
                        {isToday(year, monthIndex, stat.day) && (
                          <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Weekly Progress Bar Chart */}
        <div className="col-span-1 lg:col-span-3 bg-[#181a20] border border-[#2a2e37] rounded-xl p-3.5 flex flex-col justify-between shadow-lg w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Weekly Breakdown
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Avg %</span>
          </div>

          <div className="h-28 w-full flex items-end justify-around gap-2 pt-3 pb-1 relative">
            <div className="absolute inset-x-0 top-3 border-b border-[#2a2e37]/40 pointer-events-none">
              <span className="text-[9px] text-slate-500 absolute -top-2 left-0">100%</span>
            </div>

            {weeklyStats.map((week, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative max-w-[48px]">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 z-30 pointer-events-none bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap">
                  {week.name}: <span className="font-bold text-white">{week.percentage}%</span>
                  <br />
                  <span className="text-slate-400">{week.checked}/{week.possible} checks</span>
                </div>

                <span className="text-[9px] font-mono text-slate-300 font-semibold mb-1">
                  {week.percentage}%
                </span>

                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${Math.max(week.percentage, 4)}%`,
                    backgroundColor: week.percentage >= 80 ? accentColor : '#cbd5e1',
                  }}
                />
                <span className="text-[9px] text-slate-400 font-medium mt-1 uppercase">
                  W{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Overall Stats & Donut Chart */}
        <div className="col-span-1 lg:col-span-4 bg-[#181a20] border border-[#2a2e37] rounded-xl p-3.5 flex flex-col justify-between shadow-lg w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2a2e37] pb-2 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Monthly Progress
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Target Ring
            </span>
          </div>

          <div className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-6 flex flex-col gap-1.5">
              <div className="bg-[#111315] border border-[#2a2e37] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Target</span>
                <span className="text-sm font-bold font-mono text-white">{overall.totalGoal}</span>
              </div>

              <div className="bg-[#111315] border border-[#2a2e37] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Done</span>
                <span className="text-sm font-bold font-mono text-emerald-400" style={{ color: accentColor }}>
                  {overall.totalCompleted}
                </span>
              </div>

              <div className="bg-[#111315] border border-[#2a2e37] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Left</span>
                <span className="text-sm font-bold font-mono text-amber-400">{overall.totalLeft}</span>
              </div>
            </div>

            <div className="col-span-6 flex flex-col items-center justify-center relative">
              <svg className="w-24 h-24 sm:w-28 sm:h-28 transform -rotate-90" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  className="text-[#242831]"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke={accentColor}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg sm:text-xl font-black font-mono tracking-tight text-white">
                  {overall.overallPercentage}%
                </span>
                <span className="text-[8px] uppercase font-semibold text-slate-400 tracking-wider">
                  Complete
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
