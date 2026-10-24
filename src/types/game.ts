export type UnitKind = 'hero' | 'enemy';

export interface WeaponStats {
  atk?: number;
  matk?: number;
  def?: number;
  spd?: number;
  range?: number;
  move?: number;
  mp?: number;
  hp?: number;
  hpPct?: number;
  atkPct?: number;
  matkPct?: number;
  thorns?: number; // % damage reflection (e.g., 0.35 = 35%)
  critRate?: number; // % bonus crit
  lifesteal?: number; // % lifesteal
}

export type SlotType = 'weapon' | 'shield' | 'armor' | 'ring';
export type WeaponFamily = 'sword' | 'axe' | 'staff' | 'tome' | 'bell' | 'bow' | 'crossbow' | 'dagger' | 'spear' | 'hammer';
export type ArmorFamily = 'leather' | 'iron' | 'robe' | 'gold';
export type ShieldFamily = 'buckler' | 'iron' | 'aegis';

export type SpecialSkillType =
  | 'summon_wolf'
  | 'summon_golem'
  | 'summon_fire_sprite'
  | 'transform_werewolf'
  | 'transform_juggernaut'
  | 'transform_dragon'
  | 'aoe_meteor'
  | 'aoe_chain_lightning'
  | 'aoe_earthquake'
  | 'aoe_void_vortex'
  | 'bastion_stance'
  | 'petrify_strike'
  | 'crit_burst';

export interface GearTemplate {
  name: string;
  type: SlotType;
  slot: SlotType;
  family?: WeaponFamily;
  armorFamily?: ArmorFamily;
  shieldFamily?: ShieldFamily;
  icon: string;
  stats: WeaponStats;
  description?: string;
  isTradeOff?: boolean;
  tradeOffPros?: string;
  tradeOffCons?: string;
  specialSkill?: SpecialSkillType;
  specialSkillName?: string;
  specialSkillDesc?: string;
  specialSkillMp?: number;
}

export interface GearItem {
  id: string;
  name: string;
  type: SlotType;
  slot: SlotType;
  family?: WeaponFamily | null;
  armorFamily?: ArmorFamily | null;
  shieldFamily?: ShieldFamily | null;
  icon: string;
  stats: WeaponStats;
  rarity: number; // 1 to 7
  floor: number;
  level: number; // Explicit item level based on floor & rarity
  isTradeOff?: boolean;
  tradeOffPros?: string;
  tradeOffCons?: string;
  sellPrice: number;
  price?: number; // When displayed in shop
  description?: string;
  specialSkill?: SpecialSkillType;
  specialSkillName?: string;
  specialSkillDesc?: string;
  specialSkillMp?: number;
}

export interface DungeonForkOption {
  id: string;
  title: string;
  biome: DungeonBiome;
  description: string;
  icon: string;
  dangerLevel: 'Bình thường' | 'Thử thách' | 'Cực hạn';
  perkText: string;
  riskText?: string;
  rewardType: 'equipment' | 'heal' | 'gold' | 'shop';
}

export type HairStyle = 'short' | 'spiky' | 'long' | 'ponytail' | 'bald';

export interface ActionExp {
  atk: number;
  matk: number;
  def: number;
  spd: number;
  hp: number;
  mp: number;
}

export interface Unit {
  id: string;
  name: string;
  title?: string;
  role: string;
  kind: UnitKind;
  glyph: string;
  color: string;
  // Appearance customization for visual paperdoll / sprites
  skinTone?: string;
  hairColor?: string;
  hairStyle?: HairStyle;
  cloakColor?: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  matk: number;
  def: number;
  spd: number;
  range: number;
  move: number;
  level: number;
  exp: number;
  acted: boolean;
  moved: boolean;
  guard: number;
  inTransit?: boolean;
  species?: 'human' | 'snake' | 'kraken' | 'cerberus' | 'bird' | 'golem' | 'slime' | 'beholder' | 'treant' | 'banshee' | 'mimic' | 'ash-archer' | 'wolf' | 'dragon' | 'lich' | 'ghost' | 'shaman' | 'chimera' | 'warden';
  ability?: string;
  passiveName?: string;
  passiveDesc?: string;
  boss?: boolean;
  bossCycle?: number;
  pendingBossSkill?: PendingBossSkill | null;
  cooldown?: number;
  skillCooldown?: number; // Spell / special skill cooldown turns
  // Monster-specific advanced passives
  canRebirth?: boolean; // Rebirth once upon death with 50% HP
  reborn?: boolean; // Has already reborn
  phasesWalls?: boolean; // Unhindered ghost flight through solid walls & abyss
  shamanAura?: boolean; // Buffs nearby monster allies with ATK & DEF
  magicWard?: boolean; // Resists magic damage and reflects long-range spells
  stun?: number;
  poisonTicks?: number;
  burnTicks?: number;
  blindTicks?: number;
  weakenTicks?: number;
  entangledTicks?: number;
  rageMode?: boolean;
  swordKiStacks?: number;
  // Summoning mechanics
  isSummon?: boolean;
  summonerId?: string;
  summonTurns?: number;
  // Transformation mechanics
  transformation?: {
    type: 'werewolf' | 'juggernaut' | 'dragon';
    turnsRemaining: number;
    name: string;
    originalGlyph: string;
    originalColor: string;
  } | null;
  // Status effects
  petrifiedTicks?: number; // Petrified: DEF x2, but rooted and unable to act
  bastionTicks?: number; // Immovable Bastion: +20 DEF, 50% damage reduction, 40% thorns, Move = 0
  thornsPct?: number; // Retaliation reflection %
  // Tactical effects: Stun, Freeze, Elevation
  isStunned?: boolean;
  stunTicks?: number;
  frozenTicks?: number;
  elevation?: number; // 0 = low ground, 1 = high ground platform
  // Use-based stat progression tracking
  actionExp?: ActionExp;
  weaponMastery?: Record<string, number>;
  animation?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    start: number;
    duration: number;
  } | null;
  combatAnim?: CombatAnim | null;
  isDowned?: boolean;
  deathAnim?: { startTime: number; duration: number } | null;
}

