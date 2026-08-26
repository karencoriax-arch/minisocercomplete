import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PASS_PHYSICS, PASS_TYPE_TUNING } from "../app/pass-system.ts";

const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const transform=readFileSync(new URL("../scripts/v23-gameplay-transform.mjs",import.meta.url),"utf8");

test("v2.3 conecta ShotSystem al jugador y a la IA",()=>{
  assert.match(page,/MSC_V23_GAMEPLAY/);
  assert.match(page,/shotEngine=useRef\(new ShotSystem\(\)\)/);
  assert.match(page,/shotPlan=shotEngine\.current\.plan/);
  assert.match(page,/shotType:shotPlan\.type/);
  assert.match(page,/dataset\.shotType/);
});

test("la vaselina tiene ventana aérea pero el arquero sigue pudiendo intervenir",()=>{
  assert.match(page,/activeShotFlight\.current\?\.type===?\"CHIP\"/);
  assert.match(page,/p\.role!==\"ARQ\"/);
  assert.match(page,/airborneUntil/);
});

test("rebotes usan física separada y dejan de multiplicar velocidad por constantes inline",()=>{
  assert.match(page,/resolveRebound/);
  assert.match(page,/postNormal/);
  assert.doesNotMatch(transform,/b\.vy\*=-\.78/);
  assert.doesNotMatch(transform,/b\.vx\*=-\.78/);
});

test("pases públicos tienen parámetros válidos para 3v3 y 4v4",()=>{
  for(const format of [3,4]){
    assert.ok(Number.isFinite(PASS_PHYSICS.minimumSpeed[format]));
    assert.ok(Number.isFinite(PASS_PHYSICS.maximumSpeed[format]));
    assert.ok(Number.isFinite(PASS_PHYSICS.maximumLeadDistance[format]));
  }
  assert.ok(PASS_TYPE_TUNING.SHORT.speed<PASS_TYPE_TUNING.MEDIUM.speed);
  assert.ok(PASS_TYPE_TUNING.SHORT.angular<PASS_TYPE_TUNING.LONG.angular);
});

test("v2.3 conserva una sola acción SHOOT y no agrega controles obligatorios",()=>{
  assert.doesNotMatch(page,/SHOOT_PLACED|SHOOT_POWER|SHOOT_CHIP/);
});
