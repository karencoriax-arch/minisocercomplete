import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_COOLDOWN_MS,
  FeedbackValidationError,
  buildFeedbackPayloadForVersion,
  createFeedbackContext,
  detectDeviceType,
  feedbackCooldownRemaining,
  validateFeedback,
} from "../app/feedback-core.ts";
import { GAME_VERSION } from "../app/version.ts";

const validForm = {
  rating: 5,
  category: "idea",
  message: "Prueba de integración de feedback",
  email: "",
  includeTechnicalInfo: false,
};

const menuContext = createFeedbackContext({ screen: "home", language: "es" });

test("acepta únicamente las seis categorías públicas exactas", () => {
  assert.deepEqual(FEEDBACK_CATEGORIES, ["bug", "idea", "gameplay", "controls", "tournaments", "other"]);
});

test("bloquea rating 0 y rating 6", () => {
  for (const rating of [0, 6]) {
    assert.ok(validateFeedback({ ...validForm, rating }).includes("RATING_REQUIRED"));
  }
});

test("bloquea mensaje vacío y superior a 2000 caracteres", () => {
  assert.ok(validateFeedback({ ...validForm, message: "" }).includes("MESSAGE_TOO_SHORT"));
  assert.ok(validateFeedback({ ...validForm, message: "x".repeat(2001) }).includes("MESSAGE_TOO_LONG"));
  assert.equal(validateFeedback(validForm).length, 0);
});

test("genera el payload exacto con GAME_VERSION y campos opcionales seguros", () => {
  const payload = buildFeedbackPayloadForVersion(validForm, menuContext, GAME_VERSION);
  assert.deepEqual(Object.keys(payload).sort(), [
    "category", "device", "difficulty", "email", "game_mode", "game_version", "language", "match_format", "message", "rating", "technical_info",
  ].sort());
  assert.equal(payload.game_version, GAME_VERSION);
  assert.equal(payload.game_mode, "menu");
  assert.equal(payload.match_format, null);
  assert.equal(payload.difficulty, null);
  assert.equal(payload.email, null);
  assert.deepEqual(payload.technical_info, {});
});

test("mapea contexto real de partido sin alterar los nombres de la UI", () => {
  const context = createFeedbackContext({ screen: "game", mode: "Champions", matchFormat: 6, difficulty: "Medio", language: "en", fps: 59.6, gameState: "PLAYING" });
  assert.deepEqual(context, { gameMode: "champions", matchFormat: "6v6", difficulty: "hard", language: "en", fps: 60, gameState: "PLAYING" });
});

test("el constructor rechaza datos inválidos antes de cualquier red", () => {
  assert.throws(() => buildFeedbackPayloadForVersion({ ...validForm, rating: 0 }, menuContext, GAME_VERSION), error => error instanceof FeedbackValidationError && error.codes.includes("RATING_REQUIRED"));
});

test("el cooldown dura 30 segundos por cliente", () => {
  assert.equal(FEEDBACK_COOLDOWN_MS, 30_000);
  assert.equal(feedbackCooldownRemaining(10_000, 25_000), 15_000);
  assert.equal(feedbackCooldownRemaining(10_000, 40_001), 0);
});

test("detecta dispositivo de forma aproximada y sin datos sensibles", () => {
  assert.equal(detectDeviceType("Mozilla/5.0 (iPhone; Mobile)", 390), "mobile");
  assert.equal(detectDeviceType("Mozilla/5.0 (iPad)", 820), "tablet");
  assert.equal(detectDeviceType("Mozilla/5.0 (X11; Linux x86_64)", 1440), "desktop");
});

test("el cliente ejecuta un INSERT sin SELECT ni credenciales privilegiadas", () => {
  const system = readFileSync(new URL("../app/feedback-system.ts", import.meta.url), "utf8");
  const client = readFileSync(new URL("../app/supabase-client.ts", import.meta.url), "utf8");
  const modal = readFileSync(new URL("../app/feedback-modal.tsx", import.meta.url), "utf8");
  assert.match(system, /from\("feedback"\)\.insert\(payload\)/);
  assert.doesNotMatch(system, /\.select\s*\(/);
  assert.doesNotMatch(`${system}\n${client}`, /service_role|database password|postgres password/i);
  assert.match(client, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(client, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(modal, /maxLength=\{2000\}/);
  assert.match(modal, /isSubmitting/);
});