export type BossSkillType =
  | 'slap' | 'roar' | 'bite' | 'poison_nova'
  | 'chain_pull' | 'prison_slam' | 'iron_cage' | 'bastion_rage'
  | 'dragon_breath' | 'magma_slam' | 'meteor_rain' | 'dragon_roar'
  | 'glacial_tomb' | 'blizzard_burst' | 'ice_lance' | 'frost_armor'
  | 'lion_roar' | 'scorpion_stinger' | 'goat_fire' | 'triple_frenzy';

export interface PendingBossSkill {
  type: BossSkillType;
  targetId?: string;
  targetCoords?: { x: number; y: number }[];
}

export interface CombatAnim {
  type: 'lunge' | 'hit';
  targetX?: number;
  targetY?: number;
  fromX?: number;
  fromY?: number;
  startTime: number;
  duration: number; // Duration in ms (typically 220-260ms)
}

export interface ExplosiveBarrel {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export interface EffectiveStats {
  hp: number;
  mp: number;
  atk: number;
  matk: number;
  def: number;
  spd: number;
  range: number;
  move: number;
  hpPct: number;
  atkPct: number;
  matkPct: number;
  thornsPct?: number;
  critRate?: number;
  lifesteal?: number;
}

export type TerrainType = 'water' | 'abyss' | 'bridge' | 'lava' | 'trap' | 'portal' | 'iron_bars' | 'altar' | 'moss' | 'oil' | 'fire_ground';

export interface TerrainTile {
  type: TerrainType;
}

export type DungeonBiome = 'prison' | 'mossy_ruins' | 'abyssal_forge' | 'crystal_sanctum' | 'dwarven_mine' | 'toxic_bog' | 'haunted_crypt' | 'infernal_arena';

export interface BossTelegraph {
  x: number;
  y: number;
  type: BossSkillType | string;
}

export interface VisualEffect {
  id?: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'strike' | 'arrow' | 'fire' | 'bash' | 'spell' | 'enemy' | 'heal' | 'bite' | 'tentacle' | 'claw3' | 'feather' | 'eye_ray' | 'entangle' | 'wail' | 'stat_up' | 'summon' | 'transform' | 'meteor' | 'lightning' | 'petrify' | 'thorns' | 'reborn' | 'buff_aura' | 'magic_reflect' | 'barrel_explosion' | 'wall_slam' | 'stun_stars' | 'shatter' | 'oil_ignite' | 'dragon_breath' | 'chain_whip' | 'frost_tomb';
  damage: number;
  floatingText?: string;
  isCrit?: boolean;
  color: string;
  start: number;
  duration: number;
}

export interface CombatLogEntry {
  id: string;
  message: string;
  type: 'normal' | 'good' | 'enemy' | 'item' | 'skill';
  time: string;
}

export interface SkillCutInData {
  unit: Unit;
  skillName: string;
  skillDesc?: string;
  color: string;
  bannerSubtitle?: string;
  startTime?: number;
  duration?: number; // e.g. 1100ms
}

export type GamePhase =
  | 'title'
  | 'setup'
  | 'opening_cutscene'
  | 'boss_cutscene'
  | 'boss_victory_cutscene'
  | 'door_cutscene'
  | 'ready'
  | 'playing'
  | 'exiting'
  | 'won'
  | 'lost'
  | 'recruit';

export type ControlMode = 'auto' | 'manual';
