import test from "node:test";
import assert from "node:assert/strict";
import { REBOUND_TUNING, reboundEnergyRatio, resolveRebound } from "../app/ball-physics-v23.ts";

test("un rebote invierte solo la componente normal",()=>{
  const next=resolveRebound({x:420,y:-160},{x:0,y:1},"SIDELINE");
  assert.ok(next.y>0);
  assert.ok(next.x>0);
  assert.ok(Math.abs(next.x)<420);
});

test("los postes son más elásticos que las bandas sin generar energía",()=>{
  const before={x:-620,y:120};
  const wall=resolveRebound(before,{x:1,y:0},"SIDELINE"),post=resolveRebound(before,{x:1,y:0},"POST");
  assert.ok(Math.hypot(post.x,post.y)>Math.hypot(wall.x,wall.y));
  assert.ok(reboundEnergyRatio(before,post)<1);
  assert.ok(reboundEnergyRatio(before,wall)<1);
});

test("si la pelota ya se aleja de la superficie no se rebota dos veces",()=>{
  const before={x:240,y:80};
  assert.deepEqual(resolveRebound(before,{x:1,y:0},"POST"),before);
});

test("1000 rebotes aleatorios permanecen estables y acotados",()=>{
  let seed=2317;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<1000;i++){
    const speed=40+rng()*900,angle=rng()*Math.PI*2,normalAngle=rng()*Math.PI*2,before={x:Math.cos(angle)*speed,y:Math.sin(angle)*speed},normal={x:Math.cos(normalAngle),y:Math.sin(normalAngle)};
    const dot=before.x*normal.x+before.y*normal.y;
    const incoming=dot<0?before:{x:before.x-2*dot*normal.x,y:before.y-2*dot*normal.y};
    const kind=["SIDELINE","POST","GOAL_FRAME"][i%3],after=resolveRebound(incoming,normal,kind);
    assert.ok(Number.isFinite(after.x)&&Number.isFinite(after.y));
    assert.ok(Math.hypot(after.x,after.y)<=Math.hypot(incoming.x,incoming.y)*.986+.01);
    assert.ok(REBOUND_TUNING[kind].normal>0&&REBOUND_TUNING[kind].normal<1);
  }
});
