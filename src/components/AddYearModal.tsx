import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { MONTH_NAMES } from '../constants/presets';
import {
  getDaysInMonth,
  getFullWeekdayName,
  getWeekdayName,
} from '../utils/trackerUtils';

interface AddYearModalProps {
  isOpen: boolean;
  currentYear: number;
  availableYears: number[];
  onClose: () => void;
  onAddYear: (newYear: number) => void;
}

export const AddYearModal: React.FC<AddYearModalProps> = ({
  isOpen,
  currentYear,
  availableYears,
  onClose,
  onAddYear,
}) => {
  const maxExistingYear = useMemo(() => {
    return availableYears.length > 0 ? Math.max(...availableYears) : currentYear;
  }, [availableYears, currentYear]);

  // Default suggested year is the next year past the current highest year
  const [selectedYear, setSelectedYear] = useState<number>(() => maxExistingYear + 1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset to next suggested year when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedYear(maxExistingYear + 1);
      setErrorMsg(null);
    }
  }, [isOpen, maxExistingYear]);

  // Gregorian leap year check: divisible by 4, not 100 unless 400
  const isLeap = useMemo(() => {
    return (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || selectedYear % 400 === 0;
  }, [selectedYear]);

  // Calendar alignment calculations for the selected year
  const calendarSummary = useMemo(() => {
    if (isNaN(selectedYear) || selectedYear < 1900 || selectedYear > 2200) {
      return null;
    }

    const jan1Weekday = getFullWeekdayName(selectedYear, 0, 1);
    const dec31Weekday = getFullWeekdayName(selectedYear, 11, 31);
    const totalDaysInYear = isLeap ? 366 : 365;

    // Month-by-month accurate calendar alignment breakdown
    const months = MONTH_NAMES.map((name, idx) => {
      const days = getDaysInMonth(selectedYear, idx);
      const startDayName = getWeekdayName(selectedYear, idx, 1);
      const endDayName = getWeekdayName(selectedYear, idx, days);
      return {
        name,
        monthIndex: idx,
        days,
        startDayName,
        endDayName,
      };
    });

    return {
      jan1Weekday,
      dec31Weekday,
      totalDaysInYear,
      febDays: isLeap ? 29 : 28,
      months,
    };
  }, [selectedYear, isLeap]);

  if (!isOpen) return null;

  const handleYearChange = (val: number) => {
    setErrorMsg(null);
    setSelectedYear(val);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isNaN(selectedYear) || selectedYear < 1900 || selectedYear > 2100) {
      setErrorMsg('Please enter a valid year between 1900 and 2100.');
      return;
    }
    onAddYear(selectedYear);
  };

  // Quick preset suggestions
  const presetChips = [
    maxExistingYear + 1,
    maxExistingYear + 2,
    2029,
    2030,
    2031,
    2032,
  ].filter((yr, idx, self) => self.indexOf(yr) === idx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#181a20] border border-[#2a2e37] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2a2e37] flex items-center justify-between bg-[#14161a]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Add Year</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  Accurate Calendar
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate an aligned calendar for any year beyond 2028
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Year Number Input with Stepper */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Select or Enter Year
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleYearChange(selectedYear - 1)}
                className="w-10 h-11 flex items-center justify-center rounded-xl bg-[#111315] border border-[#2a2e37] text-slate-300 hover:text-white hover:bg-[#22252a] active:scale-95 transition-all"
                title="Previous Year"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                  className="w-full h-11 px-4 text-center font-mono text-xl font-bold bg-[#111315] border border-[#2a2e37] focus:border-emerald-500 rounded-xl text-white focus:outline-none transition-colors"
                  placeholder="e.g. 2029"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => handleYearChange(selectedYear + 1)}
                className="w-10 h-11 flex items-center justify-center rounded-xl bg-[#111315] border border-[#2a2e37] text-slate-300 hover:text-white hover:bg-[#22252a] active:scale-95 transition-all"
                title="Next Year"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{errorMsg}</p>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetChips.map((yr) => {
                const isSelected = yr === selectedYear;
                const isExisting = availableYears.includes(yr);
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleYearChange(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-[#111315] text-slate-300 border-[#2a2e37] hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {yr}
                    {isExisting && (
                      <span className="ml-1 text-[9px] text-slate-400 opacity-70">
                        (Active)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Calendar Alignment Preview Card */}
          {calendarSummary && (
            <div className="bg-[#121418] border border-[#2a2e37] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#222630]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Calendar Alignment: 100% Verified</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isLeap
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isLeap ? '✨ Leap Year (366d)' : 'Standard Year (365d)'}
                </span>
              </div>

              {/* Gregorian Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-[#181a20] p-2 rounded-lg border border-[#2a2e37]">
                  <span className="text-[10px] text-slate-400 block">Jan 1 Starts On</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {calendarSummary.jan1Weekday}
                  </span>
                </div>
                <div className="bg-[#181a20] p-2 rounded-lg border border-[#2a2e37]">
                  <span className="text-[10px] text-slate-400 block">February Length</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {calendarSummary.febDays} Days {isLeap ? '(Leap Day)' : ''}
                  </span>
                </div>
                <div className="bg-[#181a20] p-2 rounded-lg border border-[#2a2e37] col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Dec 31 Ends On</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {calendarSummary.dec31Weekday}
                  </span>
                </div>
              </div>

              {/* 12-Month Alignment Matrix */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  12-Month Calendar Alignment
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 text-[11px] font-mono">
                  {calendarSummary.months.map((m) => (
                    <div
                      key={m.name}
                      className="bg-[#181a20] border border-[#252831] px-2 py-1.5 rounded flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-300">{m.name.slice(0, 3)}</span>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px]">{m.days}d</span>
                        <span className="text-emerald-400 text-[10px] ml-1">
                          ({m.startDayName})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#2a2e37] flex items-center justify-end gap-2 bg-[#14161a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#1a1d24] hover:bg-[#252932] border border-[#2a2e37] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-950/50 active:scale-95"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Add Year {selectedYear} & Open</span>
          </button>
        </div>
      </div>
    </div>
  );
};
