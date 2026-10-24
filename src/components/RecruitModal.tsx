import React from 'react';
import { Unit } from '../types/game';
import { UserPlus, Sparkles } from 'lucide-react';
import { VisualPaperdoll } from './VisualPaperdoll';

interface RecruitModalProps {
  candidate: Unit | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const RecruitModal: React.FC<RecruitModalProps> = ({
  candidate,
  onAccept,
  onDecline,
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#0b0f19] border-2 border-amber-500/70 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-600/50 flex items-center justify-center mb-3 text-amber-400">
          <UserPlus className="w-6 h-6" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1 font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Gặp Gỡ Người Đồng Hành Mới
        </span>

        <h2 className="text-2xl font-black text-slate-100 font-cinzel tracking-wide mb-0.5">
          {candidate.name}
        </h2>
        <p className="text-xs text-amber-300 font-mono mb-4">
          {candidate.title || candidate.role}
        </p>

        {/* Visual Paperdoll Preview */}
        <div className="mb-4">
          <VisualPaperdoll unit={candidate} size="lg" />
        </div>

        {/* Randomized Stat badges */}
        <div className="grid grid-cols-4 gap-2 w-full font-mono text-xs mb-3">
          <div className="bg-[#080c14] p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">HP</span>
            <span className="font-bold text-emerald-400">{candidate.maxHp}</span>
          </div>
          <div className="bg-[#080c14] p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">MP</span>
            <span className="font-bold text-sky-400">{candidate.maxMp}</span>
          </div>
          <div className="bg-[#080c14] p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">ATK</span>
            <span className="font-bold text-amber-400">{candidate.atk}</span>
          </div>
          <div className="bg-[#080c14] p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block">SPD</span>
            <span className="font-bold text-slate-200">{candidate.spd}</span>
          </div>
        </div>

        {/* Innate Passive */}
        {candidate.passiveName && (
          <div className="w-full bg-[#080c14] p-2.5 rounded-xl border border-amber-800/40 text-left text-[11px] font-mono mb-5">
            <span className="text-amber-400 font-bold block mb-0.5">
              Nội tại: {candidate.passiveName}
            </span>
            <span className="text-slate-300 leading-relaxed text-[10px]">
              {candidate.passiveDesc}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/50"
          >
            MỜI VÀO ĐỘI
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Từ Chối
          </button>
        </div>
      </div>
    </div>
  );
};
