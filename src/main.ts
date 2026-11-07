import "./style.css";
import { drawHands, type Point } from "./landmarks";
import { countFingers, type Handedness } from "./counter";

const VERSION = "0.10.21";
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

interface HandLandmarkerLike {
  detectForVideo(video: HTMLVideoElement, ts: number): { landmarks: Point[][]; handedness: { categoryName: string }[][] };
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const video = $<HTMLVideoElement>("video");
const canvas = $<HTMLCanvasElement>("overlay");
const countEl = $<HTMLDivElement>("count");
const status = $<HTMLParagraphElement>("status");
const ctx = canvas.getContext("2d")!;

let landmarker: HandLandmarkerLike | null = null;
let lastTime = -1;

async function loadModel(): Promise<void> {
  const vision = await import(/* @vite-ignore */ `${CDN}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(`${CDN}/wasm`);
  landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL },
    runningMode: "VIDEO",
    numHands: 2,
  });
}

function loop(): void {
  if (landmarker && !video.paused && !video.ended && video.currentTime !== lastTime) {
    lastTime = video.currentTime;
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const result = landmarker.detectForVideo(video, performance.now());
    drawHands(ctx, result.landmarks);
    const total = result.landmarks.reduce((sum, hand, i) => {
      const label = (result.handedness[i]?.[0]?.categoryName ?? "Right") as Handedness;
      return sum + countFingers(hand, label);
    }, 0);
    countEl.textContent = result.landmarks.length ? String(total) : "–";
    status.textContent = `${result.landmarks.length} hand(s) detected`;
  }
  requestAnimationFrame(loop);
}

function setSource(): void {
  lastTime = -1;
  void video.play().catch(() => undefined);
}

$<HTMLInputElement>("file").addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  stopWebcam();
  video.src = URL.createObjectURL(file);
  video.controls = true;
  setSource();
});

function stopWebcam(): void {
  const s = video.srcObject as MediaStream | null;
  s?.getTracks().forEach((t) => t.stop());
  video.srcObject = null;
}

$<HTMLButtonElement>("webcam").addEventListener("click", async () => {
  try {
    stopWebcam();
    video.removeAttribute("src");
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
    video.controls = false;
    setSource();
  } catch {
    status.textContent = "Webcam unavailable. You can still upload a video.";
  }
});

loadModel()
  .then(() => {
    status.textContent = "Model ready. Choose a video or the webcam.";
  })
  .catch(() => {
    status.textContent = "Could not load the hand model (network?).";
  });
loop();
