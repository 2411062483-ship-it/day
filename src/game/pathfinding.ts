import { GRID_COLS, GRID_ROWS, EXIT_DOOR } from './constants';
import { TerrainTile, Unit } from '../types/game';

export interface Point {
  x: number;
  y: number;
}

export const inBounds = (x: number, y: number): boolean => {
  return x >= 0 && y >= 0 && x < GRID_COLS && y < GRID_ROWS;
};

export const manhattan = (a: Point, b: Point): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

// Movement blocking terrain: Water, abyss, and iron bars block walking units
export const isBlockedTerrain = (x: number, y: number, terrainMap: Map<string, TerrainTile>): boolean => {
  const tile = terrainMap.get(`${x},${y}`);
  return tile?.type === 'water' || tile?.type === 'abyss' || tile?.type === 'iron_bars';
};

export const isOccupied = (
  x: number,
  y: number,
  units: Unit[],
  exceptId?: string
): boolean => {
  return units.some(
    (u) => u.hp > 0 && !u.inTransit && u.id !== exceptId && u.x === x && u.y === y
  );
};

export const getNeighbors = (
  x: number,
  y: number,
  walls: Set<string>,
  terrainMap: Map<string, TerrainTile>,
  canFly: boolean = false
): Point[] => {
  const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];
  return dirs
    .map((d) => ({ x: x + d.x, y: y + d.y }))
    .filter(
      (p) =>
        inBounds(p.x, p.y) &&
        !walls.has(`${p.x},${p.y}`) &&
        (canFly || !isBlockedTerrain(p.x, p.y, terrainMap))
    );
};

// Line of sight:
// Solid stone walls block shots.
// Iron bars, water, abyss, lava, altars, and moss DO NOT block arrows or spells!
export const clearShot = (
  attacker: Point,
  target: Point,
  walls: Set<string>,
  _terrainMap?: Map<string, TerrainTile>
): boolean => {
  if (attacker.x === target.x && attacker.y === target.y) return true;

  // Orthogonal straight shot
  if (attacker.x === target.x) {
    const step = attacker.y < target.y ? 1 : -1;
    for (let y = attacker.y + step; y !== target.y; y += step) {
      if (walls.has(`${attacker.x},${y}`)) {
        return false;
      }
    }
    return true;
  }
  if (attacker.y === target.y) {
    const step = attacker.x < target.x ? 1 : -1;
    for (let x = attacker.x + step; x !== target.x; x += step) {
      if (walls.has(`${x},${attacker.y}`)) {
        return false;
      }
    }
    return true;
  }

  // Diagonal / oblique: test both corner paths
  const sx = attacker.x < target.x ? 1 : -1;
  const sy = attacker.y < target.y ? 1 : -1;

  const routeA: Point[] = [];
  for (let x = attacker.x + sx; x !== target.x; x += sx) routeA.push({ x, y: attacker.y });
  for (let y = attacker.y + sy; y !== target.y; y += sy) routeA.push({ x: target.x, y });

  const routeB: Point[] = [];
  for (let y = attacker.y + sy; y !== target.y; y += sy) routeB.push({ x: attacker.x, y });
  for (let x = attacker.x + sx; x !== target.x; x += sx) routeB.push({ x, y: target.y });

  const pathAValid = routeA.every((p) => !walls.has(`${p.x},${p.y}`));
  if (pathAValid) return true;

  return routeB.every((p) => !walls.has(`${p.x},${p.y}`));
};

// Reachable tiles within movement points (Each 1 tile moved costs 1 MP!)
export interface ReachablePoint extends Point {
  dist: number;
}

