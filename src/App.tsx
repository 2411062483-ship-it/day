import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Unit,
  GearItem,
  GearTemplate,
  TerrainTile,
  BossTelegraph,
  VisualEffect,
  CombatLogEntry,
  GamePhase,
  ControlMode,
  EffectiveStats,
  SlotType,
  DungeonBiome,
  ExplosiveBarrel,
  WeaponFamily,
  SkillCutInData,
  BossSkillType,
} from './types/game';
import {
  INITIAL_HEROES,
  GEAR_CATALOG,
  ENEMY_CATALOG,
  BOSS_TEMPLATES,
  BIOME_PRESETS,
  GRID_COLS,
  GRID_ROWS,
  EXIT_DOOR,
  PLAYBACK_SPEEDS,
  WEAPON_FAMILIES,
  WEAPON_XP_PER_RANK,
  WEAPON_XP_PER_HIT,
  STAT_EXP_THRESHOLDS,
  SLOT_NAMES,
  generateRandomAdventurer,
  MAX_PARTY_SIZE,
  getStatExpThreshold,
  getHeroLevelExpThreshold,
  calculateMonsterExp,
} from './game/constants';
import {
  inBounds,
  manhattan,
  isOccupied,
  clearShot,
  getReachableTiles,
  findPathToAttackRange,
  findShortestStep,
  ensureMapConnectivity,
  Point,
} from './game/pathfinding';
import { sound } from './audio/sound';
import { BattleCanvas } from './components/BattleCanvas';
import { ActionBar } from './components/ActionBar';
import { PartySidebar } from './components/PartySidebar';
import { CombatLog } from './components/CombatLog';
import { TitleScreen } from './components/TitleScreen';
import { TeamManagerModal } from './components/TeamManagerModal';
import { InventoryManagerModal } from './components/InventoryManagerModal';
import { ShopModal } from './components/ShopModal';
import { RecruitModal } from './components/RecruitModal';
import { GameOverModal } from './components/GameOverModal';
import { CinematicOpeningModal } from './components/CinematicOpeningModal';
import { BossIntroModal } from './components/BossIntroModal';
import { SkillCutInOverlay } from './components/SkillCutInOverlay';
import { BossVictoryCutscene } from './components/BossVictoryCutscene';
import { DungeonDoorCutscene } from './components/DungeonDoorCutscene';
import { DungeonForkOption } from './types/game';
import { Shield, Store, Crown, Maximize, Minimize } from 'lucide-react';

const SAVE_KEY = 'tower_companions_save_v5';

