import { type VideoSettings } from "./types";

export const SPEED_MODES = ["off", "fixed", "ramp"] as const;

export type SpeedMode = (typeof SPEED_MODES)[number];

export function speedModeOf(
  settings: Pick<VideoSettings, "constEnabled" | "speedEnabled">,
): SpeedMode {
  if (settings.constEnabled) return "fixed";
  if (settings.speedEnabled) return "ramp";
  return "off";
}

export function speedModeFlags(
  mode: SpeedMode,
): Pick<VideoSettings, "constEnabled" | "speedEnabled"> {
  return { constEnabled: mode === "fixed", speedEnabled: mode === "ramp" };
}

export const isSpeedMode = (value: string): value is SpeedMode =>
  (SPEED_MODES as readonly string[]).includes(value);
