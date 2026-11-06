import { describe, expect, it } from "vitest";
import { HAND_CONNECTIONS, LANDMARK_COUNT, toPixels } from "./landmarks";

describe("landmarks", () => {
  it("scales normalized points to pixels", () => {
    expect(toPixels([{ x: 0.5, y: 0.25 }], 640, 480)).toEqual([{ x: 320, y: 120 }]);
  });

  it("only references valid landmark indices", () => {
    for (const [a, b] of HAND_CONNECTIONS) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(LANDMARK_COUNT);
      expect(a).not.toBe(b);
    }
  });

  it("connects every landmark at least once", () => {
    const seen = new Set(HAND_CONNECTIONS.flat());
    expect(seen.size).toBe(LANDMARK_COUNT);
  });
});
