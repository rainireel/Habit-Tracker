import React, { useState } from 'react';
import { Moon, Smile, Sparkles, TrendingUp } from 'lucide-react';
import { MOOD_CONFIG } from '../constants/presets';
import { DayWellness } from '../types/tracker';
import { getDaysInMonth, isToday } from '../utils/trackerUtils';

interface WellnessSectionProps {
  year: number;
  monthIndex: number;
  wellness: Record<number, DayWellness>;
  accentColor: string;
  onUpdateDayWellness: (day: number, updates: Partial<DayWellness>) => void;
  isCompactNames?: boolean;
}

export const WellnessSection: React.FC<WellnessSectionProps> = ({
  year,
  monthIndex,
  wellness,
  accentColor,
  onUpdateDayWellness,
  isCompactNames = false,
}) => {
  const totalDays = getDaysInMonth(year, monthIndex);
  const [activeDayPicker, setActiveDayPicker] = useState<number | null>(null);

  // Calculate correlation averages
  let moodSum = 0;
  let moodCount = 0;
  let sleepSum = 0;
  let sleepCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const data = wellness[d];
    if (data?.mood) {
      moodSum += data.mood;
      moodCount++;
    }
    if (data?.sleep !== undefined) {
      sleepSum += data.sleep;
      sleepCount++;
    }
  }

  const avgMood = moodCount > 0 ? (moodSum / moodCount).toFixed(1) : '-';
  const avgSleep = sleepCount > 0 ? (sleepSum / sleepCount).toFixed(1) : '-';

  // Sparkline coordinates generation (SVG path)
  const chartWidth = 140;
  const chartHeight = 36;
  const padding = 4;

  const moodPoints = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const val = wellness[day]?.mood ?? 3; // 1 to 5 scale
    const x = padding + (i / Math.max(1, totalDays - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((val - 1) / 4) * (chartHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const sleepPoints = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const val = Math.min(12, Math.max(0, wellness[day]?.sleep ?? 7.5)); // 0 to 12 scale
    const x = padding + (i / Math.max(1, totalDays - 1)) * (chartWidth - 2 * padding);
    const normalized = Math.max(0, Math.min(1, (val - 4) / 8));
    const y = chartHeight - padding - normalized * (chartHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div id="wellness-section" className="bg-[#181a20] border border-[#2a2e37] rounded-xl overflow-hidden shadow-2xl mb-3 w-full max-w-full min-w-0">
      {/* Section Header */}
      <div className="bg-[#22252a] px-3 sm:px-3.5 py-2 sm:py-2.5 border-b border-[#2a2e37] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-amber-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Wellness &amp; Bio-Tracking
          </h3>
        </div>

        {/* Legend & Correlation info */}
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 bg-[#14161a] px-2 py-0.5 rounded border border-[#2a2e37]">
            <Smile size={12} className="text-emerald-400" />
            <span>Mood Avg: <strong className="text-white">{avgMood}</strong>/5</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#14161a] px-2 py-0.5 rounded border border-[#2a2e37]">
            <Moon size={12} className="text-sky-400" />
            <span>Sleep Avg: <strong className="text-white">{avgSleep}h</strong></span>
          </div>
        </div>
      </div>

      {/* Swipeable Table with Sticky First Column */}
      <div className="overflow-x-auto custom-scrollbar touch-pan-x w-full max-w-full">
        <table className="w-full border-collapse text-left select-none min-w-[960px]">
          <tbody>
            {/* ROW 1: DAILY MOOD (1-5) */}
            <tr className="border-b border-[#2a2e37]/70 bg-[#181a20] hover:bg-[#1f2229] transition-colors">
              {isCompactNames ? (
                <td className="sticky left-0 z-10 bg-[#181a20] w-14 min-w-[54px] max-w-[58px] px-1 py-2 border-r border-[#2a2e37] text-center shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200">
                  <div
                    title="Daily Mood (1-5)"
                    className="w-9 h-9 mx-auto rounded-lg bg-[#121316] border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-xs"
                  >
                    <Smile size={18} />
                  </div>
                </td>
              ) : (
                <td className="sticky left-0 z-10 bg-[#181a20] w-64 min-w-[220px] max-w-[260px] px-3.5 py-2 border-r border-[#2a2e37] text-xs font-semibold text-slate-200 shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smile size={14} className="text-emerald-400" />
                      <span>Daily Mood (1–5)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">1-5 Rating</span>
                  </div>
                </td>
              )}

              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const currentMood = wellness[day]?.mood ?? 4;
                const moodObj = MOOD_CONFIG.find((m) => m.value === currentMood) || MOOD_CONFIG[3];
                const isCurrentToday = isToday(year, monthIndex, day);

                return (
                  <td
                    key={day}
                    className={`w-8 min-w-[32px] text-center py-1 border-r border-[#2a2e37]/60 relative group ${
                      isCurrentToday ? 'bg-emerald-950/30' : ''
                    }`}
                  >
                    <button
                      onClick={() => setActiveDayPicker(activeDayPicker === day ? null : day)}
                      title={`Day ${day}: Mood ${moodObj.value} (${moodObj.label})`}
                      className="w-full h-8 text-[11px] font-mono font-bold flex items-center justify-center gap-0.5 rounded hover:bg-[#2b2f38] transition-colors"
                      style={{ color: moodObj.color }}
                    >
                      <span>{moodObj.value}</span>
                      <span className="text-[8px] opacity-70">▾</span>
                    </button>

                    {/* Interactive Dropdown on Click */}
                    {activeDayPicker === day && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-[#181a20] border border-slate-700 rounded-lg shadow-2xl p-1.5 flex flex-col gap-1 w-32 animate-fadeIn">
                        <div className="text-[9px] text-slate-400 font-bold px-1 border-b border-slate-800 pb-1">
                          Day {day} Mood
                        </div>
                        {MOOD_CONFIG.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => {
                              onUpdateDayWellness(day, { mood: m.value });
                              setActiveDayPicker(null);
                            }}
                            className={`flex items-center justify-between px-2 py-1.5 text-[10px] rounded hover:bg-slate-800 transition-colors ${
                              currentMood === m.value ? 'bg-slate-800/80 font-bold' : ''
                            }`}
                            style={{ color: m.color }}
                          >
                            <span>{m.emoji} {m.label}</span>
                            <span className="font-mono">{m.value}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}

              {/* Sparkline column for Mood Trend */}
              <td colSpan={6} className="px-3 py-1 bg-[#14161a]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <TrendingUp size={12} style={{ color: accentColor }} />
                    <span>Mood Curve</span>
                  </div>
                  <svg className="w-36 h-7" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <polyline
                      fill="none"
                      stroke={accentColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={moodPoints}
                    />
                  </svg>
                </div>
              </td>
            </tr>

            {/* ROW 2: HOURS OF SLEEP */}
            <tr className="border-b border-[#2a2e37]/70 bg-[#14161a] hover:bg-[#1f2229] transition-colors">
              {isCompactNames ? (
                <td className="sticky left-0 z-10 bg-[#14161a] w-14 min-w-[54px] max-w-[58px] px-1 py-2 border-r border-[#2a2e37] text-center shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200">
                  <div
                    title="Hours of Sleep"
                    className="w-9 h-9 mx-auto rounded-lg bg-[#121316] border border-slate-700/80 flex items-center justify-center text-sky-400 shadow-xs"
                  >
                    <Moon size={18} />
                  </div>
                </td>
              ) : (
                <td className="sticky left-0 z-10 bg-[#14161a] w-64 min-w-[220px] max-w-[260px] px-3.5 py-2 border-r border-[#2a2e37] text-xs font-semibold text-slate-200 shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon size={14} className="text-sky-400" />
                      <span>Hours of Sleep</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">0–14 Hours</span>
                  </div>
                </td>
              )}

              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const sleepHours = wellness[day]?.sleep ?? 7.5;
                const isCurrentToday = isToday(year, monthIndex, day);

                return (
                  <td
                    key={day}
                    className={`w-8 min-w-[32px] text-center py-1 border-r border-[#2a2e37]/60 group relative ${
                      isCurrentToday ? 'bg-emerald-950/30' : ''
                    }`}
                  >
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="16"
                      value={sleepHours}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          onUpdateDayWellness(day, { sleep: Math.max(0, Math.min(16, val)) });
                        }
                      }}
                      className="w-full text-center bg-transparent text-[11px] font-mono font-semibold text-sky-300 focus:bg-[#22252a] focus:outline-none focus:ring-1 focus:ring-sky-500 rounded py-1"
                    />
                  </td>
                );
              })}

              {/* Sparkline column for Sleep Trend */}
              <td colSpan={6} className="px-3 py-1 bg-[#14161a]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <TrendingUp size={12} className="text-sky-400" />
                    <span>Sleep Curve</span>
                  </div>
                  <svg className="w-36 h-7" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sleepPoints}
                    />
                  </svg>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
