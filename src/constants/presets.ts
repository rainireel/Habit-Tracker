import { CategoryItem, HabitPreset } from '../types/tracker';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat_health', name: 'Health', emoji: '🥗', color: '#34d399' },
  { id: 'cat_fitness', name: 'Fitness', emoji: '💪', color: '#fb923c' },
  { id: 'cat_career', name: 'Career', emoji: '💼', color: '#38bdf8' },
  { id: 'cat_mindfulness', name: 'Mindfulness', emoji: '🧘', color: '#c084fc' },
  { id: 'cat_productivity', name: 'Productivity', emoji: '🎯', color: '#fbbf24' },
  { id: 'cat_personal', name: 'Personal', emoji: '🌿', color: '#f43f5e' },
];

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  Health: {
    label: 'Health',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500/40',
    icon: '🥗',
  },
  Fitness: {
    label: 'Fitness',
    color: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-500/40',
    icon: '💪',
  },
  Career: {
    label: 'Career',
    color: 'text-sky-400',
    bg: 'bg-sky-950/40',
    border: 'border-sky-500/40',
    icon: '💼',
  },
  Mindfulness: {
    label: 'Mindfulness',
    color: 'text-purple-400',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/40',
    icon: '🧘',
  },
  Productivity: {
    label: 'Productivity',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    icon: '🎯',
  },
  Personal: {
    label: 'Personal',
    color: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/40',
    icon: '🌿',
  },
};

export function getCategoryStyle(
  categoryName: string,
  customCategories: CategoryItem[] = []
): { label: string; color: string; bg: string; border: string; icon: string } {
  if (CATEGORY_CONFIG[categoryName]) {
    return CATEGORY_CONFIG[categoryName];
  }
  const custom = customCategories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (custom) {
    return {
      label: custom.name,
      color: 'text-sky-300',
      bg: 'bg-slate-800/80',
      border: 'border-sky-500/40',
      icon: custom.emoji || '📌',
    };
  }
  return {
    label: categoryName,
    color: 'text-slate-300',
    bg: 'bg-slate-800/60',
    border: 'border-slate-700',
    icon: '📌',
  };
}

export const DEFAULT_HABITS = [
  { id: 'h1', name: 'Wake up at 05:00', emoji: '⏰', category: 'Health', repetitionType: 'daily' as const },
  { id: 'h2', name: 'Gym & Strength', emoji: '💪', category: 'Fitness', repetitionType: 'specific_days' as const, specificDays: [1, 3, 5] },
  { id: 'h3', name: 'Reading / Learning', emoji: '📖', category: 'Career', repetitionType: 'daily' as const },
  { id: 'h4', name: 'Day Planning', emoji: '📅', category: 'Productivity', repetitionType: 'specific_days' as const, specificDays: [1, 2, 3, 4, 5] },
  { id: 'h5', name: 'Project Work / Deep Work', emoji: '🎯', category: 'Career', repetitionType: 'specific_days' as const, specificDays: [1, 2, 3, 4, 5] },
  { id: 'h6', name: 'No Alcohol', emoji: '🍾', category: 'Health', repetitionType: 'daily' as const },
  { id: 'h7', name: 'Social Media Detox', emoji: '🌿', category: 'Mindfulness', repetitionType: 'daily' as const },
  { id: 'h8', name: 'Goal Journaling', emoji: '📝', category: 'Mindfulness', repetitionType: 'daily' as const },
  { id: 'h9', name: 'Hydration (3L Water)', emoji: '💧', category: 'Health', repetitionType: 'daily' as const },
  { id: 'h10', name: 'Meditation & Breathwork', emoji: '🧘', category: 'Mindfulness', repetitionType: 'daily' as const },
  { id: 'h11', name: '10,000 Steps Walk', emoji: '👟', category: 'Fitness', repetitionType: 'daily' as const },
  { id: 'h12', name: 'Sleep by 23:00 (8h Rest)', emoji: '🌙', category: 'Health', repetitionType: 'daily' as const },
];

