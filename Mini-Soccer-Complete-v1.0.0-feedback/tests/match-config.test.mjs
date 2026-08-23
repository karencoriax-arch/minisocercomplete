import test from "node:test";
import assert from "node:assert/strict";
import {MATCH_FORMATS,PUBLIC_FORMATS,formatRoles,scaledSpacing} from "../app/match-config.ts";

test("el producto público ofrece exclusivamente 4v4, 5v5 y 6v6",()=>assert.deepEqual(PUBLIC_FORMATS,[4,5,6]));

test("cada formato incluye exactamente un arquero dentro del total",()=>{
  for(const format of PUBLIC_FORMATS){const roles=formatRoles(format);assert.equal(roles.length,format);assert.equal(roles.filter(role=>role==="ARQ").length,1)}
});

test("5v5 es el estándar recomendado y las canchas escalan progresivamente",()=>{
  assert.equal(MATCH_FORMATS[5].recommended,true);assert.ok(MATCH_FORMATS[4].pitchWidth<MATCH_FORMATS[5].pitchWidth&&MATCH_FORMATS[5].pitchWidth<MATCH_FORMATS[6].pitchWidth);
});

test("el espaciado táctico se calcula desde el ancho real de la cancha",()=>{
  const four=scaledSpacing(4,MATCH_FORMATS[4].pitchWidth),six=scaledSpacing(6,MATCH_FORMATS[6].pitchWidth);assert.ok(four.minimum>100&&six.minimum>four.minimum);assert.ok(six.support>six.minimum);
});
