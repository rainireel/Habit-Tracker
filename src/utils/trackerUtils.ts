import { MONTH_NAMES, getCategoryStyle } from '../constants/presets';
import { Habit } from '../types/tracker';

export { getCategoryStyle };

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Returns 2-letter weekday ('Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa').
 * Uses noon (12:00) to prevent daylight-saving time shifts.
 */
export function getWeekdayName(year: number, monthIndex: number, day: number): string {
  const date = new Date(year, monthIndex, day, 12, 0, 0);
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return weekdays[date.getDay()];
}

export function getFullWeekdayName(year: number, monthIndex: number, day: number): string {
  const date = new Date(year, monthIndex, day, 12, 0, 0);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[date.getDay()];
}

export function getWeekdayIndex(year: number, monthIndex: number, day: number): number {
  return new Date(year, monthIndex, day, 12, 0, 0).getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export function isDayScheduledForHabit(
  habit: Habit,
  year: number,
  monthIndex: number,
  day: number
): boolean {
  const totalDays = getDaysInMonth(year, monthIndex);
  if (day > totalDays) return false;

  const repType = habit.repetitionType || 'daily';
  if (repType === 'daily') return true;

  if (repType === 'specific_days') {
    if (!habit.specificDays || habit.specificDays.length === 0) return true;
    const dayOfWeek = getWeekdayIndex(year, monthIndex, day);
    return habit.specificDays.includes(dayOfWeek);
  }

  if (repType === 'weekly') {
    return true; // available any day, but weekly target limits the goal
  }

  return true;
}

export function getHabitTargetDays(habit: Habit, year: number, monthIndex: number): number {
  const totalDays = getDaysInMonth(year, monthIndex);
  if (habit.targetDays && habit.targetDays > 0) return habit.targetDays;

  const repType = habit.repetitionType || 'daily';
  if (repType === 'daily') {
    return totalDays;
  }

  if (repType === 'specific_days') {
    if (!habit.specificDays || habit.specificDays.length === 0) return totalDays;
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = getWeekdayIndex(year, monthIndex, d);
      if (habit.specificDays.includes(dayOfWeek)) {
        count++;
      }
    }
    return Math.max(1, count);
  }

  if (repType === 'weekly') {
    const targetPerWeek = habit.weeklyTarget || 3;
    const fullWeeks = Math.floor(totalDays / 7);
    const extraDays = totalDays % 7;
    return Math.min(totalDays, fullWeeks * targetPerWeek + Math.min(extraDays, Math.ceil(targetPerWeek / 2)));
  }

  return totalDays;
}

/**
 * Calculates current consecutive streak and best streak.
 * For daily habits: consecutive checked days. If a scheduled day was missed before a checked day, streak resets.
 * For specific_days habits: only checks scheduled days (e.g. Mon/Wed/Fri - non-scheduled days don't break the streak).
 */
export function calculateHabitStreak(
  habit: Habit,
  checks: Record<string, Record<number, boolean>>,
  year: number,
  monthIndex: number
): { currentStreak: number; bestStreak: number } {
  const totalDays = getDaysInMonth(year, monthIndex);
  const habitChecks = checks[habit.id] || {};

  // Find the scheduled days in order
  const scheduledDays: number[] = [];
  for (let d = 1; d <= totalDays; d++) {
    if (isDayScheduledForHabit(habit, year, monthIndex, d)) {
      scheduledDays.push(d);
    }
  }

  if (scheduledDays.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Find the latest scheduled day that has been checked
  let latestCheckedIndex = -1;
  for (let i = scheduledDays.length - 1; i >= 0; i--) {
    const day = scheduledDays[i];
    if (habitChecks[day]) {
      latestCheckedIndex = i;
      break;
    }
  }

  let currentStreak = 0;
  if (latestCheckedIndex !== -1) {
    // Count backwards from the latest checked day until an unchecked scheduled day is found
    for (let i = latestCheckedIndex; i >= 0; i--) {
      const day = scheduledDays[i];
      if (habitChecks[day]) {
        currentStreak++;
      } else {
        break; // Streak is broken by an unchecked scheduled day
      }
    }
  }

  // Calculate best consecutive streak in the month
  let bestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < scheduledDays.length; i++) {
    const day = scheduledDays[i];
    if (habitChecks[day]) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
}

export interface WeekGroup {
  label: string;
  startDay: number;
  endDay: number;
  count: number;
  dateRangeLabel: string;
}

export function getWeekGroups(year: number, monthIndex: number): WeekGroup[] {
  const totalDays = getDaysInMonth(year, monthIndex);
  const monthShort = MONTH_NAMES[monthIndex]?.slice(0, 3) || 'Day';

  const groups: WeekGroup[] = [
    { label: 'Week 1', startDay: 1, endDay: 7, count: 7, dateRangeLabel: `${monthShort} 1–7` },
    { label: 'Week 2', startDay: 8, endDay: 14, count: 7, dateRangeLabel: `${monthShort} 8–14` },
    { label: 'Week 3', startDay: 15, endDay: 21, count: 7, dateRangeLabel: `${monthShort} 15–21` },
    { label: 'Week 4', startDay: 22, endDay: 28, count: 7, dateRangeLabel: `${monthShort} 22–28` },
  ];

  if (totalDays > 28) {
    groups.push({
      label: 'Week 5',
      startDay: 29,
      endDay: totalDays,
      count: totalDays - 28,
      dateRangeLabel: `${monthShort} 29–${totalDays}`,
    });
  }

  return groups;
}

export function isToday(year: number, monthIndex: number, day: number): boolean {
  const now = new Date();
  return (
    now.getFullYear() === year &&
    now.getMonth() === monthIndex &&
    now.getDate() === day
  );
}

export function formatFullDate(year: number, monthIndex: number, day: number): string {
  const date = new Date(year, monthIndex, day, 12, 0, 0);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface CalendarDayCell {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  weekday: string;
  weekdayIndex: number;
}

export function getCalendarMatrix(year: number, monthIndex: number, startOnMonday = true): CalendarDayCell[][] {
  const totalDays = getDaysInMonth(year, monthIndex);
  const firstDayObj = new Date(year, monthIndex, 1, 12, 0, 0);
  const rawFirstDay = firstDayObj.getDay(); // 0 = Sun, 1 = Mon ...
  const leadingOffset = startOnMonday ? (rawFirstDay === 0 ? 6 : rawFirstDay - 1) : rawFirstDay;

  const cells: CalendarDayCell[] = [];
  const prevMonthTotalDays = new Date(year, monthIndex, 0).getDate();

  // Leading days
  for (let i = leadingOffset - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const date = new Date(year, monthIndex - 1, d, 12, 0, 0);
    cells.push({
      day: d,
      date,
      isCurrentMonth: false,
      isToday: false,
      weekday: getWeekdayName(year, monthIndex - 1, d),
      weekdayIndex: date.getDay(),
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, monthIndex, d, 12, 0, 0);
    cells.push({
      day: d,
      date,
      isCurrentMonth: true,
      isToday: isToday(year, monthIndex, d),
      weekday: getWeekdayName(year, monthIndex, d),
      weekdayIndex: date.getDay(),
    });
  }

  // Trailing days
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, monthIndex + 1, d, 12, 0, 0);
    cells.push({
      day: d,
      date,
      isCurrentMonth: false,
      isToday: false,
      weekday: getWeekdayName(year, monthIndex + 1, d),
      weekdayIndex: date.getDay(),
    });
  }

  const weeks: CalendarDayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function fireConfetti() {
  // Confetti disabled per user request
}

export function playClickSound() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // Audio might be blocked by browser policy until user interaction
  }
}

