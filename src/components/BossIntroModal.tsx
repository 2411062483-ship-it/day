import React, { useEffect } from 'react';
import { Unit } from '../types/game';
import { sound } from '../audio/sound';
import { Skull, AlertTriangle, ShieldAlert, Swords } from 'lucide-react';

interface BossIntroModalProps {
  boss: Unit;
  floor: number;
  onFight: () => void;
}

export const BossIntroModal: React.FC<BossIntroModalProps> = ({
  boss,
  floor,
  onFight,
}) => {
  useEffect(() => {
    sound.playBossIntro();
    const roarTimer = setTimeout(() => {
      sound.playBossRoar();
    }, 600);
    return () => clearTimeout(roarTimer);
  }, []);

  const isMinochoco = boss.species === 'snake';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between select-none overflow-hidden text-slate-100">
      {/* Cinematic Top Letterbox Bar */}
      <div className="w-full h-12 bg-black/95 border-b border-rose-950/60 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-rose-400 font-bold uppercase animate-pulse">
          <Skull className="w-4 h-4 text-rose-500" />
          <span>CẢNH BÁO: TRÙM TẦNG {floor} XUẤT HIỆN!</span>
        </div>
        <button
          onClick={onFight}
          className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 text-xs font-mono transition-colors border border-slate-800"
        >
          Bỏ qua [ESC]
        </button>
      </div>

      {/* Main Boss Spotlight Stage */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4">
        {/* Ambient Dark Blood Red Radial Lighting */}
        <div className="absolute inset-0 bg-radial from-rose-950/30 via-[#070a0f] to-[#020408] pointer-events-none" />

        {/* Central Boss Emblem & Portrait */}
        <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center">
          {/* Menacing Boss Glyph Frame */}
          <div className="relative mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 pixel-frame-red bg-[#1a0808] flex items-center justify-center text-5xl animate-pulse">
              {boss.glyph}
            </div>
            <div className="absolute -top-3 -right-3 px-2 py-0.5 pixel-frame bg-rose-600 text-white font-silkscreen text-[10px] tracking-wider uppercase">
              TRÙM
            </div>
          </div>

          {/* Epic Boss Title Card */}
          <h2 className="text-2xl sm:text-3xl font-black font-silkscreen text-rose-400 tracking-wider mb-1 drop-shadow-[2px_2px_0px_#000]">
            {boss.name}
          </h2>
          <p className="text-xs sm:text-sm font-mono text-amber-400 uppercase tracking-widest mb-4 font-bold">
            {boss.role}
          </p>

          {/* Menacing Lore Quote */}
          <blockquote className="bg-[#080c14] pixel-frame p-3.5 text-xs sm:text-sm font-mono text-rose-200/90 italic mb-5 leading-relaxed max-w-md">
            {isMinochoco
              ? '"Kẻ xâm phạm cổ ngục... Hãy nếm trải nọc độc nghìn năm và trở thành tro bụi trước uy lực Xà Linh Thượng Cổ!"'
              : '"Không một tên trộm nào có thể vượt qua xích sắt giam cầm của ta. Hãy run sợ trước sức mạnh thiết thạch!"'}
          </blockquote>

          {/* Boss Stats & Danger Attributes */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-md font-mono text-xs mb-5 tabular-nums">
            <div className="bg-[#080c14] p-2 pixel-frame">
              <span className="text-[10px] text-slate-500 block font-silkscreen">HP</span>
              <span className="font-bold text-rose-400 text-sm">{boss.maxHp}</span>
            </div>
            <div className="bg-[#080c14] p-2 pixel-frame">
              <span className="text-[10px] text-slate-500 block font-silkscreen">ATK</span>
              <span className="font-bold text-amber-400 text-sm">{boss.atk}</span>
            </div>
            <div className="bg-[#080c14] p-2 pixel-frame">
              <span className="text-[10px] text-slate-500 block font-silkscreen">DEF</span>
              <span className="font-bold text-emerald-300 text-sm">{boss.def}</span>
            </div>
            <div className="bg-[#080c14] p-2 pixel-frame">
              <span className="text-[10px] text-slate-500 block font-silkscreen">SPD</span>
              <span className="font-bold text-slate-200 text-sm">{boss.spd}</span>
            </div>
          </div>

          {/* Tactical Boss Warnings */}
          <div className="w-full max-w-md bg-rose-950/40 pixel-frame-red p-3 text-left text-xs font-mono space-y-1 mb-6">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[11px] font-silkscreen">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Đặc tính nguy hiểm:</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <b>{boss.passiveName || 'Vảy Giáp Thượng Cổ'}</b>: {boss.passiveDesc || 'Miễn nhiễm choáng, phản đòn độc và quét đòn diện rộng.'}
            </p>
            <p className="text-amber-300 text-[11px] leading-relaxed">
              • <b>Chiến thuật khuyên dùng</b>: Hãy né tránh các ô đỏ báo trước (Telegraph), dùng thùng thuốc nổ và combo Vỡ Vụn (Shatter) để đánh bại!
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Bottom Action Bar */}
      <div className="w-full bg-[#070b14] border-t-2 border-rose-600/60 p-4 sm:p-5 z-20 flex items-center justify-center">
        <button
          onClick={onFight}
          className="pixel-btn pixel-btn-red w-full max-w-sm py-3 px-8 font-silkscreen text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Swords className="w-4 h-4" />
          <span>VÀO TRẬN CHIẾN BOSS</span>
        </button>
      </div>
    </div>
  );
};
