import React from 'react';
import { Unit, GearItem, EffectiveStats } from '../types/game';
import {
  SLOT_NAMES,
  WEAPON_FAMILIES,
  WEAPON_XP_PER_RANK,
  MAX_PARTY_SIZE,
  getStatExpThreshold,
  getHeroLevelExpThreshold,
} from '../game/constants';
import { Shield, Sparkles, Coins, Backpack, TrendingUp } from 'lucide-react';
import { VisualPaperdoll } from './VisualPaperdoll';
import { WeaponIconArt } from './WeaponIconArt';

interface PartySidebarProps {
  heroes: Unit[];
  selectedHeroId: string | null;
  activeId: string | null;
  equipped: Record<string, Record<string, GearItem>>;
  gold: number;
  inventoryCount: number;
  onSelectHero: (id: string) => void;
  getEffectiveStats: (unit: Unit) => EffectiveStats;
  onOpenInventory: () => void;
  onOpenTeam: () => void;
}

export const PartySidebar: React.FC<PartySidebarProps> = ({
  heroes,
  selectedHeroId,
  activeId,
  equipped,
  gold,
  inventoryCount,
  onSelectHero,
  getEffectiveStats,
  onOpenInventory,
  onOpenTeam,
}) => {
  const selectedUnit = heroes.find((h) => h.id === selectedHeroId) || heroes[0];
  const eff = selectedUnit ? getEffectiveStats(selectedUnit) : null;
  const selectedEquipped = selectedUnit ? equipped[selectedUnit.id] || {} : {};

  return (
    <div className="flex flex-col gap-3">
      {/* Gold & Inventory HUD Bar */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenInventory}
          className="pixel-btn bg-[#0f1422] hover:bg-[#161d31] p-2.5 flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 group-hover:text-amber-300 font-silkscreen text-[11px]">Túi vàng</span>
          </div>
          <span className="font-mono font-bold text-amber-300 text-sm tabular-nums">{gold} đ</span>
        </button>
        <button
          onClick={onOpenInventory}
          className="pixel-btn bg-[#0f1422] hover:bg-[#161d31] p-2.5 flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <Backpack className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 group-hover:text-emerald-300 font-silkscreen text-[11px]">Hành trang</span>
          </div>
          <span className="font-mono font-bold text-emerald-300 text-sm tabular-nums">{inventoryCount} món</span>
        </button>
      </div>

      {/* Hero Party List */}
      <div className="bg-[#0b0f19] pixel-frame p-3">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-silkscreen">
              Đoàn Thám Hiểm ({heroes.length}/{MAX_PARTY_SIZE})
            </span>
          </div>
          <button
            onClick={onOpenTeam}
            className="text-[10px] font-silkscreen text-amber-400 hover:text-amber-300 underline font-semibold"
          >
            Đổi trang bị
          </button>
        </div>

        <div className="space-y-2">
          {heroes.map((hero) => {
            const isSelected = hero.id === selectedHeroId;
            const isActive = hero.id === activeId;
            const isFallen = hero.hp <= 0;
            const heroEff = getEffectiveStats(hero);
            const heroGear = equipped[hero.id] || {};
            const hpPct = Math.max(0, Math.min(100, (hero.hp / heroEff.hp) * 100));
            const mpPct = heroEff.mp ? Math.max(0, Math.min(100, (hero.mp / heroEff.mp) * 100)) : 0;

            return (
              <div
                key={hero.id}
                onClick={() => onSelectHero(hero.id)}
                className={`p-2 border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-[#162032] border-amber-500 shadow-md pixel-frame-gold'
                    : 'bg-[#080c14] border-[#1e293b] hover:bg-[#121926] hover:border-slate-700'
                } ${isFallen ? 'opacity-40 grayscale' : ''}`}
              >
                {/* Visual miniature model with pixel border */}
                <div className="pixel-frame p-0.5 bg-[#05070c]">
                  <VisualPaperdoll unit={hero} equipped={heroGear} size="sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs text-slate-100 font-silkscreen">{hero.name}</span>
                      <span className="text-[10px] text-amber-400/90 font-mono truncate">
                        {hero.title || hero.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="px-1.5 py-0.5 text-[9px] font-silkscreen bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse font-bold">
                          LƯỢT
                        </span>
                      )}
                      <span className="text-[10px] font-silkscreen text-amber-400 font-bold">
                        Lv{hero.level}
                      </span>
                    </div>
                  </div>

                  {/* HP & MP Trackers with 16-bit stepped pixel bars */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-[#030712] border border-slate-800">
                      <div
                        className={`h-full transition-all duration-200 ${
                          hpPct < 30 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${hpPct}%` }}
                      />
                    </div>
                    {heroEff.mp > 0 && (
                      <div className="w-full h-1.5 bg-[#030712] border border-slate-800">
                        <div
                          className="h-full bg-sky-500 transition-all duration-200"
                          style={{ width: `${mpPct}%` }}
                        />
                      </div>
                    )}
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 tabular-nums">
                      <span>Máu {hero.hp}/{heroEff.hp}</span>
                      <span>MP {hero.mp}/{heroEff.mp}</span>
                      <span>Tốc {heroEff.spd}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Unit Deep Inspector with Large Paperdoll & Action Growth */}
      {selectedUnit && eff && (
        <div className="bg-[#0b0f19] pixel-frame p-3.5 text-xs space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-slate-100 font-silkscreen text-sm">
                  {selectedUnit.name}
                </span>
                <span className="text-[10px] font-mono text-amber-400/90 ml-1.5">
                  ({selectedUnit.title || selectedUnit.role})
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              EXP {selectedUnit.exp}/{getHeroLevelExpThreshold(selectedUnit.level)}
            </span>
          </div>

          {/* Visual Paperdoll Preview Showcase */}
          <div className="flex items-center gap-3 bg-[#080c14] border border-[#2a364f] p-3 rounded-xl shadow-inner">
            <VisualPaperdoll unit={selectedUnit} equipped={selectedEquipped} size="lg" />
            <div className="flex-1 space-y-1.5 text-[11px] font-mono">
              <div className="text-[10px] uppercase text-amber-400 font-bold tracking-wider mb-1 flex items-center gap-1 font-silkscreen">
                <span>Trang Bị Hiện Tại:</span>
              </div>
              <div className="bg-[#0b0f19] border border-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                <span className="text-slate-500 text-[10px] shrink-0">Tay phải:</span>
                {selectedEquipped.weapon ? (
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5 truncate">
                    <WeaponIconArt item={selectedEquipped.weapon} size={24} />
                    <span className="truncate">{selectedEquipped.weapon.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-600 italic text-[10px]">Tay không</span>
                )}
              </div>
              <div className="bg-[#0b0f19] border border-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                <span className="text-slate-500 text-[10px] shrink-0">Tay trái:</span>
                {selectedEquipped.shield ? (
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5 truncate">
                    <WeaponIconArt item={selectedEquipped.shield} size={24} />
                    <span className="truncate">{selectedEquipped.shield.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-600 italic text-[10px]">Không có khiên</span>
                )}
              </div>
              <div className="bg-[#0b0f19] border border-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                <span className="text-slate-500 text-[10px] shrink-0">Thân thể:</span>
                {selectedEquipped.armor ? (
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5 truncate">
                    <WeaponIconArt item={selectedEquipped.armor} size={24} />
                    <span className="truncate">{selectedEquipped.armor.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-600 italic text-[10px]">Áo vải rách</span>
                )}
              </div>
              <div className="bg-[#0b0f19] border border-slate-800/80 px-2 py-1 rounded flex items-center justify-between">
                <span className="text-slate-500 text-[10px] shrink-0">Nhẫn:</span>
                {selectedEquipped.ring ? (
                  <span className="font-semibold text-amber-200 flex items-center gap-1.5 truncate">
                    <WeaponIconArt item={selectedEquipped.ring} size={24} />
                    <span className="truncate">{selectedEquipped.ring.name}</span>
                  </span>
                ) : (
                  <span className="text-slate-600 italic text-[10px]">Chưa đeo nhẫn</span>
                )}
              </div>
            </div>
          </div>

          {/* Core Stat Grid with Clear Vietnamese Names */}
          <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
            <div className="bg-[#080c14] border border-slate-800 p-1.5 rounded">
              <div className="text-[9px] text-slate-400 font-bold">CÔNG KÍCH</div>
              <div className="font-bold text-amber-300 text-sm mt-0.5">{eff.atk}</div>
            </div>
            <div className="bg-[#080c14] border border-slate-800 p-1.5 rounded">
              <div className="text-[9px] text-slate-400 font-bold">CÔNG PHÉP</div>
              <div className="font-bold text-sky-300 text-sm mt-0.5">{eff.matk}</div>
            </div>
            <div className="bg-[#080c14] border border-slate-800 p-1.5 rounded">
              <div className="text-[9px] text-slate-400 font-bold">PHÒNG THỦ</div>
              <div className="font-bold text-emerald-300 text-sm mt-0.5">{eff.def}</div>
            </div>
            <div className="bg-[#080c14] border border-slate-800 p-1.5 rounded">
              <div className="text-[9px] text-slate-400 font-bold">TỐC ĐỘ</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">{eff.spd}</div>
            </div>
          </div>

          {/* Action-Based Stat Growth Progression */}
          <div className="bg-[#080c14] border border-slate-800 p-2.5 rounded space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-silkscreen text-amber-400 font-bold uppercase tracking-wider mb-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tiến Độ Tăng Điểm Chỉ Số</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
              {/* ATK action EXP */}
              {(() => {
                const atkThresh = getStatExpThreshold('atk', selectedUnit.atk);
                const atkExp = selectedUnit.actionExp?.atk || 0;
                return (
                  <div>
                    <div className="flex justify-between mb-0.5 text-[9px]">
                      <span className="text-slate-400">Công Kích</span>
                      <span className="text-amber-300 font-semibold">{atkExp}/{atkThresh}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (atkExp / atkThresh) * 100)}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* MATK action EXP */}
              {(() => {
                const matkThresh = getStatExpThreshold('matk', selectedUnit.matk);
                const matkExp = selectedUnit.actionExp?.matk || 0;
                return (
                  <div>
                    <div className="flex justify-between mb-0.5 text-[9px]">
                      <span className="text-slate-400">Công Phép</span>
                      <span className="text-sky-300 font-semibold">{matkExp}/{matkThresh}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (matkExp / matkThresh) * 100)}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* DEF action EXP */}
              {(() => {
                const defThresh = getStatExpThreshold('def', selectedUnit.def);
                const defExp = selectedUnit.actionExp?.def || 0;
                return (
                  <div>
                    <div className="flex justify-between mb-0.5 text-[9px]">
                      <span className="text-slate-400">Phòng Thủ</span>
                      <span className="text-emerald-300 font-semibold">{defExp}/{defThresh}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (defExp / defThresh) * 100)}%` }} />
                    </div>
                  </div>
                );
              })()}

              {/* SPD action EXP */}
              {(() => {
                const spdThresh = getStatExpThreshold('spd', selectedUnit.spd);
                const spdExp = selectedUnit.actionExp?.spd || 0;
                return (
                  <div>
                    <div className="flex justify-between mb-0.5 text-[9px]">
                      <span className="text-slate-400">Tốc Độ</span>
                      <span className="text-slate-200 font-semibold">{spdExp}/{spdThresh}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-slate-400" style={{ width: `${Math.min(100, (spdExp / spdThresh) * 100)}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Weapon Mastery Ranks */}
          {selectedUnit.weaponMastery && Object.keys(selectedUnit.weaponMastery).length > 0 && (
            <div className="text-[10px] font-mono text-slate-400 bg-[#080c14] p-2 rounded border border-slate-800">
              <div className="text-amber-400 uppercase tracking-wider text-[9px] font-bold mb-1">
                Thuần Thục Vũ Khí
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(selectedUnit.weaponMastery).map(([fam, xp]) => {
                  const rank = Math.floor(xp / WEAPON_XP_PER_RANK);
                  const currentXp = xp % WEAPON_XP_PER_RANK;
                  const label = WEAPON_FAMILIES[fam as keyof typeof WEAPON_FAMILIES]?.label || fam;
                  return (
                    <span
                      key={fam}
                      className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700 text-[9px] font-bold"
                    >
                      {label} Bậc {rank} ({currentXp}/{WEAPON_XP_PER_RANK})
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Innate Passive Trait */}
          {selectedUnit.passiveName && (
            <div className="text-[10px] font-mono bg-[#080c14] p-2 rounded border border-amber-900/40">
              <span className="text-amber-400 font-bold mr-1">Nội Tại:</span>
              <span className="text-slate-200 font-semibold">{selectedUnit.passiveName}</span>
              <p className="text-slate-400 text-[10px] mt-0.5">{selectedUnit.passiveDesc}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