export const HABIT_PRESETS = [
  {
    id: 'ultimate_transformation',
    name: 'Ultimate Life Transformation (As in Photos)',
    description: 'The master discipline stack shown in reference dashboard screenshots with smart recurrence.',
    habits: [
      { name: 'Wake up at 05:00', emoji: '⏰', repetitionType: 'daily' },
      { name: 'Gym & Training', emoji: '💪', repetitionType: 'specific_days', specificDays: [1, 3, 5] },
      { name: 'Reading / Learning', emoji: '📖', repetitionType: 'daily' },
      { name: 'Day Planning', emoji: '📅', repetitionType: 'specific_days', specificDays: [1, 2, 3, 4, 5] },
      { name: 'Deep Focus & Discipline', emoji: '⚡', repetitionType: 'daily' },
      { name: 'Project Work', emoji: '🎯', repetitionType: 'specific_days', specificDays: [1, 2, 3, 4, 5] },
      { name: 'No Alcohol', emoji: '🍾', repetitionType: 'daily' },
      { name: 'Social Media Detox', emoji: '🌿', repetitionType: 'daily' },
      { name: 'Goal Journaling', emoji: '📝', repetitionType: 'daily' },
      { name: 'Hydration 3L', emoji: '💧', repetitionType: 'daily' },
      { name: 'Meditation / Breathwork', emoji: '🧘', repetitionType: 'daily' },
      { name: 'Sleep before 23:00', emoji: '🌙', repetitionType: 'daily' },
    ],
  },
  {
    id: 'monk_mode',
    name: 'Monk Mode / High Productivity',
    description: 'Deep work blocks, cold showers, reading, and zero distractions.',
    habits: [
      { name: 'Wake up at 05:30', emoji: '🌅', repetitionType: 'daily' },
      { name: 'Morning Cold Shower', emoji: '🚿', repetitionType: 'daily' },
      { name: '4 Hours Deep Work', emoji: '🧠', repetitionType: 'specific_days', specificDays: [1, 2, 3, 4, 5] },
      { name: 'No Phone First Hour', emoji: '📵', repetitionType: 'daily' },
      { name: 'Heavy Gym Lifting', emoji: '🏋️', repetitionType: 'specific_days', specificDays: [1, 2, 4, 5] },
      { name: '15 Pages Non-Fiction', emoji: '📚', repetitionType: 'daily' },
      { name: 'No Sugar / Clean Diet', emoji: '🥗', repetitionType: 'daily' },
      { name: 'Weekly Reflection & Review', emoji: '🖋️', repetitionType: 'specific_days', specificDays: [0] }, // Sunday
      { name: 'Screen Off at 21:30', emoji: '💤', repetitionType: 'daily' },
    ],
  },
  {
    id: 'fitness_wellness',
    name: 'Athletic & Biohacking Wellness',
    description: 'Optimized for physical recovery, sleep hygiene, nutrition, and cardiovascular health.',
    habits: [
      { name: 'Morning Sunlight (15 min)', emoji: '☀️', repetitionType: 'daily' },
      { name: 'Hydration with Electrolytes', emoji: '💧', repetitionType: 'daily' },
      { name: 'Strength Workout', emoji: '🏋️‍♂️', repetitionType: 'specific_days', specificDays: [1, 3, 5] },
      { name: '10,000 Daily Steps', emoji: '👟', repetitionType: 'daily' },
      { name: 'High Protein Nutrition', emoji: '🥩', repetitionType: 'daily' },
      { name: 'Creatine & Supplements', emoji: '💊', repetitionType: 'daily' },
      { name: 'Sauna or Stretching', emoji: '🧖', repetitionType: 'weekly', weeklyTarget: 3 },
      { name: 'Magnesium & 8h Sleep', emoji: '🛌', repetitionType: 'daily' },
    ],
  },
  {
    id: 'student_developer',
    name: 'Software Engineer & Builder Stack',
    description: 'Tailored for shipping features, studying algorithms, and avoiding burnout.',
    habits: [
      { name: 'Commit Code / Ship Daily', emoji: '💻', repetitionType: 'specific_days', specificDays: [1, 2, 3, 4, 5] },
      { name: 'Solve 1 LeetCode / Algo', emoji: '🧩', repetitionType: 'specific_days', specificDays: [1, 2, 3, 4, 5] },
      { name: 'Learn Architecture / Read Docs', emoji: '📖', repetitionType: 'daily' },
      { name: 'Inbox Zero & Planning', emoji: '📬', repetitionType: 'specific_days', specificDays: [1, 2, 3, 4, 5] },
      { name: 'Postural Reset & Stretch', emoji: '🧘', repetitionType: 'daily' },
      { name: 'Drink 2.5L Water', emoji: '💧', repetitionType: 'daily' },
      { name: 'Walk Outside (No Screen)', emoji: '🌲', repetitionType: 'daily' },
      { name: 'Sleep 8 Hours', emoji: '😴', repetitionType: 'daily' },
    ],
  },
];

export const MOOD_CONFIG = [
  { value: 1, emoji: '😫', label: 'Terrible', color: '#ef4444' },
  { value: 2, emoji: '😕', label: 'Low', color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Neutral', color: '#eab308' },
  { value: 4, emoji: '🙂', label: 'Good', color: '#22c55e' },
  { value: 5, emoji: '🤩', label: 'Peak Flow', color: '#38bdf8' },
];

export const ACCENT_THEMES = [
  { id: 'emerald', name: 'Emerald Glow', color: '#4ade80', hex: '#4ade80' },
  { id: 'cyan', name: 'Cyber Cyan', color: '#38bdf8', hex: '#38bdf8' },
  { id: 'amber', name: 'Sunset Amber', color: '#fbbf24', hex: '#fbbf24' },
  { id: 'monochrome', name: 'Obsidian Minimalist', color: '#e2e8f0', hex: '#ffffff' },
  { id: 'violet', name: 'Neon Purple', color: '#c084fc', hex: '#c084fc' },
];
