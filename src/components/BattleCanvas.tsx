import React, { useEffect, useRef, useCallback } from 'react';
import { GRID_COLS, GRID_ROWS, EXIT_DOOR } from '../game/constants';
import { Unit, TerrainTile, BossTelegraph, VisualEffect, EffectiveStats, GearItem, DungeonBiome, ExplosiveBarrel } from '../types/game';

interface BattleCanvasProps {
  units: Unit[];
  walls: Set<string>;
  terrainMap: Map<string, TerrainTile>;
  triggeredTraps: Set<string>;
  bossTelegraph: BossTelegraph[];
  visualEffects: VisualEffect[];
  activeId: string | null;
  selectedId: string | null;
  moveTiles: { x: number; y: number; dist?: number }[];
  targetTiles: { x: number; y: number }[];
  phase: string;
  biome: DungeonBiome;
  equipped: Record<string, Record<string, GearItem>>;
  onTileClick: (x: number, y: number) => void;
  getEffectiveStats: (unit: Unit) => EffectiveStats;
  screenShake: number;
  elevations?: Set<string>;
  barrels?: ExplosiveBarrel[];
}

export const BattleCanvas: React.FC<BattleCanvasProps> = ({
  units,
  walls,
  terrainMap,
  triggeredTraps,
  bossTelegraph,
  visualEffects,
  activeId,
  selectedId,
  moveTiles,
  targetTiles,
  phase,
  biome,
  equipped,
  onTileClick,
  getEffectiveStats,
  screenShake,
  elevations = new Set(),
  barrels = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // Crisp pixel rendering without blurring
    ctx.imageSmoothingEnabled = false;

    // Screen shake: clamped to ensure no visual disorientation or motion sickness
    if (screenShake > 0) {
      const clampedShake = Math.min(screenShake, 4);
      const shakeX = (Math.random() - 0.5) * clampedShake * dpr;
      const shakeY = (Math.random() - 0.5) * clampedShake * dpr;
      ctx.translate(shakeX, shakeY);
    }

    const cellW = width / GRID_COLS;
    const cellH = height / GRID_ROWS;
    const now = performance.now();

    // 1. Draw procedural Dungeon Floor according to Biome
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const px = x * cellW;
        const py = y * cellH;
        const hash = (x * 13 + y * 29) % 17;

        // 1. Draw procedural Dungeon Floor according to Biome with 3D Cobblestones & Shading
        const alt = (x + y) % 2 === 0;

        if (biome === 'prison') {
          // Prison floor: Heavy granite slabs with iron rivets, drainage grates, and cold steel tint
          ctx.fillStyle = alt ? '#121722' : '#0c1018';
          ctx.fillRect(px, py, cellW, cellH);

          // 4-slab cobblestone pattern within each cell for genuine tactical depth
          const halfW = cellW / 2;
          const halfH = cellH / 2;
          const pavers = [
            { x: px + 1, y: py + 1, w: halfW - 2, h: halfH - 2, tone: (x * 3 + y * 5) % 3 },
            { x: px + halfW + 1, y: py + 1, w: halfW - 2, h: halfH - 2, tone: (x * 5 + y * 2) % 3 },
            { x: px + 1, y: py + halfH + 1, w: halfW - 2, h: halfH - 2, tone: (x * 2 + y * 7) % 3 },
            { x: px + halfW + 1, y: py + halfH + 1, w: halfW - 2, h: halfH - 2, tone: (x * 7 + y * 3) % 3 },
          ];

          pavers.forEach((p) => {
            ctx.fillStyle = p.tone === 0 ? 'rgba(255,255,255,0.025)' : p.tone === 1 ? 'rgba(0,0,0,0.22)' : 'rgba(51, 65, 85, 0.08)';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            // 3D Bevel highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.fillRect(p.x, p.y, p.w, 1 * dpr);
            ctx.fillRect(p.x, p.y, 1 * dpr, p.h);
            // 3D Bevel shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(p.x, p.y + p.h - 1 * dpr, p.w, 1 * dpr);
            ctx.fillRect(p.x + p.w - 1 * dpr, p.y, 1 * dpr, p.h);
          });

          // Mortar boundary
          ctx.strokeStyle = '#1a2230';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellW, cellH);

          // Subtle stone texture
          if (hash === 7) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(px + cellW * 0.25, py + cellH * 0.25, cellW * 0.5, cellH * 0.5);
          }
        } else if (biome === 'mossy_ruins') {
          // Mossy ancient flagstone ruins with rich green velvet patches and cracks
          ctx.fillStyle = alt ? '#18241b' : '#131d16';
          ctx.fillRect(px, py, cellW, cellH);

          // Pavers
          const halfW = cellW / 2;
          const halfH = cellH / 2;
          const pavers = [
            { x: px + 1, y: py + 1, w: halfW - 2, h: halfH - 2, tone: (x * 4 + y * 6) % 3 },
            { x: px + halfW + 1, y: py + 1, w: halfW - 2, h: halfH - 2, tone: (x * 6 + y * 3) % 3 },
            { x: px + 1, y: py + halfH + 1, w: halfW - 2, h: halfH - 2, tone: (x * 3 + y * 8) % 3 },
            { x: px + halfW + 1, y: py + halfH + 1, w: halfW - 2, h: halfH - 2, tone: (x * 8 + y * 4) % 3 },
          ];

          pavers.forEach((p) => {
            ctx.fillStyle = p.tone === 0 ? 'rgba(34, 197, 94, 0.04)' : p.tone === 1 ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
            ctx.fillRect(p.x, p.y, p.w, 1 * dpr);
            ctx.fillRect(p.x, p.y, 1 * dpr, p.h);
          });

          ctx.strokeStyle = '#233827';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellW, cellH);

          // Multi-layer moss spots with leafy edges
          if (hash % 2 === 0) {
            ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
            ctx.beginPath();
            ctx.arc(px + cellW * 0.25, py + cellH * 0.3, cellW * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
            ctx.beginPath();
            ctx.arc(px + cellW * 0.25, py + cellH * 0.3, cellW * 0.14, 0, Math.PI * 2);
            ctx.fill();
            // Tiny blooming spore flower
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(px + cellW * 0.22, py + cellH * 0.26, 1.2 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }

          // Fractured stone crack
          if (hash % 3 === 1) {
            ctx.strokeStyle = '#080d09';
            ctx.lineWidth = 1.4 * dpr;
            ctx.beginPath();
            ctx.moveTo(px + cellW * 0.08, py + cellH * 0.75);
            ctx.lineTo(px + cellW * 0.42, py + cellH * 0.45);
            ctx.lineTo(px + cellW * 0.82, py + cellH * 0.65);
            ctx.stroke();
          }
        } else if (biome === 'abyssal_forge') {
          // Abyssal basalt & volcanic obsidian
          ctx.fillStyle = alt ? '#1e1414' : '#140c0c';
          ctx.fillRect(px, py, cellW, cellH);

          ctx.strokeStyle = '#381c1c';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellW, cellH);

          // Magma crack lines glowing inside stone
          if (hash % 3 === 0) {
            const glow = 0.4 + Math.sin(now / 350 + x * 2 + y) * 0.25;
            ctx.strokeStyle = `rgba(239, 68, 68, ${glow})`;
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath();
            ctx.moveTo(px + cellW * 0.2, py + cellH * 0.8);
            ctx.lineTo(px + cellW * 0.5, py + cellH * 0.4);
            ctx.lineTo(px + cellW * 0.75, py + cellH * 0.2);
            ctx.stroke();
          }
        } else if (biome === 'dwarven_mine') {
          // Dwarven Gem Mine: Rich copper-umber stone with wooden rail sleepers & mineral veins
          ctx.fillStyle = alt ? '#271c14' : '#1b120c';
          ctx.fillRect(px, py, cellW, cellH);

          ctx.strokeStyle = '#3e2a1b';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellW, cellH);

          // Wooden minecart sleepers on select rows
          if (y === 3 || y === 4) {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(px + cellW * 0.1, py + cellH * 0.42, cellW * 0.8, 3.5 * dpr);
            // Steel rails running through
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(px, py + cellH * 0.35, cellW, 1.8 * dpr);
            ctx.fillRect(px, py + cellH * 0.6, cellW, 1.8 * dpr);
          }

          // Embedded sparkling raw gold/emerald ore crystals in stone
          if (hash % 3 === 0) {
            const oreColor = hash % 2 === 0 ? '#fbbf24' : '#34d399';
            ctx.fillStyle = oreColor;
            ctx.beginPath();
            ctx.arc(px + cellW * 0.3, py + cellH * 0.25, 2 * dpr, 0, Math.PI * 2);
            ctx.arc(px + cellW * 0.7, py + cellH * 0.7, 1.6 * dpr, 0, Math.PI * 2);
            ctx.fill();
            // Glimmer
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + cellW * 0.3 - 0.5 * dpr, py + cellH * 0.25 - 0.5 * dpr, 1 * dpr, 1 * dpr);
          }
        } else if (biome === 'toxic_bog') {
          // Toxic Necropolis Bog: Dark murky mire with glowing toxic ooze & bone shards
          ctx.fillStyle = alt ? '#121815' : '#0b100d';
          ctx.fillRect(px, py, cellW, cellH);

          ctx.strokeStyle = '#1b2a22';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellW, cellH);

          // Murky toxic slime puddle
          if (hash % 2 === 0) {
            const toxicPulse = 0.45 + Math.sin(now / 500 + x * 2 + y) * 0.2;
            ctx.fillStyle = `rgba(34, 197, 94, ${toxicPulse * 0.28})`;
            ctx.beginPath();
            ctx.ellipse(px + cellW * 0.5, py + cellH * 0.5, cellW * 0.35, cellH * 0.28, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tiny toxic bubble
            ctx.fillStyle = '#86efac';
            ctx.beginPath();
            ctx.arc(px + cellW * 0.45, py + cellH * 0.42, 1.8 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }

          // Scattered ancient white bone fragments
          if (hash === 7 || hash === 11) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(px + cellW * 0.3, py + cellH * 0.7, 5 * dpr, 2 * dpr);
            ctx.fillRect(px + cellW * 0.35, py + cellH * 0.65, 2 * dpr, 4 * dpr);
          }
        } else {
          // Crystal Sanctum: Arcane polished marble
          ctx.fillStyle = alt ? '#151e2b' : '#0e1520';
          ctx.fillRect(px, py, cellW, cellH);

          ctx.strokeStyle = '#223247';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cellW, cellH);

          if (hash % 3 === 0) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
            ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);
          }
        }
      }
    }

    // 1b. Central Arcane / Ritual Circle on floor
    const centerFloorX = (GRID_COLS / 2) * cellW;
    const centerFloorY = (GRID_ROWS / 2) * cellH;
    const runeRadius = Math.min(cellW, cellH) * 1.8;
    const pulseAlpha = 0.15 + Math.sin(now / 900) * 0.06;
    ctx.save();
    ctx.strokeStyle = biome === 'abyssal_forge' ? `rgba(239, 68, 68, ${pulseAlpha})` : `rgba(52, 211, 153, ${pulseAlpha})`;
    ctx.lineWidth = 1.8 * dpr;
    ctx.beginPath();
    ctx.arc(centerFloorX, centerFloorY, runeRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(245, 158, 11, ${pulseAlpha * 0.8})`;
    ctx.setLineDash([5 * dpr, 6 * dpr]);
    ctx.beginPath();
    ctx.arc(centerFloorX, centerFloorY, runeRadius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 1c. Draw High Ground Elevation Platforms (BẬC THỀM ĐÁ CAO 3D RÕ RỆT)
    // 1c. Draw High Ground Elevation Platforms (Bậc Thềm Đá 3D Tự Nhiên & Đổ Bóng)
    for (const key of elevations) {
      const [ex, ey] = key.split(',').map(Number);
      const px = ex * cellW;
      const py = ey * cellH;
      const cliffH = 8 * dpr;

      // 1. Soft drop shadow cast onto lower terrain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px + cellW * 0.5, py + cellH + 2 * dpr, cellW * 0.48, 4 * dpr, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. 3D Vertical Stone Cliff Face
      const cliffGrad = ctx.createLinearGradient(px, py + cellH - cliffH, px, py + cellH);
      cliffGrad.addColorStop(0, '#334155');
      cliffGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = cliffGrad;
      ctx.fillRect(px + 1, py + cellH - cliffH, cellW - 2, cliffH);

      // Subtle horizontal strata line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(px + 1, py + cellH - cliffH * 0.5);
      ctx.lineTo(px + cellW - 1, py + cellH - cliffH * 0.5);
      ctx.stroke();

      // 3. Elevated Top Surface Slab
      const topGrad = ctx.createLinearGradient(px, py, px, py + cellH - cliffH);
      topGrad.addColorStop(0, biome === 'abyssal_forge' ? '#3b1c1c' : biome === 'mossy_ruins' ? '#1b3322' : biome === 'dwarven_mine' ? '#3d2516' : '#1e293b');
      topGrad.addColorStop(1, biome === 'abyssal_forge' ? '#220f0f' : biome === 'mossy_ruins' ? '#122016' : biome === 'dwarven_mine' ? '#24140a' : '#131b26');
      ctx.fillStyle = topGrad;
      ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - cliffH - 1);

      // 4. Subtle Top Rim Bevel Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(px + 1, py + 1, cellW - 2, 1.5 * dpr);
      ctx.fillRect(px + 1, py + 1, 1.5 * dpr, cellH - cliffH - 1);

      // 5. Clean, quiet corner elevation marker (No noisy text boxes!)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.beginPath();
      ctx.moveTo(px + 4 * dpr, py + 7 * dpr);
      ctx.lineTo(px + 7 * dpr, py + 3 * dpr);
      ctx.lineTo(px + 10 * dpr, py + 7 * dpr);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Draw terrain tiles (Water, Abyss, Bridge, Lava, Trap, Portal, Iron Bars, Altar, Moss)
    for (const [key, tile] of terrainMap.entries()) {
      const [x, y] = key.split(',').map(Number);
      const px = x * cellW;
      const py = y * cellH;

      if (tile.type === 'iron_bars') {
        // SONG SẮT (High-Fidelity 3D Metallic Prison Portcullis Bars)
        // Deep shadow behind the iron gate
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(px, py, cellW, cellH);

        // Ground opening
        ctx.fillStyle = '#06090e';
        ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);

        // Heavy stone arched lintel
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 2, py + 2, cellW - 4, cellH * 0.18);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 2, py + 2, cellW - 4, 1.5 * dpr);

        // Horizontal forged steel brace bands
        ctx.fillStyle = '#334155';
        ctx.fillRect(px + 2, py + cellH * 0.3, cellW - 4, 3.5 * dpr);
        ctx.fillRect(px + 2, py + cellH * 0.7, cellW - 4, 3.5 * dpr);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 2, py + cellH * 0.3, cellW - 4, 1 * dpr);
        ctx.fillRect(px + 2, py + cellH * 0.7, cellW - 4, 1 * dpr);

        // 4 Vertical Heavy Iron Bars with 3D metallic gradient
        for (let i = 1; i <= 4; i++) {
          const barX = px + (cellW * i) / 5;
          // Cast shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(barX + 2 * dpr, py + 4, 2.5 * dpr, cellH - 8);
          // Dark steel body
          ctx.fillStyle = '#475569';
          ctx.fillRect(barX - 2 * dpr, py + 4, 4 * dpr, cellH - 8);
          // Center silver specular streak
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(barX - 0.5 * dpr, py + 4, 1.2 * dpr, cellH - 8);
          // Iron rivets on cross intersections
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(barX - 2.5 * dpr, py + cellH * 0.3 - 0.5 * dpr, 5 * dpr, 4 * dpr);
          ctx.fillRect(barX - 2.5 * dpr, py + cellH * 0.7 - 0.5 * dpr, 5 * dpr, 4 * dpr);
        }

        // Hanging rusted iron chains dangling from bars
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(px + cellW * 0.3, py + cellH * 0.18);
        ctx.lineTo(px + cellW * 0.32, py + cellH * 0.45);
        ctx.stroke();

        // EERIE LURKING EYES BEHIND IRON BARS!
        const eyeHash = (x * 7 + y * 11) % 4;
        if (eyeHash === 1) {
          const blink = Math.sin(now / 800 + x * 3) > 0.92;
          if (!blink) {
            const eyeX = px + cellW * 0.4;
            const eyeY = py + cellH * 0.52;
            // Red demonic glowing eyes with aura
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8 * dpr;
            ctx.beginPath();
            ctx.ellipse(eyeX - 4.5 * dpr, eyeY, 2.2 * dpr, 3 * dpr, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeX + 4.5 * dpr, eyeY, 2.2 * dpr, 3 * dpr, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Slit pupil that tracks
            ctx.fillStyle = '#05070a';
            ctx.fillRect(eyeX - 5 * dpr, eyeY - 2.5 * dpr, 1.2 * dpr, 5 * dpr);
            ctx.fillRect(eyeX + 4 * dpr, eyeY - 2.5 * dpr, 1.2 * dpr, 5 * dpr);
          }
        }
      } else if (tile.type === 'altar') {
        // ĐÀI TẾ THÁNH QUANG (Ancient Altar with Holy Light Beams)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 4, py + 4, cellW - 8, cellH - 8);

        // Glowing golden / cyan altar ring with pulsing halo
        const altarPulse = 0.65 + Math.sin(now / 400 + x) * 0.35;
        ctx.strokeStyle = `rgba(234, 179, 8, ${altarPulse})`;
        ctx.lineWidth = 2.5 * dpr;
        ctx.strokeRect(px + 6, py + 6, cellW - 12, cellH - 12);

        // Center sacred sun rune
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10 * dpr;
        ctx.beginPath();
        ctx.arc(px + cellW / 2, py + cellH / 2, 6 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Radiant sun rays
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(px + cellW / 2 - 10 * dpr, py + cellH / 2);
        ctx.lineTo(px + cellW / 2 + 10 * dpr, py + cellH / 2);
        ctx.moveTo(px + cellW / 2, py + cellH / 2 - 10 * dpr);
        ctx.lineTo(px + cellW / 2, py + cellH / 2 + 10 * dpr);
        ctx.stroke();

        // Rising holy light motes
        const moteY = py + cellH * 0.8 - ((now / 15 + x * 20) % (cellH * 0.7));
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(px + cellW * 0.5 + Math.sin(now / 200) * 3, moteY, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.type === 'moss') {
        // VŨNG RÊU PHONG (Soft Organic Velvet Moss Cushion)
        ctx.fillStyle = '#14532d';
        ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(px + cellW * 0.5, py + cellH * 0.5, cellW * 0.38, cellH * 0.35, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(px + cellW * 0.35, py + cellH * 0.4, 3.5 * dpr, 0, Math.PI * 2);
        ctx.arc(px + cellW * 0.65, py + cellH * 0.6, 3 * dpr, 0, Math.PI * 2);
        ctx.arc(px + cellW * 0.5, py + cellH * 0.3, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        // Dew drop gleam
        ctx.fillStyle = '#f0fdf4';
        ctx.beginPath();
        ctx.arc(px + cellW * 0.33, py + cellH * 0.38, 1 * dpr, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.type === 'water') {
        // Animated Water with Wave Caustics & Specular Reflection
        const wave = Math.sin(now / 320 + x * 0.8 + y) * 3;
        ctx.fillStyle = '#07253b';
        ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.fillRect(px + cellW * 0.1, py + cellH * 0.26 + wave, cellW * 0.52, 2.2 * dpr);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.4)';
        ctx.fillRect(px + cellW * 0.42, py + cellH * 0.62 - wave, cellW * 0.48, 2.2 * dpr);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(px + 1, py + 1, cellW - 2, cellH - 2);
      } else if (tile.type === 'abyss') {
        // Starry Cosmic Void Abyss
        ctx.fillStyle = '#020408';
        ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(px + cellW * 0.2, py + cellH * 0.15);
        ctx.lineTo(px + cellW * 0.55, py + cellH * 0.5);
        ctx.lineTo(px + cellW * 0.35, py + cellH * 0.85);
        ctx.stroke();

        // Shimmering Void Dust
        const starPhase = (now / 1200 + x * 2 + y * 5) % 1;
        ctx.fillStyle = `rgba(192, 132, 252, ${0.3 + starPhase * 0.5})`;
        ctx.beginPath();
        ctx.arc(px + cellW * 0.65, py + cellH * 0.35, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Eerie purple void eyes blinking in abyss!
        const abyssBlink = Math.sin(now / 950 + x * 5 + y * 7) > 0.94;
        if (!abyssBlink && (x + y) % 3 === 0) {
          const eyeY = py + cellH * 0.48;
          ctx.fillStyle = '#c084fc';
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(px + cellW * 0.42, eyeY, 2 * dpr, 0, Math.PI * 2);
          ctx.arc(px + cellW * 0.58, eyeY, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else if (tile.type === 'bridge') {
        // Aged Wooden Bridge with Iron Spikes
        ctx.fillStyle = '#3b1c09';
        ctx.fillRect(px + 2, py + cellH * 0.12, cellW - 4, cellH * 0.76);
        ctx.fillStyle = '#78350f';
        for (let i = 1; i <= 4; i++) {
          ctx.fillRect(px + (cellW * i) / 5, py + cellH * 0.15, 3.5 * dpr, cellH * 0.7);
        }
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px + 3, py + cellH * 0.14, cellW - 6, 2 * dpr);
        ctx.fillRect(px + 3, py + cellH * 0.82, cellW - 6, 2 * dpr);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(px + 2, py + cellH * 0.12, cellW - 4, cellH * 0.76);
      } else if (tile.type === 'lava') {
        // Bubbling Molten Lava with Bursting Gold Core
        const pulse = Math.sin(now / 280 + x * 2 + y) * 0.25 + 0.75;
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.fillRect(px + cellW * 0.1, py + cellH * 0.2, cellW * 0.8, cellH * 0.6);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(px + cellW * 0.25, py + cellH * 0.35, cellW * 0.5, cellH * 0.3);
        const bubbleY = py + cellH * 0.5 + Math.sin(now / 200 + x * 4) * 4;
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8 * dpr;
        ctx.beginPath();
        ctx.arc(px + cellW * 0.5, bubbleY, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (tile.type === 'trap') {
        const triggered = triggeredTraps.has(key);
        ctx.fillStyle = triggered ? '#1c1917' : '#292524';
        ctx.fillRect(px + cellW * 0.12, py + cellH * 0.12, cellW * 0.76, cellH * 0.76);
        ctx.strokeStyle = triggered ? '#78716c' : '#f59e0b';
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(px + cellW * 0.12, py + cellH * 0.12, cellW * 0.76, cellH * 0.76);

        // Sharp iron spikes
        ctx.fillStyle = triggered ? '#dc2626' : '#94a3b8';
        for (let s = 0; s < 4; s++) {
          const sx = px + cellW * (0.28 + (s % 2) * 0.44);
          const sy = py + cellH * (0.28 + Math.floor(s / 2) * 0.44);
          ctx.beginPath();
          ctx.moveTo(sx, sy - 4 * dpr);
          ctx.lineTo(sx + 3 * dpr, sy + 3 * dpr);
          ctx.lineTo(sx - 3 * dpr, sy + 3 * dpr);
          ctx.closePath();
          ctx.fill();
        }
      } else if (tile.type === 'portal') {
        // CỔNG DỊCH CHUYỂN KHÔNG GIAN (Majestic 3D Arcane Void Rift Dais - 0 MP)
        const cx = px + cellW / 2;
        const cy = py + cellH / 2;
        const spinA = (now / 480) % (Math.PI * 2);
        const spinB = (-now / 320) % (Math.PI * 2);

        // 1. Carved Obsidian Stone Dais Base
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2 * dpr, cellW * 0.44, cellH * 0.44, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#312e81';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        // 2. Outer Astronomical Runes Ring (Pulsing violet & cyan)
        const outerPulse = 0.7 + Math.sin(now / 300) * 0.3;
        ctx.strokeStyle = `rgba(168, 85, 247, ${outerPulse})`;
        ctx.lineWidth = 1.8 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.arc(cx, cy, cellW * 0.36, spinA, spinA + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Dual Swirling Vortex Rings (Deep Cosmic Void)
        const vortexGrad = ctx.createRadialGradient(cx, cy, 2 * dpr, cx, cy, cellW * 0.38);
        vortexGrad.addColorStop(0, '#ffffff');
        vortexGrad.addColorStop(0.2, '#c084fc');
        vortexGrad.addColorStop(0.55, '#6366f1');
        vortexGrad.addColorStop(0.85, '#1e1b4b');
        vortexGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cellW * 0.34, cellH * 0.34, spinA, 0, Math.PI * 2);
        ctx.fill();

        // 4. Arcane Spiral Galaxy Arms
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2.2 * dpr;
        for (let a = 0; a < 3; a++) {
          const armAngle = spinB + (a * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.quadraticCurveTo(
            cx + Math.cos(armAngle + 0.8) * cellW * 0.28,
            cy + Math.sin(armAngle + 0.8) * cellH * 0.28,
            cx + Math.cos(armAngle) * cellW * 0.35,
            cy + Math.sin(armAngle) * cellH * 0.35
          );
          ctx.stroke();
        }

        // 5. Pulsing White Core Singularity with Glow
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10 * dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, (4 + Math.sin(now / 150) * 1.5) * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 6. Orbiting Stardust Motes
        for (let m = 0; m < 4; m++) {
          const mA = -spinA * 1.5 + (m * Math.PI) / 2;
          const mDist = cellW * 0.24 + Math.sin(now / 200 + m) * (4 * dpr);
          ctx.fillStyle = m % 2 === 0 ? '#38bdf8' : '#fbcfe8';
          ctx.beginPath();
          ctx.arc(cx + Math.cos(mA) * mDist, cy + Math.sin(mA) * mDist, 1.6 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }

        // 7. Tactical 0 MP Badge
        ctx.fillStyle = '#030712';
        ctx.beginPath();
        ctx.roundRect(cx - 16 * dpr, py + cellH - 10 * dpr, 32 * dpr, 9 * dpr, 2.5 * dpr);
        ctx.fill();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
        ctx.fillStyle = '#c084fc';
        ctx.font = `bold ${Math.max(7, Math.floor(cellH * 0.1))}px 'Silkscreen', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('0 MP', cx, py + cellH - 3 * dpr);
      } else if (tile.type === 'oil') {
        // VỆT DẦU LOANG (Dark Iridescent Inflammable Oil Slick)
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);

        // Slick puddle contour
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.ellipse(px + cellW * 0.5, py + cellH * 0.5, cellW * 0.42, cellH * 0.38, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Iridescent multi-colored petrol sheen
        const sheen = Math.sin(now / 500 + x * 2 + y) * 0.15 + 0.35;
        const sheenGrad = ctx.createLinearGradient(px + cellW * 0.2, py + cellH * 0.2, px + cellW * 0.8, py + cellH * 0.8);
        sheenGrad.addColorStop(0, `rgba(168, 85, 247, ${sheen})`);
        sheenGrad.addColorStop(0.5, `rgba(56, 189, 248, ${sheen * 0.8})`);
        sheenGrad.addColorStop(1, `rgba(234, 179, 8, ${sheen * 0.9})`);
        ctx.fillStyle = sheenGrad;
        ctx.beginPath();
        ctx.ellipse(px + cellW * 0.52, py + cellH * 0.48, cellW * 0.32, cellH * 0.26, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Viscous dark droplets
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(px + cellW * 0.35, py + cellH * 0.38, 3 * dpr, 0, Math.PI * 2);
        ctx.arc(px + cellW * 0.65, py + cellH * 0.58, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.type === 'fire_ground') {
        // LỬA LAN TRÊN LƯỚI (Blazing Raging Ground Fire from Ignited Oil)
        const flamePulse = Math.sin(now / 160 + x * 3 + y * 2) * 0.25 + 0.75;
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);

        // Core flame tongues
        const flameGrad = ctx.createRadialGradient(px + cellW / 2, py + cellH * 0.6, 2 * dpr, px + cellW / 2, py + cellH * 0.5, cellW * 0.45);
        flameGrad.addColorStop(0, '#fef08a');
        flameGrad.addColorStop(0.35, '#f97316');
        flameGrad.addColorStop(0.8, '#dc2626');
        flameGrad.addColorStop(1, 'rgba(69, 10, 10, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.arc(px + cellW / 2, py + cellH * 0.5, cellW * 0.42 * flamePulse, 0, Math.PI * 2);
        ctx.fill();

        // Animated leaping flame spikes & sparks
        ctx.fillStyle = '#fed7aa';
        for (let f = 0; f < 3; f++) {
          const fxX = px + cellW * (0.3 + f * 0.2);
          const fHeight = (cellH * 0.38) * (0.8 + Math.sin(now / 120 + f * 2 + x) * 0.3);
          ctx.beginPath();
          ctx.moveTo(fxX - 3 * dpr, py + cellH * 0.72);
          ctx.lineTo(fxX, py + cellH * 0.72 - fHeight);
          ctx.lineTo(fxX + 3 * dpr, py + cellH * 0.72);
          ctx.closePath();
          ctx.fill();
        }

        // Drifting fire embers
        const emberPhase = (now / 400 + x * 3) % 1;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(px + cellW * 0.5 + Math.sin(now / 150) * 4, py + cellH * 0.7 - emberPhase * cellH * 0.5, 1.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Highlight Move Tiles (Each tile indicates exact MP cost: 1 tile = 1 MP, Portal is FREE 0 MP!)
    for (const tile of moveTiles) {
      const px = tile.x * cellW;
      const py = tile.y * cellH;
      const isPortal = terrainMap.get(`${tile.x},${tile.y}`)?.type === 'portal';
      const cost = isPortal ? 0 : (tile.dist || 1);
      ctx.fillStyle = isPortal ? 'rgba(168, 85, 247, 0.35)' : 'rgba(45, 212, 191, 0.28)';
      ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);
      ctx.strokeStyle = isPortal ? '#c084fc' : '#2dd4bf';
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(px + 3, py + 3, cellW - 6, cellH - 6);

      // Footstep MP badge
      ctx.fillStyle = '#080d18';
      ctx.fillRect(px + cellW - 28 * dpr, py + cellH - 12 * dpr, 26 * dpr, 10 * dpr);
      ctx.strokeStyle = isPortal ? '#c084fc' : '#2dd4bf';
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(px + cellW - 28 * dpr, py + cellH - 12 * dpr, 26 * dpr, 10 * dpr);
      ctx.fillStyle = isPortal ? '#e9d5ff' : '#38bdf8';
      ctx.font = `bold ${Math.max(7, Math.floor(cellH * 0.1))}px 'Silkscreen', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(isPortal ? '0 MP' : `-${cost}M`, px + cellW - 15 * dpr, py + cellH - 4.5 * dpr);
    }

    // 4. Highlight Target Tiles
    for (const tile of targetTiles) {
      const px = tile.x * cellW;
      const py = tile.y * cellH;
      ctx.fillStyle = 'rgba(234, 179, 8, 0.32)';
      ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5 * dpr;
      ctx.strokeRect(px + 4, py + 4, cellW - 8, cellH - 8);
    }

    // 5. Draw Walls: Authentic 16-Bit Pixel-Art Fortress Masonry (Ashlar Bricks, Coping Slab, Torches)
    for (const wall of walls) {
      const [x, y] = wall.split(',').map(Number);
      const px = x * cellW;
      const py = y * cellH;
      const wallHash = (x * 19 + y * 31) % 11;

      // 1. Solid drop shadow cast onto lower terrain
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(px + 2 * dpr, py + cellH, cellW - 4 * dpr, 4 * dpr);

      // Palette selection by biome (Authentic pixel tones)
      let capTop = '#64748b';
      let capMid = '#475569';
      let capEdge = '#94a3b8';
      let brickLight = '#334155';
      let brickDark = '#1e293b';
      let mortar = '#070b14';
      let brickBevel = '#475569';

      if (biome === 'abyssal_forge') {
        capTop = '#6b3030';
        capMid = '#4a1e1e';
        capEdge = '#991b1b';
        brickLight = '#3a1616';
        brickDark = '#1a0808';
        mortar = '#080202';
        brickBevel = '#581c1c';
      } else if (biome === 'mossy_ruins') {
        capTop = '#385542';
        capMid = '#243a2b';
        capEdge = '#4ade80';
        brickLight = '#213326';
        brickDark = '#0e1811';
        mortar = '#050a07';
        brickBevel = '#2f4a36';
      } else if (biome === 'dwarven_mine') {
        capTop = '#5c4533';
        capMid = '#423023';
        capEdge = '#785438';
        brickLight = '#36261a';
        brickDark = '#1a110a';
        mortar = '#0a0604';
        brickBevel = '#4d3725';
      }

      const capH = Math.floor(cellH * 0.34);
      const faceH = cellH - capH;

      // 2. Brick Courses Face (Crisp Ashlar Masonry with Alternating Bond)
      ctx.fillStyle = brickDark;
      ctx.fillRect(px, py + capH, cellW, faceH);

      // Course 1 (Upper Course)
      const c1H = Math.floor(faceH * 0.48);
      ctx.fillStyle = brickLight;
      ctx.fillRect(px + 1 * dpr, py + capH + 1 * dpr, cellW - 2 * dpr, c1H);
      // Row 1 vertical mortar joint (divided at 50%)
      ctx.fillStyle = mortar;
      ctx.fillRect(px + Math.floor(cellW * 0.5) - 1 * dpr, py + capH, 2 * dpr, c1H + 1 * dpr);

      // Horizontal central mortar bed joint
      ctx.fillStyle = mortar;
      ctx.fillRect(px, py + capH + c1H, cellW, 2 * dpr);
      ctx.fillStyle = brickBevel;
      ctx.fillRect(px, py + capH + c1H + 2 * dpr, cellW, 1 * dpr);

      // Course 2 (Lower Course with staggered 33% and 67% joints)
      const c2Y = py + capH + c1H + 2 * dpr;
      const c2H = faceH - (c1H + 2 * dpr);
      ctx.fillStyle = brickLight;
      ctx.fillRect(px + 1 * dpr, c2Y, cellW - 2 * dpr, c2H);
      // Row 2 vertical mortar joints
      ctx.fillStyle = mortar;
      ctx.fillRect(px + Math.floor(cellW * 0.33) - 1 * dpr, c2Y, 2 * dpr, c2H);
      ctx.fillRect(px + Math.floor(cellW * 0.67) - 1 * dpr, c2Y, 2 * dpr, c2H);

      // Chiseled brick edge highlights
      ctx.fillStyle = brickBevel;
      ctx.fillRect(px + 2 * dpr, py + capH + 1 * dpr, Math.floor(cellW * 0.45), 1 * dpr);
      ctx.fillRect(px + Math.floor(cellW * 0.52), py + capH + 1 * dpr, Math.floor(cellW * 0.44), 1 * dpr);
      ctx.fillRect(px + 2 * dpr, c2Y, Math.floor(cellW * 0.28), 1 * dpr);
      ctx.fillRect(px + Math.floor(cellW * 0.36), c2Y, Math.floor(cellW * 0.28), 1 * dpr);

      // 3. Top Coping Cap Slab (3D Horizontal Stone Cap with Bevel Highlight)
      ctx.fillStyle = capMid;
      ctx.fillRect(px, py, cellW, capH);
      // Top catch-light
      ctx.fillStyle = capEdge;
      ctx.fillRect(px, py, cellW, 1.8 * dpr);
      ctx.fillRect(px, py, 1.5 * dpr, capH);
      // Cap under-lip shadow overhang
      ctx.fillStyle = mortar;
      ctx.fillRect(px, py + capH - 2 * dpr, cellW, 2 * dpr);

      // Center coping stone joint
      ctx.fillStyle = mortar;
      ctx.fillRect(px + Math.floor(cellW * 0.5), py, 1.5 * dpr, capH);

      // 4. Clean Pixel-Art Overgrown Moss / Ivy Patches (STRICTLY CONTAINED RECTANGULAR PIXEL CLUSTERS - NO GLITCH ARCS!)
      if (biome === 'mossy_ruins' || (wallHash === 5 && biome !== 'abyssal_forge')) {
        const mossDark = '#14532d';
        const mossMid = '#16a34a';
        const mossLight = '#4ade80';
        // Base moss step cluster at bottom edge
        ctx.fillStyle = mossDark;
        ctx.fillRect(px + 3 * dpr, py + cellH - 4 * dpr, 6 * dpr, 4 * dpr);
        ctx.fillRect(px + cellW - 8 * dpr, py + cellH - 5 * dpr, 6 * dpr, 5 * dpr);
        ctx.fillStyle = mossMid;
        ctx.fillRect(px + 4 * dpr, py + cellH - 3 * dpr, 4 * dpr, 3 * dpr);
        ctx.fillRect(px + cellW - 7 * dpr, py + cellH - 4 * dpr, 4 * dpr, 3 * dpr);
        ctx.fillStyle = mossLight;
        ctx.fillRect(px + 5 * dpr, py + cellH - 2 * dpr, 2 * dpr, 2 * dpr);
      }

      // 5. Heavy Forged Iron Corner Plates on reinforced walls
      if (wallHash === 3 || wallHash === 7) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 1 * dpr, py + 1 * dpr, 6 * dpr, 6 * dpr);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px + 1 * dpr, py + 1 * dpr, 5 * dpr, 1.2 * dpr);
        // Brass Rivet
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 2.5 * dpr, py + 2.5 * dpr, 2 * dpr, 2 * dpr);
      }

      // 6. Wall Outer Border
      ctx.strokeStyle = mortar;
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(px + 0.5, py + 0.5, cellW - 1, cellH - 1);

      // 7. Torch Sconces with warm dynamic radial light & pixel fire flame
      if ((x * 11 + y * 17) % 7 === 0) {
        const torchX = px + Math.floor(cellW / 2);
        const torchY = py + Math.floor(cellH * 0.44);
        const flicker = Math.floor(Math.sin(now / 100 + x * 5) * 1.5 * dpr);

        // Radiant warm ambient light glow
        const glow = ctx.createRadialGradient(torchX, torchY, 2 * dpr, torchX, torchY, cellW * 1.5);
        glow.addColorStop(0, 'rgba(251, 146, 60, 0.38)');
        glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(torchX, torchY, cellW * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Iron bracket
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(torchX - 2 * dpr, torchY, 4 * dpr, 6 * dpr);
        ctx.fillStyle = '#475569';
        ctx.fillRect(torchX - 3 * dpr, torchY + 1 * dpr, 6 * dpr, 2 * dpr);

        // 3-Tone Pixel Fire Flame
        ctx.fillStyle = '#dc2626'; // Red outer flame
        ctx.fillRect(torchX - 3 * dpr, torchY - 5 * dpr + flicker, 6 * dpr, 5 * dpr);
        ctx.fillStyle = '#f97316'; // Orange mid flame
        ctx.fillRect(torchX - 2 * dpr, torchY - 4 * dpr + flicker, 4 * dpr, 4 * dpr);
        ctx.fillStyle = '#fef08a'; // Yellow hot core
        ctx.fillRect(torchX - 1 * dpr, torchY - 3 * dpr + flicker, 2 * dpr, 2.5 * dpr);
      }
    }

    // 6. Draw Exit Door: High-Fidelity 3D Stone Fortress Archway & Dimensional Rift
    const exitPx = EXIT_DOOR.x * cellW;
    const exitPy = EXIT_DOOR.y * cellH;
    const isOpen = phase === 'exiting';

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(exitPx + cellW * 0.5, exitPy + cellH * 0.96, cellW * 0.45, 5 * dpr, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Carved Granite Columns (Left & Right)
    const pillarW = cellW * 0.16;
    const pillarH = cellH * 0.88;
    const pillarGrad = ctx.createLinearGradient(exitPx, exitPy, exitPx + pillarW, exitPy);
    pillarGrad.addColorStop(0, '#475569');
    pillarGrad.addColorStop(0.5, '#334155');
    pillarGrad.addColorStop(1, '#0f172a');

    // Left Pillar
    ctx.fillStyle = pillarGrad;
    ctx.fillRect(exitPx + 2 * dpr, exitPy + cellH * 0.1, pillarW, pillarH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(exitPx + 2 * dpr, exitPy + cellH * 0.1, 1.5 * dpr, pillarH);

    // Right Pillar
    ctx.fillStyle = pillarGrad;
    ctx.fillRect(exitPx + cellW - pillarW - 2 * dpr, exitPy + cellH * 0.1, pillarW, pillarH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(exitPx + cellW - pillarW - 2 * dpr, exitPy + cellH * 0.1, 1.5 * dpr, pillarH);

    // Carved Stone Arch Header with Keystone
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(exitPx + 2 * dpr, exitPy + 2 * dpr, cellW - 4 * dpr, cellH * 0.22, 4 * dpr);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Golden Keystone Inscription
    ctx.fillStyle = isOpen ? '#fbbf24' : '#64748b';
    ctx.fillRect(exitPx + cellW * 0.5 - 5 * dpr, exitPy + 2 * dpr, 10 * dpr, cellH * 0.22);
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(exitPx + cellW * 0.5 - 5 * dpr, exitPy + 2 * dpr, 10 * dpr, cellH * 0.22);

    // Inner Portal Chamber
    const innerX = exitPx + pillarW + 2 * dpr;
    const innerY = exitPy + cellH * 0.22;
    const innerW = cellW - (pillarW * 2 + 4 * dpr);
    const innerH = cellH * 0.74;

    if (isOpen) {
      // Celestial Golden Dimensional Rift!
      const portalPulse = 0.8 + Math.sin(now / 180) * 0.2;
      const riftGrad = ctx.createRadialGradient(
        exitPx + cellW * 0.5,
        innerY + innerH * 0.5,
        2 * dpr,
        exitPx + cellW * 0.5,
        innerY + innerH * 0.5,
        innerW * 0.8
      );
      riftGrad.addColorStop(0, '#ffffff');
      riftGrad.addColorStop(0.25, '#fef08a');
      riftGrad.addColorStop(0.65, '#f59e0b');
      riftGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = riftGrad;
      ctx.beginPath();
      ctx.ellipse(exitPx + cellW * 0.5, innerY + innerH * 0.52, innerW * 0.48, innerH * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden light rays radiating outward
      ctx.strokeStyle = `rgba(254, 240, 138, ${0.45 * portalPulse})`;
      ctx.lineWidth = 2 * dpr;
      for (let r = 0; r < 4; r++) {
        const rAngle = (now / 400 + (r * Math.PI) / 2) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(exitPx + cellW * 0.5, innerY + innerH * 0.52);
        ctx.lineTo(
          exitPx + cellW * 0.5 + Math.cos(rAngle) * innerW * 0.46,
          innerY + innerH * 0.52 + Math.sin(rAngle) * innerH * 0.44
        );
        ctx.stroke();
      }

      // Banner: LỐI RA
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8 * dpr;
      ctx.font = `bold ${Math.max(9, Math.floor(cellH * 0.13))}px 'Silkscreen', 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('LỐI RA', exitPx + cellW * 0.5, exitPy + cellH * 0.94);
      ctx.shadowBlur = 0;
    } else {
      // Heavy Locked Iron-Reinforced Dark Oak Doors
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(innerX, innerY, innerW, innerH);

      // Wood plank seams
      ctx.strokeStyle = '#0c0a09';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(innerX + innerW * 0.5, innerY);
      ctx.lineTo(innerX + innerW * 0.5, innerY + innerH);
      ctx.stroke();

      // Iron horizontal braces & rivets
      [0.35, 0.7].forEach((ratio) => {
        ctx.fillStyle = '#334155';
        ctx.fillRect(innerX, innerY + innerH * ratio, innerW, 3 * dpr);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(innerX + innerW * 0.25, innerY + innerH * ratio + 0.5 * dpr, 2 * dpr, 2 * dpr);
        ctx.fillRect(innerX + innerW * 0.75, innerY + innerH * ratio + 0.5 * dpr, 2 * dpr, 2 * dpr);
      });

      // Locked padlock icon
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.arc(exitPx + cellW * 0.5, innerY + innerH * 0.5 - 2 * dpr, 3.5 * dpr, Math.PI, 0);
      ctx.stroke();
      ctx.fillRect(exitPx + cellW * 0.5 - 4.5 * dpr, innerY + innerH * 0.5 - 2 * dpr, 9 * dpr, 7 * dpr);
    }

    // 7. Boss Telegraphs
    if (bossTelegraph.length > 0) {
      const pulse = 0.65 + Math.sin(now / 150) * 0.25;
      for (const t of bossTelegraph) {
        const px = t.x * cellW;
        const py = t.y * cellH;
        ctx.fillStyle =
          t.type === 'roar'
            ? `rgba(168, 85, 247, ${pulse * 0.4})`
            : `rgba(239, 68, 68, ${pulse * 0.45})`;
        ctx.fillRect(px + 2, py + 2, cellW - 4, cellH - 4);
        ctx.strokeStyle = t.type === 'roar' ? '#c084fc' : '#ef4444';
        ctx.lineWidth = 3 * dpr;
        ctx.strokeRect(px + 4, py + 4, cellW - 8, cellH - 8);
        ctx.fillStyle = '#fef2f2';
        ctx.font = `bold ${Math.max(10, Math.floor(cellH * 0.14))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        const label = t.type === 'slap' ? 'VUNG QUANH' : t.type === 'bite' ? 'CẮN XÉ' : 'GẦM VANG';
        ctx.fillText(label, px + cellW / 2, py + cellH * 0.3);
      }
    }

    // 7b. Draw Explosive Barrels (Thùng Thuốc Nổ)
    for (const barrel of barrels) {
      if (barrel.hp <= 0) continue;
      const bpx = barrel.x * cellW;
      const bpy = barrel.y * cellH;
      const bcx = bpx + cellW / 2;
      const bcy = bpy + cellH / 2;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(bcx, bpy + cellH * 0.85, cellW * 0.28, cellH * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      // Barrel Body (Oak Staves with Red Danger Tone)
      const barrelGrad = ctx.createLinearGradient(bcx - cellW * 0.24, bcy, bcx + cellW * 0.24, bcy);
      barrelGrad.addColorStop(0, '#7f1d1d');
      barrelGrad.addColorStop(0.3, '#dc2626');
      barrelGrad.addColorStop(0.7, '#b91c1c');
      barrelGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = barrelGrad;
      ctx.beginPath();
      ctx.roundRect(bcx - cellW * 0.22, bpy + cellH * 0.26, cellW * 0.44, cellH * 0.56, 6 * dpr);
      ctx.fill();

      // Iron Hoops (Top, Middle, Bottom)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5 * dpr;
      [0.34, 0.54, 0.74].forEach((ratio) => {
        ctx.beginPath();
        ctx.moveTo(bcx - cellW * 0.22, bpy + cellH * ratio);
        ctx.lineTo(bcx + cellW * 0.22, bpy + cellH * ratio);
        ctx.stroke();
      });

      // Yellow/Orange Flame / TNT Hazard Icon
      ctx.fillStyle = '#fef08a';
      ctx.font = `bold ${Math.max(10, Math.floor(cellH * 0.16))}px 'Silkscreen', 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('TNT', bcx, bpy + cellH * 0.54);

      // Glowing Fuse spark on top
      const sparkGlow = 0.5 + Math.sin(now / 120) * 0.3;
      ctx.fillStyle = `rgba(250, 204, 21, ${sparkGlow})`;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(bcx, bpy + cellH * 0.24, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Small HP Indicator Bar above barrel
      const barW = cellW * 0.36;
      const barH = 3 * dpr;
      const barX = bcx - barW / 2;
      const barY = bpy + cellH * 0.16;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, (barrel.hp / barrel.maxHp) * barW, barH);

      // If barrel is highlighted as a valid attack / skill target
      const isTargetable = targetTiles.some((t) => t.x === barrel.x && t.y === barrel.y);
      if (isTargetable) {
        const pulse = 0.6 + Math.sin(now / 150) * 0.4;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 2.5 * dpr;
        ctx.strokeRect(bpx + 3, bpy + 3, cellW - 6, cellH - 6);
        ctx.fillStyle = '#fef08a';
        ctx.font = `bold ${Math.max(9, Math.floor(cellH * 0.12))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('BẮN NỔ', bcx, bpy + cellH * 0.95);
      }
    }

    // 7.5. Dynamic Dungeon Darkness & Lighting Layer (Tầng ánh sáng & bóng tối chiếu trên sàn và thành quách)
    ctx.save();
    // Ambient dungeon darkness (soft atmospheric shadow across the arena floor)
    ctx.fillStyle = biome === 'abyssal_forge' ? 'rgba(10, 4, 4, 0.32)' : biome === 'toxic_bog' ? 'rgba(3, 8, 5, 0.35)' : 'rgba(4, 7, 14, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Living heroes project a warm lantern / torchlight vision radius that cuts through the dungeon darkness
    ctx.globalCompositeOperation = 'lighter';
    const livingParty = units.filter((u) => u.kind === 'hero' && u.hp > 0);
    for (const hero of livingParty) {
      const hx = (hero.x + 0.5) * cellW;
      const hy = (hero.y + 0.5) * cellH;
      const lightRadius = cellW * 2.4;
      const flicker = Math.sin(now / 180 + hero.x * 3) * (cellW * 0.06);
      const heroGlow = ctx.createRadialGradient(hx, hy, cellW * 0.15, hx, hy, lightRadius + flicker);
      heroGlow.addColorStop(0, 'rgba(254, 240, 138, 0.32)');
      heroGlow.addColorStop(0.45, 'rgba(245, 158, 11, 0.15)');
      heroGlow.addColorStop(0.8, 'rgba(217, 119, 6, 0.04)');
      heroGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = heroGlow;
      ctx.beginPath();
      ctx.arc(hx, hy, lightRadius + flicker, 0, Math.PI * 2);
      ctx.fill();
    }

    // Altars emit sacred radiant holy light
    for (const [key, tile] of terrainMap.entries()) {
      if (tile.type === 'altar') {
        const [ax, ay] = key.split(',').map(Number);
        const acx = (ax + 0.5) * cellW;
        const acy = (ay + 0.5) * cellH;
        const holyGlow = ctx.createRadialGradient(acx, acy, cellW * 0.1, acx, acy, cellW * 2.2);
        holyGlow.addColorStop(0, 'rgba(250, 204, 21, 0.35)');
        holyGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.18)');
        holyGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = holyGlow;
        ctx.beginPath();
        ctx.arc(acx, acy, cellW * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Exit door emits guiding beacon light when open
    if (phase === 'exiting') {
      const ex = (EXIT_DOOR.x + 0.5) * cellW;
      const ey = (EXIT_DOOR.y + 0.5) * cellH;
      const exitGlow = ctx.createRadialGradient(ex, ey, cellW * 0.2, ex, ey, cellW * 2.8);
      exitGlow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      exitGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
      exitGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = exitGlow;
      ctx.beginPath();
      ctx.arc(ex, ey, cellW * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 8. Draw Units with Visual Equipment System & Downed/Death Animations
    const displayUnits = units.filter(
      (u) =>
        !u.inTransit &&
        (!u.isSummon || u.hp > 0) &&
        (u.hp > 0 ||
          (u.kind === 'hero' && !u.isSummon) ||
          (u.deathAnim && now - u.deathAnim.startTime < u.deathAnim.duration))
    );
    for (const unit of displayUnits) {
      const isFallen = unit.hp <= 0 || unit.isDowned;
      ctx.save();
      if (isFallen) {
        if (unit.kind === 'enemy' && unit.deathAnim) {
          const deathProgress = Math.min(1, (now - unit.deathAnim.startTime) / unit.deathAnim.duration);
          ctx.globalAlpha = Math.max(0, 1 - deathProgress);
        } else if (unit.kind === 'hero') {
          ctx.globalAlpha = 0.6;
        }
      }
      let drawX = unit.x;
      let drawY = unit.y;
      if (unit.animation) {
        const elapsed = now - unit.animation.start;
        const progress = Math.min(1, elapsed / unit.animation.duration);
        drawX = unit.animation.fromX + (unit.animation.toX - unit.animation.fromX) * progress;
        drawY = unit.animation.fromY + (unit.animation.toY - unit.animation.fromY) * progress;
        if (progress >= 1) {
          unit.animation = null;
        }
      }

      // Smooth Strike Lunge & Damage Stagger Combat Animations
      let lungeX = 0;
      let lungeY = 0;
      let hitFlash = 0;
      if (unit.combatAnim) {
        const elapsed = now - unit.combatAnim.startTime;
        const progress = Math.min(1, elapsed / unit.combatAnim.duration);
        if (unit.combatAnim.type === 'lunge') {
          // Smooth sinusoidal strike lunge: pushes forward 32% of a tile towards target, then smoothly eases back
          const lungeDist = Math.sin(progress * Math.PI) * 0.32;
          const targetX = unit.combatAnim.targetX ?? unit.x;
          const targetY = unit.combatAnim.targetY ?? unit.y;
          const dx = targetX - unit.x;
          const dy = targetY - unit.y;
          const dist = Math.hypot(dx, dy) || 1;
          lungeX = (dx / dist) * lungeDist;
          lungeY = (dy / dist) * lungeDist;
        } else if (unit.combatAnim.type === 'hit') {
          // Recoil twitch & rapid jitter away from attacker
          const recoilDist = Math.sin(progress * Math.PI * 3) * (1 - progress) * 0.16;
          const fromX = unit.combatAnim.fromX ?? unit.x;
          const fromY = unit.combatAnim.fromY ?? unit.y;
          const dx = unit.x - fromX;
          const dy = unit.y - fromY;
          const dist = Math.hypot(dx, dy) || 1;
          lungeX = (dx / dist) * recoilDist;
          lungeY = (dy / dist) * recoilDist;
          hitFlash = Math.max(0, (1 - progress) * 0.7); // Bright red hit flash
        }
        if (progress >= 1) {
          unit.combatAnim = null;
        }
      }

      const isElevated = elevations.has(`${unit.x},${unit.y}`) || unit.elevation === 1;
      const elevLift = isElevated ? -4 * dpr : 0;
      const px = (drawX + lungeX) * cellW;
      const py = (drawY + lungeY) * cellH + elevLift;
      const centerX = px + cellW / 2;
      const centerY = py + cellH / 2;

      // Universal Soft Dynamic Unit Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(centerX, py + cellH * 0.86, cellW * 0.28, cellH * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      // Active / Selected highlight
      if (unit.id === activeId) {
        ctx.strokeStyle = '#a3e635';
        ctx.lineWidth = 2.5 * dpr;
        ctx.strokeRect(px + 3, py + 3, cellW - 6, cellH - 6);
        ctx.fillStyle = '#a3e635';
        ctx.fillRect(px + cellW / 2 - 4 * dpr, py + 2, 8 * dpr, 4 * dpr);
      }
      if (unit.id === selectedId && unit.id !== activeId) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.strokeRect(px + 4, py + 4, cellW - 8, cellH - 8);
        ctx.setLineDash([]);
      }

      // Special Combat Auras: Summoning Ring, Immovable Bastion & Transformations
      if (unit.isSummon) {
        // Cyan Runic Summoning Ring below feet
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.ellipse(centerX, py + cellH * 0.82, cellW * 0.36, cellH * 0.14, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (unit.bastionTicks && unit.bastionTicks > 0) {
        // Immovable Bastion Shield Barrier
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5 * dpr;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellW * 0.46, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Spiked crystal points
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(centerX + Math.cos(a) * cellW * 0.46, centerY + Math.sin(a) * cellH * 0.46, 3 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (unit.transformation) {
        // Elemental Transformation Beast Aura
        const auraColor =
          unit.transformation.type === 'werewolf'
            ? 'rgba(239, 68, 68, 0.35)'
            : unit.transformation.type === 'dragon'
            ? 'rgba(249, 115, 22, 0.35)'
            : 'rgba(148, 163, 184, 0.35)';
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellW * (0.45 + Math.sin(now / 200) * 0.05), 0, Math.PI * 2);
        ctx.fill();
      }

      if (unit.petrifiedTicks && unit.petrifiedTicks > 0) {
        // Petrified Stone encasement
        ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellW * 0.44, 0, Math.PI * 2);
        ctx.fill();
      }

      // Check equipped gear on this unit
      const unitGear = equipped[unit.id] || {};
      const heldWeapon = unitGear.weapon;
      const heldShield = unitGear.shield;
      const wornArmor = unitGear.armor;

      // Draw Monster species
      if (unit.species === 'snake') {
        const t = now / 400;
        const auraGrad = ctx.createRadialGradient(centerX, centerY, cellW * 0.2, centerX, centerY, cellW * 0.65);
        auraGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        auraGrad.addColorStop(0.6, 'rgba(5, 150, 105, 0.12)');
        auraGrad.addColorStop(1, 'rgba(5, 150, 105, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellW * 0.65, 0, Math.PI * 2);
        ctx.fill();

        const spine = [
          { x: 0.15, y: 0.8 },
          { x: 0.3, y: 0.78 },
          { x: 0.48, y: 0.82 },
          { x: 0.65, y: 0.75 },
          { x: 0.76, y: 0.58 },
          { x: 0.62, y: 0.46 },
          { x: 0.42, y: 0.48 },
          { x: 0.32, y: 0.38 },
          { x: 0.44, y: 0.26 },
          { x: 0.62, y: 0.26 },
        ];

        spine.forEach((pt, i) => {
          const sway = Math.sin(t + i * 0.4) * (cellW * 0.035);
          const segX = px + cellW * pt.x + sway;
          const segY = py + cellH * pt.y;
          const radius = (cellW * (0.16 + (i / spine.length) * 0.12)) / 2;

          ctx.fillStyle = i % 2 === 0 ? '#044e39' : '#065f46';
          ctx.beginPath();
          ctx.arc(segX, segY, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5 * dpr;
          ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(segX - radius * 0.2, segY - radius * 0.2, radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        });

        const headX = px + cellW * 0.62 + Math.sin(t + 4) * (cellW * 0.035);
        const headY = py + cellH * 0.26;

        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.ellipse(headX - cellW * 0.08, headY, cellW * 0.2, cellH * 0.26, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.ellipse(headX, headY, cellW * 0.18, cellH * 0.14, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(headX + cellW * 0.06, headY - cellH * 0.04, 3.5 * dpr, 5 * dpr, 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.species === 'kraken') {
        const t = now / 350;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(centerX, py + cellH * 0.85, cellW * 0.35, cellH * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        [-1.3, -0.8, -0.3, 0.3, 0.8, 1.3].forEach((ang, idx) => {
          const wave = Math.sin(t + idx * 0.8) * 0.2;
          ctx.strokeStyle = '#7e22ce';
          ctx.lineWidth = 4 * dpr;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY + cellH * 0.1);
          const midX = centerX + Math.cos(ang + wave) * (cellW * 0.3);
          const midY = centerY + cellH * 0.2 + Math.sin(ang + wave) * (cellH * 0.25);
          const tipX = centerX + Math.cos(ang + wave * 1.5) * (cellW * 0.45);
          const tipY = centerY + cellH * 0.3 + Math.sin(ang + wave * 1.5) * (cellH * 0.38);
          ctx.quadraticCurveTo(midX, midY, tipX, tipY);
          ctx.stroke();
        });

        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - cellH * 0.05, cellW * 0.24, cellH * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(centerX, centerY - cellH * 0.05, 6 * dpr, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.species === 'beholder') {
        const t = now / 300;
        const hover = Math.sin(t) * (cellH * 0.05);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX, py + cellH * 0.88, cellW * 0.25, cellH * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();

        const beholderY = centerY + hover;
        [-2.2, -1.6, -1.0, -0.4, 0.2].forEach((ang, idx) => {
          const sway = Math.sin(t * 1.5 + idx) * 0.15;
          const stalkX = centerX + Math.cos(ang + sway) * (cellW * 0.28);
          const stalkY = beholderY + Math.sin(ang + sway) * (cellH * 0.25);
          ctx.strokeStyle = '#7c3aed';
          ctx.lineWidth = 3 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX, beholderY);
          ctx.lineTo(stalkX, stalkY);
          ctx.stroke();
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(stalkX, stalkY, 3 * dpr, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = '#6d28d9';
        ctx.beginPath();
        ctx.arc(centerX, beholderY, cellW * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(centerX, beholderY, cellW * 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else if (unit.kind === 'enemy') {
        // DISTINCT PROCEDURAL PIXEL MODELS FOR ALL MONSTER SPECIES!
        ctx.save();
        const t = now / 300;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(centerX, py + cellH * 0.86, cellW * 0.28, cellH * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        if (unit.species === 'slime') {
          // 🟢 SLIME: Gelatinous wobbling dome with floating nucleus & bubbles
          const wobble = Math.sin(t * 1.5) * (cellH * 0.04);
          const stretchX = 1 + Math.cos(t * 1.5) * 0.08;
          const slimeColor = unit.color || '#22c55e';

          // Outer jelly dome
          ctx.fillStyle = slimeColor;
          ctx.beginPath();
          ctx.ellipse(centerX, py + cellH * 0.58 + wobble, (cellW * 0.28) * stretchX, cellH * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1.8 * dpr;
          ctx.stroke();

          // Inner glowing nucleus
          ctx.fillStyle = '#86efac';
          ctx.beginPath();
          ctx.arc(centerX + Math.sin(t) * 2, py + cellH * 0.58 + wobble, 4 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Slime Eyes (Cute/wicked white ovals with dark pupils)
          const eyeY = py + cellH * 0.5 + wobble;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(centerX - 5 * dpr, eyeY, 3 * dpr, 4 * dpr, 0, 0, Math.PI * 2);
          ctx.ellipse(centerX + 5 * dpr, eyeY, 3 * dpr, 4 * dpr, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#052e16';
          ctx.beginPath();
          ctx.arc(centerX - 4.5 * dpr, eyeY, 1.6 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 5.5 * dpr, eyeY, 1.6 * dpr, 0, Math.PI * 2);
          ctx.fill();
          // Specular shine on dome
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillRect(centerX - 8 * dpr, py + cellH * 0.42 + wobble, 3 * dpr, 3 * dpr);
        } else if (unit.species === 'golem') {
          // 🗿 GOLEM / BRUTE: Massive cracked granite boulders, glowing runes & boulder fists
          const rockGrad = ctx.createLinearGradient(centerX - cellW * 0.25, py, centerX + cellW * 0.25, py);
          rockGrad.addColorStop(0, '#475569');
          rockGrad.addColorStop(0.5, '#64748b');
          rockGrad.addColorStop(1, '#334155');

          // Torso boulder
          ctx.fillStyle = rockGrad;
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.24, py + cellH * 0.38, cellW * 0.48, cellH * 0.42, 6 * dpr);
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();

          // Spiked boulder shoulders
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(centerX - cellW * 0.26, py + cellH * 0.42, 7 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + cellW * 0.26, py + cellH * 0.42, 7 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Glowing runic fracture lines
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.6 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - cellW * 0.15, py + cellH * 0.45);
          ctx.lineTo(centerX, py + cellH * 0.58);
          ctx.lineTo(centerX + cellW * 0.14, py + cellH * 0.5);
          ctx.moveTo(centerX, py + cellH * 0.58);
          ctx.lineTo(centerX, py + cellH * 0.74);
          ctx.stroke();

          // Cyclopean glowing amber/blue eye
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.32, 4.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.32, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Heavy boulder fists on sides
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(centerX - cellW * 0.28, py + cellH * 0.68, 5.5 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + cellW * 0.28, py + cellH * 0.68, 5.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (unit.species === 'lich') {
          // 💀 LICH: Violet astral hood, horned demonic skull & glowing crystal skull staff
          const hoverY = Math.sin(t) * (cellH * 0.04);

          // Flowing dark purple hooded robe with golden astral hem
          ctx.fillStyle = '#3b0764';
          ctx.beginPath();
          ctx.moveTo(centerX - cellW * 0.22, py + cellH * 0.36 + hoverY);
          ctx.lineTo(centerX + cellW * 0.22, py + cellH * 0.36 + hoverY);
          ctx.lineTo(centerX + cellW * 0.28, py + cellH * 0.8 + hoverY);
          ctx.lineTo(centerX - cellW * 0.28, py + cellH * 0.8 + hoverY);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.5 * dpr;
          ctx.stroke();

          // Skeletal horned skull head
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.3 + hoverY, cellW * 0.14, 0, Math.PI * 2);
          ctx.fill();

          // Demon horns curved outward
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - 5 * dpr, py + cellH * 0.22 + hoverY);
          ctx.quadraticCurveTo(centerX - 10 * dpr, py + cellH * 0.14 + hoverY, centerX - 14 * dpr, py + cellH * 0.18 + hoverY);
          ctx.moveTo(centerX + 5 * dpr, py + cellH * 0.22 + hoverY);
          ctx.quadraticCurveTo(centerX + 10 * dpr, py + cellH * 0.14 + hoverY, centerX + 14 * dpr, py + cellH * 0.18 + hoverY);
          ctx.stroke();

          // Burning cyan soul flame eye sockets
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(centerX - 3.5 * dpr, py + cellH * 0.3 + hoverY, 2.2 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 3.5 * dpr, py + cellH * 0.3 + hoverY, 2.2 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Bone Staff with orbiting purple magical orb
          const staffX = centerX + cellW * 0.26;
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath();
          ctx.moveTo(staffX, py + cellH * 0.18 + hoverY);
          ctx.lineTo(staffX, py + cellH * 0.82 + hoverY);
          ctx.stroke();

          // Orbiting arcane orb
          const orbAngle = t * 2;
          const orbX = staffX + Math.cos(orbAngle) * 5 * dpr;
          const orbY = py + cellH * 0.16 + hoverY + Math.sin(orbAngle) * 3 * dpr;
          ctx.fillStyle = '#e879f9';
          ctx.beginPath();
          ctx.arc(orbX, orbY, 3 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (unit.species === 'ghost') {
          // 👻 GHOST / WRAITH: Translucent ethereal spectral shroud with drifting soul tail
          const hoverY = Math.sin(t * 1.2) * (cellH * 0.05);
          ctx.globalAlpha = 0.82;

          // Spectral body
          const ghostGrad = ctx.createLinearGradient(centerX, py + hoverY, centerX, py + cellH * 0.8 + hoverY);
          ghostGrad.addColorStop(0, '#e0f2fe');
          ghostGrad.addColorStop(0.5, '#38bdf8');
          ghostGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.fillStyle = ghostGrad;
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.32 + hoverY, cellW * 0.2, Math.PI, 0);
          // Flowing ragged tail
          ctx.quadraticCurveTo(centerX + cellW * 0.22, py + cellH * 0.6 + hoverY, centerX + Math.sin(t) * 6, py + cellH * 0.82 + hoverY);
          ctx.quadraticCurveTo(centerX - cellW * 0.22, py + cellH * 0.6 + hoverY, centerX - cellW * 0.2, py + cellH * 0.32 + hoverY);
          ctx.closePath();
          ctx.fill();

          // Hollow soul eyes
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.ellipse(centerX - 4.5 * dpr, py + cellH * 0.32 + hoverY, 2.5 * dpr, 4 * dpr, 0, 0, Math.PI * 2);
          ctx.ellipse(centerX + 4.5 * dpr, py + cellH * 0.32 + hoverY, 2.5 * dpr, 4 * dpr, 0, 0, Math.PI * 2);
          ctx.fill();
          // Spectral claws
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - cellW * 0.18, py + cellH * 0.44 + hoverY);
          ctx.lineTo(centerX - cellW * 0.26, py + cellH * 0.52 + hoverY);
          ctx.moveTo(centerX + cellW * 0.18, py + cellH * 0.44 + hoverY);
          ctx.lineTo(centerX + cellW * 0.26, py + cellH * 0.52 + hoverY);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (unit.species === 'shaman') {
          // 🥁 SHAMAN: Wooden demon mask with war paint, feather headdress & war drum
          // Brown animal pelt tunic
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.2, py + cellH * 0.38, cellW * 0.4, cellH * 0.42, 4);
          ctx.fill();

          // Carved wooden demon mask
          ctx.fillStyle = '#9a3412';
          ctx.beginPath();
          ctx.ellipse(centerX, py + cellH * 0.32, cellW * 0.16, cellH * 0.18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#431407';
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();

          // Red war paint stripes on mask
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(centerX - cellW * 0.14, py + cellH * 0.3, cellW * 0.28, 2 * dpr);
          ctx.fillRect(centerX - 2 * dpr, py + cellH * 0.24, 4 * dpr, cellH * 0.16);

          // Feather headdress (cyan, gold, crimson feathers sticking up)
          [-12, -6, 0, 6, 12].forEach((offset, idx) => {
            const fColor = ['#38bdf8', '#facc15', '#ef4444', '#34d399', '#f97316'][idx % 5];
            ctx.strokeStyle = fColor;
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.moveTo(centerX + offset * 0.8 * dpr, py + cellH * 0.22);
            ctx.lineTo(centerX + offset * 1.4 * dpr, py + cellH * 0.1 - Math.abs(offset) * 0.3 * dpr);
            ctx.stroke();
          });

          // War drum on hip
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.ellipse(centerX - cellW * 0.22, py + cellH * 0.62, 5 * dpr, 6 * dpr, 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.ellipse(centerX - cellW * 0.22, py + cellH * 0.58, 4 * dpr, 2.5 * dpr, 0.3, 0, Math.PI * 2);
          ctx.fill();

          // Totem staff on right hand
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX + cellW * 0.24, py + cellH * 0.18);
          ctx.lineTo(centerX + cellW * 0.24, py + cellH * 0.8);
          ctx.stroke();
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(centerX + cellW * 0.24, py + cellH * 0.18, 3.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (unit.species === 'ash-archer') {
          // 🏹 ASH-ARCHER: Skeletal archer with ribcage, ash cowl & large curved bone bow
          // Dark charcoal tattered hood & cowl
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.28, cellW * 0.15, Math.PI, 0);
          ctx.lineTo(centerX + cellW * 0.18, py + cellH * 0.42);
          ctx.lineTo(centerX - cellW * 0.18, py + cellH * 0.42);
          ctx.closePath();
          ctx.fill();

          // Bone skull peeking from hood
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.3, 5 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Burning ember eye sockets
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(centerX - 2.5 * dpr, py + cellH * 0.3, 1.4 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 2.5 * dpr, py + cellH * 0.3, 1.4 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Skeletal ribcage
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.8 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX, py + cellH * 0.38);
          ctx.lineTo(centerX, py + cellH * 0.7);
          ctx.stroke();
          [-3, 0, 3, 6].forEach((offsetY) => {
            ctx.beginPath();
            ctx.moveTo(centerX - 6 * dpr, py + cellH * 0.48 + offsetY * dpr);
            ctx.lineTo(centerX + 6 * dpr, py + cellH * 0.48 + offsetY * dpr);
            ctx.stroke();
          });

          // Large curved bone bow in left hand
          const bowX = centerX - cellW * 0.24;
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.2 * dpr;
          ctx.beginPath();
          ctx.arc(bowX, py + cellH * 0.5, cellH * 0.26, -Math.PI * 0.4, Math.PI * 0.4);
          ctx.stroke();
          // Bow string
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(bowX + Math.cos(-Math.PI * 0.4) * cellH * 0.26, py + cellH * 0.5 + Math.sin(-Math.PI * 0.4) * cellH * 0.26);
          ctx.lineTo(bowX + Math.cos(Math.PI * 0.4) * cellH * 0.26, py + cellH * 0.5 + Math.sin(Math.PI * 0.4) * cellH * 0.26);
          ctx.stroke();
        } else if (unit.species === 'mimic') {
          // 📦 MIMIC: Open treasure chest with sharp shark teeth, slobbery red tongue & coins
          const chestW = cellW * 0.46;
          const chestH = cellH * 0.36;

          // Chest bottom body (Oak wood & iron corner braces)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(centerX - chestW / 2, py + cellH * 0.48, chestW, chestH * 0.6);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2 * dpr;
          ctx.strokeRect(centerX - chestW / 2, py + cellH * 0.48, chestW, chestH * 0.6);

          // Open top lid tilted back
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.roundRect(centerX - chestW / 2 - 2 * dpr, py + cellH * 0.26, chestW + 4 * dpr, chestH * 0.45, 4);
          ctx.fill();
          ctx.stroke();

          // Dark gaping maw cavity inside chest
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(centerX - chestW / 2 + 3 * dpr, py + cellH * 0.38, chestW - 6 * dpr, cellH * 0.16);

          // Top and Bottom Rows of Sharp Ivory Teeth
          ctx.fillStyle = '#fef08a';
          for (let i = 0; i < 5; i++) {
            const tx = centerX - chestW / 2 + 5 * dpr + (i * (chestW - 10 * dpr)) / 4;
            // Top teeth pointing down
            ctx.beginPath();
            ctx.moveTo(tx - 2 * dpr, py + cellH * 0.38);
            ctx.lineTo(tx + 2 * dpr, py + cellH * 0.38);
            ctx.lineTo(tx, py + cellH * 0.44);
            ctx.closePath();
            ctx.fill();
            // Bottom teeth pointing up
            ctx.beginPath();
            ctx.moveTo(tx - 2 * dpr, py + cellH * 0.54);
            ctx.lineTo(tx + 2 * dpr, py + cellH * 0.54);
            ctx.lineTo(tx, py + cellH * 0.48);
            ctx.closePath();
            ctx.fill();
          }

          // Slobbery red tongue protruding out!
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(centerX - 3 * dpr, py + cellH * 0.48);
          ctx.quadraticCurveTo(centerX + 8 * dpr, py + cellH * 0.55, centerX + 4 * dpr, py + cellH * 0.68);
          ctx.lineTo(centerX - 2 * dpr, py + cellH * 0.66);
          ctx.closePath();
          ctx.fill();

          // Maniacal yellow eyes peeking out
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(centerX - 5 * dpr, py + cellH * 0.32, 2.5 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 5 * dpr, py + cellH * 0.32, 2.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (unit.species === 'treant') {
          // 🌲 TREANT: Gnarled bark trunk, leafy antler branches & glowing knot eyes
          // Bark trunk
          ctx.fillStyle = '#3f2212';
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.22, py + cellH * 0.36, cellW * 0.44, cellH * 0.46, 6);
          ctx.fill();

          // Bark grooves
          ctx.strokeStyle = '#1e1008';
          ctx.lineWidth = 1.8 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - 4 * dpr, py + cellH * 0.4);
          ctx.lineTo(centerX - 4 * dpr, py + cellH * 0.78);
          ctx.moveTo(centerX + 4 * dpr, py + cellH * 0.44);
          ctx.lineTo(centerX + 4 * dpr, py + cellH * 0.75);
          ctx.stroke();

          // Branching leafy horns on top
          ctx.strokeStyle = '#542d17';
          ctx.lineWidth = 3 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - cellW * 0.12, py + cellH * 0.36);
          ctx.lineTo(centerX - cellW * 0.24, py + cellH * 0.18);
          ctx.moveTo(centerX + cellW * 0.12, py + cellH * 0.36);
          ctx.lineTo(centerX + cellW * 0.24, py + cellH * 0.18);
          ctx.stroke();

          // Green leaf foliage clusters
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(centerX - cellW * 0.24, py + cellH * 0.16, 6 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + cellW * 0.24, py + cellH * 0.16, 6 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX, py + cellH * 0.24, 7 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Glowing hollow amber eyes in trunk knot
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(centerX - 4.5 * dpr, py + cellH * 0.48, 2 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 4.5 * dpr, py + cellH * 0.48, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (unit.species === 'cerberus') {
          // 🐕 CERBERUS: 3 distinct snarling canine heads with fiery red eyes & spiked collars
          // Dark muscular body
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.24, py + cellH * 0.45, cellW * 0.48, cellH * 0.38, 6);
          ctx.fill();

          // 3 Distinct Heads (Left, Center, Right)
          [-cellW * 0.18, 0, cellW * 0.18].forEach((headOffsetX, i) => {
            const headY = py + cellH * 0.34 + (i === 1 ? -3 * dpr : 2 * dpr);
            // Head
            ctx.fillStyle = '#292524';
            ctx.beginPath();
            ctx.arc(centerX + headOffsetX, headY, 6.5 * dpr, 0, Math.PI * 2);
            ctx.fill();

            // Pointed wolf ears
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.moveTo(centerX + headOffsetX - 4 * dpr, headY - 4 * dpr);
            ctx.lineTo(centerX + headOffsetX - 6 * dpr, headY - 9 * dpr);
            ctx.lineTo(centerX + headOffsetX - 1 * dpr, headY - 5 * dpr);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(centerX + headOffsetX + 1 * dpr, headY - 5 * dpr);
            ctx.lineTo(centerX + headOffsetX + 6 * dpr, headY - 9 * dpr);
            ctx.lineTo(centerX + headOffsetX + 4 * dpr, headY - 4 * dpr);
            ctx.closePath();
            ctx.fill();

            // Fiery predator eyes
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(centerX + headOffsetX - 2.5 * dpr, headY - 1 * dpr, 1.4 * dpr, 0, Math.PI * 2);
            ctx.arc(centerX + headOffsetX + 2.5 * dpr, headY - 1 * dpr, 1.4 * dpr, 0, Math.PI * 2);
            ctx.fill();

            // Snout & white fangs
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(centerX + headOffsetX - 3 * dpr, headY + 2 * dpr, 6 * dpr, 3 * dpr);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(centerX + headOffsetX - 2 * dpr, headY + 4 * dpr, 1.2 * dpr, 1.8 * dpr);
            ctx.fillRect(centerX + headOffsetX + 1 * dpr, headY + 4 * dpr, 1.2 * dpr, 1.8 * dpr);
          });
        } else if (unit.species === 'bird') {
          // 🦅 BIRD / HARPY: Outspread azure feathered wings, sharp hooked beak & talons
          const wingFlap = Math.sin(t * 2) * (cellH * 0.08);

          // Azure outspread wings
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          // Left wing
          ctx.moveTo(centerX, py + cellH * 0.45);
          ctx.quadraticCurveTo(centerX - cellW * 0.35, py + cellH * 0.2 + wingFlap, centerX - cellW * 0.42, py + cellH * 0.45 + wingFlap);
          ctx.lineTo(centerX - cellW * 0.15, py + cellH * 0.65);
          // Right wing
          ctx.moveTo(centerX, py + cellH * 0.45);
          ctx.quadraticCurveTo(centerX + cellW * 0.35, py + cellH * 0.2 + wingFlap, centerX + cellW * 0.42, py + cellH * 0.45 + wingFlap);
          ctx.lineTo(centerX + cellW * 0.15, py + cellH * 0.65);
          ctx.fill();

          // Bird body
          ctx.fillStyle = '#0369a1';
          ctx.beginPath();
          ctx.ellipse(centerX, py + cellH * 0.5, cellW * 0.15, cellH * 0.22, 0, 0, Math.PI * 2);
          ctx.fill();

          // Head with crest
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.3, cellW * 0.12, 0, Math.PI * 2);
          ctx.fill();

          // Hooked golden raptor beak
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(centerX - 3 * dpr, py + cellH * 0.3);
          ctx.lineTo(centerX + 3 * dpr, py + cellH * 0.3);
          ctx.lineTo(centerX, py + cellH * 0.4);
          ctx.closePath();
          ctx.fill();

          // Yellow raptor eyes
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(centerX - 3 * dpr, py + cellH * 0.27, 1.8 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 3 * dpr, py + cellH * 0.27, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (unit.species === 'warden' || (unit.boss && unit.id.includes('warden'))) {
          // ⛓ BOSS WARDEN: Colossal Iron Executioner Titan with spiked chains & glowing visor
          const titanW = cellW * 0.58;
          const titanH = cellH * 0.52;
          // Cast shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.ellipse(centerX, py + cellH * 0.88, cellW * 0.36, cellH * 0.1, 0, 0, Math.PI * 2);
          ctx.fill();

          // Dark charcoal iron plate armor
          const armorGrad = ctx.createLinearGradient(centerX - titanW / 2, py, centerX + titanW / 2, py);
          armorGrad.addColorStop(0, '#1e293b');
          armorGrad.addColorStop(0.5, '#475569');
          armorGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = armorGrad;
          ctx.beginPath();
          ctx.roundRect(centerX - titanW / 2, py + cellH * 0.36, titanW, titanH, 6 * dpr);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();

          // Spiked Heavy Pauldrons
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(centerX - titanW / 2 - 4 * dpr, py + cellH * 0.34, 8 * dpr, 10 * dpr);
          ctx.fillRect(centerX + titanW / 2 - 4 * dpr, py + cellH * 0.34, 8 * dpr, 10 * dpr);
          ctx.fillStyle = '#f59e0b';
          for (let sp = 0; sp < 3; sp++) {
            ctx.beginPath();
            ctx.moveTo(centerX - titanW / 2 + sp * 3 * dpr, py + cellH * 0.34);
            ctx.lineTo(centerX - titanW / 2 + sp * 3 * dpr, py + cellH * 0.26);
            ctx.lineTo(centerX - titanW / 2 + (sp + 1) * 3 * dpr, py + cellH * 0.34);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(centerX + titanW / 2 - (sp + 1) * 3 * dpr, py + cellH * 0.34);
            ctx.lineTo(centerX + titanW / 2 - sp * 3 * dpr, py + cellH * 0.26);
            ctx.lineTo(centerX + titanW / 2 - sp * 3 * dpr, py + cellH * 0.34);
            ctx.fill();
          }

          // Horned Greathelm Head
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.28, cellW * 0.16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5 * dpr;
          ctx.stroke();

          // Glowing Demonic Red Eye Visor Slit
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10 * dpr;
          ctx.fillRect(centerX - 8 * dpr, py + cellH * 0.26, 16 * dpr, 3 * dpr);
          ctx.shadowBlur = 0;

          // Iron Chains draped across chest
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - titanW * 0.4, py + cellH * 0.4);
          ctx.lineTo(centerX + titanW * 0.4, py + cellH * 0.72);
          ctx.moveTo(centerX + titanW * 0.4, py + cellH * 0.4);
          ctx.lineTo(centerX - titanW * 0.4, py + cellH * 0.72);
          ctx.stroke();

          // Spiked Chain Flail in right hand
          const flailX = centerX + cellW * 0.35;
          const flailY = py + cellH * 0.55;
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX + titanW * 0.35, py + cellH * 0.5);
          ctx.lineTo(flailX, flailY);
          ctx.stroke();
          // Spiked Iron Ball
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(flailX, flailY, 6 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5 * dpr;
          ctx.stroke();
        } else if (unit.species === 'dragon' || (unit.boss && unit.id.includes('ignis'))) {
          // 🐉 BOSS IGNIS: Colossal Winged Magma Drake with horns & fiery throat
          const wingFlap = Math.sin(t * 1.5) * (cellH * 0.08);
          // Huge Sprawling Bat-Wings
          ctx.fillStyle = '#7f1d1d';
          // Left Wing
          ctx.beginPath();
          ctx.moveTo(centerX, py + cellH * 0.45);
          ctx.quadraticCurveTo(centerX - cellW * 0.42, py + cellH * 0.15 + wingFlap, centerX - cellW * 0.48, py + cellH * 0.5 + wingFlap);
          ctx.lineTo(centerX - cellW * 0.2, py + cellH * 0.7);
          ctx.fill();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();
          // Right Wing
          ctx.beginPath();
          ctx.moveTo(centerX, py + cellH * 0.45);
          ctx.quadraticCurveTo(centerX + cellW * 0.42, py + cellH * 0.15 + wingFlap, centerX + cellW * 0.48, py + cellH * 0.5 + wingFlap);
          ctx.lineTo(centerX + cellW * 0.2, py + cellH * 0.7);
          ctx.fill();
          ctx.stroke();

          // Volcanic Obsidian Dragon Body
          ctx.fillStyle = '#450a0a';
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.22, py + cellH * 0.36, cellW * 0.44, cellH * 0.48, 8 * dpr);
          ctx.fill();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();

          // Dragon Chest Magma Plates (Molten Gold Glow)
          const magmaGlow = 0.6 + Math.sin(t * 2) * 0.35;
          ctx.fillStyle = `rgba(245, 158, 11, ${magmaGlow})`;
          for (let p = 0; p < 3; p++) {
            ctx.beginPath();
            ctx.roundRect(centerX - cellW * 0.12, py + cellH * (0.42 + p * 0.1), cellW * 0.24, cellH * 0.07, 3 * dpr);
            ctx.fill();
          }

          // Horned Dragon Head
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.ellipse(centerX, py + cellH * 0.28, cellW * 0.16, cellH * 0.16, 0, 0, Math.PI * 2);
          ctx.fill();

          // Swept-back Obsidian Horns
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - 4 * dpr, py + cellH * 0.22);
          ctx.lineTo(centerX - 14 * dpr, py + cellH * 0.12);
          ctx.moveTo(centerX + 4 * dpr, py + cellH * 0.22);
          ctx.lineTo(centerX + 14 * dpr, py + cellH * 0.12);
          ctx.stroke();

          // Blazing Amber Dragon Eyes
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10 * dpr;
          ctx.beginPath();
          ctx.arc(centerX - 4 * dpr, py + cellH * 0.26, 2.5 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 4 * dpr, py + cellH * 0.26, 2.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (unit.species === 'chimera' || (unit.boss && unit.id.includes('chimera'))) {
          // 🦁 BOSS CHIMERA: 3 Heads (Golden Lion, Horned Goat, Venomous Scorpion Tail)
          // Lion Body
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.24, py + cellH * 0.42, cellW * 0.48, cellH * 0.42, 6 * dpr);
          ctx.fill();

          // Lion Mane & Center Lion Head
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(centerX + 2 * dpr, py + cellH * 0.32, cellW * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(centerX + 2 * dpr, py + cellH * 0.32, cellW * 0.12, 0, Math.PI * 2);
          ctx.fill();
          // Lion Eyes & Fangs
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(centerX - 2 * dpr, py + cellH * 0.3, 2 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 6 * dpr, py + cellH * 0.3, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Horned Demonic Goat Head (Left shoulder)
          const goatX = centerX - cellW * 0.22;
          const goatY = py + cellH * 0.34;
          ctx.fillStyle = '#44403c';
          ctx.beginPath();
          ctx.ellipse(goatX, goatY, cellW * 0.1, cellH * 0.12, -0.3, 0, Math.PI * 2);
          ctx.fill();
          // Spiral Horns
          ctx.strokeStyle = '#a8a29e';
          ctx.lineWidth = 2.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(goatX, goatY - 4 * dpr);
          ctx.quadraticCurveTo(goatX - 8 * dpr, goatY - 12 * dpr, goatX - 14 * dpr, goatY - 8 * dpr);
          ctx.stroke();
          // Purple Goat Eye
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(goatX - 2 * dpr, goatY, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fill();

          // Arching Scorpion Stinger Tail (Right top)
          const tailX = centerX + cellW * 0.25;
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX + cellW * 0.15, py + cellH * 0.65);
          ctx.quadraticCurveTo(tailX + 10 * dpr, py + cellH * 0.3, tailX + 4 * dpr, py + cellH * 0.15);
          ctx.stroke();
          // Stinger Bulb & Poison Drop
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(tailX + 4 * dpr, py + cellH * 0.15, 4 * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(tailX + 4 * dpr, py + cellH * 0.15 + 6 * dpr, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else if (unit.species === 'wolf') {
          // 🐺 SUMMONED SPIRIT WOLF: Cyan glowing fur, pointed wolf ears & bushy tail
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.2, py + cellH * 0.44, cellW * 0.4, cellH * 0.36, 4 * dpr);
          ctx.fill();
          // Wolf Head
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.34, cellW * 0.14, 0, Math.PI * 2);
          ctx.fill();
          // Ears
          ctx.fillStyle = '#0369a1';
          ctx.beginPath();
          ctx.moveTo(centerX - 5 * dpr, py + cellH * 0.28);
          ctx.lineTo(centerX - 8 * dpr, py + cellH * 0.18);
          ctx.lineTo(centerX - 1 * dpr, py + cellH * 0.26);
          ctx.moveTo(centerX + 1 * dpr, py + cellH * 0.26);
          ctx.lineTo(centerX + 8 * dpr, py + cellH * 0.18);
          ctx.lineTo(centerX + 5 * dpr, py + cellH * 0.28);
          ctx.fill();
          // Cyan glowing eyes
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(centerX - 3 * dpr, py + cellH * 0.33, 1.8 * dpr, 0, Math.PI * 2);
          ctx.arc(centerX + 3 * dpr, py + cellH * 0.33, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // OTHER HUMANOID MONSTERS: Heavy Iron Armor, Horned Helm & Chains
          ctx.fillStyle = unit.color || '#334155';
          ctx.beginPath();
          ctx.roundRect(centerX - cellW * 0.22, py + cellH * 0.35, cellW * 0.44, cellH * 0.45, 6);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();

          // Heavy iron visor helmet
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(centerX, py + cellH * 0.3, cellW * 0.16, 0, Math.PI * 2);
          ctx.fill();
          // Glowing red eye slit
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(centerX - 6 * dpr, py + cellH * 0.28, 12 * dpr, 2.5 * dpr);

          // Rusted iron chains across torso
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath();
          ctx.moveTo(centerX - cellW * 0.2, py + cellH * 0.4);
          ctx.lineTo(centerX + cellW * 0.2, py + cellH * 0.7);
          ctx.moveTo(centerX + cellW * 0.2, py + cellH * 0.4);
          ctx.lineTo(centerX - cellW * 0.2, py + cellH * 0.7);
          ctx.stroke();
        }

        // Rebirth Undying Soul Ankh indicator
        if (unit.canRebirth && !unit.reborn) {
          ctx.fillStyle = '#c084fc';
          ctx.font = `bold ${Math.max(8, Math.floor(cellH * 0.12))}px 'Silkscreen', 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('✦ BẤT TỬ', centerX, py + cellH * 0.18);
        }
        ctx.restore();
      } else {
        // AUTHENTIC 16-BIT DARK FANTASY PIXEL ART HERO RENDERING!
        ctx.save();
        const idleBob = Math.sin(now / 300 + unit.x * 3) * (1.5 * dpr);
        const heroY = py + idleBob;

        // 1. Pedestal Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(centerX, py + cellH * 0.86, cellW * 0.28, cellH * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Flowing Cloak with Shaded Folds
        const cloakColor = unit.cloakColor || unit.color || '#3b82f6';
        ctx.fillStyle = cloakColor;
        ctx.beginPath();
        ctx.moveTo(centerX - cellW * 0.22, heroY + cellH * 0.38);
        ctx.lineTo(centerX + cellW * 0.22, heroY + cellH * 0.38);
        ctx.lineTo(centerX + cellW * 0.26, heroY + cellH * 0.8);
        ctx.lineTo(centerX, heroY + cellH * 0.84);
        ctx.lineTo(centerX - cellW * 0.26, heroY + cellH * 0.8);
        ctx.closePath();
        ctx.fill();
        // Cloak deep fold shadows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(centerX - cellW * 0.12, heroY + cellH * 0.42, cellW * 0.06, cellH * 0.38);
        ctx.fillRect(centerX + cellW * 0.06, heroY + cellH * 0.42, cellW * 0.06, cellH * 0.38);

        // 3. Legs & Leather Greaves/Boots
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(centerX - cellW * 0.12, heroY + cellH * 0.7, cellW * 0.08, cellH * 0.14);
        ctx.fillRect(centerX + cellW * 0.04, heroY + cellH * 0.7, cellW * 0.08, cellH * 0.14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(centerX - cellW * 0.14, heroY + cellH * 0.8, cellW * 0.1, cellH * 0.05);
        ctx.fillRect(centerX + cellW * 0.04, heroY + cellH * 0.8, cellW * 0.1, cellH * 0.05);

        // 4. VISUAL ARMOR LAYER (Chiseled Steel, Gilded Dragon, Archmage Robe, Hunter Leather)
        const armorFam = wornArmor?.armorFamily || (wornArmor?.name.includes('Giáp') || wornArmor?.name.includes('Thép') ? 'iron' : wornArmor?.name.includes('Choàng') ? 'robe' : wornArmor?.name.includes('Kim') ? 'gold' : 'leather');

        if (wornArmor) {
          if (armorFam === 'iron') {
            // Polished Steel Cuirass with Bevels & Pauldrons
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(centerX - cellW * 0.18, heroY + cellH * 0.41, cellW * 0.36, cellH * 0.32, 3 * dpr);
            ctx.fill();
            // Metal Chestplate Main Plate
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(centerX - cellW * 0.14, heroY + cellH * 0.43, cellW * 0.28, cellH * 0.28);
            // Center Spine Highlight (Reflective Steel)
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(centerX - 1.5 * dpr, heroY + cellH * 0.43, 3 * dpr, cellH * 0.26);
            // Steel Pauldrons (Layered shoulder plates)
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.roundRect(centerX - cellW * 0.25, heroY + cellH * 0.39, cellW * 0.1, cellH * 0.1, 2 * dpr);
            ctx.roundRect(centerX + cellW * 0.15, heroY + cellH * 0.39, cellW * 0.1, cellH * 0.1, 2 * dpr);
            ctx.fill();
            // Golden rivets
            ctx.fillStyle = '#facc15';
            ctx.fillRect(centerX - cellW * 0.22, heroY + cellH * 0.41, 2 * dpr, 2 * dpr);
            ctx.fillRect(centerX + cellW * 0.2, heroY + cellH * 0.41, 2 * dpr, 2 * dpr);
          } else if (armorFam === 'gold') {
            // Royal Gilded Dragon Armor
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.roundRect(centerX - cellW * 0.18, heroY + cellH * 0.41, cellW * 0.36, cellH * 0.32, 3 * dpr);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.fillRect(centerX - cellW * 0.14, heroY + cellH * 0.43, cellW * 0.28, cellH * 0.28);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(centerX - 1.5 * dpr, heroY + cellH * 0.43, 3 * dpr, cellH * 0.26);
            // Ruby Heart Crest
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(centerX, heroY + cellH * 0.52, 3.5 * dpr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.fillRect(centerX - 1 * dpr, heroY + cellH * 0.51, 2 * dpr, 2 * dpr);
          } else if (armorFam === 'robe') {
            // Archmage Velvet Robe with Runic Trim
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(centerX - cellW * 0.19, heroY + cellH * 0.41);
            ctx.lineTo(centerX + cellW * 0.19, heroY + cellH * 0.41);
            ctx.lineTo(centerX + cellW * 0.24, heroY + cellH * 0.78);
            ctx.lineTo(centerX - cellW * 0.24, heroY + cellH * 0.78);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#312e81';
            ctx.fillRect(centerX - cellW * 0.13, heroY + cellH * 0.43, cellW * 0.26, cellH * 0.33);
            // Golden mystic stole
            ctx.fillStyle = '#facc15';
            ctx.fillRect(centerX - 2 * dpr, heroY + cellH * 0.43, 4 * dpr, cellH * 0.33);
          } else {
            // Studded Hunter Leather
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.roundRect(centerX - cellW * 0.17, heroY + cellH * 0.42, cellW * 0.34, cellH * 0.3, 2 * dpr);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.fillRect(centerX - cellW * 0.13, heroY + cellH * 0.44, cellW * 0.26, cellH * 0.26);
            // Cross belts & rivets
            ctx.fillStyle = '#facc15';
            ctx.fillRect(centerX - cellW * 0.08, heroY + cellH * 0.48, 2 * dpr, 2 * dpr);
            ctx.fillRect(centerX + cellW * 0.06, heroY + cellH * 0.48, 2 * dpr, 2 * dpr);
            ctx.fillRect(centerX - cellW * 0.08, heroY + cellH * 0.6, 2 * dpr, 2 * dpr);
            ctx.fillRect(centerX + cellW * 0.06, heroY + cellH * 0.6, 2 * dpr, 2 * dpr);
          }
        } else {
          ctx.fillStyle = '#334155';
          ctx.fillRect(centerX - cellW * 0.15, heroY + cellH * 0.42, cellW * 0.3, cellH * 0.28);
        }

        // Leather Belt with Gold Buckle
        ctx.fillStyle = '#451a03';
        ctx.fillRect(centerX - cellW * 0.15, heroY + cellH * 0.66, cellW * 0.3, cellH * 0.05);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(centerX - 3 * dpr, heroY + cellH * 0.66, 6 * dpr, cellH * 0.05);

        // 5. Head & Warrior Face (Detailed Pixel Art Portrait)
        const skin = unit.skinTone || '#fed7aa';
        // Neck
        ctx.fillStyle = skin;
        ctx.fillRect(centerX - cellW * 0.06, heroY + cellH * 0.36, cellW * 0.12, cellH * 0.07);
        // Face Shape (Square Jawline)
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.roundRect(centerX - cellW * 0.13, heroY + cellH * 0.2, cellW * 0.26, cellH * 0.19, 3 * dpr);
        ctx.fill();
        // Shadowed under chin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(centerX - cellW * 0.13, heroY + cellH * 0.34, cellW * 0.26, cellH * 0.05);

        // Determined Warrior Eyes
        const eyeY = heroY + cellH * 0.28;
        // White sclera
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX - 7 * dpr, eyeY, 4 * dpr, 2.5 * dpr);
        ctx.fillRect(centerX + 3 * dpr, eyeY, 4 * dpr, 2.5 * dpr);
        // Dark pupils
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(centerX - 6 * dpr, eyeY, 2 * dpr, 2.5 * dpr);
        ctx.fillRect(centerX + 4 * dpr, eyeY, 2 * dpr, 2.5 * dpr);
        // Eyebrows
        ctx.fillStyle = '#451a03';
        ctx.fillRect(centerX - 8 * dpr, eyeY - 2 * dpr, 5 * dpr, 1.5 * dpr);
        ctx.fillRect(centerX + 3 * dpr, eyeY - 2 * dpr, 5 * dpr, 1.5 * dpr);

        // 6. Hair Styles with Volume & Highlights
        const hairColor = unit.hairColor || '#1e293b';
        const hairStyle = unit.hairStyle || 'short';
        ctx.fillStyle = hairColor;

        if (hairStyle === 'spiky') {
          ctx.beginPath();
          ctx.moveTo(centerX - cellW * 0.15, heroY + cellH * 0.22);
          ctx.lineTo(centerX - cellW * 0.1, heroY + cellH * 0.1);
          ctx.lineTo(centerX - cellW * 0.03, heroY + cellH * 0.16);
          ctx.lineTo(centerX, heroY + cellH * 0.08);
          ctx.lineTo(centerX + cellW * 0.05, heroY + cellH * 0.16);
          ctx.lineTo(centerX + cellW * 0.12, heroY + cellH * 0.1);
          ctx.lineTo(centerX + cellW * 0.15, heroY + cellH * 0.22);
          ctx.closePath();
          ctx.fill();
          // Hair highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(centerX - 2 * dpr, heroY + cellH * 0.12, 4 * dpr, 3 * dpr);
        } else if (hairStyle === 'long' || hairStyle === 'ponytail') {
          ctx.beginPath();
          ctx.arc(centerX, heroY + cellH * 0.18, cellW * 0.15, Math.PI, Math.PI * 2);
          ctx.lineTo(centerX + cellW * 0.17, heroY + cellH * 0.38);
          ctx.lineTo(centerX + cellW * 0.11, heroY + cellH * 0.4);
          ctx.lineTo(centerX - cellW * 0.11, heroY + cellH * 0.4);
          ctx.lineTo(centerX - cellW * 0.17, heroY + cellH * 0.38);
          ctx.closePath();
          ctx.fill();
          if (hairStyle === 'ponytail') {
            ctx.fillRect(centerX + cellW * 0.15, heroY + cellH * 0.2, 5 * dpr, 10 * dpr);
          }
        } else if (hairStyle !== 'bald') {
          // Classic warrior cropped hair
          ctx.beginPath();
          ctx.arc(centerX, heroY + cellH * 0.19, cellW * 0.15, Math.PI, Math.PI * 2);
          ctx.lineTo(centerX + cellW * 0.15, heroY + cellH * 0.23);
          ctx.lineTo(centerX - cellW * 0.15, heroY + cellH * 0.23);
          ctx.closePath();
          ctx.fill();
        }

        // 7. VISUAL PIXEL SHIELD LAYER (Left Arm)
        if (heldShield) {
          const shieldX = centerX - cellW * 0.26;
          const shieldY = heroY + cellH * 0.52;
          const shieldFam = heldShield.shieldFamily || (heldShield.name.includes('Aegis') || heldShield.name.includes('Thần Quy') ? 'aegis' : heldShield.name.includes('Tròn') ? 'buckler' : 'iron');

          if (shieldFam === 'aegis') {
            // Royal Tower Aegis Shield
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(shieldX - cellW * 0.08, shieldY - cellH * 0.18, cellW * 0.16, cellH * 0.36);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(shieldX - cellW * 0.06, shieldY - cellH * 0.15, cellW * 0.12, cellH * 0.3);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(shieldX - 2 * dpr, shieldY - cellH * 0.15, 4 * dpr, cellH * 0.3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(shieldX - 1 * dpr, shieldY - 2 * dpr, 2 * dpr, 4 * dpr);
          } else if (shieldFam === 'buckler') {
            // Bronze Spiked Buckler
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(shieldX, shieldY, cellW * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(shieldX, shieldY, cellW * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(shieldX - 2 * dpr, shieldY - 2 * dpr, 4 * dpr, 4 * dpr);
          } else {
            // Knightly Steel Heater Shield
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(shieldX - cellW * 0.08, shieldY - cellH * 0.15);
            ctx.lineTo(shieldX + cellW * 0.08, shieldY - cellH * 0.15);
            ctx.lineTo(shieldX + cellW * 0.08, shieldY + cellH * 0.06);
            ctx.lineTo(shieldX, shieldY + cellH * 0.18);
            ctx.lineTo(shieldX - cellW * 0.08, shieldY + cellH * 0.06);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(shieldX - cellW * 0.06, shieldY - cellH * 0.13);
            ctx.lineTo(shieldX + cellW * 0.06, shieldY - cellH * 0.13);
            ctx.lineTo(shieldX + cellW * 0.06, shieldY + cellH * 0.04);
            ctx.lineTo(shieldX, shieldY + cellH * 0.15);
            ctx.lineTo(shieldX - cellW * 0.06, shieldY + cellH * 0.04);
            ctx.closePath();
            ctx.fill();
            // Red Heraldic Cross
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(shieldX - 1.5 * dpr, shieldY - cellH * 0.11, 3 * dpr, cellH * 0.22);
            ctx.fillRect(shieldX - cellW * 0.05, shieldY - 1.5 * dpr, cellW * 0.1, 3 * dpr);
          }
        }

        // 8. VISUAL PIXEL WEAPON LAYER (Right Hand - Matching User Reference Pixel Sword!)
        if (heldWeapon) {
          const weaponX = centerX + cellW * 0.24;
          const weaponY = heroY + cellH * 0.52;
          const fam = heldWeapon.family || 'sword';
          const wName = heldWeapon.name.toLowerCase();

          if (fam === 'sword') {
            // AUTHENTIC PIXEL BROADSWORD (As in user's image_7678da56.png!)
            // Golden Crossguard Wing Quillons
            ctx.fillStyle = '#facc15';
            ctx.fillRect(weaponX - 5 * dpr, weaponY + 3 * dpr, 10 * dpr, 3 * dpr);
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(weaponX - 6 * dpr, weaponY + 4 * dpr, 3 * dpr, 3 * dpr);
            ctx.fillRect(weaponX + 4 * dpr, weaponY + 4 * dpr, 3 * dpr, 3 * dpr);
            // Ruby Pommel
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(weaponX - 2 * dpr, weaponY + 8 * dpr, 4 * dpr, 4 * dpr);
            ctx.fillStyle = '#fda4af';
            ctx.fillRect(weaponX - 1 * dpr, weaponY + 8 * dpr, 2 * dpr, 2 * dpr);
            // Beveled Steel Blade
            const bladeLen = cellH * 0.38;
            if (wName.includes('long thần') || wName.includes('hỏa') || wName.includes('rồng')) {
              // Flame Magma Serrated Blade
              ctx.fillStyle = '#ea580c';
              ctx.fillRect(weaponX - 2 * dpr, weaponY - bladeLen, 4 * dpr, bladeLen + 3 * dpr);
              ctx.fillStyle = '#fde047';
              ctx.fillRect(weaponX - 1 * dpr, weaponY - bladeLen, 2 * dpr, bladeLen);
            } else if (wName.includes('muramasa') || wName.includes('huyết')) {
              // Blood Katana Blade
              ctx.fillStyle = '#be123c';
              ctx.fillRect(weaponX - 1.5 * dpr, weaponY - bladeLen, 3 * dpr, bladeLen + 3 * dpr);
              ctx.fillStyle = '#fda4af';
              ctx.fillRect(weaponX - 1 * dpr, weaponY - bladeLen, 1.5 * dpr, bladeLen);
            } else {
              // Beveled Steel Blade matching reference image!
              ctx.fillStyle = '#475569';
              ctx.fillRect(weaponX - 2.5 * dpr, weaponY - bladeLen, 5 * dpr, bladeLen + 3 * dpr);
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(weaponX - 1.5 * dpr, weaponY - bladeLen, 3 * dpr, bladeLen + 2 * dpr);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(weaponX - 1.5 * dpr, weaponY - bladeLen, 1.5 * dpr, bladeLen);
              // Sharp Point Tip
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(weaponX - 1 * dpr, weaponY - bladeLen - 3 * dpr, 2 * dpr, 3 * dpr);
            }
          } else if (fam === 'axe') {
            // Battleaxe with double-bitted crescent steel heads
            ctx.fillStyle = '#78350f';
            ctx.fillRect(weaponX, weaponY - cellH * 0.32, 3 * dpr, cellH * 0.45);
            // Steel Axe Head
            ctx.fillStyle = '#64748b';
            ctx.fillRect(weaponX - cellW * 0.08, weaponY - cellH * 0.3, cellW * 0.16, cellH * 0.14);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(weaponX - cellW * 0.09, weaponY - cellH * 0.32, 2 * dpr, cellH * 0.18);
            ctx.fillRect(weaponX + cellW * 0.08, weaponY - cellH * 0.32, 2 * dpr, cellH * 0.18);
            // Center Gold Boss
            ctx.fillStyle = '#facc15';
            ctx.fillRect(weaponX, weaponY - cellH * 0.25, 4 * dpr, 4 * dpr);
          } else if (fam === 'hammer') {
            // Massive Beveled War Hammer Head
            ctx.fillStyle = '#78350f';
            ctx.fillRect(weaponX, weaponY - cellH * 0.28, 3 * dpr, cellH * 0.42);
            // Steel Block
            ctx.fillStyle = '#334155';
            ctx.fillRect(weaponX - cellW * 0.06, weaponY - cellH * 0.34, cellW * 0.14, cellH * 0.14);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(weaponX - cellW * 0.05, weaponY - cellH * 0.33, cellW * 0.12, cellH * 0.06);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(weaponX - cellW * 0.05, weaponY - cellH * 0.34, cellW * 0.12, 2 * dpr);
          } else if (fam === 'bow') {
            // Recurve Longbow
            ctx.fillStyle = '#b45309';
            ctx.fillRect(weaponX + 4 * dpr, weaponY - cellH * 0.28, 2.5 * dpr, cellH * 0.5);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(weaponX + 3 * dpr, weaponY - cellH * 0.3, 3 * dpr, 3 * dpr);
            ctx.fillRect(weaponX + 3 * dpr, weaponY + cellH * 0.22, 3 * dpr, 3 * dpr);
            // Bowstring
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(weaponX + 1 * dpr, weaponY - cellH * 0.28, 1 * dpr, cellH * 0.5);
          } else if (fam === 'dagger') {
            // Assassin Stiletto
            ctx.fillStyle = '#facc15';
            ctx.fillRect(weaponX - 2 * dpr, weaponY + 2 * dpr, 4 * dpr, 2 * dpr);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(weaponX - 1 * dpr, weaponY - cellH * 0.16, 2 * dpr, cellH * 0.18);
            ctx.fillStyle = '#10b981'; // Poison tip
            ctx.fillRect(weaponX - 1 * dpr, weaponY - cellH * 0.18, 2 * dpr, 2 * dpr);
          } else if (fam === 'tome') {
            // Floating Arcane Spellbook
            const floatHover = Math.sin(now / 200) * (3 * dpr);
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(weaponX, weaponY - cellH * 0.15 + floatHover, cellW * 0.14, cellH * 0.18);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1 * dpr;
            ctx.strokeRect(weaponX, weaponY - cellH * 0.15 + floatHover, cellW * 0.14, cellH * 0.18);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(weaponX + 2 * dpr, weaponY - cellH * 0.1 + floatHover, cellW * 0.1, 2 * dpr);
          } else if (fam === 'bell') {
            // Holy Golden Bell
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(weaponX + cellW * 0.05, weaponY - cellH * 0.05, 5 * dpr, Math.PI, Math.PI * 2);
            ctx.lineTo(weaponX + cellW * 0.09, weaponY + 4 * dpr);
            ctx.lineTo(weaponX + 2 * dpr, weaponY + 4 * dpr);
            ctx.closePath();
            ctx.fill();
          } else {
            // Archmage Staff with Pulsing Crystal Orb
            ctx.fillStyle = '#78350f';
            ctx.fillRect(weaponX, weaponY - cellH * 0.28, 3 * dpr, cellH * 0.45);
            // Crystal Orb with Glow
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8 * dpr;
            ctx.fillRect(weaponX - 3 * dpr, weaponY - cellH * 0.36, 8 * dpr, 8 * dpr);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(weaponX - 1 * dpr, weaponY - cellH * 0.35, 3 * dpr, 3 * dpr);
            ctx.shadowBlur = 0;
          }
        }
        ctx.restore();

        // 8. VISUAL RING AURA
        if (unitGear.ring) {
          const ringGlow = Math.sin(now / 250) * 0.4 + 0.6;
          ctx.fillStyle = `rgba(250, 204, 21, ${ringGlow})`;
          ctx.beginPath();
          ctx.arc(centerX + cellW * 0.22, py + cellH * 0.58, 2 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Unit Health Bar: High-Polish RPG Jewel Bar with Metallic Frame, Glass Sheen & Shield Guard
      const eff = getEffectiveStats(unit);
      const isBossUnit = Boolean(unit.boss);
      const barW = isBossUnit ? cellW * 0.92 : cellW * 0.78;
      const barH = (isBossUnit ? 7.5 : 5.8) * dpr;
      const bx = centerX - barW / 2;
      const by = py + cellH * 0.055;
      const hpPercent = Math.max(0, Math.min(1, unit.hp / eff.hp));

      // 1. Outer Dark Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(bx, by + 1.5 * dpr, barW, barH, 2.5 * dpr);
      ctx.fill();

      // 2. Recessed Base Trough
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, barH, 2.5 * dpr);
      ctx.fill();

      // 3. Dynamic Multi-Tier Gradient Fill
      if (hpPercent > 0) {
        const fillW = Math.max(3 * dpr, barW * hpPercent);
        const hpGrad = ctx.createLinearGradient(bx, by, bx, by + barH);
        if (unit.kind === 'hero') {
          if (hpPercent > 0.5) {
            // Emerald Vitality
            hpGrad.addColorStop(0, '#86efac');
            hpGrad.addColorStop(0.3, '#22c55e');
            hpGrad.addColorStop(0.7, '#16a34a');
            hpGrad.addColorStop(1, '#14532d');
          } else if (hpPercent > 0.25) {
            // Amber Warning
            hpGrad.addColorStop(0, '#fef08a');
            hpGrad.addColorStop(0.3, '#f59e0b');
            hpGrad.addColorStop(0.7, '#d97706');
            hpGrad.addColorStop(1, '#78350f');
          } else {
            // Ruby Critical Danger
            const dangerPulse = 0.8 + Math.sin(now / 120) * 0.2;
            hpGrad.addColorStop(0, '#fca5a5');
            hpGrad.addColorStop(0.3, `rgba(239, 68, 68, ${dangerPulse})`);
            hpGrad.addColorStop(0.7, '#dc2626');
            hpGrad.addColorStop(1, '#450a0a');
          }
        } else if (isBossUnit) {
          // Regal Dragon-Flame Violet / Crimson
          hpGrad.addColorStop(0, '#fbcfe8');
          hpGrad.addColorStop(0.3, '#ec4899');
          hpGrad.addColorStop(0.7, '#9333ea');
          hpGrad.addColorStop(1, '#4c1d95');
        } else {
          // Monster Blood Red
          hpGrad.addColorStop(0, '#fca5a5');
          hpGrad.addColorStop(0.35, '#ef4444');
          hpGrad.addColorStop(0.75, '#b91c1c');
          hpGrad.addColorStop(1, '#450a0a');
        }

        ctx.fillStyle = hpGrad;
        ctx.beginPath();
        ctx.roundRect(bx, by, fillW, barH, 2 * dpr);
        ctx.fill();

        // 4. Glossy Specular Glass Reflection Sheen (Top 40%)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.beginPath();
        ctx.roundRect(bx, by, fillW, barH * 0.42, [2 * dpr, 2 * dpr, 0, 0]);
        ctx.fill();
      }

      // 5. Crystalline Cyan Shield / Guard Barrier Overlay
      if (unit.guard > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8 * dpr;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 4 * dpr;
        ctx.beginPath();
        ctx.roundRect(bx - 1.5 * dpr, by - 1.5 * dpr, barW + 3 * dpr, barH + 3 * dpr, 3.5 * dpr);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Ice diamond guard tick
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bx + barW - 3 * dpr, by - 2 * dpr, 4 * dpr, barH + 4 * dpr);
      }

      // 6. Metallic Outer Trim Frame
      ctx.strokeStyle = isBossUnit ? '#fbbf24' : unit.kind === 'hero' ? '#475569' : '#7f1d1d';
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, barH, 2.5 * dpr);
      ctx.stroke();

      // Top frame specular streak
      ctx.fillStyle = isBossUnit ? 'rgba(254, 240, 138, 0.45)' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(bx + 2 * dpr, by, barW - 4 * dpr, 0.8 * dpr);

      // 7. Precise Numeric Hit Points Readout
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3 * dpr;
      ctx.font = `bold ${Math.max(6.5, Math.floor(barH * 0.72))}px 'JetBrains Mono', 'Silkscreen', monospace`;
      ctx.textAlign = 'center';
      const guardText = unit.guard > 0 ? ` +${unit.guard}G` : '';
      ctx.fillText(`${unit.hp}/${eff.hp}${guardText}`, centerX, by + barH * 0.82);
      ctx.shadowBlur = 0;

      // Unit Name
      ctx.fillStyle = unit.kind === 'hero' ? '#f1f5f9' : '#fecaca';
      ctx.font = `bold ${Math.max(9, Math.floor(cellH * 0.12))}px 'Silkscreen', 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(unit.name, centerX, py + cellH * 0.96);

      // Status Badges (Stun, Poison, Burn, Petrify, Bastion, Transform, Summon)
      let badgeX = centerX - cellW * 0.38;
      const badgeY = py + cellH * 0.22;
      if (unit.petrifiedTicks && unit.petrifiedTicks > 0) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 26 * dpr, 10 * dpr);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 26 * dpr, 10 * dpr);
        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold ${7 * dpr}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('ĐÁ', badgeX + 3 * dpr, badgeY + 3 * dpr);
        badgeX += 28 * dpr;
      }
      if (unit.bastionTicks && unit.bastionTicks > 0) {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 34 * dpr, 10 * dpr);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 34 * dpr, 10 * dpr);
        ctx.fillStyle = '#fef3c7';
        ctx.font = `bold ${7 * dpr}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('THỦ KIÊN', badgeX + 1 * dpr, badgeY + 3 * dpr);
        badgeX += 36 * dpr;
      }
      if (unit.transformation) {
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 36 * dpr, 10 * dpr);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 36 * dpr, 10 * dpr);
        ctx.fillStyle = '#fef2f2';
        ctx.font = `bold ${7 * dpr}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('HÓA THÂN', badgeX + 1 * dpr, badgeY + 3 * dpr);
        badgeX += 38 * dpr;
      }
      if (unit.isSummon) {
        ctx.fillStyle = '#065f46';
        ctx.fillRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 32 * dpr, 10 * dpr);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(badgeX - 2 * dpr, badgeY - 5 * dpr, 32 * dpr, 10 * dpr);
        ctx.fillStyle = '#ecfdf5';
        ctx.font = `bold ${7 * dpr}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('TRIỆU HỒI', badgeX + 1 * dpr, badgeY + 3 * dpr);
        badgeX += 34 * dpr;
      }
      if (unit.stun && unit.stun > 0) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
        badgeX += 9 * dpr;
      }
      if (unit.poisonTicks && unit.poisonTicks > 0) {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
        badgeX += 9 * dpr;
      }
      if (unit.burnTicks && unit.burnTicks > 0) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
        badgeX += 9 * dpr;
      }

      // Red Hit Flash Overlay on Unit
      if (hitFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(239, 68, 68, ${hitFlash})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellW * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Spinning Stun Stars overhead
      if (unit.isStunned || (unit.stunTicks || 0) > 0 || (unit.stun || 0) > 0) {
        ctx.save();
        const starTime = now / 140;
        for (let i = 0; i < 3; i++) {
          const sa = starTime + (i * Math.PI * 2) / 3;
          const sx = centerX + Math.cos(sa) * (cellW * 0.22);
          const sy = py + cellH * 0.18 + Math.sin(sa) * (cellH * 0.08);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fef08a';
        ctx.font = `bold ${Math.max(8, Math.floor(cellH * 0.12))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('💫 CHOÁNG', centerX, py + cellH * 0.12);
        ctx.restore();
      }

      // Frozen Ice Block Overlay
      if (unit.frozenTicks && unit.frozenTicks > 0) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 * dpr;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.roundRect(px + 4, py + 4, cellW - 8, cellH - 8, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e0f2fe';
        ctx.font = `bold ${Math.max(8, Math.floor(cellH * 0.12))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('❄ ĐÓNG BĂNG', centerX, py + cellH * 0.14);
        ctx.restore();
      }

      // High Ground Tag badge on unit
      if (unit.elevation === 1) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${Math.max(8, Math.floor(cellH * 0.11))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('▲', px + cellW - 4 * dpr, py + 12 * dpr);
      }

      // Downed / Fallen Hero Spirit Flame & Gục Ngã Banner
      if (isFallen) {
        const flameY = py + cellH * 0.12 + Math.sin(now / 200) * (3 * dpr);
        // Ethereal soul flame
        ctx.fillStyle = unit.kind === 'hero' ? '#38bdf8' : '#cbd5e1';
        ctx.shadowColor = unit.kind === 'hero' ? '#38bdf8' : '#64748b';
        ctx.shadowBlur = 8 * dpr;
        ctx.beginPath();
        ctx.arc(centerX, flameY, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#f87171';
        ctx.font = `bold ${Math.max(8, Math.floor(cellH * 0.11))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('💀 GỤC NGÃ', centerX, py + cellH * 0.28);
      }

      ctx.restore();
    }

    // 9. Combat Visual Effects & Floating Damage
    for (const fx of visualEffects) {
      const elapsed = now - fx.start;
      if (elapsed > fx.duration) continue;
      const progress = Math.min(1, elapsed / fx.duration);
      const startX = (fx.fromX + 0.5) * cellW;
      const startY = (fx.fromY + 0.5) * cellH;
      const targetX = (fx.toX + 0.5) * cellW;
      const targetY = (fx.toY + 0.5) * cellH;

      ctx.save();
      if (fx.type === 'stat_up') {
        // Floating Stat Increase Notification
        const floatY = targetY - cellH * (0.3 + progress * 0.4);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(targetX - 55 * dpr, floatY - 10 * dpr, 110 * dpr, 20 * dpr);
        ctx.strokeStyle = fx.color || '#facc15';
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeRect(targetX - 55 * dpr, floatY - 10 * dpr, 110 * dpr, 20 * dpr);
        ctx.fillStyle = fx.color || '#facc15';
        ctx.font = `bold ${Math.max(10, Math.floor(cellH * 0.16))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(fx.floatingText || '+1 ĐIỂM', targetX, floatY + 4 * dpr);
      } else if (fx.type === 'meteor') {
        // Giant Falling Meteor with Flaming Impact Crater
        const dropProgress = Math.min(1, progress * 1.5);
        const curX = targetX - (1 - dropProgress) * (cellW * 0.6);
        const curY = targetY - (1 - dropProgress) * (cellH * 1.8);
        
        // Meteor core
        const grad = ctx.createRadialGradient(curX, curY, 2 * dpr, curX, curY, 18 * dpr);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.4, '#f97316');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(curX, curY, 18 * dpr, 0, Math.PI * 2);
        ctx.fill();

        // Impact Shockwave
        if (dropProgress >= 0.8) {
          const impactProg = (dropProgress - 0.8) / 0.2;
          ctx.strokeStyle = '#fb923c';
          ctx.lineWidth = (4 - impactProg * 3) * dpr;
          ctx.beginPath();
          ctx.arc(targetX, targetY, impactProg * cellW * 0.85, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (fx.type === 'lightning') {
        // Branching Electrical Lightning Bolt
        ctx.strokeStyle = fx.color || '#38bdf8';
        ctx.lineWidth = 3 * dpr;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12 * dpr;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const midX = (startX + targetX) / 2 + (Math.random() - 0.5) * 20 * dpr;
        const midY = (startY + targetY) / 2 + (Math.random() - 0.5) * 20 * dpr;
        ctx.lineTo(midX, midY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (fx.type === 'thorns') {
        // Retaliatory Thorns Burst
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5 * dpr;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const len = (8 + Math.sin(progress * Math.PI) * 16) * dpr;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + Math.cos(a) * len, startY + Math.sin(a) * len);
          ctx.stroke();
        }
      } else if (fx.type === 'transform') {
        // Swirling Transformation Vortex
        const radius = (cellW * 0.45) * (0.8 + Math.sin(progress * Math.PI * 2) * 0.2);
        ctx.strokeStyle = fx.color || '#ef4444';
        ctx.lineWidth = 3 * dpr;
        ctx.shadowColor = fx.color || '#ef4444';
        ctx.shadowBlur = 10 * dpr;
        ctx.beginPath();
        ctx.arc(targetX, targetY, radius, progress * 4, progress * 4 + Math.PI * 1.5);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (fx.type === 'summon') {
        // Runic Summoning Circle
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath();
        ctx.arc(targetX, targetY, cellW * 0.4 * progress, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.type === 'petrify') {
        // Stone beam
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4 * dpr;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      } else if (fx.type === 'reborn') {
        // Lich / Undying Fiend Rebirth Shockwave & Soul Ascension
        const ringRadius = cellW * 0.9 * progress;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = (4 - progress * 3) * dpr;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 15 * dpr;
        ctx.beginPath();
        ctx.arc(targetX, targetY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Rising Spirit Souls & Frost Shards
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const dist = (cellW * 0.35 + Math.sin(progress * Math.PI) * 12) * dpr;
          const px = targetX + Math.cos(angle) * dist;
          const py = targetY + Math.sin(angle) * dist - progress * 28 * dpr;
          ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#e9d5ff';
          ctx.beginPath();
          ctx.arc(px, py, (3 - progress * 2) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (fx.type === 'buff_aura') {
        // Shaman War Drum Soundwaves & Ally Runic Blessing
        const auraProg = (progress * 1.8) % 1;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = (3 - auraProg * 2) * dpr;
        ctx.beginPath();
        ctx.arc(targetX, targetY, auraProg * cellW * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = (2 - auraProg * 1.5) * dpr;
        ctx.beginPath();
        ctx.arc(targetX, targetY, ((auraProg + 0.3) % 1) * cellW * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.type === 'magic_reflect') {
        // Prismatic Hexagonal Spell Reflection Barrier
        const hexSize = cellW * 0.45;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3 * dpr;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10 * dpr;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const hx = targetX + Math.cos(a) * hexSize;
          const hy = targetY + Math.sin(a) * hexSize;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (fx.type === 'barrel_explosion') {
        // Massive Barrel TNT Blast: Expanding fiery ring + smoke and flying shrapnel
        const blastRadius = cellW * 1.4 * progress;
        const blastGrad = ctx.createRadialGradient(targetX, targetY, 2 * dpr, targetX, targetY, blastRadius);
        blastGrad.addColorStop(0, '#fef08a');
        blastGrad.addColorStop(0.3, '#f97316');
        blastGrad.addColorStop(0.7, '#dc2626');
        blastGrad.addColorStop(1, 'rgba(69, 10, 10, 0)');
        ctx.fillStyle = blastGrad;
        ctx.beginPath();
        ctx.arc(targetX, targetY, blastRadius, 0, Math.PI * 2);
        ctx.fill();

        // Expanding shockwave ring
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = (4 - progress * 3) * dpr;
        ctx.beginPath();
        ctx.arc(targetX, targetY, cellW * 1.6 * progress, 0, Math.PI * 2);
        ctx.stroke();

        // Flying wood shrapnel particles
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + progress * 2;
          const dist = cellW * (0.3 + progress * 0.9);
          const px = targetX + Math.cos(a) * dist;
          const py = targetY + Math.sin(a) * dist;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px - 3 * dpr, py - 3 * dpr, 6 * dpr, 6 * dpr);
        }
      } else if (fx.type === 'wall_slam') {
        // Wall Impact Fracture Lines & Heavy Dust Shockwave
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5 * dpr;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8 * dpr;
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const dist = (8 + progress * cellW * 0.45) * dpr;
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(targetX + Math.cos(a) * dist, targetY + Math.sin(a) * dist);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (fx.type === 'shatter') {
        // Ice Shatter Crystal Splinters
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5 * dpr;
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const dist = cellW * (0.2 + progress * 0.7);
          const px = targetX + Math.cos(a) * dist;
          const py = targetY + Math.sin(a) * dist;
          ctx.beginPath();
          ctx.moveTo(px, py - 4 * dpr);
          ctx.lineTo(px + 4 * dpr, py);
          ctx.lineTo(px, py + 4 * dpr);
          ctx.lineTo(px - 4 * dpr, py);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (fx.type === 'claw3') {
        // 3 Parallel Savage Beast Claw Tears
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3 * dpr;
        ctx.lineCap = 'round';
        const offsets = [-8 * dpr, 0, 8 * dpr];
        offsets.forEach((off) => {
          ctx.beginPath();
          ctx.moveTo(targetX - 16 * dpr + off, targetY - 14 * dpr * progress);
          ctx.lineTo(targetX + 16 * dpr + off, targetY + 14 * dpr * progress);
          ctx.stroke();
        });
      } else if (fx.type === 'bash') {
        // Crushing Hammer Impact: Stone Fissure Ground Cracks & Shockwave
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = (3.5 - progress * 2) * dpr;
        ctx.lineCap = 'round';
        // Branching ground fissures in 4 directions
        const branches = [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
          [0.7, 0.7],
          [-0.7, -0.7],
        ];
        branches.forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          const midX = targetX + dx * cellW * 0.25 * progress + (Math.sin(dx * 4) * 5 * dpr);
          const midY = targetY + dy * cellH * 0.25 * progress + (Math.cos(dy * 4) * 5 * dpr);
          const endX = targetX + dx * cellW * 0.48 * progress;
          const endY = targetY + dy * cellH * 0.48 * progress;
          ctx.lineTo(midX, midY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
        // Dust shockwave ring
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.arc(targetX, targetY, progress * cellW * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      } else if (fx.type === 'strike') {
        // High-Velocity Curved Crescent Blade Slash Wave
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const slashRadius = cellW * 0.42;
        const swingAngle = angle - Math.PI * 0.45 + progress * Math.PI * 0.9;

        ctx.save();
        ctx.translate(targetX, targetY);
        // Crescent Blade Trail
        ctx.strokeStyle = fx.color || '#f8fafc';
        ctx.lineWidth = (4 - progress * 2.5) * dpr;
        ctx.lineCap = 'round';
        ctx.shadowColor = fx.color || '#38bdf8';
        ctx.shadowBlur = 8 * dpr;
        ctx.beginPath();
        ctx.arc(0, 0, slashRadius, swingAngle - 0.55, swingAngle + 0.55);
        ctx.stroke();

        // White-hot blade inner core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.arc(0, 0, slashRadius, swingAngle - 0.25, swingAngle + 0.25);
        ctx.stroke();

        // Hit Sparks Burst along edge
        if (progress > 0.4) {
          ctx.fillStyle = '#fef08a';
          for (let s = 0; s < 4; s++) {
            const spDist = slashRadius + (s * 4 + 2) * dpr;
            const spAngle = swingAngle + (s - 1.5) * 0.25;
            ctx.fillRect(Math.cos(spAngle) * spDist, Math.sin(spAngle) * spDist, 2.5 * dpr, 2.5 * dpr);
          }
        }
        ctx.restore();
      } else if (fx.type === 'arrow') {
        // Drawn Wooden Arrow with Steel Broadhead, Fletching & Speed Streak
        const curX = startX + (targetX - startX) * progress;
        const curY = startY + (targetY - startY) * progress;
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const arrowLen = 22 * dpr;

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(angle);

        // Motion Speed Trail
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.4)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(-arrowLen * 1.5, 0);
        ctx.lineTo(-arrowLen * 0.5, 0);
        ctx.stroke();

        // Wooden Arrow Shaft
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(-arrowLen, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Steel Broadhead (Triangle Tip)
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(5 * dpr, 0);
        ctx.lineTo(-2 * dpr, -3.5 * dpr);
        ctx.lineTo(-2 * dpr, 3.5 * dpr);
        ctx.closePath();
        ctx.fill();

        // Crimson/White Feather Fletchings
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(-arrowLen + 4 * dpr, -3 * dpr);
        ctx.lineTo(-arrowLen, 0);
        ctx.lineTo(-arrowLen + 4 * dpr, 3 * dpr);
        ctx.stroke();

        ctx.restore();
      } else if (fx.type === 'fire') {
        // Billowing Fireball Comet with Swirling Embers
        const curX = startX + (targetX - startX) * progress;
        const curY = startY + (targetY - startY) * progress;
        const angle = Math.atan2(targetY - startY, targetX - startX);

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(angle);

        // Trailing Flame Tongue
        const flameGrad = ctx.createRadialGradient(0, 0, 1 * dpr, 0, 0, 12 * dpr);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#fef08a');
        flameGrad.addColorStop(0.7, '#f97316');
        flameGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(8 * dpr, 0);
        ctx.quadraticCurveTo(-4 * dpr, -8 * dpr, -16 * dpr, 0);
        ctx.quadraticCurveTo(-4 * dpr, 8 * dpr, 8 * dpr, 0);
        ctx.fill();

        // Swirling embers trailing behind
        ctx.fillStyle = '#fed7aa';
        for (let e = 1; e <= 3; e++) {
          const embX = -14 * dpr - e * 5 * dpr;
          const embY = Math.sin(progress * 15 + e) * 4 * dpr;
          ctx.beginPath();
          ctx.arc(embX, embY, (2.5 - e * 0.5) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Impact Fiery Nova on arrival
        if (progress > 0.6) {
          const fireProg = (progress - 0.6) / 0.4;
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = (3 - fireProg * 2) * dpr;
          ctx.beginPath();
          ctx.arc(targetX, targetY, fireProg * cellW * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Projectile / Arcane Magic Beam
        const curX = startX + (targetX - startX) * progress;
        const curY = startY + (targetY - startY) * progress;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3 * dpr;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // Pulsing Arcane Halo
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.arc(curX, curY, (6 + Math.sin(progress * 10) * 2) * dpr, 0, Math.PI * 2);
        ctx.stroke();

        if (progress > 0.5) {
          const ringProg = (progress - 0.5) / 0.5;
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = 2 * dpr;
          ctx.beginPath();
          ctx.arc(targetX, targetY, ringProg * cellW * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (fx.floatingText) {
        const floatY = targetY - cellH * (0.35 + progress * 0.35);
        ctx.fillStyle = '#06090e';
        ctx.fillRect(targetX - 48 * dpr, floatY - 9 * dpr, 96 * dpr, 18 * dpr);
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeRect(targetX - 48 * dpr, floatY - 9 * dpr, 96 * dpr, 18 * dpr);
        ctx.fillStyle = fx.color;
        ctx.font = `bold ${Math.max(9, Math.floor(cellH * 0.14))}px 'Silkscreen', 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(fx.floatingText, targetX, floatY + 4 * dpr);
      }

      if (fx.damage !== 0) {
        const floatY = targetY - cellH * (0.15 + progress * 0.28);
        const text = fx.damage < 0 ? `+${Math.abs(fx.damage)}` : `-${fx.damage}`;
        const fontSize = Math.max(11, Math.floor(cellH * (fx.isCrit ? 0.24 : 0.18)));
        ctx.font = `bold ${fontSize}px 'Press Start 2P', 'Silkscreen', monospace`;
        ctx.textAlign = 'center';

        // 2.5px solid black outline for maximum contrast without visual blur
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5 * dpr;
        ctx.strokeText(text, targetX, floatY);

        ctx.fillStyle = fx.damage < 0 ? '#4ade80' : fx.isCrit ? '#fbbf24' : '#ffffff';
        ctx.fillText(text, targetX, floatY);
      }
      ctx.restore();
    }

    // 10. Atmospheric Dungeon Dust Motes & Ambient Vignette
    // Floating air motes / sparks
    const moteCount = 14;
    for (let i = 0; i < moteCount; i++) {
      const moteTime = (now / 1800 + i * 0.17) % 1;
      const moteX = ((i * 137.5) % width) + Math.sin(now / 900 + i) * (15 * dpr);
      const moteY = height - moteTime * height;
      const moteAlpha = Math.sin(moteTime * Math.PI) * (biome === 'abyssal_forge' ? 0.35 : 0.22);
      ctx.fillStyle = biome === 'abyssal_forge' ? `rgba(249, 115, 22, ${moteAlpha})` : `rgba(254, 240, 138, ${moteAlpha})`;
      ctx.beginPath();
      ctx.arc(moteX, moteY, (1 + (i % 2) * 0.8) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cinematic Dark Vignette around edges
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.45,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.7, 'rgba(3, 7, 18, 0.2)');
    vignette.addColorStop(1, 'rgba(2, 6, 23, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }, [
    units,
    walls,
    terrainMap,
    triggeredTraps,
    bossTelegraph,
    visualEffects,
    activeId,
    selectedId,
    moveTiles,
    targetTiles,
    phase,
    biome,
    equipped,
    getEffectiveStats,
    screenShake,
    elevations,
    barrels,
  ]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      draw();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    const tileX = Math.floor((clickX / rect.width) * GRID_COLS);
    const tileY = Math.floor((clickY / rect.height) * GRID_ROWS);
    if (tileX >= 0 && tileX < GRID_COLS && tileY >= 0 && tileY < GRID_ROWS) {
      onTileClick(tileX, tileY);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerDown(e.clientX, e.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[1.78] max-h-[560px] bg-[#070a0f] pixel-frame overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full block cursor-pointer touch-none pixelated"
      />
    </div>
  );
};
