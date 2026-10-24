import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Swords, Shield, Zap, FastForward, UserCheck, Bot } from 'lucide-react';
import { Unit, ControlMode, EffectiveStats, GearItem } from '../types/game';
import { VisualPaperdoll } from './VisualPaperdoll';
import { WEAPON_FAMILIES } from '../game/constants';
import { sound } from '../audio/sound';

interface ActionBarProps {
  phase: string;
  paused: boolean;
  activeUnit: Unit | null;
  controlMode: ControlMode;
  speed: number;
  isMuted: boolean;
  equipped: Record<string, Record<string, GearItem>>;
  onTogglePlay: () => void;
  onToggleSpeed: () => void;
  onRestartRoom: () => void;
  onToggleMute: () => void;
  onToggleControlMode: () => void;
  onManualAttack: () => void;
  onManualSkill: () => void;
  onManualSpecialSkill?: () => void;
  onManualDefend: () => void;
  onManualEndTurn: () => void;
  getEffectiveStats: (unit: Unit) => EffectiveStats;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  phase,
  paused,
  activeUnit,
  controlMode,
  speed,
  isMuted,
  equipped,
  onTogglePlay,
  onToggleSpeed,
  onRestartRoom,
  onToggleMute,
  onToggleControlMode,
  onManualAttack,
  onManualSkill,
  onManualSpecialSkill,
  onManualDefend,
  onManualEndTurn,
  getEffectiveStats,
}) => {
  const isHeroTurn = activeUnit?.kind === 'hero' && !activeUnit.acted && phase === 'playing';
  const eff = activeUnit ? getEffectiveStats(activeUnit) : null;
  const activeGear = activeUnit ? equipped[activeUnit.id] || {} : {};
  const currentWeapon = activeGear.weapon;
  const weaponFam = currentWeapon?.family || 'sword';
  const skillMeta = WEAPON_FAMILIES[weaponFam] || { skillName: 'Kỹ Năng Chiến Đấu', skillDesc: '' };

  // Find any equipped item with a unique Special Skill (Summon, Transform, AoE, Bastion, Petrify)
  const specialItem = activeUnit
    ? Object.values(activeGear).find((i) => i?.specialSkill)
    : null;

  return (
    <div className="bg-[#0b0f19] pixel-frame p-3 flex flex-col gap-2.5">
      {/* Top row: Active Unit Status & Global Command Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-2.5">
        {/* Active Adventurer Display with Miniature Paperdoll */}
        <div className="flex items-center gap-3">
          {activeUnit ? (
            <div className="flex items-center gap-2.5">
              {activeUnit.kind === 'hero' ? (
                <div className="pixel-frame p-0.5 bg-[#070a0f]">
                  <VisualPaperdoll unit={activeUnit} equipped={activeGear} size="sm" />
                </div>
              ) : (
                <div
                  className="w-10 h-10 pixel-frame flex items-center justify-center font-bold text-base font-silkscreen"
                  style={{ backgroundColor: activeUnit.color, color: '#090d0b' }}
                >
                  {activeUnit.glyph}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm font-silkscreen tracking-wide">{activeUnit.name}</span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {activeUnit.title || activeUnit.role}
                  </span>
                  {activeUnit.transformation && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-red-950 text-red-300 border border-red-700 font-mono font-bold animate-pulse">
                      HÓA THÂN ({activeUnit.transformation.turnsRemaining}T)
                    </span>
                  )}
                  {activeUnit.bastionTicks && activeUnit.bastionTicks > 0 ? (
                    <span className="px-1.5 py-0.2 text-[9px] bg-amber-950 text-amber-300 border border-amber-600 font-mono font-bold">
                      BẤT ĐỘNG
                    </span>
                  ) : null}
                  {(activeUnit.isStunned || (activeUnit.stunTicks || 0) > 0) && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-yellow-950 text-yellow-300 border border-yellow-500 font-mono font-bold animate-bounce">
                      CHOÁNG 💫
                    </span>
                  )}
                  {activeUnit.elevation === 1 && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-sky-950 text-sky-300 border border-sky-500 font-mono font-bold">
                      ▲ ĐÀI CAO (+25%)
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold tabular-nums">Máu {activeUnit.hp}/{eff?.hp || activeUnit.maxHp}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-sky-400 font-semibold tabular-nums">Nội lực {activeUnit.mp}/{eff?.mp || activeUnit.maxMp}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-300 tabular-nums">Tốc độ {eff?.spd || activeUnit.spd}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-rose-400 tabular-nums">Phòng thủ {eff?.def || activeUnit.def}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono py-1">
              <span className="w-2.5 h-2.5 bg-slate-600 animate-pulse" />
              <span className="font-silkscreen text-[11px]">Chờ lệnh xuất kích...</span>
            </div>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* Tactical Mode Toggle (Auto AI vs Manual Control) */}
          <button
            onClick={onToggleControlMode}
            className={`pixel-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold ${
              controlMode === 'auto'
                ? 'pixel-btn-emerald'
                : 'pixel-btn-amber'
            }`}
            title="Đổi giữa Tự Động (AI điều khiển) và Thủ Công (Người chơi điều khiển)"
          >
            {controlMode === 'auto' ? <Bot className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            <span className="font-silkscreen text-[11px]">{controlMode === 'auto' ? 'TỰ ĐỘNG (AI)' : 'THỦ CÔNG'}</span>
          </button>

          {/* Speed Toggle */}
          <button
            onClick={onToggleSpeed}
            className="pixel-btn flex items-center gap-1 px-2.5 py-1.5 bg-[#1e293b] text-slate-200 text-xs font-mono font-bold"
            title="Tốc độ trận đấu"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-silkscreen text-[11px]">{speed}x</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="pixel-btn p-2 bg-[#1e293b] text-slate-300 text-xs"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Restart Room */}
          <button
            onClick={onRestartRoom}
            className="pixel-btn p-2 bg-[#1e293b] text-slate-300 text-xs"
            title="Tái lập phòng chiến"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Play / Pause Primary CTA */}
        <button
          onClick={onTogglePlay}
          disabled={phase === 'won' || phase === 'lost'}
          className={`pixel-btn flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider ${
            phase === 'ready'
              ? 'pixel-btn-amber font-silkscreen text-amber-200'
              : paused
              ? 'pixel-btn-emerald font-silkscreen text-emerald-100'
              : 'pixel-btn bg-[#1e293b] text-amber-300 font-silkscreen'
          }`}
        >
          {phase === 'ready' ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>BẮT ĐẦU CHIẾN ĐẤU</span>
            </>
          ) : paused ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>TIẾP TỤC</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              <span>TẠM DỪNG</span>
            </>
          )}
        </button>

        {/* Manual Action Buttons (Active when player's turn in manual mode) */}
        {controlMode === 'manual' && isHeroTurn && (
          <div className="flex flex-wrap items-center gap-1.5 flex-[2]">
            <button
              onClick={onManualAttack}
              className="pixel-btn pixel-btn-amber px-3 py-2 text-xs font-bold flex items-center gap-1"
            >
              <Swords className="w-4 h-4" />
              <span className="font-silkscreen text-[11px]">ĐÁNH</span>
            </button>

            {/* Weapon Skill with STRICT MP & COOLDOWN VALIDATION */}
            {(() => {
              const weaponMp = skillMeta.mpCost || 3;
              const hasMp = activeUnit.mp >= weaponMp;
              const onCooldown = (activeUnit.skillCooldown || 0) > 0;
              const isDisabled = !hasMp || onCooldown;

              return (
                <button
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      sound.playErrorBuzz();
                      return;
                    }
                    onManualSkill();
                  }}
                  aria-disabled={isDisabled}
                  className={`pixel-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5 ${
                    isDisabled
                      ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-50 select-none'
                      : 'pixel-btn-primary cursor-pointer'
                  }`}
                  title={
                    onCooldown
                      ? `Đang hồi chiêu (${activeUnit.skillCooldown} lượt nữa)`
                      : !hasMp
                      ? `Không đủ MP! Cần ${weaponMp} MP (Hiện có ${activeUnit.mp} MP)`
                      : skillMeta.skillDesc
                  }
                >
                  <Zap className="w-4 h-4" />
                  <span className="truncate font-silkscreen text-[11px]">{skillMeta.skillName}</span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.5 border ${
                      !hasMp
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-sky-950 text-sky-300 border-sky-700'
                    }`}
                  >
                    {onCooldown ? `${activeUnit.skillCooldown}T` : `${weaponMp}MP`}
                  </span>
                </button>
              );
            })()}

            {/* Unique Artifact / Weapon Special Skill with STRICT MP & COOLDOWN VALIDATION */}
            {specialItem?.specialSkill && onManualSpecialSkill && (() => {
              const specialMp = specialItem.specialSkillMp || 4;
              const hasMp = activeUnit.mp >= specialMp;
              const onCooldown = (activeUnit.skillCooldown || 0) > 0;
              const isDisabled = !hasMp || onCooldown;

              return (
                <button
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      sound.playErrorBuzz();
                      return;
                    }
                    onManualSpecialSkill();
                  }}
                  aria-disabled={isDisabled}
                  className={`pixel-btn px-3 py-2 text-xs font-bold flex items-center gap-1.5 ${
                    isDisabled
                      ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-50 select-none'
                      : 'bg-purple-900 border-purple-500 text-purple-100 animate-pulse cursor-pointer'
                  }`}
                  title={
                    onCooldown
                      ? `Đang hồi chiêu (${activeUnit.skillCooldown} lượt nữa)`
                      : !hasMp
                      ? `Không đủ MP! Cần ${specialMp} MP (Hiện có ${activeUnit.mp} MP)`
                      : specialItem.specialSkillDesc || specialItem.description
                  }
                >
                  <span>⚡</span>
                  <span className="truncate font-silkscreen text-[11px]">{specialItem.specialSkillName || 'Tuyệt Kỹ'}</span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.5 border ${
                      !hasMp
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-purple-950 text-purple-200 border-purple-700'
                    }`}
                  >
                    {onCooldown ? `${activeUnit.skillCooldown}T` : `${specialMp}MP`}
                  </span>
                </button>
              );
            })()}

            <button
              onClick={onManualDefend}
              className="pixel-btn bg-sky-950 hover:bg-sky-900 text-sky-200 border-sky-600 px-3 py-2 text-xs font-bold flex items-center gap-1"
            >
              <Shield className="w-4 h-4" />
              <span className="font-silkscreen text-[11px]">THỦ HỘ</span>
            </button>

            <button
              onClick={onManualEndTurn}
              className="pixel-btn bg-[#1e293b] hover:bg-slate-700 text-slate-300 px-2.5 py-2 text-xs font-bold font-silkscreen text-[11px]"
            >
              QUA LƯỢT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
