import test from "node:test";
import assert from "node:assert/strict";
import {MATCH_FORMATS,PUBLIC_FORMATS,formatRoles,scaledSpacing} from "../app/match-config.ts";

test("la versión móvil ofrece exclusivamente 3v3 y 4v4",()=>assert.deepEqual(PUBLIC_FORMATS,[3,4]));

test("cada formato móvil incluye exactamente un arquero dentro del total",()=>{
  for(const format of PUBLIC_FORMATS){const roles=formatRoles(format);assert.equal(roles.length,format);assert.equal(roles.filter(role=>role==="ARQ").length,1)}
});

test("3v3 es el formato móvil recomendado y 4v4 conserva una cancha mayor",()=>{
  assert.equal(MATCH_FORMATS[3].recommended,true);assert.ok(MATCH_FORMATS[3].pitchWidth<MATCH_FORMATS[4].pitchWidth);
});

test("el espaciado táctico se calcula desde el ancho real de cada cancha móvil",()=>{
  const three=scaledSpacing(3,MATCH_FORMATS[3].pitchWidth),four=scaledSpacing(4,MATCH_FORMATS[4].pitchWidth);assert.ok(three.minimum>100&&four.minimum>100);assert.ok(three.support>three.minimum&&four.support>four.minimum);
});
