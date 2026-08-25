import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GAME_TITLE, GAME_VERSION, INITIAL_RELEASE } from "../app/version.ts";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const settings = readFileSync(new URL("../app/settings-menu.tsx", import.meta.url), "utf8");

test("v2.0.1 mantiene la versión centralizada", () => {
  assert.equal(GAME_TITLE, "Mini Soccer Complete");
  assert.equal(GAME_VERSION, "2.0.1");
  assert.doesNotMatch(page, /["'`]2\.0\.1["'`]/);
  assert.doesNotMatch(settings, /["'`]2\.0\.1["'`]/);
});

test("inicio, carga y configuración leen la constante global", () => {
  assert.match(page, /boot-mark[\s\S]*GAME_VERSION/);
  assert.match(page, /home-version-mark[\s\S]*GAME_VERSION/);
  assert.match(settings, /category === "ABOUT"/);
  assert.match(settings, /NOVEDADES/);
  assert.match(settings, /INITIAL_RELEASE/);
});

test("la actualización conserva todas las áreas estructurales", () => {
  assert.deepEqual(INITIAL_RELEASE.sections.map(section => section.title[0]), ["Gameplay", "Competiciones", "Personalización", "Configuración", "Presentación"]);
  assert.equal(INITIAL_RELEASE.sections.reduce((total, section) => total + section.items.length, 0), 44);
});
