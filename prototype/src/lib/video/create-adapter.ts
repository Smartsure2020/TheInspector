import type { SessionAdapter } from "./adapter";

export type AdapterType = "p2p" | "livekit" | "daily";

function resolveAdapterType(): AdapterType {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("adapter");
    if (fromUrl === "livekit" || fromUrl === "daily" || fromUrl === "p2p") return fromUrl;
  }
  const env = process.env.NEXT_PUBLIC_VIDEO_ADAPTER;
  if (env === "livekit" || env === "daily" || env === "p2p") return env;
  return "p2p";
}

export function getAdapterType(): AdapterType {
  return resolveAdapterType();
}

export async function createAdapter(): Promise<SessionAdapter> {
  const type = resolveAdapterType();
  switch (type) {
    case "livekit": {
      const { LiveKitAdapter } = await import("./livekit-adapter");
      return new LiveKitAdapter();
    }
    case "daily": {
      const { DailyAdapter } = await import("./daily-adapter");
      return new DailyAdapter();
    }
    default: {
      const { P2PAdapter } = await import("./p2p-adapter");
      return new P2PAdapter();
    }
  }
}
