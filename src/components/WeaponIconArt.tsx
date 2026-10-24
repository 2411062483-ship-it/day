import React from 'react';
import { GearItem, GearTemplate, SlotType, WeaponFamily, ArmorFamily, ShieldFamily } from '../types/game';
import { RARITY_COLORS } from '../game/constants';

interface WeaponIconArtProps {
  item?: GearItem | GearTemplate | null;
  family?: WeaponFamily | ArmorFamily | ShieldFamily | string | null;
  slot?: SlotType;
  name?: string;
  rarity?: number;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRarityGlow?: boolean;
}

// Helper: Renders an array of [x, y, w, h, color] pixel blocks in 32x32 pixel art grid
type PixelBlock = [number, number, number, number, string];

function renderPixelGrid(pixels: PixelBlock[]) {
  return (
    <svg
      viewBox="0 0 32 32"
      className="w-full h-full"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
    >
      {pixels.map(([x, y, w, h, col], idx) => (
        <rect key={idx} x={x} y={y} width={w} height={h} fill={col} />
      ))}
    </svg>
  );
}

// ==========================================
// 1. AUTHENTIC 16-BIT PIXEL ART WEAPONS
// ==========================================

// Broadsword matching the user's reference image exactly (image_7678da56.png):
// Diagonal steel blade with bevel highlight, stepped golden crossguard, wrapped leather grip, ruby pommel
const PIXEL_BROADSWORD: PixelBlock[] = [
  // Ruby Pommel at (3, 28)
  [3, 29, 2, 2, '#4c0519'],
  [3, 28, 1, 1, '#fda4af'],
  [4, 28, 1, 1, '#f43f5e'],
  [3, 29, 1, 1, '#e11d48'],
  [4, 29, 1, 1, '#be123c'],
  [4, 30, 1, 1, '#881337'],
  [2, 29, 1, 1, '#4c0519'],
  [5, 28, 1, 1, '#4c0519'],

  // Golden Pommel Cap & Grip
  [5, 27, 2, 2, '#ca8a04'],
  [5, 26, 1, 1, '#facc15'],
  [6, 27, 1, 1, '#854d0e'],
  [6, 25, 2, 2, '#92400e'],
  [7, 25, 1, 1, '#b45309'],
  [6, 26, 1, 1, '#78350f'],
  [7, 24, 2, 2, '#ca8a04'],
  [7, 23, 1, 1, '#fde047'],
  [8, 24, 1, 1, '#a16207'],

  // Ornate Golden Crossguard (Stepped Wing Quillons)
  // Left Wing Quillon
  [5, 22, 2, 2, '#451a03'],
  [6, 21, 2, 2, '#ca8a04'],
  [6, 20, 2, 1, '#facc15'],
  [5, 21, 1, 2, '#eab308'],
  [7, 22, 1, 1, '#854d0e'],
  // Center Guard Block
  [8, 22, 3, 3, '#eab308'],
  [8, 21, 2, 1, '#fde047'],
  [10, 21, 1, 1, '#facc15'],
  [9, 23, 2, 2, '#ca8a04'],
  [8, 23, 1, 1, '#854d0e'],
  [10, 24, 1, 1, '#713f12'],
  // Right Wing Quillon
  [11, 24, 2, 2, '#ca8a04'],
  [12, 25, 2, 2, '#facc15'],
  [13, 26, 1, 1, '#fde047'],
  [13, 25, 1, 1, '#eab308'],
  [12, 26, 1, 1, '#854d0e'],
  [11, 25, 1, 1, '#713f12'],

  // Diagonal Steel Blade (From Guard at 10,20 to Tip at 28,3)
  // Outer Dark Boundary Outlines
  [10, 19, 1, 2, '#1e293b'],
  [11, 18, 1, 2, '#1e293b'],
  [12, 16, 1, 2, '#1e293b'],
  [13, 15, 1, 2, '#1e293b'],
  [14, 13, 1, 2, '#1e293b'],
  [15, 12, 1, 2, '#1e293b'],
  [16, 10, 1, 2, '#1e293b'],
  [17, 9, 1, 2, '#1e293b'],
  [18, 7, 1, 2, '#1e293b'],
  [19, 6, 1, 2, '#1e293b'],
  [20, 5, 1, 1, '#1e293b'],
  [21, 4, 2, 1, '#1e293b'],
  [23, 3, 2, 1, '#1e293b'],
  [25, 2, 3, 1, '#1e293b'],

  // Blade Tip
  [27, 3, 1, 2, '#ffffff'],
  [28, 3, 1, 1, '#cbd5e1'],
  [27, 5, 1, 2, '#64748b'],
  [28, 4, 1, 2, '#334155'],

  // Upper Bevel (Pure White Spine Highlight & Light Steel)
  [24, 3, 2, 1, '#ffffff'],
  [22, 4, 2, 1, '#ffffff'],
  [20, 5, 2, 1, '#ffffff'],
  [18, 7, 2, 1, '#ffffff'],
  [16, 9, 2, 1, '#ffffff'],
  [14, 11, 2, 1, '#ffffff'],
  [12, 13, 2, 1, '#ffffff'],
  [11, 15, 2, 1, '#ffffff'],

  // Midtone Blade Body (Reflective Blue-Steel)
  [25, 4, 2, 2, '#e2e8f0'],
  [23, 5, 2, 2, '#cbd5e1'],
  [21, 6, 2, 2, '#cbd5e1'],
  [19, 8, 2, 2, '#94a3b8'],
  [17, 10, 2, 2, '#94a3b8'],
  [15, 12, 2, 2, '#94a3b8'],
  [13, 14, 2, 2, '#94a3b8'],
  [12, 17, 2, 2, '#cbd5e1'],

  // Lower Bevel (Shadow Slate Steel)
  [25, 6, 2, 2, '#64748b'],
  [23, 7, 2, 2, '#64748b'],
  [21, 9, 2, 2, '#475569'],
  [19, 11, 2, 2, '#475569'],
  [17, 13, 2, 2, '#475569'],
  [15, 15, 2, 2, '#334155'],
  [13, 17, 2, 2, '#334155'],
  [11, 19, 2, 2, '#1e293b'],

  // Lower Edge Outline
  [12, 20, 2, 1, '#0f172a'],
  [14, 18, 2, 1, '#0f172a'],
  [16, 16, 2, 1, '#0f172a'],
  [18, 14, 2, 1, '#0f172a'],
  [20, 12, 2, 1, '#0f172a'],
  [22, 10, 2, 1, '#0f172a'],
  [24, 8, 2, 1, '#0f172a'],
  [26, 6, 2, 1, '#0f172a'],
];

