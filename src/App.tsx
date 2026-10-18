import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Sparkles,
  Table as TableIcon,
  Trash2,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { Achievements } from './components/Achievements';
import { AddYearModal } from './components/AddYearModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { EditHabitModal } from './components/EditHabitModal';
import { HabitGrid } from './components/HabitGrid';
import { HabitManagerModal } from './components/HabitManagerModal';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TopDashboard } from './components/TopDashboard';
import { WellnessSection } from './components/WellnessSection';
import { DEFAULT_CATEGORIES, DEFAULT_HABITS, MONTH_NAMES } from './constants/presets';
import { CategoryItem, DayWellness, Habit, MonthData } from './types/tracker';
import { evaluateAchievements } from './utils/achievementsUtils';
import {
  calculateHabitStreak,
  getDaysInMonth,
  playClickSound,
  playSuccessSound,
} from './utils/trackerUtils';

const STORAGE_KEY = 'ultimate_habit_tracker_state_v2';

const DEFAULT_YEARS = [2024, 2025, 2026, 2027, 2028];

export default function App() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [year, setYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.availableYears) && parsed.availableYears.length > 0) {
          const combined = Array.from(new Set([...DEFAULT_YEARS, ...parsed.availableYears, parsed.year || currentYear]));
          return combined.sort((a, b) => a - b);
        }
      }
    } catch {}
    return DEFAULT_YEARS;
  });

  const [activeMonth, setActiveMonth] = useState<number>(currentMonth);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [showCategoryBar, setShowCategoryBar] = useState<boolean>(false);
  const [showCategoryBadges, setShowCategoryBadges] = useState<boolean>(false);
  const [monthsData, setMonthsData] = useState<Record<string | number, MonthData>>({});
  const [accentColor, setAccentColor] = useState<string>('#4ade80');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [streak, setStreak] = useState<number>(14);
  const [xp, setXp] = useState<number>(780);

  // Active Grid View Mode ('day' on mobile by default, 'spreadsheet' on desktop)
  const [gridMode, setGridMode] = useState<'day' | 'spreadsheet' | 'calendar'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'day';
    return 'spreadsheet';
  });

  // Mobile Bottom Tab active selection
  const [activeMobileTab, setActiveMobileTab] = useState<'track' | 'sheet' | 'stats' | 'wellness' | 'badges'>('track');

  // Compact habit names mode for spreadsheet view (maximizes day columns space on mobile)
  const [isCompactNames, setIsCompactNames] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true;
    return false;
  });

  // Modals
  const [isAppsScriptOpen, setIsAppsScriptOpen] = useState<boolean>(false);
  const [isHabitManagerOpen, setIsHabitManagerOpen] = useState<boolean>(false);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState<boolean>(false);
  const [habitBeingEdited, setHabitBeingEdited] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState<boolean>(false);
  const [yearAddedToast, setYearAddedToast] = useState<string | null>(null);
  const yearToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resetSuccessToast, setResetSuccessToast] = useState<boolean>(false);
  const resetToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.habits?.length) setHabits(parsed.habits);
        if (parsed.customCategories?.length) setCustomCategories(parsed.customCategories);
        if (parsed.showCategoryBar !== undefined) setShowCategoryBar(parsed.showCategoryBar);
        if (parsed.showCategoryBadges !== undefined) setShowCategoryBadges(parsed.showCategoryBadges);
        if (parsed.monthsData) setMonthsData(parsed.monthsData);
        if (parsed.isCompactNames !== undefined) setIsCompactNames(parsed.isCompactNames);
        if (parsed.year) setYear(parsed.year);
        if (parsed.availableYears && Array.isArray(parsed.availableYears)) {
          setAvailableYears(Array.from(new Set([...DEFAULT_YEARS, ...parsed.availableYears, parsed.year || currentYear])).sort((a, b) => a - b));
        }
        if (parsed.activeMonth !== undefined) setActiveMonth(parsed.activeMonth);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.streak) setStreak(parsed.streak);
        if (parsed.xp) setXp(parsed.xp);
      } else {
        loadInitialSampleData(currentYear, currentMonth);
      }
    } catch {
      loadInitialSampleData(currentYear, currentMonth);
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    try {
      const stateToSave = {
        year,
        availableYears,
        activeMonth,
        habits,
        customCategories,
        showCategoryBar,
        showCategoryBadges,
        isCompactNames,
        monthsData,
        accentColor,
        streak,
        xp,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // storage quota or error
    }
  }, [year, availableYears, activeMonth, habits, customCategories, showCategoryBar, showCategoryBadges, isCompactNames, monthsData, accentColor, streak, xp]);

  const loadInitialSampleData = (sampleYear: number, sampleMonth: number) => {
    const daysInThisMonth = getDaysInMonth(sampleYear, sampleMonth);
    const sampleChecks: Record<string, Record<number, boolean>> = {};
    const sampleWellness: Record<number, DayWellness> = {};

    const maxDay = Math.min(26, daysInThisMonth);
    DEFAULT_HABITS.forEach((h, hIdx) => {
      sampleChecks[h.id] = {};
      for (let d = 1; d <= maxDay; d++) {
        const isChecked = (d + hIdx * 3) % 7 !== 0 && (d + hIdx) % 11 !== 0;
        sampleChecks[h.id][d] = isChecked;
      }
    });

    for (let d = 1; d <= maxDay; d++) {
      sampleWellness[d] = {
        mood: Math.min(5, Math.max(2, 3 + ((d % 4) - 1))),
        sleep: Math.round((6.5 + ((d * 3) % 4) * 0.5) * 10) / 10,
      };
    }

    const sampleKey = `${sampleYear}_${sampleMonth}`;
    setMonthsData({
      [sampleKey]: {
        monthIndex: sampleMonth,
        year: sampleYear,
        checks: sampleChecks,
        wellness: sampleWellness,
      },
      [sampleMonth]: {
        monthIndex: sampleMonth,
        year: sampleYear,
        checks: sampleChecks,
        wellness: sampleWellness,
      },
    });
  };

  // Helper to key month data by year and month index
  const getMonthKey = (y: number, m: number) => `${y}_${m}`;
  const currentMonthKey = getMonthKey(year, activeMonth);

  // Get active month data
  const currentMonthRecord: MonthData = useMemo(() => {
    if (monthsData[currentMonthKey]) return monthsData[currentMonthKey];
    if (monthsData[activeMonth] && monthsData[activeMonth].year === year) {
      return monthsData[activeMonth];
    }
    return {
      monthIndex: activeMonth,
      year,
      checks: {},
      wellness: {},
    };
  }, [monthsData, currentMonthKey, activeMonth, year]);

  const currentChecks = currentMonthRecord.checks || {};
  const currentWellness = currentMonthRecord.wellness || {};

  // Live Streak calculation across all habits for the active month
  const activeTopStreak = habits.reduce((max, h) => {
    const s = calculateHabitStreak(h, currentChecks, year, activeMonth).currentStreak;
    return s > max ? s : max;
  }, 0);

  // Gamification & Badges Engine
  const liveAchievements = evaluateAchievements(habits, currentChecks, currentWellness, year, activeMonth);

  // Badges & Achievement XP sync (quietly awards XP without intrusive confetti or popups)
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentlyUnlocked = liveAchievements.filter((a) => a.unlocked);
    const newBadge = currentlyUnlocked.find((a) => !prevUnlockedRef.current.has(a.id));

    if (newBadge && prevUnlockedRef.current.size > 0) {
      setXp((prev) => prev + newBadge.xpReward);
    }

    prevUnlockedRef.current = new Set(currentlyUnlocked.map((a) => a.id));
  }, [liveAchievements]);

  // Toggle habit checkbox
  const handleToggleCheck = (habitId: string, day: number) => {
    if (soundEnabled) playClickSound();

    const updatedMonthChecks = { ...currentChecks };
    if (!updatedMonthChecks[habitId]) {
      updatedMonthChecks[habitId] = {};
    }

    const wasChecked = !!updatedMonthChecks[habitId][day];
    const willBeChecked = !wasChecked;
    updatedMonthChecks[habitId] = {
      ...updatedMonthChecks[habitId],
      [day]: willBeChecked,
    };

    if (willBeChecked) {
      const allDone = habits.every((h) =>
        h.id === habitId ? true : !!updatedMonthChecks[h.id]?.[day]
      );
      if (allDone) {
        if (soundEnabled) playSuccessSound();
        setStreak((prev) => prev + 1);
        setXp((prev) => prev + 50);
      } else {
        setXp((prev) => prev + 5);
      }
    }

    setMonthsData((prev) => ({
      ...prev,
      [currentMonthKey]: {
        ...currentMonthRecord,
        monthIndex: activeMonth,
        year,
        checks: updatedMonthChecks,
      },
      [activeMonth]: {
        ...currentMonthRecord,
        monthIndex: activeMonth,
        year,
        checks: updatedMonthChecks,
      },
    }));
  };

  // Check / Uncheck all habits for a specific day
  const handleCheckAllDay = (day: number) => {
    const allCurrentlyChecked = habits.every((h) => !!currentChecks[h.id]?.[day]);
    const targetState = !allCurrentlyChecked;

    const updatedMonthChecks = { ...currentChecks };
    habits.forEach((h) => {
      if (!updatedMonthChecks[h.id]) updatedMonthChecks[h.id] = {};
      updatedMonthChecks[h.id] = {
        ...updatedMonthChecks[h.id],
        [day]: targetState,
      };
    });

    if (targetState) {
      if (soundEnabled) playSuccessSound();
      setXp((prev) => prev + 30);
    } else if (soundEnabled) {
      playClickSound();
    }

    setMonthsData((prev) => ({
      ...prev,
      [currentMonthKey]: {
        ...currentMonthRecord,
        checks: updatedMonthChecks,
      },
      [activeMonth]: {
        ...currentMonthRecord,
        checks: updatedMonthChecks,
      },
    }));
  };

  // Update day wellness (mood / sleep)
  const handleUpdateDayWellness = (day: number, updates: Partial<DayWellness>) => {
    if (soundEnabled) playClickSound();

    const updatedWellness = {
      ...currentWellness,
      [day]: {
        ...currentWellness[day],
        ...updates,
      },
    };

    setMonthsData((prev) => ({
      ...prev,
      [currentMonthKey]: {
        ...currentMonthRecord,
        wellness: updatedWellness,
      },
      [activeMonth]: {
        ...currentMonthRecord,
        wellness: updatedWellness,
      },
    }));
  };

  // Save new habits
  const handleSaveHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
  };

  // Save single edited or created habit from EditHabitModal
  const handleSaveSingleHabit = (savedHabit: Habit) => {
    if (habitBeingEdited) {
      setHabits((prev) => prev.map((h) => (h.id === savedHabit.id ? savedHabit : h)));
    } else {
      setHabits((prev) => [...prev, savedHabit]);
    }
    if (soundEnabled) playSuccessSound();
  };

  // Edit habit opens the dedicated EditHabitModal with category customization
  const handleEditHabit = (habitToEdit: Habit) => {
    setHabitBeingEdited(habitToEdit);
    setIsEditHabitModalOpen(true);
  };

  // Open add habit modal
  const handleOpenAddHabit = () => {
    setHabitBeingEdited(null);
    setIsEditHabitModalOpen(true);
  };

  // Delete habit trigger (opens in-app confirm modal)
  const handleDeleteHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      setHabitToDelete(habit);
    }
  };

  const confirmDeleteHabit = () => {
    if (habitToDelete) {
      setHabits(habits.filter((h) => h.id !== habitToDelete.id));
      setHabitToDelete(null);
      if (soundEnabled) playClickSound();
    }
  };

  // Jump to today
  const handleGoToToday = () => {
    const now = new Date();
    const todayYear = now.getFullYear();
    setYear(todayYear);
    setAvailableYears((prev) => {
      if (!prev.includes(todayYear)) {
        return [...prev, todayYear].sort((a, b) => a - b);
      }
      return prev;
    });
    setActiveMonth(now.getMonth());
    setGridMode('day');
    setActiveMobileTab('track');
    if (soundEnabled) playClickSound();
  };

  // Add new year with verified, aligned calendar
  const handleAddYear = (newYear: number) => {
    if (isNaN(newYear) || newYear < 1900 || newYear > 2100) return;

    setAvailableYears((prev) => {
      const updated = Array.from(new Set([...prev, newYear])).sort((a, b) => a - b);
      return updated;
    });

    setYear(newYear);
    setIsAddYearModalOpen(false);

    if (soundEnabled) playSuccessSound();

    setYearAddedToast(`Year ${newYear} calendar generated & aligned!`);
    if (yearToastTimerRef.current) clearTimeout(yearToastTimerRef.current);
    yearToastTimerRef.current = setTimeout(() => {
      setYearAddedToast(null);
    }, 2000);
  };

  // Change active year
  const handleChangeYear = (newYear: number) => {
    setYear(newYear);
    setAvailableYears((prev) => {
      if (!prev.includes(newYear)) {
        return [...prev, newYear].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  // Fill sample data for active month
  const handleFillSampleData = () => {
    const daysCount = getDaysInMonth(year, activeMonth);
    const sampleChecks: Record<string, Record<number, boolean>> = {};
    const sampleWellness: Record<number, DayWellness> = {};

    habits.forEach((h, hIdx) => {
      sampleChecks[h.id] = {};
      for (let d = 1; d <= daysCount; d++) {
        const isChecked = (d * 7 + hIdx * 11) % 10 < 8;
        sampleChecks[h.id][d] = isChecked;
      }
    });

    for (let d = 1; d <= daysCount; d++) {
      sampleWellness[d] = {
        mood: ((d + 2) % 5) + 1,
        sleep: 7 + ((d % 3) * 0.5),
      };
    }

    setMonthsData((prev) => ({
      ...prev,
      [currentMonthKey]: {
        monthIndex: activeMonth,
        year,
        checks: sampleChecks,
        wellness: sampleWellness,
      },
      [activeMonth]: {
        monthIndex: activeMonth,
        year,
        checks: sampleChecks,
        wellness: sampleWellness,
      },
    }));

    if (soundEnabled) playSuccessSound();
  };

  // Simple & direct Reset active month checkmarks (instant 1-tap, no annoying blocking modals)
  const handleResetMonth = () => {
    if (soundEnabled) playClickSound();

    setMonthsData((prev) => {
      const updated = {
        ...prev,
        [currentMonthKey]: {
          monthIndex: activeMonth,
          year,
          checks: {},
          wellness: {},
        },
        [activeMonth]: {
          monthIndex: activeMonth,
          year,
          checks: {},
          wellness: {},
        },
      };
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        parsed.monthsData = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // storage error ignored
      }
      return updated;
    });

    setResetSuccessToast(true);
    if (resetToastTimerRef.current) clearTimeout(resetToastTimerRef.current);
    resetToastTimerRef.current = setTimeout(() => {
      setResetSuccessToast(false);
    }, 1500);
  };

  // Mobile Bottom Navigation Handler
  const handleMobileNavClick = (tab: 'track' | 'sheet' | 'stats' | 'wellness' | 'badges') => {
    setActiveMobileTab(tab);
    if (tab === 'track') {
      setGridMode('day');
      document.getElementById('habit-grid-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'sheet') {
      setGridMode('spreadsheet');
      document.getElementById('habit-grid-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'stats') {
      document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'wellness') {
      document.getElementById('wellness-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'badges') {
      document.getElementById('achievements-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#111315] text-slate-100 flex flex-col font-sans pb-16 md:pb-0 w-full max-w-full overflow-x-hidden">
      {/* 1. Header Bar */}
      <Header
        year={year}
        activeMonth={activeMonth}
        availableYears={availableYears}
        streak={activeTopStreak > 0 ? activeTopStreak : streak}
        xp={xp}
        soundEnabled={soundEnabled}
        accentColor={accentColor}
        onSelectMonth={setActiveMonth}
        onChangeYear={handleChangeYear}
        onOpenAddYearModal={() => setIsAddYearModalOpen(true)}
        onGoToToday={handleGoToToday}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenAppsScript={() => setIsAppsScriptOpen(true)}
        onOpenHabitsManager={() => setIsHabitManagerOpen(true)}
        onFillSampleData={handleFillSampleData}
        onResetMonth={handleResetMonth}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 p-2 sm:p-4 max-w-[1500px] w-full max-w-full mx-auto flex flex-col min-w-0">
        {/* Top KPI & Progress Cards */}
        <TopDashboard
          year={year}
          monthIndex={activeMonth}
          habits={habits}
          checks={currentChecks}
          accentColor={accentColor}
        />

        {/* Milestones & Achievements Showcase */}
        <Achievements
          achievements={liveAchievements}
          accentColor={accentColor}
        />

        {/* Main Habit Tracker Grid */}
        <HabitGrid
          year={year}
          monthIndex={activeMonth}
          habits={habits}
          checks={currentChecks}
          wellness={currentWellness}
          onUpdateDayWellness={handleUpdateDayWellness}
          customCategories={customCategories}
          showCategoryBar={showCategoryBar}
          onToggleCategoryBar={() => setShowCategoryBar((prev) => !prev)}
          showCategoryBadges={showCategoryBadges}
          onToggleCategoryBadges={() => setShowCategoryBadges((prev) => !prev)}
          accentColor={accentColor}
          onToggleCheck={handleToggleCheck}
          onCheckAllDay={handleCheckAllDay}
          onOpenHabitManager={handleOpenAddHabit}
          onOpenFullManager={() => setIsHabitManagerOpen(true)}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
          activeViewMode={gridMode}
          onViewModeChange={setGridMode}
          isCompactNames={isCompactNames}
          onToggleCompactNames={() => setIsCompactNames((prev) => !prev)}
        />

        {/* Overall Wellness Section (Mood + Sleep + Sparkline) */}
        <WellnessSection
          year={year}
          monthIndex={activeMonth}
          wellness={currentWellness}
          accentColor={accentColor}
          onUpdateDayWellness={handleUpdateDayWellness}
          isCompactNames={isCompactNames}
        />
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Appears on screens < md, height <= 15% viewport) */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#16181f]/95 backdrop-blur-md border-t border-[#2a2e37] px-2 py-1 pb-safe shadow-2xl">
        <div className="grid grid-cols-5 items-center h-13">
          {/* Tab 1: Day Track */}
          <button
            onClick={() => handleMobileNavClick('track')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
              activeMobileTab === 'track' && gridMode === 'day'
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={18} className={activeMobileTab === 'track' && gridMode === 'day' ? 'fill-emerald-400' : ''} />
            <span className="text-[10px] tracking-tight">Today</span>
          </button>

          {/* Tab 2: Spreadsheet Grid */}
          <button
            onClick={() => handleMobileNavClick('sheet')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
              activeMobileTab === 'sheet' || (activeMobileTab === 'track' && gridMode === 'spreadsheet')
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon size={18} />
            <span className="text-[10px] tracking-tight">Sheet</span>
          </button>

          {/* Tab 3: Stats & Charts */}
          <button
            onClick={() => handleMobileNavClick('stats')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
              activeMobileTab === 'stats'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp size={18} />
            <span className="text-[10px] tracking-tight">Stats</span>
          </button>

          {/* Tab 4: Wellness */}
          <button
            onClick={() => handleMobileNavClick('wellness')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
              activeMobileTab === 'wellness'
                ? 'text-purple-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={18} />
            <span className="text-[10px] tracking-tight">Wellness</span>
          </button>

          {/* Tab 5: Badges / XP */}
          <button
            onClick={() => handleMobileNavClick('badges')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
              activeMobileTab === 'badges'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={18} />
            <span className="text-[10px] tracking-tight">Badges</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AppsScriptModal
        isOpen={isAppsScriptOpen}
        onClose={() => setIsAppsScriptOpen(false)}
        year={year}
        habits={habits}
        accentColor={accentColor}
      />

      <EditHabitModal
        isOpen={isEditHabitModalOpen}
        onClose={() => setIsEditHabitModalOpen(false)}
        habit={habitBeingEdited}
        customCategories={customCategories}
        onSaveHabit={handleSaveSingleHabit}
        onUpdateCategories={(newCats) => setCustomCategories(newCats)}
      />

      <HabitManagerModal
        isOpen={isHabitManagerOpen}
        onClose={() => setIsHabitManagerOpen(false)}
        habits={habits}
        customCategories={customCategories}
        onSaveHabits={handleSaveHabits}
        onUpdateCategories={(newCats) => setCustomCategories(newCats)}
      />



      {/* In-App Confirmation Modal: Delete Habit */}
      {habitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181a20] border border-rose-500/40 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Habit?</h3>
                <p className="text-xs text-slate-400 truncate">{habitToDelete.emoji} {habitToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Are you sure you want to delete <strong className="text-white">"{habitToDelete.name}"</strong>? All progress history for this habit will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setHabitToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#121316] hover:bg-[#22252a] text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteHabit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 size={14} />
                <span>Delete Habit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Notification (lasts 1.5s only) */}
      {resetSuccessToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#16181f] border border-emerald-500/60 text-emerald-200 text-xs px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 animate-fadeIn">
          <RotateCcw size={13} className="text-emerald-400 shrink-0" />
          <span>Active month checkboxes cleared ({MONTH_NAMES[activeMonth]} {year})</span>
        </div>
      )}

      {/* Year Added Notification (lasts 2s) */}
      {yearAddedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#16181f] border border-emerald-500/60 text-emerald-200 text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fadeIn font-medium">
          <Calendar size={14} className="text-emerald-400 shrink-0" />
          <span>{yearAddedToast}</span>
        </div>
      )}

      {/* Add Year Modal (with live verified calendar alignment) */}
      <AddYearModal
        isOpen={isAddYearModalOpen}
        currentYear={year}
        availableYears={availableYears}
        onClose={() => setIsAddYearModalOpen(false)}
        onAddYear={handleAddYear}
      />

      {/* Online / Offline Connectivity Toast & Status */}
      <OfflineIndicator />
    </div>
  );
}
