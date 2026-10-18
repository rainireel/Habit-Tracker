import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Layers,
  LayoutGrid,
  Minus,
  Moon,
  Plus,
  Smile,
  Sparkles,
  Table as TableIcon,
  Trash2,
  Zap,
} from 'lucide-react';
import { MOOD_CONFIG, MONTH_NAMES, getCategoryStyle } from '../constants/presets';
import { CategoryItem, DayWellness, Habit } from '../types/tracker';
import {
  calculateDailyStats,
  calculateHabitStats,
  calculateOverallStats,
  formatFullDate,
  getCalendarMatrix,
  getDaysInMonth,
  getWeekdayName,
  getWeekGroups,
  isDayScheduledForHabit,
  isToday,
} from '../utils/trackerUtils';

interface HabitGridProps {
  year: number;
  monthIndex: number;
  habits: Habit[];
  checks: Record<string, Record<number, boolean>>;
  wellness?: Record<number, DayWellness>;
  onUpdateDayWellness?: (day: number, updates: Partial<DayWellness>) => void;
  customCategories?: CategoryItem[];
  showCategoryBar: boolean;
  onToggleCategoryBar: () => void;
  showCategoryBadges: boolean;
  onToggleCategoryBadges: () => void;
  accentColor: string;
  onToggleCheck: (habitId: string, day: number) => void;
  onCheckAllDay: (day: number) => void;
  onOpenHabitManager: () => void;
  onOpenFullManager?: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  activeViewMode?: 'day' | 'spreadsheet' | 'calendar';
  onViewModeChange?: (mode: 'day' | 'spreadsheet' | 'calendar') => void;
  isCompactNames?: boolean;
  onToggleCompactNames?: () => void;
}