export default function App() {
  // Screen & Phase
  const [phase, setPhase] = useState<GamePhase>('title');
  const [controlMode, setControlMode] = useState<ControlMode>('auto');
  const [floor, setFloor] = useState<number>(1);
  const [round, setRound] = useState<number>(1);
  const [floorBoss, setFloorBoss] = useState<boolean>(false);
  const [hasSave, setHasSave] = useState<boolean>(false);
  const [saveFloor, setSaveFloor] = useState<number>(1);
  const [doorForkOptions, setDoorForkOptions] = useState<DungeonForkOption[] | null>(null);

  // Party & Inventory (No fixed classes! Randomized adventurers)
  const [partyIds, setPartyIds] = useState<string[]>(['hero-1', 'hero-2']);
  const [heroRoster, setHeroRoster] = useState<Unit[]>(() =>
    INITIAL_HEROES.map((h) => ({ ...h, weaponMastery: {}, actionExp: { atk: 0, matk: 0, def: 0, spd: 0, hp: 0, mp: 0 } }))
  );
  const [equipped, setEquipped] = useState<Record<string, Record<string, GearItem>>>({});
  const [inventory, setInventory] = useState<GearItem[]>([]);
  const [gold, setGold] = useState<number>(35);
  const [shopStock, setShopStock] = useState<GearItem[]>([]);

  // Room Board State & Biome
  const [units, setUnits] = useState<Unit[]>([]);
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [terrainMap, setTerrainMap] = useState<Map<string, TerrainTile>>(new Map());
  const [currentBiome, setCurrentBiome] = useState<DungeonBiome>('prison');
  const [portalPoints, setPortalPoints] = useState<Point[]>([]);
  const [triggeredTraps, setTriggeredTraps] = useState<Set<string>>(new Set());
  const [bossTelegraph, setBossTelegraph] = useState<BossTelegraph[]>([]);
  const [elevations, setElevations] = useState<Set<string>>(new Set());
  const [barrels, setBarrels] = useState<ExplosiveBarrel[]>([]);

  // Turn management
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>('hero-1');
  const [selectedId, setSelectedId] = useState<string | null>('hero-1');
  const [order, setOrder] = useState<Unit[]>([]);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const [speedIndex, setSpeedIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Interactive targeting
  const [moveTiles, setMoveTiles] = useState<Point[]>([]);
  const [targetTiles, setTargetTiles] = useState<Point[]>([]);
  const [targetingAction, setTargetingAction] = useState<'attack' | 'skill' | null>(null);

  // FX & Logs
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [screenShake, setScreenShake] = useState<number>(0);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);

  // Modals
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState<boolean>(false);
  const [shopModalOpen, setShopModalOpen] = useState<boolean>(false);
  const [recruitCandidate, setRecruitCandidate] = useState<Unit | null>(null);
  const [gameOverResult, setGameOverResult] = useState<'won' | 'lost' | null>(null);
  const [floorLootFound, setFloorLootFound] = useState<GearItem[]>([]);
  const [floorGoldEarned, setFloorGoldEarned] = useState<number>(0);
  const [skillCutIn, setSkillCutIn] = useState<SkillCutInData | null>(null);
  const [currentBoss, setCurrentBoss] = useState<Unit | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const triggerSkillCutIn = useCallback(
    (unit: Unit, skillName: string, skillDesc: string, color?: string, bannerSubtitle?: string) => {
      sound.playCutIn();
      setSkillCutIn({
        unit,
        skillName,
        skillDesc,
        color: color || '#f59e0b',
        bannerSubtitle: bannerSubtitle || `${unit.role} • KỸ NĂNG ĐẶC BIỆT`,
        startTime: performance.now(),
        duration: 950,
      });
    },
    []
  );

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    } catch {}
  };

  const roomGenRef = useRef<number>(0);

  // Helper to add combat log
  const addLog = useCallback(
    (message: string, type: 'normal' | 'good' | 'enemy' | 'item' | 'skill' = 'normal') => {
      const now = new Date();
      const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLogs((prev) => [
        { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, type, time: timeStr },
        ...prev.slice(0, 40),
      ]);
    },
    []
  );

  // Trigger floating visual effect on canvas
  const triggerEffect = useCallback(
    (
      attacker: Point,
      target: Point,
      type: VisualEffect['type'],
      damage: number,
      isCrit: boolean = false,
      floatingText?: string
    ) => {
      const colorMap: Record<string, string> = {
        strike: '#fde047',
        arrow: '#4ade80',
        fire: '#f97316',
        bash: '#f59e0b',
        spell: '#c084fc',
        enemy: '#f87171',
        heal: '#22c55e',
        bite: '#10b981',
        tentacle: '#a855f7',
        claw3: '#ef4444',
        feather: '#06b6d4',
        eye_ray: '#c084fc',
        entangle: '#22c55e',
        wail: '#67e8f9',
        stat_up: '#fbbf24',
        summon: '#34d399',
        transform: '#f43f5e',
        meteor: '#f97316',
        lightning: '#38bdf8',
        petrify: '#94a3b8',
        thorns: '#ef4444',
      };
      setVisualEffects((prev) => [
        ...prev,
        {
          id: `fx-${Date.now()}-${Math.random()}`,
          fromX: attacker.x,
          fromY: attacker.y,
          toX: target.x,
          toY: target.y,
          type,
          damage,
          floatingText,
          isCrit,
          color: colorMap[type] || '#ffffff',
          start: performance.now(),
          duration: 550,
        },
      ]);
    },
    []
  );

  // Calculate effective stats including gear & mastery & passives (Universal!)
  const getEffectiveStats = useCallback(
    (unit: Unit): EffectiveStats => {
      const result: EffectiveStats = {
        hp: unit.maxHp,
        mp: unit.maxMp,
        atk: unit.atk,
        matk: unit.matk,
        def: unit.def,
        spd: unit.spd,
        range: unit.range,
        move: unit.move,
        hpPct: 0,
        atkPct: 0,
        matkPct: 0,
      };

      const unitEquip = equipped[unit.id];
      const weapon = unitEquip?.weapon;

      if (unit.kind === 'hero') {
        if (weapon?.family) {
          if (weapon.family === 'bow' || weapon.family === 'crossbow') {
            result.range = 3;
          } else if (weapon.family === 'staff' || weapon.family === 'tome') {
            result.range = 3;
          } else if (weapon.family === 'spear' || weapon.family === 'bell') {
            result.range = 2;
          } else {
            result.range = 1;
          }
        } else {
          result.range = 1;
        }

        // Shield wearer bonus
        if (unitEquip?.shield) {
          result.def += 2;
          result.hp += 6;
        }
      }

      // Sword Ki stacks
      if (unit.swordKiStacks) {
        result.atk += unit.swordKiStacks;
      }

      // Rage mode
      if (unit.rageMode) {
        result.atk += 4;
        result.spd += 2;
      }

      // Blind effect
      if (unit.blindTicks && unit.blindTicks > 0) {
        result.range = Math.max(1, result.range - 1);
        result.spd = Math.max(1, result.spd - 2);
      }

      if (unitEquip) {
        for (const item of Object.values(unitEquip)) {
          if (!item?.stats) continue;
          for (const [k, val] of Object.entries(item.stats)) {
            const num = Number(val) || 0;
            if (k === 'hpPct') result.hpPct += num;
            else if (k === 'atkPct') result.atkPct += num;
            else if (k === 'matkPct') result.matkPct += num;
            else if (k in result) {
              (result as unknown as Record<string, number>)[k] += num;
            }
          }
        }
      }

      // Weapon mastery bonus
      if (weapon?.family && WEAPON_FAMILIES[weapon.family]) {
        const masteryXp = unit.weaponMastery?.[weapon.family] || 0;
        const rank = Math.floor(masteryXp / WEAPON_XP_PER_RANK);
        const statsBonus = WEAPON_FAMILIES[weapon.family].stats;
        for (const [k, v] of Object.entries(statsBonus)) {
          if (k in result) {
            (result as unknown as Record<string, number>)[k] += v * rank;
          }
        }
      }

      // Transformation buffs
      if (unit.transformation) {
        if (unit.transformation.type === 'werewolf') {
          result.atk += 10;
          result.spd += 4;
        } else if (unit.transformation.type === 'juggernaut') {
          result.def += 18;
          result.hp += 30;
          result.spd = Math.max(1, result.spd - 2);
        } else if (unit.transformation.type === 'dragon') {
          result.range += 2;
          result.atk += 6;
          result.matk += 6;
        }
      }

      // Immovable Bastion Stance: +20 DEF, 0 Move
      if (unit.bastionTicks && unit.bastionTicks > 0) {
        result.def += 20;
        result.move = 0;
      }

      // Petrified Status: x2 DEF, 0 Move
      if (unit.petrifiedTicks && unit.petrifiedTicks > 0) {
        result.def = Math.round(result.def * 2);
        result.move = 0;
      }

      result.hp = Math.round(result.hp * (1 + result.hpPct));
      result.atk = Math.max(1, Math.round(result.atk * (1 + result.atkPct)) - (unit.weakenTicks ? 2 : 0));
      result.matk = Math.max(0, Math.round(result.matk * (1 + result.matkPct)) - (unit.weakenTicks ? 2 : 0));
      return result;
    },
    [equipped]
  );

  // Weapon & Equipment generator with balanced Level Scaling & Trade-off support
  const createGear = useCallback((template: GearTemplate, rarity: number = 1, atFloor: number = 1): GearItem => {
    const stats = { ...template.stats };
    const itemLevel = Math.max(1, atFloor);
    // Smooth level scaling: +1 to positive stats every ~1.5 floors, plus rarity boost
    const levelScale = Math.floor((itemLevel - 1) * 0.65);

    for (const [key, val] of Object.entries(stats)) {
      const num = Number(val) || 0;
      if (key.endsWith('Pct') || key === 'thorns' || key === 'critRate' || key === 'lifesteal') {
        if (num < 0) {
          // Negative trade-off percent (e.g., -25% HP): maintain drawback
          stats[key as keyof typeof stats] = num;
        } else {
          stats[key as keyof typeof stats] = Math.min(
            0.65,
            num + (rarity - 1) * 0.035 + Math.floor((itemLevel - 1) / 4) * 0.02
          );
        }
      } else {
        if (num < 0) {
          // Negative trade-off integer (e.g., -8 DEF): maintain drawback
          stats[key as keyof typeof stats] = num;
        } else {
          // Positive stats scale smoothly with level and rarity
          stats[key as keyof typeof stats] = num + levelScale + (rarity - 1) * 2;
        }
      }
    }

    return {
      id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: template.name,
      type: template.type,
      slot: template.slot,
      family: template.family || null,
      armorFamily: template.armorFamily || null,
      shieldFamily: template.shieldFamily || null,
      icon: template.icon,
      stats,
      rarity: Math.min(7, Math.max(1, rarity)),
      floor: atFloor,
      level: itemLevel,
      isTradeOff: template.isTradeOff || false,
      tradeOffPros: template.tradeOffPros,
      tradeOffCons: template.tradeOffCons,
      sellPrice: Math.max(5, Math.round((7 + rarity * 9 + itemLevel * 3) * (template.type === 'ring' ? 1.25 : 1))),
      description: template.description,
      specialSkill: template.specialSkill,
      specialSkillName: template.specialSkillName,
      specialSkillDesc: template.specialSkillDesc,
      specialSkillMp: template.specialSkillMp,
    };
  }, []);

  // Generate rotating shop items with higher tier rarities and level scaling
  const generateShopStock = useCallback(
    (currentFloor: number): GearItem[] => {
      return Array.from({ length: 6 }, () => {
        const template = GEAR_CATALOG[Math.floor(Math.random() * GEAR_CATALOG.length)];
        const roll = Math.random();
        const rarity =
          currentFloor >= 9
            ? (roll < 0.15 ? 4 : roll < 0.45 ? 5 : roll < 0.8 ? 6 : 7)
            : currentFloor >= 6
            ? (roll < 0.2 ? 3 : roll < 0.5 ? 4 : roll < 0.85 ? 5 : 6)
            : currentFloor >= 3
            ? (roll < 0.3 ? 2 : roll < 0.65 ? 3 : roll < 0.9 ? 4 : 5)
            : (roll < 0.5 ? 1 : roll < 0.82 ? 2 : 3);
        const item = createGear(template, rarity, currentFloor);
        item.price = Math.round(item.sellPrice * 1.55);
        return item;
      });
    },
    [createGear]
  );

  // ACTION-BASED STAT PROFICIENCY PROGRESSION (Dùng gì tăng điểm nấy!)
  const recordHeroAction = useCallback(
    (hero: Unit, actionType: 'melee' | 'magic' | 'defend' | 'move' | 'damage_taken', hitCount: number = 1) => {
      if (hero.kind !== 'hero') return;

      const actionExp = { ...(hero.actionExp || { atk: 0, matk: 0, def: 0, spd: 0, hp: 0, mp: 0 }) };
      const weapon = equipped[hero.id]?.weapon;

      if (actionType === 'melee') {
        // Physical attacks increase ATK
        actionExp.atk += 14 * hitCount;
        // Heavy weapons (axe, hammer) also build HP & DEF
        if (weapon?.family === 'axe' || weapon?.family === 'hammer') {
          actionExp.hp += 8 * hitCount;
          actionExp.def += 6 * hitCount;
        }
        // Agile weapons (dagger, bow) also build SPD
        if (weapon?.family === 'dagger' || weapon?.family === 'bow') {
          actionExp.spd += 8 * hitCount;
        }
      } else if (actionType === 'magic') {
        // Casting magic increases MATK & Max MP
        actionExp.matk += 16 * hitCount;
        actionExp.mp += 12 * hitCount;
      } else if (actionType === 'defend' || actionType === 'damage_taken') {
        // Blocking and enduring damage increases DEF and Max HP
        actionExp.def += 12 * hitCount;
        actionExp.hp += 12 * hitCount;
      } else if (actionType === 'move') {
        // Swift maneuvering increases SPD
        actionExp.spd += 6;
      }

      // Check level-ups for each stat using dynamic scaling thresholds (higher stat = more EXP needed!)
      const atkThreshold = getStatExpThreshold('atk', hero.atk);
      if (actionExp.atk >= atkThreshold) {
        actionExp.atk -= atkThreshold;
        hero.atk += 1;
        sound.playLevelUp();
        triggerEffect(hero, hero, 'stat_up', 0, false, '+1 CÔNG KÍCH!');
        addLog(`✦ <b>${hero.name}</b> vung vũ khí thuần thục: <b>+1 Công Kích (Vật Lý)</b> (Hiện tại: ${hero.atk})! Cần ${getStatExpThreshold('atk', hero.atk)} EXP cho mốc tiếp theo.`, 'good');
      }

      const matkThreshold = getStatExpThreshold('matk', hero.matk);
      if (actionExp.matk >= matkThreshold) {
        actionExp.matk -= matkThreshold;
        hero.matk += 1;
        sound.playLevelUp();
        triggerEffect(hero, hero, 'stat_up', 0, false, '+1 CÔNG PHÉP!');
        addLog(`✦ <b>${hero.name}</b> ngưng tụ ma pháp: <b>+1 Công Phép Thuật</b> (Hiện tại: ${hero.matk})! Cần ${getStatExpThreshold('matk', hero.matk)} EXP cho mốc tiếp theo.`, 'good');
      }

      const defThreshold = getStatExpThreshold('def', hero.def);
      if (actionExp.def >= defThreshold) {
        actionExp.def -= defThreshold;
        hero.def += 1;
        sound.playLevelUp();
        triggerEffect(hero, hero, 'stat_up', 0, false, '+1 PHÒNG THỦ!');
        addLog(`✦ <b>${hero.name}</b> tôi luyện thể phách: <b>+1 Giáp Phòng Thủ</b> (Hiện tại: ${hero.def})! Cần ${getStatExpThreshold('def', hero.def)} EXP cho mốc tiếp theo.`, 'good');
      }

      const spdThreshold = getStatExpThreshold('spd', hero.spd);
      if (actionExp.spd >= spdThreshold) {
        actionExp.spd -= spdThreshold;
        hero.spd += 1;
        sound.playLevelUp();
        triggerEffect(hero, hero, 'stat_up', 0, false, '+1 TỐC ĐỘ!');
        addLog(`✦ <b>${hero.name}</b> thân pháp mau lẹ: <b>+1 Tốc Độ Phản Xạ</b> (Hiện tại: ${hero.spd})! Cần ${getStatExpThreshold('spd', hero.spd)} EXP cho mốc tiếp theo.`, 'good');
      }

      const hpThreshold = getStatExpThreshold('hp', hero.maxHp);
      if (actionExp.hp >= hpThreshold) {
        actionExp.hp -= hpThreshold;
        hero.maxHp += 4;
        hero.hp = Math.min(getEffectiveStats(hero).hp, hero.hp + 4);
        sound.playLevelUp();
        triggerEffect(hero, hero, 'stat_up', 0, false, '+4 MÁU TỐI ĐA!');
        addLog(`✦ <b>${hero.name}</b> gia tăng sinh lực: <b>+4 Sinh Mệnh (Máu Tối Đa)</b> (Hiện tại: ${hero.maxHp})!`, 'good');
      }

      const mpThreshold = getStatExpThreshold('mp', hero.maxMp);
      if (actionExp.mp >= mpThreshold) {
        actionExp.mp -= mpThreshold;
        hero.maxMp += 2;
        hero.mp = Math.min(getEffectiveStats(hero).mp, hero.mp + 2);
        sound.playLevelUp();
        triggerEffect(hero, hero, 'stat_up', 0, false, '+2 MP TỐI ĐA!');
        addLog(`✦ <b>${hero.name}</b> mở rộng dung lượng ma lực: <b>+2 Năng Lượng (Nội Lực MP)</b> (Hiện tại: ${hero.maxMp})!`, 'good');
      }

      hero.actionExp = actionExp;
      setHeroRoster((prev) =>
        prev.map((h) =>
          h.id === hero.id
            ? {
                ...h,
                atk: hero.atk,
                matk: hero.matk,
                def: hero.def,
                spd: hero.spd,
                maxHp: hero.maxHp,
                maxMp: hero.maxMp,
                actionExp,
              }
            : h
        )
      );
    },
    [equipped, getEffectiveStats, triggerEffect, addLog]
  );

  // Gain weapon mastery on hit
  const gainWeaponMastery = useCallback(
    (unit: Unit) => {
      const weapon = equipped[unit.id]?.weapon;
      if (!weapon?.family || unit.kind !== 'hero') return;
      const currentXp = unit.weaponMastery?.[weapon.family] || 0;
      const beforeRank = Math.floor(currentXp / WEAPON_XP_PER_RANK);
      const nextXp = currentXp + WEAPON_XP_PER_HIT;
      const afterRank = Math.floor(nextXp / WEAPON_XP_PER_RANK);
      const updatedMastery = { ...(unit.weaponMastery || {}), [weapon.family]: nextXp };
      unit.weaponMastery = updatedMastery;

      setHeroRoster((prev) =>
        prev.map((h) => (h.id === unit.id ? { ...h, weaponMastery: updatedMastery } : h))
      );

      if (afterRank > beforeRank) {
        sound.playLevelUp();
        addLog(
          `✦ <b>${unit.name}</b> nâng bậc thuần thục <b>${
            WEAPON_FAMILIES[weapon.family]?.label || weapon.family
          }</b> lên cấp ${afterRank}!`,
          'good'
        );
      }
    },
    [equipped, addLog]
  );

  // Check saved state in localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.partyIds && data.partyIds.length > 0) {
          setHasSave(true);
          setSaveFloor(data.floor || 1);
        }
      }
    } catch {
      setHasSave(false);
    }
  }, []);

  // Save game progress
  const saveGame = useCallback(() => {
    try {
      const stateToSave = {
        floor,
        partyIds,
        heroRoster,
        equipped,
        inventory,
        gold,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
      setHasSave(true);
      setSaveFloor(floor);
    } catch {}
  }, [floor, partyIds, heroRoster, equipped, inventory, gold]);

  // Load saved run
  const handleContinueSavedRun = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      setFloor(data.floor || 1);
      setPartyIds(data.partyIds || ['hero-1', 'hero-2']);
      if (data.heroRoster) setHeroRoster(data.heroRoster);
      if (data.equipped) setEquipped(data.equipped);
      if (data.inventory) setInventory(data.inventory);
      if (data.gold !== undefined) setGold(data.gold);
      setShopStock(generateShopStock(data.floor || 1));
      setPhase('ready');
      sound.playClick();
      setupFloor(data.floor || 1, data.partyIds || ['hero-1', 'hero-2'], data.heroRoster || INITIAL_HEROES);
    } catch {
      setHasSave(false);
    }
  };

  // Start brand new run with chosen starter adventurers
  const handleStartNewRun = (starters: Unit[], starterWeapons: Record<string, string>) => {
    roomGenRef.current++;
    setHeroRoster(starters);
    const starterIds = starters.map((s) => s.id);
    setPartyIds(starterIds);
    setFloor(1);
    setGold(35);
    setInventory([]);
    setFloorLootFound([]);
    setFloorGoldEarned(0);

    const initialEquipped: Record<string, Record<string, GearItem>> = {};
    for (const hero of starters) {
      const weaponName = starterWeapons[hero.id] || 'Kiếm Rèn Sắt';
      const template = GEAR_CATALOG.find((g) => g.name === weaponName && g.slot === 'weapon') || GEAR_CATALOG[0];
      const item = createGear(template, 1, 1);
      initialEquipped[hero.id] = { weapon: item };
    }
    setEquipped(initialEquipped);
    setShopStock(generateShopStock(1));
    sound.playClick();
    setupFloor(1, starterIds, starters);
    setPhase('opening_cutscene');
  };

  // Setup / Reset current floor with Procedural Biome
  const setupFloor = (
    targetFloor: number,
    activePartyIds: string[] = partyIds,
    currentRoster: Unit[] = heroRoster
  ) => {
    roomGenRef.current++;
    setRound(1);
    setActiveId(null);
    setPaused(false);
    setOrder([]);
    setTurnIndex(0);
    setMoveTiles([]);
    setTargetTiles([]);
    setBossTelegraph([]);
    setVisualEffects([]);
    setTargetingAction(null);
    setFloorLootFound([]);
    setFloorGoldEarned(0);

    // Pick procedural Biome
    const preset = BIOME_PRESETS[(targetFloor - 1) % BIOME_PRESETS.length];
    setCurrentBiome(preset.id);

    const newWalls = new Set<string>(preset.walls);
    const newTerrain = new Map<string, TerrainTile>();
    for (const [key, type] of preset.terrain) {
      newTerrain.set(key, { type: type as TerrainTile['type'] });
    }

    // HARD SAFETY GUARANTEE: Never allow portal, trap, or obstacle at (10,3), (11,3), or directly blocking EXIT_DOOR
    const exitBlockers = ['10,3', '11,3', '11,2', '11,4'];
    for (const key of exitBlockers) {
      if (newWalls.has(key) && key === '10,3') {
        newWalls.delete(key);
      }
      const existing = newTerrain.get(key);
      if (existing?.type === 'portal') {
        newTerrain.delete(key);
        newTerrain.set('9,5', { type: 'portal' });
      }
      if (existing?.type === 'trap') {
        newTerrain.delete(key);
      }
    }

    const portals: Point[] = [];
    for (const [key, tile] of newTerrain.entries()) {
      if (tile.type === 'portal') {
        const [px, py] = key.split(',').map(Number);
        // Ensure portal never blocks exit doorway
        if (px === 10 && py === 3) continue;
        portals.push({ x: px, y: py });
      }
    }
    setPortalPoints(portals);
    setTriggeredTraps(new Set());

    // Validate map connectivity
    ensureMapConnectivity(newWalls, newTerrain);
    setWalls(newWalls);
    setTerrainMap(newTerrain);

    // Spawns: First 3 floors NEVER spawn bosses! From Floor 4 onward, bosses can appear
    const isBoss =
      targetFloor > 3 &&
      (targetFloor === 10 ||
        targetFloor % 4 === 0 ||
        (targetFloor >= 5 && Math.random() < 0.4));
    setFloorBoss(isBoss);

    const partyUnits: Unit[] = [];
    const heroSpawns = [
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 1, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 6 },
    ];
    activePartyIds.forEach((id, idx) => {
      const base = currentRoster.find((h) => h.id === id);
      if (base) {
        const spawn = heroSpawns[idx] || { x: 1, y: 2 + idx };
        const heroEff = getEffectiveStats(base);
        partyUnits.push({
          ...base,
          x: spawn.x,
          y: spawn.y,
          hp: heroEff.hp,
          mp: heroEff.mp, // 100% Full MP on portal arrival!
          acted: false,
          moved: false,
          guard: 0,
          inTransit: false,
          isStunned: false,
          stunTicks: 0,
          skillCooldown: 0,
          burnTicks: 0,
          poisonTicks: 0,
          frozenTicks: 0,
        });
      }
    });

    // Safety fallback: Ensure at least one hero is present in partyUnits
    if (partyUnits.length === 0) {
      INITIAL_HEROES.slice(0, 2).forEach((base, idx) => {
        const spawn = heroSpawns[idx] || { x: 1, y: 2 + idx };
        const heroEff = getEffectiveStats(base);
        partyUnits.push({
          ...base,
          x: spawn.x,
          y: spawn.y,
          hp: heroEff.hp,
          mp: heroEff.mp,
          acted: false,
          moved: false,
          guard: 0,
          inTransit: false,
          isStunned: false,
          stunTicks: 0,
          skillCooldown: 0,
          burnTicks: 0,
          poisonTicks: 0,
          frozenTicks: 0,
        });
      });
    }

    const enemyUnits: Unit[] = [];
    const spawnPoints = [
      { x: 9, y: 2 },
      { x: 10, y: 5 },
      { x: 8, y: 6 },
      { x: 9, y: 6 },
      { x: 7, y: 2 },
      { x: 8, y: 4 },
    ];
    const scale = 0.92 + (targetFloor - 1) * 0.16;
    const enemyCount = targetFloor <= 1 ? 3 : Math.min(6, 3 + Math.floor(targetFloor / 2));

    for (let i = 0; i < enemyCount; i++) {
      const template = ENEMY_CATALOG[Math.floor(Math.random() * ENEMY_CATALOG.length)];
      const spawn = spawnPoints[i] || { x: 9, y: 3 };
      enemyUnits.push({
        id: `${template.id}-${i}-${Date.now()}`,
        name: template.name,
        role: template.role,
        kind: 'enemy',
        glyph: template.glyph,
        color: template.color,
        x: spawn.x,
        y: spawn.y,
        hp: Math.round(template.hp * scale),
        maxHp: Math.round(template.hp * scale),
        mp: template.ability === 'hex' ? 12 : 0,
        maxMp: template.ability === 'hex' ? 12 : 0,
        atk: Math.round(template.atk * scale),
        matk: template.ability === 'hex' ? 8 + Math.floor(targetFloor / 3) : 0,
        def: template.def + Math.floor((targetFloor - 1) / 5),
        spd: template.spd,
        range: template.range,
        move: template.move,
        level: targetFloor,
        exp: 0,
        acted: false,
        moved: false,
        guard: 0,
        species: template.species || 'human',
        ability: template.ability,
        passiveName: template.passiveName,
        passiveDesc: template.passiveDesc,
        cooldown: 0,
        stun: 0,
        poisonTicks: 0,
      });
    }

    // Add Boss if triggered (Floor 4+)
    if (isBoss) {
      let bossTemplate = BOSS_TEMPLATES[0];
      if (targetFloor === 10) {
        bossTemplate = BOSS_TEMPLATES.find((b) => b.id === 'minochoco') || BOSS_TEMPLATES[0];
      } else if (targetFloor === 4) {
        bossTemplate = BOSS_TEMPLATES.find((b) => b.id === 'warden') || BOSS_TEMPLATES[1];
      } else if (targetFloor === 5 || targetFloor === 6) {
        bossTemplate = BOSS_TEMPLATES.find((b) => b.id === 'chimera') || BOSS_TEMPLATES[4];
      } else if (targetFloor === 7 || targetFloor === 8) {
        bossTemplate = BOSS_TEMPLATES.find((b) => b.id === 'frost_lich') || BOSS_TEMPLATES[3];
      } else if (targetFloor === 9) {
        bossTemplate = BOSS_TEMPLATES.find((b) => b.id === 'ignis') || BOSS_TEMPLATES[2];
      } else {
        bossTemplate = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)];
      }

      enemyUnits.push({
        id: `boss-${bossTemplate.id}-${Date.now()}`,
        name: bossTemplate.name,
        role: bossTemplate.role,
        kind: 'enemy',
        glyph: bossTemplate.glyph,
        color: bossTemplate.color,
        x: 10,
        y: 3,
        hp: Math.round(bossTemplate.hp * scale),
        maxHp: Math.round(bossTemplate.hp * scale),
        mp: 0,
        maxMp: 0,
        atk: Math.round(bossTemplate.atk * scale),
        matk: 0,
        def: bossTemplate.def + Math.floor((targetFloor - 1) / 6),
        spd: bossTemplate.spd,
        range: bossTemplate.range,
        move: bossTemplate.move,
        level: targetFloor,
        exp: 0,
        acted: false,
        moved: false,
        guard: 0,
        boss: true,
        bossCycle: 0,
        species: bossTemplate.species || 'snake',
        ability: bossTemplate.ability,
        passiveName: bossTemplate.passiveName,
        passiveDesc: bossTemplate.passiveDesc,
        cooldown: 0,
        stun: 0,
        poisonTicks: 0,
      });
    }

    // Generate Tactical High Ground Platforms
    const newElevations = new Set<string>();
    const elevationSeeds = ['4,2', '4,3', '4,4', '7,2', '7,3', '7,4', '6,1', '6,6'];
    elevationSeeds.forEach((coord) => {
      if (!newWalls.has(coord) && !newTerrain.has(coord)) {
        newElevations.add(coord);
      }
    });
    setElevations(newElevations);

    // Sync unit elevation for party & enemies
    partyUnits.forEach((u) => {
      u.elevation = newElevations.has(`${u.x},${u.y}`) ? 1 : 0;
    });
    enemyUnits.forEach((u) => {
      u.elevation = newElevations.has(`${u.x},${u.y}`) ? 1 : 0;
    });

    // Spawn 2-3 Explosive Barrels strategically
    const barrelCandidates = [
      { x: 5, y: 3 },
      { x: 6, y: 5 },
      { x: 8, y: 3 },
      { x: 7, y: 5 },
      { x: 5, y: 1 },
      { x: 6, y: 2 },
    ];
    const newBarrels: ExplosiveBarrel[] = [];
    let bCount = 0;
    const maxBarrels = targetFloor >= 3 ? 3 : 2;
    for (const cand of barrelCandidates) {
      const key = `${cand.x},${cand.y}`;
      if (
        !newWalls.has(key) &&
        !newTerrain.has(key) &&
        !partyUnits.some((u) => u.x === cand.x && u.y === cand.y) &&
        !enemyUnits.some((u) => u.x === cand.x && u.y === cand.y) &&
        bCount < maxBarrels
      ) {
        newBarrels.push({
          id: `barrel-${Date.now()}-${bCount}`,
          x: cand.x,
          y: cand.y,
          hp: 1,
          maxHp: 1,
        });
        bCount++;
      }
    }
    setBarrels(newBarrels);

    const initialUnits = [...partyUnits, ...enemyUnits];
    setUnits(initialUnits);
    const initialHeroId = activePartyIds[0] || partyUnits[0]?.id || 'hero-1';
    setSelectedHeroId(initialHeroId);
    setSelectedId(initialHeroId);
    if (isBoss) {
      const boss = enemyUnits.find((u) => u.boss);
      if (boss) {
        setCurrentBoss(boss);
        setPhase('boss_cutscene');
      } else {
        setCurrentBoss(null);
        setPhase('ready');
      }
    } else {
      setCurrentBoss(null);
      setPhase('ready');
    }
    addLog(
      `Đoàn thám hiểm tiến vào <b>Tầng ${targetFloor}</b>: ${preset.name}${
        isBoss ? ' — CẢNH BÁO BOSS XUẤT HIỆN!' : ''
      }.`,
      isBoss ? 'enemy' : 'good'
    );
  };

  // Build turn order & start combat
  const startCombat = useCallback(() => {
    const alive = units.filter((u) => u.hp > 0);
    const sorted = [...alive].sort((a, b) => {
      const spdDiff = getEffectiveStats(b).spd - getEffectiveStats(a).spd;
      if (spdDiff !== 0) return spdDiff;
      return a.kind === 'hero' ? -1 : 1;
    });
    setOrder(sorted);
    setTurnIndex(0);
    setPhase('playing');
    setPaused(false);
    addLog('Trận đấu bắt đầu! Thứ tự lượt sắp xếp theo Tốc độ (SPD).', 'good');
  }, [units, getEffectiveStats, addLog]);

  // Handle terrain entry on step
  const resolveTerrainStep = useCallback(
    (unit: Unit, newX: number, newY: number) => {
      // Never trigger traps, lava, or teleport portals while marching out to the next floor!
      if (phase === 'exiting') return;

      const key = `${newX},${newY}`;
      const tile = terrainMap.get(key);
      if (!tile) return;

      if (tile.type === 'trap' && !triggeredTraps.has(key)) {
        sound.playTrap();
        setTriggeredTraps((prev) => new Set(prev).add(key));
        unit.hp = Math.max(0, unit.hp - 5);
        addLog(`<b>${unit.name}</b> đạp phải bẫy chông, mất 5 HP!`, 'enemy');
        triggerEffect(unit, unit, 'enemy', 5);
      } else if (tile.type === 'lava') {
        unit.hp = Math.max(0, unit.hp - 4);
        addLog(`<b>${unit.name}</b> bước qua dung nham, bỏng 4 HP!`, 'enemy');
        triggerEffect(unit, unit, 'fire', 4);
      } else if (tile.type === 'altar') {
        // Sacred Altar blessing
        sound.playHeal();
        const effMaxHp = getEffectiveStats(unit).hp;
        unit.hp = Math.min(effMaxHp, unit.hp + 4);
        triggerEffect(unit, unit, 'heal', -4, false, 'THÁNH ĐÀI HỒI PHỤC!');
        addLog(`<b>${unit.name}</b> nhận phước lành từ Đài Tế: Hồi 4 HP!`, 'good');
      } else if (tile.type === 'portal' && portalPoints.length === 2) {
        const dest = portalPoints.find((p) => p.x !== newX || p.y !== newY);
        if (dest && !isOccupied(dest.x, dest.y, units, unit.id)) {
          sound.playMagic();
          unit.animation = {
            fromX: newX,
            fromY: newY,
            toX: dest.x,
            toY: dest.y,
            start: performance.now(),
            duration: 400,
          };
          unit.x = dest.x;
          unit.y = dest.y;
          unit.elevation = elevations.has(`${dest.x},${dest.y}`) ? 1 : 0;
          triggerEffect(dest, dest, 'stat_up', 0, false, 'DỊCH CHUYỂN 0 MP!');
          addLog(`🌀 <b>${unit.name}</b> dịch chuyển tức thời qua cổng không gian (<b>Hoàn toàn MIỄN PHÍ 0 MP</b>)!`, 'good');
        }
      }
    },
    [phase, terrainMap, triggeredTraps, portalPoints, units, getEffectiveStats, addLog, triggerEffect, elevations]
  );

  // Move unit to tile (Each 1 tile costs 1 MP for heroes, Portal is FREE 0 MP!)
  const moveUnit = useCallback(
    (unit: Unit, x: number, y: number, stepsCount?: number) => {
      const fromX = unit.x;
      const fromY = unit.y;
      const steps = stepsCount ?? (Math.abs(x - fromX) + Math.abs(y - fromY));

      unit.animation = {
        fromX,
        fromY,
        toX: x,
        toY: y,
        start: performance.now(),
        duration: 300,
      };
      unit.x = x;
      unit.y = y;
      unit.moved = true;
      unit.elevation = elevations.has(`${x},${y}`) ? 1 : 0;

      // Every 1 tile moved costs 1 MP for heroes in combat, BUT using Portal is FREE 0 MP, and exiting phase is FREE!
      if (unit.kind === 'hero' && phase !== 'exiting') {
        const isPortalTile = terrainMap.get(`${x},${y}`)?.type === 'portal';
        const mpCost = isPortalTile ? 0 : Math.min(unit.mp, steps);
        if (mpCost > 0) {
          unit.mp = Math.max(0, unit.mp - mpCost);
          recordHeroAction(unit, 'move');
          triggerEffect({ x: fromX, y: fromY }, { x, y }, 'stat_up', 0, false, `-${mpCost} MP`);
          addLog(`👣 <b>${unit.name}</b> di chuyển ${steps} ô (tiêu hao <b>${mpCost} MP</b>, còn ${unit.mp} MP).`, 'normal');
        } else if (isPortalTile) {
          recordHeroAction(unit, 'move');
          triggerEffect({ x, y }, { x, y }, 'stat_up', 0, false, 'CỔNG 0 MP!');
          addLog(`🌀 <b>${unit.name}</b> bước vào Cổng Không Gian (<b>0 MP - Miễn phí</b>).`, 'good');
        }
      }

      resolveTerrainStep(unit, x, y);
    },
    [phase, recordHeroAction, resolveTerrainStep, elevations, triggerEffect, addLog, terrainMap]
  );

  // Roll enemy loot on defeat
  const dropLoot = useCallback(
    (enemy: Unit) => {
      const earnedGold = enemy.boss
        ? 35 + Math.floor(Math.random() * 20)
        : 4 + Math.floor(Math.random() * 6);
      sound.playGold();
      setGold((prev) => prev + earnedGold);
      setFloorGoldEarned((prev) => prev + earnedGold);
      addLog(`Rơi <b>+${earnedGold} đồng</b> từ ${enemy.name}.`, 'item');

      const dropRate = enemy.boss ? 0.98 : 0.38;
      if (Math.random() <= dropRate) {
        const weights = enemy.boss
          ? (floor >= 8 ? [0, 5, 15, 35, 30, 15] : [0, 10, 35, 35, 15, 5])
          : (floor >= 8 ? [20, 25, 25, 18, 9, 3] : floor >= 4 ? [35, 30, 20, 11, 4, 0] : [55, 28, 12, 4, 1, 0]);
        let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
        let rarity = 1;
        for (let i = 0; i < weights.length; i++) {
          roll -= weights[i];
          if (roll <= 0) {
            rarity = i + 1;
            break;
          }
        }
        const template = GEAR_CATALOG[Math.floor(Math.random() * GEAR_CATALOG.length)];
        const item = createGear(template, rarity, floor);
        setInventory((prev) => [item, ...prev.slice(0, 39)]);
        setFloorLootFound((prev) => [item, ...prev]);
        addLog(
          `Tìm thấy trang bị ${rarity >= 5 ? 'QUÝ HIẾM' : ''}: <b>${item.icon} ${item.name}</b> (${'★'.repeat(rarity)})!`,
          rarity >= 4 ? 'good' : 'item'
        );
      }
    },
    [floor, createGear, addLog]
  );

  // Award EXP and handle level ups scaled by monster level & boss status
  const awardExp = useCallback(
    (killer: Unit, defeatedEnemy?: Unit) => {
      const livingHeroes = units.filter((u) => u.kind === 'hero' && u.hp > 0 && !u.isSummon);
      const enemyObj = defeatedEnemy || { level: floor, boss: false };

      livingHeroes.forEach((hero) => {
        const isKiller = hero.id === killer.id;
        const gained = calculateMonsterExp(enemyObj, isKiller);
        hero.exp += gained;

        let leveledUp = false;
        let threshold = getHeroLevelExpThreshold(hero.level);
        while (hero.exp >= threshold) {
          hero.exp -= threshold;
          hero.level += 1;
          hero.maxHp += 5;
          hero.maxMp += 3;
          hero.atk += 1;
          hero.matk += 1;
          hero.def += 1;
          hero.hp = Math.min(getEffectiveStats(hero).hp, hero.hp + 8);
          leveledUp = true;
          threshold = getHeroLevelExpThreshold(hero.level);
        }

        if (leveledUp) {
          sound.playLevelUp();
          addLog(`✦ <b>${hero.name}</b> nhận <b>+${gained} EXP</b> và thăng cấp lên <b>Cấp ${hero.level}</b> (+5 Máu, +3 MP, +1 Công, +1 Phép, +1 Giáp)!`, 'good');
        } else if (isKiller) {
          addLog(`✦ <b>${hero.name}</b> kết liễu <b>${defeatedEnemy?.name || 'kẻ địch'}</b>, nhận <b>+${gained} EXP</b>!`, 'good');
        }

        setHeroRoster((prev) =>
          prev.map((h) =>
            h.id === hero.id
              ? {
                  ...h,
                  level: hero.level,
                  exp: hero.exp,
                  maxHp: hero.maxHp,
                  maxMp: hero.maxMp,
                  atk: hero.atk,
                  matk: hero.matk,
                  def: hero.def,
                  spd: hero.spd,
                }
              : h
          )
        );
      });
    },
    [units, floor, getEffectiveStats, addLog]
  );

  const shakeScreen = (intensity: number = 8) => {
    setScreenShake(intensity);
    setTimeout(() => setScreenShake(0), 200);
  };

  // Detonate an explosive barrel with 3x3 blast and chain reactions
  const detonateBarrel = useCallback(
    (barrelId: string) => {
      setBarrels((prev) => {
        const barrel = prev.find((b) => b.id === barrelId);
        if (!barrel || barrel.hp <= 0) return prev;

        const nextBarrels = prev.map((b) => (b.id === barrelId ? { ...b, hp: 0 } : b));
        sound.playExplosion();
        shakeScreen(14);

        // Visual Explosion effect
        triggerEffect(barrel, barrel, 'barrel_explosion', 0, true, '💥 NỔ TUNG!');
        addLog(`💥 <b>Thùng Thuốc Nổ nổ tung dữ dội</b>, gây sát thương diện rộng 3x3!`, 'skill');

        // Ignite any oil tiles in 3x3 blast radius into raging fire ground
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const ox = barrel.x + dx;
            const oy = barrel.y + dy;
            const oKey = `${ox},${oy}`;
            if (terrainMap.get(oKey)?.type === 'oil') {
              terrainMap.set(oKey, { type: 'fire_ground' });
              triggerEffect(barrel, { x: ox, y: oy }, 'oil_ignite', 0, false, 'DẦU CHÁY!');
              addLog(`🔥 <b>Vệt Dầu (${ox + 1}, ${oy + 1})</b> bắt lửa bốc cháy ngùn ngụt lan rộng khắp sàn đấu!`, 'skill');
            }
          }
        }

        // Damage units in 3x3 radius
        units
          .filter((u) => u.hp > 0 && Math.abs(u.x - barrel.x) <= 1 && Math.abs(u.y - barrel.y) <= 1)
          .forEach((targetUnit) => {
            const blastDmg = 18 + Math.floor(Math.random() * 10);
            targetUnit.hp = Math.max(0, targetUnit.hp - blastDmg);
            targetUnit.burnTicks = 2;
            targetUnit.combatAnim = {
              type: 'hit',
              fromX: barrel.x,
              fromY: barrel.y,
              startTime: performance.now(),
              duration: 250,
            };
            triggerEffect(barrel, targetUnit, 'fire', blastDmg, true, 'SÓNG NỔ!');
            addLog(`💥 Sóng nổ thiêu đốt <b>${targetUnit.name}</b>, gây <b>${blastDmg}</b> sát thương hỏa diễm!`, 'skill');
            if (targetUnit.hp === 0) {
              if (targetUnit.kind === 'enemy') {
                targetUnit.deathAnim = { startTime: performance.now(), duration: 1200 };
                dropLoot(targetUnit);
              } else if (targetUnit.kind === 'hero') {
                targetUnit.isDowned = true;
                targetUnit.deathAnim = { startTime: performance.now(), duration: 3000 };
                sound.playDowned();
                addLog(`💀 <b>${targetUnit.name}</b> đã gục ngã kiệt sức trước vụ nổ!`, 'enemy');
              }
            }
          });

        // Chain detonate neighboring barrels
        prev
          .filter((b) => b.id !== barrelId && b.hp > 0 && Math.abs(b.x - barrel.x) <= 1 && Math.abs(b.y - barrel.y) <= 1)
          .forEach((neighborBarrel) => {
            setTimeout(() => {
              detonateBarrel(neighborBarrel.id);
            }, 140);
          });

        return nextBarrels;
      });
    },
    [units, terrainMap, triggerEffect, addLog, dropLoot]
  );

  // Perform physical / magical attack with rich use-based stat progression and tactical reactions
  const executeAttack = useCallback(
    (attacker: Unit, target: Unit) => {
      const attEff = getEffectiveStats(attacker);
      const tarEff = getEffectiveStats(target);
      const weapon = equipped[attacker.id]?.weapon;

      // 1. ELEVATION CHECK: Melee cannot attack across elevation tiers!
      const attElev = elevations.has(`${attacker.x},${attacker.y}`) ? 1 : 0;
      const tarElev = elevations.has(`${target.x},${target.y}`) ? 1 : 0;
      const isRangedWeapon = attEff.range >= 2;

      if (attElev !== tarElev && !isRangedWeapon) {
        sound.playTrap();
        addLog(`⚠️ <b>${attacker.name}</b> đánh cận chiến không thể chạm tới mục tiêu ở tầng cao khác biệt! Hãy dùng cung/phép hoặc leo lên cùng bậc!`, 'normal');
        return;
      }

      gainWeaponMastery(attacker);

      // Trigger smooth attack lunge & target hit recoil animations
      attacker.combatAnim = {
        type: 'lunge',
        targetX: target.x,
        targetY: target.y,
        startTime: performance.now(),
        duration: 250,
      };
      target.combatAnim = {
        type: 'hit',
        fromX: attacker.x,
        fromY: attacker.y,
        startTime: performance.now(),
        duration: 250,
      };

      const isMagical =
        attacker.kind === 'hero'
          ? weapon?.family === 'staff' ||
            weapon?.family === 'tome' ||
            weapon?.family === 'bell'
          : attacker.species === 'beholder' ||
            attacker.species === 'banshee' ||
            attacker.matk > attacker.atk;

      if (attacker.kind === 'hero') {
        if (isMagical) {
          recordHeroAction(attacker, 'magic');
        } else {
          recordHeroAction(attacker, 'melee');
        }
      }

      if (target.kind === 'hero') {
        recordHeroAction(target, 'damage_taken');
      }

      let basePower = isMagical ? attEff.matk : attEff.atk;
      let isCrit = Math.random() < (weapon?.family === 'dagger' ? 0.35 : 0.15);

      // HIGH GROUND ADVANTAGE: Attacking from high elevation downwards grants +25% bonus damage!
      if (attElev > tarElev && isRangedWeapon) {
        basePower = Math.round(basePower * 1.25);
        triggerEffect(attacker, target, 'arrow', 0, false, 'CAO ĐIỂM +25%!');
      }

      // PASSIVE: Linh / Bow sniper from distance
      if (weapon?.family === 'bow' && manhattan(attacker, target) >= 3) {
        if (Math.random() < 0.4) isCrit = true;
        basePower = Math.round(basePower * 1.25);
        triggerEffect(attacker, target, 'arrow', 0, false, 'BẮN XA!');
      }

      // PASSIVE: Sword Ki stacks
      if (weapon?.family === 'sword') {
        attacker.swordKiStacks = Math.min(5, (attacker.swordKiStacks || 0) + 1);
        if (target.hp < tarEff.hp * 0.4) {
          basePower = Math.round(basePower * 1.35);
          triggerEffect(attacker, target, 'strike', 0, false, 'KIẾM KHÍ!');
        }
      }

      const critMult = isCrit ? 1.55 : 1.0;
      let effectiveDef = attacker.species === 'banshee' ? Math.round(tarEff.def * 0.4) : tarEff.def;
      let rawDamage = Math.max(1, Math.round(basePower * critMult - effectiveDef - (target.guard || 0)));

      // ELEMENTAL COMBO: FROZEN TARGET SHATTER (Vỡ Vụn)
      if (target.frozenTicks && target.frozenTicks > 0) {
        if (weapon?.family === 'hammer' || weapon?.family === 'axe' || weapon?.family === 'sword' || weapon?.family === 'spear' || !isMagical) {
          rawDamage = Math.round(rawDamage * 2.0);
          target.frozenTicks = 0;
          sound.playShatter();
          shakeScreen(10);
          triggerEffect(attacker, target, 'shatter', rawDamage, true, 'VỠ VỤN CRIT!');
          addLog(`❄️⚡ <b>COMBO VỠ VỤN (SHATTER)!</b> <b>${attacker.name}</b> giáng đòn đập tan khối băng, gây gấp đôi sát thương chí mạng (<b>${rawDamage}</b> dmg) lên ${target.name}!`, 'skill');
        }
      }

      // ELEMENTAL COMBO: OIL IGNITE (Dầu & Hỏa Diễm)
      const targetTileKey = `${target.x},${target.y}`;
      const isFireAttack = isMagical && (weapon?.family === 'staff' || attacker.species === 'ash-archer' || attacker.transformation?.type === 'dragon');
      if (terrainMap.get(targetTileKey)?.type === 'oil' && isFireAttack) {
        terrainMap.set(targetTileKey, { type: 'fire_ground' });
        target.burnTicks = 3;
        const oilBurnDmg = 8;
        target.hp = Math.max(0, target.hp - oilBurnDmg);
        sound.playMagic();
        shakeScreen(7);
        triggerEffect(attacker, target, 'oil_ignite', oilBurnDmg, true, 'DẦU CHÁY BÙNG!');
        addLog(`🔥 <b>COMBO HỎA DIỄM:</b> Đòn lửa làm vệt dầu dưới chân <b>${target.name}</b> bốc cháy ngùn ngụt (+${oilBurnDmg} sát thương thiêu đốt)!`, 'skill');
      }

      // Tome Frostbite Freeze
      if (weapon?.family === 'tome' && !target.boss && (target.frozenTicks || 0) <= 0) {
        target.frozenTicks = 2;
        triggerEffect(attacker, target, 'spell', 0, false, 'ĐÓNG BĂNG!');
        addLog(`❄️ <b>${attacker.name}</b> sử dụng cổ ngữ Băng Sương đóng băng <b>${target.name}</b> trong 2 lượt!`, 'skill');
      }

      // Shield wearer damage dampening
      if (equipped[target.id]?.shield) {
        rawDamage = Math.max(1, Math.round(rawDamage * 0.78));
      }

      // Magic Ward on Monsters: Resists 65% magic damage & reflects back when attacked from range
      if (target.magicWard && attacker.kind === 'hero' && (weapon?.family === 'staff' || weapon?.family === 'tome')) {
        rawDamage = Math.max(1, Math.round(rawDamage * 0.35));
        if (manhattan(attacker, target) >= 2) {
          const reflectedDmg = Math.max(2, Math.round(rawDamage * 0.65));
          attacker.hp = Math.max(0, attacker.hp - reflectedDmg);
          triggerEffect(target, attacker, 'magic_reflect', reflectedDmg, false, 'PHẢN MA!');
          addLog(`🛡 <b>${target.name}</b> kích hoạt Khiên Phản Ma, giảm 65% ma pháp và phản <b>${reflectedDmg}</b> sát thương về phía ${attacker.name}!`, 'enemy');
        }
      }

      target.hp = Math.max(0, target.hp - rawDamage);
      target.guard = 0;

      // Lifesteal on attacker
      const lifestealRate =
        (equipped[attacker.id]?.weapon?.stats?.lifesteal || 0) +
        (equipped[attacker.id]?.ring?.stats?.lifesteal || 0) +
        (attacker.transformation?.type === 'werewolf' ? 0.4 : 0);
      if (lifestealRate > 0 && rawDamage > 0) {
        const stolen = Math.max(1, Math.round(rawDamage * lifestealRate));
        attacker.hp = Math.min(attEff.hp, attacker.hp + stolen);
        triggerEffect(attacker, attacker, 'heal', -stolen, false, `+${stolen} HÚT MÁU`);
      }

      // Thorns / Damage Reflection on target
      const thornsRate =
        (target.thornsPct || 0) +
        (equipped[target.id]?.armor?.stats?.thorns || 0) +
        (equipped[target.id]?.shield?.stats?.thorns || 0) +
        (equipped[target.id]?.ring?.stats?.thorns || 0) +
        (target.bastionTicks ? 0.45 : 0) +
        (target.transformation?.type === 'juggernaut' ? 0.5 : 0);
      if (thornsRate > 0 && rawDamage > 0 && attacker.hp > 0) {
        const reflected = Math.max(1, Math.round(rawDamage * thornsRate));
        attacker.hp = Math.max(0, attacker.hp - reflected);
        sound.playShieldBash();
        triggerEffect(target, attacker, 'thorns', reflected, false, 'PHẢN ĐÒN!');
        addLog(`⚡ <b>${target.name}</b> phản lại <b>${reflected} sát thương gai</b> cho ${attacker.name}!`, 'item');
        if (attacker.hp === 0 && attacker.kind === 'enemy') {
          dropLoot(attacker);
        }
      }

      // Medusa Petrify chance on hit
      const medusaGear = Object.values(equipped[attacker.id] || {}).find(
        (it) => it?.name?.includes('Medusa')
      );
      if (medusaGear && Math.random() < 0.35 && !target.boss && (target.petrifiedTicks || 0) <= 0) {
        target.petrifiedTicks = 2;
        sound.playTrap();
        triggerEffect(attacker, target, 'petrify', 0, false, 'HÓA ĐÁ!');
        addLog(`🗿 <b>${target.name}</b> bị ánh mắt Medusa hóa thành tượng đá trong 2 lượt!`, 'skill');
      }

      // Dragon Soul Splash on surrounding tiles
      if (attacker.transformation?.type === 'dragon' && rawDamage > 0) {
        const splashTargets = units.filter(
          (u) => u.kind !== attacker.kind && u.hp > 0 && u.id !== target.id && manhattan(target, u) <= 1
        );
        splashTargets.forEach((st) => {
          const splashDmg = Math.max(2, Math.round(rawDamage * 0.5));
          st.hp = Math.max(0, st.hp - splashDmg);
          st.burnTicks = 2;
          triggerEffect(target, st, 'fire', splashDmg, false, 'LONG HỎA!');
          if (st.hp === 0 && st.kind === 'enemy') {
            dropLoot(st);
            awardExp(attacker, st);
          }
        });
        if (splashTargets.length > 0) {
          addLog(`🐉 <b>${attacker.name}</b> quét Long Hỏa lan ra ${splashTargets.length} mục tiêu xung quanh!`, 'skill');
        }
      }

      // TACTICAL KNOCKBACK & WALL SLAM STUN (1-2 Tiles push with Obstacle / Monster collision)
      const isPushWeapon = Boolean(weapon?.family && ['sword', 'axe', 'hammer', 'spear', 'bow', 'crossbow'].includes(weapon.family as WeaponFamily));
      const hasKnockback = isPushWeapon || attacker.species === 'golem';

      if (hasKnockback && rawDamage > 0 && target.hp > 0 && !target.boss) {
        const kdx = Math.sign(target.x - attacker.x);
        const kdy = Math.sign(target.y - attacker.y);
        if (kdx !== 0 || kdy !== 0) {
          // Push 2 tiles for heavy weapons (hammer, axe, bow, shield, or golem); 1 tile for other weapons
          const maxPush = (weapon?.family === 'hammer' || weapon?.family === 'axe' || weapon?.family === 'bow' || equipped[attacker.id]?.shield || attacker.species === 'golem') ? 2 : 1;
          
          let currentTargetX = target.x;
          let currentTargetY = target.y;
          let hitObstacle = false;
          let actualPushedSteps = 0;

          for (let step = 1; step <= maxPush; step++) {
            const nextX = currentTargetX + kdx;
            const nextY = currentTargetY + kdy;
            const nextKey = `${nextX},${nextY}`;

            // 1. Check out of bounds or solid walls
            const isOutOfBounds = nextX < 0 || nextX >= GRID_COLS || nextY < 0 || nextY >= GRID_ROWS;
            const isWallTile = walls.has(nextKey);
            const isIronBars = terrainMap.get(nextKey)?.type === 'iron_bars';

            // 2. Check collision with another living unit
            const collidedUnit = units.find((u) => u.hp > 0 && u.id !== target.id && u.x === nextX && u.y === nextY);

            // 3. Check collision with explosive barrel
            const hitBarrel = barrels.find((b) => b.hp > 0 && b.x === nextX && b.y === nextY);

            if (isOutOfBounds || isWallTile || isIronBars) {
              // WALL SLAM!
              hitObstacle = true;
              const slamDmg = Math.max(5, Math.round(basePower * 0.55));
              target.hp = Math.max(0, target.hp - slamDmg);
              target.isStunned = true;
              target.stunTicks = 1;
              sound.playWallSlam();
              shakeScreen(10);
              triggerEffect(target, target, 'wall_slam', slamDmg, true, 'VA TƯỜNG CHOÁNG!');
              addLog(`💥 <b>${target.name}</b> bị đánh văng va đập mạnh vào ${isIronBars ? 'song sắt' : 'tường đá'}, nhận thêm <b>${slamDmg}</b> sát thương va đập và bị <b>CHOÁNG (mất hoàn toàn lượt đi)</b>!`, 'skill');
              break;
            } else if (collidedUnit) {
              // UNIT COLLISION SLAM! (Kẻ địch đâm sầm vào Quái/Tướng khác)
              hitObstacle = true;
              const slamDmg = Math.max(4, Math.round(basePower * 0.5));
              const collDmg = Math.max(3, Math.round(slamDmg * 0.75));
              
              target.hp = Math.max(0, target.hp - slamDmg);
              target.isStunned = true;
              target.stunTicks = 1;

              collidedUnit.hp = Math.max(0, collidedUnit.hp - collDmg);
              collidedUnit.combatAnim = {
                type: 'hit',
                fromX: target.x,
                fromY: target.y,
                startTime: performance.now(),
                duration: 250,
              };

              sound.playWallSlam();
              shakeScreen(9);
              triggerEffect(target, target, 'wall_slam', slamDmg, true, 'VA CHẠM CHOÁNG!');
              triggerEffect(target, collidedUnit, 'bash', collDmg, false, 'VA ĐẬP!');
              addLog(`💥 <b>${target.name}</b> bị hất văng đâm sầm vào <b>${collidedUnit.name}</b>! Cả 2 cùng chịu sát thương va chạm và ${target.name} bị <b>CHOÁNG (mất lượt)</b>!`, 'skill');

              if (collidedUnit.hp === 0 && collidedUnit.kind === 'enemy') {
                dropLoot(collidedUnit);
                awardExp(attacker, collidedUnit);
              }
              break;
            } else if (hitBarrel) {
              // HIT EXPLOSIVE BARREL! (Đẩy văng trúng Thùng Thuốc Nổ)
              hitObstacle = true;
              const slamDmg = Math.max(4, Math.round(basePower * 0.45));
              target.hp = Math.max(0, target.hp - slamDmg);
              target.isStunned = true;
              target.stunTicks = 1;
              sound.playWallSlam();
              triggerEffect(target, target, 'wall_slam', slamDmg, true, 'VA THÙNG THUỐC NỔ!');
              addLog(`💥 <b>${target.name}</b> bị văng lùi đập trúng <b>Thùng Thuốc Nổ</b> kích hoạt nổ tung!`, 'skill');
              detonateBarrel(hitBarrel.id);
              break;
            } else {
              // Tile is clear: move target to next tile
              currentTargetX = nextX;
              currentTargetY = nextY;
              target.x = nextX;
              target.y = nextY;
              target.elevation = elevations.has(nextKey) ? 1 : 0;
              actualPushedSteps++;
            }
          }

          if (!hitObstacle && actualPushedSteps > 0) {
            target.combatAnim = {
              type: 'hit',
              fromX: attacker.x,
              fromY: attacker.y,
              startTime: performance.now(),
              duration: 250,
            };
            addLog(`💨 <b>${target.name}</b> bị lực đánh đẩy lùi ${actualPushedSteps} ô về phía sau!`, 'normal');
          }
        }
      }

      // Sound & Dynamic Visual FX based on Weapon / Monster
      if (attacker.kind === 'hero') {
        if (weapon?.family === 'bow' || weapon?.family === 'crossbow') {
          sound.playArrow();
          triggerEffect(attacker, target, 'arrow', rawDamage, isCrit);
        } else if (weapon?.family === 'staff' || weapon?.family === 'tome') {
          sound.playMagic();
          triggerEffect(attacker, target, 'fire', rawDamage, isCrit);
        } else if (weapon?.family === 'bell') {
          sound.playHeal();
          triggerEffect(attacker, target, 'spell', rawDamage, isCrit);
        } else if (weapon?.family === 'hammer' || weapon?.family === 'axe') {
          sound.playShieldBash();
          triggerEffect(attacker, target, 'bash', rawDamage, isCrit);
        } else {
          sound.playSlash();
          triggerEffect(attacker, target, 'strike', rawDamage, isCrit);
        }
      } else {
        if (attacker.species === 'kraken') {
          sound.playShieldBash();
          triggerEffect(attacker, target, 'tentacle', rawDamage, isCrit);
        } else if (attacker.species === 'beholder') {
          sound.playMagic();
          triggerEffect(attacker, target, 'eye_ray', rawDamage, isCrit);
        } else if (attacker.species === 'treant') {
          sound.playShieldBash();
          triggerEffect(attacker, target, 'entangle', rawDamage, isCrit);
        } else if (attacker.species === 'banshee') {
          sound.playMagic();
          triggerEffect(attacker, target, 'wail', rawDamage, isCrit);
        } else if (attacker.species === 'cerberus') {
          sound.playSlash();
          triggerEffect(attacker, target, 'claw3', rawDamage, isCrit);
        } else {
          sound.playSlash();
          triggerEffect(attacker, target, 'strike', rawDamage, isCrit);
        }
      }

      if (isCrit) {
        shakeScreen(7);
      }

      addLog(
        `<b>${attacker.name}</b> tấn công <b>${target.name}</b>, gây <b>${rawDamage}</b> sát thương${
          isCrit ? ' (BẠO KÍCH!)' : ''
        }${target.hp === 0 ? ' [HẠ GỤC]' : ''}.`,
        attacker.kind === 'hero' ? 'good' : 'enemy'
      );

      if (target.hp === 0) {
        if (target.kind === 'enemy' && target.canRebirth && !target.reborn) {
          target.reborn = true;
          target.hp = Math.round(target.maxHp * 0.55);
          sound.playLevelUp();
          triggerEffect(target, target, 'reborn', 0, false, 'HỒI SINH BẤT TỬ!');
          addLog(`💀 <b>${target.name}</b> vỡ vụn nhưng đã HỒI SINH BẤT TỬ với 55% Máu và bộc phát Bão Băng buốt giá!`, 'enemy');
          // Icy blast hits nearby heroes
          units
            .filter((u) => u.kind === 'hero' && u.hp > 0 && manhattan(u, target) <= 2)
            .forEach((hu) => {
              const frostDmg = Math.max(3, Math.round(target.matk * 0.65));
              hu.hp = Math.max(0, hu.hp - frostDmg);
              hu.spd = Math.max(1, hu.spd - 2);
              hu.frozenTicks = 2;
              triggerEffect(target, hu, 'spell', frostDmg, false, 'BĂNG GIÁ!');
            });
          shakeScreen(8);
        } else if (target.kind === 'enemy') {
          target.deathAnim = { startTime: performance.now(), duration: 1200 };
          dropLoot(target);
          awardExp(attacker, target);
        } else if (target.kind === 'hero') {
          target.isDowned = true;
          target.deathAnim = { startTime: performance.now(), duration: 3000 };
          sound.playDowned();
          addLog(`💀 <b>${target.name}</b> đã gục ngã kiệt sức!`, 'enemy');
        }
      }

      attacker.acted = true;
    },
    [
      gainWeaponMastery,
      getEffectiveStats,
      equipped,
      elevations,
      barrels,
      walls,
      units,
      detonateBarrel,
      recordHeroAction,
      triggerEffect,
      addLog,
      dropLoot,
      awardExp,
    ]
  );

  // End a unit's turn and advance
  const finishTurn = useCallback(
    (unit: Unit) => {
      unit.acted = true;
      setMoveTiles([]);
      setTargetTiles([]);
      setTargetingAction(null);

      // Status ticks for this unit
      if (unit.skillCooldown && unit.skillCooldown > 0) {
        unit.skillCooldown -= 1;
      }
      if (unit.petrifiedTicks && unit.petrifiedTicks > 0) {
        unit.petrifiedTicks -= 1;
        if (unit.petrifiedTicks === 0) {
          addLog(`✦ <b>${unit.name}</b> đã tan lớp hóa đá, khôi phục khả năng cử động!`, 'normal');
        }
      }
      if (unit.bastionTicks && unit.bastionTicks > 0) {
        unit.bastionTicks -= 1;
      }
      if (unit.transformation) {
        unit.transformation.turnsRemaining -= 1;
        if (unit.transformation.turnsRemaining <= 0) {
          addLog(`✦ <b>${unit.name}</b> đã kết thúc trạng thái hóa thân <b>${unit.transformation.name}</b>!`, 'normal');
          unit.glyph = unit.transformation.originalGlyph;
          unit.color = unit.transformation.originalColor;
          unit.transformation = null;
          unit.rageMode = false;
        }
      }
      if (unit.isSummon) {
        unit.summonTurns = (unit.summonTurns || 1) - 1;
        if (unit.summonTurns <= 0) {
          unit.hp = 0;
          addLog(`✦ Linh thú <b>${unit.name}</b> đã hoàn tất nhiệm vụ hiệu triệu và tan biến.`, 'normal');
        }
      }

      // Purge any dead summons immediately from units and order so they NEVER linger on battlefield or party!
      setUnits((prev) => prev.filter((u) => !(u.isSummon && u.hp <= 0)));
      setOrder((prev) => prev.filter((u) => !(u.isSummon && u.hp <= 0)));

      const livingHeroes = units.filter((u) => u.kind === 'hero' && u.hp > 0 && !u.isSummon);
      const livingEnemies = units.filter((u) => u.kind === 'enemy' && u.hp > 0);

      if (livingEnemies.length === 0) {
        if (floorBoss) {
          setPhase('boss_victory_cutscene');
          setActiveId(null);
          addLog('🏆 <b>CHIẾN THẮNG TRÙM ĐẠI THÀNH!</b> Toàn đội ca khúc khải hoàn và mở rương báu!', 'good');
          return;
        }
        setPhase('exiting');
        setActiveId(null);
        addLog('Toàn bộ quái vật đã bị tiêu diệt! Đoàn thám hiểm đang rút lui qua cổng tiếp theo.', 'good');
        return;
      }

      if (livingHeroes.length === 0) {
        setPhase('lost');
        setGameOverResult('lost');
        sound.playTrap();
        addLog('Đoàn thám hiểm đã thất thủ hoàn toàn! Thử lại phòng này.', 'enemy');
        return;
      }

      setTurnIndex((prev) => prev + 1);
    },
    [units, addLog, floorBoss]
  );

  // Execute active Special Skill (Summoning, Transformation, AoE Meteor/Lightning, Petrify, Bastion, Crit)
  const executeSpecialSkill = useCallback(
    (caster: Unit, item: GearItem, target?: Unit): boolean => {
      const skill = item.specialSkill;
      const mpCost = item.specialSkillMp || 4;
      if (!skill) return false;
      if ((caster.skillCooldown || 0) > 0) {
        addLog(`⏳ Kỹ năng <b>${item.specialSkillName}</b> đang hồi chiêu (${caster.skillCooldown} lượt nữa)!`, 'normal');
        return false;
      }
      if (caster.mp < mpCost) {
        addLog(`<b>${caster.name}</b> không đủ MP để thi triển <b>${item.specialSkillName}</b> (Cần ${mpCost} MP).`, 'normal');
        return false;
      }

      const eff = getEffectiveStats(caster);

      // 1. SUMMON WOLF
      if (skill === 'summon_wolf') {
        const freeNeighbors = [
          { x: caster.x + 1, y: caster.y },
          { x: caster.x - 1, y: caster.y },
          { x: caster.x, y: caster.y + 1 },
          { x: caster.x, y: caster.y - 1 },
        ].filter(p => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS && !walls.has(`${p.x},${p.y}`) && !isOccupied(p.x, p.y, units));

        if (freeNeighbors.length === 0) {
          addLog(`Không có khoảng trống lân cận để triệu hồi linh thú!`, 'normal');
          return false;
        }

        const spawn = freeNeighbors[0];
        caster.mp -= mpCost;
        const wolf: Unit = {
          id: `summon-wolf-${Date.now()}`,
          name: 'Sói Băng Linh Thú',
          role: 'LINH THÚ TRIỆU HỒI',
          kind: 'hero',
          glyph: '🐺',
          color: '#38bdf8',
          x: spawn.x,
          y: spawn.y,
          hp: 36,
          maxHp: 36,
          mp: 0,
          maxMp: 0,
          atk: Math.max(10, Math.round(eff.matk * 1.15)),
          matk: 0,
          def: 4,
          spd: 15,
          range: 1,
          move: 3,
          level: caster.level,
          exp: 0,
          acted: false,
          moved: false,
          guard: 0,
          isSummon: true,
          summonerId: caster.id,
          summonTurns: 4,
          species: 'wolf',
        };
        sound.playMagic();
        shakeScreen(6);
        triggerEffect(caster, wolf, 'summon', 0, false, 'TRIỆU HỒI!');
        setUnits((prev) => [...prev, wolf]);
        setOrder((prev) => [...prev, wolf]);
        addLog(`✦ <b>${caster.name}</b> hiệu triệu <b>Sói Băng Linh Thú</b> (36 HP, SPD 15) gia nhập trận chiến!`, 'good');
        recordHeroAction(caster, 'magic');
        return true;
      }

      // 2. SUMMON GOLEM
      if (skill === 'summon_golem') {
        const freeNeighbors = [
          { x: caster.x + 1, y: caster.y },
          { x: caster.x - 1, y: caster.y },
          { x: caster.x, y: caster.y + 1 },
          { x: caster.x, y: caster.y - 1 },
        ].filter(p => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS && !walls.has(`${p.x},${p.y}`) && !isOccupied(p.x, p.y, units));

        if (freeNeighbors.length === 0) return false;
        const spawn = freeNeighbors[0];
        caster.mp -= mpCost;
        const golem: Unit = {
          id: `summon-golem-${Date.now()}`,
          name: 'Thạch Golem Hộ Vệ',
          role: 'VỆ SĨ ĐÁ ĐỠ ĐÒN',
          kind: 'hero',
          glyph: '🗿',
          color: '#a8a29e',
          x: spawn.x,
          y: spawn.y,
          hp: 55,
          maxHp: 55,
          mp: 0,
          maxMp: 0,
          atk: 10,
          matk: 0,
          def: 9,
          spd: 6,
          range: 1,
          move: 2,
          level: caster.level,
          exp: 0,
          acted: false,
          moved: false,
          guard: 8,
          isSummon: true,
          summonerId: caster.id,
          summonTurns: 4,
          species: 'golem',
        };
        sound.playShieldBash();
        shakeScreen(7);
        triggerEffect(caster, golem, 'summon', 0, false, 'THẠCH GOLEM!');
        setUnits((prev) => [...prev, golem]);
        setOrder((prev) => [...prev, golem]);
        addLog(`✦ <b>${caster.name}</b> hiệu triệu <b>Thạch Golem Hộ Vệ</b> (55 HP, 9 Giáp) đập đất bảo vệ đoàn đồng hành!`, 'good');
        recordHeroAction(caster, 'magic');
        return true;
      }

      // 3. SUMMON FIRE SPRITE
      if (skill === 'summon_fire_sprite') {
        const freeNeighbors = [
          { x: caster.x + 1, y: caster.y },
          { x: caster.x - 1, y: caster.y },
          { x: caster.x, y: caster.y + 1 },
          { x: caster.x, y: caster.y - 1 },
        ].filter(p => p.x >= 0 && p.x < GRID_COLS && p.y >= 0 && p.y < GRID_ROWS && !walls.has(`${p.x},${p.y}`) && !isOccupied(p.x, p.y, units));

        if (freeNeighbors.length === 0) return false;
        const spawn = freeNeighbors[0];
        caster.mp -= mpCost;
        const sprite: Unit = {
          id: `summon-sprite-${Date.now()}`,
          name: 'Tinh Linh Lửa',
          role: 'TINH LINH BẮN TỈA',
          kind: 'hero',
          glyph: '🔥',
          color: '#f97316',
          x: spawn.x,
          y: spawn.y,
          hp: 26,
          maxHp: 26,
          mp: 10,
          maxMp: 10,
          atk: 8,
          matk: 14,
          def: 3,
          spd: 16,
          range: 3,
          move: 3,
          level: caster.level,
          exp: 0,
          acted: false,
          moved: false,
          guard: 0,
          isSummon: true,
          summonerId: caster.id,
          summonTurns: 3,
        };
        sound.playMagic();
        shakeScreen(5);
        triggerEffect(caster, sprite, 'summon', 0, false, 'TINH LINH LỬA!');
        setUnits((prev) => [...prev, sprite]);
        setOrder((prev) => [...prev, sprite]);
        addLog(`✦ <b>${caster.name}</b> triệu hồi <b>Tinh Linh Lửa</b> bắn tỉa từ xa!`, 'good');
        recordHeroAction(caster, 'magic');
        return true;
      }

      // 4. TRANSFORM WEREWOLF
      if (skill === 'transform_werewolf') {
        caster.mp -= mpCost;
        caster.transformation = {
          type: 'werewolf',
          turnsRemaining: 3,
          name: 'Ma Sói Huyết Nguyệt',
          originalGlyph: caster.glyph,
          originalColor: caster.color,
        };
        caster.glyph = '🐺';
        caster.color = '#ef4444';
        caster.rageMode = true;
        caster.hp = Math.min(eff.hp + 20, caster.hp + 16);
        sound.playBossRoar();
        shakeScreen(9);
        triggerEffect(caster, caster, 'transform', 0, true, 'HÓA MA SÓI!');
        addLog(`🐺 <b>${caster.name}</b> kích phát Huyết Nguyệt biến thành <b>Ma Sói</b> (+10 Công, +4 Tốc, 40% Hút Máu)!`, 'skill');
        recordHeroAction(caster, 'melee');
        return true;
      }

      // 5. TRANSFORM JUGGERNAUT
      if (skill === 'transform_juggernaut') {
        caster.mp -= mpCost;
        caster.transformation = {
          type: 'juggernaut',
          turnsRemaining: 3,
          name: 'Chiến Thần Thiết Thạch',
          originalGlyph: caster.glyph,
          originalColor: caster.color,
        };
        caster.glyph = '🤖';
        caster.color = '#94a3b8';
        caster.guard = 16;
        sound.playShieldBash();
        shakeScreen(8);
        triggerEffect(caster, caster, 'transform', 0, false, 'THẦN BINH TITAN!');
        addLog(`🤖 <b>${caster.name}</b> hóa thân thành <b>Khổng Thần Thiết Thạch</b> (+18 Giáp, Phản 50% sát thương)!`, 'skill');
        recordHeroAction(caster, 'defend');
        return true;
      }

      // 6. TRANSFORM DRAGON
      if (skill === 'transform_dragon') {
        caster.mp -= mpCost;
        caster.transformation = {
          type: 'dragon',
          turnsRemaining: 3,
          name: 'Cổ Long Hỏa Diễm',
          originalGlyph: caster.glyph,
          originalColor: caster.color,
        };
        caster.glyph = '🐉';
        caster.color = '#f97316';
        sound.playBossRoar();
        shakeScreen(10);
        triggerEffect(caster, caster, 'transform', 0, true, 'HÓA LONG HỒN!');
        addLog(`🐉 <b>${caster.name}</b> kích hoạt <b>Long Hồn Thượng Cổ</b> (+2 Tầm đánh, đòn đánh nổ lan thiêu đốt diện rộng)!`, 'skill');
        recordHeroAction(caster, 'magic');
        return true;
      }

      // 7. AOE METEOR
      if (skill === 'aoe_meteor') {
        const enemies = units.filter(u => u.kind === 'enemy' && u.hp > 0);
        if (enemies.length === 0) return false;
        const mainTarget = target || enemies.sort((a, b) => b.hp - a.hp)[0];

        caster.mp -= mpCost;
        sound.playMagic();
        shakeScreen(12);

        // 3x3 blast radius centered at mainTarget
        const blastTargets = enemies.filter(e => Math.abs(e.x - mainTarget.x) <= 1 && Math.abs(e.y - mainTarget.y) <= 1);
        blastTargets.forEach(bt => {
          const isCenter = bt.id === mainTarget.id;
          const dmg = Math.max(6, Math.round((eff.matk * (isCenter ? 1.85 : 1.35)) - bt.def * 0.5));
          bt.hp = Math.max(0, bt.hp - dmg);
          bt.burnTicks = 3;
          triggerEffect(caster, bt, 'meteor', dmg, isCenter, isCenter ? 'THIÊN THẠCH!' : 'BỎNG!');
          if (bt.hp === 0) {
            dropLoot(bt);
            awardExp(caster, bt);
          }
        });
        addLog(`☄️ <b>${caster.name}</b> giáng <b>Mưa Thiên Thạch</b> thiêu rụi ${blastTargets.length} mục tiêu trong vùng!`, 'skill');
        recordHeroAction(caster, 'magic', blastTargets.length);
        return true;
      }

      // 8. AOE CHAIN LIGHTNING
      if (skill === 'aoe_chain_lightning') {
        const enemies = units.filter(u => u.kind === 'enemy' && u.hp > 0);
        if (enemies.length === 0) return false;
        const mainTarget = target || enemies[0];

        caster.mp -= mpCost;
        sound.playMagic();
        shakeScreen(8);

        // Chain up to 4 enemies
        const chainTargets = [mainTarget, ...enemies.filter(e => e.id !== mainTarget.id)].slice(0, 4);
        chainTargets.forEach((ct, idx) => {
          const dmg = Math.max(5, Math.round(eff.matk * 1.45 - ct.def * 0.4));
          ct.hp = Math.max(0, ct.hp - dmg);
          ct.stun = 1;
          const fromUnit = idx === 0 ? caster : chainTargets[idx - 1];
          triggerEffect(fromUnit, ct, 'lightning', dmg, true, 'CHOÁNG!');
          if (ct.hp === 0) {
            dropLoot(ct);
            awardExp(caster, ct);
          }
        });
        addLog(`⚡ <b>${caster.name}</b> phóng <b>Bão Sét Liên Hoàn</b> giật qua ${chainTargets.length} kẻ địch và làm choáng!`, 'skill');
        recordHeroAction(caster, 'magic', chainTargets.length);
        return true;
      }

      // 9. AOE EARTHQUAKE
      if (skill === 'aoe_earthquake') {
        const enemies = units.filter(u => u.kind === 'enemy' && u.hp > 0);
        if (enemies.length === 0) return false;
        const mainTarget = target || enemies[0];

        caster.mp -= mpCost;
        sound.playShieldBash();
        shakeScreen(10);

        // Cross line targets
        const crossTargets = enemies.filter(e => Math.abs(e.x - mainTarget.x) <= 2 && Math.abs(e.y - mainTarget.y) <= 2);
        crossTargets.forEach(ct => {
          const dmg = Math.max(5, Math.round(eff.atk * 1.4 - ct.def));
          ct.hp = Math.max(0, ct.hp - dmg);
          triggerEffect(caster, ct, 'bash', dmg, true, 'ĐỊA CHẤN!');
          if (ct.hp === 0) {
            dropLoot(ct);
            awardExp(caster, ct);
          }
        });
        addLog(`🌋 <b>${caster.name}</b> nện búa tạo <b>Địa Chấn Nứt Đất</b> càn quét ${crossTargets.length} kẻ địch!`, 'skill');
        recordHeroAction(caster, 'melee', crossTargets.length);
        return true;
      }

      // 10. AOE VOID VORTEX
      if (skill === 'aoe_void_vortex') {
        const enemies = units.filter(u => u.kind === 'enemy' && u.hp > 0);
        if (enemies.length === 0) return false;
        const mainTarget = target || enemies[0];

        caster.mp -= mpCost;
        sound.playMagic();
        shakeScreen(9);

        const vortexTargets = enemies.filter(e => manhattan(mainTarget, e) <= 2);
        vortexTargets.forEach(vt => {
          const dmg = Math.max(6, Math.round(eff.matk * 1.55 - vt.def * 0.3));
          vt.hp = Math.max(0, vt.hp - dmg);
          triggerEffect(caster, vt, 'spell', dmg, true, 'HƯ KHÔNG!');
          if (vt.hp === 0) {
            dropLoot(vt);
            awardExp(caster, vt);
          }
        });
        addLog(`🌌 <b>${caster.name}</b> mở <b>Vòng Xoáy Hư Không</b> hút và phát nổ ma pháp vào ${vortexTargets.length} kẻ địch!`, 'skill');
        recordHeroAction(caster, 'magic', vortexTargets.length);
        return true;
      }

      // 11. BASTION STANCE (Pháo đài bất động)
      if (skill === 'bastion_stance') {
        if ((caster.bastionTicks || 0) > 0) {
          return false;
        }
        caster.mp -= mpCost;
        caster.bastionTicks = 2;
        caster.guard = 16;
        sound.playShieldBash();
        shakeScreen(6);
        triggerEffect(caster, caster, 'bash', 0, false, 'BẤT ĐỘNG!');
        addLog(`🐢 <b>${caster.name}</b> vào thế <b>Pháo Đài Thiết Thạch</b> (+20 Giáp, Phản 40% sát thương, BẤT ĐỘNG 2 lượt)!`, 'skill');
        recordHeroAction(caster, 'defend');
        return true;
      }

      // 12. PETRIFY STRIKE (Tia sáng hóa đá)
      if (skill === 'petrify_strike') {
        const enemies = units.filter(u => u.kind === 'enemy' && u.hp > 0);
        if (enemies.length === 0) return false;
        const targetEnemy = target || enemies.sort((a, b) => b.hp - a.hp)[0];

        caster.mp -= mpCost;
        sound.playTrap();
        shakeScreen(6);
        if (!targetEnemy.boss) {
          targetEnemy.petrifiedTicks = 2;
          triggerEffect(caster, targetEnemy, 'petrify', 0, false, 'HÓA ĐÁ!');
          addLog(`🗿 <b>${caster.name}</b> phóng tia Medusa biến <b>${targetEnemy.name}</b> thành tượng đá trong 2 lượt!`, 'skill');
        } else {
          const dmg = Math.max(5, Math.round(eff.matk * 1.6));
          targetEnemy.hp = Math.max(0, targetEnemy.hp - dmg);
          triggerEffect(caster, targetEnemy, 'petrify', dmg, true, 'PHÁ VỠ!');
          addLog(`🗿 Boss kháng hóa đá nhưng phải chịu <b>${dmg}</b> sát thương chấn động!`, 'skill');
        }
        recordHeroAction(caster, 'magic');
        return true;
      }

      // 13. CRIT BURST (Trảm kích tử thần)
      if (skill === 'crit_burst') {
        const enemies = units.filter(u => u.kind === 'enemy' && u.hp > 0);
        if (enemies.length === 0) return false;
        const targetEnemy = target || enemies.sort((a, b) => a.hp - b.hp)[0];

        caster.mp -= mpCost;
        const critDmg = Math.max(10, Math.round(eff.atk * 2.5 - targetEnemy.def * 0.3));
        targetEnemy.hp = Math.max(0, targetEnemy.hp - critDmg);
        const lifesteal = Math.max(4, Math.round(critDmg * 0.4));
        caster.hp = Math.min(eff.hp, caster.hp + lifesteal);

        sound.playSlash();
        shakeScreen(11);
        triggerEffect(caster, targetEnemy, 'strike', critDmg, true, 'TRẢM TỬ THẦN!');
        triggerEffect(caster, caster, 'heal', -lifesteal, false, `+${lifesteal} MÁU`);
        addLog(`🩸 <b>${caster.name}</b> chém <b>Trảm Kích Tử Thần</b> gây <b>${critDmg} BẠO KÍCH</b> và hút +${lifesteal} HP!`, 'skill');
        if (targetEnemy.hp === 0) {
          dropLoot(targetEnemy);
          awardExp(caster, targetEnemy);
        }
        recordHeroAction(caster, 'melee');
        return true;
      }

      return false;
    },
    [units, walls, getEffectiveStats, triggerEffect, addLog, dropLoot, awardExp, recordHeroAction]
  );

  // Hero AI turn (in auto mode)
  const runHeroAiTurn = useCallback(
    (hero: Unit) => {
      if (hero.hp <= 0 || hero.acted || phase !== 'playing' || paused) return;

      // Stunned status: completely lose turn
      if (hero.isStunned || (hero.stunTicks || 0) > 0 || (hero.stun || 0) > 0) {
        if (hero.stunTicks && hero.stunTicks > 0) hero.stunTicks -= 1;
        if (hero.stun && hero.stun > 0) hero.stun -= 1;
        hero.isStunned = (hero.stunTicks || 0) > 0 || (hero.stun || 0) > 0;
        sound.playTrap();
        triggerEffect(hero, hero, 'stun_stars', 0, false, 'CHOÁNG!');
        addLog(`💫 <b>${hero.name}</b> đang bị CHOÁNG, mất hoàn toàn lượt đi này!`, 'enemy');
        finishTurn(hero);
        return;
      }

      // Frozen status: completely lose turn
      if (hero.frozenTicks && hero.frozenTicks > 0) {
        hero.frozenTicks -= 1;
        sound.playTrap();
        triggerEffect(hero, hero, 'spell', 0, false, 'ĐÓNG BĂNG!');
        addLog(`❄️ <b>${hero.name}</b> đang bị ĐÓNG BĂNG, mất lượt này!`, 'enemy');
        finishTurn(hero);
        return;
      }

      // Petrified Status: Skip turn
      if (hero.petrifiedTicks && hero.petrifiedTicks > 0) {
        addLog(`🗿 <b>${hero.name}</b> đang bị hóa đá không thể cử động!`, 'normal');
        finishTurn(hero);
        return;
      }

      if (hero.poisonTicks && hero.poisonTicks > 0) {
        hero.poisonTicks -= 1;
        hero.hp = Math.max(0, hero.hp - 2);
        addLog(`<b>${hero.name}</b> bị nhiễm độc, mất 2 HP.`, 'enemy');
        if (hero.hp <= 0) {
          finishTurn(hero);
          return;
        }
      }

      const eff = getEffectiveStats(hero);
      const isRanged = eff.range >= 2;
      const heroElev = elevations.has(`${hero.x},${hero.y}`) ? 1 : 0;
      const livingEnemies = units.filter((u) => u.kind === 'enemy' && u.hp > 0);
      if (livingEnemies.length === 0) {
        finishTurn(hero);
        return;
      }

      // Strategic Barrel Shot: If a barrel within range will damage 2+ enemies, shoot it!
      if (isRanged) {
        const strategicBarrel = barrels.find((b) => {
          if (b.hp <= 0 || manhattan(hero, b) > eff.range || !clearShot(hero, b, walls, terrainMap)) return false;
          const hitCount = livingEnemies.filter((e) => Math.abs(e.x - b.x) <= 1 && Math.abs(e.y - b.y) <= 1).length;
          return hitCount >= 2;
        });
        if (strategicBarrel) {
          hero.combatAnim = { type: 'lunge', targetX: strategicBarrel.x, targetY: strategicBarrel.y, startTime: performance.now(), duration: 250 };
          sound.playArrow();
          triggerEffect(hero, strategicBarrel, 'arrow', 0);
          addLog(`🎯 <b>${hero.name}</b> ngắm bắn Thùng Thuốc Nổ kích nổ cụm ${livingEnemies.filter(e => Math.abs(e.x - strategicBarrel.x) <= 1 && Math.abs(e.y - strategicBarrel.y) <= 1).length} quái vật!`, 'skill');
          detonateBarrel(strategicBarrel.id);
          finishTurn(hero);
          return;
        }
      }

      // AI Tactical Special Skill Decision
      const specialItem = Object.values(equipped[hero.id] || {}).find((i) => i?.specialSkill);
      if (specialItem && hero.mp >= (specialItem.specialSkillMp || 4)) {
        const skill = specialItem.specialSkill;
        const adjacentEnemies = livingEnemies.filter((e) => manhattan(hero, e) <= 1);
        const inRangeEnemies = livingEnemies.filter((e) => manhattan(hero, e) <= eff.range);
        const isStandingInTelegraph = bossTelegraph.some((t) => t.x === hero.x && t.y === hero.y);

        let shouldCast = false;

        if (skill === 'bastion_stance') {
          // Never cast if already active!
          // Never cast if far away from all enemies (waste of turn & roots unit uselessly)
          // Only cast if trapped in boss telegraph or surrounded/low HP in melee combat
          const alreadyInBastion = (hero.bastionTicks || 0) > 0;
          if (!alreadyInBastion) {
            if (isStandingInTelegraph) {
              shouldCast = true;
            } else if (adjacentEnemies.length >= 2) {
              shouldCast = true;
            } else if (adjacentEnemies.length >= 1 && hero.hp < eff.hp * 0.65) {
              shouldCast = true;
            }
          }
        } else if (skill === 'summon_wolf' || skill === 'summon_golem' || skill === 'summon_fire_sprite') {
          // Summon allies if party doesn't already have an active summon
          shouldCast = !units.some((u) => u.isSummon && u.hp > 0);
        } else if (skill === 'transform_werewolf' || skill === 'transform_dragon') {
          // Only cast if not already transformed
          shouldCast = !hero.transformation;
        } else if (skill === 'transform_juggernaut') {
          // Only cast if not transformed and engaged or close to enemies
          shouldCast = !hero.transformation && (adjacentEnemies.length > 0 || inRangeEnemies.length > 0);
        } else if (skill?.startsWith('aoe_')) {
          // Cast AOE spells if any enemies are in range
          shouldCast = livingEnemies.some((e) => manhattan(hero, e) <= 3);
        } else if (skill === 'petrify_strike') {
          shouldCast = livingEnemies.some((e) => manhattan(hero, e) <= eff.range && (e.petrifiedTicks || 0) <= 0);
        } else if (skill === 'crit_burst') {
          shouldCast = inRangeEnemies.length > 0 || livingEnemies.some((e) => manhattan(hero, e) <= 2);
        }

        if (shouldCast && Math.random() < 0.9) {
          const primaryEnemy = livingEnemies.sort((a, b) => manhattan(hero, a) - manhattan(hero, b))[0];
          const success = executeSpecialSkill(hero, specialItem, primaryEnemy);
          if (success) {
            finishTurn(hero);
            return;
          }
        }
      }

      const weapon = equipped[hero.id]?.weapon;

      // 1. Healing Support (Bell)
      if (weapon?.family === 'bell' && hero.mp >= 4) {
        const woundedAlly = units
          .filter((u) => u.kind === 'hero' && u.hp > 0 && u.hp < getEffectiveStats(u).hp - 5)
          .sort((a, b) => a.hp / getEffectiveStats(a).hp - b.hp / getEffectiveStats(b).hp)[0];

        if (woundedAlly) {
          hero.mp -= 4;
          const healAmount = Math.min(15 + eff.matk, getEffectiveStats(woundedAlly).hp - woundedAlly.hp);
          woundedAlly.hp += healAmount;
          sound.playHeal();
          triggerEffect(hero, woundedAlly, 'heal', -healAmount);
          recordHeroAction(hero, 'magic');
          addLog(
            `<b>${hero.name}</b> thi triển <b>Thánh Ca Bình Minh</b>, hồi phục <b>+${healAmount} HP</b> cho ${woundedAlly.name}!`,
            'good'
          );
          finishTurn(hero);
          return;
        }
      }

      // 2. Escape Boss Danger Zone if standing in telegraph
      const inDanger = bossTelegraph.some((t) => t.x === hero.x && t.y === hero.y);
      if (inDanger) {
        const reachable = getReachableTiles(hero, eff.move, walls, terrainMap, units);
        const safeTile = reachable.find(
          (tile) => !bossTelegraph.some((t) => t.x === tile.x && t.y === tile.y)
        );
        if (safeTile) {
          moveUnit(hero, safeTile.x, safeTile.y);
          addLog(`<b>${hero.name}</b> né tránh khỏi vùng nguy hiểm!`, 'good');
          finishTurn(hero);
          return;
        } else {
          hero.guard = 4;
          recordHeroAction(hero, 'defend');
          addLog(`<b>${hero.name}</b> vào thế phòng thủ.`, 'good');
          finishTurn(hero);
          return;
        }
      }

      // 3. Attack target currently in range (respecting elevation!)
      const inRangeTargets = livingEnemies.filter(
        (e) =>
          manhattan(hero, e) <= eff.range &&
          clearShot(hero, e, walls, terrainMap) &&
          (isRanged || (elevations.has(`${e.x},${e.y}`) ? 1 : 0) === heroElev)
      );

      if (inRangeTargets.length > 0) {
        // Prioritize Shatter combo on frozen targets!
        const frozenTarget = inRangeTargets.find((e) => (e.frozenTicks || 0) > 0);
        const target = frozenTarget || inRangeTargets.sort((a, b) => a.hp - b.hp)[0];

        // Tome Frostbite Freeze (if target not already frozen)
        if (weapon?.family === 'tome' && (hero.skillCooldown || 0) <= 0 && hero.mp >= 4 && (target.frozenTicks || 0) <= 0) {
          hero.mp -= 4;
          hero.skillCooldown = 2;
          const frostDmg = Math.max(5, Math.round(eff.matk * 1.5 - target.def * 0.4));
          target.hp = Math.max(0, target.hp - frostDmg);
          target.frozenTicks = 2;
          sound.playMagic();
          shakeScreen(7);
          triggerEffect(hero, target, 'spell', frostDmg, true, 'ĐÓNG BĂNG!');
          recordHeroAction(hero, 'magic');
          addLog(`❄️ <b>${hero.name}</b> niệm <b>Băng Sương Phù Chú</b> gây ${frostDmg} dmg và <b>ĐÓNG BĂNG ${target.name}</b>!`, 'skill');
          if (target.hp === 0) {
            dropLoot(target);
            awardExp(hero);
          }
          finishTurn(hero);
          return;
        }

        // Magic Staff Fireball
        if (weapon?.family === 'staff' && (hero.skillCooldown || 0) <= 0 && hero.mp >= 4) {
          const hasAdjacentMeleeEnemy = livingEnemies.some((e) => manhattan(hero, e) <= 1);
          if (!hasAdjacentMeleeEnemy) {
            hero.mp -= 4;
            hero.skillCooldown = 2;
            const spellDmg = Math.max(5, Math.round(eff.matk * 1.6 - target.def * 0.4));
            target.hp = Math.max(0, target.hp - spellDmg);
            target.burnTicks = 2;
            sound.playMagic();
            shakeScreen(7);
            triggerEffect(hero, target, 'fire', spellDmg, true, 'HỎA CẦU!');
            recordHeroAction(hero, 'magic');
            addLog(`🔥 <b>${hero.name}</b> phóng <b>Hỏa Cầu Ma Thuật</b> thiêu đốt ${target.name} với <b>${spellDmg}</b> sát thương!`, 'skill');

            // Detonate nearby barrels and ignite oil
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const ox = target.x + dx;
                const oy = target.y + dy;
                const oKey = `${ox},${oy}`;
                if (terrainMap.get(oKey)?.type === 'oil') {
                  terrainMap.set(oKey, { type: 'fire_ground' });
                  triggerEffect(target, { x: ox, y: oy }, 'oil_ignite', 0, false, 'DẦU CHÁY!');
                }
                const hitBarrel = barrels.find((b) => b.hp > 0 && b.x === ox && b.y === oy);
                if (hitBarrel) detonateBarrel(hitBarrel.id);
              }
            }

            if (target.hp === 0) {
              dropLoot(target);
              awardExp(hero);
            }
            finishTurn(hero);
            return;
          }
        }

        // Bow Concussive Arrow Knockback
        if ((weapon?.family === 'bow' || weapon?.family === 'crossbow') && hero.mp >= 3 && manhattan(hero, target) >= 2) {
          hero.mp -= 3;
          const shotDmg = Math.max(4, Math.round(eff.atk * 1.45 - target.def));
          target.hp = Math.max(0, target.hp - shotDmg);
          sound.playArrow();
          shakeScreen(5);
          triggerEffect(hero, target, 'arrow', shotDmg, true, 'TIỄN CHẤN ĐỘNG!');
          recordHeroAction(hero, 'melee');
          addLog(`🏹 <b>${hero.name}</b> bắn <b>Tiễn Chấn Động</b> găm vào ${target.name} với <b>${shotDmg}</b> sát thương!`, 'skill');
          executeAttack(hero, target);
          finishTurn(hero);
          return;
        }

        // Hammer / Axe Smash (triggers Shatter x2 if target is frozen!)
        if ((weapon?.family === 'hammer' || weapon?.family === 'axe') && hero.mp >= 3) {
          hero.mp -= 3;
          sound.playShieldBash();
          shakeScreen(8);
          triggerEffect(hero, target, 'bash', 0, true, 'CHẤN ĐỊA!');
          recordHeroAction(hero, 'melee');
          addLog(`🔨 <b>${hero.name}</b> vung búa <b>Chấn Địa Kích</b> nện mạnh vào ${target.name}!`, 'skill');
          executeAttack(hero, target);
          finishTurn(hero);
          return;
        }

        // Normal Attack
        executeAttack(hero, target);
        finishTurn(hero);
        return;
      }

      // 4. Move closer towards enemies
      const targetEnemy = livingEnemies.sort((a, b) => manhattan(hero, a) - manhattan(hero, b))[0];
      if (targetEnemy) {
        const path = findPathToAttackRange(hero, targetEnemy, eff.range, walls, terrainMap, units);
        if (path?.step) {
          moveUnit(hero, path.step.x, path.step.y);
          if (
            manhattan(hero, targetEnemy) <= eff.range &&
            clearShot(hero, targetEnemy, walls, terrainMap)
          ) {
            executeAttack(hero, targetEnemy);
            finishTurn(hero);
            return;
          }
        }
      }

      finishTurn(hero);
    },
    [
      phase,
      paused,
      getEffectiveStats,
      units,
      bossTelegraph,
      walls,
      terrainMap,
      equipped,
      recordHeroAction,
      moveUnit,
      executeAttack,
      finishTurn,
      triggerEffect,
      addLog,
      dropLoot,
      awardExp,
    ]
  );

  // Comprehensive Tactical Boss AI Turn (MinoChoco, Warden, Ignis, FrostLich, Chimera)
  const runBossAiTurn = useCallback(
    (boss: Unit) => {
      if (boss.hp <= 0 || boss.acted || phase !== 'playing' || paused) return;

      if (boss.petrifiedTicks && boss.petrifiedTicks > 0) {
        addLog(`🗿 <b>${boss.name}</b> đang bị hóa đá, bất động hoàn toàn!`, 'good');
        finishTurn(boss);
        return;
      }

      if (boss.stun && boss.stun > 0) {
        boss.stun -= 1;
        addLog(`💫 <b>${boss.name}</b> bị choáng, mất lượt này!`, 'good');
        finishTurn(boss);
        return;
      }

      const livingHeroes = units.filter((u) => u.kind === 'hero' && u.hp > 0 && !u.isSummon);
      if (livingHeroes.length === 0) {
        finishTurn(boss);
        return;
      }

      // 1. EXECUTE PENDING TELEGRAPHED SKILL
      if (boss.pendingBossSkill) {
        const skill = boss.pendingBossSkill;
        const warned = [...bossTelegraph];
        boss.pendingBossSkill = null;
        setBossTelegraph([]);

        // (a) MinoChoco skills
        if (skill.type === 'slap') {
          sound.playBossRoar();
          shakeScreen(10);
          const hitHeroes = livingHeroes.filter((h) => warned.some((w) => w.x === h.x && w.y === h.y));
          hitHeroes.forEach((h) => {
            const dmg = Math.max(4, Math.round(boss.atk * 1.25 - getEffectiveStats(h).def * 0.7));
            h.hp = Math.max(0, h.hp - dmg);
            triggerEffect(boss, h, 'enemy', dmg, true);
          });
          addLog(`✦ <b>${boss.name}</b> vung đuôi càn quét, trúng <b>${hitHeroes.length}</b> chiến binh!`, 'enemy');
        } else if (skill.type === 'roar') {
          sound.playBossRoar();
          shakeScreen(8);
          livingHeroes.forEach((h) => {
            h.weakenTicks = Math.max(h.weakenTicks || 0, 2);
            h.mp = Math.max(0, h.mp - 3);
            triggerEffect(boss, h, 'spell', 0);
          });
          addLog(`✦ <b>${boss.name}</b> gầm vang kinh thiên động địa! Toàn đội giảm 2 ATK/MATK và mất 3 MP!`, 'enemy');
        } else if (skill.type === 'bite') {
          const target = units.find((u) => u.id === skill.targetId);
          if (target && target.hp > 0 && manhattan(boss, target) <= 1) {
            sound.playBossRoar();
            shakeScreen(9);
            const dmg = Math.max(5, Math.round(boss.atk * 1.45 - getEffectiveStats(target).def));
            target.hp = Math.max(0, target.hp - dmg);
            target.poisonTicks = 3;
            triggerEffect(boss, target, 'bite', dmg, true);
            addLog(`✦ <b>${boss.name}</b> cắn xé <b>${target.name}</b>, gây <b>${dmg}</b> sát thương và nhiễm độc 3 lượt!`, 'enemy');
          } else {
            addLog(`✦ ${boss.name} cắn hụt: mục tiêu đã né tránh kịp thời!`, 'good');
          }
        } else if (skill.type === 'poison_nova') {
          sound.playMagic();
          shakeScreen(8);
          warned.forEach((w) => {
            const h = livingHeroes.find((u) => u.x === w.x && u.y === w.y);
            if (h) {
              const acidDmg = Math.max(4, Math.round(boss.atk * 1.1 - getEffectiveStats(h).def * 0.5));
              h.hp = Math.max(0, h.hp - acidDmg);
              h.poisonTicks = 3;
              triggerEffect(boss, h, 'bite', acidDmg, true, 'AXIT ĐỘC!');
            }
          });
          addLog(`✦ <b>${boss.name}</b> phun <b>Mưa Nọc Độc Thượng Cổ</b> thiêu đốt sàn đấu!`, 'enemy');
        }

        // (b) Warden skills
        else if (skill.type === 'chain_pull') {
          const target = units.find((u) => u.id === skill.targetId);
          if (target && target.hp > 0) {
            sound.playShieldBash();
            shakeScreen(8);
            const pullDmg = Math.max(4, Math.round(boss.atk * 1.2 - getEffectiveStats(target).def));
            target.hp = Math.max(0, target.hp - pullDmg);
            target.isStunned = true;
            target.stunTicks = 1;
            // Pull adjacent to boss
            const freeAdj = [
              { x: boss.x - 1, y: boss.y },
              { x: boss.x + 1, y: boss.y },
              { x: boss.x, y: boss.y - 1 },
              { x: boss.x, y: boss.y + 1 },
            ].find((p) => inBounds(p.x, p.y) && !walls.has(`${p.x},${p.y}`) && !isOccupied(p.x, p.y, units, target.id));
            if (freeAdj) {
              target.x = freeAdj.x;
              target.y = freeAdj.y;
            }
            triggerEffect(boss, target, 'bash', pullDmg, true, 'XÍCH KÉO CHOÁNG!');
            addLog(`⛓️ <b>Cai Ngục Hắc Thép</b> quăng xích kéo <b>${target.name}</b> vào bẫy và gây <b>CHOÁNG</b>!`, 'enemy');
          }
        } else if (skill.type === 'prison_slam') {
          sound.playWallSlam();
          shakeScreen(11);
          const hitHeroes = livingHeroes.filter((h) => warned.some((w) => w.x === h.x && w.y === h.y));
          hitHeroes.forEach((h) => {
            const slamDmg = Math.max(5, Math.round(boss.atk * 1.4 - getEffectiveStats(h).def));
            h.hp = Math.max(0, h.hp - slamDmg);
            h.isStunned = true;
            h.stunTicks = 1;
            triggerEffect(boss, h, 'wall_slam', slamDmg, true, 'CHẤN ĐỊA!');
          });
          addLog(`⛓️ <b>Cai Ngục Hắc Thép</b> nện búa thép chấn động hình chữ thập, làm Choáng <b>${hitHeroes.length}</b> chiến binh!`, 'enemy');
        } else if (skill.type === 'iron_cage') {
          sound.playShieldBash();
          const target = units.find((u) => u.id === skill.targetId) || livingHeroes[0];
          if (target) {
            const cageDmg = Math.max(4, Math.round(boss.atk * 1.1));
            target.hp = Math.max(0, target.hp - cageDmg);
            target.entangledTicks = 2;
            triggerEffect(boss, target, 'bash', cageDmg, false, 'KHÓA CHÂN!');
            addLog(`⛓️ <b>Cai Ngục Hắc Thép</b> dùng cùm thép phong tỏa, khóa chân <b>${target.name}</b> (Move=0) trong 2 lượt!`, 'enemy');
          }
        } else if (skill.type === 'bastion_rage') {
          sound.playShieldBash();
          boss.guard = 18;
          boss.thornsPct = 0.5;
          boss.bastionTicks = 2;
          triggerEffect(boss, boss, 'bash', 0, false, 'GIÁP THÉP PHẢN HỒI!');
          addLog(`⛓️ <b>Cai Ngục Hắc Thép</b> kích hoạt <b>Giáp Hắc Thép Cuồng Bạo</b> (+18 Giáp, Phản 50% sát thương)!`, 'enemy');
        }

        // (c) Ignis Dragon skills
        else if (skill.type === 'dragon_breath') {
          sound.playMagic();
          shakeScreen(12);
          const hitHeroes = livingHeroes.filter((h) => warned.some((w) => w.x === h.x && w.y === h.y));
          hitHeroes.forEach((h) => {
            const breathDmg = Math.max(6, Math.round(boss.atk * 1.5 - getEffectiveStats(h).def * 0.4));
            h.hp = Math.max(0, h.hp - breathDmg);
            h.burnTicks = 3;
            triggerEffect(boss, h, 'fire', breathDmg, true, 'HỎA TỨC RỒNG!');
          });
          // Ignite tiles & barrels in warned path
          warned.forEach((w) => {
            const wKey = `${w.x},${w.y}`;
            if (terrainMap.get(wKey)?.type === 'oil') {
              terrainMap.set(wKey, { type: 'fire_ground' });
              triggerEffect(boss, w, 'oil_ignite', 0, false, 'DẦU CHÁY!');
            }
            const hitBarrel = barrels.find((b) => b.hp > 0 && b.x === w.x && b.y === w.y);
            if (hitBarrel) detonateBarrel(hitBarrel.id);
          });
          addLog(`🐉 <b>Long Thần Ignis</b> phun <b>Hỏa Tức Cổ Đại</b> thiêu rụi ${hitHeroes.length} mục tiêu!`, 'enemy');
        } else if (skill.type === 'magma_slam') {
          sound.playBossRoar();
          shakeScreen(10);
          const hitHeroes = livingHeroes.filter((h) => manhattan(boss, h) <= 2);
          hitHeroes.forEach((h) => {
            const slamDmg = Math.max(4, Math.round(boss.atk * 1.25 - getEffectiveStats(h).def));
            h.hp = Math.max(0, h.hp - slamDmg);
            h.burnTicks = 2;
            triggerEffect(boss, h, 'fire', slamDmg, true, 'ĐẬP CÁNH LỬA!');
          });
          addLog(`🐉 <b>Long Thần Ignis</b> đập cánh nham thạch cuồng bạo, hất tung ${hitHeroes.length} chiến binh!`, 'enemy');
        } else if (skill.type === 'meteor_rain') {
          sound.playMagic();
          shakeScreen(12);
          warned.forEach((w) => {
            const h = livingHeroes.find((u) => u.x === w.x && u.y === w.y);
            const mDmg = 16 + Math.floor(Math.random() * 8);
            if (h) {
              h.hp = Math.max(0, h.hp - mDmg);
              h.burnTicks = 2;
              triggerEffect(boss, h, 'meteor', mDmg, true, 'THIÊN THẠCH!');
            } else {
              triggerEffect(boss, w, 'meteor', 0, false, 'NỔ TUNG!');
            }
          });
          addLog(`🐉 <b>Long Thần Ignis</b> gọi <b>Mưa Thiên Thạch Nham Thạch</b> tàn phá dữ dội!`, 'enemy');
        } else if (skill.type === 'dragon_roar') {
          sound.playBossRoar();
          shakeScreen(9);
          livingHeroes.forEach((h) => {
            h.hp = Math.max(0, h.hp - 4);
            h.mp = Math.max(0, h.mp - 4);
            h.burnTicks = 2;
            triggerEffect(boss, h, 'fire', 4, false, 'TIẾNG GẦM LỬA!');
          });
          addLog(`🐉 <b>Long Thần Ignis</b> cất tiếng gầm long trời lở đất! Toàn đội bị bỏng và thiêu cháy 4 MP!`, 'enemy');
        }

        // (d) FrostLich skills
        else if (skill.type === 'glacial_tomb') {
          sound.playTrap();
          const target = units.find((u) => u.id === skill.targetId) || livingHeroes[0];
          if (target) {
            target.frozenTicks = 2;
            const tombDmg = Math.max(4, Math.round(boss.matk * 1.2 - getEffectiveStats(target).def * 0.4));
            target.hp = Math.max(0, target.hp - tombDmg);
            triggerEffect(boss, target, 'spell', tombDmg, true, 'MỘ BĂNG VĨNH CỬU!');
            addLog(`👑 <b>Cổ Vương FrostLich</b> phong ấn <b>${target.name}</b> trong Mộ Băng (Freeze 2 lượt)!`, 'enemy');
          }
        } else if (skill.type === 'blizzard_burst') {
          sound.playMagic();
          shakeScreen(8);
          livingHeroes.forEach((h) => {
            const bDmg = Math.max(4, Math.round(boss.matk * 1.15 - getEffectiveStats(h).def * 0.3));
            h.hp = Math.max(0, h.hp - bDmg);
            h.spd = Math.max(1, h.spd - 4);
            triggerEffect(boss, h, 'spell', bDmg, false, 'BÃO TUYẾT -4 SPD!');
          });
          addLog(`👑 <b>Cổ Vương FrostLich</b> triệu hồi bão tuyết lạnh giá làm chậm -4 SPD toàn đội!`, 'enemy');
        } else if (skill.type === 'ice_lance') {
          sound.playArrow();
          shakeScreen(7);
          warned.forEach((w) => {
            const h = livingHeroes.find((u) => u.x === w.x && u.y === w.y);
            if (h) {
              const lanceDmg = Math.max(5, Math.round(boss.matk * 1.45 - getEffectiveStats(h).def * 0.3));
              h.hp = Math.max(0, h.hp - lanceDmg);
              triggerEffect(boss, h, 'arrow', lanceDmg, true, 'THƯƠNG BĂNG!');
            }
          });
          addLog(`👑 <b>Cổ Vương FrostLich</b> phóng <b>Thương Băng Xuyên Thấu</b> xé toạc trận hình!`, 'enemy');
        } else if (skill.type === 'frost_armor') {
          sound.playLevelUp();
          boss.guard = 15;
          boss.thornsPct = 0.5;
          triggerEffect(boss, boss, 'spell', 0, false, 'KHIÊN BĂNG PHẢN HỒI!');
          addLog(`👑 <b>Cổ Vương FrostLich</b> dựng Khiên Băng Gai phản 50% sát thương!`, 'enemy');
        }

        // (e) Chimera skills
        else if (skill.type === 'lion_roar') {
          sound.playBossRoar();
          shakeScreen(8);
          const target = units.find((u) => u.id === skill.targetId) || livingHeroes[0];
          if (target) {
            const roarDmg = Math.max(4, Math.round(boss.atk * 1.2 - getEffectiveStats(target).def));
            target.hp = Math.max(0, target.hp - roarDmg);
            target.isStunned = true;
            target.stunTicks = 1;
            triggerEffect(boss, target, 'bash', roarDmg, true, 'GẦM CHOÁNG!');
            addLog(`🦁 <b>Chimera</b> gầm tiếng gầm Sư Tử làm CHOÁNG <b>${target.name}</b>!`, 'enemy');
          }
        } else if (skill.type === 'scorpion_stinger') {
          sound.playSlash();
          const target = units.find((u) => u.id === skill.targetId) || livingHeroes[0];
          if (target) {
            const stingDmg = Math.max(5, Math.round(boss.atk * 1.4 - getEffectiveStats(target).def));
            target.hp = Math.max(0, target.hp - stingDmg);
            target.poisonTicks = 4;
            triggerEffect(boss, target, 'bite', stingDmg, true, 'ĐUÔI ĐỘC!');
            addLog(`🦁 <b>Chimera</b> cắm ngập đuôi bọ cạp vào <b>${target.name}</b> gây <b>${stingDmg}</b> sát thương và nhiễm độc nặng 4 lượt!`, 'enemy');
          }
        } else if (skill.type === 'goat_fire') {
          sound.playMagic();
          shakeScreen(7);
          warned.forEach((w) => {
            const h = livingHeroes.find((u) => u.x === w.x && u.y === w.y);
            if (h) {
              const fDmg = Math.max(4, Math.round(boss.atk * 1.15));
              h.hp = Math.max(0, h.hp - fDmg);
              h.burnTicks = 2;
              triggerEffect(boss, h, 'fire', fDmg, false, 'LỬA QUỶ!');
            }
          });
          addLog(`🦁 <b>Chimera</b> dùng đầu Dê phun ngọn lửa quỷ thiêu đốt!`, 'enemy');
        } else if (skill.type === 'triple_frenzy') {
          sound.playSlash();
          shakeScreen(9);
          const target = units.find((u) => u.id === skill.targetId) || livingHeroes[0];
          if (target) {
            const frenzyDmg = Math.max(6, Math.round(boss.atk * 1.6 - getEffectiveStats(target).def));
            target.hp = Math.max(0, target.hp - frenzyDmg);
            triggerEffect(boss, target, 'claw3', frenzyDmg, true, 'TAM ĐẦU CUỒNG XÉ!');
            addLog(`🦁 <b>Chimera</b> cuồng nộ cắn xé 3 đòn liên tiếp vào <b>${target.name}</b> gây <b>${frenzyDmg}</b> sát thương!`, 'enemy');
          }
        }

        // Aggressive Pursuit: If heroes survived and are outside attack range, Boss closes the gap!
        const livingAfterSkill = units.filter((u) => u.kind === 'hero' && u.hp > 0 && !u.isSummon);
        if (livingAfterSkill.length > 0) {
          const nearestHero = livingAfterSkill.sort((a, b) => manhattan(boss, a) - manhattan(boss, b))[0];
          const eff = getEffectiveStats(boss);
          if (manhattan(boss, nearestHero) > eff.range) {
            const chasePath = findPathToAttackRange(boss, nearestHero, eff.range, walls, terrainMap, units);
            if (chasePath?.step) {
              moveUnit(boss, chasePath.step.x, chasePath.step.y);
              addLog(`👣 <b>${boss.name}</b> rảo bước dồn đuổi <b>${nearestHero.name}</b>!`, 'enemy');
            }
          }
        }

        finishTurn(boss);
        return;
      }

      // 2. BOSS ADVANCE & TELEGRAPH NEXT SKILL IN BOSS'S CYCLE
      const eff = getEffectiveStats(boss);
      const preNearest = livingHeroes.sort((a, b) => manhattan(boss, a) - manhattan(boss, b))[0];
      if (preNearest && manhattan(boss, preNearest) > eff.range) {
        const movePath = findPathToAttackRange(boss, preNearest, eff.range, walls, terrainMap, units);
        if (movePath?.step) {
          moveUnit(boss, movePath.step.x, movePath.step.y);
          addLog(`👣 <b>${boss.name}</b> tiến bước áp sát đội hình chiến binh!`, 'enemy');
        }
      }

      const isMinochoco = boss.species === 'snake';
      const isWarden = boss.species === 'warden' || boss.id.includes('warden');
      const isIgnis = boss.species === 'dragon' || boss.id.includes('ignis');
      const isFrostLich = boss.species === 'lich' || boss.id.includes('frost_lich');

      let bossCycleList: BossSkillType[] = ['lion_roar', 'scorpion_stinger', 'goat_fire', 'triple_frenzy'];
      if (isMinochoco) {
        bossCycleList = ['slap', 'roar', 'bite', 'poison_nova'];
      } else if (isWarden) {
        bossCycleList = ['chain_pull', 'prison_slam', 'iron_cage', 'bastion_rage'];
      } else if (isIgnis) {
        bossCycleList = ['dragon_breath', 'magma_slam', 'meteor_rain', 'dragon_roar'];
      } else if (isFrostLich) {
        bossCycleList = ['glacial_tomb', 'blizzard_burst', 'ice_lance', 'frost_armor'];
      }

      const nextType = bossCycleList[(boss.bossCycle || 0) % bossCycleList.length];
      boss.bossCycle = ((boss.bossCycle || 0) + 1) % bossCycleList.length;

      // Calculate Telegraph Zones from Boss's updated position
      const warned: BossTelegraph[] = [];
      const nearest = livingHeroes.sort((a, b) => manhattan(boss, a) - manhattan(boss, b))[0];
      const farthest = [...livingHeroes].sort((a, b) => manhattan(boss, b) - manhattan(boss, a))[0];

      if (nextType === 'slap' || nextType === 'magma_slam') {
        livingHeroes.forEach((h) => {
          if (manhattan(boss, h) <= 1) warned.push({ x: h.x, y: h.y, type: nextType });
        });
        if (warned.length === 0) warned.push({ x: boss.x, y: boss.y, type: nextType });
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType };
        addLog(`✦ <b>${boss.name}</b> tích tụ uy lực chuẩn bị quét <b>VUNG QUANH</b>! Hãy tản ra!`, 'enemy');
      } else if (nextType === 'roar' || nextType === 'dragon_roar' || nextType === 'blizzard_burst') {
        livingHeroes.forEach((h) => warned.push({ x: h.x, y: h.y, type: nextType }));
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType };
        addLog(`✦ <b>${boss.name}</b> gầm vang chuẩn bị tung <b>ĐÒN DIỆN RỘNG TOÀN SÂN</b>!`, 'enemy');
      } else if (nextType === 'chain_pull') {
        warned.push({ x: farthest.x, y: farthest.y, type: nextType });
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType, targetId: farthest.id };
        addLog(`⛓️ <b>Cai Ngục Hắc Thép</b> quay xích thép nhắm vào <b>${farthest.name}</b> chuẩn bị KÉO VỀ!`, 'enemy');
      } else if (nextType === 'prison_slam') {
        for (let d = 1; d <= 2; d++) {
          [[0, -d], [0, d], [-d, 0], [d, 0]].forEach(([dx, dy]) => {
            const tx = boss.x + dx;
            const ty = boss.y + dy;
            if (inBounds(tx, ty)) warned.push({ x: tx, y: ty, type: nextType });
          });
        }
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType };
        addLog(`⛓️ <b>Cai Ngục Hắc Thép</b> giương búa tạ chuẩn bị <b>NỆN CHỮ THẬP CHẤN ĐỊA</b>!`, 'enemy');
      } else if (nextType === 'dragon_breath') {
        const facing = nearest.x >= boss.x ? 1 : -1;
        for (let step = 1; step <= 3; step++) {
          const bx = boss.x + facing * step;
          if (inBounds(bx, boss.y)) warned.push({ x: bx, y: boss.y, type: nextType });
        }
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType };
        addLog(`🐉 <b>Long Thần Ignis</b> hít sâu luồng hỏa tức chuẩn bị <b>THỔI LỬA HÀNG THẲNG</b>!`, 'enemy');
      } else if (nextType === 'meteor_rain' || nextType === 'poison_nova') {
        livingHeroes.slice(0, 3).forEach((h) => warned.push({ x: h.x, y: h.y, type: nextType }));
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType };
        addLog(`✦ <b>${boss.name}</b> phong ấn chuẩn bị giáng <b>MƯA TÀN PHÁ</b> xuống sân đấu!`, 'enemy');
      } else if (nextType === 'glacial_tomb') {
        warned.push({ x: nearest.x, y: nearest.y, type: nextType });
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType, targetId: nearest.id };
        addLog(`👑 <b>Cổ Vương FrostLich</b> niệm chú Băng Cổ chuẩn bị <b>ĐÓNG BĂNG ${nearest.name}</b>!`, 'enemy');
      } else if (nextType === 'bastion_rage' || nextType === 'frost_armor') {
        boss.pendingBossSkill = { type: nextType };
        addLog(`✦ <b>${boss.name}</b> chuẩn bị kích hoạt <b>GIÁP PHẢN HỒI SÁT THƯƠNG</b>!`, 'enemy');
      } else {
        warned.push({ x: nearest.x, y: nearest.y, type: nextType });
        setBossTelegraph(warned);
        boss.pendingBossSkill = { type: nextType, targetId: nearest.id };
        addLog(`✦ <b>${boss.name}</b> khóa chặt <b>${nearest.name}</b> chuẩn bị tấn công tàn bạo!`, 'enemy');
      }

      finishTurn(boss);
    },
    [bossTelegraph, units, getEffectiveStats, triggerEffect, addLog, finishTurn, walls, barrels, terrainMap, detonateBarrel, moveUnit, phase, paused]
  );

  // Cunning Tactical Target Selector for Monster AI:
  // Evaluates every living hero to focus weak/wounded targets or lethal finishes
  const chooseSmartEnemyTarget = useCallback(
    (enemy: Unit, livingHeroes: Unit[]): Unit | null => {
      if (!livingHeroes.length) return null;
      const eff = getEffectiveStats(enemy);

      let bestHero: Unit | null = null;
      let highestScore = -Infinity;

      for (const hero of livingHeroes) {
        const heroEff = getEffectiveStats(hero);
        const dist = manhattan(enemy, hero);
        const estDmg = Math.max(2, eff.atk - heroEff.def);

        let score = 0;

        // 1. Lethal execution bonus: Focus targets that can be killed right now!
        if (hero.hp <= estDmg) {
          score += 160;
        }

        // 2. Wounded hero priority: Don't spread damage, focus down wounded heroes!
        const hpPct = hero.hp / heroEff.hp;
        score += (1 - hpPct) * 65;

        // 3. Squishy priority: Target heroes with low defense rather than heavy armored shields!
        score += Math.max(0, 16 - heroEff.def) * 2.5;

        // 4. Threat priority: High magic damage dealers or ranged snipers get targeted!
        if (heroEff.matk >= 10 || heroEff.range >= 3) {
          score += 25;
        }

        // 5. Distance penalty: Slightly prioritize closer targets if threat is comparable
        score -= dist * 3.5;

        if (score > highestScore) {
          highestScore = score;
          bestHero = hero;
        }
      }

      return bestHero;
    },
    [getEffectiveStats]
  );

  // Normal Enemy AI turn (Tactical, Smart, Ruthless)
  const runEnemyTurn = useCallback(
    (enemy: Unit) => {
      if (enemy.hp <= 0 || enemy.acted || phase !== 'playing' || paused) return;

      if (enemy.petrifiedTicks && enemy.petrifiedTicks > 0) {
        addLog(`🗿 <b>${enemy.name}</b> đang bị hóa đá, bất động hoàn toàn!`, 'good');
        finishTurn(enemy);
        return;
      }

      if (enemy.stun && enemy.stun > 0) {
        enemy.stun -= 1;
        addLog(`<b>${enemy.name}</b> bị choáng, mất lượt này!`, 'good');
        finishTurn(enemy);
        return;
      }

      if (enemy.boss) {
        runBossAiTurn(enemy);
        return;
      }

      const livingHeroes = units.filter((u) => u.kind === 'hero' && u.hp > 0);
      if (livingHeroes.length === 0) {
        finishTurn(enemy);
        return;
      }

      const eff = getEffectiveStats(enemy);

      // Slime regeneration & split
      if (enemy.ability === 'split' && enemy.hp < enemy.maxHp * 0.5 && (!enemy.cooldown || enemy.cooldown <= 0)) {
        const heal = Math.round(enemy.maxHp * 0.35);
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
        enemy.cooldown = 3;
        triggerEffect(enemy, enemy, 'heal', -heal);
        addLog(`✦ <b>${enemy.name}</b> phân tách tự hồi phục <b>+${heal} HP</b>!`, 'enemy');
        finishTurn(enemy);
        return;
      }

      // Shaman War Drums Ally Aura Buff (Every turn boosts nearby living monsters!)
      if (enemy.shamanAura) {
        const allyMonsters = units.filter(
          (u) => u.kind === 'enemy' && u.hp > 0 && u.id !== enemy.id && manhattan(enemy, u) <= 3
        );
        if (allyMonsters.length > 0) {
          sound.playLevelUp();
          allyMonsters.forEach((m) => {
            m.atk += 2;
            m.def += 2;
            m.hp = Math.min(m.maxHp, m.hp + 6);
            triggerEffect(enemy, m, 'buff_aura', -6, false, 'TRỐNG TRẬN +2');
          });
          addLog(
            `🥁 <b>${enemy.name}</b> gõ Trống Chiến Thần: ban +2 Sức Mạnh, +2 Giáp & hồi +6 HP cho ${allyMonsters.length} đồng minh!`,
            'enemy'
          );
        }
      }

      // Effective walls and terrain (Ghost phases through walls and chasms!)
      const effectiveWalls = enemy.phasesWalls ? new Set<string>() : walls;

      // 1. TACTICAL ALTAR CLAIMING: If an Altar tile is within reach and unoccupied, claim it!
      const reachableTiles = getReachableTiles(enemy, eff.move, effectiveWalls, terrainMap, units);
      const altarTile = reachableTiles.find((t) => terrainMap.get(`${t.x},${t.y}`)?.type === 'altar');
      if (
        altarTile &&
        !isOccupied(altarTile.x, altarTile.y, units, enemy.id) &&
        terrainMap.get(`${enemy.x},${enemy.y}`)?.type !== 'altar' &&
        Math.random() < 0.7
      ) {
        moveUnit(enemy, altarTile.x, altarTile.y);
        addLog(`✦ <b>${enemy.name}</b> chiếm lấy <b>Đài Tế Thánh Quang</b> để hấp thụ linh khí!`, 'enemy');
      }

      // 2. SMART TARGET SELECTION: Ghost aggressively hunts fragile backline mages & archers!
      let target: Unit | null = null;
      if (enemy.phasesWalls) {
        const backlineHeroes = livingHeroes
          .filter((h) => {
            const wFam = equipped[h.id]?.weapon?.family;
            return wFam === 'staff' || wFam === 'tome' || wFam === 'bell' || wFam === 'bow' || wFam === 'crossbow';
          })
          .sort((a, b) => a.hp - b.hp);
        if (backlineHeroes.length > 0) {
          target = backlineHeroes[0];
        }
      }
      if (!target) {
        target = chooseSmartEnemyTarget(enemy, livingHeroes);
      }

      // Helper for line of sight (Ghosts phase through walls to strike!)
      const canHitHero = (from: Point, to: Point) => {
        if (enemy.phasesWalls) return true;
        return clearShot(from, to, walls, terrainMap);
      };

      // 3. RANGED KITING & COVER: If enemy is ranged (range >= 2) and a hero is in melee (dist = 1), step back!
      if (eff.range >= 2) {
        const adjacentHero = livingHeroes.find((h) => manhattan(enemy, h) <= 1);
        if (adjacentHero) {
          const safeKiteTiles = reachableTiles.filter(
            (t) =>
              livingHeroes.every((h) => manhattan(t, h) >= 2) &&
              livingHeroes.some((h) => manhattan(t, h) <= eff.range && canHitHero(t, h))
          );
          if (safeKiteTiles.length > 0) {
            safeKiteTiles.sort((a, b) => {
              const minA = Math.min(...livingHeroes.map((h) => manhattan(a, h)));
              const minB = Math.min(...livingHeroes.map((h) => manhattan(b, h)));
              return minB - minA;
            });
            const bestTile = safeKiteTiles[0];
            moveUnit(enemy, bestTile.x, bestTile.y);
            addLog(`✦ <b>${enemy.name}</b> lùi lại giữ cự ly bắn xa an toàn!`, 'enemy');
          }
        }
      }

      // If target is not currently in attack range or blocked, move closer (using effectiveWalls)
      if (target && (!canHitHero(enemy, target) || manhattan(enemy, target) > eff.range)) {
        const path = findPathToAttackRange(enemy, target, eff.range, effectiveWalls, terrainMap, units);
        if (path?.step) {
          moveUnit(enemy, path.step.x, path.step.y);
        } else {
          // If path to primary target is congested, retarget nearest reachable hero
          const altTarget = livingHeroes
            .map((h) => ({ hero: h, path: findPathToAttackRange(enemy, h, eff.range, effectiveWalls, terrainMap, units) }))
            .filter((entry) => entry.path)
            .sort((a, b) => (a.path?.distance || 99) - (b.path?.distance || 99))[0]?.hero;
          if (altTarget) {
            target = altTarget;
            const altPath = findPathToAttackRange(enemy, altTarget, eff.range, effectiveWalls, terrainMap, units);
            if (altPath?.step) {
              moveUnit(enemy, altPath.step.x, altPath.step.y);
            }
          }
        }
      }

      // Check if any hero is now in attack range
      const inRangeTargets = livingHeroes.filter(
        (h) => manhattan(enemy, h) <= eff.range && canHitHero(enemy, h)
      );

      if (inRangeTargets.length > 0) {
        // Prioritize killing low HP hero if in range
        const finalTarget = inRangeTargets.sort((a, b) => a.hp - b.hp)[0];

        // Lich Frost Nova Magic Blast
        if (enemy.species === 'lich' && Math.random() < 0.7) {
          sound.playMagic();
          shakeScreen(6);
          const novaDmg = Math.max(5, Math.round(eff.matk * 1.4 - getEffectiveStats(finalTarget).def * 0.3));
          finalTarget.hp = Math.max(0, finalTarget.hp - novaDmg);
          finalTarget.spd = Math.max(1, finalTarget.spd - 2);
          triggerEffect(enemy, finalTarget, 'spell', novaDmg, true, 'BÃO BĂNG VU YÊU!');
          addLog(`✦ <b>${enemy.name}</b> niệm <b>Bão Băng Vu Yêu</b> gây <b>${novaDmg}</b> sát thương ma pháp và làm chậm ${finalTarget.name}!`, 'enemy');
          if (finalTarget.hp === 0) {
            addLog(`☠ <b>${finalTarget.name}</b> đã bị Tử Linh Vu Yêu hạ gục!`, 'enemy');
          }
          finishTurn(enemy);
          return;
        }

        // Ghost Phase Strike (Armor-Piercing from within walls)
        if (enemy.species === 'ghost' && Math.random() < 0.75) {
          sound.playSlash();
          shakeScreen(7);
          const strikeDmg = Math.max(6, Math.round(eff.atk * 1.5 - getEffectiveStats(finalTarget).def * 0.2));
          finalTarget.hp = Math.max(0, finalTarget.hp - strikeDmg);
          triggerEffect(enemy, finalTarget, 'strike', strikeDmg, true, 'HƯ KHÔNG TRẢM!');
          addLog(`✦ <b>${enemy.name}</b> xuyên qua tường đá chém <b>Hư Không Trảm</b> gây <b>${strikeDmg}</b> sát thương lên ${finalTarget.name}!`, 'enemy');
          if (finalTarget.hp === 0) {
            addLog(`☠ <b>${finalTarget.name}</b> đã bị Bóng Ma Hư Không ám sát!`, 'enemy');
          }
          finishTurn(enemy);
          return;
        }

        // Shaman Heavy War Strike
        if (enemy.species === 'shaman' && Math.random() < 0.6) {
          sound.playShieldBash();
          const bashDmg = Math.max(4, Math.round(eff.atk * 1.3 - getEffectiveStats(finalTarget).def));
          finalTarget.hp = Math.max(0, finalTarget.hp - bashDmg);
          finalTarget.weakenTicks = 2;
          triggerEffect(enemy, finalTarget, 'bash', bashDmg, false, 'DÙI TRỐNG LÀM YẾU!');
          addLog(`✦ <b>${enemy.name}</b> đập dùi trống làm suy yếu ${finalTarget.name} trong 2 lượt!`, 'enemy');
          finishTurn(enemy);
          return;
        }

        // Banshee AoE Scream if 2+ heroes nearby
        if (enemy.species === 'banshee') {
          sound.playMagic();
          shakeScreen(7);
          const nearHeroes = livingHeroes.filter((h) => manhattan(enemy, h) <= 2);
          nearHeroes.forEach((h) => {
            const wailDmg = Math.max(4, Math.round(eff.matk * 1.15 - getEffectiveStats(h).def * 0.3));
            h.hp = Math.max(0, h.hp - wailDmg);
            h.mp = Math.max(0, h.mp - 3);
            triggerEffect(enemy, h, 'wail', wailDmg, false, 'TIẾNG HÚ ĐOẠT HỒN!');
          });
          addLog(`✦ <b>${enemy.name}</b> cất <b>Tiếng Hú Đoạt Hồn</b>, hút MP và sát thương ${nearHeroes.length} mục tiêu!`, 'enemy');
          finishTurn(enemy);
          return;
        }

        // Beholder Disintegrating Prismatic Eye Ray (shoots through iron bars!)
        if (enemy.species === 'beholder') {
          sound.playMagic();
          shakeScreen(7);
          const rayDmg = Math.max(5, Math.round(eff.matk * 1.45 - getEffectiveStats(finalTarget).def * 0.4));
          finalTarget.hp = Math.max(0, finalTarget.hp - rayDmg);
          finalTarget.blindTicks = 2;
          finalTarget.weakenTicks = 2;
          triggerEffect(enemy, finalTarget, 'eye_ray', rayDmg, true, 'TIA PHÉP VỰC THẲM!');
          addLog(`✦ <b>${enemy.name}</b> bắn <b>Tia Phép Vực Thẳm</b> gây <b>${rayDmg}</b> sát thương, làm mù ${finalTarget.name}!`, 'enemy');
          if (finalTarget.hp === 0) {
            addLog(`☠ <b>${finalTarget.name}</b> đã bị tiêu diệt!`, 'enemy');
          }
          finishTurn(enemy);
          return;
        }

        // Treant Entangle Root on highest SPD hero
        if (enemy.species === 'treant' && Math.random() < 0.6) {
          sound.playShieldBash();
          const rootDmg = Math.max(4, Math.round(eff.atk * 1.25 - getEffectiveStats(finalTarget).def));
          finalTarget.hp = Math.max(0, finalTarget.hp - rootDmg);
          finalTarget.stun = 1;
          triggerEffect(enemy, finalTarget, 'entangle', rootDmg, true, 'RỄ TRÓI CHÂN!');
          addLog(`✦ <b>${enemy.name}</b> trói cứng chân <b>${finalTarget.name}</b> bằng rễ cây cổ thụ!`, 'enemy');
          finishTurn(enemy);
          return;
        }

        // Ash-Archer Fiery Volley
        if (enemy.species === 'ash-archer' && Math.random() < 0.65) {
          sound.playArrow();
          const shotDmg = Math.max(4, Math.round(eff.atk * 1.35 - getEffectiveStats(finalTarget).def));
          finalTarget.hp = Math.max(0, finalTarget.hp - shotDmg);
          finalTarget.burnTicks = 2;
          triggerEffect(enemy, finalTarget, 'arrow', shotDmg, true, 'MŨI TÊN TRO LỬA!');
          addLog(`✦ <b>${enemy.name}</b> bắn <b>Mũi Tên Tro Lửa</b> thiêu đốt ${finalTarget.name} với ${shotDmg} sát thương!`, 'enemy');
          finishTurn(enemy);
          return;
        }

        executeAttack(enemy, finalTarget);
      }
      finishTurn(enemy);
    },
    [
      phase,
      paused,
      units,
      getEffectiveStats,
      walls,
      terrainMap,
      chooseSmartEnemyTarget,
      runBossAiTurn,
      moveUnit,
      executeAttack,
      finishTurn,
      triggerEffect,
      addLog,
    ]
  );

  // Turn orchestration scheduler
  useEffect(() => {
    if (phase !== 'playing' || paused) return;

    const aliveUnits = units.filter((u) => u.hp > 0);
    const livingHeroes = aliveUnits.filter((u) => u.kind === 'hero');
    const livingEnemies = aliveUnits.filter((u) => u.kind === 'enemy');

    if (livingEnemies.length === 0) {
      if (floorBoss) {
        setPhase('boss_victory_cutscene');
        setActiveId(null);
        addLog('🏆 <b>CHIẾN THẮNG TRÙM ĐẠI THÀNH!</b> Toàn đội ca khúc khải hoàn và mở rương báu!', 'good');
        return;
      }
      setPhase('exiting');
      setActiveId(null);
      addLog('Toàn bộ quái vật đã bị tiêu diệt! Đoàn thám hiểm đang rút lui qua cửa.', 'good');
      return;
    }

    if (livingHeroes.length === 0) {
      setPhase('lost');
      setGameOverResult('lost');
      return;
    }

    // New round if order exhausted
    if (turnIndex >= order.length) {
      setRound((prev) => prev + 1);
      const newOrder = [...aliveUnits].sort((a, b) => {
        const spdDiff = getEffectiveStats(b).spd - getEffectiveStats(a).spd;
        if (spdDiff !== 0) return spdDiff;
        return a.kind === 'hero' ? -1 : 1;
      });

      newOrder.forEach((u) => {
        u.acted = false;
        u.moved = false;
        u.guard = 0;
        if (u.weakenTicks && u.weakenTicks > 0) u.weakenTicks -= 1;
        if (u.blindTicks && u.blindTicks > 0) u.blindTicks -= 1;
        if (u.burnTicks && u.burnTicks > 0) {
          u.burnTicks -= 1;
          u.hp = Math.max(0, u.hp - 3);
          triggerEffect(u, u, 'fire', 3, false, 'BỎNG LỬA!');
        }
      });

      setOrder(newOrder);
      setTurnIndex(0);
      return;
    }

    const currentUnit = order[turnIndex];
    if (!currentUnit || currentUnit.hp <= 0 || currentUnit.acted) {
      setTurnIndex((prev) => prev + 1);
      return;
    }

    setActiveId(currentUnit.id);
    currentUnit.moved = false;
    currentUnit.guard = 0;

    const delay = (currentUnit.kind === 'enemy' ? 420 : 480) / PLAYBACK_SPEEDS[speedIndex];
    const gen = roomGenRef.current;
    const timer = setTimeout(() => {
      if (gen !== roomGenRef.current || paused || phase !== 'playing') return;
      if (currentUnit.kind === 'enemy') {
        runEnemyTurn(currentUnit);
      } else {
        if (controlMode === 'auto') {
          runHeroAiTurn(currentUnit);
        } else {
          // Check if active hero in manual mode is stunned or frozen
          if (currentUnit.isStunned || (currentUnit.stunTicks || 0) > 0 || (currentUnit.stun || 0) > 0) {
            if (currentUnit.stunTicks && currentUnit.stunTicks > 0) currentUnit.stunTicks -= 1;
            if (currentUnit.stun && currentUnit.stun > 0) currentUnit.stun -= 1;
            currentUnit.isStunned = (currentUnit.stunTicks || 0) > 0 || (currentUnit.stun || 0) > 0;
            sound.playTrap();
            triggerEffect(currentUnit, currentUnit, 'stun_stars', 0, false, 'CHOÁNG!');
            addLog(`💫 <b>${currentUnit.name}</b> đang bị CHOÁNG, mất hoàn toàn lượt đi này!`, 'enemy');
            finishTurn(currentUnit);
            return;
          }
          if (currentUnit.frozenTicks && currentUnit.frozenTicks > 0) {
            currentUnit.frozenTicks -= 1;
            sound.playTrap();
            triggerEffect(currentUnit, currentUnit, 'spell', 0, false, 'ĐÓNG BĂNG!');
            addLog(`❄️ <b>${currentUnit.name}</b> đang bị ĐÓNG BĂNG, mất lượt này!`, 'enemy');
            finishTurn(currentUnit);
            return;
          }

          setSelectedId(currentUnit.id);
          setSelectedHeroId(currentUnit.id);
          const reach = getReachableTiles(
            currentUnit,
            getEffectiveStats(currentUnit).move,
            walls,
            terrainMap,
            units
          );
          setMoveTiles(reach);
          setTargetTiles([]);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    phase,
    paused,
    turnIndex,
    order,
    units,
    speedIndex,
    controlMode,
    getEffectiveStats,
    runEnemyTurn,
    runHeroAiTurn,
    walls,
    terrainMap,
    addLog,
  ]);

  // Exiting corridor sequence
  useEffect(() => {
    if (phase !== 'exiting' || paused) return;

    const heroesToExit = units.filter((u) => u.kind === 'hero' && u.hp > 0 && !u.inTransit);
    if (heroesToExit.length === 0) {
      sound.playLevelUp();
      // Fully restore 100% MP and cure all negative debuffs when stepping through the portal!
      units
        .filter((u) => u.kind === 'hero')
        .forEach((h) => {
          const hEff = getEffectiveStats(h);
          h.mp = hEff.mp;
          h.isStunned = false;
          h.stunTicks = 0;
          h.skillCooldown = 0;
          h.burnTicks = 0;
          h.poisonTicks = 0;
          h.frozenTicks = 0;
        });
      setHeroRoster((prev) =>
        prev.map((h) => {
          const hEff = getEffectiveStats(h);
          return {
            ...h,
            mp: hEff.mp,
            isStunned: false,
            stunTicks: 0,
            skillCooldown: 0,
            burnTicks: 0,
            poisonTicks: 0,
            frozenTicks: 0,
          };
        })
      );
      addLog('✨ <b>Cổng Dịch Chuyển Ma Pháp</b> đã thanh tẩy và hồi phục đầy đủ 100% MP cho toàn đội thám hiểm!', 'good');

      // Check if this floor transition has a 2-way fork choice (every 2-3 floors: floor % 2 === 0 or floor % 3 === 0)
      const hasFork = (floor % 2 === 0 || floor % 3 === 0) && floor < 10;
      if (hasFork) {
        const biomesPool: DungeonBiome[] = ['prison', 'dwarven_mine', 'abyssal_forge', 'crystal_sanctum', 'toxic_bog', 'haunted_crypt', 'infernal_arena'];
        const b1 = biomesPool[floor % biomesPool.length];
        const b2 = biomesPool[(floor + 2) % biomesPool.length];
        const forkA: DungeonForkOption = {
          id: `fork-a-${floor}`,
          title: b1 === 'dwarven_mine' ? 'Hầm Mỏ Khoáng Thạch' : b1 === 'prison' ? 'Khu Giam Cầm Song Sắt' : b1 === 'abyssal_forge' ? 'Vực Thẳm Dung Nham' : 'Thánh Điện Cổ Tinh Thể',
          biome: b1,
          description: b1 === 'dwarven_mine' ? 'Nhiều quặng vàng và thùng thuốc nổ chiến thuật.' : b1 === 'prison' ? 'Song sắt tạo nút thắt chiến lược, nhiều trang bị giáp trụ.' : 'Đường đi hiểm trở rực lửa nham thạch.',
          icon: b1 === 'dwarven_mine' ? '⛏️' : b1 === 'prison' ? '⛓️' : b1 === 'abyssal_forge' ? '🌋' : '💎',
          dangerLevel: 'Thử thách',
          perkText: b1 === 'dwarven_mine' ? 'Thưởng +35 vàng & rương trang bị quý' : 'Thưởng vũ khí & giáp trụ cấp cao',
          rewardType: b1 === 'dwarven_mine' ? 'gold' : 'equipment',
        };
        const forkB: DungeonForkOption = {
          id: `fork-b-${floor}`,
          title: b2 === 'haunted_crypt' ? 'Hầm Mộ Chật Hẹp' : b2 === 'toxic_bog' ? 'Đầm Lầy Tử Linh' : b2 === 'infernal_arena' ? 'Đại Đấu Trường Cổ' : 'Thánh Tích Bí Mật',
          biome: b2,
          description: b2 === 'haunted_crypt' ? 'Phòng diện tích nhỏ, giáp chiến áp sát và đẩy tường cực mạnh.' : 'Nước đầm độc hại và đài tế hồi phục sinh lực.',
          icon: b2 === 'haunted_crypt' ? '💀' : b2 === 'toxic_bog' ? '🧪' : '⚔️',
          dangerLevel: 'Bình thường',
          perkText: 'Đài Tế Thánh Quang hồi 100% Máu & MP toàn đội',
          rewardType: 'heal',
        };
        setDoorForkOptions([forkA, forkB]);
      } else {
        setDoorForkOptions(null);
      }

      setPhase('door_cutscene');
      saveGame();
      return;
    }

    const cur = heroesToExit[0];
    const gen = roomGenRef.current;
    const delay = 280 / PLAYBACK_SPEEDS[speedIndex];

    const timer = setTimeout(() => {
      if (gen !== roomGenRef.current || paused || phase !== 'exiting') return;
      if (cur.x === EXIT_DOOR.x && cur.y === EXIT_DOOR.y) {
        cur.inTransit = true;
        addLog(`<b>${cur.name}</b> đã bước qua cánh cổng tháp!`, 'good');
        setUnits([...units]);
        return;
      }
      const step = findShortestStep(cur, EXIT_DOOR, walls, terrainMap, units);
      if (step) {
        moveUnit(cur, step.x, step.y);
        if (cur.x === EXIT_DOOR.x && cur.y === EXIT_DOOR.y) {
          cur.inTransit = true;
          addLog(`<b>${cur.name}</b> đã bước qua cánh cổng tháp!`, 'good');
        }
        setUnits([...units]);
      } else {
        cur.inTransit = true;
        setUnits([...units]);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [phase, paused, units, speedIndex, walls, terrainMap, moveUnit, addLog, saveGame]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        sound.playClick();
        if (phase === 'ready') {
          startCombat();
        } else if (phase === 'playing') {
          setPaused((p) => !p);
        }
      } else if (e.key === '1') {
        setSpeedIndex(0);
      } else if (e.key === '2') {
        setSpeedIndex(1);
      } else if (e.key === '3') {
        setSpeedIndex(2);
      } else if (e.key.toLowerCase() === 'm') {
        const nextMuted = sound.toggleMute();
        setIsMuted(nextMuted);
      } else if (e.key.toLowerCase() === 'a') {
        setControlMode((m) => (m === 'auto' ? 'manual' : 'auto'));
      } else if (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'b') {
        setInventoryModalOpen((v) => !v);
      } else if (e.key.toLowerCase() === 't') {
        setTeamModalOpen((v) => !v);
      } else if (e.key.toLowerCase() === 's') {
        setShopModalOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setTeamModalOpen(false);
        setInventoryModalOpen(false);
        setShopModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, startCombat]);

  // Handle Board Tile Click
  const handleTileClick = (x: number, y: number) => {
    sound.playClick();
    const clickedUnit = units.find((u) => u.hp > 0 && u.x === x && u.y === y);
    if (clickedUnit) {
      setSelectedId(clickedUnit.id);
      if (clickedUnit.kind === 'hero') {
        setSelectedHeroId(clickedUnit.id);
      }
    }

    if (controlMode !== 'manual' || phase !== 'playing' || !activeId) return;

    const curActive = units.find((u) => u.id === activeId);
    if (!curActive || curActive.kind !== 'hero' || curActive.acted) return;

    // 1. Move to clicked reachable tile (Each tile moved costs 1 MP)
    const matchedMoveTile = moveTiles.find((t) => t.x === x && t.y === y);
    if (!curActive.moved && matchedMoveTile) {
      moveUnit(curActive, x, y, (matchedMoveTile as { dist?: number }).dist);
      setMoveTiles([]);

      const eff = getEffectiveStats(curActive);
      const isRanged = eff.range >= 2;
      const curElev = elevations.has(`${x},${y}`) ? 1 : 0;

      const targets = units.filter(
        (u) =>
          u.kind === 'enemy' &&
          u.hp > 0 &&
          manhattan(curActive, u) <= eff.range &&
          clearShot(curActive, u, walls, terrainMap) &&
          (isRanged || (elevations.has(`${u.x},${u.y}`) ? 1 : 0) === curElev)
      );

      const inRangeBarrels = barrels.filter(
        (b) =>
          b.hp > 0 &&
          manhattan(curActive, b) <= eff.range &&
          clearShot(curActive, b, walls, terrainMap) &&
          (isRanged || (elevations.has(`${b.x},${b.y}`) ? 1 : 0) === curElev)
      );

      setTargetTiles([
        ...targets.map((t) => ({ x: t.x, y: t.y })),
        ...inRangeBarrels.map((b) => ({ x: b.x, y: b.y })),
      ]);
      setTargetingAction('attack');
      addLog(`<b>${curActive.name}</b> di chuyển đến (${x + 1}, ${y + 1}).`);
      return;
    }

    // 2. Attack clicked explosive barrel directly
    const clickedBarrel = barrels.find((b) => b.hp > 0 && b.x === x && b.y === y);
    if ((targetingAction === 'attack' || targetingAction === 'skill') && clickedBarrel) {
      if (targetTiles.some((t) => t.x === x && t.y === y)) {
        const weapon = equipped[curActive.id]?.weapon;
        curActive.combatAnim = {
          type: 'lunge',
          targetX: x,
          targetY: y,
          startTime: performance.now(),
          duration: 250,
        };
        if (weapon?.family === 'bow' || weapon?.family === 'crossbow') {
          sound.playArrow();
          triggerEffect(curActive, clickedBarrel, 'arrow', 0);
        } else if (weapon?.family === 'staff' || weapon?.family === 'tome') {
          sound.playMagic();
          triggerEffect(curActive, clickedBarrel, 'fire', 0);
        } else {
          sound.playSlash();
          triggerEffect(curActive, clickedBarrel, 'strike', 0);
        }
        addLog(`🎯 <b>${curActive.name}</b> ngắm bắn kích nổ <b>Thùng Thuốc Nổ</b>!`, 'skill');
        detonateBarrel(clickedBarrel.id);
        finishTurn(curActive);
        return;
      }
    }

    // 3. Attack clicked enemy target
    if (targetingAction === 'attack' && clickedUnit && clickedUnit.kind === 'enemy') {
      const eff = getEffectiveStats(curActive);
      const isRanged = eff.range >= 2;
      const curElev = elevations.has(`${curActive.x},${curActive.y}`) ? 1 : 0;
      const targetElev = elevations.has(`${clickedUnit.x},${clickedUnit.y}`) ? 1 : 0;

      if (!isRanged && curElev !== targetElev) {
        sound.playErrorBuzz();
        addLog(`⚠️ <b>${curActive.name}</b> đánh cận chiến không thể chạm tới mục tiêu ở tầng cao khác biệt! Hãy dùng cung/phép hoặc leo lên cùng tầng!`, 'normal');
        return;
      }

      if (targetTiles.some((t) => t.x === x && t.y === y)) {
        executeAttack(curActive, clickedUnit);
        finishTurn(curActive);
      }
    }
  };

  // Manual Attack button clicked
  const handleManualAttack = () => {
    const curActive = units.find((u) => u.id === activeId);
    if (!curActive || curActive.kind !== 'hero' || curActive.acted) return;

    const eff = getEffectiveStats(curActive);
    const isRanged = eff.range >= 2;
    const curElev = elevations.has(`${curActive.x},${curActive.y}`) ? 1 : 0;

    const targets = units.filter(
      (u) =>
        u.kind === 'enemy' &&
        u.hp > 0 &&
        manhattan(curActive, u) <= eff.range &&
        clearShot(curActive, u, walls, terrainMap) &&
        (isRanged || (elevations.has(`${u.x},${u.y}`) ? 1 : 0) === curElev)
    );

    const inRangeBarrels = barrels.filter(
      (b) =>
        b.hp > 0 &&
        manhattan(curActive, b) <= eff.range &&
        clearShot(curActive, b, walls, terrainMap) &&
        (isRanged || (elevations.has(`${b.x},${b.y}`) ? 1 : 0) === curElev)
    );

    setTargetTiles([
      ...targets.map((t) => ({ x: t.x, y: t.y })),
      ...inRangeBarrels.map((b) => ({ x: b.x, y: b.y })),
    ]);
    setTargetingAction('attack');
    addLog(`Chọn mục tiêu trong tầm đánh của <b>${curActive.name}</b> (Quái vật hoặc Thùng thuốc nổ).`, 'normal');
  };

  // Manual Skill button clicked with STRICT MP VALIDATION & AUDIO REJECTION
  const handleManualSkill = () => {
    const curActive = units.find((u) => u.id === activeId);
    if (!curActive || curActive.kind !== 'hero' || curActive.acted) return;

    const weapon = equipped[curActive.id]?.weapon;
    const eff = getEffectiveStats(curActive);
    const weaponFam = weapon?.family || 'sword';
    const skillInfo = WEAPON_FAMILIES[weaponFam] || { mpCost: 3 };
    const mpCost = skillInfo.mpCost;

    // Strict MP validation: Reject and play audio buzz if not enough MP
    if (curActive.mp < mpCost) {
      sound.playErrorBuzz();
      addLog(`⚠️ <b>${curActive.name}</b> không đủ MP để dùng kỹ năng! (Cần ${mpCost} MP, hiện có ${curActive.mp} MP).`, 'normal');
      return;
    }

    if ((curActive.skillCooldown || 0) > 0) {
      sound.playErrorBuzz();
      addLog(`⏳ <b>${curActive.name}</b> đang trong thời gian hồi chiêu (${curActive.skillCooldown} lượt nữa).`, 'normal');
      return;
    }

    const colorMap: Record<string, string> = {
      bell: '#22c55e',
      tome: '#38bdf8',
      staff: '#f97316',
      bow: '#4ade80',
      crossbow: '#4ade80',
      hammer: '#f59e0b',
      axe: '#ef4444',
      sword: '#eab308',
      spear: '#a855f7',
      dagger: '#ec4899',
    };
    triggerSkillCutIn(
      curActive,
      skillInfo.skillName,
      skillInfo.skillDesc,
      colorMap[weaponFam] || '#f59e0b',
      `${curActive.role} • KỸ NĂNG VŨ KHÍ`
    );

    const livingEnemies = units.filter((u) => u.kind === 'enemy' && u.hp > 0);

    // 1. Holy Bell Healing (Thánh Ca Bình Minh)
    if (weaponFam === 'bell') {
      const wounded = units
        .filter((u) => u.kind === 'hero' && u.hp > 0)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

      if (wounded) {
        curActive.mp -= mpCost;
        curActive.skillCooldown = 2;
        const healAmt = Math.min(18 + eff.matk, wounded.maxHp - wounded.hp);
        wounded.hp += healAmt;
        sound.playHeal();
        triggerEffect(curActive, wounded, 'heal', -healAmt, false, 'HỒI PHỤC!');
        recordHeroAction(curActive, 'magic');
        addLog(`✨ <b>${curActive.name}</b> rung <b>Thánh Ca Bình Minh</b>, hồi +${healAmt} HP cho ${wounded.name}! (Tiêu hao ${mpCost} MP)`, 'good');
        finishTurn(curActive);
        return;
      }
    }

    // 2. Tome (Băng Sương Phù Chú - Freeze & Setup Shatter!)
    if (weaponFam === 'tome') {
      const enemy = livingEnemies.sort((a, b) => b.hp - a.hp)[0];
      if (enemy) {
        curActive.mp -= mpCost;
        curActive.skillCooldown = 2;
        const dmg = Math.max(5, Math.round(eff.matk * 1.5 - enemy.def * 0.4));
        enemy.hp = Math.max(0, enemy.hp - dmg);
        enemy.frozenTicks = 2;
        sound.playMagic();
        shakeScreen(7);
        triggerEffect(curActive, enemy, 'spell', dmg, true, 'ĐÓNG BĂNG!');
        recordHeroAction(curActive, 'magic');
        addLog(`❄️ <b>${curActive.name}</b> niệm <b>Băng Sương Phù Chú</b> gây ${dmg} dmg và <b>ĐÓNG BĂNG ${enemy.name}</b> trong 2 lượt! (Sẵn sàng combo Vỡ Vụn x2 dmg!)`, 'skill');
        if (enemy.hp === 0) {
          dropLoot(enemy);
          awardExp(curActive, enemy);
        }
        finishTurn(curActive);
        return;
      }
    }

    // 3. Staff (Hỏa Cầu Ma Thuật - AoE Fire, Barrels & Oil Ignite!)
    if (weaponFam === 'staff') {
      const enemy = livingEnemies[0];
      if (enemy) {
        curActive.mp -= mpCost;
        curActive.skillCooldown = 2;
        const dmg = Math.max(6, Math.round(eff.matk * 1.6 - enemy.def * 0.4));
        enemy.hp = Math.max(0, enemy.hp - dmg);
        enemy.burnTicks = 2;
        sound.playMagic();
        shakeScreen(8);
        triggerEffect(curActive, enemy, 'fire', dmg, true, 'HỎA CẦU!');
        recordHeroAction(curActive, 'magic');
        addLog(`🔥 <b>${curActive.name}</b> phóng <b>Hỏa Cầu Ma Thuật</b> thiêu đốt ${enemy.name} với ${dmg} sát thương! (Tiêu hao ${mpCost} MP)`, 'skill');

        // Check oil ignite and barrel detonation near target
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const bx = enemy.x + dx;
            const by = enemy.y + dy;
            const tKey = `${bx},${by}`;
            if (terrainMap.get(tKey)?.type === 'oil') {
              terrainMap.set(tKey, { type: 'fire_ground' });
              triggerEffect(enemy, { x: bx, y: by }, 'oil_ignite', 0, false, 'DẦU CHÁY!');
              addLog(`🔥 <b>Hỏa Cầu</b> kích nổ vệt dầu (${bx + 1}, ${by + 1}) bùng cháy lan khắp sàn!`, 'skill');
            }
            const hitBarrel = barrels.find((b) => b.hp > 0 && b.x === bx && b.y === by);
            if (hitBarrel) {
              detonateBarrel(hitBarrel.id);
            }
          }
        }

        if (enemy.hp === 0) {
          dropLoot(enemy);
          awardExp(curActive, enemy);
        }
        finishTurn(curActive);
        return;
      }
    }

    // 4. Bow / Crossbow (Tiễn Chấn Động - Concussive Arrow Knockback into Walls/Barrels)
    if (weaponFam === 'bow' || weaponFam === 'crossbow') {
      const enemy = livingEnemies.sort((a, b) => a.hp - b.hp)[0];
      if (enemy) {
        curActive.mp -= mpCost;
        curActive.skillCooldown = 2;
        const dmg = Math.max(5, Math.round(eff.atk * 1.5 - enemy.def));
        sound.playArrow();
        shakeScreen(6);
        triggerEffect(curActive, enemy, 'arrow', dmg, true, 'TIỄN CHẤN ĐỘNG!');
        recordHeroAction(curActive, 'melee');
        addLog(`🏹 <b>${curActive.name}</b> giương cung bắn <b>Tiễn Chấn Động</b> cực mạnh vào ${enemy.name} gây ${dmg} sát thương!`, 'skill');
        executeAttack(curActive, enemy);
        finishTurn(curActive);
        return;
      }
    }

    // 5. Hammer / Axe (Chấn Địa Kích & Cuồng Lực Phách - Knockback, Wall Slam & Shatter)
    if (weaponFam === 'hammer' || weaponFam === 'axe') {
      const enemy = livingEnemies.find((e) => manhattan(curActive, e) <= eff.range) || livingEnemies[0];
      if (enemy) {
        curActive.mp -= mpCost;
        curActive.skillCooldown = 2;
        sound.playShieldBash();
        shakeScreen(9);
        triggerEffect(curActive, enemy, 'bash', 0, true, weaponFam === 'hammer' ? 'CHẤN ĐỊA!' : 'CUỒNG PHÁCH!');
        recordHeroAction(curActive, 'melee');
        addLog(`🔨 <b>${curActive.name}</b> tung <b>${skillInfo.skillName}</b> giáng đòn uy lực, Đẩy Lùi 2 ô va tường!`, 'skill');
        executeAttack(curActive, enemy);
        finishTurn(curActive);
        return;
      }
    }

    // 6. Sword / Spear / Dagger (Kiếm Khí Trảm, Thương Xuyên Vân)
    if (weaponFam === 'sword' || weaponFam === 'spear' || weaponFam === 'dagger') {
      const enemy = livingEnemies.find((e) => manhattan(curActive, e) <= eff.range) || livingEnemies[0];
      if (enemy) {
        curActive.mp -= mpCost;
        curActive.skillCooldown = 2;
        sound.playSlash();
        shakeScreen(7);
        triggerEffect(curActive, enemy, 'strike', 0, true, skillInfo.skillName);
        recordHeroAction(curActive, 'melee');
        addLog(`⚔️ <b>${curActive.name}</b> thi triển <b>${skillInfo.skillName}</b> đẩy lùi và chém xé toạc phòng tuyến!`, 'skill');
        executeAttack(curActive, enemy);
        finishTurn(curActive);
        return;
      }
    }

    // Default fallback strike
    handleManualAttack();
  };

  // Manual Special Skill button clicked with STRICT MP VALIDATION
  const handleManualSpecialSkill = () => {
    const curActive = units.find((u) => u.id === activeId);
    if (!curActive || curActive.kind !== 'hero' || curActive.acted) return;

    const specialItem = Object.values(equipped[curActive.id] || {}).find((i) => i?.specialSkill);
    if (!specialItem) return;

    const specialMp = specialItem.specialSkillMp || 4;
    if (curActive.mp < specialMp) {
      sound.playErrorBuzz();
      addLog(`⚠️ <b>${curActive.name}</b> không đủ MP để dùng Tuyệt Kỹ! (Cần ${specialMp} MP, hiện có ${curActive.mp} MP).`, 'normal');
      return;
    }

    if ((curActive.skillCooldown || 0) > 0) {
      sound.playErrorBuzz();
      addLog(`⏳ <b>${curActive.name}</b> đang trong thời gian hồi chiêu (${curActive.skillCooldown} lượt nữa).`, 'normal');
      return;
    }

    triggerSkillCutIn(
      curActive,
      specialItem.specialSkillName || 'Tuyệt Kỹ Thần Khí',
      specialItem.specialSkillDesc || 'Kích hoạt tuyệt kỹ huyền thoại đảo lộn càn khôn!',
      '#38bdf8',
      'TUYỆT KỸ TRANG BỊ'
    );

    const enemy = units.find((u) => u.kind === 'enemy' && u.hp > 0);
    const success = executeSpecialSkill(curActive, specialItem, enemy);
    if (success) {
      curActive.skillCooldown = 2;
      finishTurn(curActive);
    }
  };

  // Manual Defend button clicked (Gains guard & restores +3 MP!)
  const handleManualDefend = () => {
    const curActive = units.find((u) => u.id === activeId);
    if (!curActive || curActive.kind !== 'hero' || curActive.acted) return;

    curActive.guard = 4;
    const eff = getEffectiveStats(curActive);
    const restoreMp = 3;
    curActive.mp = Math.min(eff.mp, curActive.mp + restoreMp);
    sound.playShieldBash();
    recordHeroAction(curActive, 'defend');
    triggerEffect(curActive, curActive, 'stat_up', 0, false, `+${restoreMp} MP`);
    addLog(`🛡️ <b>${curActive.name}</b> vào thế phòng thủ (+${curActive.guard} Giáp, hồi phục <b>+${restoreMp} MP</b>).`, 'good');
    finishTurn(curActive);
  };

  // Manual End Turn button clicked
  const handleManualEndTurn = () => {
    const curActive = units.find((u) => u.id === activeId);
    if (!curActive || curActive.kind !== 'hero' || curActive.acted) return;

    addLog(`<b>${curActive.name}</b> kết thúc lượt.`, 'normal');
    finishTurn(curActive);
  };

  // Retreat to previous floor when defeated to grind EXP and loot
  const handleRetreatFloor = () => {
    setGameOverResult(null);
    const retreatF = Math.max(1, floor - 1);
    setFloor(retreatF);
    setShopStock(generateShopStock(retreatF));

    // Fully restore 100% MP and cure all negative debuffs
    setHeroRoster((prev) =>
      prev.map((h) => {
        const hEff = getEffectiveStats(h);
        return {
          ...h,
          mp: hEff.mp,
          isStunned: false,
          stunTicks: 0,
          skillCooldown: 0,
          burnTicks: 0,
          poisonTicks: 0,
          frozenTicks: 0,
        };
      })
    );

    addLog(`🔙 Đoàn thám hiểm tạm lùi về <b>Tầng ${retreatF}</b> để cày cấp, tìm kiếm trang bị và rèn luyện thể phách!`, 'good');
    setupFloor(retreatF);
  };

  // Advance to next floor after victory (100% MP fully restored!)
  const handleNextFloor = () => {
    setGameOverResult(null);
    const nextF = floor + 1;
    setFloor(nextF);
    setShopStock(generateShopStock(nextF));

    // Fully restore 100% MP and cure all negative debuffs when proceeding to next floor!
    setHeroRoster((prev) =>
      prev.map((h) => {
        const hEff = getEffectiveStats(h);
        return {
          ...h,
          mp: hEff.mp,
          isStunned: false,
          stunTicks: 0,
          skillCooldown: 0,
          burnTicks: 0,
          poisonTicks: 0,
          frozenTicks: 0,
        };
      })
    );

    // Potential companion recruit encounter (Strictly max team 4!)
    if (partyIds.length < MAX_PARTY_SIZE && Math.random() < 0.5) {
      let unrecruited = heroRoster.filter((h) => !partyIds.includes(h.id));
      if (unrecruited.length === 0) {
        const newAlly = generateRandomAdventurer();
        setHeroRoster((prev) => [...prev, newAlly]);
        unrecruited = [newAlly];
      }
      const candidate = unrecruited[Math.floor(Math.random() * unrecruited.length)];
      setRecruitCandidate(candidate);
    } else {
      setupFloor(nextF);
    }
  };

  // Recruit candidate companion (Strictly Max 4 heroes)
  const handleRecruitAccept = () => {
    if (recruitCandidate && partyIds.length < MAX_PARTY_SIZE) {
      const newParty = [...partyIds, recruitCandidate.id];
      setPartyIds(newParty);
      addLog(`✦ <b>${recruitCandidate.name}</b> đã gia nhập đoàn leo tháp (${newParty.length}/${MAX_PARTY_SIZE} thành viên)!`, 'good');
      setRecruitCandidate(null);
      setupFloor(floor, newParty);
    } else {
      setRecruitCandidate(null);
      setupFloor(floor);
    }
  };

  const handleRecruitDecline = () => {
    setRecruitCandidate(null);
    setupFloor(floor);
  };

  // Equip item (Universal! Any hero can equip any item)
  const handleEquipItem = (heroId: string, item: GearItem) => {
    sound.playClick();
    const curSlotItem = equipped[heroId]?.[item.slot];
    const newInventory = inventory.filter((i) => i.id !== item.id);
    if (curSlotItem) {
      newInventory.push(curSlotItem);
    }
    setInventory(newInventory);
    setEquipped((prev) => ({
      ...prev,
      [heroId]: {
        ...(prev[heroId] || {}),
        [item.slot]: item,
      },
    }));
    addLog(`Đã trang bị <b>${item.name}</b> cho ${heroRoster.find((h) => h.id === heroId)?.name || heroId}.`, 'good');
  };

  // Unequip item
  const handleUnequipItem = (heroId: string, slot: SlotType) => {
    sound.playClick();
    const curSlotItem = equipped[heroId]?.[slot];
    if (!curSlotItem) return;
    setInventory((prev) => [curSlotItem, ...prev]);
    setEquipped((prev) => {
      const updated = { ...(prev[heroId] || {}) };
      delete updated[slot];
      return { ...prev, [heroId]: updated };
    });
  };

  // Sell item
  const handleSellItem = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;
    sound.playGold();
    setGold((prev) => prev + item.sellPrice);
    setInventory((prev) => prev.filter((i) => i.id !== itemId));
    addLog(`Bán <b>${item.name}</b> nhận được +${item.sellPrice} đồng.`, 'item');
  };

  // Bulk sell items
  const handleBulkSell = (itemIds: string[]) => {
    if (!itemIds || itemIds.length === 0) return;
    const toSell = new Set(itemIds);
    let earned = 0;
    setInventory((prev) => {
      const remaining: GearItem[] = [];
      prev.forEach((item) => {
        if (toSell.has(item.id)) {
          earned += item.sellPrice;
        } else {
          remaining.push(item);
        }
      });
      return remaining;
    });
    sound.playGold();
    setGold((prev) => prev + earned);
    addLog(`Đã bán hàng loạt <b>${itemIds.length} món trang bị</b>, thu được <b>+${earned} đồng</b>!`, 'item');
  };

  // Buy item from shop
  const handleBuyItem = (item: GearItem) => {
    const price = item.price || Math.round(item.sellPrice * 1.6);
    if (gold < price) return;
    sound.playGold();
    setGold((prev) => prev - price);
    setShopStock((prev) => prev.filter((i) => i.id !== item.id));
    setInventory((prev) => [item, ...prev]);
    addLog(`Đã mua <b>${item.icon} ${item.name}</b> từ thương gia.`, 'item');
  };

  // Proceed from Dungeon Door Cutscene (with chosen fork and perks!)
  const handleProceedFromDoor = (selectedBiome?: DungeonBiome, selectedOption?: DungeonForkOption) => {
    sound.playLevelUp();
    if (selectedOption?.rewardType === 'gold') {
      setGold((prev) => prev + 35);
      addLog('💰 Nhận được <b>+35 Vàng</b> từ lựa chọn ngã rẽ Hầm Mỏ!', 'item');
    } else if (selectedOption?.rewardType === 'heal') {
      units.filter((u) => u.kind === 'hero').forEach((h) => {
        h.hp = getEffectiveStats(h).hp;
      });
      addLog('💖 <b>Đài Tế Thánh Quang</b> đã hồi phục 100% Sinh Mệnh & Ma Lực cho đoàn thám hiểm!', 'good');
    }
    const nextF = floor + 1;
    setFloor(nextF);
    setShopStock(generateShopStock(nextF));
    if (selectedBiome) {
      setCurrentBiome(selectedBiome);
    }
    // Potential companion recruit encounter (Strictly max 4 heroes!)
    if (partyIds.length < MAX_PARTY_SIZE && Math.random() < 0.5) {
      let unrecruited = heroRoster.filter((h) => !partyIds.includes(h.id));
      if (unrecruited.length === 0) {
        const newAlly = generateRandomAdventurer();
        setHeroRoster((prev) => [...prev, newAlly]);
        unrecruited = [newAlly];
      }
      const candidate = unrecruited[Math.floor(Math.random() * unrecruited.length)];
      setRecruitCandidate(candidate);
      setupFloor(nextF);
    } else {
      setupFloor(nextF);
    }
  };

  // Current active unit helper
  const curActiveUnit = units.find((u) => u.id === activeId) || null;
  const currentBiomePreset = BIOME_PRESETS.find((b) => b.id === currentBiome) || BIOME_PRESETS[0];

  // Render Title Screen if in title phase
  if (phase === 'title') {
    return (
      <TitleScreen
        hasSave={hasSave}
        saveFloor={saveFloor}
        initialRoster={heroRoster}
        onContinue={handleContinueSavedRun}
        onStartNewRun={handleStartNewRun}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-mono select-none">
      {/* Top Navigation Bar: Clean 16-Bit Pixel Forged Theme */}
      <header className="border-b border-[#1e293b] bg-[#0b0f19] pixel-frame sticky top-0 z-30 px-3 sm:px-4 py-2 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              saveGame();
              setPhase('title');
            }}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <div className="w-7 h-7 pixel-frame-gold bg-amber-600 text-slate-950 flex items-center justify-center font-bold text-xs shadow">
              ⚔️
            </div>
            <h1 className="text-sm font-bold font-silkscreen tracking-wide text-slate-100 group-hover:text-amber-300 transition-colors">
              THÁP ĐỒNG HÀNH
            </h1>
          </button>
        </div>

        {/* Floor, Biome, and Quick Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="pixel-frame flex items-center gap-1.5 px-2.5 py-1 bg-[#080c14] text-xs">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-silkscreen text-[10px]">TẦNG</span>
            <span className="font-bold text-slate-100 font-silkscreen text-[11px]">{String(floor).padStart(2, '0')}</span>
            {floorBoss && (
              <span className="ml-1 px-1 py-0.2 text-[9px] bg-rose-950 text-rose-300 border border-rose-800 font-bold font-silkscreen animate-pulse">
                TRÙM
              </span>
            )}
          </div>
          <div className="hidden sm:flex pixel-frame items-center gap-1.5 px-2.5 py-1 bg-[#080c14] text-xs">
            <span className="text-slate-400 font-silkscreen text-[10px]">VÒNG</span>
            <span className="font-bold text-amber-400 font-silkscreen text-[11px]">{String(round).padStart(2, '0')}</span>
          </div>

          {/* Quick tab shortcuts */}
          <button
            onClick={() => setTeamModalOpen(true)}
            className="pixel-btn px-2.5 py-1.5 bg-[#1e293b] text-slate-200 hover:text-amber-300 flex items-center gap-1.5 text-xs font-mono font-semibold"
            title="Quản lý trang bị"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-silkscreen text-[10px]">Trang Bị</span>
          </button>
          <button
            onClick={() => setShopModalOpen(true)}
            className="pixel-btn px-2.5 py-1.5 bg-[#1e293b] text-slate-200 hover:text-amber-300 flex items-center gap-1.5 text-xs font-mono font-semibold"
            title="Cửa hàng thương nhân"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-silkscreen text-[10px]">Cửa Tiệm</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="pixel-btn p-1.5 bg-[#1e293b] text-slate-300 hover:text-amber-300 text-xs font-mono"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left Column: Battle Arena & Combat Controls (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-2.5 min-w-0">
          {/* Room Title, Biome & Tactical Objective */}
          <div className="flex flex-wrap items-center justify-between px-1 gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-amber-300 font-silkscreen">
                {currentBiomePreset.name}
              </h2>
              <span className="text-slate-600 font-mono text-xs">·</span>
              <span className="text-xs font-mono text-slate-400">Tầng {floor}</span>
              {floorBoss && (
                <span className="text-[10px] font-silkscreen text-rose-400 font-bold ml-1 animate-pulse">
                  [TRÙM TẦNG]
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="pixel-frame flex items-center gap-1.5 bg-[#0b0f19] px-2.5 py-1 text-slate-300 font-silkscreen text-[10px]">
                <span className="w-2 h-2 bg-amber-400 animate-pulse" />
                <span>
                  {phase === 'ready' ? 'SẴN SÀNG' : phase === 'exiting' ? 'QUA CỔNG' : 'CHIẾN ĐẤU'}
                </span>
              </span>
            </div>
          </div>

          {/* Canvas Battlefield with Procedural Biome & Visual Equipment */}
          <BattleCanvas
            units={units}
            walls={walls}
            terrainMap={terrainMap}
            triggeredTraps={triggeredTraps}
            bossTelegraph={bossTelegraph}
            visualEffects={visualEffects}
            activeId={activeId}
            selectedId={selectedId}
            moveTiles={moveTiles}
            targetTiles={targetTiles}
            phase={phase}
            biome={currentBiome}
            equipped={equipped}
            onTileClick={handleTileClick}
            getEffectiveStats={getEffectiveStats}
            screenShake={screenShake}
            elevations={elevations}
            barrels={barrels}
          />

          {/* Action Bar & Controls */}
          <ActionBar
            phase={phase}
            paused={paused}
            activeUnit={curActiveUnit}
            controlMode={controlMode}
            speed={PLAYBACK_SPEEDS[speedIndex]}
            isMuted={isMuted}
            equipped={equipped}
            onTogglePlay={() => {
              sound.playClick();
              if (phase === 'ready') {
                startCombat();
              } else {
                setPaused(!paused);
              }
            }}
            onToggleSpeed={() => {
              sound.playClick();
              setSpeedIndex((prev) => (prev + 1) % PLAYBACK_SPEEDS.length);
            }}
            onRestartRoom={() => {
              sound.playClick();
              setupFloor(floor);
            }}
            onToggleMute={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            onToggleControlMode={() => {
              sound.playClick();
              const nextMode = controlMode === 'auto' ? 'manual' : 'auto';
              setControlMode(nextMode);
              addLog(`Đã chuyển sang chế độ <b>${nextMode === 'auto' ? 'Tự Động' : 'Thủ Công'}</b>.`, 'normal');
            }}
            onManualAttack={handleManualAttack}
            onManualSkill={handleManualSkill}
            onManualSpecialSkill={handleManualSpecialSkill}
            onManualDefend={handleManualDefend}
            onManualEndTurn={handleManualEndTurn}
            getEffectiveStats={getEffectiveStats}
          />

          {/* Combat Log Feed */}
          <CombatLog logs={logs} onClear={() => setLogs([])} />
        </div>

        {/* Right Column: Party Sidebar & Inspector (4 cols on desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <PartySidebar
            heroes={units.filter((u) => u.kind === 'hero' && !u.isSummon)}
            selectedHeroId={selectedHeroId}
            activeId={activeId}
            equipped={equipped}
            gold={gold}
            inventoryCount={inventory.length}
            onSelectHero={(id) => {
              sound.playClick();
              setSelectedHeroId(id);
              setSelectedId(id);
            }}
            getEffectiveStats={getEffectiveStats}
            onOpenInventory={() => setInventoryModalOpen(true)}
            onOpenTeam={() => setTeamModalOpen(true)}
          />
        </div>
      </main>

      {/* MODALS */}
      {teamModalOpen && (
        <TeamManagerModal
          heroes={units.filter((u) => u.kind === 'hero' && !u.isSummon)}
          equipped={equipped}
          inventory={inventory}
          gold={gold}
          onClose={() => setTeamModalOpen(false)}
          onEquip={handleEquipItem}
          onUnequip={handleUnequipItem}
          getEffectiveStats={getEffectiveStats}
        />
      )}

      {inventoryModalOpen && (
        <InventoryManagerModal
          inventory={inventory}
          heroes={units.filter((u) => u.kind === 'hero' && !u.isSummon)}
          gold={gold}
          onClose={() => setInventoryModalOpen(false)}
          onSellItem={handleSellItem}
          onBulkSell={handleBulkSell}
          onEquipItem={handleEquipItem}
        />
      )}

      {shopModalOpen && (
        <ShopModal
          stock={shopStock}
          gold={gold}
          floor={floor}
          onClose={() => setShopModalOpen(false)}
          onBuyItem={handleBuyItem}
        />
      )}

      {recruitCandidate && (
        <RecruitModal
          candidate={recruitCandidate}
          onAccept={handleRecruitAccept}
          onDecline={handleRecruitDecline}
        />
      )}

      {gameOverResult && (
        <GameOverModal
          isVictory={gameOverResult === 'won'}
          floor={floor}
          isBoss={floorBoss}
          lootFound={floorLootFound}
          goldEarned={floorGoldEarned}
          onContinue={handleNextFloor}
          onRetry={() => {
            setGameOverResult(null);
            setupFloor(floor);
          }}
          onRetreatFloor={handleRetreatFloor}
          onBackToTitle={() => {
            setGameOverResult(null);
            setPhase('title');
          }}
        />
      )}

      {/* Cinematic Opening Story Cutscene */}
      {phase === 'opening_cutscene' && (
        <CinematicOpeningModal
          heroes={units.filter((u) => u.kind === 'hero' && !u.isSummon)}
          floor={floor}
          onEnter={() => {
            if (floorBoss && currentBoss) {
              setPhase('boss_cutscene');
            } else {
              setPhase('ready');
            }
          }}
        />
      )}

      {/* Menacing Boss Introduction Cutscene */}
      {phase === 'boss_cutscene' && currentBoss && (
        <BossIntroModal
          boss={currentBoss}
          floor={floor}
          onFight={() => {
            setPhase('ready');
          }}
        />
      )}

      {/* Grand Boss Victory Celebration Cutscene */}
      {phase === 'boss_victory_cutscene' && (
        <BossVictoryCutscene
          bossName={currentBoss?.name || 'Trùm Đại Tháp'}
          floor={floor}
          heroes={units.filter((u) => u.kind === 'hero' && !u.isSummon)}
          lootFound={floorLootFound}
          goldEarned={floorGoldEarned}
          onContinue={handleNextFloor}
        />
      )}

      {/* Dungeon Door Transition & 2-Way Fork Choice Cutscene */}
      {phase === 'door_cutscene' && (
        <DungeonDoorCutscene
          floor={floor}
          heroes={units.filter((u) => u.kind === 'hero' && !u.isSummon)}
          forkOptions={doorForkOptions}
          onProceed={handleProceedFromDoor}
        />
      )}

      {/* Tactical Anime-Style Skill Cut-In Overlay */}
      {skillCutIn && (
        <SkillCutInOverlay
          data={skillCutIn}
          onComplete={() => setSkillCutIn(null)}
        />
      )}
    </div>
  );
}
