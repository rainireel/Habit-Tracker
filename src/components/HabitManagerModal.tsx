import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Folder,
  Palette,
  Plus,
  Repeat,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { DEFAULT_CATEGORIES, HABIT_PRESETS } from '../constants/presets';
import { CategoryItem, Habit, HabitCategory, RepetitionType } from '../types/tracker';
import { EmojiPickerToggle } from './EmojiPickerToggle';

interface HabitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  customCategories: CategoryItem[];
  onSaveHabits: (habits: Habit[]) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
}

const COMMON_EMOJIS = ['⏰', '💪', '📖', '📅', '🎯', '🌿', '📝', '💧', '🧘', '👟', '🌙', '🏋️', '📚', '🥗', '💻', '☀️', '🚿', '🧠', '📵', '✨', '⚡', '🍾', '🍵', '🍎'];
const CATEGORY_EMOJIS = ['🥗', '💪', '💼', '🧘', '🎯', '🌿', '💰', '📚', '🎨', '🧠', '❤️', '✈️', '⚡', '☕', '🏠'];
const WEEKDAYS = [
  { label: 'Su', index: 0 },
  { label: 'Mo', index: 1 },
  { label: 'Tu', index: 2 },
  { label: 'We', index: 3 },
  { label: 'Th', index: 4 },
  { label: 'Fr', index: 5 },
  { label: 'Sa', index: 6 },
];

