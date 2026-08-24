import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("Next layout conserva metadata web y móvil requerida", () => {
  assert.match(layout, /title:\s*["']Mini Soccer Complete["']/);
  assert.match(layout, /applicationName:\s*["']Mini Soccer Complete["']/);
  assert.match(layout, /manifest:\s*["']\/manifest\.webmanifest["']/);
  assert.match(layout, /["']codex-preview["']:\s*["']development["']/);
  assert.match(layout, /["']mobile-web-app-capable["']:\s*["']yes["']/);
  assert.match(layout, /viewportFit:\s*["']cover["']/);
  assert.match(layout, /userScalable:\s*false/);
});
