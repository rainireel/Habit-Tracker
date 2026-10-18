import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  HelpCircle,
  Play,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { ACCENT_THEMES } from '../constants/presets';
import { generateGoogleAppsScript } from '../services/appsScriptGenerator';
import { Habit } from '../types/tracker';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  habits: Habit[];
  accentColor: string;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  year: initialYear,
  habits,
  accentColor: initialAccent,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedAccent, setSelectedAccent] = useState<string>(initialAccent);
  const [startDay, setStartDay] = useState<'monday' | 'sunday'>('monday');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'code' | 'tutorial' | 'settings'>('code');

  if (!isOpen) return null;

  const scriptCode = generateGoogleAppsScript({
    year: selectedYear,
    habits,
    accentColor: selectedAccent,
    startDayOfWeek: startDay,
    createAllMonths: true,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitTracker_${selectedYear}.gs`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fadeIn select-none">
      <div className="bg-[#181a20] border border-[#333842] rounded-2xl sm:rounded-xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#22252a] px-4 sm:px-5 py-3 border-b border-[#333842] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0">
              <FileCode2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google Apps Script Generator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 hidden xs:inline-block">
                  Ready
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1">
                Generates the complete 12-month dark habit tracker spreadsheet in Google Sheets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs & Actions Bar */}
        <div className="bg-[#1c1f26] px-3 sm:px-5 py-2 border-b border-[#2a2e37] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar touch-pan-x py-0.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('code')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
                activeTab === 'code'
                  ? 'bg-slate-800 text-white border border-slate-600 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 size={13} />
              <span>Apps Script Code</span>
            </button>
            <button
              onClick={() => setActiveTab('tutorial')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
                activeTab === 'tutorial'
                  ? 'bg-slate-800 text-white border border-slate-600 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <HelpCircle size={13} />
              <span>Install Steps</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white border border-slate-600 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings size={13} />
              <span>Options</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className={`min-h-[36px] flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              title="Download .gs file"
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#22252a] hover:bg-[#2c3038] text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
              <span>.gs</span>
            </button>

            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#22252a] hover:bg-[#2c3038] text-sky-400 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>sheets.new</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar bg-[#111315]">
          {activeTab === 'code' && (
            <div className="relative">
              <div className="text-[11px] text-slate-400 mb-2 flex flex-wrap items-center justify-between gap-1">
                <span>
                  Language: <strong className="text-slate-200">Google Apps Script</strong> • Targets{' '}
                  <strong className="text-emerald-400">{selectedYear}</strong> • {habits.length} Habits
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {scriptCode.split('\n').length} lines
                </span>
              </div>

              <div className="relative rounded-xl border border-[#2a2e37] bg-[#0c0d10] p-3 sm:p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto shadow-inner">
                <pre>{scriptCode}</pre>
              </div>
            </div>
          )}

          {activeTab === 'tutorial' && (
            <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto py-1">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 sm:p-3.5 flex items-start gap-3">
                <Sparkles className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-slate-300">
                  <strong className="text-emerald-400 font-semibold">Ready in 30 Seconds:</strong> Builds all 12 monthly tabs, formats dark themes, configures checkboxes, formulas, and charts automatically.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                {/* Step 1 */}
                <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                      1
                    </span>
                    <h4 className="font-bold text-slate-200">Open a New Google Sheet</h4>
                  </div>
                  <p className="text-slate-400">
                    Visit{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline font-semibold"
                    >
                      sheets.new
                    </a>{' '}
                    in your browser or open any Google Sheets file.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                      2
                    </span>
                    <h4 className="font-bold text-slate-200">Open Apps Script Editor</h4>
                  </div>
                  <p className="text-slate-400">
                    In Google Sheets top menu bar, click on{' '}
                    <strong className="text-slate-200">Extensions &gt; Apps Script</strong>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                      3
                    </span>
                    <h4 className="font-bold text-slate-200">Paste Script &amp; Save</h4>
                  </div>
                  <p className="text-slate-400">
                    Delete existing code in <code className="text-amber-300">Code.gs</code>, paste this copied script, and click <strong className="text-slate-200">Save (💾)</strong>.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-3.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                      4
                    </span>
                    <h4 className="font-bold text-slate-200">Click Run</h4>
                  </div>
                  <p className="text-slate-400">
                    Select <code className="text-emerald-300">createHabitTrackerSheet</code> and click <strong className="text-slate-200">Run</strong>. Your 12 tabs are generated instantly!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 max-w-lg mx-auto py-2 text-xs">
              <div className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Customization Parameters
                </h3>

                {/* Year */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">Target Year</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2024, 2025, 2026, 2027].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setSelectedYear(yr)}
                        className={`min-h-[38px] rounded-lg border font-mono font-bold transition-colors active:scale-95 ${
                          selectedYear === yr
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-[#111315] border-[#2a2e37] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">Spreadsheet Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCENT_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedAccent(theme.hex)}
                        className={`min-h-[40px] p-2 rounded-lg border flex items-center gap-2 text-left transition-colors active:scale-95 ${
                          selectedAccent === theme.hex
                            ? 'bg-slate-800 text-white border-slate-500 font-semibold'
                            : 'bg-[#111315] text-slate-400 border-[#2a2e37] hover:text-slate-200'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: theme.hex }}
                        />
                        <span className="truncate">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* First Day of Week */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">First Day of Week</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setStartDay('monday')}
                      className={`min-h-[40px] px-3 py-2 rounded-lg border transition-colors text-center font-medium active:scale-95 ${
                        startDay === 'monday'
                          ? 'bg-slate-800 text-white border-slate-500 font-semibold'
                          : 'bg-[#111315] text-slate-400 border-[#2a2e37]'
                      }`}
                    >
                      Monday
                    </button>
                    <button
                      onClick={() => setStartDay('sunday')}
                      className={`min-h-[40px] px-3 py-2 rounded-lg border transition-colors text-center font-medium active:scale-95 ${
                        startDay === 'sunday'
                          ? 'bg-slate-800 text-white border-slate-500 font-semibold'
                          : 'bg-[#111315] text-slate-400 border-[#2a2e37]'
                      }`}
                    >
                      Sunday
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
