import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS } from "../app/game-state.ts";
import { applyGraphicsPreset } from "../app/graphics-settings.ts";

test("los presets cambian calidad/rendimiento sin tocar gameplay ni controles", () => {
  const source = structuredClone(DEFAULT_SETTINGS);
  const low = applyGraphicsPreset(source, "LOW");
  const ultra = applyGraphicsPreset(source, "ULTRA");
  assert.notDeepEqual(low.graphics, ultra.graphics);
  assert.equal(low.graphics.renderScale, 60);
  assert.equal(ultra.graphics.renderScale, 100);
  assert.deepEqual(low.gameplay, source.gameplay);
  assert.deepEqual(ultra.gameplay, source.gameplay);
  assert.deepEqual(low.controls, source.controls);
  assert.deepEqual(ultra.controls, source.controls);
});
