import { describe, expect, it } from "vitest";
import { Game } from "./game";

const make = () => new Game({ random: () => 0, holdMs: 300, spawnEveryMs: 1000, lifetimeMs: 5000, lives: 2 });

describe("Game", () => {
  it("spawns a bubble on the first tick with distinct values", () => {
    const g = make();
    g.tick(0, null);
    g.tick(1000, null);
    expect(g.state.bubbles.map((b) => b.value)).toEqual([1, 2]);
  });

  it("pops a matching bubble only after the count is held", () => {
    const g = make();
    g.tick(0, null);
    g.tick(100, 1);
    g.tick(300, 1);
    expect(g.state.popped).toBe(0);
    g.tick(450, 1);
    expect(g.state.popped).toBe(1);
    expect(g.state.score).toBeGreaterThan(10);
  });

  it("does not pop when the count flickers", () => {
    const g = make();
    g.tick(0, null);
    g.tick(100, 1);
    g.tick(250, 2);
    g.tick(400, 1);
    g.tick(500, 1);
    expect(g.state.popped).toBe(0);
  });

  it("ignores a wrong number and a hidden hand", () => {
    const g = make();
    g.tick(0, null);
    for (let t = 100; t < 1000; t += 100) g.tick(t, 4);
    for (let t = 1000; t < 1500; t += 100) g.tick(t, null);
    expect(g.state.popped).toBe(0);
  });

  it("awards more points for popping early", () => {
    const g = make();
    const b = { id: 1, value: 1, x: 0.5, spawnedAt: 0, expiresAt: 5000 };
    expect(g.points(b, 0)).toBe(20);
    expect(g.points(b, 4999)).toBe(10);
  });

  it("loses a life per expired bubble and ends the game", () => {
    const g = make();
    g.tick(0, null);
    g.tick(5000, null);
    expect(g.state.lives).toBe(1);
    g.tick(6000, null);
    g.tick(11000, null);
    expect(g.state.over).toBe(true);
    expect(g.state.bubbles).toEqual([]);
  });

  it("restart resets score, lives and bubbles", () => {
    const g = make();
    g.tick(0, null);
    g.tick(5000, null);
    g.restart();
    expect(g.state).toEqual({ bubbles: [], score: 0, lives: 2, over: false, popped: 0 });
  });
});
