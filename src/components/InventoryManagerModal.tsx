import React, { useState } from 'react';
import { GearItem, SlotType, Unit } from '../types/game';
import { SLOT_NAMES, RARITY_COLORS, formatFullStatText } from '../game/constants';
import { WeaponIconArt } from './WeaponIconArt';
import { X, Backpack, Coins, Filter, CheckSquare, Square, Trash2, Sparkles } from 'lucide-react';

interface InventoryManagerModalProps {
  inventory: GearItem[];
  heroes: Unit[];
  gold: number;
  onClose: () => void;
  onSellItem: (itemId: string) => void;
  onBulkSell: (itemIds: string[]) => void;
  onEquipItem: (heroId: string, item: GearItem) => void;
}

export const InventoryManagerModal: React.FC<InventoryManagerModalProps> = ({
  inventory,
  heroes,
  gold,
  onClose,
  onSellItem,
  onBulkSell,
  onEquipItem,
}) => {
  const [filterSlot, setFilterSlot] = useState<string>('all');
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const filteredItems = inventory.filter((item) => {
    if (filterSlot === 'all') return true;
    return item.slot === filterSlot;
  });

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredItems.map((i) => i.id);
    const areAllSelected = allFilteredIds.every((id) => selectedItemIds.has(id));

    if (areAllSelected) {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Quick sell by rarity
  const handleQuickSellRarity = (rarity: number) => {
    const targetItems = inventory.filter((i) => i.rarity === rarity);
    if (targetItems.length === 0) return;
    onBulkSell(targetItems.map((i) => i.id));
    setSelectedItemIds(new Set());
  };

  const handleQuickSellJunk = () => {
    // Sells all 1-star and 2-star items
    const targetItems = inventory.filter((i) => i.rarity <= 2);
    if (targetItems.length === 0) return;
    onBulkSell(targetItems.map((i) => i.id));
    setSelectedItemIds(new Set());
  };

  const handleConfirmBulkSell = () => {
    if (selectedItemIds.size === 0) return;
    onBulkSell(Array.from(selectedItemIds));
    setSelectedItemIds(new Set());
  };

  // Calculate value of selected items
  const totalSelectedGold = Array.from(selectedItemIds).reduce((acc, id) => {
    const item = inventory.find((i) => i.id === id);
    return acc + (item ? item.sellPrice : 0);
  }, 0);

  const commonCount = inventory.filter((i) => i.rarity === 1).length;
  const rareCount = inventory.filter((i) => i.rarity === 2).length;
  const junkCount = inventory.filter((i) => i.rarity <= 2).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#0b0f19] border-2 border-[#334155] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <Backpack className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide font-cinzel">
                Hành Trang ({inventory.length} Món)
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Trang bị cho bất kỳ chiến binh nào hoặc chọn bán hàng loạt lấy vàng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold text-sm bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/60">
              <Coins className="w-4 h-4" />
              <span>{gold} đ</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Bulk Sell Bar */}
        <div className="px-4 py-2 bg-[#090d16] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Bán Nhanh:
            </span>
            <button
              onClick={() => handleQuickSellRarity(1)}
              disabled={commonCount === 0}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                commonCount > 0
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500'
                  : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Bán tất cả đồ Phổ thông 1 sao"
            >
              Phổ thông ({commonCount})
            </button>
            <button
              onClick={() => handleQuickSellRarity(2)}
              disabled={rareCount === 0}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                rareCount > 0
                  ? 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border-slate-700 hover:border-emerald-500'
                  : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Bán tất cả đồ Hiếm 2 sao"
            >
              Hiếm ({rareCount})
            </button>
            <button
              onClick={handleQuickSellJunk}
              disabled={junkCount === 0}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                junkCount > 0
                  ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-800/80'
                  : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Bán tất cả đồ 1 sao và 2 sao"
            >
              Toàn bộ đồ rác ({junkCount})
            </button>
          </div>

          <button
            onClick={handleSelectAllFiltered}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {filteredItems.length > 0 && filteredItems.every((i) => selectedItemIds.has(i.id)) ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Bỏ chọn trang này</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Chọn tất cả ({filteredItems.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Filters and Target Hero Selector */}
        <div className="p-3 bg-[#080c14] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium font-mono">Lọc:</span>
            {['all', 'weapon', 'shield', 'armor', 'ring'].map((slot) => (
              <button
                key={slot}
                onClick={() => setFilterSlot(slot)}
                className={`px-2.5 py-1 rounded-md font-mono text-xs transition-colors ${
                  filterSlot === slot
                    ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                {slot === 'all' ? 'Tất cả' : SLOT_NAMES[slot as SlotType]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Trang bị cho:</span>
            <select
              value={selectedHeroId}
              onChange={(e) => setSelectedHeroId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg focus:outline-none focus:border-amber-500 font-mono"
            >
              {heroes.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.title || h.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Backpack className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-cinzel">Túi đồ hiện không có trang bị nào.</p>
              <p className="text-xs text-slate-600 mt-1 font-mono">
                Đánh bại quái vật hoặc ghé Cửa Tiệm để thu thập thêm trang bị.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelectItem(item.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#182338] border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-[#080c14] border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <WeaponIconArt item={item} size={36} />
                          <div>
                            <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              <span
                                className="text-[10px] font-mono font-bold"
                                style={{ color: RARITY_COLORS[item.rarity - 1] }}
                              >
                                {'★'.repeat(item.rarity)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="px-1 py-0.2 bg-slate-800 text-amber-300 font-bold rounded">
                                Lv.{item.level || item.floor || 1}
                              </span>
                              <span>{SLOT_NAMES[item.slot]} · Tầng {item.floor}</span>
                              {item.isTradeOff && (
                                <span className="px-1 py-0.2 bg-rose-950 text-rose-300 border border-rose-700 text-[9px] font-bold rounded">
                                  ĐÁNH ĐỔI
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Checkbox indicator */}
                        <div className="p-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono space-y-0.5 mb-2 text-slate-300">
                        {Object.entries(item.stats).map(([k, v]) => {
                          const { label, valueText, isNegative } = formatFullStatText(k, Number(v) || 0);
                          return (
                            <div key={k} className="flex justify-between items-center text-[10.5px]">
                              <span className="text-slate-400">{label}:</span>
                              <span className={isNegative ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                {valueText}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {item.isTradeOff && item.tradeOffPros && (
                        <div className="mb-2 p-1.5 rounded bg-rose-950/40 border border-rose-800/60 text-[9.5px] font-mono leading-tight">
                          <div className="text-emerald-300 font-semibold">Ưu điểm: {item.tradeOffPros}</div>
                          {item.tradeOffCons && (
                            <div className="text-rose-300 font-semibold mt-0.5">Đánh đổi: {item.tradeOffCons}</div>
                          )}
                        </div>
                      )}

                      {item.specialSkillName && (
                        <div className="mb-2 p-1.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-[10px] font-mono">
                          <div className="flex items-center justify-between font-bold text-indigo-300">
                            <span>⚡ {item.specialSkillName}</span>
                            <span className="text-sky-300">{item.specialSkillMp} MP</span>
                          </div>
                          {item.specialSkillDesc && (
                            <p className="text-indigo-200/80 text-[9.5px] mt-0.5 leading-tight">
                              {item.specialSkillDesc}
                            </p>
                          )}
                        </div>
                      )}

                      {item.description && !item.specialSkillDesc && (
                        <p className="text-[10px] text-slate-400 italic mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 pt-2 border-t border-slate-800/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEquipItem(selectedHeroId, item)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors shadow"
                      >
                        Trang bị
                      </button>
                      <button
                        onClick={() => onSellItem(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-mono transition-colors"
                        title="Bán nhận vàng"
                      >
                        +{item.sellPrice} đ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Floating Bulk Action Bar when items are selected */}
        {selectedItemIds.size > 0 && (
          <div className="absolute bottom-0 inset-x-0 bg-[#070a12]/95 backdrop-blur-md border-t-2 border-amber-600/70 p-3.5 flex items-center justify-between shadow-2xl z-20">
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-slate-300 font-bold">
                Đã chọn: <b className="text-amber-400 text-sm">{selectedItemIds.size}</b> món
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">
                Tổng nhận: <b className="text-emerald-400 text-sm">+{totalSelectedGold} đ</b>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedItemIds(new Set())}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-colors"
              >
                Hủy chọn
              </button>
              <button
                onClick={handleConfirmBulkSell}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-950/60"
              >
                <Trash2 className="w-4 h-4" />
                <span>BÁN HÀNG LOẠT ({selectedItemIds.size} MÓN)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
