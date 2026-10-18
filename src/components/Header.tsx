import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code,
  FileSpreadsheet,
  Flame,
  LayoutGrid,
  MoreVertical,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { MONTH_NAMES } from '../constants/presets';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  year: number;
  activeMonth: number;
  availableYears: number[];
  streak: number;
  xp: number;
  soundEnabled: boolean;
  accentColor: string;
  onSelectMonth: (monthIndex: number) => void;
  onChangeYear: (year: number) => void;
  onOpenAddYearModal: () => void;
  onGoToToday: () => void;
  onToggleSound: () => void;
  onOpenAppsScript: () => void;
  onOpenHabitsManager: () => void;
  onFillSampleData: () => void;
  onResetMonth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  year,
  activeMonth,
  availableYears,
  streak,
  xp,
  soundEnabled,
  accentColor,
  onSelectMonth,
  onChangeYear,
  onOpenAddYearModal,
  onGoToToday,
  onToggleSound,
  onOpenAppsScript,
  onOpenHabitsManager,
  onFillSampleData,
  onResetMonth,
}) => {
  const currentMonthName = MONTH_NAMES[activeMonth];
  const level = Math.floor(xp / 100) + 1;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isOnline } = useOnlineStatus();

  const now = new Date();
  const todayFormatted = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      onChangeYear(year - 1);
      onSelectMonth(11);
    } else {
      onSelectMonth(activeMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      onChangeYear(year + 1);
      onSelectMonth(0);
    } else {
      onSelectMonth(activeMonth + 1);
    }
  };

  const handlePrevYear = () => {
    if (year > 1900) {
      onChangeYear(year - 1);
    }
  };

  const handleNextYear = () => {
    if (year < 2100) {
      onChangeYear(year + 1);
    }
  };

  return (
    <header className="bg-[#181a20] border-b border-[#2a2e37] px-3 sm:px-4 py-2 sm:py-2.5 select-none sticky top-0 z-30 shadow-md">
      {/* Top Row: Brand, Gamification Stats & Primary Actions */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white whitespace-nowrap">
                Habit Tracker
              </span>
              <span className="hidden xs:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                PRO
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400 line-clamp-1">
              Google Sheets Dark Productivity System
            </p>
          </div>
        </div>



        {/* Desktop Gamification Stats: Streak & Level (Visible sm: and up) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-400 text-xs font-semibold shadow-xs whitespace-nowrap">
            <Flame size={13} className="fill-amber-400 text-amber-400 animate-pulse shrink-0" />
            <span className="font-mono font-bold">{streak}d</span>
            <span className="text-[11px] font-normal text-amber-300/90">Streak</span>
          </div>

          {/* Level / XP Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/50 border border-sky-500/40 text-sky-400 text-xs font-semibold shadow-xs whitespace-nowrap">
            <Trophy size={12} className="text-sky-400 shrink-0" />
            <span className="font-mono font-bold">Lvl {level}</span>
            <span className="text-[10px] text-sky-300/80 font-mono">({xp} XP)</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Online / Offline Status Badge */}
          <div
            title={isOnline ? 'Online · Changes saved & local storage synced' : 'Offline Mode · Working 100% offline with local cache'}
            className={`hidden xs:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
            }`}
          >
            {isOnline ? (
              <Wifi size={13} className="text-emerald-400 shrink-0" />
            ) : (
              <WifiOff size={13} className="text-amber-400 shrink-0 animate-pulse" />
            )}
            <span className="text-[11px] font-mono">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* In-App PWA Install Button (Prompt & Standalone Awareness) */}
          <PWAInstallButton variant="header" />

          {/* Sound Toggle (Visible on sm and up; on mobile cleanly nested in [...] menu) */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className={`hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-[#111315] border-[#2a2e37] text-slate-300 hover:text-white'
                : 'bg-rose-950/40 border-rose-800/40 text-rose-400'
            }`}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Google Apps Script Modal Trigger (Desktop only; on mobile, housed in the toggle menu) */}
          <button
            onClick={onOpenAppsScript}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-950/50 active:scale-95 cursor-pointer whitespace-nowrap min-h-[36px]"
          >
            <Code size={14} className="stroke-[2.5] shrink-0" />
            <span>Google Apps Script</span>
          </button>

          {/* Desktop-only quick actions */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={onFillSampleData}
              title="Auto-fill sample checkmarks to preview full charts"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-[#111315] hover:bg-[#22252a] border border-[#2a2e37] rounded-lg transition-colors min-h-[36px]"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>Sample Data</span>
            </button>

            <button
              onClick={onResetMonth}
              title="Reset month checkmarks"
              className="p-2 text-slate-400 hover:text-white bg-[#111315] hover:bg-[#22252a] border border-[#2a2e37] rounded-lg transition-colors min-h-[36px]"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Mobile Overflow Menu Button (The Toggle) */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              title="Toggle actions menu"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#111315] border border-[#2a2e37] text-slate-300 hover:text-white active:scale-95"
            >
              <MoreVertical size={16} />
            </button>

            {showMobileMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-60 bg-[#181a20] border border-[#333842] rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn"
                onClick={() => setShowMobileMenu(false)}
              >
                {/* Connection Status & Gamification Stats inside menu */}
                <div className="px-3.5 py-2 border-b border-[#2a2e37] flex items-center justify-between text-xs bg-[#121316]">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
                    <Flame size={13} className="fill-amber-400" />
                    <span>{streak}d Streak</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* PWA In-App Install in Mobile Menu */}
                <PWAInstallButton
                  variant="menu"
                  onInstallStarted={() => setShowMobileMenu(false)}
                />
                {/* 1. Google Apps Script Export Trigger */}
                <button
                  onClick={onOpenAppsScript}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-amber-300 hover:bg-[#252830] flex items-center justify-between gap-2 border-b border-[#2a2e37] font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Code size={13} className="stroke-[2.5]" />
                    </div>
                    <span>Google Apps Script</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                    .gs
                  </span>
                </button>

                {/* 2. Mobile Sound Toggle */}
                <button
                  onClick={onToggleSound}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-[#22252a] flex items-center justify-between gap-2 border-b border-[#2a2e37]"
                >
                  <div className="flex items-center gap-2">
                    {soundEnabled ? <Volume2 size={14} className="text-emerald-400" /> : <VolumeX size={14} className="text-slate-400" />}
                    <span>Sound Effects</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    soundEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {soundEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 3. Add / Switch Year */}
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenAddYearModal();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-emerald-300 hover:bg-[#22252a] flex items-center justify-between gap-2 border-b border-[#2a2e37]"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-400" />
                    <span>Add / Change Year</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {year} +
                  </span>
                </button>

                <button
                  onClick={onOpenHabitsManager}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-[#22252a] flex items-center gap-2"
                >
                  <LayoutGrid size={14} className="text-sky-400" />
                  <span>Manage Habits</span>
                </button>
                <button
                  onClick={onFillSampleData}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:bg-[#22252a] flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Fill Sample Data</span>
                </button>
                <button
                  onClick={onResetMonth}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-rose-300 hover:bg-[#22252a] flex items-center gap-2"
                >
                  <RotateCcw size={14} className="text-rose-400" />
                  <span>Reset Active Month</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Month, Year & Today Navigation Controls (Responsive & Mobile-Fit) */}
      <div className="mt-2 pt-2 border-t border-[#2a2e37]/70 flex items-center justify-between gap-1 sm:gap-2 w-full max-w-full min-w-0">
        {/* Month Picker with Touch Arrows */}
        <div className="flex items-center bg-[#111315] border border-[#2a2e37] rounded-lg p-0.5 text-xs shrink-0">
          <button
            onClick={handlePrevMonth}
            title="Previous Month"
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-[#22252a] text-slate-300 hover:text-white rounded-md transition-colors active:scale-95"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2">
            <Calendar size={12} className="text-emerald-400 shrink-0" />
            <select
              value={activeMonth}
              onChange={(e) => onSelectMonth(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-0.5 text-xs max-w-[72px] sm:max-w-none"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx} className="bg-[#181a20] text-white">
                  {name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            title="Next Month"
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-[#22252a] text-slate-300 hover:text-white rounded-md transition-colors active:scale-95"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Year Selector with Stepper and + Add Year Option */}
        <div className="flex items-center bg-[#111315] border border-[#2a2e37] rounded-lg p-0.5 text-xs shrink-0">
          <button
            type="button"
            onClick={handlePrevYear}
            title="Previous Year"
            className="w-6 h-7 sm:w-7 sm:h-8 flex items-center justify-center hover:bg-[#22252a] text-slate-400 hover:text-white rounded-md transition-colors active:scale-95"
          >
            <ChevronLeft size={13} />
          </button>

          <select
            value={year}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__ADD_YEAR__') {
                onOpenAddYearModal();
              } else {
                onChangeYear(parseInt(val, 10));
              }
            }}
            className="bg-transparent text-slate-200 font-mono font-bold focus:outline-none cursor-pointer px-0.5 sm:px-1 text-xs"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className="bg-[#181a20] text-white">
                {yr}
              </option>
            ))}
            {!availableYears.includes(year) && (
              <option value={year} className="bg-[#181a20] text-white">
                {year}
              </option>
            )}
            <option value="__ADD_YEAR__" className="bg-[#17231c] text-emerald-400 font-bold">
              + Add Year...
            </option>
          </select>

          <button
            type="button"
            onClick={handleNextYear}
            title="Next Year"
            className="w-6 h-7 sm:w-7 sm:h-8 flex items-center justify-center hover:bg-[#22252a] text-slate-400 hover:text-white rounded-md transition-colors active:scale-95"
          >
            <ChevronRight size={13} />
          </button>

          <button
            type="button"
            onClick={onOpenAddYearModal}
            title="Add custom year with aligned calendar"
            className="h-7 sm:h-8 px-1.5 sm:px-2 flex items-center gap-0.5 sm:gap-1 hover:bg-emerald-950/70 text-emerald-400 hover:text-emerald-300 rounded-md transition-colors active:scale-95 border-l border-[#2a2e37] ml-0.5 font-semibold text-[11px]"
          >
            <Plus size={12} className="stroke-[2.5]" />
            <span className="hidden xs:inline">Year</span>
          </button>
        </div>

        {/* Quick Jump to Today Button */}
        <button
          onClick={onGoToToday}
          title="Jump to current day"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 h-7 sm:h-9 text-xs font-mono font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors active:scale-95 whitespace-nowrap shrink-0"
        >
          <Zap size={12} className="text-emerald-400 fill-emerald-400 shrink-0" />
          <span>Today</span>
          <span className="hidden sm:inline text-emerald-400/80 font-normal">({todayFormatted})</span>
        </button>
      </div>
    </header>
  );
};
