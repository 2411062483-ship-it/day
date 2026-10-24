import { GearTemplate, Unit, WeaponFamily, DungeonBiome, HairStyle } from '../types/game';

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const EXIT_DOOR = { x: 11, y: 3 };

export const PLAYBACK_SPEEDS = [1, 2, 4];

export const MAX_PARTY_SIZE = 4;

// Dynamic Experience thresholds for action-based stat level-ups (higher current stat requires more EXP!)
export function getStatExpThreshold(statKey: string, currentVal: number = 0): number {
  switch (statKey) {
    case 'atk':
      return 35 + Math.floor(currentVal * 4.5);
    case 'matk':
      return 35 + Math.floor(currentVal * 4.5);
    case 'def':
      return 40 + Math.floor(currentVal * 5.0);
    case 'spd':
      return 40 + Math.floor(currentVal * 4.0);
    case 'hp':
      return 35 + Math.floor(currentVal * 1.6);
    case 'mp':
      return 30 + Math.floor(currentVal * 2.2);
    default:
      return 40 + Math.floor(currentVal * 3);
  }
}

// Hero Level overall EXP threshold (scales with hero level)
export function getHeroLevelExpThreshold(level: number = 1): number {
  return 30 + level * 20;
}

// Monster level-scaled EXP reward (Bosses give substantially more EXP!)
export function calculateMonsterExp(enemy: { level?: number; boss?: boolean }, isKiller: boolean = false): number {
  const monsterLevel = Math.max(1, enemy.level || 1);
  let baseExp: number;
  if (enemy.boss) {
    // Bosses yield massive EXP bonus: 60 + level * 28
    baseExp = 60 + monsterLevel * 28;
  } else {
    // Normal monsters scale directly with their floor level: 14 + level * 7
    baseExp = 14 + monsterLevel * 7;
  }
  return Math.round(baseExp * (isKiller ? 1.4 : 1.0));
}

// Legacy static fallback for any direct reference
export const STAT_EXP_THRESHOLDS = {
  atk: 45,
  matk: 40,
  def: 45,
  spd: 55,
  hp: 40,
  mp: 35,
};

export const WEAPON_XP_PER_RANK = 50;
export const WEAPON_XP_PER_HIT = 12;

export const SLOT_NAMES: Record<string, string> = {
  weapon: 'Vũ khí',
  shield: 'Khiên bảo vệ',
  armor: 'Áo giáp / Áo choàng',
  ring: 'Nhẫn bảo hộ',
};

// Clear, unabbreviated Vietnamese stat labels for weapon, gear, and character stats
export const FULL_STAT_LABELS: Record<string, string> = {
  atk: 'Công Kích (Sức Mạnh Vật Lý)',
  matk: 'Công Phép Thuật (Ma Lực)',
  def: 'Giáp Phòng Thủ (Chống Đỡ)',
  spd: 'Tốc Độ Phản Xạ (Đi Trước)',
  hp: 'Sinh Mệnh (Máu Tối Đa)',
  mp: 'Năng Lượng (Nội Lực MP)',
  range: 'Tầm Đánh Xa (Số Ô)',
  move: 'Bước Di Chuyển (Ô/Lượt)',
  thorns: 'Phản Sát Thương Gai',
  critRate: 'Tỉ Lệ Đòn Bạo Kích',
  lifesteal: 'Hút Máu Sinh Mệnh',
  hpPct: '% Tăng Sinh Mệnh (Máu)',
  atkPct: '% Tăng Công Kích',
  matkPct: '% Tăng Phép Thuật',
};

// Helper to format any item stat into clear Vietnamese without abbreviations
export function formatFullStatText(key: string, value: number): { label: string; valueText: string; isNegative: boolean } {
  const label = FULL_STAT_LABELS[key] || key.toUpperCase();
  const num = Number(value) || 0;
  const isNegative = num < 0;
  let valueText = '';

  if (key === 'thorns' || key === 'critRate' || key === 'lifesteal' || key.endsWith('Pct')) {
    valueText = `${num > 0 ? '+' : ''}${Math.round(num * 100)}%`;
  } else {
    valueText = `${num > 0 ? '+' : ''}${num}`;
  }

  return { label, valueText, isNegative };
}

export const WEAPON_FAMILIES: Record<WeaponFamily, { label: string; stats: Record<string, number>; skillName: string; skillDesc: string; mpCost: number }> = {
  sword: {
    label: 'Kiếm dài',
    stats: { atk: 2, spd: 1 },
    skillName: 'Kiếm Khí Trảm',
    skillDesc: 'Chém luồng kiếm khí gây 150% sát thương và Đẩy Lùi mục tiêu 1-2 ô va tường gây Choáng.',
    mpCost: 4,
  },
  axe: {
    label: 'Rìu chiến',
    stats: { atk: 3, hp: 3 },
    skillName: 'Cuồng Lực Phách',
    skillDesc: 'Bổ mạnh phá vỡ 30% giáp và Đẩy Lùi mục tiêu 1-2 ô va tường gây Choáng, Vỡ Vụn quái đóng băng.',
    mpCost: 4,
  },
  hammer: {
    label: 'Búa tạ',
    stats: { atk: 3, def: 2 },
    skillName: 'Chấn Địa Kích',
    skillDesc: 'Nện búa nặng Đẩy Lùi mục tiêu va tường gây Choáng, kích hoạt Vỡ Vụn (x2 dmg) trên quái đóng băng!',
    mpCost: 4,
  },
  dagger: {
    label: 'Dao găm',
    stats: { atk: 1, spd: 3 },
    skillName: 'Tất Sát Nhất Kích',
    skillDesc: 'Đâm hiểm với 55% tỉ lệ Bạo Kích xé toạc sinh mệnh.',
    mpCost: 4,
  },
  spear: {
    label: 'Thương dài',
    stats: { atk: 2, def: 1 },
    skillName: 'Thương Xuyên Vân',
    skillDesc: 'Đâm tầm xa 2 ô xuyên song sắt và Đẩy Lùi mục tiêu 1-2 ô va tường gây Choáng.',
    mpCost: 4,
  },
  bow: {
    label: 'Cung dài',
    stats: { atk: 2, spd: 1 },
    skillName: 'Tiễn Chấn Động',
    skillDesc: 'Bắn tên chấn động tầm xa 3 ô, Đẩy Lùi mục tiêu 1-2 ô va tường hoặc va thùng thuốc nổ gây Choáng.',
    mpCost: 4,
  },
  crossbow: {
    label: 'Nỏ kích',
    stats: { atk: 3 },
    skillName: 'Phá Giáp Tiễn',
    skillDesc: 'Bắn mũi tên nỏ nặng đẩy lùi quái vật 1-2 ô và phá giáp.',
    mpCost: 4,
  },
  staff: {
    label: 'Trượng ma thuật',
    stats: { matk: 3, mp: 3 },
    skillName: 'Hỏa Cầu Ma Thuật',
    skillDesc: 'Phóng hỏa cầu thiêu đốt, kích nổ Thùng thuốc nổ và thiêu cháy các vệt dầu lân cận.',
    mpCost: 5,
  },
  tome: {
    label: 'Sách cổ phù chú',
    stats: { matk: 3, mp: 3 },
    skillName: 'Băng Sương Phù Chú',
    skillDesc: 'Triệu hồi bão tuyết đóng băng kẻ địch (Freeze). Khi bị đập búa/sét sẽ kích hoạt Vỡ Vụn (x2 dmg)!',
    mpCost: 5,
  },
  bell: {
    label: 'Chuông thánh',
    stats: { matk: 2, hp: 4 },
    skillName: 'Thánh Ca Bình Minh',
    skillDesc: 'Hồi phục lượng máu lớn cho đồng đội bị thương nặng nhất.',
    mpCost: 5,
  },
};

