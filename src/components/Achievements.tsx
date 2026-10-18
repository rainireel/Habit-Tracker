import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Flame,
  Lock,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { Achievement, BadgeRarity } from '../types/tracker';

interface AchievementsProps {
  achievements: Achievement[];
  accentColor: string;
}

const RARITY_COLORS: Record<
  BadgeRarity,
  { border: string; bg: string; text: string; glow: string }
> = {
  common: {
    border: 'border-slate-600',
    bg: 'bg-slate-800/60',
    text: 'text-slate-300',
    glow: 'rgba(148, 163, 184, 0.2)',
  },
  rare: {
    border: 'border-sky-500/60',
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
    glow: 'rgba(56, 189, 248, 0.3)',
  },
  epic: {
    border: 'border-purple-500/60',
    bg: 'bg-purple-950/40',
    text: 'text-purple-300',
    glow: 'rgba(168, 85, 247, 0.35)',
  },
  legendary: {
    border: 'border-amber-500/70',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
};

export const Achievements: React.FC<AchievementsProps> = ({
  achievements,
  accentColor,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPct = Math.round((unlockedCount / totalCount) * 100);

  const filteredAchievements = achievements.filter((a) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'unlocked') return a.unlocked;
    return a.category === categoryFilter;
  });

  return (
    <>
      {/* 1. Dashboard Showcase Card */}
      <div id="achievements-section" className="bg-[#181a20] border border-[#2a2e37] rounded-xl p-3 sm:p-4 mb-3 shadow-lg select-none w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex flex-wrap items-center gap-1.5">
                <span>Milestones &amp; Badges</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {unlockedCount} / {totalCount} Unlocked ({progressPct}%)
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-[36px] text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22252a] hover:bg-[#2c3038] border border-slate-700/80 transition-colors active:scale-95"
          >
            <span>View All Badges</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Badges Grid (2-cols on mobile, up to 6 on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 w-full max-w-full">
          {achievements.slice(0, 6).map((badge) => {
            const rarityStyle = RARITY_COLORS[badge.rarity];
            const pct = Math.min(100, Math.round((badge.currentValue / badge.targetValue) * 100));

            return (
              <div
                key={badge.id}
                onClick={() => setIsModalOpen(true)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between group active:scale-95 ${
                  badge.unlocked
                    ? `${rarityStyle.border} ${rarityStyle.bg} hover:scale-[1.02]`
                    : 'border-[#2a2e37] bg-[#121316] opacity-75 hover:opacity-100'
                }`}
                style={{
                  boxShadow: badge.unlocked ? `0 0 12px ${rarityStyle.glow}` : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-xl select-none">{badge.icon}</span>
                  {badge.unlocked ? (
                    <span className="text-[9px] font-mono px-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-0.5">
                      <CheckCircle2 size={9} />
                      <span>Done</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500 flex items-center gap-0.5">
                      <Lock size={9} />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                <div className="mb-1.5">
                  <h4 className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white">
                    {badge.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 line-clamp-1">{badge.description}</p>
                </div>

                {/* Progress Mini Bar */}
                <div className="w-full bg-[#111315] border border-[#2a2e37] h-1.5 rounded overflow-hidden">
                  <div
                    className="h-full rounded-xs transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: badge.unlocked ? accentColor : '#64748b',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Detailed Achievements Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fadeIn select-none">
          <div className="bg-[#181a20] border border-[#333842] rounded-2xl sm:rounded-xl w-full max-w-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#22252a] px-4 sm:px-5 py-3 border-b border-[#333842] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Milestones &amp; Badges
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                      {unlockedCount} / {totalCount} Badges
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1">
                    Earn badges and XP by keeping streaks and completing targets.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Pills with Horizontal Scroll on Mobile */}
            <div className="bg-[#1c1f26] px-3 sm:px-5 py-2 border-b border-[#2a2e37] flex items-center gap-1.5 overflow-x-auto custom-scrollbar touch-pan-x text-xs">
              {[
                { id: 'all', label: 'All Badges' },
                { id: 'unlocked', label: 'Unlocked' },
                { id: 'streak', label: '🔥 Streaks' },
                { id: 'consistency', label: '⭐ Consistency' },
                { id: 'wellness', label: '🧘 Wellness' },
                { id: 'special', label: '🌅 Special' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setCategoryFilter(filter.id)}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 active:scale-95 ${
                    categoryFilter === filter.id
                      ? 'bg-slate-800 text-white border border-slate-600 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Modal Body: Badges Grid */}
            <div className="p-3.5 sm:p-5 overflow-y-auto custom-scrollbar bg-[#111315] space-y-3 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                {filteredAchievements.map((badge) => {
                  const rarityStyle = RARITY_COLORS[badge.rarity];
                  const pct = Math.min(
                    100,
                    Math.round((badge.currentValue / badge.targetValue) * 100)
                  );

                  return (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-xl border transition-all flex items-start gap-3 relative ${
                        badge.unlocked
                          ? `${rarityStyle.border} ${rarityStyle.bg}`
                          : 'border-[#2a2e37] bg-[#14161a] opacity-70'
                      }`}
                      style={{
                        boxShadow: badge.unlocked ? `0 0 16px ${rarityStyle.glow}` : undefined,
                      }}
                    >
                      <div className="text-3xl select-none p-2 bg-[#111315]/80 rounded-lg border border-slate-800 shrink-0">
                        {badge.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{badge.title}</span>
                            <span
                              className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${rarityStyle.border} ${rarityStyle.text}`}
                            >
                              {badge.rarity}
                            </span>
                          </h4>

                          <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                            +{badge.xpReward} XP
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                          {badge.description}
                        </p>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Progress:</span>
                            <span className={badge.unlocked ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                              {badge.currentValue} / {badge.targetValue} ({pct}%)
                            </span>
                          </div>

                          <div className="w-full bg-[#111315] border border-[#2a2e37] h-2 rounded overflow-hidden">
                            <div
                              className="h-full rounded-xs transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: badge.unlocked ? accentColor : '#64748b',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#22252a] px-4 sm:px-5 py-3 border-t border-[#333842] flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                Unlock achievements automatically by checking off habits &amp; maintaining streaks.
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2 bg-[#181a20] hover:bg-[#252830] text-white border border-slate-700 rounded-lg transition-colors font-medium min-h-[40px] text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
