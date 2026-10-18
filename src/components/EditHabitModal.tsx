import React, { useState } from 'react';
import {
  Check,
  Edit2,
  FolderPlus,
  Palette,
  Plus,
  Repeat,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { CategoryItem, Habit, RepetitionType } from '../types/tracker';
import { EmojiPickerToggle } from './EmojiPickerToggle';

interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null; // null means adding a new habit
  customCategories: CategoryItem[];
  onSaveHabit: (habit: Habit) => void;
  onUpdateCategories: (categories: CategoryItem[]) => void;
}

const COMMON_EMOJIS = [
  '⏰', '💪', '📖', '🎯', '🌿', '💧', '🧘', '👟',
  '🌙', '🏋️', '📚', '🥗', '💻', '☀️', '🚿', '🧠',
  '📵', '✨', '⚡', '☕', '🍎', '🏃', '🏊', '🚴'
];

const CATEGORY_EMOJIS = ['🥗', '💪', '💼', '🧘', '🎯', '🌿', '💰', '📚', '🎨', '🧠', '❤️', '✈️', '⚡', '☕', '🏠'];

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#34d399', bg: 'bg-emerald-500' },
  { name: 'Orange', hex: '#fb923c', bg: 'bg-orange-500' },
  { name: 'Sky', hex: '#38bdf8', bg: 'bg-sky-500' },
  { name: 'Purple', hex: '#c084fc', bg: 'bg-purple-500' },
  { name: 'Amber', hex: '#fbbf24', bg: 'bg-amber-500' },
  { name: 'Rose', hex: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Teal', hex: '#2dd4bf', bg: 'bg-teal-500' },
];

const WEEKDAYS = [
  { label: 'Su', index: 0 },
  { label: 'Mo', index: 1 },
  { label: 'Tu', index: 2 },
  { label: 'We', index: 3 },
  { label: 'Th', index: 4 },
  { label: 'Fr', index: 5 },
  { label: 'Sa', index: 6 },
];