export const HabitManagerModal: React.FC<HabitManagerModalProps> = ({
  isOpen,
  onClose,
  habits: initialHabits,
  customCategories: initialCustomCategories,
  onSaveHabits,
  onUpdateCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'habits' | 'categories'>('habits');
  const [habitsList, setHabitsList] = useState<Habit[]>(initialHabits);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(
    initialCustomCategories && initialCustomCategories.length > 0
      ? initialCustomCategories
      : DEFAULT_CATEGORIES
  );

  // New Habit form state
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('⚡');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory>('Health');
  const [repetitionType, setRepetitionType] = useState<RepetitionType>('daily');
  const [specificDays, setSpecificDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // New Custom Category form state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📌');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    if (specificDays.includes(dayIndex)) {
      if (specificDays.length > 1) {
        setSpecificDays(specificDays.filter((d) => d !== dayIndex));
      }
    } else {
      setSpecificDays([...specificDays, dayIndex].sort());
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: 'h_' + Date.now(),
      name: newHabitName.trim(),
      emoji: newHabitEmoji || '🎯',
      category: selectedCategory,
      repetitionType,
      specificDays: repetitionType === 'specific_days' ? specificDays : undefined,
      weeklyTarget: repetitionType === 'weekly' ? weeklyTarget : undefined,
    };

    setHabitsList([...habitsList, newHabit]);
    setNewHabitName('');
  };

  const handleDeleteHabit = (id: string) => {
    setHabitsList(habitsList.filter((h) => h.id !== id));
  };

  const handleUpdateHabitCategory = (habitId: string, newCategory: string) => {
    setHabitsList((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, category: newCategory } : h))
    );
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    // Check duplicate
    if (categoriesList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('A category with this name already exists.');
      return;
    }

    const newCat: CategoryItem = {
      id: 'cat_' + Date.now(),
      name: trimmed,
      emoji: newCatEmoji || '📌',
      color: '#38bdf8',
      isCustom: true,
    };

    const updated = [...categoriesList, newCat];
    setCategoriesList(updated);
    onUpdateCategories(updated);
    setSelectedCategory(trimmed);
    setNewCatName('');
    setIsAddingCategory(false);
    setCategoryError(null);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (categoriesList.length <= 1) {
      setCategoryError('You must have at least one category.');
      return;
    }
    const updated = categoriesList.filter((c) => c.id !== catId);
    setCategoriesList(updated);
    onUpdateCategories(updated);
    setCategoryError(null);

    // Reassign any habits that used this deleted category to the first remaining category
    const fallbackCategory = updated[0].name;
    setHabitsList((prev) =>
      prev.map((h) => (h.category === catName ? { ...h, category: fallbackCategory } : h))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= habitsList.length) return;
    const copy = [...habitsList];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setHabitsList(copy);
  };

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = HABIT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newHabits: Habit[] = preset.habits.map((item, idx) => {
      let autoCategory: HabitCategory = 'Health';
      const lower = item.name.toLowerCase();
      if (lower.includes('gym') || lower.includes('step') || lower.includes('lift')) autoCategory = 'Fitness';
      else if (lower.includes('work') || lower.includes('code') || lower.includes('read') || lower.includes('algo')) autoCategory = 'Career';
      else if (lower.includes('detox') || lower.includes('meditat') || lower.includes('breath') || lower.includes('journal')) autoCategory = 'Mindfulness';
      else if (lower.includes('plan') || lower.includes('inbox') || lower.includes('deep')) autoCategory = 'Productivity';

      return {
        id: 'preset_' + idx + '_' + Date.now(),
        name: item.name,
        emoji: item.emoji,
        category: autoCategory,
        repetitionType: (item.repetitionType as RepetitionType) || 'daily',
        specificDays: item.specificDays,
        weeklyTarget: item.weeklyTarget,
      };
    });

    setHabitsList(newHabits);
  };

  const handleSave = () => {
    onSaveHabits(habitsList);
    onUpdateCategories(categoriesList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fadeIn select-none">
      <div className="bg-[#181a20] border border-[#333842] rounded-2xl sm:rounded-xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Tabs */}
        <div className="bg-[#22252a] px-4 sm:px-5 py-3 border-b border-[#333842] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400 shrink-0">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Manage Habits &amp; Categories</h2>
              <p className="text-[10px] text-slate-400">
                Customize habit recurrence, schedule, and category tags.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Navigation Switcher Tabs */}
            <div className="flex items-center bg-[#181a20] p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('habits')}
                className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'habits'
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Habits ({habitsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  activeTab === 'categories'
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tag size={11} className="text-sky-400" />
                <span>Categories</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TAB 1: HABITS MANAGER */}
        {activeTab === 'habits' && (
          <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
            {/* Preset Selector */}
            <div className="bg-[#111315] border border-[#2a2e37] rounded-lg p-3">
              <label className="block text-slate-300 font-semibold mb-1.5">
                Load Curated Discipline Presets:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HABIT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-2 rounded-md border text-left transition-colors flex flex-col gap-0.5 ${
                      selectedPresetId === preset.id
                        ? 'bg-sky-950/40 border-sky-500 text-sky-200'
                        : 'bg-[#181a20] border-[#2a2e37] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="font-bold text-white truncate">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Habit Form with Category & Recurrence */}
            <form onSubmit={handleAddHabit} className="bg-[#111315] border border-[#2a2e37] rounded-lg p-3.5 space-y-3">
              <label className="block text-slate-300 font-semibold">Add New Habit</label>

              {/* Name */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g. Gym Strength, Read 20 Pages..."
                  className="w-full bg-[#181a20] border border-[#333842] rounded-md px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Emoji Picker with Minimalist Toggle */}
              <div className="bg-[#181a20] p-2.5 rounded-lg border border-[#333842]">
                <EmojiPickerToggle
                  selectedEmoji={newHabitEmoji}
                  onSelectEmoji={setNewHabitEmoji}
                  label="Habit Icon & Emoji Library:"
                />
              </div>

              {/* Category Selector with Inline "+ New Category" button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Tag size={12} className="text-sky-400" />
                    <span>Assign Category:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="text-sky-400 hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    <Plus size={12} />
                    <span>Customize Categories</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-slate-800 text-white border-sky-400 ring-1 ring-sky-400 font-bold shadow-xs'
                            : 'bg-[#181a20] border-[#2a2e37] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recurrence Mode Selector */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Repeat size={12} className="text-emerald-400" />
                  <span>Repetition Schedule:</span>
                </span>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRepetitionType('daily')}
                    className={`py-1.5 px-2 rounded-md border text-center font-medium transition-colors ${
                      repetitionType === 'daily'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#181a20] border-[#2a2e37] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Daily (7 Days)
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepetitionType('specific_days')}
                    className={`py-1.5 px-2 rounded-md border text-center font-medium transition-colors ${
                      repetitionType === 'specific_days'
                        ? 'bg-sky-950/60 border-sky-500 text-sky-300 font-bold'
                        : 'bg-[#181a20] border-[#2a2e37] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Specific Weekdays
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepetitionType('weekly')}
                    className={`py-1.5 px-2 rounded-md border text-center font-medium transition-colors ${
                      repetitionType === 'weekly'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                        : 'bg-[#181a20] border-[#2a2e37] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Weekly Target (X/wk)
                  </button>
                </div>

                {/* Specific days pills */}
                {repetitionType === 'specific_days' && (
                  <div className="bg-[#181a20] p-2 rounded border border-[#2a2e37] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Select Scheduled Days:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSpecificDays([1, 2, 3, 4, 5])}
                          className="text-sky-400 hover:underline"
                        >
                          Mon–Fri
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpecificDays([1, 3, 5])}
                          className="text-sky-400 hover:underline"
                        >
                          Mon/Wed/Fri
                        </button>
                        <button
                          type="button"
                          onClick={() => setSpecificDays([0, 6])}
                          className="text-sky-400 hover:underline"
                        >
                          Weekends
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      {WEEKDAYS.map((wd) => {
                        const isSelected = specificDays.includes(wd.index);
                        return (
                          <button
                            key={wd.index}
                            type="button"
                            onClick={() => toggleDay(wd.index)}
                            className={`flex-1 py-1 rounded text-center font-mono font-bold transition-colors ${
                              isSelected
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {wd.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Weekly target stepper */}
                {repetitionType === 'weekly' && (
                  <div className="bg-[#181a20] p-2 rounded border border-[#2a2e37] flex items-center justify-between">
                    <span className="text-slate-300">Target sessions per week:</span>
                    <div className="flex items-center gap-2">
                      {[2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setWeeklyTarget(num)}
                          className={`w-7 h-7 rounded font-mono font-bold transition-colors ${
                            weeklyTarget === num
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Button */}
              <div className="flex items-center justify-end pt-2 border-t border-[#2a2e37]">
                <button
                  type="submit"
                  disabled={!newHabitName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add Habit to Tracker</span>
                </button>
              </div>
            </form>

            {/* Current Habits List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
                <span>Active Habits ({habitsList.length})</span>
                <span>Select category dropdown to change</span>
              </div>

              <div className="space-y-1">
                {habitsList.map((habit, index) => {
                  const rep = habit.repetitionType || 'daily';
                  let repText = 'Daily';
                  if (rep === 'specific_days') {
                    repText = (habit.specificDays || []).map((d) => WEEKDAYS[d]?.label).join('/');
                  } else if (rep === 'weekly') {
                    repText = `${habit.weeklyTarget || 3}x/week`;
                  }

                  const currentCat = habit.category || 'Health';

                  return (
                    <div
                      key={habit.id}
                      className="bg-[#181a20] border border-[#2a2e37] rounded-md px-3 py-1.5 flex items-center justify-between gap-2 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                        <span className="text-base select-none shrink-0">{habit.emoji}</span>
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                          <span className="font-medium text-slate-200 truncate">{habit.name}</span>

                          {/* Direct Category Dropdown */}
                          <select
                            value={currentCat}
                            onChange={(e) => handleUpdateHabitCategory(habit.id, e.target.value)}
                            className="bg-[#121316] text-[10px] text-slate-300 border border-[#2a2e37] rounded px-1.5 py-0.5 focus:outline-none focus:border-sky-400 cursor-pointer shrink-0"
                          >
                            {categoriesList.map((cat) => (
                              <option key={cat.id} value={cat.name} className="bg-[#181a20] text-white">
                                {cat.emoji} {cat.name}
                              </option>
                            ))}
                          </select>

                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            {repText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === habitsList.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors ml-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM CATEGORIES MANAGER */}
        {activeTab === 'categories' && (
          <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
            {/* Create Custom Category Card */}
            <form onSubmit={handleAddCategory} className="bg-[#111315] border border-[#2a2e37] rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Tag size={13} className="text-sky-400" />
                  <span>Create Custom Category</span>
                </label>
                <span className="text-[10px] text-slate-400">e.g. Finances, Learning, Family</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  maxLength={4}
                  placeholder="🏷️"
                  className="w-12 text-center bg-[#181a20] border border-[#333842] rounded-md py-1.5 text-base focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name (e.g. Finances, Study, Art)..."
                  className="flex-1 bg-[#181a20] border border-[#333842] rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold rounded-md flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} />
                  <span>Add Category</span>
                </button>
              </div>

              {categoryError && (
                <div className="text-xs text-rose-400 bg-rose-950/50 border border-rose-500/40 px-3 py-1.5 rounded-md mt-1 animate-fadeIn">
                  {categoryError}
                </div>
              )}

              {/* Quick Emojis for categories */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-500 mr-1">Suggested Emojis:</span>
                {CATEGORY_EMOJIS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setNewCatEmoji(emoji)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-sm transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
                <span>All Active Categories ({categoriesList.length})</span>
                <span>Habits Assigned</span>
              </div>

              <div className="space-y-1.5">
                {categoriesList.map((cat) => {
                  const habitsInCat = habitsList.filter((h) => h.category === cat.name).length;
                  return (
                    <div
                      key={cat.id}
                      className="bg-[#181a20] border border-[#2a2e37] rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl select-none">{cat.emoji}</span>
                        <div>
                          <span className="font-semibold text-slate-100 text-xs">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            ({habitsInCat} {habitsInCat === 1 ? 'habit' : 'habits'})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {cat.isCustom ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            title="Delete Custom Category"
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-500 border border-slate-700/60">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#22252a] px-4 sm:px-5 py-3 border-t border-[#333842] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <button
            onClick={() => setActiveTab(activeTab === 'habits' ? 'categories' : 'habits')}
            className="text-sky-400 hover:underline flex items-center gap-1 text-[11px] min-h-[36px]"
          >
            {activeTab === 'habits' ? '⚙️ Manage & Customize Categories' : '← Back to Habits List'}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 bg-[#181a20] hover:bg-[#252830] text-slate-300 border border-slate-700 rounded-lg transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="min-h-[42px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-colors active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
