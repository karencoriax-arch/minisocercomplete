import type { SettingsState } from "./game-state";

export const GRAPHICS_PRESETS: Record<Exclude<SettingsState["graphics"]["preset"], "CUSTOM">, Omit<SettingsState["graphics"], "preset">> = {
  VERY_LOW: { renderScale: 50, fpsLimit: 30, vsync: false, showFps: false, performanceMode: true, particles: "LOW", crowdDetail: "LOW", fieldDetail: "LOW", lighting: "LOW", playerShadows: false, antiAliasing: false },
  LOW: { renderScale: 60, fpsLimit: 60, vsync: true, showFps: false, performanceMode: true, particles: "LOW", crowdDetail: "LOW", fieldDetail: "LOW", lighting: "LOW", playerShadows: false, antiAliasing: false },
  MEDIUM: { renderScale: 75, fpsLimit: 60, vsync: true, showFps: false, performanceMode: false, particles: "MEDIUM", crowdDetail: "MEDIUM", fieldDetail: "MEDIUM", lighting: "MEDIUM", playerShadows: true, antiAliasing: true },
  HIGH: { renderScale: 100, fpsLimit: 60, vsync: true, showFps: false, performanceMode: false, particles: "HIGH", crowdDetail: "HIGH", fieldDetail: "HIGH", lighting: "HIGH", playerShadows: true, antiAliasing: true },
  ULTRA: { renderScale: 100, fpsLimit: 120, vsync: true, showFps: false, performanceMode: false, particles: "HIGH", crowdDetail: "HIGH", fieldDetail: "HIGH", lighting: "HIGH", playerShadows: true, antiAliasing: true },
};

export function applyGraphicsPreset(settings: SettingsState, preset: SettingsState["graphics"]["preset"]): SettingsState {
  if (preset === "CUSTOM") return { ...settings, graphics: { ...settings.graphics, preset } };
  return { ...settings, graphics: { preset, ...GRAPHICS_PRESETS[preset] } };
}
