import React, { useEffect, useRef, useState } from 'react';
import { DungeonForkOption, DungeonBiome, Unit } from '../types/game';
import { sound } from '../audio/sound';
import { Compass, Sparkles, ArrowRight, ShieldAlert, Heart, Gem, Shield } from 'lucide-react';

interface DungeonDoorCutsceneProps {
  floor: number;
  heroes: Unit[];
  forkOptions: DungeonForkOption[] | null;
  onProceed: (selectedBiome?: DungeonBiome, selectedOption?: DungeonForkOption) => void;
}

export const DungeonDoorCutscene: React.FC<DungeonDoorCutsceneProps> = ({
  floor,
  heroes,
  forkOptions,
  onProceed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedFork, setSelectedFork] = useState<string | null>(forkOptions ? forkOptions[0]?.id : null);
  const [isEntering, setIsEntering] = useState(false);

  // Background animated pixel embers & portal mist
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 400,
      y: Math.random() * 300,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(Math.random() * 1.8 + 0.6),
      size: Math.random() * 3 + 1,
      color: ['#fbbf24', '#f59e0b', '#38bdf8', '#c084fc', '#34d399'][Math.floor(Math.random() * 5)],
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.003;
        if (p.y < 0 || p.alpha <= 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
          p.alpha = Math.random() * 0.7 + 0.3;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSelectAndEnter = (opt: DungeonForkOption) => {
    if (isEntering) return;
    setIsEntering(true);
    sound.playLevelUp();
    setTimeout(() => {
      onProceed(opt.biome, opt);
    }, 750);
  };

  const handleSingleEnter = () => {
    if (isEntering) return;
    setIsEntering(true);
    sound.playLevelUp();
    setTimeout(() => {
      onProceed();
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className={`bg-[#0b0f19] pixel-frame-gold w-full max-w-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-700 ${isEntering ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Background Pixel Canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="absolute inset-0 pointer-events-none w-full h-full z-0 opacity-40 pixelated"
        />

        {/* Header Ribbon */}
        <div className="relative z-10 flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 pixel-frame bg-amber-950 border-2 border-amber-500 text-amber-400 flex items-center justify-center mb-2 shadow-lg">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-[10px] font-silkscreen uppercase tracking-widest text-amber-400 mb-1 font-bold">
            {forkOptions ? '✦ NGÃ RẼ HẦM NGỤC CỔ XƯA ✦' : '✦ BƯỚC QUA CỔNG THÁP ✦'}
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-slate-100 font-silkscreen tracking-wide">
            {forkOptions ? 'LỰA CHỌN CON ĐƯỜNG TIẾP THEO' : `TIẾN LÊN TẦNG ${floor + 1}`}
          </h2>
          <p className="text-xs text-slate-400 font-mono max-w-lg mt-1 leading-relaxed">
            {forkOptions
              ? 'Trước mắt đoàn thám hiểm mở ra hai lối đi sâu vào lòng tháp. Mỗi lối đi đều ẩn chứa cạm bẫy riêng cùng những phần thưởng đặc thù!'
              : `Toàn bộ quái vật đã bị đẩy lùi. Cánh cổng cổ xưa mở toang, dẫn lối đoàn thám hiểm tiến thẳng tới Tầng ${floor + 1}!`}
          </p>
        </div>

        {/* Active Party Lineup Mini-Paperdoll Display */}
        <div className="relative z-10 bg-[#070b14] pixel-frame p-2.5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-silkscreen text-slate-300">
              Đoàn Thám Hiểm Sẵn Sàng ({heroes.length}):
            </span>
          </div>
          <div className="flex items-center gap-2">
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className="pixel-frame px-2 py-0.5 bg-[#121926] flex items-center gap-1.5 text-[10px] font-mono"
              >
                <span className="text-xs">{hero.glyph}</span>
                <span className="text-slate-200 font-bold">{hero.name}</span>
                <span className="text-emerald-400 font-mono">
                  {hero.hp}/{hero.maxHp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fork Options (2 Paths Side-by-Side) */}
        {forkOptions && forkOptions.length >= 2 ? (
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {forkOptions.map((opt) => {
              const isSelected = selectedFork === opt.id;
              const isExtreme = opt.dangerLevel === 'Cực hạn';
              const isChallenging = opt.dangerLevel === 'Thử thách';

              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedFork(opt.id)}
                  className={`pixel-frame p-4 cursor-pointer transition-all flex flex-col justify-between text-left group relative ${
                    isSelected
                      ? 'bg-[#151c2e] border-amber-400 ring-2 ring-amber-500/50 shadow-xl'
                      : 'bg-[#080d18] border-[#1e293b] hover:bg-[#101726] hover:border-slate-600'
                  }`}
                >
                  <div>
                    {/* Top Icon & Danger Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl">{opt.icon}</div>
                      <span
                        className={`text-[9px] font-silkscreen px-2 py-0.5 border uppercase font-bold ${
                          isExtreme
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : isChallenging
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        }`}
                      >
                        {opt.dangerLevel}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-silkscreen text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors mb-1">
                      {opt.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 font-mono mb-3 leading-relaxed">
                      {opt.description}
                    </p>

                    {/* Perks Box */}
                    <div className="space-y-1.5 bg-[#050810] p-2 pixel-frame text-[10px] font-mono mb-3">
                      <div className="flex items-start gap-1.5 text-emerald-300 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        <span>{opt.perkText}</span>
                      </div>
                      {opt.riskText && (
                        <div className="flex items-start gap-1.5 text-rose-300">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                          <span>{opt.riskText}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Choose Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAndEnter(opt);
                    }}
                    disabled={isEntering}
                    className={`pixel-btn w-full py-2.5 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'pixel-btn-amber shadow-md'
                        : 'bg-[#1e293b] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{isSelected ? 'Bước Vào Lối Này' : 'Chọn Đường Này'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Door Portal Proceed */
          <div className="relative z-10 flex flex-col items-center gap-4 mb-3">
            <div className="w-full bg-[#080d18] pixel-frame p-4 text-center">
              <div className="text-4xl mb-2">🏛️</div>
              <p className="text-xs text-amber-300 font-silkscreen mb-1">
                CỔNG THÁP ĐÃ MỞ RỘNG
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Ma lực thuần khiết tràn vào cơ thể toàn đội, phục hồi 100% Ma Lực (MP) và xóa bỏ mọi hiệu ứng xấu.
              </p>
            </div>
            <button
              onClick={handleSingleEnter}
              disabled={isEntering}
              className="pixel-btn pixel-btn-amber w-full max-w-md py-3 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Tiến Bước Xuống Tầng {floor + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