const WEEKDAY_NAMES_MAP = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const HabitGrid: React.FC<HabitGridProps> = ({
  year,
  monthIndex,
  habits,
  checks,
  wellness = {},
  onUpdateDayWellness,
  customCategories = [],
  showCategoryBar,
  onToggleCategoryBar,
  showCategoryBadges,
  onToggleCategoryBadges,
  accentColor,
  onToggleCheck,
  onCheckAllDay,
  onOpenHabitManager,
  onOpenFullManager,
  onEditHabit,
  onDeleteHabit,
  activeViewMode,
  onViewModeChange,
  isCompactNames: propIsCompactNames,
  onToggleCompactNames,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGroupedView, setIsGroupedView] = useState<boolean>(false);
  const [internalViewMode, setInternalViewMode] = useState<'day' | 'spreadsheet' | 'calendar'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'day';
    return 'spreadsheet';
  });

  // Compact habit names mode (collapses names column to icon-only for maximum day visibility)
  const [internalCompactNames, setInternalCompactNames] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true;
    return false;
  });

  const isCompact = propIsCompactNames !== undefined ? propIsCompactNames : internalCompactNames;
  const toggleCompact = onToggleCompactNames || (() => setInternalCompactNames((prev) => !prev));

  const viewMode = activeViewMode || internalViewMode;
  const setViewMode = (mode: 'day' | 'spreadsheet' | 'calendar') => {
    setInternalViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  const totalDays = getDaysInMonth(year, monthIndex);
  const weekGroups = useMemo(() => getWeekGroups(year, monthIndex), [year, monthIndex]);
  const monthName = MONTH_NAMES[monthIndex];

  // Active selected day for the Day Focus view (defaults to today if current month, else 1)
  const now = new Date();
  const isCurrentActiveMonth = now.getFullYear() === year && now.getMonth() === monthIndex;
  const initialDay = isCurrentActiveMonth ? Math.min(now.getDate(), totalDays) : 1;
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  const dateRibbonRef = useRef<HTMLDivElement>(null);

  // Sync selected day when month changes
  useEffect(() => {
    if (isCurrentActiveMonth) {
      setSelectedDay(Math.min(now.getDate(), totalDays));
    } else {
      setSelectedDay(1);
    }
  }, [year, monthIndex, totalDays]);

  // Scroll active day chip into view smoothly
  useEffect(() => {
    if (dateRibbonRef.current) {
      const activeEl = dateRibbonRef.current.querySelector(`[data-day="${selectedDay}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDay, viewMode]);

  // Daily statistics for table footer and date ribbon
  const dailyStats = useMemo(
    () => calculateDailyStats(habits, checks, year, monthIndex),
    [habits, checks, year, monthIndex]
  );
  const overallStats = useMemo(
    () => calculateOverallStats(habits, checks, year, monthIndex),
    [habits, checks, year, monthIndex]
  );

  // Categories present in the active habit list
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    habits.forEach((h) => {
      const cat = h.category || 'Health';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [habits]);

  const uniqueCategories = Object.keys(categoryCounts);

  // Filter habits according to selectedCategory
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all' || !showCategoryBar) return habits;
    return habits.filter((h) => (h.category || 'Health') === selectedCategory);
  }, [habits, selectedCategory, showCategoryBar]);

  // Group habits by category
  const groupedHabits = useMemo(() => {
    const groups: { category: string; habits: Habit[] }[] = [];
    const map = new Map<string, Habit[]>();

    filteredHabits.forEach((h) => {
      const cat = h.category || 'Health';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(h);
    });

    map.forEach((hList, cat) => {
      groups.push({ category: cat, habits: hList });
    });

    return groups;
  }, [filteredHabits]);

  // Calendar matrix for the traditional monthly calendar view
  const calendarWeeks = useMemo(() => {
    return getCalendarMatrix(year, monthIndex, true); // Starts on Monday
  }, [year, monthIndex]);

  // Day Focus specific calculations
  const selectedDayScheduledHabits = useMemo(() => {
    return filteredHabits.filter((h) => isDayScheduledForHabit(h, year, monthIndex, selectedDay));
  }, [filteredHabits, year, monthIndex, selectedDay]);

  const selectedDayCheckedCount = useMemo(() => {
    return selectedDayScheduledHabits.filter((h) => !!checks[h.id]?.[selectedDay]).length;
  }, [selectedDayScheduledHabits, checks, selectedDay]);

  const selectedDayPct =
    selectedDayScheduledHabits.length > 0
      ? Math.round((selectedDayCheckedCount / selectedDayScheduledHabits.length) * 100)
      : 0;

  const isSelectedDayAllDone =
    selectedDayScheduledHabits.length > 0 &&
    selectedDayCheckedCount === selectedDayScheduledHabits.length;

  const selectedDayWeekday = getWeekdayName(year, monthIndex, selectedDay);
  const isSelectedDayToday = isToday(year, monthIndex, selectedDay);

  const selectedDayWellness = wellness[selectedDay] || { mood: 3, sleep: 7.5 };

  return (
    <div id="habit-grid-section" className="bg-[#181a20] border border-[#2a2e37] rounded-xl overflow-hidden shadow-2xl mb-3 w-full max-w-full min-w-0">
      {/* Top Controls Toolbar: View Switcher, Category Toggles & Habit Actions */}
      <div className="bg-[#1e2229] px-2.5 sm:px-4 py-2 border-b border-[#2a2e37] flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs select-none w-full max-w-full min-w-0">
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start min-w-0">
          <div className="flex items-center bg-[#121316] p-0.5 rounded-lg border border-slate-700 w-full sm:w-auto">
            {/* 1. Day Focus (Optimized for Mobile Touch) */}
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'day'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={13} className="shrink-0" />
              <span>Day Focus</span>
            </button>

            {/* 2. Spreadsheet Grid */}
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'spreadsheet'
                  ? 'bg-slate-800 text-white shadow-xs font-bold border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon size={13} className="shrink-0" />
              <span>Spreadsheet</span>
            </button>

            {/* 3. Monthly Calendar */}
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-slate-800 text-white shadow-xs font-bold border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar size={13} className="shrink-0" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Right: Names Collapse Toggle, Category Toggles & Habit Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Toggle Names Column Width (Spreadsheet View Mode) */}
          {viewMode === 'spreadsheet' && (
            <button
              onClick={toggleCompact}
              title={isCompact ? 'Expand habit names to full width' : 'Collapse habit names to icon-only for more day space'}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all border h-8 active:scale-95 ${
                isCompact
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 font-bold shadow-xs'
                  : 'bg-[#121316] text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {isCompact ? <ChevronRight size={13} className="text-emerald-400" /> : <ChevronLeft size={13} className="text-amber-400" />}
              <span>{isCompact ? 'Expand Names' : 'Mini Names'}</span>
            </button>
          )}

          {/* Toggle Category Tags on/off */}
          <button
            onClick={onToggleCategoryBadges}
            title={showCategoryBadges ? 'Hide category badges on rows' : 'Show category badges on rows'}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors border h-8 ${
              showCategoryBadges
                ? 'bg-sky-950/80 text-sky-300 border-sky-500/50'
                : 'bg-[#121316] text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
          >
            {showCategoryBadges ? <Eye size={12} className="text-sky-400 shrink-0" /> : <EyeOff size={12} className="shrink-0" />}
            <span className="hidden sm:inline">Badges: {showCategoryBadges ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Filter Toolbar */}
          <button
            onClick={onToggleCategoryBar}
            title={showCategoryBar ? 'Hide filter bar' : 'Show category filter bar'}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors border h-8 ${
              showCategoryBar
                ? 'bg-purple-950/70 text-purple-300 border-purple-500/50'
                : 'bg-[#121316] text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
          >
            <Filter size={11} className={showCategoryBar ? 'text-purple-400 shrink-0' : 'text-slate-400 shrink-0'} />
            <span>Filter</span>
          </button>

          {/* Group by category toggle (when in spreadsheet view) */}
          {viewMode === 'spreadsheet' && (
            <button
              onClick={() => setIsGroupedView(!isGroupedView)}
              title={isGroupedView ? 'Switch to Flat view' : 'Group habits by category'}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors border h-8 ${
                isGroupedView
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/50'
                  : 'bg-[#121316] text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Layers size={11} className="shrink-0" />
              <span className="hidden md:inline">{isGroupedView ? 'Grouped' : 'Flat'}</span>
            </button>
          )}

          {/* Manage Habits Button (opens full modal) */}
          {onOpenFullManager && (
            <button
              onClick={onOpenFullManager}
              title="Manage all habits in bulk"
              className="px-2.5 py-1 bg-[#121316] hover:bg-[#22252a] text-slate-300 hover:text-white font-medium rounded-lg flex items-center gap-1 border border-slate-700 transition-colors h-8"
            >
              <LayoutGrid size={12} className="shrink-0" />
              <span className="hidden md:inline">Manage All</span>
            </button>
          )}

          {/* Add Habit Button */}
          <button
            onClick={onOpenHabitManager}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs h-8 ml-auto sm:ml-0"
          >
            <Plus size={14} className="shrink-0" />
            <span className="whitespace-nowrap">Add Habit</span>
          </button>
        </div>
      </div>

      {/* Category Filter Toolbar (Togglable) */}
      {showCategoryBar && (
        <div className="bg-[#15171c] px-3.5 py-2 border-b border-[#2a2e37] flex flex-wrap items-center justify-between gap-2 text-xs select-none animate-fadeIn">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
              <Filter size={11} className="text-sky-400" />
              <span>Filter:</span>
            </div>

            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                selectedCategory === 'all'
                  ? 'bg-slate-800 text-white border border-slate-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>All Habits</span>
              <span className="text-[10px] font-mono px-1 rounded-full bg-slate-900/80 text-slate-400">
                {habits.length}
              </span>
            </button>

            {uniqueCategories.map((cat) => {
              const cfg = getCategoryStyle(cat, customCategories);
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat];

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-xs font-bold`
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xs">{cfg.icon}</span>
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedCategory('all')}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer py-1"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: DAY FOCUS (MOBILE-FIRST HIGH-ERGONOMICS TRACKER)
          ========================================================================= */}
      {viewMode === 'day' && (
        <div className="p-2.5 sm:p-5 space-y-3 sm:space-y-4 w-full max-w-full min-w-0 overflow-hidden">
          {/* Horizontal Date Ribbon Carousel */}
          <div className="bg-[#14161b] p-2 sm:p-2.5 rounded-xl border border-[#2a2e37] w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Calendar size={13} className="text-emerald-400" />
                <span>{monthName} {year}</span>
                <span className="text-[11px] text-slate-400 font-normal">· Select Day</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                  disabled={selectedDay === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-[#1e2229] border border-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                  title="Previous Day"
                >
                  <ChevronLeft size={14} />
                </button>

                {isCurrentActiveMonth && (
                  <button
                    onClick={() => setSelectedDay(now.getDate())}
                    className="px-2 py-1 text-[11px] font-mono font-bold rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 active:scale-95"
                  >
                    Today
                  </button>
                )}

                <button
                  onClick={() => setSelectedDay(Math.min(totalDays, selectedDay + 1))}
                  disabled={selectedDay === totalDays}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-[#1e2229] border border-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                  title="Next Day"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Day Strip */}
            <div
              ref={dateRibbonRef}
              className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar touch-pan-x w-full max-w-full"
            >
              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const weekday = getWeekdayName(year, monthIndex, day);
                const isSelected = day === selectedDay;
                const isCurrentToday = isToday(year, monthIndex, day);
                const stat = dailyStats[i];
                const pct = stat ? stat.percentage : 0;
                const isAllDone = stat && stat.total > 0 && stat.count === stat.total;

                return (
                  <button
                    key={day}
                    data-day={day}
                    onClick={() => setSelectedDay(day)}
                    className={`shrink-0 w-12 py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-center border active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-950/50 scale-105 z-10'
                        : isCurrentToday
                        ? 'bg-[#1b2520] border-emerald-500/70 text-emerald-300'
                        : weekday === 'Sa' || weekday === 'Su'
                        ? 'bg-[#181a21] border-[#2c303a] text-slate-300 hover:border-slate-600'
                        : 'bg-[#181a20] border-[#252831] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className={`text-[10px] font-semibold leading-none ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                      {weekday}
                    </span>
                    <span className={`text-sm font-mono font-bold leading-tight ${isSelected ? 'text-slate-950' : 'text-slate-100'}`}>
                      {day}
                    </span>

                    {/* Progress indicator dot */}
                    <div className="flex items-center justify-center h-2 mt-0.5">
                      {isAllDone ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400'}`} />
                      ) : pct > 0 ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-sky-400'}`} />
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-transparent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Status & Batch Check Action */}
          <div className="bg-[#1b1e25] border border-[#2a2e37] rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>{formatFullDate(year, monthIndex, selectedDay)}</span>
                  {isSelectedDayToday && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      TODAY
                    </span>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>
                  {selectedDayCheckedCount} of {selectedDayScheduledHabits.length} habits completed ({selectedDayPct}%)
                </span>
                {isSelectedDayAllDone && <span className="text-emerald-400 font-bold">🎉 All done!</span>}
              </p>
            </div>

            {/* Check All / Uncheck All for Selected Day */}
            <button
              onClick={() => onCheckAllDay(selectedDay)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 border ${
                isSelectedDayAllDone
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md'
              }`}
            >
              <Check size={16} strokeWidth={3} />
              <span>{isSelectedDayAllDone ? 'Uncheck All' : 'Check All for Today'}</span>
            </button>
          </div>

          {/* Habit Checklist Cards for the Selected Day */}
          <div className="space-y-2.5">
            {selectedDayScheduledHabits.map((habit) => {
              const isChecked = !!checks[habit.id]?.[selectedDay];
              const stats = calculateHabitStats(habit, checks, year, monthIndex);
              const cat = habit.category || 'Health';
              const catConfig = getCategoryStyle(cat, customCategories);

              let repLabel = 'Daily';
              if (habit.repetitionType === 'specific_days') {
                const days = habit.specificDays || [];
                repLabel = days.map((d) => WEEKDAY_NAMES_MAP[d]).join('/');
              } else if (habit.repetitionType === 'weekly') {
                repLabel = `${habit.weeklyTarget || 3}x/wk`;
              }

              return (
                <div
                  key={habit.id}
                  onClick={() => onToggleCheck(habit.id, selectedDay)}
                  className={`min-h-[64px] rounded-xl border p-3 flex items-center justify-between gap-3 cursor-pointer transition-all select-none active:scale-[0.99] ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md'
                      : 'bg-[#181a20] border-[#2a2e37] hover:border-slate-600 hover:bg-[#1e222a]'
                  }`}
                >
                  {/* Left: Emoji & Habit Metadata */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border transition-all ${
                        isChecked
                          ? 'bg-emerald-500/20 border-emerald-500/40'
                          : 'bg-[#121316] border-slate-700'
                      }`}
                    >
                      {habit.emoji}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm truncate ${
                            isChecked ? 'text-emerald-100 line-through opacity-80' : 'text-slate-100'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                        {showCategoryBadges && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                            {cat}
                          </span>
                        )}
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {repLabel}
                        </span>
                        {stats.currentStreak > 0 && (
                          <span className="font-mono font-bold text-amber-400 flex items-center gap-0.5">
                            <Flame size={11} className="fill-amber-400 text-amber-400" />
                            <span>{stats.currentStreak}d</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          {stats.actual}/{stats.goal}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Touch-Optimized Large Checkbox & Quick Edit */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditHabit(habit);
                      }}
                      title="Edit Habit"
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>

                    <div
                      className={`min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center border-2 transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/60 scale-105'
                          : 'border-slate-600 bg-[#121316] text-transparent hover:border-slate-400'
                      }`}
                    >
                      <Check size={24} strokeWidth={3.5} className={isChecked ? 'opacity-100' : 'opacity-0'} />
                    </div>
                  </div>
                </div>
              );
            })}

            {selectedDayScheduledHabits.length === 0 && (
              <div className="text-center py-10 bg-[#14161b] rounded-xl border border-dashed border-[#2a2e37] p-6">
                <p className="text-slate-400 text-sm">No habits scheduled for this day.</p>
                <button
                  onClick={onOpenHabitManager}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add a Habit</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Day Wellness Check-In Card (Integrated directly into Day Focus!) */}
          {onUpdateDayWellness && (
            <div className="bg-[#15171d] border border-[#2a2e37] rounded-xl p-3.5 sm:p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Day {selectedDay} Wellness Check-In
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Mood: {selectedDayWellness.mood}/5 · Sleep: {selectedDayWellness.sleep}h
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mood Selector (1 to 5) */}
                <div className="bg-[#1a1d24] p-3 rounded-lg border border-[#262a33]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Smile size={13} className="text-amber-400" />
                      <span>Mood Rating</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">
                      {(MOOD_CONFIG.find((m) => m.value === selectedDayWellness.mood) || MOOD_CONFIG[2]).label}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as const).map((mVal) => {
                      const cfg = MOOD_CONFIG.find((m) => m.value === mVal) || MOOD_CONFIG[2];
                      const isSelected = selectedDayWellness.mood === mVal;
                      return (
                        <button
                          key={mVal}
                          type="button"
                          onClick={() => onUpdateDayWellness(selectedDay, { mood: mVal })}
                          className={`min-h-[44px] rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all border ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105 shadow-md'
                              : 'bg-[#121316] border-slate-800 hover:bg-slate-800/60 text-slate-400'
                          }`}
                        >
                          <span className="text-lg leading-none">{cfg.emoji}</span>
                          <span className="text-[9px] font-mono">{mVal}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sleep Hours Stepper / Quick Buttons */}
                <div className="bg-[#1a1d24] p-3 rounded-lg border border-[#262a33]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Moon size={13} className="text-sky-400" />
                      <span>Sleep Duration</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-300">
                      {selectedDayWellness.sleep} Hours
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDayWellness(selectedDay, {
                          sleep: Math.max(0, Math.round(((selectedDayWellness.sleep || 7) - 0.5) * 10) / 10),
                        })
                      }
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#121316] border border-slate-700 text-slate-300 hover:text-white active:scale-95 text-base font-bold"
                    >
                      <Minus size={16} />
                    </button>

                    {/* Quick preset buttons */}
                    <div className="grid grid-cols-4 gap-1 flex-1">
                      {[6, 7, 8, 9].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => onUpdateDayWellness(selectedDay, { sleep: hrs })}
                          className={`min-h-[44px] rounded-lg text-xs font-mono font-semibold transition-all border ${
                            selectedDayWellness.sleep === hrs
                              ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                              : 'bg-[#121316] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {hrs}h
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateDayWellness(selectedDay, {
                          sleep: Math.min(16, Math.round(((selectedDayWellness.sleep || 7) + 0.5) * 10) / 10),
                        })
                      }
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#121316] border border-slate-700 text-slate-300 hover:text-white active:scale-95 text-base font-bold"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SPREADSHEET GRID (WITH TOGGLEABLE STICKY HABIT COLUMN)
          ========================================================================= */}
      {viewMode === 'spreadsheet' && (
        <div className="relative">
          {/* Clean, Simple Mobile & Desktop Pan Helper Bar */}
          <div className="bg-[#181a20] text-slate-300 px-3 py-1.5 text-xs flex items-center justify-between border-b border-[#2a2e37] gap-2">
            <button
              type="button"
              onClick={toggleCompact}
              title={isCompact ? 'Expand habit names to full' : 'Collapse habit names to compact icons'}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#121316] hover:bg-[#22252a] text-slate-200 border border-slate-700 transition-colors active:scale-95 cursor-pointer"
            >
              {isCompact ? (
                <>
                  <ChevronRight size={14} className="text-emerald-400 stroke-[2.5]" />
                  <span>Expand Names</span>
                </>
              ) : (
                <>
                  <ChevronLeft size={14} className="text-amber-400 stroke-[2.5]" />
                  <span>Compact Names</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {isCompact ? 'Names compact · Extra space for checkboxes' : 'Swipe sideways to view days'}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar touch-pan-x relative w-full max-w-full">
            <table className="w-full border-collapse text-left select-none min-w-[960px]">
              <thead>
                {/* Row 1: Week Groupings and Analysis Header (First column is STICKY on left with TOGGLE) */}
                <tr className="border-b border-[#2a2e37] text-slate-300 text-xs font-semibold">
                  <th
                    rowSpan={2}
                    className={`${
                      isCompact
                        ? 'w-14 min-w-[54px] max-w-[58px] px-1 py-2 text-center'
                        : 'w-64 min-w-[220px] max-w-[260px] px-3.5 py-2 text-left'
                    } sticky left-0 z-20 bg-[#202329] border-r border-[#2a2e37] align-middle shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200`}
                  >
                    {isCompact ? (
                      <button
                        type="button"
                        onClick={toggleCompact}
                        title="Expand habit names column"
                        className="w-full py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-95 shadow-xs border border-emerald-400"
                      >
                        <ChevronRight size={14} strokeWidth={3} />
                        <span className="text-[8px] font-mono uppercase tracking-wider font-bold">
                          Expand
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="truncate flex-1 min-w-0">
                          <span className="font-bold tracking-wider text-slate-100 text-xs uppercase block truncate">
                            Habits
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {filteredHabits.length} {filteredHabits.length === 1 ? 'Habit' : 'Habits'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleCompact}
                          title="Collapse habit names column"
                          className="px-2 py-1 rounded-md bg-[#16181f] hover:bg-[#22252a] text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold flex items-center gap-1 active:scale-95 shrink-0"
                        >
                          <ChevronLeft size={13} className="text-amber-400 stroke-[2.5]" />
                          <span>Mini</span>
                        </button>
                      </div>
                    )}
                  </th>

                  {/* Dynamically Sized Week Groupings matching the exact days in month */}
                  {weekGroups.map((w) => (
                    <th
                      key={w.label}
                      colSpan={w.count}
                      className="bg-[#202329] border-r border-[#2a2e37] text-center py-1 text-[11px] font-bold text-slate-200 tracking-wider uppercase"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{w.label}</span>
                        <span className="text-[9px] font-normal text-slate-400 font-mono">
                          ({w.dateRangeLabel})
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Analysis & Streaks Header (6 columns) */}
                  <th
                    colSpan={6}
                    className="bg-[#202329] text-center py-1 text-[11px] font-bold text-slate-100 tracking-wider uppercase"
                  >
                    Analysis &amp; Streaks
                  </th>
                </tr>

                {/* Row 2: Unified Day Column Header */}
                <tr className="border-b border-[#2a2e37] bg-[#1a1d23] text-slate-300 text-xs font-semibold">
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const weekday = getWeekdayName(year, monthIndex, day);
                    const isWeekend = weekday === 'Sa' || weekday === 'Su';
                    const isCurrentToday = isToday(year, monthIndex, day);
                    const fullDateStr = formatFullDate(year, monthIndex, day);

                    return (
                      <th
                        key={day}
                        title={`${fullDateStr} — Click column to toggle all habits`}
                        onClick={() => onCheckAllDay(day)}
                        className={`w-8 min-w-[32px] text-center py-1 border-r border-[#2a2e37] font-mono cursor-pointer transition-colors group relative ${
                          isCurrentToday
                            ? 'bg-emerald-950/80 text-emerald-300 ring-2 ring-emerald-500 z-10'
                            : isWeekend
                            ? 'bg-[#1b1c22] text-slate-300 hover:bg-[#252832]'
                            : 'bg-[#16181e] text-slate-300 hover:bg-[#22252e]'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center leading-tight">
                          <span
                            className={`text-[8.5px] font-semibold ${
                              isCurrentToday
                                ? 'text-emerald-400 font-black'
                                : isWeekend
                                ? 'text-amber-400/90'
                                : 'text-slate-400'
                            }`}
                          >
                            {weekday}
                          </span>

                          <div className="flex items-center justify-center mt-0.5">
                            <span
                              className={`text-[10px] font-bold ${
                                isCurrentToday ? 'text-emerald-300 font-black' : 'text-slate-100'
                              }`}
                            >
                              {day}
                            </span>
                          </div>

                          {isCurrentToday && (
                            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>
                          )}
                        </div>

                        <span className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-slate-900/90 text-emerald-400 flex items-center justify-center text-[10px] font-bold pointer-events-none transition-opacity">
                          ✓
                        </span>
                      </th>
                    );
                  })}

                  {/* Analysis subheaders */}
                  <th className="w-16 text-center py-1 border-r border-[#2a2e37] font-mono text-[9px] text-amber-400 font-bold bg-[#1e222a]">
                    Streak 🔥
                  </th>
                  <th className="w-12 text-center py-1 border-r border-[#2a2e37] font-mono text-[9px] text-slate-300 bg-[#1e222a]">
                    Goal
                  </th>
                  <th className="w-12 text-center py-1 border-r border-[#2a2e37] font-mono text-[9px] text-emerald-400 font-bold bg-[#1e222a]">
                    Actual
                  </th>
                  <th className="w-12 text-center py-1 border-r border-[#2a2e37] font-mono text-[9px] text-amber-300 bg-[#1e222a]">
                    Left
                  </th>
                  <th className="w-24 text-center py-1 border-r border-[#2a2e37] font-mono text-[9px] text-slate-300 bg-[#1e222a]">
                    Progress
                  </th>
                  <th className="w-14 text-center py-1 font-mono text-[9px] text-slate-200 bg-[#1e222a]">
                    Rate
                  </th>
                </tr>
              </thead>

              <tbody>
                {isGroupedView ? (
                  groupedHabits.map((group) => {
                    const cfg = getCategoryStyle(group.category, customCategories);

                    return (
                      <React.Fragment key={group.category}>
                        <tr className="bg-[#171a21] border-y border-[#2a2e37]">
                          <td
                            colSpan={totalDays + 7}
                            className={`sticky left-0 z-10 bg-[#171a21] ${
                              isCompact ? 'px-1 text-center' : 'px-3.5 text-left'
                            } py-1.5 text-xs font-bold text-white uppercase tracking-wider`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{cfg.icon}</span>
                              {!isCompact && (
                                <>
                                  <span className={cfg.color}>{group.category}</span>
                                  <span className="text-[10px] font-mono font-normal text-slate-400">
                                    ({group.habits.length} {group.habits.length === 1 ? 'Habit' : 'Habits'})
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {group.habits.map((habit, idx) =>
                          renderHabitRow(habit, idx, totalDays, accentColor)
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  filteredHabits.map((habit, idx) =>
                    renderHabitRow(habit, idx, totalDays, accentColor)
                  )
                )}

                {filteredHabits.length === 0 && (
                  <tr>
                    <td colSpan={totalDays + 7} className="text-center py-8 text-slate-500">
                      No habits found. Click &quot;Add Habit&quot; to configure habits.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* SPREADSHEET SUMMARY FOOTER */}
              {filteredHabits.length > 0 && (
                <tfoot>
                  {/* 1. Daily Total Completed Habits */}
                  <tr className="border-t-2 border-[#2a2e37] bg-[#16181f] text-xs font-mono font-semibold">
                    <td
                      className={`sticky left-0 z-10 bg-[#1c1f26] ${
                        isCompact
                          ? 'w-14 min-w-[54px] max-w-[58px] px-1 text-center'
                          : 'w-64 min-w-[220px] max-w-[260px] px-3.5 text-left'
                      } py-1.5 border-r border-[#2a2e37] text-slate-300 font-bold uppercase text-[10px] font-mono tracking-wider shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200`}
                    >
                      {isCompact ? (
                        'Total'
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>Habit Total</span>
                          <span className="text-[9px] text-slate-500 font-normal">Completed</span>
                        </div>
                      )}
                    </td>

                    {Array.from({ length: totalDays }, (_, i) => {
                      const day = i + 1;
                      const stat = dailyStats[i];
                      const isCurrentToday = isToday(year, monthIndex, day);
                      const isAllDone = stat && stat.total > 0 && stat.count === stat.total;

                      return (
                        <td
                          key={day}
                          className={`text-center py-1 border-r border-[#2a2e37] text-[11px] ${
                            isCurrentToday
                              ? 'bg-emerald-950/40 text-emerald-300 font-bold'
                              : isAllDone
                              ? 'text-emerald-400 font-bold'
                              : stat && stat.count > 0
                              ? 'text-slate-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {stat ? stat.count : 0}
                        </td>
                      );
                    })}

                    <td className="px-2 py-1 border-r border-[#2a2e37] text-center font-bold text-amber-400 text-xs bg-[#1a1d24]">
                      -
                    </td>
                    <td className="px-2 py-1 border-r border-[#2a2e37] text-center text-xs text-slate-300 bg-[#1a1d24]">
                      {overallStats.totalGoal}
                    </td>
                    <td className="px-2 py-1 border-r border-[#2a2e37] text-center font-bold text-emerald-400 text-xs bg-[#1a1d24]">
                      {overallStats.totalCompleted}
                    </td>
                    <td className="px-2 py-1 border-r border-[#2a2e37] text-center text-xs text-amber-300 bg-[#1a1d24]">
                      {overallStats.totalLeft}
                    </td>
                    <td className="px-2 py-1 border-r border-[#2a2e37] text-center text-xs text-slate-400 bg-[#1a1d24]">
                      <div className="w-full bg-[#121316] h-2 rounded-xs overflow-hidden border border-[#2a2e37]">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(100, overallStats.overallPercentage)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1 text-center font-bold text-emerald-400 text-xs bg-[#1a1d24]">
                      {overallStats.overallPercentage}%
                    </td>
                  </tr>

                  {/* 2. Daily Completion % */}
                  <tr className="border-t border-[#2a2e37] bg-[#13151a] text-xs font-mono font-bold">
                    <td
                      className={`sticky left-0 z-10 bg-[#181a20] ${
                        isCompact
                          ? 'w-14 min-w-[54px] max-w-[58px] px-1 text-center'
                          : 'w-64 min-w-[220px] max-w-[260px] px-3.5 text-left'
                      } py-1.5 border-r border-[#2a2e37] text-slate-400 uppercase text-[10px] font-mono tracking-wider shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200`}
                    >
                      {isCompact ? (
                        '%'
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>Daily %</span>
                          <span className="text-[9px] text-slate-500 font-normal">Score</span>
                        </div>
                      )}
                    </td>

                    {Array.from({ length: totalDays }, (_, i) => {
                      const day = i + 1;
                      const stat = dailyStats[i];
                      const pct = stat ? stat.percentage : 0;
                      const isCurrentToday = isToday(year, monthIndex, day);

                      return (
                        <td
                          key={day}
                          className={`text-center py-1 border-r border-[#2a2e37] text-[10px] ${
                            isCurrentToday
                              ? 'bg-emerald-950/60 text-emerald-300 font-black'
                              : pct === 100
                              ? 'text-emerald-400 font-bold'
                              : pct >= 50
                              ? 'text-sky-300'
                              : pct > 0
                              ? 'text-amber-300'
                              : 'text-slate-600'
                          }`}
                        >
                          {pct > 0 ? `${pct}%` : '-'}
                        </td>
                      );
                    })}

                    <td colSpan={6} className="px-3 py-1 bg-[#16181f] text-right text-[11px] text-slate-400 font-mono">
                      Monthly Score: <strong className="text-emerald-400">{overallStats.overallPercentage}%</strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: MONTHLY CALENDAR GRID
          ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className="p-2.5 sm:p-4 bg-[#14161b] w-full max-w-full min-w-0 overflow-hidden">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-1.5 rounded-md bg-[#1c1f26] border border-[#2a2e37] text-[10px] sm:text-xs ${
                  idx >= 5 ? 'text-amber-400/90' : 'text-slate-300'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          <div className="space-y-1 sm:space-y-2">
            {calendarWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-1 sm:gap-2">
                {week.map((cell, cIdx) => {
                  const isCurrentDay = cell.isCurrentMonth && cell.isToday;
                  const dayHabits = cell.isCurrentMonth
                    ? habits.filter((h) => isDayScheduledForHabit(h, year, monthIndex, cell.day))
                    : [];
                  const checkedCount = cell.isCurrentMonth
                    ? dayHabits.filter((h) => !!checks[h.id]?.[cell.day]).length
                    : 0;
                  const pct =
                    dayHabits.length > 0 ? Math.round((checkedCount / dayHabits.length) * 100) : 0;

                  return (
                    <div
                      key={cIdx}
                      onClick={() => {
                        if (cell.isCurrentMonth) {
                          setSelectedDay(cell.day);
                          setViewMode('day');
                        }
                      }}
                      className={`min-h-[80px] sm:min-h-[110px] rounded-lg border p-1.5 sm:p-2 flex flex-col justify-between transition-all cursor-pointer ${
                        !cell.isCurrentMonth
                          ? 'bg-[#101215]/50 border-slate-900 opacity-20 pointer-events-none'
                          : isCurrentDay
                          ? 'bg-[#17231c] border-emerald-500/80 ring-1 ring-emerald-500 shadow-lg'
                          : 'bg-[#181a20] border-[#2a2e37] hover:border-slate-600 hover:bg-[#1d2027]'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[11px] sm:text-xs font-mono font-bold ${
                            isCurrentDay
                              ? 'text-emerald-300 bg-emerald-950 px-1 py-0.2 rounded ring-1 ring-emerald-500'
                              : cIdx >= 5
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {cell.day}
                        </span>

                        {cell.isCurrentMonth && dayHabits.length > 0 && (
                          <span
                            className={`text-[9px] sm:text-[10px] font-mono px-1 py-0.2 rounded font-semibold ${
                              pct === 100
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                                : pct > 0
                                ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {pct}%
                          </span>
                        )}
                      </div>

                      {/* Mini checklist or completion ring for mobile */}
                      {cell.isCurrentMonth && (
                        <div className="space-y-1 flex-1 overflow-hidden pr-0.5 mt-0.5">
                          <div className="hidden sm:block space-y-0.5">
                            {dayHabits.slice(0, 3).map((habit) => {
                              const isChecked = !!checks[habit.id]?.[cell.day];
                              return (
                                <div
                                  key={habit.id}
                                  className={`px-1 py-0.5 rounded text-[9px] truncate flex items-center justify-between gap-1 ${
                                    isChecked
                                      ? 'bg-emerald-950/60 text-emerald-300'
                                      : 'bg-[#121316] text-slate-400'
                                  }`}
                                >
                                  <span className="truncate">{habit.emoji} {habit.name}</span>
                                  {isChecked && <span className="text-[8px] font-bold">✓</span>}
                                </div>
                              );
                            })}
                            {dayHabits.length > 3 && (
                              <div className="text-[8px] text-slate-500 font-mono text-center">
                                +{dayHabits.length - 3} more
                              </div>
                            )}
                          </div>

                          {/* Mobile-only compact dots */}
                          <div className="sm:hidden flex flex-wrap gap-1 items-center justify-center mt-1">
                            {dayHabits.map((habit) => {
                              const isChecked = !!checks[habit.id]?.[cell.day];
                              return (
                                <span
                                  key={habit.id}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isChecked ? 'bg-emerald-400' : 'bg-slate-700'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="text-[8px] font-mono text-slate-500 text-center mt-0.5 sm:hidden">
                        Tap day
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function renderHabitRow(
    habit: Habit,
    idx: number,
    totalDays: number,
    accentColor: string
  ) {
    const stats = calculateHabitStats(habit, checks, year, monthIndex);
    const isEven = idx % 2 === 0;
    const rowBg = isEven ? 'bg-[#181a20]' : 'bg-[#14161a]';
    const repType = habit.repetitionType || 'daily';
    const cat = habit.category || 'Health';
    const catConfig = getCategoryStyle(cat, customCategories);

    let repLabel = 'Daily';
    if (repType === 'specific_days') {
      const days = habit.specificDays || [];
      repLabel = days.map((d) => WEEKDAY_NAMES_MAP[d]).join('/');
    } else if (repType === 'weekly') {
      repLabel = `${habit.weeklyTarget || 3}x/wk`;
    }

    return (
      <tr
        key={habit.id}
        className={`border-b border-[#2a2e37]/70 ${rowBg} hover:bg-[#1f2229] transition-colors group`}
      >
        {/* Habit Name Column (STICKY on left with shadow for horizontal scrolling, with TOGGLEABLE width) */}
        {isCompact ? (
          <td
            className={`sticky left-0 z-10 ${rowBg} w-14 min-w-[54px] max-w-[58px] px-1 py-1.5 border-r border-[#2a2e37] text-center shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200`}
          >
            <button
              type="button"
              onClick={() => onEditHabit(habit)}
              title={`${habit.name} (${cat}) · ${repLabel} - Tap to edit`}
              className="w-9 h-9 mx-auto rounded-lg bg-[#121316] border border-slate-700/80 hover:border-emerald-500 flex items-center justify-center text-lg cursor-pointer transition-transform active:scale-95 shadow-xs relative"
            >
              <span>{habit.emoji}</span>
              {stats.currentStreak > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-900" />
              )}
            </button>
          </td>
        ) : (
          <td
            className={`sticky left-0 z-10 ${rowBg} w-64 min-w-[220px] max-w-[260px] px-3.5 py-2 border-r border-[#2a2e37] font-medium text-xs text-slate-200 shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-all duration-200`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <span className="text-base select-none shrink-0">{habit.emoji}</span>
                <div className="flex flex-col truncate min-w-0">
                  <span className="truncate font-semibold text-slate-100" title={habit.name}>
                    {habit.name}
                  </span>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {showCategoryBadges && (
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                      >
                        <span>{catConfig.icon}</span>
                        <span>{cat}</span>
                      </span>
                    )}

                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                      {repLabel}
                    </span>

                    {stats.currentStreak > 0 && (
                      <span className="text-[9px] font-mono font-bold text-amber-400 flex items-center gap-0.5">
                        <Flame size={10} className="fill-amber-400" />
                        <span>{stats.currentStreak}d</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1">
                <button
                  onClick={() => onEditHabit(habit)}
                  title="Edit Habit"
                  className="p-1 hover:bg-[#2b2f38] text-slate-400 hover:text-white rounded"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  title="Delete Habit"
                  className="p-1 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </td>
        )}

        {/* Days Checkbox Cells with enlarged hitboxes for mobile touch */}
        {Array.from({ length: totalDays }, (_, dayIdx) => {
          const day = dayIdx + 1;
          const isScheduled = isDayScheduledForHabit(habit, year, monthIndex, day);
          const isChecked = !!checks[habit.id]?.[day];
          const isCurrentToday = isToday(year, monthIndex, day);
          const weekday = getWeekdayName(year, monthIndex, day);
          const isWeekend = weekday === 'Sa' || weekday === 'Su';

          return (
            <td
              key={day}
              className={`border-r border-[#2a2e37]/60 text-center py-1 transition-colors ${
                isCurrentToday
                  ? 'bg-emerald-950/30'
                  : isWeekend
                  ? 'bg-[#181a20]/40'
                  : ''
              }`}
            >
              {isScheduled ? (
                <div
                  onClick={() => onToggleCheck(habit.id, day)}
                  title={`${habit.name} - ${formatFullDate(year, monthIndex, day)}`}
                  className="w-full h-8 flex items-center justify-center p-1 cursor-pointer"
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`w-4 h-4 rounded-xs border mx-auto flex items-center justify-center transition-all duration-150 pointer-events-none ${
                      isChecked
                        ? 'border-transparent shadow-xs scale-105'
                        : 'border-[#383d47] bg-[#14161a] group-hover:border-slate-500'
                    }`}
                    style={{
                      backgroundColor: isChecked ? accentColor : undefined,
                      color: isChecked ? '#000000' : undefined,
                    }}
                  >
                    {isChecked && <Check size={11} strokeWidth={3.5} />}
                  </button>
                </div>
              ) : (
                <div
                  title="Not scheduled for this day"
                  className="w-full h-8 flex items-center justify-center opacity-20 pointer-events-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                </div>
              )}
            </td>
          );
        })}

        {/* 1. Habit Streak 🔥 Column */}
        <td className="px-2 py-1 border-r border-[#2a2e37] text-center font-mono text-xs">
          <div className="flex items-center justify-center gap-1">
            <Flame
              size={12}
              className={stats.currentStreak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-600'}
            />
            <span
              className={`font-bold ${
                stats.currentStreak > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              {stats.currentStreak}
            </span>
          </div>
        </td>

        {/* 2. Goal Column */}
        <td className="px-2 py-1 border-r border-[#2a2e37] text-center font-mono text-xs text-slate-300">
          {stats.goal}
        </td>

        {/* 3. Actual Column */}
        <td className="px-2 py-1 border-r border-[#2a2e37] text-center font-mono text-xs font-bold text-white">
          {stats.actual}
        </td>

        {/* 4. Left Column */}
        <td className="px-2 py-1 border-r border-[#2a2e37] text-center font-mono text-xs text-slate-400">
          {stats.left}
        </td>

        {/* 5. Progress Bar */}
        <td className="px-2.5 py-1 border-r border-[#2a2e37] align-middle">
          <div className="w-full bg-[#121316] h-2.5 rounded-xs overflow-hidden border border-[#2a2e37] flex">
            <div
              className="h-full rounded-xs transition-all duration-300"
              style={{
                width: `${Math.min(100, stats.percentage)}%`,
                backgroundColor:
                  stats.percentage >= 100
                    ? accentColor
                    : stats.percentage >= 50
                    ? '#38bdf8'
                    : '#fbbf24',
              }}
            />
          </div>
        </td>

        {/* 6. Percentage Rate Column */}
        <td className="px-2 py-1 text-center font-mono text-xs font-semibold text-slate-200">
          <span
            className={
              stats.percentage >= 100
                ? 'text-emerald-400 font-bold'
                : stats.percentage >= 50
                ? 'text-sky-300'
                : 'text-slate-400'
            }
          >
            {stats.percentage}%
          </span>
        </td>
      </tr>
    );
  }
};