export const EditHabitModal: React.FC<EditHabitModalProps> = ({
  isOpen,
  onClose,
  habit,
  customCategories,
  onSaveHabit,
  onUpdateCategories,
}) => {
  const isEditing = !!habit;

  const [name, setName] = useState(habit?.name || '');
  const [emoji, setEmoji] = useState(habit?.emoji || '⚡');
  const [category, setCategory] = useState(habit?.category || (customCategories[0]?.name || 'Health'));
  const [repetitionType, setRepetitionType] = useState<RepetitionType>(habit?.repetitionType || 'daily');
  const [specificDays, setSpecificDays] = useState<number[]>(habit?.specificDays || [1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(habit?.weeklyTarget || 3);

  // Category management mode
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📌');
  const [newCatColor, setNewCatColor] = useState('#38bdf8');

  // Editing existing category
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Reset state when opened with a new habit
  React.useEffect(() => {
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji);
      setCategory(habit.category || (customCategories[0]?.name || 'Health'));
      setRepetitionType(habit.repetitionType || 'daily');
      setSpecificDays(habit.specificDays || [1, 2, 3, 4, 5]);
      setWeeklyTarget(habit.weeklyTarget || 3);
    } else {
      setName('');
      setEmoji('⚡');
      setCategory(customCategories[0]?.name || 'Health');
      setRepetitionType('daily');
      setSpecificDays([1, 2, 3, 4, 5]);
      setWeeklyTarget(3);
    }
    setShowCategoryManager(false);
    setIsAddingNewCategory(false);
    setEditingCatId(null);
  }, [habit, customCategories, isOpen]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedHabit: Habit = {
      id: habit?.id || 'h_' + Date.now(),
      name: name.trim(),
      emoji: emoji || '🎯',
      category: category,
      repetitionType,
      specificDays: repetitionType === 'specific_days' ? specificDays : undefined,
      weeklyTarget: repetitionType === 'weekly' ? weeklyTarget : undefined,
    };

    onSaveHabit(savedHabit);
    onClose();
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (customCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }

    const newCat: CategoryItem = {
      id: 'cat_' + Date.now(),
      name: trimmed,
      emoji: newCatEmoji || '📌',
      color: newCatColor,
      isCustom: true,
    };

    const updated = [...customCategories, newCat];
    onUpdateCategories(updated);
    setCategory(trimmed);
    setNewCatName('');
    setIsAddingNewCategory(false);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (customCategories.length <= 1) {
      alert('You must have at least one category.');
      return;
    }
    const updated = customCategories.filter((c) => c.id !== catId);
    onUpdateCategories(updated);
    if (category === catName) {
      setCategory(updated[0]?.name || 'Health');
    }
  };

  const handleStartRenameCategory = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveRenameCategory = (catId: string, oldName: string) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      setEditingCatId(null);
      return;
    }

    const updated = customCategories.map((c) =>
      c.id === catId ? { ...c, name: trimmed } : c
    );
    onUpdateCategories(updated);
    if (category === oldName) {
      setCategory(trimmed);
    }
    setEditingCatId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fadeIn select-none">
      <div className="bg-[#181a20] border border-[#333842] rounded-2xl sm:rounded-xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#22252a] px-4 sm:px-5 py-3.5 border-b border-[#333842] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              {isEditing ? <Edit2 size={16} /> : <Plus size={16} />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEditing ? `Edit Habit: ${habit?.name}` : 'Add New Habit'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure habit name, category, and recurring schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-3.5 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Habit Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Habit Name:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Wake up at 05:00, Gym, Deep Work"
              className="w-full bg-[#121316] border border-[#333842] rounded-md px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* 2. Habit Icon & Massive Emoji Picker with Minimalist Toggle */}
          <div className="bg-[#1f2229] p-3 rounded-lg border border-[#333842]">
            <EmojiPickerToggle
              selectedEmoji={emoji}
              onSelectEmoji={setEmoji}
              label="Habit Icon & Emoji Library:"
            />
          </div>

          {/* 2. Category Section with Inline Add & Customize */}
          <div className="bg-[#1f2229] p-3.5 rounded-lg border border-[#333842] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag size={13} className="text-sky-400" />
                <span>Habit Category:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewCategory(!isAddingNewCategory);
                    setShowCategoryManager(false);
                  }}
                  className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Plus size={12} />
                  <span>{isAddingNewCategory ? 'Cancel' : 'New Category'}</span>
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryManager(!showCategoryManager);
                    setIsAddingNewCategory(false);
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <Edit2 size={11} />
                  <span>{showCategoryManager ? 'Done' : 'Customize'}</span>
                </button>
              </div>
            </div>

            {/* Inline Add New Category Box */}
            {isAddingNewCategory && (
              <div className="bg-[#14161b] p-3 rounded-md border border-sky-500/40 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-sky-300 font-bold">
                  <span>Create Custom Category</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name (e.g., Reading, Finances)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewCategory}
                    disabled={!newCatName.trim()}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold rounded text-xs transition-colors shrink-0"
                  >
                    Save Category
                  </button>
                </div>

                {/* Massive Emoji Picker with Minimalist Toggle for Category */}
                <EmojiPickerToggle
                  selectedEmoji={newCatEmoji}
                  onSelectEmoji={setNewCatEmoji}
                  label="Category Icon & Emoji Library:"
                  quickPicks={CATEGORY_EMOJIS}
                />

                {/* Color choices */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 mr-1">Color:</span>
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setNewCatColor(col.hex)}
                      className={`w-4 h-4 rounded-full ${col.bg} transition-transform ${
                        newCatColor === col.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category Customize / Edit Mode */}
            {showCategoryManager && (
              <div className="bg-[#14161b] p-3 rounded-md border border-slate-700 space-y-2 animate-fadeIn max-h-48 overflow-y-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Manage Existing Categories
                </span>
                {customCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-2 bg-[#1b1e24] px-2.5 py-1.5 rounded border border-slate-800"
                  >
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <span>{cat.emoji}</span>
                        <input
                          type="text"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          className="bg-slate-900 border border-sky-400 rounded px-1.5 py-0.5 text-xs text-white flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRenameCategory(cat.id, cat.name)}
                          className="p-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                        >
                          <Check size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span>{cat.emoji}</span>
                          <span className="font-semibold text-slate-200">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartRenameCategory(cat)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Rename"
                          >
                            <Edit2 size={11} />
                          </button>
                          {customCategories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="Delete Category"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selectable Category Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {customCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-sky-950/80 text-sky-200 border-sky-400 ring-1 ring-sky-400 shadow-xs'
                        : 'bg-[#181a20] border-[#333842] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                    {isSelected && <Check size={12} className="text-sky-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Recurrence Pattern */}
          <div className="bg-[#1f2229] p-3.5 rounded-lg border border-[#333842] space-y-2.5">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Repeat size={13} className="text-emerald-400" />
              <span>Repetition Schedule:</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRepetitionType('daily')}
                className={`py-2 px-2 rounded-md border text-center transition-all ${
                  repetitionType === 'daily'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold shadow-xs'
                    : 'bg-[#181a20] border-[#333842] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">Daily</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Every day (7d)</div>
              </button>

              <button
                type="button"
                onClick={() => setRepetitionType('specific_days')}
                className={`py-2 px-2 rounded-md border text-center transition-all ${
                  repetitionType === 'specific_days'
                    ? 'bg-sky-950/70 border-sky-500 text-sky-300 font-bold shadow-xs'
                    : 'bg-[#181a20] border-[#333842] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">Specific Days</div>
                <div className="text-[10px] text-slate-500 mt-0.5">e.g. Mon / Wed / Fri</div>
              </button>

              <button
                type="button"
                onClick={() => setRepetitionType('weekly')}
                className={`py-2 px-2 rounded-md border text-center transition-all ${
                  repetitionType === 'weekly'
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300 font-bold shadow-xs'
                    : 'bg-[#181a20] border-[#333842] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">Weekly Target</div>
                <div className="text-[10px] text-slate-500 mt-0.5">X times a week</div>
              </button>
            </div>

            {/* Specific Days Picker */}
            {repetitionType === 'specific_days' && (
              <div className="bg-[#14161b] p-3 rounded border border-slate-700 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Scheduled Days of Week:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSpecificDays([1, 2, 3, 4, 5])}
                      className="text-sky-400 hover:underline font-semibold"
                    >
                      Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecificDays([1, 3, 5])}
                      className="text-sky-400 hover:underline font-semibold"
                    >
                      Mon/Wed/Fri
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecificDays([0, 6])}
                      className="text-sky-400 hover:underline font-semibold"
                    >
                      Weekends
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5">
                  {WEEKDAYS.map((wd) => {
                    const isSelected = specificDays.includes(wd.index);
                    return (
                      <button
                        key={wd.index}
                        type="button"
                        onClick={() => toggleDay(wd.index)}
                        className={`flex-1 py-1.5 rounded text-center font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {wd.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weekly Target Stepper */}
            {repetitionType === 'weekly' && (
              <div className="bg-[#14161b] p-3 rounded border border-slate-700 flex items-center justify-between animate-fadeIn">
                <span className="text-slate-300 font-medium">Times per week:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setWeeklyTarget(num)}
                      className={`w-8 h-8 rounded font-mono font-bold transition-all ${
                        weeklyTarget === num
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#333842]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check size={16} />
              <span>{isEditing ? 'Save Habit' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
