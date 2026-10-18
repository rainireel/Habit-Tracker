import { Achievement, DayWellness, Habit } from '../types/tracker';
import { calculateHabitStreak, calculateOverallStats, getDaysInMonth, isDayScheduledForHabit } from './trackerUtils';

export const BASE_ACHIEVEMENTS: Omit<Achievement, 'currentValue' | 'unlocked'>[] = [
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Hit a 7-day consecutive streak on any active habit.',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    xpReward: 50,
    targetValue: 7,
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Check the 05:00 AM wake-up habit 5 times.',
    icon: '🌅',
    category: 'special',
    rarity: 'common',
    xpReward: 50,
    targetValue: 5,
  },
  {
    id: 'perfect_day',
    title: 'Flawless Execution',
    description: 'Complete 100% of all scheduled habits in a single day.',
    icon: '⭐',
    category: 'consistency',
    rarity: 'rare',
    xpReward: 75,
    targetValue: 1,
  },
  {
    id: 'streak_14',
    title: '14-Day Iron Discipline',
    description: 'Maintain an uninterrupted 14-day streak on any habit.',
    icon: '⚡',
    category: 'streak',
    rarity: 'rare',
    xpReward: 100,
    targetValue: 14,
  },
  {
    id: 'century_club',
    title: 'Century Club (100 Checks)',
    description: 'Log 100 total habit checkmarks in this month.',
    icon: '💯',
    category: 'milestone' as const,
    rarity: 'rare',
    xpReward: 100,
    targetValue: 100,
  },
  {
    id: 'iron_body',
    title: 'Iron Body (Gym 12x)',
    description: 'Log 12 gym or strength workout sessions.',
    icon: '💪',
    category: 'consistency',
    rarity: 'epic',
    xpReward: 120,
    targetValue: 12,
  },
  {
    id: 'zen_mind',
    title: 'Zen Master (10x Calm)',
    description: 'Log 10 meditation or breathwork sessions.',
    icon: '🧘',
    category: 'wellness',
    rarity: 'rare',
    xpReward: 80,
    targetValue: 10,
  },
  {
    id: 'sleep_champion',
    title: 'Deep Recovery (8h Sleep 7x)',
    description: 'Log 8+ hours of quality sleep for 7 days in wellness.',
    icon: '🌙',
    category: 'wellness',
    rarity: 'epic',
    xpReward: 90,
    targetValue: 7,
  },
  {
    id: 'peak_flow',
    title: 'Flow State (Mood 5 5x)',
    description: 'Achieve level 5 "Peak Flow" mood rating 5 times.',
    icon: '🤩',
    category: 'wellness',
    rarity: 'legendary',
    xpReward: 150,
    targetValue: 5,
  },
  {
    id: 'streak_30',
    title: '30-Day Master',
    description: 'Maintain an elite 30-day streak across the entire month.',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 250,
    targetValue: 30,
  },
  {
    id: 'month_crusher',
    title: '80% Month Crusher',
    description: 'Achieve an overall month completion rate of 80% or higher.',
    icon: '🏆',
    category: 'consistency',
    rarity: 'epic',
    xpReward: 200,
    targetValue: 80,
  },
];

export function evaluateAchievements(
  habits: Habit[],
  checks: Record<string, Record<number, boolean>>,
  wellness: Record<number, DayWellness>,
  year: number,
  monthIndex: number
): Achievement[] {
  const totalDays = getDaysInMonth(year, monthIndex);

  // 1. Max streak across habits
  let maxBestStreak = 0;
  habits.forEach((h) => {
    const { bestStreak, currentStreak } = calculateHabitStreak(h, checks, year, monthIndex);
    if (bestStreak > maxBestStreak) maxBestStreak = bestStreak;
    if (currentStreak > maxBestStreak) maxBestStreak = currentStreak;
  });

  // 2. Early bird check (wake up / 05:00)
  const wakeUpHabit = habits.find((h) =>
    h.name.toLowerCase().includes('05:00') ||
    h.name.toLowerCase().includes('wake') ||
    h.name.toLowerCase().includes('morning')
  );
  let wakeUpCount = 0;
  if (wakeUpHabit) {
    const wChecks = checks[wakeUpHabit.id] || {};
    for (let d = 1; d <= totalDays; d++) {
      if (wChecks[d]) wakeUpCount++;
    }
  }

  // 3. Perfect days count
  let perfectDays = 0;
  for (let d = 1; d <= totalDays; d++) {
    let scheduledCount = 0;
    let completedCount = 0;
    habits.forEach((h) => {
      if (isDayScheduledForHabit(h, year, monthIndex, d)) {
        scheduledCount++;
        if (checks[h.id]?.[d]) completedCount++;
      }
    });
    if (scheduledCount > 0 && completedCount === scheduledCount) {
      perfectDays++;
    }
  }

  // 4. Total ticks count
  let totalTicks = 0;
  habits.forEach((h) => {
    const hChecks = checks[h.id] || {};
    for (let d = 1; d <= totalDays; d++) {
      if (hChecks[d]) totalTicks++;
    }
  });

  // 5. Gym sessions count
  const gymHabit = habits.find((h) =>
    h.name.toLowerCase().includes('gym') ||
    h.name.toLowerCase().includes('workout') ||
    h.name.toLowerCase().includes('lift') ||
    h.emoji === '💪' ||
    h.emoji === '🏋️'
  );
  let gymCount = 0;
  if (gymHabit) {
    const gChecks = checks[gymHabit.id] || {};
    for (let d = 1; d <= totalDays; d++) {
      if (gChecks[d]) gymCount++;
    }
  }

  // 6. Meditation / mindfulness count
  const zenHabit = habits.find((h) =>
    h.name.toLowerCase().includes('meditat') ||
    h.name.toLowerCase().includes('breath') ||
    h.name.toLowerCase().includes('zen') ||
    h.emoji === '🧘'
  );
  let zenCount = 0;
  if (zenHabit) {
    const zChecks = checks[zenHabit.id] || {};
    for (let d = 1; d <= totalDays; d++) {
      if (zChecks[d]) zenCount++;
    }
  }

  // 7. Wellness metrics (sleep & mood)
  let sleepDays8h = 0;
  let moodPeakDays = 0;
  for (let d = 1; d <= totalDays; d++) {
    const w = wellness[d];
    if (w?.sleep && w.sleep >= 8) sleepDays8h++;
    if (w?.mood && w.mood === 5) moodPeakDays++;
  }

  // 8. Overall month completion percentage
  const overall = calculateOverallStats(habits, checks, year, monthIndex);
  const overallPct = overall.overallPercentage;

  return BASE_ACHIEVEMENTS.map((ach) => {
    let currentVal = 0;

    switch (ach.id) {
      case 'streak_7':
      case 'streak_14':
      case 'streak_30':
        currentVal = maxBestStreak;
        break;
      case 'early_bird':
        currentVal = wakeUpCount;
        break;
      case 'perfect_day':
        currentVal = perfectDays;
        break;
      case 'century_club':
        currentVal = totalTicks;
        break;
      case 'iron_body':
        currentVal = gymCount;
        break;
      case 'zen_mind':
        currentVal = zenCount;
        break;
      case 'sleep_champion':
        currentVal = sleepDays8h;
        break;
      case 'peak_flow':
        currentVal = moodPeakDays;
        break;
      case 'month_crusher':
        currentVal = overallPct;
        break;
      default:
        currentVal = 0;
    }

    const unlocked = currentVal >= ach.targetValue;

    return {
      ...ach,
      currentValue: currentVal,
      unlocked,
    };
  });
}
