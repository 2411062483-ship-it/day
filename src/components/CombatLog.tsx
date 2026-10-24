import React, { useState, useRef, useEffect } from 'react';
import { CombatLogEntry } from '../types/game';
import { ScrollText, Trash2 } from 'lucide-react';

interface CombatLogProps {
  logs: CombatLogEntry[];
  onClear: () => void;
}

export const CombatLog: React.FC<CombatLogProps> = ({ logs, onClear }) => {
  const [filter, setFilter] = useState<'all' | 'combat' | 'item'>('all');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'combat') return log.type === 'enemy' || log.type === 'good' || log.type === 'skill';
    if (filter === 'item') return log.type === 'item';
    return true;
  });

  return (
    <div className="bg-[#0b0f19] pixel-frame p-3 flex flex-col h-[200px]">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] text-xs">
        <div className="flex items-center gap-1.5 text-slate-200 font-bold uppercase tracking-wider text-[11px] font-silkscreen">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <span>Biên Niên Sử Chiến Đấu</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`pixel-btn px-2 py-0.5 text-[9px] font-silkscreen transition-colors ${
              filter === 'all'
                ? 'pixel-btn-amber font-bold'
                : 'bg-[#1e293b] text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('combat')}
            className={`pixel-btn px-2 py-0.5 text-[9px] font-silkscreen transition-colors ${
              filter === 'combat'
                ? 'pixel-btn-amber font-bold'
                : 'bg-[#1e293b] text-slate-400 hover:text-slate-200'
            }`}
          >
            Trận đánh
          </button>
          <button
            onClick={() => setFilter('item')}
            className={`pixel-btn px-2 py-0.5 text-[9px] font-silkscreen transition-colors ${
              filter === 'item'
                ? 'pixel-btn-amber font-bold'
                : 'bg-[#1e293b] text-slate-400 hover:text-slate-200'
            }`}
          >
            Trang bị & Vàng
          </button>
          <button
            onClick={onClear}
            className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1"
            title="Xóa nhật ký"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 pt-2 pr-1 text-xs font-mono scrollbar-thin scrollbar-thumb-slate-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 italic text-center py-6">Chưa có ghi chép nào.</div>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className={`p-1.5 rounded border transition-colors leading-relaxed ${
                entry.type === 'good'
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                  : entry.type === 'enemy'
                  ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                  : entry.type === 'item'
                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                  : entry.type === 'skill'
                  ? 'bg-indigo-950/40 border-indigo-800/40 text-indigo-300'
                  : 'bg-slate-950/50 border-slate-800/60 text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-500 mr-1.5">[{entry.time}]</span>
              <span dangerouslySetInnerHTML={{ __html: entry.message }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
