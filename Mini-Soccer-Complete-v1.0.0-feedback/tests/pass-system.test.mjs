import test from "node:test";
import assert from "node:assert/strict";
import {
  applyBallDrag,
  BallKickPhysics,
  derivePassAttributes,
  PassIntentResolver,
  PassInterceptionSystem,
  PassPowerCalculator,
  PassSystem,
  PassTrajectoryPlanner,
  ReceptionSystem,
  passDebugEnabled,
} from "../app/pass-system.ts";

const player=(x,y,{vx=0,vy=0,team=0,rating=90,role="MED"}={})=>({x,y,vx,vy,r:18,team,rating,role});
const bounds={left:0,right:1640,top:0,bottom:860};
const normalCharge=(1-.86)/.30;

function planPass({receiver=player(420,300),passer=player(120,300),format=5,charge=normalCharge,through=false,assist="ASSISTED",pressure=0,rng=()=>.5,direction={x:1,y:0},fieldDiagonal=1800}={}){
  const players=[passer,receiver,player(760,620,{team:1,role:"DEF",rating:86})];
  return new PassSystem().plan({origin:{x:passer.x,y:passer.y},passer,players,teamStart:0,teamEnd:2,selectedReceiver:assist==="MANUAL"?null:1,receiverLocked:assist!=="MANUAL",confidence:1,userIntentDirection:direction,charge,assist,format,fieldDiagonal,bounds,pressure,receiverPressure:999,through,rng});
}

function simulate(plan,fps){
  const dt=1/fps,ball={x:plan.origin.x,y:plan.origin.y,vx:plan.initialVelocity.x,vy:plan.initialVelocity.y};
  let elapsed=0,closest=Infinity;
  while(elapsed<plan.desiredArrivalTime+.04){
    const step=Math.min(dt,plan.desiredArrivalTime-elapsed);
    if(step<=0)break;
    ball.x+=ball.vx*step;ball.y+=ball.vy*step;
    const next=applyBallDrag({x:ball.vx,y:ball.vy},step);ball.vx=next.x;ball.vy=next.y;
    closest=Math.min(closest,Math.hypot(ball.x-plan.targetPoint.x,ball.y-plan.targetPoint.y));elapsed+=step;
  }
  return{ball,closest};
}

test("el sistema está separado en los siete módulos físicos",()=>{
  const system=new PassSystem();
  assert.ok(system.intentResolver instanceof PassIntentResolver);
  assert.ok(system.trajectoryPlanner instanceof PassTrajectoryPlanner);
  assert.ok(system.powerCalculator instanceof PassPowerCalculator);
  assert.ok(system.ballKickPhysics instanceof BallKickPhysics);
  assert.ok(system.interceptionSystem instanceof PassInterceptionSystem);
  assert.ok(system.receptionSystem instanceof ReceptionSystem);
});

test("100 pases entre jugadores quietos llegan de forma consistente al punto previsto",()=>{
  let understandable=0;
  for(let index=0;index<100;index++){
    const distance=95+(index%20)*19,angle=(index%8)*Math.PI/4,passer=player(700,420),receiver=player(700+Math.cos(angle)*distance,420+Math.sin(angle)*distance),plan=planPass({passer,receiver,fieldDiagonal:1900});
    if(simulate(plan,60).closest<18)understandable++;
  }
  assert.ok(understandable>=95,`${understandable}/100 pases resultaron físicamente previsibles`);
});

test("el movimiento del pasador solo transfiere una fracción limitada",()=>{
  const passer=player(500,620,{vx:180,vy:0}),receiver=player(500,260),plan=planPass({passer,receiver,direction:{x:0,y:-1}});
  assert.ok(plan.initialVelocity.y<0);
  assert.ok(Math.abs(plan.initialVelocity.x/plan.initialVelocity.y)<.09,"correr lateralmente no debe deformar el pase vertical");
});

test("el lead dinámico diferencia quieto, alejándose, lateral y acercándose",()=>{
  const still=planPass({receiver:player(500,300)}),away=planPass({receiver:player(500,300,{vx:155})}),lateral=planPass({receiver:player(500,300,{vy:155})}),toward=planPass({receiver:player(500,300,{vx:-155})});
  assert.equal(still.leadTime,0);
  assert.ok(away.leadTime>lateral.leadTime&&lateral.leadTime>toward.leadTime);
  assert.ok(toward.leadDistance<10,"el receptor que se acerca debe recibir prácticamente al pie");
  assert.ok(away.leadDistance<=108.01,"el lead de 5v5 debe respetar su límite");
});

test("la potencia crece con la distancia sin convertir un pase corto en un disparo",()=>{
  const short=planPass({receiver:player(220,300)}),medium=planPass({receiver:player(520,300)}),long=planPass({receiver:player(760,300)});
  const speed=plan=>Math.hypot(plan.initialVelocity.x,plan.initialVelocity.y);
  assert.equal(short.passType,"SHORT");assert.equal(medium.passType,"MEDIUM");assert.equal(long.passType,"LONG");
  assert.ok(speed(short)<speed(medium)&&speed(medium)<speed(long));
  assert.ok(speed(short)<470,"un pase de 100 px debe salir controlado");
});

test("toque, pulsación normal y mantener modifican suavemente la potencia automática",()=>{
  const soft=planPass({charge:.12}),normal=planPass({charge:normalCharge}),strong=planPass({charge:1});
  assert.ok(soft.userPowerModifier>=.88&&soft.userPowerModifier<normal.userPowerModifier);
  assert.ok(Math.abs(normal.userPowerModifier-1)<.001);
  assert.ok(strong.userPowerModifier>1&&strong.userPowerModifier<=1.16);
});

