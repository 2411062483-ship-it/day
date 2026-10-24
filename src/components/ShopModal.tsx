import React from 'react';
import { GearItem } from '../types/game';
import { SLOT_NAMES, RARITY_COLORS, formatFullStatText } from '../game/constants';
import { WeaponIconArt } from './WeaponIconArt';
import { X, Store, Coins, ShoppingBag } from 'lucide-react';

interface ShopModalProps {
  stock: GearItem[];
  gold: number;
  floor: number;
  onClose: () => void;
  onBuyItem: (item: GearItem) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  stock,
  gold,
  floor,
  onClose,
  onBuyItem,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#0b0f19] border-2 border-[#334155] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide font-cinzel">
                Cửa Tiệm Huyền Bí · Tầng {floor}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Thương nhân lang thang cung cấp vũ khí và chiến giáp quý hiếm
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

        {/* Stock Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {stock.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-cinzel">Thương gia đã bán hết hàng tại tầng này!</p>
              <p className="text-xs text-slate-600 mt-1 font-mono">Hàng mới sẽ được nhập thêm khi tiến lên tầng tiếp theo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stock.map((item) => {
                const price = item.price || Math.round(item.sellPrice * 1.6);
                const canAfford = gold >= price;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#080c14] border border-[#1e293b] hover:border-slate-700 transition-all flex flex-col justify-between"
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

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {price} đ
                      </span>
                      <button
                        onClick={() => onBuyItem(item)}
                        disabled={!canAfford}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          canAfford
                            ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Mua ngay' : 'Không đủ vàng'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
