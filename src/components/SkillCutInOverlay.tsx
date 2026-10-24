import React, { useEffect } from 'react';
import { SkillCutInData } from '../types/game';
import { VisualPaperdoll } from './VisualPaperdoll';
import { Zap } from 'lucide-react';

interface SkillCutInOverlayProps {
  data: SkillCutInData | null;
  onComplete: () => void;
}

export const SkillCutInOverlay: React.FC<SkillCutInOverlayProps> = ({
  data,
  onComplete,
}) => {
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      onComplete();
    }, data.duration || 950);
    return () => clearTimeout(timer);
  }, [data, onComplete]);

  if (!data) return null;

  const { unit, skillName, skillDesc, color, bannerSubtitle } = data;

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center select-none overflow-hidden"
    >
      {/* Dark Dim Backdrop with Speedlines */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-200" />

      {/* Dynamic Animated Speedlines Canvas in Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        <div className="w-[200%] h-full flex animate-pulse">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(255,255,255,0.08)_20px,rgba(255,255,255,0.08)_40px)]" />
        </div>
      </div>

      {/* Sliding Diagonal Japanese/Tactical RPG Slash Banner */}
      <div
        className="relative w-full max-w-4xl py-5 px-6 sm:px-12 flex items-center justify-between shadow-2xl border-y-4 overflow-hidden transform -skew-y-2"
        style={{
          backgroundColor: '#090d16',
          borderColor: color || '#f59e0b',
          boxShadow: `0 0 45px ${color}55, inset 0 0 25px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Accent Color Energy Streak Glow */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          }}
        />

        {/* Character Portrait with Glowing Eyes */}
        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 pixel-frame flex items-center justify-center overflow-hidden bg-slate-950"
              style={{ borderColor: color || '#f59e0b' }}
            >
              {unit.kind === 'hero' ? (
                <VisualPaperdoll unit={unit} size="sm" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold font-silkscreen"
                  style={{ backgroundColor: unit.color }}
                >
                  {unit.glyph}
                </div>
              )}
            </div>
            {/* Eye Flare Badge */}
            <div
              className="absolute -top-1 -right-1 w-3.5 h-3.5 pixel-frame bg-amber-400"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-100 font-silkscreen tracking-wide">
                {unit.name}
              </span>
              <span className="text-[10px] font-silkscreen text-amber-400 font-bold uppercase tracking-wider pixel-frame bg-slate-900 px-2 py-0.5">
                {bannerSubtitle || unit.title || unit.role}
              </span>
            </div>
            {skillDesc && (
              <p className="text-[11px] font-mono text-slate-300 max-w-md line-clamp-1 mt-0.5 opacity-90">
                {skillDesc}
              </p>
            )}
          </div>
        </div>

        {/* Epic Skill Title Banner */}
        <div className="relative z-10 text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-silkscreen font-bold tracking-widest text-amber-400 mb-0.5">
            <Zap className="w-4 h-4 fill-current" />
            <span>KỸ NĂNG BỘC PHÁT</span>
          </div>
          <h2
            className="text-xl sm:text-3xl font-black font-silkscreen tracking-wider uppercase text-amber-300 drop-shadow-[2px_2px_0px_#000]"
          >
            {skillName}
          </h2>
        </div>
      </div>
    </div>
  );
};
