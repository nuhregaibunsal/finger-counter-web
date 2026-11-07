import type { Point } from "./landmarks";

/** Handedness label exactly as MediaPipe reports it for the raw (non-mirrored) video frame. */
export type Handedness = "Left" | "Right";

export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

// MediaPipe landmark indices: [tip, PIP] for the four fingers, [tip, IP] for the thumb.
const THUMB_TIP = 4;
const THUMB_IP = 3;
const FINGERS = {
  index: [8, 6],
  middle: [12, 10],
  ring: [16, 14],
  pinky: [20, 18],
} as const;

/**
 * A finger is raised when its tip is above its PIP joint (smaller y; image y grows downward).
 * The thumb moves sideways, so it is raised when its tip lies beyond the IP joint along x.
 * MediaPipe assumes mirrored input, so on a raw frame a "Right" label is a physical left hand:
 * its extended thumb points toward smaller x, and a "Left" label points toward larger x.
 */
export function fingerStates(landmarks: readonly Point[], handedness: Handedness): FingerStates {
  if (landmarks.length < 21) throw new Error("expected 21 landmarks");
  const thumbTip = landmarks[THUMB_TIP];
  const thumbIp = landmarks[THUMB_IP];
  const thumb = handedness === "Right" ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x;
  const up = ([tip, pip]: readonly [number, number]) => landmarks[tip].y < landmarks[pip].y;
  return {
    thumb,
    index: up(FINGERS.index),
    middle: up(FINGERS.middle),
    ring: up(FINGERS.ring),
    pinky: up(FINGERS.pinky),
  };
}

/** Number of raised fingers (0-5) on one hand. */
export function countFingers(landmarks: readonly Point[], handedness: Handedness): number {
  return Object.values(fingerStates(landmarks, handedness)).filter(Boolean).length;
}
