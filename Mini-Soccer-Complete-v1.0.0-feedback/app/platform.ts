export type RuntimePlatform = "desktop" | "mobile";

export type PlatformSignals = {
  finePointer: boolean;
  hover: boolean;
  coarsePointer: boolean;
  noHover: boolean;
  touchPoints: number;
};

export function detectPlatform(signals: PlatformSignals): RuntimePlatform {
  // Hybrid laptops that have a real mouse/trackpad stay in desktop mode even
  // if the panel is touch-capable. Phones/tablets without a fine hover pointer
  // use the mobile runtime.
  if (signals.finePointer && signals.hover) return "desktop";
  if (signals.coarsePointer || signals.noHover || signals.touchPoints > 0) return "mobile";
  return "desktop";
}

export function runtimePlatform(): RuntimePlatform {
  if (typeof window === "undefined") return "desktop";
  return detectPlatform({
    finePointer: window.matchMedia("(pointer:fine)").matches,
    hover: window.matchMedia("(hover:hover)").matches,
    coarsePointer: window.matchMedia("(pointer:coarse)").matches,
    noHover: window.matchMedia("(hover:none)").matches,
    touchPoints: navigator.maxTouchPoints || 0,
  });
}

export const isMobilePlatform = () => runtimePlatform() === "mobile";
