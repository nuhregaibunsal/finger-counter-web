import { describe, expect, it } from "vitest";
import { countFingers, fingerStates } from "./counter";
import type { Point } from "./landmarks";

/**
 * Builds a hand whose wrist is at the bottom. `raised` lists the fingers that are extended.
 * `thumbDir` is +1 when an extended thumb points toward larger x, -1 toward smaller x.
 */
function hand(raised: string[], thumbDir: 1 | -1): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.9 }));
  const cols = { index: 0.45, middle: 0.5, ring: 0.55, pinky: 0.6 } as const;
  const base = { index: 5, middle: 9, ring: 13, pinky: 17 } as const;
  for (const name of Object.keys(cols) as (keyof typeof cols)[]) {
    const b = base[name];
    const x = cols[name];
    const open = raised.includes(name);
    pts[b] = { x, y: 0.6 };
    pts[b + 1] = { x, y: 0.5 }; // PIP
    pts[b + 2] = { x, y: open ? 0.4 : 0.55 };
    pts[b + 3] = { x, y: open ? 0.3 : 0.58 }; // tip
  }
  pts[3] = { x: 0.4, y: 0.65 }; // thumb IP
  pts[4] = { x: raised.includes("thumb") ? 0.4 + 0.1 * thumbDir : 0.4 - 0.05 * thumbDir, y: 0.62 };
  return pts;
}

describe("countFingers", () => {
  it("counts a closed fist as 0", () => {
    expect(countFingers(hand([], 1), "Left")).toBe(0);
    expect(countFingers(hand([], -1), "Right")).toBe(0);
  });

  it("counts an open hand as 5 for both handedness labels", () => {
    expect(countFingers(hand(["thumb", "index", "middle", "ring", "pinky"], 1), "Left")).toBe(5);
    expect(countFingers(hand(["thumb", "index", "middle", "ring", "pinky"], -1), "Right")).toBe(5);
  });

  it("counts index and middle as 2", () => {
    expect(countFingers(hand(["index", "middle"], 1), "Left")).toBe(2);
  });

  it("detects the thumb alone", () => {
    expect(fingerStates(hand(["thumb"], -1), "Right")).toEqual({
      thumb: true, index: false, middle: false, ring: false, pinky: false,
    });
  });

  it("does not count the thumb when handedness is flipped", () => {
    expect(fingerStates(hand(["thumb"], 1), "Right").thumb).toBe(false);
  });

  it("rejects incomplete landmark lists", () => {
    expect(() => countFingers([{ x: 0, y: 0 }], "Left")).toThrow();
  });
});