// Long Thần Ma Kiếm / Flame Dragon Blade (Serrated flaming dragon edge)
const PIXEL_DRAGON_SWORD: PixelBlock[] = [
  // Dragon Ruby Pommel
  [3, 29, 2, 2, '#7f1d1d'],
  [3, 28, 1, 1, '#fde047'],
  [4, 29, 1, 1, '#ea580c'],
  // Grip with dragon scale wraps
  [5, 27, 2, 2, '#9a3412'],
  [6, 25, 2, 2, '#c2410c'],
  [7, 24, 2, 2, '#7c2d12'],
  // Golden Dragon-Maw Guard
  [5, 21, 3, 2, '#f59e0b'],
  [8, 21, 3, 3, '#f59e0b'],
  [9, 23, 3, 2, '#d97706'],
  [11, 25, 3, 2, '#b45309'],
  [7, 20, 2, 1, '#fde047'],
  [12, 24, 1, 1, '#ef4444'], // Glowing dragon eye
  // Molten Magma Serrated Blade
  [11, 18, 2, 2, '#f97316'],
  [12, 16, 2, 2, '#ea580c'],
  [13, 14, 2, 2, '#fbbf24'],
  [14, 13, 2, 2, '#f97316'],
  [15, 11, 2, 2, '#ea580c'],
  [16, 10, 2, 2, '#fef08a'],
  [17, 8, 2, 2, '#f97316'],
  [19, 7, 2, 2, '#ea580c'],
  [21, 5, 2, 2, '#fbbf24'],
  [23, 4, 2, 2, '#f97316'],
  [25, 3, 2, 2, '#fef08a'],
  [27, 2, 2, 2, '#ffffff'],
  // Flame Aura Spikes along Spine
  [13, 11, 1, 2, '#dc2626'],
  [16, 7, 1, 2, '#ea580c'],
  [19, 4, 1, 2, '#f59e0b'],
  [22, 2, 1, 2, '#fde047'],
  // Dark obsidian underside
  [14, 18, 2, 2, '#450a0a'],
  [17, 15, 2, 2, '#450a0a'],
  [20, 12, 2, 2, '#450a0a'],
  [23, 9, 2, 2, '#7f1d1d'],
];