export const RARITY_COLORS = ['#94a3b8', '#22c55e', '#38bdf8', '#c084fc', '#f59e0b', '#f43f5e', '#06b6d4'];
export const RARITY_NAMES = ['Phổ thông', 'Tinh xảo', 'Hiếm', 'Sử thi', 'Huyền thoại', 'Thần thoại', 'Khởi nguyên'];

// Pools for generating unique random adventurers
export const ADVENTURER_NAMES = [
  'Bảo', 'Đạt', 'Linh', 'Miên', 'An', 'Sơn', 'Khánh', 'Nguyệt',
  'Dũng', 'Phong', 'Hải', 'Tuấn', 'Hà', 'Vy', 'Băng', 'Minh',
  'Triết', 'Hoàng', 'Kiên', 'Lam', 'Quang', 'Hậu', 'Trực', 'Uyên',
];

export const ADVENTURER_TITLES = [
  'Kẻ Săn Đêm', 'Thợ Săn Hầm Ngục', 'Chiến Binh Tự Do', 'Kẻ Giữ Đèn',
  'Ẩn Sĩ Sa Mạc', 'Lính Tiên Phong', 'Dạ Hành Giả', 'Kẻ Lang Thang',
  'Thuật Sĩ Hoang Mạc', 'Hộ Vệ Tự Nhiên', 'Kẻ Thách Thức', 'Kẻ Độc Hành',
];

export const PASSIVE_TRAITS = [
  {
    name: 'Kiếm Ý Cuồng Đao',
    desc: 'Mỗi đòn đánh trúng tích lũy 1 tầng Kiếm Ý (+1 ATK, tối đa 5 tầng); mục tiêu dưới 40% HP chịu thêm 35% sát thương.',
  },
  {
    name: 'Vách Đá Kiên Cố',
    desc: 'Giảm 20% mọi sát thương nhận vào; đứng cạnh đồng đội giúp hứng đỡ 4 sát thương cho họ.',
  },
  {
    name: 'Mắt Ưng Viễn Xạ',
    desc: 'Tấn công từ cự ly xa (≥3 ô) tăng 35% tỉ lệ Bạo Kích; có thể ngắm bắn xuyên qua song sắt.',
  },
  {
    name: 'Cộng Hưởng Ma Lực',
    desc: 'Mỗi đòn tấn công hồi 1 MP và thiêu đốt mục tiêu; tăng 15% uy lực ma pháp.',
  },
  {
    name: 'Hào Quang Ban Phước',
    desc: 'Đầu mỗi vòng tự động tỏa hào quang hồi 4 HP cho đồng đội có tỉ lệ máu thấp nhất.',
  },
  {
    name: 'Tốc Ảnh Né Tránh',
    desc: 'Tăng 3 Tốc độ (SPD); có 20% tỉ lệ hoàn toàn né tránh đòn đánh của kẻ địch.',
  },
  {
    name: 'Khát Máu Chiến Binh',
    desc: 'Khi tiêu diệt bất kỳ kẻ địch nào, lập tức hồi phục 25% lượng HP tối đa.',
  },
  {
    name: 'Thiết Cốt Bất Hoại',
    desc: 'Tự động nhận 2 điểm Giáp chắn mỗi khi bắt đầu lượt hành động mới.',
  },
];

