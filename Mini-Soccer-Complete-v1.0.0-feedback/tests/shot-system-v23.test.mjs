import test from "node:test";
import assert from "node:assert/strict";
import { ShotSystem, SHOT_TUNING, deriveShotAttributes, resolveShotType } from "../app/shot-system-v23.ts";

const player=(rating=88,role="DEL")=>({rating,role,vx:0,vy:0});
const base=(overrides={})=>({player:player(),charge:.52,distance:260,maximumUsefulDistance:620,lateralOffset:0,fieldHalfHeight:400,bodyAlignment:.8,pressure:.15,goalkeeperCoverage:.35,goalkeeperRush:.15,targetY:420,goalHalfHeight:54,rng:()=>.5,...overrides});

test("carga corta, media y larga producen colocado, normal y potente",()=>{
  assert.equal(resolveShotType({charge:.2,distance:260,maximumUsefulDistance:620,goalkeeperRush:.1,pressure:.2}),"PLACED");
  assert.equal(resolveShotType({charge:.55,distance:260,maximumUsefulDistance:620,goalkeeperRush:.1,pressure:.2}),"NORMAL");
  assert.equal(resolveShotType({charge:.9,distance:260,maximumUsefulDistance:620,goalkeeperRush:.1,pressure:.2}),"POWER");
});

test("la vaselina solo aparece con arquero adelantado y contexto razonable",()=>{
  assert.equal(resolveShotType({charge:.46,distance:220,maximumUsefulDistance:620,goalkeeperRush:.82,pressure:.25}),"CHIP");
  assert.notEqual(resolveShotType({charge:.46,distance:220,maximumUsefulDistance:620,goalkeeperRush:.35,pressure:.25}),"CHIP");
  assert.notEqual(resolveShotType({charge:.46,distance:220,maximumUsefulDistance:620,goalkeeperRush:.9,pressure:.95}),"CHIP");
  assert.notEqual(resolveShotType({charge:.9,distance:220,maximumUsefulDistance:620,goalkeeperRush:.9,pressure:.25}),"CHIP");
});

test("los atributos distinguen delanteros, mediocampistas, defensores y arqueros",()=>{
  const striker=deriveShotAttributes(player(88,"DEL")),mid=deriveShotAttributes(player(88,"MED")),def=deriveShotAttributes(player(88,"DEF")),keeper=deriveShotAttributes(player(88,"ARQ"));
  assert.ok(striker.finishing>mid.finishing&&mid.finishing>def.finishing&&def.finishing>keeper.finishing);
  assert.ok(mid.technique>def.technique);
  assert.ok(striker.shotPower>=mid.shotPower);
});

test("el colocado prioriza precisión y el potente velocidad",()=>{
  const system=new ShotSystem();
  const placed=system.plan(base({charge:.2,rng:(()=>{let x=0;return()=>x++%2?1:.9})()}));
  const normal=system.plan(base({charge:.55,rng:(()=>{let x=0;return()=>x++%2?1:.9})()}));
  const power=system.plan(base({charge:.92,rng:(()=>{let x=0;return()=>x++%2?1:.9})()}));
  assert.equal(placed.type,"PLACED");assert.equal(normal.type,"NORMAL");assert.equal(power.type,"POWER");
  assert.ok(placed.speed<normal.speed&&normal.speed<power.speed);
  assert.ok(Math.abs(placed.targetY-420)<Math.abs(power.targetY-420));
  assert.ok(placed.accuracyScale<power.accuracyScale);
});

test("ningún tipo rompe sus límites físicos",()=>{
  const system=new ShotSystem();
  for(const type of ["PLACED","NORMAL","POWER","CHIP"]){
    for(let i=0;i<100;i++){
      let seed=i*17+3;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
      const plan=system.plan(base({preferredType:type,charge:i/99,distance:80+i*5.2,pressure:(i%10)/10,goalkeeperRush:(i%7)/6,rng}));
      assert.ok(plan.speed>=SHOT_TUNING[type].minSpeed-1e-6&&plan.speed<=SHOT_TUNING[type].maxSpeed+1e-6);
      assert.ok(plan.quality>=.05&&plan.quality<=.97);
      assert.ok(plan.preparationMs>=76&&plan.preparationMs<=205);
      if(type==="CHIP")assert.ok(plan.airborneMs>=190&&plan.airborneMs<=360);else assert.equal(plan.airborneMs,0);
    }
  }
});
