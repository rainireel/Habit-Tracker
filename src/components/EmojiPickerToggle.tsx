import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Sparkles, X } from 'lucide-react';
import {
  EMOJI_CATEGORIES,
  MASSIVE_EMOJI_COLLECTION,
  QUICK_POPULAR_EMOJIS,
} from '../constants/emojis';

interface EmojiPickerToggleProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
  accentColor?: string;
  label?: string;
  quickPicks?: string[];
}

export const EmojiPickerToggle: React.FC<EmojiPickerToggleProps> = ({
  selectedEmoji,
  onSelectEmoji,
  accentColor = '#4ade80',
  label = 'Select Icon',
  quickPicks,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const quickList = quickPicks || QUICK_POPULAR_EMOJIS;

  // Filter emojis based on active category & search query
  const filteredEmojis = useMemo(() => {
    let list = MASSIVE_EMOJI_COLLECTION;

    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q) ||
          item.emoji === q
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
  };

  return (
    <div className="space-y-2 select-none">
      {/* Top Header & Minimalist Quick Picks */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[10px] text-slate-500 font-mono">(Click icon or browse)</span>
        </label>

        {/* Minimalist Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
            isOpen
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-xs'
              : 'bg-[#181a20] border-[#333842] text-slate-300 hover:text-white hover:border-slate-500'
          }`}
        >
          <Sparkles size={12} className={isOpen ? 'text-emerald-400' : 'text-amber-400'} />
          <span>{isOpen ? 'Close Emoji Library' : 'Browse All (200+)'}</span>
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Row 1: Current Selected Emoji Avatar + Quick Pick Strip */}
      <div className="flex items-center gap-2">
        {/* Main Emoji Avatar Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Click to toggle full emoji library"
          className="w-10 h-10 rounded-lg bg-[#14161b] border-2 border-emerald-500/60 flex items-center justify-center text-xl shrink-0 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
        >
          <span>{selectedEmoji}</span>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black border border-[#111315]">
            ✎
          </div>
        </button>

        {/* Quick Popular Picks Bar (Minimalist) */}
        <div className="flex-1 flex flex-wrap items-center gap-1 bg-[#14161b] border border-[#2a2e37] p-1 rounded-lg overflow-x-auto custom-scrollbar">
          {quickList.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleSelect(em)}
              className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all hover:scale-115 cursor-pointer ${
                selectedEmoji === em
                  ? 'bg-emerald-500/30 border border-emerald-400 ring-1 ring-emerald-400/40 shadow-xs scale-105'
                  : 'hover:bg-[#22252a] text-slate-300'
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* EXPANDABLE MASSIVE COLLECTION (TOGGLE DRAWER) */}
      {isOpen && (
        <div className="mt-2.5 bg-[#121418] border border-[#2f3542] rounded-xl p-3 sm:p-3.5 space-y-3 shadow-2xl animate-fadeIn">
          {/* Search Bar + Quick Close */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emojis... (e.g. gym, water, sleep, book, work)"
                className="w-full bg-[#181a20] border border-[#333842] rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#22252a] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Close picker"
            >
              <X size={14} />
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
            {EMOJI_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-[#181a20] border border-[#2a2e37] text-slate-300 hover:text-white hover:bg-[#22252a]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Emoji Grid */}
          <div className="max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {filteredEmojis.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No emojis found matching "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-10 gap-1 sm:gap-1.5">
                {filteredEmojis.map((item) => {
                  const isSelected = selectedEmoji === item.emoji;
                  return (
                    <button
                      key={item.name + item.emoji}
                      type="button"
                      title={item.name}
                      onClick={() => handleSelect(item.emoji)}
                      className={`h-9 w-full rounded-lg flex items-center justify-center text-lg transition-all hover:scale-120 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/30 border-2 border-emerald-400 scale-110 shadow-sm'
                          : 'bg-[#181a20]/70 hover:bg-[#252832] border border-[#2a2e37]/40'
                      }`}
                    >
                      {item.emoji}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Footer info & minimize action */}
          <div className="pt-2 border-t border-[#22252a] flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Showing <strong className="text-emerald-400">{filteredEmojis.length}</strong> emojis
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>Done</span>
              <ChevronUp size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