export const SKIN_TONES = ['#fed7aa', '#fde047', '#fbcfe8', '#e2e8f0', '#d6d3d1', '#f5d0b0', '#c29b7a'];
export const HAIR_COLORS = ['#1e293b', '#7c2d12', '#b45309', '#475569', '#fbbf24', '#991b1b', '#38bdf8', '#a855f7'];
export const HAIR_STYLES: HairStyle[] = ['short', 'spiky', 'long', 'ponytail', 'bald'];
export const CLOAK_COLORS = ['#d97706', '#64748b', '#10b981', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#14532d'];
export const GLYPHS = ['⚔', '🗡', '🛡', '🏹', '✦', '☄', '⚜', '⚡', '👁', '🔥', '☽', '◈'];

// Random adventurer generator (Classless!)
export function generateRandomAdventurer(presetId?: string, forceName?: string): Unit {
  const name = forceName || ADVENTURER_NAMES[Math.floor(Math.random() * ADVENTURER_NAMES.length)];
  const title = ADVENTURER_TITLES[Math.floor(Math.random() * ADVENTURER_TITLES.length)];
  const passive = PASSIVE_TRAITS[Math.floor(Math.random() * PASSIVE_TRAITS.length)];
  const skinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
  const hairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
  const cloakColor = CLOAK_COLORS[Math.floor(Math.random() * CLOAK_COLORS.length)];
  const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

  // Randomized base stat roll spreads
  // Base HP: 32-52, MP: 8-24, ATK: 6-12, MATK: 2-12, DEF: 2-6, SPD: 9-18
  const baseHp = 32 + Math.floor(Math.random() * 20);
  const baseMp = 8 + Math.floor(Math.random() * 16);
  const baseAtk = 6 + Math.floor(Math.random() * 7);
  const baseMatk = 2 + Math.floor(Math.random() * 10);
  const baseDef = 2 + Math.floor(Math.random() * 5);
  const baseSpd = 9 + Math.floor(Math.random() * 10);

  return {
    id: presetId || `hero-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    title,
    role: title.toUpperCase(),
    kind: 'hero',
    glyph,
    color: cloakColor,
    skinTone,
    hairColor,
    hairStyle,
    cloakColor,
    x: 1,
    y: 2,
    hp: baseHp,
    maxHp: baseHp,
    mp: baseMp,
    maxMp: baseMp,
    atk: baseAtk,
    matk: baseMatk,
    def: baseDef,
    spd: baseSpd,
    range: 1,
    move: 3,
    level: 1,
    exp: 0,
    acted: false,
    moved: false,
    guard: 0,
    species: 'human',
    passiveName: passive.name,
    passiveDesc: passive.desc,
    actionExp: { atk: 0, matk: 0, def: 0, spd: 0, hp: 0, mp: 0 },
    weaponMastery: {},
  };
}

// Default initial starter roster (can be rerolled anytime!)
export const INITIAL_HEROES: Unit[] = [
  generateRandomAdventurer('hero-1', 'Bảo'),
  generateRandomAdventurer('hero-2', 'Đạt'),
  generateRandomAdventurer('hero-3', 'Linh'),
  generateRandomAdventurer('hero-4', 'Miên'),
  generateRandomAdventurer('hero-5', 'An'),
];

// Universal Gear Catalog: Any adventurer can equip any item!
export const GEAR_CATALOG: GearTemplate[] = [
  // === WEAPONS ===
  // Standard & Agile Swords
  { name: 'Kiếm Rèn Sắt', type: 'weapon', slot: 'weapon', family: 'sword', icon: '⚔', stats: { atk: 2, spd: 1 }, description: 'Thanh kiếm thép sắc bén cân bằng giữa tốc độ và công lực.' },
  { name: 'Đại Kiếm Hoàng Kim', type: 'weapon', slot: 'weapon', family: 'sword', icon: '🗡', stats: { atk: 5, spd: 1, hp: 4 }, description: 'Thanh đại kiếm nạm vàng nặng trĩu uy lực trảm sát.' },
  {
    name: 'Long Thần Ma Kiếm',
    type: 'weapon',
    slot: 'weapon',
    family: 'sword',
    icon: '🐉',
    stats: { atk: 8, matk: 6, spd: 2, critRate: 0.2 },
    description: 'Thần kiếm đúc từ nanh cổ long, kích phát Long Hồn thiêu rụi quân thù.',
    specialSkill: 'transform_dragon',
    specialSkillName: 'Hóa Thân Long Hồn',
    specialSkillDesc: 'Hóa rồng rực cháy: Tăng tầm đánh +2 ô, đòn đánh lan thiêu đốt toàn bộ vùng mục tiêu trong 3 lượt!',
    specialSkillMp: 6,
  },
  {
    name: 'Thần Kiếm Muramasa',
    type: 'weapon',
    slot: 'weapon',
    family: 'sword',
    icon: '🩸',
    stats: { atk: 7, spd: 3, critRate: 0.35, lifesteal: 0.3 },
    description: 'Yêu kiếm khát máu, đòn chém hiểm hóc bạo kích 250% sát thương và hút máu phục hồi sinh lực.',
    specialSkill: 'crit_burst',
    specialSkillName: 'Trảm Kích Tử Thần',
    specialSkillDesc: 'Chém đòn chí mạng bùng nổ 250% sát thương và hút 40% lượng sát thương thành máu!',
    specialSkillMp: 4,
  },

  // Heavy Axes & Hammers
  { name: 'Rìu Phá Trận', type: 'weapon', slot: 'weapon', family: 'axe', icon: '🪓', stats: { atk: 4, hp: 3, spd: -1 }, description: 'Lưỡi rìu chiến xé toạc giáp sắt kẻ địch.' },
  {
    name: 'Huyết Nguyệt Cuồng Rìu',
    type: 'weapon',
    slot: 'weapon',
    family: 'axe',
    icon: '🐺',
    stats: { atk: 7, hp: 10, spd: 1, lifesteal: 0.25 },
    description: 'Rìu cổ phong ấn linh hồn Ma Sói, cho phép người sử dụng biến hình cuồng nộ.',
    specialSkill: 'transform_werewolf',
    specialSkillName: 'Hóa Thân Ma Sói',
    specialSkillDesc: 'Biến thành Ma Sói hung tợn: +10 Sức mạnh, +4 Tốc độ, 40% Hút Máu trong 3 lượt!',
    specialSkillMp: 5,
  },
  { name: 'Búa Tạ Hắc Thép', type: 'weapon', slot: 'weapon', family: 'hammer', icon: '🔨', stats: { atk: 4, def: 2, spd: -2 }, description: 'Đầu búa khối sắt đặc đập choáng và phá vỡ thế trận.' },
  {
    name: 'Lôi Thần Trùy Mjolnir',
    type: 'weapon',
    slot: 'weapon',
    family: 'hammer',
    icon: '⚡',
    stats: { atk: 6, matk: 6, def: 3 },
    description: 'Búa sấm sét cổ đại giáng sấm sét chuỗi liên hoàn gây choáng nhiều kẻ địch.',
    specialSkill: 'aoe_chain_lightning',
    specialSkillName: 'Bão Sét Liên Hoàn',
    specialSkillDesc: 'Phóng luồng sét giật lan qua tất cả kẻ địch lân cận, gây sát thương phép và choáng 1 lượt!',
    specialSkillMp: 5,
  },
  {
    name: 'Cự Phách Nứt Đất',
    type: 'weapon',
    slot: 'weapon',
    family: 'hammer',
    icon: '🌋',
    stats: { atk: 7, def: 4, hp: 8, spd: -2 },
    description: 'Đại chùy chấn động long trời lở đất, tạo cơn địa chấn hình chữ thập diện rộng.',
    specialSkill: 'aoe_earthquake',
    specialSkillName: 'Địa Chấn Nứt Đất',
    specialSkillDesc: 'Nện búa xuống đất gây chấn động nứt nẻ toàn bộ ô chữ thập diện rộng quanh tâm nổ!',
    specialSkillMp: 5,
  },

  // Staves, Tomes & Bells (Magic & Summoning)
  { name: 'Trượng Tinh Vân Cổ', type: 'weapon', slot: 'weapon', family: 'staff', icon: '🪄', stats: { matk: 4, mp: 4 }, description: 'Cây trượng gắn ngọc lưu ly dẫn dòng ma pháp thuần khiết.' },
  {
    name: 'Trượng Hỏa Ngục Ma Thần',
    type: 'weapon',
    slot: 'weapon',
    family: 'staff',
    icon: '☄️',
    stats: { matk: 9, mp: 8 },
    description: 'Trượng cổ triệu gọi cơn mưa thiên thạch thiêu rụi cả một vùng đất.',
    specialSkill: 'aoe_meteor',
    specialSkillName: 'Mưa Thiên Thạch',
    specialSkillDesc: 'Giáng cơn mưa thiên thạch rực lửa xuống vùng 3x3 gây sát thương diện rộng và thiêu đốt mặt đất!',
    specialSkillMp: 6,
  },
  {
    name: 'Trượng Gọi Hồn Sói Băng',
    type: 'weapon',
    slot: 'weapon',
    family: 'staff',
    icon: '🐾',
    stats: { matk: 6, mp: 6, hp: 4 },
    description: 'Quyền trượng ngưng kết linh hồn Sói Tuyết phương bắc cùng sát cánh trong trận địa.',
    specialSkill: 'summon_wolf',
    specialSkillName: 'Triệu Hồi Sói Băng',
    specialSkillDesc: 'Triệu hồi một chú Sói Băng tuyết (35 HP, cắn càn quét, tốc độ cao) cùng chiến đấu trong 4 lượt!',
    specialSkillMp: 5,
  },
  {
    name: 'Thạch Thần Pháp Trượng',
    type: 'weapon',
    slot: 'weapon',
    family: 'staff',
    icon: '🗿',
    stats: { matk: 5, def: 4, hp: 12 },
    description: 'Quyền trượng địa tầng hiệu triệu Thạch Golem phòng ngự bất hoại.',
    specialSkill: 'summon_golem',
    specialSkillName: 'Triệu Hồi Thạch Golem',
    specialSkillDesc: 'Triệu hồi Vệ Sĩ Đá Thạch Golem (55 HP, 8 Giáp, khiêu khích đỡ đòn cho cả đội)!',
    specialSkillMp: 6,
  },
  {
    name: 'Xà Nhãn Hắc Trượng Medusa',
    type: 'weapon',
    slot: 'weapon',
    family: 'staff',
    icon: '👁',
    stats: { matk: 7, mp: 5, def: 2 },
    description: 'Trượng cổ phong ấn mắt ma Medusa có khả năng hóa đá đối thủ tức khắc.',
    specialSkill: 'petrify_strike',
    specialSkillName: 'Tia Sáng Hóa Đá',
    specialSkillDesc: 'Phóng tia ánh sáng Medusa biến kẻ địch thành tượng đá trong 2 lượt (tăng giáp nhưng bất động hoàn toàn)!',
    specialSkillMp: 4,
  },
  { name: 'Quyển Trục Bí Thuật', type: 'weapon', slot: 'weapon', family: 'tome', icon: '📖', stats: { matk: 4, mp: 5 }, description: 'Sách phù chú cổ chứa đựng những phong ấn bí truyền.' },
  { name: 'Chuông Nguyện Trầm Hương', type: 'weapon', slot: 'weapon', family: 'bell', icon: '🔔', stats: { matk: 3, hp: 6, mp: 3 }, description: 'Chuông thánh phát ra sóng âm thanh tẩy và hồi sinh sinh lực.' },

  // Bows & Daggers
  { name: 'Dao Găm Bóng Đêm', type: 'weapon', slot: 'weapon', family: 'dagger', icon: '🗡', stats: { atk: 3, spd: 4, critRate: 0.2 }, description: 'Lưỡi đoản đao thoăn thoắt chém chí mạng trong chớp mắt.' },
  { name: 'Thương Sắt Dài', type: 'weapon', slot: 'weapon', family: 'spear', icon: '🔱', stats: { atk: 3, def: 1, range: 1 }, description: 'Ngọn thương dài đâm tới tầm xa 2 ô và chọc xuyên song sắt.' },
  { name: 'Cung Tầm Xa', type: 'weapon', slot: 'weapon', family: 'bow', icon: '🏹', stats: { atk: 3, spd: 1, range: 2 }, description: 'Cung gỗ uốn cong với dây gân thú bắn tầm xa 3 ô.' },
  {
    name: 'Hỏa Tinh Cung Thần',
    type: 'weapon',
    slot: 'weapon',
    family: 'bow',
    icon: '🔥',
    stats: { atk: 6, matk: 4, spd: 2, range: 2 },
    description: 'Cánh cung dệt từ lông chim Phượng Hoàng, triệu gọi Tinh Linh Lửa hỗ trợ bắn tỉa.',
    specialSkill: 'summon_fire_sprite',
    specialSkillName: 'Triệu Hồi Tinh Linh Lửa',
    specialSkillDesc: 'Triệu hồi Tinh Linh Lửa bay lơ lửng ngắm bắn cầu lửa tầm xa 3 ô gây thiêu đốt kẻ thù!',
    specialSkillMp: 5,
  },
  { name: 'Nỏ Nặng Phá Thành', type: 'weapon', slot: 'weapon', family: 'crossbow', icon: '🏹', stats: { atk: 5, spd: -1, range: 2 }, description: 'Nỏ cơ khí lò xo kéo thép công phá cực mạnh.' },

  // === SHIELDS (Defense, Thorns & Immovable Bastion) ===
  { name: 'Khiên Tròn Gỗ Bọc Đồng', type: 'shield', slot: 'shield', shieldFamily: 'buckler', icon: '🛡', stats: { def: 2, hp: 4 }, description: 'Khiên nhỏ gọn nhẹ không làm giảm độ linh hoạt.' },
  { name: 'Khiên Sắt Hiệp Sĩ', type: 'shield', slot: 'shield', shieldFamily: 'iron', icon: '🛡', stats: { def: 4, hp: 8 }, description: 'Tấm khiên thép tam giác khắc hoa văn phòng hộ kiên cố.' },
  {
    name: 'Khiên Thần Quy Bất Động',
    type: 'shield',
    slot: 'shield',
    shieldFamily: 'aegis',
    icon: '🐢',
    stats: { def: 8, hp: 20, thorns: 0.35, spd: -2 },
    description: 'Khiên mai rùa huyền thoại, có thể cắm xuống đất tạo thành Pháo Đài Thiết Thạch bất khả xâm phạm.',
    specialSkill: 'bastion_stance',
    specialSkillName: 'Pháo Đài Thiết Thạch',
    specialSkillDesc: 'Vào thế thủ bất động: Tăng ngay +20 Giáp, giảm 50% sát thương và phản 40% sát thương, nhưng bị BẤT ĐỘNG (Move=0) trong 2 lượt!',
    specialSkillMp: 4,
  },
  {
    name: 'Khiên Gai Quỷ Dữ',
    type: 'shield',
    slot: 'shield',
    shieldFamily: 'iron',
    icon: '🦔',
    stats: { def: 6, hp: 14, thorns: 0.4 },
    description: 'Tấm khiên thép gắn gai rỉ máu, tự động phản lại 40% sát thương khi bị tấn công cận chiến.',
  },
  { name: 'Khiên Thánh Thần Aegis', type: 'shield', slot: 'shield', shieldFamily: 'aegis', icon: '🛡', stats: { def: 7, hp: 18, spd: -1 }, description: 'Tường thành ánh sáng huyền thoại che chắn trước mọi đòn hiểm.' },

  // === ARMORS (Defense, Juggernaut & Thorns) ===
  { name: 'Áo Da Thợ Săn', type: 'armor', slot: 'armor', armorFamily: 'leather', icon: '🥋', stats: { def: 2, spd: 2, hp: 6 }, description: 'Áo da thuộc bền chắc giúp di chuyển thoăn thoắt.' },
  { name: 'Áo Giáp Xích Sắt', type: 'armor', slot: 'armor', armorFamily: 'iron', icon: '🦺', stats: { def: 4, hp: 10 }, description: 'Giáp lưới thép gia cố bảo vệ lồng ngực và khớp xương.' },
  {
    name: 'Giáp Gai Hắc Cốt',
    type: 'armor',
    slot: 'armor',
    armorFamily: 'iron',
    icon: '🦴',
    stats: { def: 6, hp: 18, thorns: 0.45 },
    description: 'Giáp rèn từ xương quái vật gai góc nhọn hoắt, phản 45% mọi sát thương nhận vào kẻ tấn công!',
  },
  {
    name: 'Bản Giáp Khổng Thần Titan',
    type: 'armor',
    slot: 'armor',
    armorFamily: 'iron',
    icon: '🤖',
    stats: { def: 9, hp: 28, spd: -3, thorns: 0.3 },
    description: 'Bộ đại giáp Titan cổ đại cho phép người mặc hóa thân thành Khổng Nhân Thiết Giáp.',
    specialSkill: 'transform_juggernaut',
    specialSkillName: 'Hóa Thân Titan',
    specialSkillDesc: 'Hóa thành Khổng Lồ Bọc Thép: +18 Giáp, phản 50% sát thương, miễn nhiễm choáng và hiệu ứng xấu trong 3 lượt!',
    specialSkillMp: 5,
  },
  { name: 'Áo Choàng Tinh Tú', type: 'armor', slot: 'armor', armorFamily: 'robe', icon: '👘', stats: { def: 2, mp: 8, matk: 3 }, description: 'Áo choàng nhung dệt sợi bạc hấp thụ dòng chảy ma lực tự nhiên.' },
  { name: 'Long Lân Hoàng Kim Giáp', type: 'armor', slot: 'armor', armorFamily: 'gold', icon: '👑', stats: { def: 8, hp: 25, matk: 3, thorns: 0.2 }, description: 'Chiến giáp vảy rồng dát vàng tỏa ánh sáng uy nghiêm.' },

  // === RINGS & ARTIFACTS ===
  { name: 'Nhẫn Sinh Lực', type: 'ring', slot: 'ring', icon: '💍', stats: { hpPct: 0.1, hp: 5 }, description: 'Viên ngọc hồng ngọc bồi dưỡng huyết khí dồi dào.' },
  { name: 'Nhẫn Cuồng Lực', type: 'ring', slot: 'ring', icon: '💍', stats: { atkPct: 0.1, atk: 2 }, description: 'Viên đá mã não kích phát uy lực đòn đánh.' },
  {
    name: 'Nhẫn Thạch Nhãn Medusa',
    type: 'ring',
    slot: 'ring',
    icon: '👁️',
    stats: { matk: 3, def: 3 },
    description: 'Chiếc nhẫn mắt ma xà tộc, đòn đánh có 30% tỉ lệ hóa đá kẻ thù khiến chúng bất động!',
  },
  {
    name: 'Nhẫn Gai Huyết Ngục',
    type: 'ring',
    slot: 'ring',
    icon: '🦔',
    stats: { hp: 12, thorns: 0.3 },
    description: 'Vòng nhẫn gai nhọn tẩm máu quỷ, phản đòn 30% lượng sát thương nhận vào.',
  },
  {
    name: 'Huyết Ngọc Khát Máu',
    type: 'ring',
    slot: 'ring',
    icon: '🩸',
    stats: { atk: 3, lifesteal: 0.3 },
    description: 'Viên huyết ngọc hút máu, hồi phục 30% sát thương gây ra thành sinh mệnh.',
  },
  {
    name: 'Nhẫn Hư Không Vạn Quy',
    type: 'ring',
    slot: 'ring',
    icon: '🌌',
    stats: { matk: 5, mp: 6 },
    description: 'Nhẫn lỗ đen hư không, có khả năng hút toàn bộ quái vật xung quanh về một tâm điểm.',
    specialSkill: 'aoe_void_vortex',
    specialSkillName: 'Vòng Xoáy Hư Không',
    specialSkillDesc: 'Tạo hố đen hút tất cả quái vật trong bán kính 2 ô về tâm và gây nổ sát thương phép!',
    specialSkillMp: 5,
  },
  { name: 'Nhẫn Phong Tốc', type: 'ring', slot: 'ring', icon: '💍', stats: { spd: 3 }, description: 'Gió nhẹ bao bọc bước chân giúp hành động trước đối thủ.' },
  // === TRANG BỊ ĐÁNH ĐỔI (CURSED & PACT GEAR: HIGH RISK - HIGH REWARD) ===
  {
    name: 'Huyết Kiếm Cuồng Bạo',
    type: 'weapon',
    slot: 'weapon',
    family: 'sword',
    icon: '🩸',
    stats: { atk: 12, critRate: 0.25, hpPct: -0.22 },
    isTradeOff: true,
    tradeOffPros: '+12 Công kích, +25% Bạo kích',
    tradeOffCons: '-22% Lượng Máu tối đa',
    description: 'Yêu kiếm phong ấn hiến tế máu tươi để đổi lấy uy lực trảm kích cuồng loạn.',
    specialSkill: 'crit_burst',
    specialSkillName: 'Trảm Kích Tử Thần',
    specialSkillDesc: 'Chém đòn chí mạng bùng nổ 250% sát thương và hút 40% lượng sát thương thành máu!',
    specialSkillMp: 4,
  },
  {
    name: 'Trọng Giáp Hắc Thạch',
    type: 'armor',
    slot: 'armor',
    armorFamily: 'iron',
    icon: '🪨',
    stats: { def: 14, hp: 20, spd: -3, move: -1 },
    isTradeOff: true,
    tradeOffPros: '+14 Giáp cứng, +20 Máu sinh mệnh',
    tradeOffCons: '-3 Tốc độ phản xạ, -1 Ô di chuyển',
    description: 'Bản giáp đá hắc thạch nặng như núi, chống chịu kinh hoàng nhưng biến người mặc thành khối đá chậm chạp.',
  },
  {
    name: 'Hắc Trượng Hư Vô',
    type: 'weapon',
    slot: 'weapon',
    family: 'staff',
    icon: '🔮',
    stats: { matk: 14, mp: 12, def: -8 },
    isTradeOff: true,
    tradeOffPros: '+14 Ma công uy lực, +12 Ma lực tối đa',
    tradeOffCons: '-8 Giáp phòng hộ (cực kỳ dễ vỡ)',
    description: 'Trượng cổ hư vô khuếch đại ma pháp đến cực hạn, nhưng tước bỏ hoàn toàn lớp phòng ngự cơ thể.',
    specialSkill: 'aoe_void_vortex',
    specialSkillName: 'Vòng Xoáy Hư Không',
    specialSkillDesc: 'Tạo hố đen hút quái vật trong bán kính 2 ô và gây nổ sát thương diện rộng!',
    specialSkillMp: 5,
  },
  {
    name: 'Nhẫn Liều Mạng',
    type: 'ring',
    slot: 'ring',
    icon: '💀',
    stats: { critRate: 0.35, atk: 5, def: -6 },
    isTradeOff: true,
    tradeOffPros: '+35% Tỉ lệ Bạo kích, +5 Công kích',
    tradeOffCons: '-6 Giáp (nhận nhiều sát thương hơn)',
    description: 'Vòng nhẫn của những kẻ đánh cược mạng sống, bỏ qua phòng thủ để truy cầu đòn tất sát.',
  },
  {
    name: 'Mặt Nạ Huyết Tế',
    type: 'armor',
    slot: 'armor',
    armorFamily: 'leather',
    icon: '🎭',
    stats: { lifesteal: 0.35, atk: 7, hpPct: -0.18, matk: -5 },
    isTradeOff: true,
    tradeOffPros: '+35% Hút máu, +7 Công kích vật lý',
    tradeOffCons: '-18% Máu tối đa, -5 Ma công',
    description: 'Mặt nạ tế linh quỷ dữ, càng chém càng hút sinh khí của kẻ thù nhưng hao mòn tuổi thọ bản thân.',
  },
  {
    name: 'Hộ Phù Siêu Tốc',
    type: 'ring',
    slot: 'ring',
    icon: '⚡',
    stats: { spd: 7, move: 1, atk: -5, matk: -5 },
    isTradeOff: true,
    tradeOffPros: '+7 Tốc độ SPD (đi trước), +1 Ô di chuyển',
    tradeOffCons: '-5 Công kích và -5 Ma công',
    description: 'Bùa phong linh bay bổng như chim ưng, di chuyển thần tốc nhưng đòn đánh thiếu uy lực sát thương.',
  },
  {
    name: 'Khiên Gai Hắc Ngục',
    type: 'shield',
    slot: 'shield',
    shieldFamily: 'iron',
    icon: '🦔',
    stats: { def: 12, thorns: 0.5, spd: -3 },
    isTradeOff: true,
    tradeOffPros: '+12 Giáp, Phản 50% toàn bộ sát thương cận chiến',
    tradeOffCons: '-3 Tốc độ phản xạ',
    description: 'Khiên sắt đúc đầy gai nhọn độc, kẻ nào dám đánh trúng đều phải trả giá bằng nửa lượng máu đòn đánh.',
  },
  {
    name: 'Áo Choàng Cuồng Ma',
    type: 'armor',
    slot: 'armor',
    armorFamily: 'robe',
    icon: '🥻',
    stats: { matk: 12, matkPct: 0.25, def: -10 },
    isTradeOff: true,
    tradeOffPros: '+12 Ma công, +25% Uy lực toàn bộ phép thuật',
    tradeOffCons: '-10 Giáp vật lý (dễ gục ngã trước cận chiến)',
    description: 'Tấm áo choàng tà thuật biến phù thủy thành khẩu đại bác ma pháp nhưng mỏng manh như cánh ve.',
  },
  {
    name: 'Thần Nỏ Liều Mạng',
    type: 'weapon',
    slot: 'weapon',
    family: 'crossbow',
    icon: '🏹',
    stats: { atk: 13, critRate: 0.3, range: 1, hp: -10 },
    isTradeOff: true,
    tradeOffPros: '+13 Công cực mạnh, +30% Bạo kích',
    tradeOffCons: '-1 Tầm bắn (chỉ bắn 2 ô), -10 Máu tối đa',
    description: 'Nỏ hạng nặng gắn dây thép lò xo cực căng, bắn gần công phá xuyên giáp tàn khốc.',
  },
];

export const ENEMY_CATALOG = [
  {
    id: 'beholder',
    name: 'Nhãn Ma Vực Thẳm',
    role: 'QUÁI BẮN TIA PHÉP & PHẢN MA',
    glyph: '👁',
    color: '#8b5cf6',
    hp: 42,
    atk: 12,
    matk: 15,
    def: 3,
    spd: 13,
    range: 3,
    move: 3,
    species: 'beholder' as const,
    ability: 'eye_ray',
    passiveName: 'Trường Phản Ma Thuật',
    passiveDesc: 'Kháng 40% sát thương phép; bay lơ lửng ngắm bắn tia phép xuyên qua song sắt, làm mù và suy yếu mục tiêu.',
  },
  {
    id: 'treant',
    name: 'Cổ Ngụ Mộc',
    role: 'QUÁI CẬN CHIẾN & DA VỎ SẮT',
    glyph: '🌲',
    color: '#15803d',
    hp: 65,
    atk: 12,
    def: 7,
    spd: 6,
    range: 1,
    move: 2,
    species: 'treant' as const,
    ability: 'entangle',
    passiveName: 'Rễ Cây Hấp Thụ',
    passiveDesc: 'Hồi 5 HP mỗi lượt; gai nhọn phản 4 sát thương cận chiến; rễ cây trói chân khiến mục tiêu bất động.',
  },
  {
    id: 'banshee',
    name: 'Dạ Oán Linh',
    role: 'QUÁI TÂM LINH & ĐOẠT HỒN MP',
    glyph: '👻',
    color: '#38bdf8',
    hp: 32,
    atk: 10,
    matk: 14,
    def: 2,
    spd: 17,
    range: 2,
    move: 3,
    species: 'banshee' as const,
    ability: 'wail',
    passiveName: 'Thân Thể Hư Vô & Tiếng Hú',
    passiveDesc: 'Có 30% né đòn; tiếng thét rùng rợn quét diện rộng gây sát thương phép và hút cạn 3 MP của đối thủ.',
  },
  {
    id: 'mimic',
    name: 'Rương Quái Răng Nhọn',
    role: 'QUÁI MA QUÁI NÚP BÓNG RƯƠNG',
    glyph: '📦',
    color: '#d97706',
    hp: 38,
    atk: 16,
    def: 4,
    spd: 12,
    range: 1,
    move: 2,
    species: 'mimic' as const,
    ability: 'mimic_bite',
    passiveName: 'Răng Sắc Bạo Kích',
    passiveDesc: 'Tỉ lệ bạo kích 45% xé toạc giáp; rơi lượng vàng lớn khi bị tiêu diệt.',
  },
  {
    id: 'kraken',
    name: 'Bạch Tuộc Vực Sâu',
    role: 'QUÁI XÚC TU TRÓI BUỘC & PHUN MỰC',
    glyph: '🐙',
    color: '#a855f7',
    hp: 45,
    atk: 12,
    def: 4,
    spd: 10,
    range: 2,
    move: 2,
    species: 'kraken' as const,
    ability: 'constrict',
    passiveName: 'Mực Đen Mù Mắt',
    passiveDesc: 'Quật xúc tu làm giảm 3 SPD và làm mù giảm 1 tầm đánh của đối thủ trong 2 lượt.',
  },
  {
    id: 'cerberus',
    name: 'Chó Săn Địa Ngục',
    role: 'QUÁI 3 ĐẦU LIÊN HOÀN CẮN',
    glyph: '🐕',
    color: '#ef4444',
    hp: 44,
    atk: 13,
    def: 4,
    spd: 16,
    range: 1,
    move: 3,
    species: 'cerberus' as const,
    ability: 'triple_bite',
    passiveName: 'Cuồng Nộ Huyết Tộc',
    passiveDesc: 'Đòn cắn 3 đầu dồn dập; khi dưới 50% HP kích hoạt Cuồng Nộ (+5 ATK, +3 SPD).',
  },
  {
    id: 'bird',
    name: 'Hắc Điểu Quỷ',
    role: 'QUÁI BAY LƯỢN & BÃO LÔNG VŨ',
    glyph: '🦅',
    color: '#06b6d4',
    hp: 34,
    atk: 11,
    def: 3,
    spd: 19,
    range: 2,
    move: 4,
    species: 'bird' as const,
    ability: 'feather_storm',
    passiveName: 'Không Kích Bay Cao',
    passiveDesc: 'Bay qua mọi hố sâu, nham thạch và song sắt; phóng bão lông vũ sắc nhọn.',
  },
  {
    id: 'slime',
    name: 'Bọc Axit Độc Biến',
    role: 'QUÁI TỰ HỒI SINH MÁU',
    glyph: '🟢',
    color: '#f87171',
    hp: 40,
    atk: 11,
    def: 2,
    spd: 8,
    range: 1,
    move: 2,
    species: 'slime' as const,
    ability: 'split',
    passiveName: 'Phân Tách Dẻo Dai',
    passiveDesc: 'Tự phục hồi 35% máu khi bị đánh trọng thương; đòn đánh lây nhiễm nọc độc.',
  },
  {
    id: 'brute',
    name: 'Giáp Thạch Tinh Thể',
    role: 'QUÁI ĐÁ PHÒNG THỦ CAO',
    glyph: '🗿',
    color: '#a8a29e',
    hp: 58,
    atk: 14,
    def: 8,
    spd: 7,
    range: 1,
    move: 2,
    species: 'golem' as const,
    ability: 'heavy',
    passiveName: 'Lớp Vỏ Cứng Cáp',
    passiveDesc: 'Phòng thủ cực cao, đòn búa đá nặng làm choáng và đẩy lùi mục tiêu.',
  },
  {
    id: 'ash-archer',
    name: 'Xạ Thủ Tro Tàn',
    role: 'QUÁI BẮN XA XUYÊN THÀNH',
    glyph: '🏹',
    color: '#facc15',
    hp: 35,
    atk: 13,
    def: 3,
    spd: 15,
    range: 3,
    move: 2,
    species: 'ash-archer' as const,
    ability: 'volley',
    passiveName: 'Mũi Tên Tro Lửa',
    passiveDesc: 'Bắn cung tầm xa 3 ô xuyên qua song sắt, gây bỏng cháy mục tiêu trong 2 lượt.',
  },
  {
    id: 'lich',
    name: 'Tử Linh Vu Yêu',
    role: 'QUÁI BẤT TỬ HỒI SINH & PHẢN MA PHÉP',
    glyph: '💀',
    color: '#c084fc',
    hp: 46,
    atk: 10,
    matk: 16,
    def: 4,
    spd: 11,
    range: 3,
    move: 2,
    species: 'lich' as const,
    ability: 'frost_rebirth',
    canRebirth: true,
    magicWard: true,
    passiveName: 'Hồn Bất Tử & Khiên Phản Phép',
    passiveDesc: 'Hồi sinh ngay lập tức 1 lần với 55% Máu và phát nổ bão tuyết; giảm 65% sát thương phép và phản 60% phép tầm xa!',
  },
  {
    id: 'ghost',
    name: 'Bóng Ma Hư Không',
    role: 'SÁT THỦ XUYÊN TƯỜNG ÁM SÁT PHÁP SƯ',
    glyph: '👻',
    color: '#38bdf8',
    hp: 36,
    atk: 15,
    matk: 8,
    def: 3,
    spd: 18,
    range: 1,
    move: 4,
    species: 'ghost' as const,
    ability: 'phase_strike',
    phasesWalls: true,
    passiveName: 'Thân Thể Xuyên Không Gian',
    passiveDesc: 'Bay xuyên qua mọi tường đá, vực thẳm và song sắt tiến thẳng truy sát pháp sư và xạ thủ ở tuyến sau!',
  },
  {
    id: 'shaman',
    name: 'Tù Trưởng Tế Tư',
    role: 'QUÁI TRỢ THỦ GÕ TRỐNG BUFF ĐỒNG MINH',
    glyph: '🥁',
    color: '#e11d48',
    hp: 52,
    atk: 9,
    matk: 13,
    def: 5,
    spd: 12,
    range: 2,
    move: 2,
    species: 'shaman' as const,
    ability: 'war_drums',
    shamanAura: true,
    passiveName: 'Tiếng Trống Chiến Thần',
    passiveDesc: 'Mỗi lượt gõ trống ban phước cho toàn bộ quái vật đồng minh xung quanh: +2 ATK, +2 DEF và hồi 6 HP!',
  },
];

export const BOSS_TEMPLATES = [
  {
    id: 'minochoco',
    name: 'MinoChoco',
    role: 'BOSS THẦN THOẠI XÀ LINH THƯỢNG CỔ',
    glyph: '🐍',
    color: '#10b981',
    hp: 210,
    atk: 18,
    def: 8,
    spd: 12,
    range: 1,
    move: 2,
    ability: 'minochoco',
    species: 'snake' as const,
    passiveName: 'Vảy Giáp Thượng Cổ & Nọc Độc Phản Hồi',
    passiveDesc: 'Miễn nhiễm choáng; phản 4 sát thương độc cho kẻ đánh cận chiến; xoay vần Vung Quanh (quét toàn diện), Tiếng Gầm (suy yếu toàn đội), Cắn Xé và Mưa Nọc Độc.',
  },
  {
    id: 'warden',
    name: 'Cai Ngục Hắc Thép',
    role: 'BOSS QUẢN NGỤC SONG SẮT',
    glyph: '⛓',
    color: '#f59e0b',
    hp: 220,
    atk: 19,
    def: 10,
    spd: 8,
    range: 1,
    move: 2,
    ability: 'warden',
    species: 'warden' as const,
    passiveName: 'Xích Sắt Giam Cầm & Thân Thép Khổng Lồ',
    passiveDesc: 'Quăng xích kéo tướng lại gần và gây Choáng; nện búa chữ thập chấn động; dựng song sắt phong tỏa và kích hoạt Giáp Thép Phản Hồi.',
  },
  {
    id: 'ignis',
    name: 'Long Thần Nham Thạch Ignis',
    role: 'BOSS HỎA LONG THƯỢNG CỔ',
    glyph: '🐉',
    color: '#ef4444',
    hp: 240,
    atk: 20,
    def: 9,
    spd: 11,
    range: 2,
    move: 2,
    ability: 'ignis',
    species: 'dragon' as const,
    passiveName: 'Hỏa Tức Cổ Đại & Nham Thạch Bất Diệt',
    passiveDesc: 'Thổi lửa hình nón thiêu cháy 3 ô; đập cánh đẩy lùi 2 ô va tường gây Choáng; gọi Mưa Thiên Thạch rơi tự do; gầm tiếng gầm thiêu đốt rút MP.',
  },
  {
    id: 'frost_lich',
    name: 'Cổ Vương Băng Giá FrostLich',
    role: 'BOSS BĂNG VƯƠNG TỬ LINH',
    glyph: '👑',
    color: '#38bdf8',
    hp: 195,
    atk: 14,
    matk: 22,
    def: 7,
    spd: 13,
    range: 3,
    move: 2,
    ability: 'frost_lich',
    species: 'lich' as const,
    passiveName: 'Băng Giáp Tái Sinh & Hàn Khí Cực Hạn',
    passiveDesc: 'Đóng băng tướng trong Mộ Băng (setup cho đập vỡ); bão tuyết làm chậm -4 SPD; phóng 2 ngọn Thương Băng xuyên thấu; phản 50% sát thương.',
  },
  {
    id: 'chimera',
    name: 'Cự Thú Ba Đầu Chimera',
    role: 'BOSS THẦN THÚ HỖN TẠP',
    glyph: '🦁',
    color: '#d97706',
    hp: 230,
    atk: 19,
    def: 8,
    spd: 14,
    range: 1,
    move: 3,
    ability: 'chimera',
    species: 'chimera' as const,
    passiveName: 'Tam Đầu Dã Tính & Nọc Độc Bọ Cạp',
    passiveDesc: 'Vồ sư tử gây Choáng 1 lượt; đuôi bọ cạp chích độc 4 lượt; đầu dê phun lửa quỷ; cuồng loạn cắn xé 3 đòn liên tiếp khi dưới 50% HP.',
  },
];

// Rich Procedural Biome Presets with Tactical Mechanics:
// iron_bars: impassable by foot, but ranged weapons/spells can shoot through!
// altar: standing on it grants +3 ATK/MATK and 3 HP regen!
// moss: +1 movement or slip!
// trap: hidden puncture spikes!
// lava: burning tiles!
// portal: instant teleportation!
// oil: flammable slick puddle!
// roomSize: 'compact' (small claustrophobic room) vs 'standard' vs 'large' (grand arena)
export interface BiomePreset {
  id: DungeonBiome;
  name: string;
  subtitle: string;
  lore: string;
  roomSize: 'compact' | 'standard' | 'large';
  walls: string[];
  terrain: [string, string][];
}

export const BIOME_PRESETS: BiomePreset[] = [
  {
    id: 'prison',
    name: 'Ngục Tối Song Sắt & Cùm Xích',
    subtitle: 'Nơi giam cầm những linh hồn cổ xưa với song sắt rỉ sét và những cặp mắt rình rập trong bóng tối',
    lore: 'Các ô song sắt ngăn bước đi nhưng cho phép cung thủ và thuật sĩ ngắm bắn xuyên qua. Vệt dầu loang có thể bốc cháy!',
    roomSize: 'standard',
    walls: ['4,1', '4,2', '4,5', '4,6', '7,1', '7,6', '2,4', '9,4'],
    terrain: [
      ['5,1', 'iron_bars'],
      ['5,2', 'iron_bars'],
      ['5,5', 'iron_bars'],
      ['5,6', 'iron_bars'],
      ['8,2', 'iron_bars'],
      ['8,5', 'iron_bars'],
      ['6,2', 'oil'],
      ['7,2', 'oil'],
      ['6,5', 'oil'],
      ['6,3', 'altar'],
      ['3,5', 'trap'],
      ['9,2', 'trap'],
      ['2,2', 'portal'],
      ['10,5', 'portal'],
    ],
  },
  {
    id: 'haunted_crypt',
    name: 'Hầm Mộ Cổ Hẹp & Chật Chội',
    subtitle: 'Căn phòng nhỏ hẹp với lối đi chỉ vừa 1 người, nơi cận chiến và đẩy lùi va tường phát huy sức mạnh tột đỉnh',
    lore: 'Bản đồ diện tích nhỏ (Phòng Hẹp): mọi bước di chuyển đều kịch tính, quái vật áp sát chớp nhoáng!',
    roomSize: 'compact',
    walls: [
      // Boundary walls creating a tight 9x6 room
      '0,0', '0,1', '0,2', '0,3', '0,4', '0,5', '0,6', '0,7',
      '1,0', '1,7', '2,0', '2,7', '3,0', '3,7', '4,0', '4,7',
      '5,0', '5,7', '6,0', '6,7', '7,0', '7,7', '8,0', '8,7',
      '9,0', '9,7', '10,0', '10,7', '11,0', '11,7',
      // Internal chokepoint pillars
      '4,2', '4,5', '7,2', '7,5',
    ],
    terrain: [
      ['5,3', 'iron_bars'],
      ['5,4', 'iron_bars'],
      ['6,3', 'altar'],
      ['3,3', 'trap'],
      ['8,4', 'trap'],
      ['3,2', 'oil'],
      ['8,5', 'oil'],
    ],
  },
  {
    id: 'mossy_ruins',
    name: 'Hầm Cổ Rêu Phong & Tường Nứt',
    subtitle: 'Tường đá nứt nẻ phủ rêu xanh ẩm ướt, ánh mắt dã thú sáng rực từ những kẽ hở đá',
    lore: 'Đá nứt và bùn rêu trơn trượt; đứng trên Đài Tế giúp hồi phục thể lực và sức tấn công.',
    roomSize: 'standard',
    walls: ['3,1', '3,2', '3,5', '3,6', '6,2', '6,5', '8,1', '10,2'],
    terrain: [
      ['4,2', 'moss'],
      ['4,3', 'moss'],
      ['4,4', 'moss'],
      ['7,3', 'moss'],
      ['7,4', 'moss'],
      ['3,3', 'oil'],
      ['8,4', 'oil'],
      ['5,0', 'water'],
      ['5,1', 'water'],
      ['5,2', 'water'],
      ['5,3', 'bridge'],
      ['5,4', 'bridge'],
      ['5,5', 'water'],
      ['5,6', 'water'],
      ['5,7', 'water'],
      ['6,4', 'altar'],
      ['2,5', 'trap'],
      ['9,5', 'trap'],
    ],
  },
  {
    id: 'abyssal_forge',
    name: 'Vực Thẳm Dung Nham & Hư Vô',
    subtitle: 'Vực sâu thăm thẳm với những ánh mắt tím kỳ dị nhìn chằm chằm và dòng nham thạch sôi sục',
    lore: 'Nham thạch gây sát thương thiêu đốt dữ dội; vực thẳm chia cắt không gian.',
    roomSize: 'standard',
    walls: ['2,2', '2,5', '5,1', '8,2', '8,5', '10,1', '10,6'],
    terrain: [
      ['5,2', 'lava'],
      ['5,3', 'lava'],
      ['5,4', 'lava'],
      ['6,4', 'lava'],
      ['7,4', 'lava'],
      ['4,3', 'oil'],
      ['7,3', 'oil'],
      ['6,0', 'abyss'],
      ['6,1', 'abyss'],
      ['6,2', 'bridge'],
      ['6,6', 'abyss'],
      ['6,7', 'abyss'],
      ['3,2', 'portal'],
      ['9,5', 'portal'],
      ['4,5', 'trap'],
      ['8,3', 'altar'],
    ],
  },
  {
    id: 'infernal_arena',
    name: 'Đại Đấu Trường Nham Thạch Cổ',
    subtitle: 'Đấu trường khổng lồ rộng mở với các đài cao bao quanh và vệt dầu rực lửa',
    lore: 'Bản đồ diện tích rộng lớn (Phòng Lớn): nhiều đài cao và thùng thuốc nổ chiến thuật!',
    roomSize: 'large',
    walls: ['3,1', '3,6', '8,1', '8,6'],
    terrain: [
      ['5,2', 'lava'],
      ['6,2', 'lava'],
      ['5,5', 'lava'],
      ['6,5', 'lava'],
      ['4,3', 'altar'],
      ['7,4', 'altar'],
      ['4,2', 'oil'],
      ['7,5', 'oil'],
      ['3,3', 'portal'],
      ['9,4', 'portal'],
      ['2,4', 'trap'],
      ['9,3', 'trap'],
    ],
  },
  {
    id: 'crystal_sanctum',
    name: 'Thánh Điện Tinh Thể & Mật Thất Cổ',
    subtitle: 'Trận pháp cổ đại phát sáng lung linh, song sắt thần bí bảo hộ trung tâm thánh tích',
    lore: 'Đài Tế Thánh Quang ở trung tâm tăng sức mạnh cho phe nào chiếm đóng.',
    roomSize: 'standard',
    walls: ['3,1', '3,6', '6,1', '6,6', '9,1', '9,6'],
    terrain: [
      ['6,3', 'altar'],
      ['6,4', 'altar'],
      ['4,3', 'iron_bars'],
      ['4,4', 'iron_bars'],
      ['8,3', 'iron_bars'],
      ['8,4', 'iron_bars'],
      ['5,3', 'oil'],
      ['7,3', 'oil'],
      ['2,3', 'portal'],
      ['10,4', 'portal'],
      ['5,2', 'moss'],
      ['7,5', 'moss'],
      ['3,4', 'trap'],
      ['9,3', 'trap'],
    ],
  },
  {
    id: 'dwarven_mine',
    name: 'Hầm Mỏ Khoáng Thạch Cổ',
    subtitle: 'Hệ thống đường ray gỗ và vỉa khoáng lấp lánh đá quý sâu dưới lòng đất',
    lore: 'Nhiều thùng thuốc nổ và khoáng thạch quý; cẩn thận những cạm bẫy khai mỏ bị bỏ hoang.',
    roomSize: 'standard',
    walls: ['2,1', '2,6', '5,1', '5,2', '5,5', '5,6', '8,2', '8,5'],
    terrain: [
      ['4,3', 'altar'],
      ['7,3', 'altar'],
      ['6,2', 'oil'],
      ['6,5', 'oil'],
      ['3,3', 'trap'],
      ['9,4', 'trap'],
      ['1,3', 'portal'],
      ['9,5', 'portal'],
      ['5,3', 'bridge'],
      ['5,4', 'bridge'],
    ],
  },
  {
    id: 'toxic_bog',
    name: 'Đầm Lầy Độc Tử Linh',
    subtitle: 'Nước đầm đen kịt sôi sục khí độc và xương tàn vương vãi khắp các rặng liễu ma',
    lore: 'Khí độc âm ỉ và đầm lầy trũng sâu; đài tế thánh giúp thanh tẩy độc tố cho đoàn thám hiểm.',
    roomSize: 'standard',
    walls: ['3,2', '3,5', '6,1', '6,6', '9,2', '9,5'],
    terrain: [
      ['6,3', 'altar'],
      ['4,1', 'water'],
      ['4,2', 'water'],
      ['4,5', 'water'],
      ['4,6', 'water'],
      ['4,3', 'bridge'],
      ['4,4', 'bridge'],
      ['7,2', 'moss'],
      ['7,5', 'moss'],
      ['5,3', 'oil'],
      ['8,3', 'oil'],
      ['2,4', 'trap'],
      ['8,2', 'trap'],
      ['2,2', 'portal'],
      ['9,4', 'portal'],
    ],
  },
];
