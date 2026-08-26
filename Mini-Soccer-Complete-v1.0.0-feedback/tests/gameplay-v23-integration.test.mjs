import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PASS_PHYSICS, PASS_TYPE_TUNING, PassSystem } from "../app/pass-system.ts";

const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");

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

test("rebotes usan física separada y el runtime final no conserva multiplicadores inline",()=>{
  assert.match(page,/resolveRebound/);
  assert.match(page,/postNormal/);
  assert.doesNotMatch(page,/b\.vy\*=-\.78/);
  assert.doesNotMatch(page,/b\.vx\*=-\.78/);
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

test("un toque cercano sigue suave y uno lejano recibe solo un piso útil por distancia",()=>{
  const system=new PassSystem(),bounds={left:46,right:1274,top:74,bottom:706};
  const make=(receiverX)=>{
    const passer={x:500,y:390,vx:0,vy:0,r:18,team:0,rating:86,role:"MED"},receiver={x:receiverX,y:390,vx:0,vy:0,r:18,team:0,rating:84,role:"DEL"};
    return system.plan({origin:{x:passer.x,y:passer.y},passer,players:[passer,receiver],teamStart:0,teamEnd:2,selectedReceiver:1,receiverLocked:true,confidence:1,userIntentDirection:{x:1,y:0},charge:.15,assist:"ASSISTED",format:3,fieldDiagonal:1514,bounds,pressure:0,receiverPressure:999,rng:()=>.5});
  };
  const nearby=make(620),distant=make(1000);
  assert.ok(nearby.userPowerModifier<.70,`el toque cercano quedó demasiado fuerte: ${nearby.userPowerModifier}`);
  assert.ok(distant.userPowerModifier>nearby.userPowerModifier+.15,`el pase lejano no recibió compensación suficiente: ${distant.userPowerModifier}`);
  assert.ok(distant.userPowerModifier<=.88,`el piso por distancia no debe convertir el toque en pase máximo: ${distant.userPowerModifier}`);
});

test("v2.3 conserva una sola acción SHOOT y no agrega controles obligatorios",()=>{
  assert.doesNotMatch(page,/SHOOT_PLACED|SHOOT_POWER|SHOOT_CHIP/);
});
