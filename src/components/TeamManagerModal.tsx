import React, { useState } from 'react';
import { Unit, GearItem, SlotType, EffectiveStats } from '../types/game';
import { SLOT_NAMES, RARITY_COLORS, MAX_PARTY_SIZE, formatFullStatText } from '../game/constants';
import { X, Shield, ArrowRight } from 'lucide-react';
import { VisualPaperdoll } from './VisualPaperdoll';
import { WeaponIconArt } from './WeaponIconArt';

interface TeamManagerModalProps {
  heroes: Unit[];
  equipped: Record<string, Record<string, GearItem>>;
  inventory: GearItem[];
  gold: number;
  onClose: () => void;
  onEquip: (unitId: string, item: GearItem) => void;
  onUnequip: (unitId: string, slot: SlotType) => void;
  getEffectiveStats: (unit: Unit) => EffectiveStats;
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  heroes,
  equipped,
  inventory,
  gold,
  onClose,
  onEquip,
  onUnequip,
  getEffectiveStats,
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');
  const activeHero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];
  const eff = activeHero ? getEffectiveStats(activeHero) : null;
  const heroEquipped = activeHero ? equipped[activeHero.id] || {} : {};

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#0b0f19] border-2 border-[#334155] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide font-cinzel">
                Quản Lý Đội Ngũ ({heroes.length}/{MAX_PARTY_SIZE}) & Thay Trang Bị
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Mọi chiến binh đều có thể tự do trang bị bất kỳ vũ khí, khiên hay áo giáp nào (Tối đa 4 người)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-amber-400 font-bold text-sm bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/60">
              {gold} đ
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hero Selection Column */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
              Chọn Chiến Binh ({heroes.length}/{MAX_PARTY_SIZE})
            </span>
            {heroes.map((hero) => {
              const isSelected = hero.id === selectedHeroId;
              const heroEff = getEffectiveStats(hero);
              const curGear = equipped[hero.id] || {};
              return (
                <div
                  key={hero.id}
                  onClick={() => setSelectedHeroId(hero.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#162032] border-amber-500 shadow-lg ring-1 ring-amber-500/40'
                      : 'bg-[#080c14] border-[#1e293b] hover:bg-[#121926]'
                  }`}
                >
                  <VisualPaperdoll unit={hero} equipped={curGear} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-100">{hero.name}</div>
                    <div className="text-[10px] text-amber-400 font-mono truncate">
                      {hero.title || hero.role}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                      Máu {hero.hp}/{heroEff.hp} · Tốc {heroEff.spd}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Equipped Slots & Available Items (2 Columns) */}
          <div className="md:col-span-2 space-y-4">
            {activeHero && eff && (
              <>
                {/* Visual Model & Stat Overview */}
                <div className="bg-[#080c14] border border-[#1e293b] rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
                  <VisualPaperdoll unit={activeHero} equipped={heroEquipped} size="lg" />
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-100 font-cinzel">{activeHero.name}</h3>
                        <p className="text-xs text-amber-400 font-mono">{activeHero.title || activeHero.role}</p>
                      </div>
                      <span className="text-xs font-mono text-slate-400">CẤP ĐỘ {activeHero.level}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center font-mono text-xs">
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-semibold">Sinh Mệnh (Máu)</span>
                        <span className="font-bold text-emerald-400 text-sm">{eff.hp}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-semibold">Năng Lượng (MP)</span>
                        <span className="font-bold text-sky-400 text-sm">{eff.mp}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-semibold">Công Kích</span>
                        <span className="font-bold text-amber-400 text-sm">{eff.atk}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-semibold">Công Phép</span>
                        <span className="font-bold text-indigo-400 text-sm">{eff.matk}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-semibold">Phòng Thủ</span>
                        <span className="font-bold text-emerald-300 text-sm">{eff.def}</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-semibold">Tốc Độ</span>
                        <span className="font-bold text-slate-200 text-sm">{eff.spd}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slots: Universal for all heroes */}
                <div className="space-y-3">
                  {(['weapon', 'shield', 'armor', 'ring'] as SlotType[]).map((slotKey) => {
                    const currentItem = heroEquipped[slotKey];
                    const candidateItems = inventory.filter((item) => item.slot === slotKey);

                    return (
                      <div
                        key={slotKey}
                        className="bg-[#080c14] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                            {SLOT_NAMES[slotKey]}
                          </span>
                          {currentItem && (
                            <button
                              onClick={() => onUnequip(activeHero.id, slotKey)}
                              className="text-[11px] font-mono text-rose-400 hover:text-rose-300 transition-colors font-bold"
                            >
                              Tháo ra [x]
                            </button>
                          )}
                        </div>

                        {/* Currently Equipped Item */}
                        {currentItem ? (
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-700/80">
                            <div className="flex items-center gap-2.5">
                              <WeaponIconArt item={currentItem} size={34} />
                              <div>
                                <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                                  <span>{currentItem.name}</span>
                                  <span
                                    className="text-[10px] font-mono font-bold"
                                    style={{ color: RARITY_COLORS[currentItem.rarity - 1] }}
                                  >
                                    {'★'.repeat(currentItem.rarity)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono text-slate-400 mt-0.5">
                                  <span className="px-1 py-0.2 bg-slate-800 text-amber-300 font-bold rounded">
                                    Lv.{currentItem.level || currentItem.floor || 1}
                                  </span>
                                  {currentItem.isTradeOff && (
                                    <span className="px-1 py-0.2 bg-rose-950 text-rose-300 border border-rose-700 font-bold rounded">
                                      ĐÁNH ĐỔI
                                    </span>
                                  )}
                                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                    {Object.entries(currentItem.stats).map(([k, v]) => {
                                      const { label, valueText, isNegative } = formatFullStatText(k, Number(v) || 0);
                                      return (
                                        <span key={k} className={isNegative ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                                          {label}: {valueText}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold shrink-0">
                              Đang Mang
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic p-2 rounded bg-slate-950/40 border border-slate-800/40">
                            Chưa trang bị món nào
                          </div>
                        )}

                        {/* Candidate Items from Inventory */}
                        {candidateItems.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/60">
                            <span className="text-[10px] font-mono text-slate-400 block mb-1.5">
                              Món có sẵn trong hành trang ({candidateItems.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {candidateItems.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => onEquip(activeHero.id, item)}
                                  className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 transition-all text-left flex items-center justify-between group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <WeaponIconArt item={item} size={28} />
                                    <div>
                                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                                        {item.name}
                                      </div>
                                      <div className="flex flex-wrap gap-x-2 text-[9px] font-mono text-slate-400 mt-0.5">
                                        {Object.entries(item.stats).map(([k, v]) => {
                                          const { label, valueText, isNegative } = formatFullStatText(k, Number(v) || 0);
                                          return (
                                            <span key={k} className={isNegative ? 'text-rose-400' : 'text-emerald-400'}>
                                              {label}: {valueText}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