// Blood Katana Muramasa (Curved crimson bleeding edge)
const PIXEL_MURAMASA: PixelBlock[] = [
  // White/Black wrapped tsuka handle
  [4, 29, 2, 2, '#0f172a'],
  [5, 28, 1, 1, '#e2e8f0'],
  [5, 27, 2, 2, '#0f172a'],
  [6, 26, 1, 1, '#e2e8f0'],
  [6, 25, 2, 2, '#0f172a'],
  [7, 24, 1, 1, '#e2e8f0'],
  // Golden Oval Tsuba Guard
  [7, 22, 3, 2, '#ca8a04'],
  [8, 21, 3, 2, '#facc15'],
  [9, 23, 2, 2, '#854d0e'],
  // Crimson Slender Curved Blade
  [10, 20, 2, 2, '#be123c'],
  [11, 18, 2, 2, '#e11d48'],
  [12, 16, 2, 2, '#fda4af'],
  [14, 14, 2, 2, '#be123c'],
  [16, 12, 2, 2, '#e11d48'],
  [18, 10, 2, 2, '#fda4af'],
  [20, 8, 2, 2, '#ffffff'],
  [22, 6, 2, 2, '#e11d48'],
  [24, 4, 2, 2, '#be123c'],
  [26, 2, 2, 2, '#ffffff'],
  // Blood Drips falling from edge
  [13, 19, 1, 2, '#991b1b'],
  [17, 15, 1, 2, '#e11d48'],
  [21, 11, 1, 2, '#991b1b'],
];

// Heavy Battleaxe (Double-bitted steel bearded axe with gold trim)
const PIXEL_BATTLEAXE: PixelBlock[] = [
  // Long diagonal ashwood haft
  [4, 28, 2, 2, '#78350f'],
  [6, 26, 2, 2, '#92400e'],
  [8, 24, 2, 2, '#78350f'],
  [10, 22, 2, 2, '#92400e'],
  [12, 20, 2, 2, '#78350f'],
  [14, 18, 2, 2, '#b45309'],
  [16, 16, 2, 2, '#78350f'],
  [18, 14, 2, 2, '#92400e'],
  [20, 12, 2, 2, '#78350f'],
  [22, 10, 2, 2, '#92400e'],
  [24, 8, 2, 2, '#ca8a04'],
  // Steel Spiked Axe Head
  [20, 6, 6, 6, '#475569'],
  [22, 4, 2, 2, '#cbd5e1'],
  // Left Blade Flange
  [15, 6, 5, 2, '#94a3b8'],
  [14, 4, 4, 2, '#cbd5e1'],
  [13, 3, 3, 2, '#ffffff'],
  [14, 8, 4, 2, '#475569'],
  [13, 9, 3, 2, '#1e293b'],
  // Right Blade Flange
  [25, 11, 3, 4, '#94a3b8'],
  [27, 12, 3, 3, '#cbd5e1'],
  [29, 13, 2, 2, '#ffffff'],
  [26, 9, 3, 3, '#475569'],
  // Golden Center Boss & Rivets
  [22, 8, 2, 2, '#facc15'],
  [21, 7, 1, 1, '#fde047'],
  [23, 9, 1, 1, '#854d0e'],
];