test("sin receptor válido se ejecuta un pase libre y no se inventa compañero",()=>{
  const plan=planPass({assist:"MANUAL",direction:{x:.6,y:-.8}});
  assert.equal(plan.receiverIndex,null);assert.equal(plan.passType,"FREE");
  assert.ok(plan.initialVelocity.x>0&&plan.initialVelocity.y<0);
});

test("la pelota queda libre: mover luego al receptor no altera la velocidad inicial",()=>{
  const receiver=player(500,300,{vx:130}),plan=planPass({receiver}),velocity={...plan.initialVelocity};
  receiver.x+=300;receiver.y-=160;
  assert.deepEqual(plan.initialVelocity,velocity);
});

test("la fricción es independiente del frame rate a 30, 60 y 120 FPS",()=>{
  const plan=planPass({receiver:player(560,360,{vx:70,vy:28})}),at30=simulate(plan,30),at60=simulate(plan,60),at120=simulate(plan,120);
  assert.ok(Math.hypot(at30.ball.x-at60.ball.x,at30.ball.y-at60.ball.y)<8);
  assert.ok(Math.hypot(at120.ball.x-at60.ball.x,at120.ball.y-at60.ball.y)<4);
});

test("los vectores diagonales se normalizan y no viajan más rápido",()=>{
  const straight=planPass({receiver:player(520,300),direction:{x:1,y:0}}),diagonal=planPass({receiver:player(402.84,582.84),direction:{x:1,y:1}});
  assert.ok(Math.abs(straight.distance-diagonal.distance)<1);
  assert.ok(Math.abs(Math.hypot(straight.initialVelocity.x,straight.initialVelocity.y)-Math.hypot(diagonal.initialVelocity.x,diagonal.initialVelocity.y))<1);
});

test("la recepción distingue control perfecto, normal y toque defectuoso por contexto",()=>{
  const system=new ReceptionSystem(),elite=player(500,300,{rating:94}),basic=player(500,300,{rating:72});
  const perfect=system.resolve({ballVelocity:{x:330,y:0},receiver:elite,ballRadius:9,distance:25,pressureDistance:180,planned:true,orientedDirection:{x:1,y:0}});
  const poor=system.resolve({ballVelocity:{x:710,y:0},receiver:basic,ballRadius:9,distance:25,pressureDistance:18,planned:true,orientedDirection:{x:1,y:0}});
  assert.equal(perfect?.quality,"PERFECT");assert.equal(perfect?.claimPossession,true);
  assert.equal(poor?.quality,"POOR");assert.equal(poor?.claimPossession,false);
  assert.ok(Math.hypot(perfect.ballVelocity.x,perfect.ballVelocity.y)<Math.hypot(poor.ballVelocity.x,poor.ballVelocity.y));
});

test("el radio de recepción amplía el contacto sin teletransportar la pelota",()=>{
  const system=new ReceptionSystem(),receiver=player(500,300);
  const radius=system.controlRadius(receiver.r,9,true);
  assert.ok(radius>=receiver.r*1.1+9&&radius<=receiver.r*1.3+9);
  assert.equal(system.resolve({ballVelocity:{x:300,y:0},receiver,ballRadius:9,distance:radius+1,pressureDistance:200,planned:true}),null);
});

test("las intercepciones requieren alcanzar físicamente la trayectoria",()=>{
  const system=new PassInterceptionSystem(),origin={x:100,y:300},velocity={x:520,y:0};
  const close=system.canPhysicallyIntercept(origin,velocity,player(380,325,{team:1,role:"DEF"})),far=system.canPhysicallyIntercept(origin,velocity,player(380,560,{team:1,role:"DEF"}));
  assert.equal(close.interceptable,true);assert.equal(far.interceptable,false);
});

test("la presión aumenta errores físicos pequeños pero conserva el receptor",()=>{
  const low=planPass({pressure:0,rng:(()=>{let n=0;return()=>n++%2?1:.99})()}),high=planPass({pressure:1,rng:(()=>{let n=0;return()=>n++%2?1:.99})()});
  assert.equal(low.receiverIndex,1);assert.equal(high.receiverIndex,1);
  assert.ok(Math.abs(high.angularError)>Math.abs(low.angularError));
  assert.ok(high.powerErrorModifier>=low.powerErrorModifier);
});

test("4v4, 5v5 y 6v6 comparten motor con parámetros de escala coherentes",()=>{
  const plans=[4,5,6].map((format,index)=>planPass({format,receiver:player(120+[480,560,640][index],300),passer:player(120,300),fieldDiagonal:format===4?1580:format===5?1720:1900}));
  assert.ok(plans.every(plan=>plan.receiverIndex===1&&plan.leadDistance>=0));
  assert.ok(plans.every(plan=>simulate(plan,120).closest<12),"los pases largos deben alcanzar su punto en las tres escalas");
  assert.ok(Math.hypot(...[plans[0].initialVelocity.x,plans[0].initialVelocity.y])<=640*1.08+.01);
  assert.ok(Math.hypot(...[plans[2].initialVelocity.x,plans[2].initialVelocity.y])<=720*1.08+.01);
});

test("el modo de depuración solo se activa explícitamente",()=>{
  assert.equal(passDebugEnabled(""),false);
  assert.equal(passDebugEnabled("?debugPass=1"),true);
  assert.equal(passDebugEnabled("?foo=1&debugPass=true"),true);
});

test("los atributos separan pase, visión, control y compostura",()=>{
  const rodri=derivePassAttributes({rating:91,role:"MED"}),keeper=derivePassAttributes({rating:91,role:"ARQ"});
  assert.ok(rodri.passing>keeper.passing&&rodri.vision>keeper.vision&&rodri.control>keeper.control);
});
