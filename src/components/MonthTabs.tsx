import React from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { MONTH_NAMES } from '../constants/presets';
import { Habit } from '../types/tracker';
import { calculateOverallStats } from '../utils/trackerUtils';

interface MonthTabsProps {
  year: number;
  activeMonth: number;
  habits: Habit[];
  monthsData: Record<string | number, { checks?: Record<string, Record<number, boolean>> }>;
  accentColor: string;
  onSelectMonth: (monthIndex: number) => void;
}

export const MonthTabs: React.FC<MonthTabsProps> = ({
  year,
  activeMonth,
  habits,
  monthsData,
  accentColor,
  onSelectMonth,
}) => {
  return (
    <div className="bg-[#14161a] border-t border-[#2a2e37] px-2 sm:px-3 py-1 flex items-center justify-between text-xs select-none">
      <div className="flex items-center gap-1 w-full sm:w-auto">
        {/* Navigation arrow buttons */}
        <button
          onClick={() => onSelectMonth(Math.max(0, activeMonth - 1))}
          disabled={activeMonth === 0}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          title="Previous Month"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => onSelectMonth(Math.min(11, activeMonth + 1))}
          disabled={activeMonth === 11}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          title="Next Month"
        >
          <ChevronRight size={18} />
        </button>

        <div className="h-5 w-[1px] bg-slate-700 mx-1 shrink-0"></div>

        {/* 12 Tabs with smooth touch scrolling */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar touch-pan-x py-1 flex-1">
          {MONTH_NAMES.map((name, idx) => {
            const isActive = idx === activeMonth;
            const mData = (monthsData[`${year}_${idx}`] || monthsData[idx])?.checks || {};
            const stats = calculateOverallStats(habits, mData, year, idx);

            return (
              <button
                key={name}
                onClick={() => onSelectMonth(idx)}
                className={`min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-[#22252a] text-white border-sky-400 shadow-md font-bold'
                    : 'bg-[#181a20] text-slate-400 border-transparent hover:bg-[#1e2126] hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet
                  size={13}
                  className={isActive ? 'text-sky-400' : 'text-slate-500'}
                />
                <span>{name}</span>

                {/* Completion rate badge */}
                {stats.overallPercentage > 0 && (
                  <span
                    className={`text-[9px] font-mono px-1 rounded ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-300 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {stats.overallPercentage}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 font-mono shrink-0 pl-3">
        <span>Year: <strong className="text-white">{year}</strong></span>
        <span className="text-slate-600">•</span>
        <span>12 Sheets</span>
      </div>
    </div>
  );
};