export const getReachableTiles = (
  unit: Unit,
  moveRange: number,
  walls: Set<string>,
  terrainMap: Map<string, TerrainTile>,
  units: Unit[]
): ReachablePoint[] => {
  // Each tile moved costs 1 MP for heroes!
  const effectiveMove = unit.kind === 'hero' ? Math.min(moveRange, Math.max(0, unit.mp)) : moveRange;
  if (effectiveMove <= 0) return [];

  const queue: { x: number; y: number; dist: number }[] = [
    { x: unit.x, y: unit.y, dist: 0 },
  ];
  const visited = new Set<string>([`${unit.x},${unit.y}`]);
  const result: ReachablePoint[] = [];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.dist >= effectiveMove) continue;

    for (const next of getNeighbors(cur.x, cur.y, walls, terrainMap, unit.species === 'bird')) {
      const key = `${next.x},${next.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      // Cannot end turn on an occupied tile, but if occupied by an ally, cannot move through either
      if (isOccupied(next.x, next.y, units, unit.id)) continue;

      queue.push({ x: next.x, y: next.y, dist: cur.dist + 1 });
      result.push({ x: next.x, y: next.y, dist: cur.dist + 1 });
    }
  }

  return result;
};

// Find step towards attack range
export const findPathToAttackRange = (
  mover: Unit,
  target: Unit,
  range: number,
  walls: Set<string>,
  terrainMap: Map<string, TerrainTile>,
  units: Unit[]
): { step: Point | null; distance: number; goal: Point } | null => {
  const queue: { x: number; y: number; dist: number; first: Point | null }[] = [
    { x: mover.x, y: mover.y, dist: 0, first: null },
  ];
  const visited = new Set<string>([`${mover.x},${mover.y}`]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (
      cur.dist > 0 &&
      manhattan(cur, target) <= range &&
      clearShot(cur, target, walls, terrainMap)
    ) {
      return { step: cur.first, distance: cur.dist, goal: { x: cur.x, y: cur.y } };
    }

    if (cur.dist > 15) continue;

    for (const next of getNeighbors(cur.x, cur.y, walls, terrainMap, mover.species === 'bird')) {
      const key = `${next.x},${next.y}`;
      if (visited.has(key)) continue;

      if (isOccupied(next.x, next.y, units, mover.id)) continue;
      visited.add(key);
      queue.push({
        x: next.x,
        y: next.y,
        dist: cur.dist + 1,
        first: cur.first || next,
      });
    }
  }

  return null;
};

// Shortest path to reach a specific destination (e.g. exit door)
export const findShortestStep = (
  mover: Unit,
  destination: Point,
  walls: Set<string>,
  terrainMap: Map<string, TerrainTile>,
  units: Unit[]
): Point | null => {
  if (mover.x === destination.x && mover.y === destination.y) return null;

  const queue: { x: number; y: number; first: Point | null }[] = [
    { x: mover.x, y: mover.y, first: null },
  ];
  const visited = new Set<string>([`${mover.x},${mover.y}`]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === destination.x && cur.y === destination.y) {
      return cur.first;
    }

    for (const next of getNeighbors(cur.x, cur.y, walls, terrainMap, mover.species === 'bird')) {
      const key = `${next.x},${next.y}`;
      if (visited.has(key)) continue;

      const isGoal = next.x === destination.x && next.y === destination.y;
      if (!isGoal && isOccupied(next.x, next.y, units, mover.id)) continue;
      visited.add(key);
      queue.push({
        x: next.x,
        y: next.y,
        first: cur.first || next,
      });
    }
  }

  const reachable = getReachableTiles(mover, mover.move, walls, terrainMap, units);
  if (reachable.length > 0) {
    reachable.sort((a, b) => manhattan(a, destination) - manhattan(b, destination));
    if (manhattan(reachable[0], destination) < manhattan(mover, destination)) {
      return reachable[0];
    }
  }

  return null;
};

// Map Connectivity Validator: Ensures spawns and exit door are never partitioned
export const ensureMapConnectivity = (
  walls: Set<string>,
  terrainMap: Map<string, TerrainTile>
) => {
  const criticalKeys = [
    '1,2', '1,3', '1,4', '1,5', '2,2', '2,3', '2,4', '2,5', '2,6',
    '10,2', '10,3', '10,4', '11,2', '11,3', '11,4',
  ];
  for (const k of criticalKeys) {
    walls.delete(k);
    if (terrainMap.get(k)?.type === 'iron_bars') {
      terrainMap.delete(k);
    }
  }

  // Ensure bridges connect cleanly
  for (const [key, tile] of terrainMap.entries()) {
    if (tile.type === 'bridge') {
      const [bx, by] = key.split(',').map(Number);
      walls.delete(key);
      const bridgeNeighbors = [
        { x: bx, y: by - 1 },
        { x: bx + 1, y: by },
        { x: bx, y: by + 1 },
        { x: bx - 1, y: by },
      ];
      for (const p of bridgeNeighbors) {
        if (inBounds(p.x, p.y) && !terrainMap.has(`${p.x},${p.y}`)) {
          walls.delete(`${p.x},${p.y}`);
        }
      }
    }
  }

  // Run flood fill from start point (1, 3) to test if EXIT_DOOR is reachable
  const start = { x: 1, y: 3 };
  const queue: Point[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  let reachedExit = false;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === EXIT_DOOR.x && cur.y === EXIT_DOOR.y) {
      reachedExit = true;
      break;
    }

    for (const next of getNeighbors(cur.x, cur.y, walls, terrainMap)) {
      const key = `${next.x},${next.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  // If path is broken, carve a corridor to exit door
  if (!reachedExit) {
    for (let x = 1; x <= EXIT_DOOR.x; x++) {
      walls.delete(`${x},3`);
      const tile = terrainMap.get(`${x},3`);
      if (tile?.type === 'water' || tile?.type === 'abyss' || tile?.type === 'iron_bars') {
        terrainMap.set(`${x},3`, { type: 'bridge' });
      }
    }
  }
};