// Heavy War Hammer / Maul (Massive beveled steel block head with gold filigree)
const PIXEL_WARHAMMER: PixelBlock[] = [
  // Heavy shaft
  [5, 27, 2, 2, '#78350f'],
  [7, 25, 2, 2, '#92400e'],
  [9, 23, 2, 2, '#78350f'],
  [11, 21, 2, 2, '#92400e'],
  [13, 19, 2, 2, '#78350f'],
  [15, 17, 2, 2, '#ca8a04'],
  [17, 15, 2, 2, '#78350f'],
  // Solid Cuboid Steel Maul Head (at 18, 6)
  [18, 5, 10, 8, '#334155'],
  [19, 4, 8, 2, '#e2e8f0'],
  [17, 6, 2, 6, '#94a3b8'],
  [27, 6, 2, 6, '#1e293b'],
  [19, 6, 7, 6, '#64748b'],
  // Top Face Highlight
  [20, 4, 6, 1, '#ffffff'],
  // Front Impact Face (Spiked Pyramid)
  [27, 7, 3, 4, '#94a3b8'],
  [29, 8, 2, 2, '#ffffff'],
  // Golden Runic Inlay
  [22, 7, 2, 4, '#facc15'],
  [20, 8, 5, 1, '#facc15'],
];

// Assassin Stiletto Dagger (Slender sharp blade, emerald poison drop)
const PIXEL_DAGGER: PixelBlock[] = [
  // Leather grip & round pommel
  [6, 26, 2, 2, '#1e293b'],
  [5, 27, 2, 2, '#ca8a04'],
  [7, 24, 2, 2, '#334155'],
  [8, 23, 2, 2, '#1e293b'],
  // S-Curved Guard
  [7, 21, 4, 2, '#facc15'],
  [6, 20, 2, 2, '#ca8a04'],
  [10, 22, 2, 2, '#854d0e'],
  // Keen Stiletto Blade
  [10, 19, 2, 2, '#cbd5e1'],
  [12, 17, 2, 2, '#e2e8f0'],
  [14, 15, 2, 2, '#cbd5e1'],
  [16, 13, 2, 2, '#ffffff'],
  [18, 11, 2, 2, '#e2e8f0'],
  [20, 9, 2, 2, '#cbd5e1'],
  [22, 7, 2, 2, '#ffffff'],
  [24, 5, 2, 2, '#cbd5e1'],
  [26, 3, 2, 2, '#ffffff'],
  // Dark shadow fuller
  [12, 19, 2, 1, '#475569'],
  [15, 16, 2, 1, '#475569'],
  [18, 13, 2, 1, '#334155'],
  // Venomous Emerald Drip at tip
  [27, 2, 2, 2, '#10b981'],
  [28, 4, 1, 2, '#34d399'],
];

// Recurve Longbow (Curved wood, golden nocks, taut bowstring)
const PIXEL_BOW: PixelBlock[] = [
  // Curved wood limb (Top half)
  [26, 3, 2, 2, '#facc15'], // Gold tip
  [24, 5, 2, 2, '#b45309'],
  [21, 8, 2, 2, '#78350f'],
  [18, 11, 2, 2, '#b45309'],
  [16, 15, 2, 3, '#ca8a04'], // Leather handle grip
  // Curved wood limb (Bottom half)
  [18, 19, 2, 2, '#b45309'],
  [21, 22, 2, 2, '#78350f'],
  [24, 25, 2, 2, '#b45309'],
  [26, 27, 2, 2, '#facc15'], // Gold tip
  // Bowstring
  [25, 4, 1, 24, '#e2e8f0'],
  // Nocked Arrow with steel broadhead & red fletching
  [10, 16, 15, 1, '#d97706'],
  [25, 15, 3, 3, '#ef4444'], // Fletching
  [9, 15, 2, 3, '#cbd5e1'],  // Steel arrowhead
  [8, 16, 1, 1, '#ffffff'],
];

