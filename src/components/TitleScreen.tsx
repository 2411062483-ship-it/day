import React, { useState } from 'react';
import { Unit } from '../types/game';
import { GEAR_CATALOG, generateRandomAdventurer } from '../game/constants';
import { Sword, Play, ArrowRight, BookOpen, Check, Dices } from 'lucide-react';
import { VisualPaperdoll } from './VisualPaperdoll';
import { WeaponIconArt } from './WeaponIconArt';

interface TitleScreenProps {
  hasSave: boolean;
  saveFloor: number;
  initialRoster: Unit[];
  onContinue: () => void;
  onStartNewRun: (starters: Unit[], starterWeapons: Record<string, string>) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSave,
  saveFloor,
  initialRoster,
  onContinue,
  onStartNewRun,
}) => {
  const [view, setView] = useState<'title' | 'setup' | 'rules'>('title');
  const [roster, setRoster] = useState<Unit[]>(initialRoster);
  const [selectedStarters, setSelectedStarters] = useState<string[]>([
    initialRoster[0]?.id || 'hero-1',
    initialRoster[1]?.id || 'hero-2',
  ]);
  const [starterWeapons, setStarterWeapons] = useState<Record<string, string>>({
    [initialRoster[0]?.id || 'hero-1']: 'Kiếm Rèn Sắt',
    [initialRoster[1]?.id || 'hero-2']: 'Rìu Phá Trận',
    [initialRoster[2]?.id || 'hero-3']: 'Cung Tầm Xa',
    [initialRoster[3]?.id || 'hero-4']: 'Trượng Tinh Vân Cổ',
    [initialRoster[4]?.id || 'hero-5']: 'Chuông Nguyện Trầm Hương',
  });

  const weaponOptions = GEAR_CATALOG.filter((item) => item.slot === 'weapon');

  const toggleStarter = (id: string) => {
    if (selectedStarters.includes(id)) {
      if (selectedStarters.length > 1) {
        setSelectedStarters(selectedStarters.filter((item) => item !== id));
      }
    } else {
      if (selectedStarters.length < 2) {
        setSelectedStarters([...selectedStarters, id]);
      } else {
        setSelectedStarters([selectedStarters[0], id]);
      }
    }
  };

  // Re-roll starting adventurers with fresh random stats & appearances!
  const handleReroll = () => {
    const newRoster = [
      generateRandomAdventurer('hero-1'),
      generateRandomAdventurer('hero-2'),
      generateRandomAdventurer('hero-3'),
      generateRandomAdventurer('hero-4'),
      generateRandomAdventurer('hero-5'),
    ];
    setRoster(newRoster);
    setSelectedStarters([newRoster[0].id, newRoster[1].id]);
    setStarterWeapons({
      [newRoster[0].id]: 'Kiếm Rèn Sắt',
      [newRoster[1].id]: 'Rìu Phá Trận',
      [newRoster[2].id]: 'Cung Tầm Xa',
      [newRoster[3].id]: 'Trượng Tinh Vân Cổ',
      [newRoster[4].id]: 'Chuông Nguyện Trầm Hương',
    });
  };

  const handleEnterTower = () => {
    if (selectedStarters.length === 2) {
      const chosenAdventurers = roster.filter((h) => selectedStarters.includes(h.id));
      onStartNewRun(chosenAdventurers, starterWeapons);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070a0f] flex flex-col items-center justify-center p-4 select-none overflow-hidden text-slate-100">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* VIEW: TITLE SCREEN */}
      {view === 'title' && (
        <div className="max-w-2xl w-full flex flex-col items-center text-center z-10 space-y-6">
          <div className="pixel-frame inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-amber-300 text-xs font-silkscreen uppercase tracking-widest shadow-xl">
            <Sword className="w-4 h-4 text-amber-400" />
            <span>RETRO 16-BIT TACTICAL DUNGEON</span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-6xl font-black font-pixel tracking-wider text-amber-300 drop-shadow-[4px_4px_0px_#000000]">
              THÁP ĐỒNG HÀNH
            </h1>
            <p className="mt-4 text-slate-300 text-xs font-mono max-w-lg mx-auto leading-relaxed">
              Chiến binh tự do không gò bó giai cấp · Chỉ số ngẫu nhiên · Dùng gì giỏi nấy · Trang bị hiển thị chân thực
            </p>
          </div>

          <div className="w-full max-w-sm space-y-3 pt-2">
            <button
              onClick={() => setView('setup')}
              className="pixel-btn pixel-btn-amber w-full py-3.5 px-6 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>CHƠI MỚI (VÀO THÁP)</span>
            </button>

            {hasSave && (
              <button
                onClick={onContinue}
                className="pixel-btn pixel-btn-primary w-full py-3 px-6 font-silkscreen text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
              >
                <span>TIẾP TỤC HÀNH TRÌNH</span>
                <span className="text-[10px] font-mono text-amber-300 bg-slate-950 px-2 py-0.5 border border-slate-700">
                  Tầng {saveFloor}
                </span>
              </button>
            )}

            <button
              onClick={() => setView('rules')}
              className="pixel-btn w-full py-2.5 px-4 bg-[#1e293b] text-slate-300 text-xs font-silkscreen flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cơ Chế Chiến Thuật & Hướng Dẫn</span>
            </button>
          </div>

          <div className="text-[10px] font-mono text-slate-500 pt-4">
            HTML5 Pixel Canvas Engine · Tự Động & Thủ Công · Sử Dụng Gì Lên Điểm Nấy
          </div>
        </div>
      )}

      {/* VIEW: SETUP SCREEN (Pick 2 Starters with Randomized Stats & Reroll Button!) */}
      {view === 'setup' && (
        <div className="max-w-5xl w-full z-10 flex flex-col space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-[#1e293b] pb-4 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-silkscreen text-slate-100">
                Chiêu Mộ Đội Ngũ Ban Đầu
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Chỉ số và ngoại hình nhân vật hoàn toàn ngẫu nhiên. Mọi nhân vật đều có thể dùng mọi món đồ!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReroll}
                className="pixel-btn pixel-btn-amber flex items-center gap-1.5 px-3 py-1.5 text-xs font-silkscreen cursor-pointer"
                title="Tạo lại các nhân vật với chỉ số ngẫu nhiên mới"
              >
                <Dices className="w-4 h-4" />
                <span>ĐỔ LẠI ĐỘI HÌNH</span>
              </button>
              <button
                onClick={() => setView('title')}
                className="pixel-btn px-3 py-1.5 bg-[#1e293b] text-slate-400 hover:text-slate-200 text-xs font-silkscreen cursor-pointer"
              >
                Quay lại
              </button>
            </div>
          </div>

          {/* Hero Selection Grid with Visual Paperdoll & Randomized Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {roster.map((hero) => {
              const isSelected = selectedStarters.includes(hero.id);
              return (
                <div
                  key={hero.id}
                  onClick={() => toggleStarter(hero.id)}
                  className={`p-3 pixel-frame cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#162032] pixel-frame-gold shadow-xl'
                      : 'bg-[#0b0f19] hover:bg-[#121926]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="pixel-frame p-0.5 bg-[#05070c]">
                        <VisualPaperdoll unit={hero} size="sm" />
                      </div>
                      <div
                        className={`w-6 h-6 pixel-frame flex items-center justify-center text-xs font-bold font-silkscreen ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-900 text-slate-500'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : '+'}
                      </div>
                    </div>

                    <div className="font-bold text-xs text-slate-100 mb-0.5 font-silkscreen">{hero.name}</div>
                    <div className="text-[10px] text-amber-400 font-mono mb-2 truncate">
                      {hero.title || hero.role}
                    </div>

                    <div className="bg-[#080c14] p-1.5 border border-slate-800 font-mono text-[9px] text-slate-300 leading-tight mb-2">
                      <span className="text-amber-400 font-bold block mb-0.5">Nội tại:</span>
                      {hero.passiveName}
                    </div>
                  </div>

                  {/* Stat breakdown */}
                  <div className="pt-2 border-t border-slate-800 font-mono text-[10px] text-slate-400 space-y-0.5 tabular-nums">
                    <div className="flex justify-between">
                      <span>HP:</span> <span className="text-emerald-400 font-bold">{hero.maxHp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MP:</span> <span className="text-sky-400 font-bold">{hero.maxMp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ATK:</span> <span className="text-amber-400 font-bold">{hero.atk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MATK:</span> <span className="text-indigo-400 font-bold">{hero.matk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEF:</span> <span className="text-emerald-300 font-bold">{hero.def}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SPD:</span> <span className="text-slate-200 font-bold">{hero.spd}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weapon loadout for chosen heroes */}
          <div className="bg-[#0b0f19] pixel-frame p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-amber-400 font-bold font-silkscreen">Vũ khí khởi đầu:</span>
              {selectedStarters.map((id) => {
                const hero = roster.find((h) => h.id === id);
                if (!hero) return null;
                const chosenItem = weaponOptions.find((w) => w.name === (starterWeapons[id] || weaponOptions[0]?.name));
                return (
                  <div key={id} className="flex items-center gap-2 bg-slate-900 p-1.5 pixel-frame">
                    <span className="text-slate-200 font-bold font-silkscreen text-[11px]">{hero.name}:</span>
                    {chosenItem && <WeaponIconArt item={chosenItem} size={22} />}
                    <select
                      value={starterWeapons[id] || weaponOptions[0]?.name}
                      onChange={(e) =>
                        setStarterWeapons({
                          ...starterWeapons,
                          [id]: e.target.value,
                        })
                      }
                      className="bg-slate-950 border border-slate-700 text-amber-300 px-2 py-1 focus:outline-none focus:border-amber-500 font-mono text-xs cursor-pointer"
                    >
                      {weaponOptions.map((w) => (
                        <option key={w.name} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleEnterTower}
              disabled={selectedStarters.length !== 2}
              className={`pixel-btn py-3 px-8 font-silkscreen text-xs uppercase tracking-wider flex items-center gap-2 ${
                selectedStarters.length === 2
                  ? 'pixel-btn-amber cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }`}
            >
              <span>BẮT ĐẦU VÀO THÁP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* VIEW: RULES & GUIDE */}
      {view === 'rules' && (
        <div className="max-w-2xl w-full z-10 bg-[#0b0f19] border-2 border-[#334155] rounded-2xl p-6 shadow-2xl flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
            <h2 className="text-lg font-bold font-cinzel text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Cơ Chế Chiến Thuật & Tiến Trình Tăng Điểm</span>
            </h2>
            <button
              onClick={() => setView('title')}
              className="text-xs font-mono text-slate-400 hover:text-slate-100"
            >
              [Đóng]
            </button>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-300 leading-relaxed overflow-y-auto max-h-[60vh] pr-2">
            <div className="p-3 rounded-lg bg-[#080c14] border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">
                1. Không Gò Bó Class & Chỉ Số Ngẫu Nhiên
              </span>
              <p className="text-slate-400">
                Toàn bộ nhân vật đều là chiến binh tự do với chỉ số khởi đầu ngẫu nhiên. Bất kỳ ai cũng có thể vung đại kiếm, nâng búa tạ, bắn cung dài hoặc niệm thần chú bằng trượng phép!
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#080c14] border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">
                2. Dùng Gì Lên Điểm Nấy (Action Proficiency)
              </span>
              <p className="text-slate-400">
                - Đánh bằng đao kiếm/rìu/búa tích lũy kinh nghiệm tăng thẳng điểm <b>ATK</b>.<br />
                - Niệm chú bằng trượng/sách/chuông tích lũy kinh nghiệm tăng <b>MATK & Max MP</b>.<br />
                - Đỡ đòn hoặc mặc giáp nặng nhận sát thương tích lũy kinh nghiệm tăng <b>DEF & Max HP</b>.<br />
                - Hành động mau lẹ và dùng vũ khí nhẹ tích lũy kinh nghiệm tăng <b>SPD</b>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#080c14] border border-slate-800">
              <span className="text-sky-400 font-bold block mb-1">
                3. Địa Hình Chiến Thuật Biến Hóa
              </span>
              <p className="text-slate-400">
                - <b>Song sắt (Iron Bars)</b>: Ngăn bước đi của cận chiến nhưng cho phép cung tên và tia phép xuyên qua!<br />
                - <b>Tường nứt & Rêu phong</b>: Nơi các cặp mắt quái thú rình rập trong bóng tối.<br />
                - <b>Đài tế cổ (Altar)</b>: Phe nào đứng trên đài tế nhận hào quang +3 Công và hồi phục 3 HP mỗi lượt.
              </p>
            </div>
          </div>

          <button
            onClick={() => setView('title')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Đã Hiểu, Quay Lại Menu
          </button>
        </div>
      )}
    </div>
  );
};
