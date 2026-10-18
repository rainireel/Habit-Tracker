export type RepetitionType = 'daily' | 'weekly' | 'specific_days';

export interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  isCustom?: boolean;
}

export type HabitCategory = string;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  category?: HabitCategory;
  repetitionType?: RepetitionType; // 'daily' | 'weekly' | 'specific_days'
  specificDays?: number[]; // [0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat]
  weeklyTarget?: number; // e.g. 3, 4, 5 times per week
  targetDays?: number; // optional manual override
}

export interface DayWellness {
  mood?: number; // 1 to 5
  sleep?: number; // hours (e.g. 7.5)
  notes?: string;
}

export interface MonthData {
  monthIndex: number; // 0 = Jan, 11 = Dec
  year: number;
  // habitId -> dayNumber (1-31) -> boolean
  checks: Record<string, Record<number, boolean>>;
  wellness: Record<number, DayWellness>; // dayNumber -> DayWellness
}

export interface TrackerState {
  year: number;
  availableYears?: number[];
  activeMonth: number; // 0 to 11
  habits: Habit[];
  monthsData: Record<string | number, MonthData>; // `${year}_${monthIndex}` or monthIndex -> MonthData
  themeAccent: string; // e.g. '#4ade80'
  startDayOfWeek: 'monday' | 'sunday';
  soundEnabled: boolean;
}

export interface HabitPreset {
  id: string;
  name: string;
  description: string;
  habits: { name: string; emoji: string }[];
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'consistency' | 'wellness' | 'special' | 'milestone';
  rarity: BadgeRarity;
  xpReward: number;
  currentValue: number;
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: string;
}