// Archmage Staff (Gnarled wood, floating glowing sapphire orb)
const PIXEL_STAFF: PixelBlock[] = [
  // Long elderwood staff
  [5, 28, 2, 2, '#78350f'],
  [7, 25, 2, 2, '#92400e'],
  [9, 22, 2, 2, '#78350f'],
  [11, 19, 2, 2, '#92400e'],
  [13, 16, 2, 2, '#78350f'],
  [15, 13, 2, 2, '#ca8a04'],
  // Twisted Root Crown Prong
  [17, 10, 2, 3, '#78350f'],
  [16, 7, 2, 3, '#92400e'],
  [19, 5, 3, 2, '#b45309'],
  [21, 8, 2, 3, '#78350f'],
  [23, 11, 2, 3, '#92400e'],
  // Floating Arcane Sapphire Orb
  [19, 8, 4, 4, '#0284c7'],
  [19, 8, 2, 2, '#38bdf8'],
  [20, 8, 1, 1, '#ffffff'],
  [21, 10, 2, 2, '#0369a1'],
  // Magic Aura Sparkles
  [17, 6, 1, 1, '#bae6fd'],
  [24, 7, 1, 1, '#7dd3fc'],
  [20, 13, 1, 1, '#38bdf8'],
];

// Arcane Grimoire / Spell Tome
const PIXEL_TOME: PixelBlock[] = [
  // Leather book cover
  [7, 6, 18, 20, '#451a03'],
  [8, 7, 16, 18, '#78350f'],
  [9, 8, 14, 16, '#9a3412'],
  // Gilded Brass Corners
  [7, 6, 4, 4, '#facc15'],
  [21, 6, 4, 4, '#facc15'],
  [7, 22, 4, 4, '#facc15'],
  [21, 22, 4, 4, '#facc15'],
  // Golden Arcane Rune in Center
  [15, 11, 2, 10, '#fde047'],
  [11, 15, 10, 2, '#fde047'],
  [13, 13, 6, 6, '#facc15'],
  [14, 14, 4, 4, '#7c2d12'],
  [15, 15, 2, 2, '#38bdf8'], // Glowing magic core
  // White parchment page edges
  [25, 8, 2, 16, '#fef08a'],
  [26, 9, 1, 14, '#ffffff'],
];

// Sacred Chime / Temple Bell
const PIXEL_BELL: PixelBlock[] = [
  // Holy golden ring handle
  [14, 4, 4, 3, '#fde047'],
  [15, 5, 2, 1, '#78350f'],
  // Flared golden bell body
  [12, 7, 8, 4, '#facc15'],
  [10, 11, 12, 6, '#eab308'],
  [8, 17, 16, 5, '#ca8a04'],
  [7, 22, 18, 3, '#fde047'],
  // Clapper & Holy Radiant Glow
  [15, 24, 2, 3, '#854d0e'],
  [14, 26, 4, 3, '#f59e0b'],
  // Holy aura beams
  [4, 15, 2, 2, '#fef08a'],
  [26, 15, 2, 2, '#fef08a'],
  [15, 1, 2, 2, '#ffffff'],
];

// ==========================================
// 2. AUTHENTIC 16-BIT PIXEL ART SHIELDS
// ==========================================

// Aegis Royal Tower Shield (Gold trimmed, blue sapphire boss, steel plates)
const PIXEL_AEGIS_SHIELD: PixelBlock[] = [
  // Ornate Gold Rim Frame
  [8, 4, 16, 2, '#fde047'],
  [7, 6, 18, 2, '#facc15'],
  [6, 8, 2, 14, '#facc15'],
  [24, 8, 2, 14, '#facc15'],
  [7, 22, 2, 4, '#ca8a04'],
  [23, 22, 2, 4, '#ca8a04'],
  [9, 25, 4, 3, '#ca8a04'],
  [19, 25, 4, 3, '#ca8a04'],
  [13, 27, 6, 3, '#854d0e'],
  [15, 29, 2, 2, '#713f12'],
  // Steel Shield Plate
  [8, 8, 16, 15, '#475569'],
  [9, 9, 14, 13, '#64748b'],
  [10, 10, 12, 11, '#94a3b8'],
  // Vertical & Horizontal Steel Cross Reenforcement
  [15, 8, 2, 15, '#e2e8f0'],
  [8, 14, 16, 2, '#e2e8f0'],
  // Radiant Sapphire Core Emblem
  [14, 13, 4, 4, '#0284c7'],
  [15, 14, 2, 2, '#38bdf8'],
  [15, 14, 1, 1, '#ffffff'],
];

