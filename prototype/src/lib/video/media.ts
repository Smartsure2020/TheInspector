"use client";
// Local media helpers (Chunk 1D). Provider-agnostic — used by any adapter.
//
// Test hook: `?media=fake` substitutes an animated canvas stream for getUserMedia
// so the room runs on camera-less machines (demo laptops, automated verification).
// Clearly a prototype affordance; harmless if a real client ever hits it (they
// would just see the synthetic feed of themselves).

export type Facing = "user" | "environment";

export const wantsFakeMedia = () =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).get("media") === "fake";

export function makeFakeStream(label = "FAKE CAMERA"): MediaStream {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;
  let hue = 200;
  const draw = () => {
    hue = (hue + 0.5) % 360;
    ctx.fillStyle = `hsl(${hue} 40% 25%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.fillText(label, 60, 120);
    ctx.font = "36px monospace";
    ctx.fillText(new Date().toISOString().slice(11, 23), 60, 200);
    // Moving element so consecutive frames differ (capture-loop verification).
    const t = Date.now() / 600;
    ctx.beginPath();
    ctx.arc(640 + Math.sin(t) * 400, 450, 60, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    // Simulated rating plate for legibility checks.
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(880, 520, 340, 150);
    ctx.fillStyle = "#0f172a";
    ctx.font = "22px monospace";
    ctx.fillText("KWIKOT 150L", 900, 560);
    ctx.fillText("SN 8842-1193-X", 900, 595);
    ctx.fillText("MFG 2019-03", 900, 630);
  };
  draw();
  setInterval(draw, 66);
  return canvas.captureStream(15);
}

export async function getLocalMedia(facing: Facing): Promise<MediaStream> {
  if (wantsFakeMedia()) return makeFakeStream(facing === "user" ? "FAKE FRONT CAM" : "FAKE REAR CAM");
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  });
}

/** Try to toggle the torch on the given stream's video track. Returns success. */
export async function tryTorch(stream: MediaStream | null, on: boolean): Promise<boolean> {
  const track = stream?.getVideoTracks()[0];
  if (!track) return false;
  try {
    await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Capture a full-resolution still (high-res photo flow). Opens a dedicated
 * max-resolution stream, grabs a frame, closes it. Returns a JPEG blob.
 * iOS Safari lacks ImageCapture.takePhoto — the canvas grab of a max-res
 * stream is the documented fallback (device spike SP6).
 */
export async function captureHighResPhoto(facing: Facing): Promise<Blob | null> {
  if (wantsFakeMedia()) {
    const s = makeFakeStream("FAKE HIGH-RES");
    const blob = await grabFrame(s, 0.92);
    s.getTracks().forEach((t) => t.stop());
    return blob;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facing }, width: { ideal: 4096 }, height: { ideal: 3072 } },
    audio: false,
  });
  try {
    const track = stream.getVideoTracks()[0];
    const IC = (window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => { takePhoto(): Promise<Blob> } }).ImageCapture;
    if (IC) {
      try {
        return await new IC(track).takePhoto();
      } catch {
        /* fall through to canvas grab */
      }
    }
    await new Promise((r) => setTimeout(r, 350)); // let exposure settle
    return await grabFrame(stream, 0.92);
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

/** Draw the stream's current frame to a canvas and return a JPEG blob. */
export async function grabFrame(stream: MediaStream, quality = 0.85): Promise<Blob | null> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play().catch(() => {});
  if (video.videoWidth === 0) await new Promise((r) => setTimeout(r, 200));
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  video.srcObject = null;
  return new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
}

/** Grab a frame from an already-playing <video> element (fast path — no new element). */
export function grabFrameFromElement(video: HTMLVideoElement, quality = 0.85): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext("2d")!.drawImage(video, 0, 0);
  return new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
}
