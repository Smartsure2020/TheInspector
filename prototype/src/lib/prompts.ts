// Canned client guidance, shared by both rooms so the assessor sees exactly the
// instruction the client is shown. Provider-agnostic: the `kind` values are the
// ones already carried by `RoomMessage` in `video/adapter.ts` — unchanged.
import type { IconName } from "@/components/ui/Icon";

export type PromptKind = "flip" | "torch" | "closer" | "further" | "slower" | "light" | "steady";

export interface GuidancePrompt {
  kind: PromptKind;
  /** Short label on the assessor's guidance toolbar. */
  staffLabel: string;
  /** Full sentence the client reads. */
  clientText: string;
  icon: IconName;
  /** Camera/torch prompts ask the client to operate their own controls. */
  group: "framing" | "device";
}

export const GUIDANCE: GuidancePrompt[] = [
  { kind: "closer", staffLabel: "Move closer", clientText: "Please move a little closer", icon: "search", group: "framing" },
  { kind: "further", staffLabel: "Step back", clientText: "Please step back a little", icon: "grid", group: "framing" },
  { kind: "slower", staffLabel: "Move slower", clientText: "Please move the camera more slowly", icon: "clock", group: "framing" },
  { kind: "steady", staffLabel: "Hold steady", clientText: "Please hold the camera steady for a moment", icon: "image", group: "framing" },
  { kind: "light", staffLabel: "More light", clientText: "Could you put a light on, or open a curtain?", icon: "torch", group: "framing" },
  { kind: "flip", staffLabel: "Flip camera", clientText: "Please switch to your back camera — use the “Flip camera” button at the bottom of your screen", icon: "cameraFlip", group: "device" },
  { kind: "torch", staffLabel: "Torch on", clientText: "Please switch your torch on — use the “Torch” button at the bottom of your screen", icon: "torch", group: "device" },
];

export const promptText = (kind: string): string | undefined =>
  GUIDANCE.find((g) => g.kind === kind)?.clientText;

export const promptLabel = (kind: string): string | undefined =>
  GUIDANCE.find((g) => g.kind === kind)?.staffLabel;
