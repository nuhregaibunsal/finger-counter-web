export interface Point {
  x: number;
  y: number;
}

/** Index pairs of the 21-point MediaPipe hand skeleton. */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export const LANDMARK_COUNT = 21;

/** Converts normalized (0..1) landmarks to canvas pixel coordinates. */
export function toPixels(landmarks: readonly Point[], width: number, height: number): Point[] {
  return landmarks.map((p) => ({ x: p.x * width, y: p.y * height }));
}

/** Draws skeleton lines and the 21 joints of every detected hand. */
export function drawHands(
  ctx: CanvasRenderingContext2D,
  hands: readonly (readonly Point[])[],
): void {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  for (const hand of hands) {
    const pts = toPixels(hand, width, height);
    ctx.strokeStyle = "#95d5b2";
    ctx.lineWidth = Math.max(2, width / 300);
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      ctx.stroke();
    }
    ctx.fillStyle = "#f4a261";
    const r = Math.max(3, width / 200);
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
