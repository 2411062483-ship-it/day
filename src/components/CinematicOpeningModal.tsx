import React, { useState, useEffect } from 'react';
import { Unit } from '../types/game';
import { VisualPaperdoll } from './VisualPaperdoll';
import { sound } from '../audio/sound';
import { Sword, Compass, ArrowRight, SkipForward } from 'lucide-react';

interface CinematicOpeningModalProps {
  heroes: Unit[];
  floor: number;
  onEnter: () => void;
}

export const CinematicOpeningModal: React.FC<CinematicOpeningModalProps> = ({
  heroes,
  floor,
  onEnter,
}) => {
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);
  const hero1 = heroes[0];
  const hero2 = heroes[1] || heroes[0];

  const dialogueLines = [
    {
      speaker: hero1?.name || 'Chiến Binh',
      role: hero1?.title || 'Nhà Thám Hiểm',
      unit: hero1,
      text: `Nhìn kìa... Đại Tháp Cổ Ngục sừng sững giữa sương mù tử khí. Người ta đồn rằng nơi này không một ai từng sống sót vượt qua Tầng 10!`,
    },
    {
      speaker: hero2?.name || 'Đồng Đội',
      role: hero2?.title || 'Đồng Hành',
      unit: hero2,
      text: `Chúng ta không phải những kẻ bình thường. Chỉ cần khéo léo tận dụng địa hình cao thấp, đẩy lùi quái va tường và kích nổ các thùng thuốc nổ, chúng ta sẽ làm nên kỳ tích!`,
    },
    {
      speaker: 'Huyền Thoại Tháp',
      role: 'Lời Kể Cổ Xưa',
      unit: null,
      text: `Cánh cổng phong ấn sắt ngục rền vang mở ra... Hãy chuẩn bị tinh thần và vũ khí, hỡi những chiến binh tự do!`,
    },
  ];

  const handleNext = () => {
    sound.playClick();
    if (dialogueIndex < dialogueLines.length - 1) {
      setDialogueIndex((prev) => prev + 1);
    } else {
      onEnter();
    }
  };

  const handleSkip = () => {
    sound.playClick();
    onEnter();
  };

  const curDialogue = dialogueLines[dialogueIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#04060a] flex flex-col items-center justify-between select-none overflow-hidden text-slate-100">
      {/* Cinematic Top Letterbox Bar */}
      <div className="w-full h-14 bg-black/95 border-b border-amber-950/40 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400 font-bold uppercase">
          <Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
          <span>KHỞI ĐẦU HÀNH TRÌNH — ĐẠI THÁP CỔ NGỤC</span>
        </div>
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 text-xs font-mono transition-colors border border-slate-800"
        >
          <span>Bỏ qua</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Visual Arena: Dark towering citadel gate */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center p-4">
        {/* Background Atmosphere & Towering Silhouette */}
        <div className="absolute inset-0 bg-radial from-slate-900/40 via-[#070a0f] to-[#020408] pointer-events-none" />

        {/* Ambient Mist Particles */}
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

        {/* Massive Iron-Studded Dungeon Gate Graphics */}
        <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center">
          {/* Gothic Spire Gate Arch in SVG */}
          <div className="w-72 h-44 sm:w-96 sm:h-56 relative mb-4">
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-2xl">
              <defs>
                <linearGradient id="gateStone" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                <radialGradient id="portalCore" cx="50%" cy="60%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#b45309" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Stone Archway */}
              <path
                d="M 30 120 L 30 50 Q 100 -5 170 50 L 170 120 Z"
                fill="url(#gateStone)"
                stroke="#334155"
                strokeWidth="3"
              />
              {/* Inner Portal Abyss with warm glow */}
              <path
                d="M 45 120 L 45 60 Q 100 15 155 60 L 155 120 Z"
                fill="#030712"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              <ellipse cx="100" cy="80" rx="45" ry="35" fill="url(#portalCore)" />

              {/* Iron Portcullis Bars */}
              {[60, 80, 100, 120, 140].map((x) => (
                <line key={x} x1={x} y1="35" x2={x} y2="120" stroke="#475569" strokeWidth="2.5" />
              ))}
              <line x1="45" y1="70" x2="155" y2="70" stroke="#64748b" strokeWidth="2" />
              <line x1="45" y1="95" x2="155" y2="95" stroke="#64748b" strokeWidth="2" />

              {/* Torches on side pillars */}
              <circle cx="28" cy="65" r="4" fill="#f97316" />
              <circle cx="28" cy="65" r="2" fill="#fef08a" />
              <circle cx="172" cy="65" r="4" fill="#f97316" />
              <circle cx="172" cy="65" r="2" fill="#fef08a" />
            </svg>
          </div>

          {/* Chosen Starting Heroes Marching Toward the Gate */}
          <div className="flex items-end justify-center gap-6 sm:gap-12 mb-6">
            {heroes.slice(0, 3).map((hero, idx) => (
              <div
                key={hero.id}
                className="flex flex-col items-center transition-all transform hover:scale-105"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="pixel-frame p-1 bg-[#05070c]">
                  <VisualPaperdoll unit={hero} size="lg" />
                </div>
                <div className="mt-2 text-center">
                  <span className="font-bold text-xs text-slate-100 font-silkscreen block">
                    {hero.name}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {hero.title || hero.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cinematic Dialogue Box & Bottom Letterbox */}
      <div className="w-full bg-[#070b14] border-t-2 border-amber-500/50 p-4 sm:p-5 z-20 shadow-2xl">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4 pixel-frame p-3 bg-[#0a0f19]">
          {curDialogue.unit ? (
            <div className="shrink-0 pixel-frame p-0.5 bg-[#05070c]">
              <VisualPaperdoll unit={curDialogue.unit} size="sm" />
            </div>
          ) : (
            <div className="w-11 h-11 pixel-frame bg-amber-950 flex items-center justify-center text-amber-400 shrink-0">
              <Sword className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="font-bold text-sm text-amber-300 font-silkscreen tracking-wide">
                {curDialogue.speaker}
              </span>
              <span className="text-[10px] font-silkscreen text-slate-400 bg-slate-900 px-2 py-0.5 pixel-frame">
                {curDialogue.role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-mono leading-relaxed">
              {curDialogue.text}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleNext}
              className="pixel-btn pixel-btn-amber py-2.5 px-5 font-silkscreen text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <span>{dialogueIndex < dialogueLines.length - 1 ? 'Tiếp theo' : 'VÀO THÁP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