// Steel Knight Heater Shield (Classic triangular steel shield with rivets)
const PIXEL_STEEL_SHIELD: PixelBlock[] = [
  // Iron Outer Rim
  [8, 5, 16, 2, '#94a3b8'],
  [7, 7, 2, 12, '#64748b'],
  [23, 7, 2, 12, '#64748b'],
  [9, 19, 3, 4, '#475569'],
  [20, 19, 3, 4, '#475569'],
  [12, 23, 4, 4, '#334155'],
  [15, 27, 2, 3, '#1e293b'],
  // Center Steel Plate
  [9, 7, 14, 12, '#334155'],
  [10, 8, 12, 10, '#475569'],
  // Crimson Heraldry Chevron
  [11, 10, 10, 6, '#be123c'],
  [13, 11, 6, 4, '#e11d48'],
  [15, 12, 2, 2, '#fda4af'],
  // Corner Steel Rivets
  [9, 6, 2, 2, '#ffffff'],
  [21, 6, 2, 2, '#ffffff'],
  [15, 24, 2, 2, '#ffffff'],
];

// Bronze Spiked Buckler Shield
const PIXEL_BUCKLER: PixelBlock[] = [
  // Round Bronze Rim
  [11, 5, 10, 2, '#d97706'],
  [8, 7, 4, 3, '#b45309'],
  [20, 7, 4, 3, '#b45309'],
  [6, 10, 2, 12, '#d97706'],
  [24, 10, 2, 12, '#d97706'],
  [8, 22, 4, 3, '#78350f'],
  [20, 22, 4, 3, '#78350f'],
  [11, 25, 10, 2, '#78350f'],
  // Wood Plank Inner Core
  [8, 10, 16, 12, '#451a03'],
  [10, 9, 12, 14, '#78350f'],
  // Center Heavy Iron Boss & Spike
  [13, 13, 6, 6, '#64748b'],
  [14, 14, 4, 4, '#94a3b8'],
  [15, 15, 2, 2, '#ffffff'],
];

// ==========================================
// 3. AUTHENTIC 16-BIT PIXEL ART ARMOR
// ==========================================

// Gothic Full Steel Plate Cuirass
const PIXEL_STEEL_ARMOR: PixelBlock[] = [
  // Gorget & Pauldrons (Shoulders)
  [4, 6, 7, 6, '#64748b'],
  [21, 6, 7, 6, '#64748b'],
  [5, 5, 5, 2, '#94a3b8'],
  [22, 5, 5, 2, '#94a3b8'],
  [5, 5, 2, 1, '#ffffff'],
  // Chestplate (Cuirass)
  [11, 6, 10, 6, '#94a3b8'],
  [10, 11, 12, 8, '#64748b'],
  [12, 7, 8, 4, '#e2e8f0'],
  [14, 8, 4, 2, '#ffffff'], // Chest ridge highlight
  [15, 6, 2, 16, '#e2e8f0'], // Vertical spine ridge
  // Abdominal Flanges & Belt
  [11, 18, 10, 4, '#475569'],
  [12, 21, 8, 3, '#334155'],
  [10, 23, 12, 3, '#78350f'], // Leather faulds belt
  [14, 23, 4, 3, '#facc15'],  // Gold buckle
];

// Royal Gilded Dragon Plate Armor
const PIXEL_GOLD_ARMOR: PixelBlock[] = [
  // Ornate Gold Pauldrons
  [4, 6, 7, 6, '#ca8a04'],
  [21, 6, 7, 6, '#ca8a04'],
  [5, 5, 5, 2, '#fde047'],
  [22, 5, 5, 2, '#fde047'],
  // Golden Breastplate
  [11, 6, 10, 6, '#facc15'],
  [10, 11, 12, 8, '#eab308'],
  [12, 7, 8, 4, '#fef08a'],
  // Radiant Ruby Heart Crest
  [14, 11, 4, 4, '#e11d48'],
  [15, 12, 2, 2, '#fda4af'],
  // Waist plates
  [11, 18, 10, 4, '#ca8a04'],
  [12, 21, 8, 3, '#854d0e'],
  [10, 23, 12, 3, '#facc15'],
];

