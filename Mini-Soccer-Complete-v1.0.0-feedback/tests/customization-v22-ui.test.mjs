import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui=readFileSync(new URL("../app/customization-v22-ui.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/customization-v22.css",import.meta.url),"utf8");
const transform=readFileSync(new URL("../scripts/v22-store-transform.mjs",import.meta.url),"utf8");

const categories=["KIT","BALL","TRAIL","GOAL_EFFECT","CELEBRATION","HUD_THEME"];

test("Tienda 2.0 expone exactamente las seis familias cosméticas previstas",()=>{
  for(const category of categories)assert.match(ui,new RegExp(`id:\"${category}\"`));
  assert.match(ui,/SOLO COSMÉTICO/);
  assert.match(ui,/nunca mejora velocidad, pase, tiro, defensa ni IA/);
});

test("la tienda tiene contratos responsive para escritorio, tablet y celular",()=>{
  assert.match(css,/\.v22-grid\{display:grid/);
  assert.match(css,/@media\(max-width:1050px\)/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/@media\(max-width:470px\)/);
});

test("camisetas nacionales y MSC son mutuamente exclusivas",()=>{
  assert.match(ui,/item\.category===\"KIT\"&&!active&&economy\.equippedKitId!==null/);
  assert.match(ui,/equippedKitId:null/);
  assert.match(transform,/onNationalKitEquip/);
  assert.match(transform,/if\(!equipped\)onNationalKitEquip\(\)/);
});

test("temas HUD modifican la paleta real de la interfaz y no solo su preview",()=>{
  assert.match(transform,/\"--lime\":hudTheme\?\.preview\.secondary/);
  assert.match(transform,/\"--panel\":hudTheme\?\.preview\.primary/);
  assert.match(transform,/hud-theme-/);
});

test("los cosméticos visuales están conectados al gameplay sin modificar motores físicos",()=>{
  assert.match(transform,/cosmeticBall\?\.preview\.primary/);
  assert.match(transform,/cosmeticTrail\.preview\.primary/);
  assert.match(transform,/GameplayCosmeticLayer/);
  assert.doesNotMatch(ui,/DIFFICULTY_PROFILES|PassSystem|applyBallDrag|goalkeeperSaveOutcome/);
});