export function playSuccessSound() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.1, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  } catch {
    // fallback
  }
}

export function calculateHabitStats(
  habit: Habit,
  checks: Record<string, Record<number, boolean>>,
  year: number,
  monthIndex: number
) {
  const totalDays = getDaysInMonth(year, monthIndex);
  const habitChecks = checks[habit.id] || {};
  let actual = 0;
  for (let d = 1; d <= totalDays; d++) {
    if (habitChecks[d]) actual++;
  }

  const goal = getHabitTargetDays(habit, year, monthIndex);
  const left = Math.max(0, goal - actual);
  const percentage = goal > 0 ? Math.round((actual / goal) * 100) : 0;
  const { currentStreak, bestStreak } = calculateHabitStreak(habit, checks, year, monthIndex);

  return { goal, actual, left, percentage, currentStreak, bestStreak };
}

export function calculateOverallStats(
  habits: Habit[],
  checks: Record<string, Record<number, boolean>>,
  year: number,
  monthIndex: number
) {
  const totalDays = getDaysInMonth(year, monthIndex);
  let totalGoal = 0;
  let totalCompleted = 0;

  habits.forEach((h) => {
    const goal = getHabitTargetDays(h, year, monthIndex);
    totalGoal += goal;

    const habitChecks = checks[h.id] || {};
    for (let d = 1; d <= totalDays; d++) {
      if (habitChecks[d]) totalCompleted++;
    }
  });

  const totalLeft = Math.max(0, totalGoal - totalCompleted);
  const overallPercentage = totalGoal > 0 ? Math.round((totalCompleted / totalGoal) * 100) : 0;

  return {
    totalGoal,
    totalCompleted,
    totalLeft,
    overallPercentage,
  };
}

export function calculateDailyStats(
  habits: Habit[],
  checks: Record<string, Record<number, boolean>>,
  year: number,
  monthIndex: number
) {
  const totalDays = getDaysInMonth(year, monthIndex);
  const dailyPercentages: { day: number; count: number; total: number; percentage: number }[] = [];

  for (let d = 1; d <= 31; d++) {
    if (d <= totalDays) {
      let dayCompleted = 0;
      let scheduledCount = 0;

      habits.forEach((h) => {
        if (isDayScheduledForHabit(h, year, monthIndex, d)) {
          scheduledCount++;
          if (checks[h.id]?.[d]) dayCompleted++;
        }
      });

      const effectiveTotal = scheduledCount > 0 ? scheduledCount : habits.length;
      const pct = effectiveTotal > 0 ? Math.round((dayCompleted / effectiveTotal) * 100) : 0;
      dailyPercentages.push({ day: d, count: dayCompleted, total: effectiveTotal, percentage: pct });
    } else {
      dailyPercentages.push({ day: d, count: 0, total: habits.length, percentage: 0 });
    }
  }

  return dailyPercentages;
}

export function calculateWeeklyStats(
  habits: Habit[],
  checks: Record<string, Record<number, boolean>>,
  year: number,
  monthIndex: number
) {
  const totalDays = getDaysInMonth(year, monthIndex);
  const weeks = getWeekGroups(year, monthIndex);
  return weeks.map((week, idx) => {
    let weekPossible = 0;
    let weekChecked = 0;

    for (let d = week.startDay; d <= Math.min(week.endDay, totalDays); d++) {
      habits.forEach((h) => {
        if (isDayScheduledForHabit(h, year, monthIndex, d)) {
          weekPossible++;
          if (checks[h.id]?.[d]) weekChecked++;
        }
      });
    }

    const pct = weekPossible > 0 ? Math.round((weekChecked / weekPossible) * 100) : 0;
    return {
      name: `Week ${idx + 1}`,
      percentage: pct,
      checked: weekChecked,
      possible: weekPossible,
    };
  });
}