// Archmage Arcane Velvet Robe
const PIXEL_ROBE: PixelBlock[] = [
  // Midnight velvet cowl
  [11, 5, 10, 5, '#1e1b4b'],
  [13, 6, 6, 3, '#312e81'],
  // Wide draped mystical sleeves
  [4, 8, 7, 14, '#1e1b4b'],
  [21, 8, 7, 14, '#1e1b4b'],
  [5, 9, 5, 11, '#312e81'],
  [22, 9, 5, 11, '#312e81'],
  // Gold embroidered sleeve cuffs
  [4, 21, 7, 2, '#facc15'],
  [21, 21, 7, 2, '#facc15'],
  // Flowing Robe Body
  [10, 10, 12, 16, '#312e81'],
  [11, 11, 10, 14, '#4338ca'],
  // Gold Runic Hem down center
  [15, 10, 2, 16, '#fde047'],
  [13, 14, 6, 2, '#facc15'],
  [14, 13, 4, 4, '#06b6d4'], // Cyan magic amulet
];

// Studded Hunter Leather Jerkin
const PIXEL_LEATHER_ARMOR: PixelBlock[] = [
  // Shoulders with bronze buckles
  [6, 6, 5, 6, '#78350f'],
  [21, 6, 5, 6, '#78350f'],
  [7, 5, 3, 2, '#ca8a04'],
  [22, 5, 3, 2, '#ca8a04'],
  // Hardened leather torso
  [11, 6, 10, 16, '#9a3412'],
  [10, 10, 12, 12, '#7c2d12'],
  // Cross straps
  [11, 9, 10, 2, '#451a03'],
  [11, 15, 10, 2, '#451a03'],
  // Bronze Rivet Studs
  [12, 8, 2, 2, '#fde047'],
  [18, 8, 2, 2, '#fde047'],
  [12, 14, 2, 2, '#fde047'],
  [18, 14, 2, 2, '#fde047'],
  [12, 19, 2, 2, '#fde047'],
  [18, 19, 2, 2, '#fde047'],
];

// ==========================================
// 4. AUTHENTIC 16-BIT PIXEL ART RINGS
// ==========================================

// Ruby Signet Ring
const PIXEL_RUBY_RING: PixelBlock[] = [
  // Gold Band
  [10, 14, 12, 3, '#facc15'],
  [8, 16, 3, 9, '#eab308'],
  [21, 16, 3, 9, '#ca8a04'],
  [10, 24, 12, 3, '#854d0e'],
  // Beveled Gem Mount
  [11, 9, 10, 5, '#ca8a04'],
  [12, 8, 8, 2, '#fde047'],
  // Brilliant Faceted Ruby
  [13, 5, 6, 6, '#e11d48'],
  [14, 6, 4, 4, '#fda4af'],
  [15, 7, 2, 2, '#ffffff'],
  [13, 9, 6, 2, '#991b1b'],
];

// Medusa Serpent Ring (Coiled emerald serpent, jade eye)
const PIXEL_MEDUSA_RING: PixelBlock[] = [
  // Coiled Emerald Serpent Band
  [10, 14, 12, 3, '#059669'],
  [8, 16, 3, 9, '#047857'],
  [21, 16, 3, 9, '#065f46'],
  [10, 24, 12, 3, '#064e3b'],
  // Serpent Head Mount
  [12, 8, 8, 6, '#10b981'],
  [13, 7, 6, 2, '#34d399'],
  [14, 9, 4, 3, '#047857'],
  // Glowing Amber Serpent Eye
  [14, 9, 2, 2, '#fef08a'],
  [15, 9, 1, 2, '#78350f'],
];

// Void Blackhole Ring (Swirling violet event horizon)
const PIXEL_VOID_RING: PixelBlock[] = [
  // Obsidian Purple Band
  [10, 14, 12, 3, '#7e22ce'],
  [8, 16, 3, 9, '#581c87'],
  [21, 16, 3, 9, '#3b0764'],
  [10, 24, 12, 3, '#1e1b4b'],
  // Singularity Core
  [12, 7, 8, 8, '#0f172a'],
  [13, 8, 6, 6, '#581c87'],
  [14, 9, 4, 4, '#a855f7'],
  [15, 10, 2, 2, '#ffffff'],
];

