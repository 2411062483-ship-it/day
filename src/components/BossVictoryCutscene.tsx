import React, { useEffect, useRef } from 'react';
import { Unit, GearItem } from '../types/game';
import { sound } from '../audio/sound';
import { Trophy, Crown, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { VisualPaperdoll } from './VisualPaperdoll';
import { WeaponIconArt } from './WeaponIconArt';
import { RARITY_COLORS } from '../game/constants';

interface BossVictoryCutsceneProps {
  bossName: string;
  floor: number;
  heroes: Unit[];
  lootFound: GearItem[];
  goldEarned: number;
  onContinue: () => void;
}

export const BossVictoryCutscene: React.FC<BossVictoryCutsceneProps> = ({
  bossName,
  floor,
  heroes,
  lootFound,
  goldEarned,
  onContinue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    sound.playBossVictory();

    // Canvas particle celebration
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 2.5 - 0.5,
      size: Math.random() * 3 + 1.5,
      color: ['#fbbf24', '#f59e0b', '#38bdf8', '#4ade80', '#c084fc', '#f43f5e'][Math.floor(Math.random() * 6)],
      alpha: Math.random() * 0.8 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) {
          p.y = canvas.height + 5;
          p.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pick MVP Hero with highest level/attack
  const mvpHero = [...heroes].sort((a, b) => (b.atk + b.matk) - (a.atk + a.matk))[0] || heroes[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#04060a]/95 backdrop-blur-md flex flex-col items-center justify-between select-none overflow-hidden text-slate-100">
      {/* Background celebration canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60"
      />

      {/* Cinematic Top Letterbox */}
      <div className="w-full h-12 bg-black/95 border-b border-amber-950/60 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400 font-bold uppercase">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>CHIẾN THẮNG HUY HOÀNG — TRÙM THÁP BỊ ĐÁNH BẠI</span>
        </div>
        <span className="text-xs font-mono text-slate-400">TẦNG {floor} HOÀN TẤT</span>
      </div>

      {/* Main Content Arena */}
      <div className="relative z-10 flex-1 w-full max-w-3xl flex flex-col items-center justify-center p-4 text-center">
        {/* Triumphant Badge */}
        <div className="w-14 h-14 pixel-frame-gold bg-amber-500 flex items-center justify-center text-slate-950 mb-3">
          <Crown className="w-8 h-8" />
        </div>

        <span className="text-xs font-silkscreen uppercase tracking-widest text-amber-400 font-bold mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          CHIẾN TÍCH THẦN THOẠI
        </span>

        <h1 className="text-2xl sm:text-4xl font-black font-silkscreen text-amber-300 tracking-wide mb-2 drop-shadow-[2px_2px_0px_#000]">
          {bossName} ĐÃ GỤC NGÃ!
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-lg mb-6 leading-relaxed">
          Sức mạnh tà ác thống trị tầng tháp đã tan biến vào hư vô. Rương báu cổ ngục ngàn năm hé mở ban tặng phần thưởng vô giá cho những chiến binh dũng cảm!
        </p>

        {/* MVP Hero Spotlight Card */}
        {mvpHero && (
          <div className="w-full max-w-md bg-[#080c14] pixel-frame-gold p-3.5 mb-5 shadow-2xl flex items-center gap-4 text-left">
            <div className="relative shrink-0">
              <div className="pixel-frame p-0.5 bg-[#05070c]">
                <VisualPaperdoll unit={mvpHero} size="md" />
              </div>
              <div className="absolute -top-2 -left-2 px-1.5 py-0.5 pixel-frame bg-amber-500 text-slate-950 font-silkscreen text-[9px] uppercase">
                MVP
              </div>
            </div>
            <div className="flex-1 min-w-0 font-mono text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-sm text-slate-100 font-silkscreen truncate">
                  {mvpHero.name}
                </span>
                <span className="text-amber-400 font-silkscreen text-[10px]">Lv{mvpHero.level}</span>
              </div>
              <p className="text-slate-400 text-[10px] mb-1.5">{mvpHero.title || mvpHero.role}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-300 tabular-nums">
                <span>ATK: <b className="text-amber-300">{mvpHero.atk}</b></span>
                <span>MATK: <b className="text-sky-300">{mvpHero.matk}</b></span>
                <span>DEF: <b className="text-emerald-300">{mvpHero.def}</b></span>
              </div>
            </div>
          </div>
        )}

        {/* Loot & Gold Unsealed */}
        <div className="w-full max-w-md bg-[#080c14] pixel-frame p-3 mb-6 text-left text-xs font-mono">
          <div className="flex justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-silkscreen text-[11px]">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Vàng kho báu:
            </span>
            <span className="font-bold text-amber-300 text-sm tabular-nums">+{goldEarned} đồng</span>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block mb-1 text-[11px] font-silkscreen">Trang bị quý rơi từ Trùm:</span>
            {lootFound.length > 0 ? (
              <div className="space-y-1.5">
                {lootFound.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-1.5 pixel-frame bg-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <WeaponIconArt item={item} size={24} />
                      <span className="text-slate-200 font-bold text-xs">{item.name}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: RARITY_COLORS[item.rarity - 1] }}
                    >
                      {'★'.repeat(item.rarity)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic text-xs font-mono">Kho báu vàng đã được thu thập đầy đủ.</span>
            )}
          </div>
        </div>
      </div>

      {/* Cinematic Bottom Action */}
      <div className="w-full bg-[#070b14] border-t-2 border-amber-500/50 p-4 sm:p-5 z-20 flex items-center justify-center">
        <button
          onClick={onContinue}
          className="pixel-btn pixel-btn-amber w-full max-w-sm py-3 px-8 font-silkscreen text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>TIẾP TỤC LÊN TẦNG {floor + 1}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
