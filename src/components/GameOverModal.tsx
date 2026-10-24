import React, { useEffect, useRef } from 'react';
import { Trophy, Skull, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { GearItem } from '../types/game';
import { RARITY_COLORS } from '../game/constants';
import { WeaponIconArt } from './WeaponIconArt';

interface GameOverModalProps {
  isVictory: boolean;
  floor: number;
  isBoss: boolean;
  lootFound: GearItem[];
  goldEarned: number;
  onContinue: () => void;
  onRetry: () => void;
  onRetreatFloor?: () => void;
  onBackToTitle?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  floor,
  isBoss,
  lootFound,
  goldEarned,
  onContinue,
  onRetry,
  onRetreatFloor,
  onBackToTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isVictory) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      color: ['#fbbf24', '#f59e0b', '#38bdf8', '#4ade80', '#e879f9'][Math.floor(Math.random() * 5)],
      size: Math.random() * 4 + 2,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        if (p.y > canvas.height) p.y = -10;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      });
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className={`bg-[#0b0f19] ${isVictory ? 'pixel-frame-gold' : 'pixel-frame-red'} w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden`}>
        {/* Confetti canvas */}
        {isVictory && (
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="absolute inset-0 pointer-events-none w-full h-full z-0 opacity-70 pixelated"
          />
        )}

        <div
          className={`w-14 h-14 pixel-frame flex items-center justify-center mb-4 z-10 ${
            isVictory
              ? 'bg-amber-950 text-amber-400'
              : 'bg-rose-950 text-rose-400'
          }`}
        >
          {isVictory ? <Trophy className="w-7 h-7" /> : <Skull className="w-7 h-7" />}
        </div>

        <span
          className={`text-xs font-silkscreen uppercase tracking-widest mb-1 z-10 font-bold ${
            isVictory ? 'text-amber-400' : 'text-rose-400'
          }`}
        >
          {isVictory ? (isBoss ? 'HẠ GỤC TRÙM ĐẠI THÀNH!' : 'CHINH PHỤC THÀNH CÔNG') : 'CHIẾN BINH THẤT THỦ'}
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-silkscreen tracking-wide mb-2 z-10">
          {isVictory ? `VƯỢT QUA TẦNG ${floor}` : `GỤC NGÃ TẠI TẦNG ${floor}`}
        </h2>

        <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed z-10">
          {isVictory
            ? 'Toàn bộ kẻ địch đã bị tiêu diệt. Cổng tiến lên tầng cao hơn đã mở ra cho đoàn thám hiểm.'
            : 'Đoàn thám hiểm đã gục ngã. Hãy tái lập phòng chiến hoặc điều chỉnh lại chiến lược.'}
        </p>

        {/* Victory Rewards Summary */}
        {isVictory && (
          <div className="w-full bg-[#080c14] pixel-frame p-3 mb-5 text-left text-xs font-mono z-10">
            <div className="flex justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-silkscreen text-[11px]">Vàng thu thập:</span>
              <span className="font-bold text-amber-300 tabular-nums">+{goldEarned} đ</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-400 font-silkscreen text-[11px] block mb-1">Chiến lợi phẩm ({lootFound.length}):</span>
              {lootFound.length > 0 ? (
                <div className="space-y-1">
                  {lootFound.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-[11px] p-1.5 pixel-frame bg-slate-900"
                    >
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <WeaponIconArt item={item} size={20} />
                        <span>{item.name}</span>
                      </span>
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
                <span className="text-slate-600 italic font-mono">Không có trang bị mới rơi ra.</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full z-10">
          {isVictory ? (
            <button
              onClick={onContinue}
              className="pixel-btn pixel-btn-amber w-full py-3 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Tiến Lên Tầng {floor + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              {floor > 1 && onRetreatFloor && (
                <button
                  onClick={onRetreatFloor}
                  className="pixel-btn pixel-btn-amber w-full py-3 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg border-2 border-amber-400 bg-amber-950/80 hover:bg-amber-900"
                  title="Giữ nguyên đội hình, trang bị và vàng để cày cấp lại ở tầng thấp hơn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Lùi Về Tầng {floor - 1} Để Cày Cấp & Kiếm Đồ</span>
                </button>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                <button
                  onClick={onRetry}
                  className="pixel-btn pixel-btn-red flex-1 w-full py-2.5 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Hồi Sinh Thử Lại Tầng Này</span>
                </button>
                {onBackToTitle && (
                  <button
                    onClick={onBackToTitle}
                    className="pixel-btn flex-1 w-full py-2.5 bg-[#1e293b] text-slate-300 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:text-slate-100"
                  >
                    <span>Về Menu Chính</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
