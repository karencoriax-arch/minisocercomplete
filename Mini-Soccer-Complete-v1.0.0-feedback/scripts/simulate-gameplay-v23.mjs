import assert from "node:assert/strict";
import { ShotSystem } from "../app/shot-system-v23.ts";
import { resolveRebound, reboundEnergyRatio } from "../app/ball-physics-v23.ts";
import { PassSystem, applyBallDrag, PASS_PHYSICS } from "../app/pass-system.ts";

let seed=230031;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const shotSystem=new ShotSystem(),passSystem=new PassSystem();
const shotCounts={PLACED:0,NORMAL:0,POWER:0,CHIP:0};
let shotScenarios=0,passScenarios=0,reboundScenarios=0,passArrivals=0,maxPassError=0,maxReboundEnergy=0;

for(let i=0;i<1600;i++){
  const role=["DEL","EXT","MED","DEF"][i%4],charge=(i%101)/100,keeperRush=(i%13)/12,pressure=(i%11)/10,distance=85+(i%110)*4.3;
  const plan=shotSystem.plan({player:{rating:72+(i%25),role,vx:(rng()-.5)*180,vy:(rng()-.5)*180},charge,distance,maximumUsefulDistance:620,lateralOffset:(rng()-.5)*520,fieldHalfHeight:410,bodyAlignment:rng()*2-1,pressure,goalkeeperCoverage:rng(),goalkeeperRush,targetY:420+(rng()-.5)*70,goalHalfHeight:54,rng});
  shotCounts[plan.type]++;shotScenarios++;
  assert.ok(Number.isFinite(plan.speed)&&Number.isFinite(plan.targetY)&&Number.isFinite(plan.quality));
  assert.ok(plan.speed>=400&&plan.speed<=825.001);
  assert.ok(plan.quality>=.05&&plan.quality<=.97);
  assert.ok(plan.preparationMs>=76&&plan.preparationMs<=205);
  if(plan.type==="CHIP")assert.ok(keeperRush>=.72&&charge>=.22&&charge<=.68&&pressure<.82);
}
for(const type of ["PLACED","NORMAL","POWER"])assert.ok(shotCounts[type]>250,`${type} casi no aparece`);
assert.ok(shotCounts.CHIP>20&&shotCounts.CHIP<300,`vaselinas fuera de rango contextual: ${shotCounts.CHIP}`);

const mkPlayer=(x,y,team=0,rating=88,role="MED",vx=0,vy=0)=>({x,y,vx,vy,r:18,team,rating,role});
for(const format of [3,4]){
  const diagonal=format===3?1514:1719,bounds={left:46,right:format===3?1274:1466,top:74,bottom:format===3?706:787};
  for(let i=0;i<800;i++){
    const angle=(i%24)/24*Math.PI*2,distance=85+(i%32)*15.5,passer=mkPlayer(660,420,0,78+(i%20),i%3===0?"MED":"DEL",(rng()-.5)*120,(rng()-.5)*120),receiver=mkPlayer(660+Math.cos(angle)*distance,420+Math.sin(angle)*distance,0,76+(i%22),i%2?"DEL":"MED",(rng()-.5)*150,(rng()-.5)*150),opponent=mkPlayer(900,700,1,86,"DEF");
    const plan=passSystem.plan({origin:{x:passer.x,y:passer.y},passer,players:[passer,receiver,opponent],teamStart:0,teamEnd:2,selectedReceiver:1,receiverLocked:true,confidence:1,userIntentDirection:{x:Math.cos(angle),y:Math.sin(angle)},charge:.15+(i%70)/100,assist:"ASSISTED",format,fieldDiagonal:diagonal,bounds,pressure:(i%9)/12,receiverPressure:120+(i%5)*35,through:i%7===0,rng:()=>.5});
    passScenarios++;
    const initialSpeed=Math.hypot(plan.initialVelocity.x,plan.initialVelocity.y);
    assert.ok(Number.isFinite(initialSpeed)&&Number.isFinite(plan.desiredArrivalTime));
    assert.ok(initialSpeed<=PASS_PHYSICS.maximumSpeed[format]*1.081);
    const fps=[30,60,120][i%3],dt=1/fps,ball={x:plan.origin.x,y:plan.origin.y,vx:plan.initialVelocity.x,vy:plan.initialVelocity.y};let elapsed=0,closest=Infinity;
    while(elapsed<Math.min(2.1,plan.desiredArrivalTime+.25)){
      const step=Math.min(dt,Math.min(2.1,plan.desiredArrivalTime+.25)-elapsed);ball.x+=ball.vx*step;ball.y+=ball.vy*step;const next=applyBallDrag({x:ball.vx,y:ball.vy},step);ball.vx=next.x;ball.vy=next.y;closest=Math.min(closest,Math.hypot(ball.x-plan.targetPoint.x,ball.y-plan.targetPoint.y));elapsed+=step;
    }
    maxPassError=Math.max(maxPassError,closest);if(closest<34)passArrivals++;
  }
}
assert.ok(passArrivals/passScenarios>=.965,`solo ${(passArrivals/passScenarios*100).toFixed(1)}% de pases llegaron a zona controlable; error máx ${maxPassError.toFixed(1)}`);

for(let i=0;i<800;i++){
  const kind=["SIDELINE","POST","GOAL_FRAME"][i%3],speed=60+rng()*820,angle=rng()*Math.PI*2,normalAngle=rng()*Math.PI*2,normal={x:Math.cos(normalAngle),y:Math.sin(normalAngle)},raw={x:Math.cos(angle)*speed,y:Math.sin(angle)*speed},dot=raw.x*normal.x+raw.y*normal.y,before=dot<0?raw:{x:raw.x-2*dot*normal.x,y:raw.y-2*dot*normal.y},after=resolveRebound(before,normal,kind),ratio=reboundEnergyRatio(before,after);
  reboundScenarios++;maxReboundEnergy=Math.max(maxReboundEnergy,ratio);assert.ok(Number.isFinite(after.x)&&Number.isFinite(after.y));assert.ok(ratio<.986);
}

console.log(JSON.stringify({totalScenarios:shotScenarios+passScenarios+reboundScenarios,shotScenarios,shotCounts,passScenarios,passArrivals,passArrivalRate:Number((passArrivals/passScenarios*100).toFixed(2)),maxPassError:Number(maxPassError.toFixed(2)),reboundScenarios,maxReboundEnergy:Number(maxReboundEnergy.toFixed(4)),nanValues:0,energyGainRebounds:0},null,2));
