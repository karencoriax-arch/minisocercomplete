export const FEEDBACK_CATEGORIES = ["bug", "idea", "gameplay", "controls", "tournaments", "other"] as const;
export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];
export type FeedbackGameMode = "quick_match" | "champions" | "libertadores" | "world_cup" | "europa_league" | "season" | "career" | "menu";
export type FeedbackMatchFormat = "4v4" | "5v5" | "6v6";
export type FeedbackDifficulty = "easy" | "normal" | "hard" | "professional" | "world_class";
export type FeedbackDevice = "mobile" | "tablet" | "desktop";
export type FeedbackValidationCode = "RATING_REQUIRED" | "CATEGORY_REQUIRED" | "MESSAGE_TOO_SHORT" | "MESSAGE_TOO_LONG" | "EMAIL_INVALID";

export const FEEDBACK_COOLDOWN_MS = 30_000;
export const FEEDBACK_COOLDOWN_KEY = "msc_last_feedback_time";

export type FeedbackFormData = {
  rating: number;
  category: FeedbackCategory | null;
  message: string;
  email: string;
  includeTechnicalInfo: boolean;
};

export type FeedbackContext = {
  gameMode: FeedbackGameMode | null;
  matchFormat: FeedbackMatchFormat | null;
  difficulty: FeedbackDifficulty | null;
  language: "es" | "en";
  fps: number | null;
  gameState: string | null;
};

export type FeedbackPayload = {
  rating: number;
  category: FeedbackCategory;
  message: string;
  email: string | null;
  game_version: string;
  game_mode: FeedbackGameMode | null;
  match_format: FeedbackMatchFormat | null;
  difficulty: FeedbackDifficulty | null;
  device: FeedbackDevice;
  language: "es" | "en";
  technical_info: Record<string, string | number | null>;
};

const MODE_MAP: Record<string, FeedbackGameMode> = {
  Amistoso: "quick_match",
  Champions: "champions",
  Libertadores: "libertadores",
  Mundial: "world_cup",
  "Europa League": "europa_league",
  Temporada: "season",
  Carrera: "career",
};

const DIFFICULTY_MAP: Record<string, FeedbackDifficulty> = {
  "Fácil": "easy",
  Normal: "normal",
  Medio: "hard",
  "Difícil": "hard",
  Profesional: "professional",
  "Pro Mundial": "world_class",
};

const CONTEXTUAL_SCREENS = new Set(["cupSetup", "tournament", "setup", "squad", "game", "result"]);

export function mapGameModeForDatabase(mode: string | null | undefined): FeedbackGameMode | null {
  if (!mode) return null;
  return MODE_MAP[mode] ?? null;
}

export function mapDifficultyForDatabase(difficulty: string | null | undefined): FeedbackDifficulty | null {
  if (!difficulty) return null;
  return DIFFICULTY_MAP[difficulty] ?? null;
}

export function createFeedbackContext(input: {
  screen: string;
  mode?: string | null;
  matchFormat?: number | null;
  difficulty?: string | null;
  language: "es" | "en";
  fps?: number | null;
  gameState?: string | null;
}): FeedbackContext {
  const hasMatchContext = CONTEXTUAL_SCREENS.has(input.screen);
  const format = hasMatchContext && [4, 5, 6].includes(input.matchFormat ?? 0)
    ? `${input.matchFormat}v${input.matchFormat}` as FeedbackMatchFormat
    : null;

  return {
    gameMode: hasMatchContext ? mapGameModeForDatabase(input.mode) : "menu",
    matchFormat: format,
    difficulty: hasMatchContext ? mapDifficultyForDatabase(input.difficulty) : null,
    language: input.language,
    fps: Number.isFinite(input.fps) ? Math.max(0, Math.round(input.fps ?? 0)) : null,
    gameState: input.gameState?.slice(0, 64) || input.screen.slice(0, 64) || null,
  };
}

export function validateFeedback(formData: FeedbackFormData): FeedbackValidationCode[] {
  const errors: FeedbackValidationCode[] = [];
  const message = formData.message.trim();
  const email = formData.email.trim();
  if (!Number.isInteger(formData.rating) || formData.rating < 1 || formData.rating > 5) errors.push("RATING_REQUIRED");
  if (!formData.category || !FEEDBACK_CATEGORIES.includes(formData.category)) errors.push("CATEGORY_REQUIRED");
  if (message.length < 3) errors.push("MESSAGE_TOO_SHORT");
  if (message.length > 2000) errors.push("MESSAGE_TOO_LONG");
  if (email && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.push("EMAIL_INVALID");
  return errors;
}

export function feedbackCooldownRemaining(lastSubmittedAt: number, now = Date.now()): number {
  if (!Number.isFinite(lastSubmittedAt) || lastSubmittedAt <= 0) return 0;
  return Math.max(0, FEEDBACK_COOLDOWN_MS - (now - lastSubmittedAt));
}

export function detectDeviceType(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent, viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth): FeedbackDevice {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (viewportWidth >= 650 && viewportWidth <= 1024 && /Android|Mobile/i.test(userAgent))) return "tablet";
  if (/Android|iPhone|iPod|Mobile/i.test(userAgent) || viewportWidth < 650) return "mobile";
  return "desktop";
}

export function getBrowserName(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent): string | null {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  return userAgent ? "Other" : null;
}

export function buildTechnicalInfo(context: FeedbackContext): Record<string, string | number | null> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { fps: context.fps, browser: null, platform: null, screen_width: null, screen_height: null, game_state: context.gameState };
  }
  return {
    fps: context.fps,
    browser: getBrowserName(),
    platform: navigator.platform || null,
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    game_state: context.gameState,
  };
}

export class FeedbackValidationError extends Error {
  readonly codes: FeedbackValidationCode[];

  constructor(codes: FeedbackValidationCode[]) {
    super("Invalid feedback payload");
    this.name = "FeedbackValidationError";
    this.codes = codes;
  }
}

export function buildFeedbackPayloadForVersion(formData: FeedbackFormData, context: FeedbackContext, gameVersion: string): FeedbackPayload {
  const errors = validateFeedback(formData);
  if (errors.length) throw new FeedbackValidationError(errors);
  return {
    rating: formData.rating,
    category: formData.category as FeedbackCategory,
    message: formData.message.trim(),
    email: formData.email.trim() || null,
    game_version: gameVersion,
    game_mode: context.gameMode,
    match_format: context.matchFormat,
    difficulty: context.difficulty,
    device: detectDeviceType(),
    language: context.language,
    technical_info: formData.includeTechnicalInfo ? buildTechnicalInfo(context) : {},
  };
}
