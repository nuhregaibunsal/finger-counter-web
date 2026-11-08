export interface Bubble {
  id: number;
  value: number;
  x: number; // 0..1 horizontal position
  spawnedAt: number;
  expiresAt: number;
}

export interface GameState {
  bubbles: Bubble[];
  score: number;
  lives: number;
  over: boolean;
  popped: number;
}

export interface GameOptions {
  lives: number;
  maxValue: number;
  lifetimeMs: number;
  spawnEveryMs: number;
  holdMs: number;
  maxBubbles: number;
  random: () => number;
}

export const DEFAULTS: GameOptions = {
  lives: 3,
  maxValue: 5,
  lifetimeMs: 6000,
  spawnEveryMs: 2000,
  holdMs: 350,
  maxBubbles: 3,
  random: Math.random,
};

/** Pure, time-driven game rules. The caller passes the clock and the current finger count. */
export class Game {
  state: GameState;
  private opts: GameOptions;
  private nextId = 1;
  private lastSpawn = -Infinity;
  private heldValue: number | null = null;
  private heldSince = 0;

  constructor(opts: Partial<GameOptions> = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.state = this.fresh();
  }

  private fresh(): GameState {
    return { bubbles: [], score: 0, lives: this.opts.lives, over: false, popped: 0 };
  }

  restart(): void {
    this.state = this.fresh();
    this.nextId = 1;
    this.lastSpawn = -Infinity;
    this.heldValue = null;
  }

  /** Advance the game. `fingers` is null when no hand is visible. */
  tick(now: number, fingers: number | null): void {
    const s = this.state;
    if (s.over) return;

    const alive: Bubble[] = [];
    for (const b of s.bubbles) {
      if (b.expiresAt <= now) s.lives -= 1;
      else alive.push(b);
    }
    s.bubbles = alive;
    if (s.lives <= 0) {
      s.over = true;
      s.bubbles = [];
      return;
    }

    this.handleInput(now, fingers);

    if (s.bubbles.length < this.opts.maxBubbles && now - this.lastSpawn >= this.opts.spawnEveryMs) {
      this.spawn(now);
    }
  }

  private handleInput(now: number, fingers: number | null): void {
    if (fingers === null || fingers < 1) {
      this.heldValue = null;
      return;
    }
    if (fingers !== this.heldValue) {
      this.heldValue = fingers;
      this.heldSince = now;
      return;
    }
    if (now - this.heldSince < this.opts.holdMs) return;

    // Pop the bubble closest to expiring among those matching the held count.
    const match = this.state.bubbles
      .filter((b) => b.value === fingers)
      .sort((a, b) => a.expiresAt - b.expiresAt)[0];
    if (!match) return;
    this.state.bubbles = this.state.bubbles.filter((b) => b !== match);
    this.state.popped += 1;
    this.state.score += this.points(match, now);
    this.heldSince = now; // require a fresh hold before the next pop
  }

  /** 10 base points plus up to 10 for popping early. */
  points(b: Bubble, now: number): number {
    const total = b.expiresAt - b.spawnedAt;
    const left = Math.max(0, b.expiresAt - now);
    return 10 + Math.round((left / total) * 10);
  }

  private spawn(now: number): void {
    const { random, maxValue, lifetimeMs } = this.opts;
    const taken = new Set(this.state.bubbles.map((b) => b.value));
    const free: number[] = [];
    for (let v = 1; v <= maxValue; v++) if (!taken.has(v)) free.push(v);
    if (!free.length) return;
    const value = free[Math.floor(random() * free.length)];
    this.state.bubbles.push({
      id: this.nextId++,
      value,
      x: 0.1 + random() * 0.8,
      spawnedAt: now,
      expiresAt: now + lifetimeMs,
    });
    this.lastSpawn = now;
  }
}