// Main Component
export const WeaponIconArt: React.FC<WeaponIconArtProps> = ({
  item,
  family: propFamily,
  slot: propSlot,
  name: propName,
  rarity = (item && 'rarity' in item && typeof item.rarity === 'number' ? item.rarity : 1),
  size = 32,
  className = '',
  showRarityGlow = true,
}) => {
  const family = propFamily || item?.family || item?.armorFamily || item?.shieldFamily || 'sword';
  const slot = propSlot || item?.slot || 'weapon';
  const name = (propName || item?.name || '').toLowerCase();

  // Resolve pixel size
  let px = 32;
  if (typeof size === 'number') {
    px = size;
  } else if (size === 'sm') {
    px = 20;
  } else if (size === 'md') {
    px = 28;
  } else if (size === 'lg') {
    px = 38;
  } else if (size === 'xl') {
    px = 48;
  }

  const rarityColor = RARITY_COLORS[Math.min(5, Math.max(0, rarity - 1))] || '#94a3b8';

  // Select the exact pixel art asset
  const getPixelBlocks = (): PixelBlock[] => {
    // 1. RINGS & ACCESSORIES
    if (slot === 'ring') {
      if (name.includes('medusa')) return PIXEL_MEDUSA_RING;
      if (name.includes('void') || name.includes('hư không')) return PIXEL_VOID_RING;
      return PIXEL_RUBY_RING;
    }

    // 2. SHIELDS
    if (slot === 'shield' || family === 'buckler' || family === 'aegis' || family === 'iron') {
      if (name.includes('aegis') || name.includes('thần quy') || name.includes('long vảy') || name.includes('kiên cố')) {
        return PIXEL_AEGIS_SHIELD;
      }
      if (name.includes('tròn') || name.includes('buckler')) {
        return PIXEL_BUCKLER;
      }
      return PIXEL_STEEL_SHIELD;
    }

    // 3. ARMOR
    if (slot === 'armor') {
      if (family === 'robe' || name.includes('choàng') || name.includes('pháp')) {
        return PIXEL_ROBE;
      }
      if (family === 'gold' || name.includes('long lân') || name.includes('kim')) {
        return PIXEL_GOLD_ARMOR;
      }
      if (family === 'leather' || name.includes('da')) {
        return PIXEL_LEATHER_ARMOR;
      }
      return PIXEL_STEEL_ARMOR;
    }

    // 4. WEAPONS
    if (name.includes('long thần') || name.includes('hỏa') || name.includes('rồng') || name.includes('dragon')) {
      return PIXEL_DRAGON_SWORD;
    }
    if (name.includes('muramasa') || name.includes('huyết') || name.includes('tử thần')) {
      return PIXEL_MURAMASA;
    }
    if (family === 'axe' || name.includes('rìu')) {
      return PIXEL_BATTLEAXE;
    }
    if (family === 'hammer' || name.includes('búa') || name.includes('trùy')) {
      return PIXEL_WARHAMMER;
    }
    if (family === 'dagger' || name.includes('dao')) {
      return PIXEL_DAGGER;
    }
    if (family === 'bow' || family === 'crossbow' || name.includes('cung') || name.includes('nỏ')) {
      return PIXEL_BOW;
    }
    if (family === 'staff' || name.includes('trượng')) {
      return PIXEL_STAFF;
    }
    if (family === 'tome' || name.includes('sách')) {
      return PIXEL_TOME;
    }
    if (family === 'bell' || name.includes('chuông')) {
      return PIXEL_BELL;
    }

    // Default: The pristine Pixel Broadsword from the user's reference image!
    return PIXEL_BROADSWORD;
  };

  const pixelBlocks = getPixelBlocks();

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: px,
        height: px,
        filter: showRarityGlow && rarity >= 3 ? `drop-shadow(0 0 4px ${rarityColor}aa)` : undefined,
      }}
    >
      {renderPixelGrid(pixelBlocks)}
    </div>
  );
};
export default WeaponIconArt;
