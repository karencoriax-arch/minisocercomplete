import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const app=join(root,"app");
const read=name=>readFileSync(join(app,name),"utf8");
const write=(name,content)=>writeFileSync(join(app,name),content);
const replaceRequired=(source,from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`v2.3 gameplay patch did not match: ${label}`);return next};

let pass=read("pass-system.ts");
if(!pass.includes("MSC_V23_PASS_POLISH")){
  pass=replaceRequired(pass,
`export const PASS_PHYSICS={
  highSpeedDragPerFrame60:.9895,
  lowSpeedDragPerFrame60:.972,
  lowSpeedThreshold:155,
  stopSpeed:3,
  passerMomentumTransfer:.16,
  minimumSpeed:{4:225,5:230,6:235} as Record<PassFormat,number>,
  maximumSpeed:{4:640,5:680,6:720} as Record<PassFormat,number>,
  maximumLeadDistance:{4:88,5:108,6:130} as Record<PassFormat,number>,
};`,
`export const PASS_PHYSICS={
  highSpeedDragPerFrame60:.9895,
  lowSpeedDragPerFrame60:.972,
  lowSpeedThreshold:155,
  stopSpeed:3,
  passerMomentumTransfer:.16,
  minimumSpeed:{4:225,5:230,6:235} as Record<PassFormat,number>,
  maximumSpeed:{4:640,5:680,6:720} as Record<PassFormat,number>,
  maximumLeadDistance:{4:88,5:108,6:130} as Record<PassFormat,number>,
};

// MSC_V23_PASS_POLISH — short passes favor control; long/through passes keep useful weight without shot-like speed.
export const PASS_TYPE_TUNING:Record<GroundPassType,{speed:number;angular:number;powerVariance:number}>={
  SHORT:{speed:.94,angular:.76,powerVariance:.82},
  MEDIUM:{speed:1,angular:1,powerVariance:1},
  LONG:{speed:1.025,angular:1.04,powerVariance:.96},
  THROUGH:{speed:1.015,angular:.92,powerVariance:.92},
  FREE:{speed:1,angular:1.06,powerVariance:1.06},
};`,"pass tuning constants");

  pass=replaceRequired(pass,
`    const recommendedSpeed=clamp(dragCompensatedSpeed,PASS_PHYSICS.minimumSpeed[args.format],PASS_PHYSICS.maximumSpeed[args.format]);
    const userPowerModifier=clamp(.86+clamp(args.charge,0,1)*.30,.88,1.16);
    const pressure=clamp(args.pressure,0,1),technicalQuality=(args.attributes.passing*.58+args.attributes.composure*.42)/100;
    const angularRange=(.008+(1-technicalQuality)*.055)*(1+pressure*.85),angularError=(args.rng()-.5)*2*angularRange;
    const powerRange=.018+(1-technicalQuality)*.085+pressure*.035,powerErrorModifier=1+(args.rng()-.5)*2*powerRange;
    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.88,PASS_PHYSICS.maximumSpeed[args.format]*1.05);`,
`    const tuning=PASS_TYPE_TUNING[args.passType];
    const recommendedSpeed=clamp(dragCompensatedSpeed*tuning.speed,PASS_PHYSICS.minimumSpeed[args.format]*.9,PASS_PHYSICS.maximumSpeed[args.format]);
    const userPowerModifier=clamp(.86+clamp(args.charge,0,1)*.30,.88,1.16);
    const pressure=clamp(args.pressure,0,1),technicalQuality=(args.attributes.passing*.58+args.attributes.composure*.42)/100;
    const angularRange=(.008+(1-technicalQuality)*.055)*(1+pressure*.85)*tuning.angular,angularError=(args.rng()-.5)*2*angularRange;
    const powerRange=(.018+(1-technicalQuality)*.085+pressure*.035)*tuning.powerVariance,powerErrorModifier=1+(args.rng()-.5)*2*powerRange;
    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.86,PASS_PHYSICS.maximumSpeed[args.format]*1.05);`,"pass power tuning");
  write("pass-system.ts",pass);
}

let page=read("page.tsx");
if(!page.includes("MSC_V23_GAMEPLAY")){
  page=replaceRequired(page,
`import { applyContextualShotError, calculateShotQuality, DRIBBLE_SPEED_MULTIPLIER, shotPreparationMs, SHOT_BLOCK_RADIUS_BONUS } from "./gameplay-polish";`,
`import { DRIBBLE_SPEED_MULTIPLIER, SHOT_BLOCK_RADIUS_BONUS } from "./gameplay-polish";
import { ShotSystem, type ShotType } from "./shot-system-v23";
import { postNormal, resolveRebound } from "./ball-physics-v23";
// MSC_V23_GAMEPLAY — contextual shot types, safer rebounds and pass tuning.`,"gameplay imports");

  page=replaceRequired(page,
`type PendingShot = {player:number;team:0|1;executeAt:number;aimX:number;aimY:number;force:number;quality:number}|null;`,
`type PendingShot = {player:number;team:0|1;executeAt:number;aimX:number;aimY:number;force:number;quality:number;shotType:ShotType;airborneMs:number}|null;`,"pending shot type");

  page=replaceRequired(page,
`replayController=useRef(new ReplayController({goalPauseMs:1050,replayDurationMs:3400,watchdogMs:8000})),gameModeRef=useRef<GameMode>("PLAYING"),lastCrowdPulse=useRef(0),passEngine=useRef(new PassSystem()),activePhysicalPass=useRef<ActivePhysicalPass|null>(null),`,
`replayController=useRef(new ReplayController({goalPauseMs:1050,replayDurationMs:3400,watchdogMs:8000})),gameModeRef=useRef<GameMode>("PLAYING"),lastCrowdPulse=useRef(0),passEngine=useRef(new PassSystem()),shotEngine=useRef(new ShotSystem()),activeShotFlight=useRef<{type:ShotType;airborneUntil:number}|null>(null),activePhysicalPass=useRef<ActivePhysicalPass|null>(null),`,"shot engine refs");

  const aiOld=`const goalX=dir>0?right+80:left-80,toGoal=normalizedAim(goalX-carrier.x,decision.aimY-carrier.y),speed=Math.hypot(carrier.vx,carrier.vy),alignment=speed>10?(carrier.vx*toGoal.x+carrier.vy*toGoal.y)/speed:.35,keeper=Array.from({length:oppEnd-oppStart},(_,offset)=>bodies.current[oppStart+offset]).find(player=>player.role==="ARQ"),keeperCoverage=keeper?Math.max(0,1-Math.abs(keeper.y-decision.aimY)/108):0,quality=calculateShotQuality({distance:Math.hypot(goalX-carrier.x,decision.aimY-carrier.y),maximumUsefulDistance:(right-left)*.46,lateralOffset:carrier.y-cy,fieldHalfHeight:(bottom-top)/2,finishing:carrier.rating,bodyAlignment:alignment,pressure:Math.max(0,Math.min(1,(125-nearestPressure)/125)),goalkeeperCoverage:keeperCoverage}),aimY=applyContextualShotError(decision.aimY,54,quality);
                pendingShot.current={player:owner,team:carrier.team,executeAt:ts+shotPreparationMs(alignment,Math.max(0,Math.min(1,(125-nearestPressure)/125)),carrier.rating),aimX:goalX,aimY,force:decision.force*(.91+quality*.12),quality};`;
  const aiNew=`const goalX=dir>0?right+80:left-80,toGoal=normalizedAim(goalX-carrier.x,decision.aimY-carrier.y),speed=Math.hypot(carrier.vx,carrier.vy),alignment=speed>10?(carrier.vx*toGoal.x+carrier.vy*toGoal.y)/speed:.35,keeper=Array.from({length:oppEnd-oppStart},(_,offset)=>bodies.current[oppStart+offset]).find(player=>player.role==="ARQ"),keeperCoverage=keeper?Math.max(0,1-Math.abs(keeper.y-decision.aimY)/108):0,pressure=Math.max(0,Math.min(1,(125-nearestPressure)/125)),goalLineX=dir>0?right:left,keeperRush=keeper?Math.max(0,Math.min(1,Math.abs(keeper.x-goalLineX)/180)):0,shotPlan=shotEngine.current.plan({player:carrier,charge:Math.max(.18,Math.min(1,(decision.force-390)/370)),distance:Math.hypot(goalX-carrier.x,decision.aimY-carrier.y),maximumUsefulDistance:(right-left)*.46,lateralOffset:carrier.y-cy,fieldHalfHeight:(bottom-top)/2,bodyAlignment:alignment,pressure,goalkeeperCoverage:keeperCoverage,goalkeeperRush,targetY:decision.aimY,goalHalfHeight:54,forceHint:decision.force});
                pendingShot.current={player:owner,team:carrier.team,executeAt:ts+shotPlan.preparationMs,aimX:goalX,aimY:shotPlan.targetY,force:shotPlan.speed,quality:shotPlan.quality,shotType:shotPlan.type,airborneMs:shotPlan.airborneMs};`;
  page=replaceRequired(page,aiOld,aiNew,"AI shot system");

  const humanOld=`if(shooter&&shooter.team===0&&shooterDistance<124&&!pendingShot.current){let nearestPressure=Infinity;for(let i=n;i<n*2;i++)nearestPressure=Math.min(nearestPressure,Math.hypot(bodies.current[i].x-shooter.x,bodies.current[i].y-shooter.y));const aimY=cy+((inputManager.current.isHeld("MOVE_DOWN")?1:0)-(inputManager.current.isHeld("MOVE_UP")?1:0))*82,goalX=right+80,toGoal=normalizedAim(goalX-shooter.x,aimY-shooter.y),speed=Math.hypot(shooter.vx,shooter.vy),alignment=speed>10?(shooter.vx*toGoal.x+shooter.vy*toGoal.y)/speed:.35,keeper=bodies.current.slice(n,n*2).find(player=>player.role==="ARQ"),pressure=Math.max(0,Math.min(1,(125-nearestPressure)/125)),keeperCoverage=keeper?Math.max(0,1-Math.abs(keeper.y-aimY)/108):0,quality=calculateShotQuality({distance:Math.hypot(goalX-shooter.x,aimY-shooter.y),maximumUsefulDistance:(right-left)*.46,lateralOffset:shooter.y-cy,fieldHalfHeight:(bottom-top)/2,finishing:shooter.rating,bodyAlignment:alignment,pressure,goalkeeperCoverage:keeperCoverage});pendingShot.current={player:active.current,team:0,executeAt:ts+shotPreparationMs(alignment,pressure,shooter.rating),aimX:goalX,aimY:applyContextualShotError(aimY,54,quality),force:(440+Math.max(12,chargeRef.current)*3.2)*(.91+quality*.12),quality}}`;
  const humanNew=`if(shooter&&shooter.team===0&&shooterDistance<124&&!pendingShot.current){let nearestPressure=Infinity;for(let i=n;i<n*2;i++)nearestPressure=Math.min(nearestPressure,Math.hypot(bodies.current[i].x-shooter.x,bodies.current[i].y-shooter.y));const aimY=cy+((inputManager.current.isHeld("MOVE_DOWN")?1:0)-(inputManager.current.isHeld("MOVE_UP")?1:0))*82,goalX=right+80,toGoal=normalizedAim(goalX-shooter.x,aimY-shooter.y),speed=Math.hypot(shooter.vx,shooter.vy),alignment=speed>10?(shooter.vx*toGoal.x+shooter.vy*toGoal.y)/speed:.35,keeper=bodies.current.slice(n,n*2).find(player=>player.role==="ARQ"),pressure=Math.max(0,Math.min(1,(125-nearestPressure)/125)),keeperCoverage=keeper?Math.max(0,1-Math.abs(keeper.y-aimY)/108):0,keeperRush=keeper?Math.max(0,Math.min(1,Math.abs(keeper.x-right)/180)):0,shotPlan=shotEngine.current.plan({player:shooter,charge:Math.max(0,Math.min(1,chargeRef.current/100)),distance:Math.hypot(goalX-shooter.x,aimY-shooter.y),maximumUsefulDistance:(right-left)*.46,lateralOffset:shooter.y-cy,fieldHalfHeight:(bottom-top)/2,bodyAlignment:alignment,pressure,goalkeeperCoverage:keeperCoverage,goalkeeperRush,targetY:aimY,goalHalfHeight:54});pendingShot.current={player:active.current,team:0,executeAt:ts+shotPlan.preparationMs,aimX:goalX,aimY:shotPlan.targetY,force:shotPlan.speed,quality:shotPlan.quality,shotType:shotPlan.type,airborneMs:shotPlan.airborneMs}}`;
  page=replaceRequired(page,humanOld,humanNew,"human shot system");

  page=replaceRequired(page,
`b.vx=(shot.aimX-b.x)/l*shot.force;b.vy=(shot.aimY-b.y)/l*shot.force;lastTouch.current=shot.player;ballRelease.current={player:shot.player,until:ts+135};ballFlight.current={type:"SHOT",team:shot.team,startedAt:ts};`,
`b.vx=(shot.aimX-b.x)/l*shot.force;b.vy=(shot.aimY-b.y)/l*shot.force;lastTouch.current=shot.player;ballRelease.current={player:shot.player,until:ts+135};ballFlight.current={type:"SHOT",team:shot.team,startedAt:ts};activeShotFlight.current={type:shot.shotType,airborneUntil:ts+shot.airborneMs};`,"shot execution style");

  page=replaceRequired(page,
`const p=bodies.current[i];if(ts<possessionGrace.current.until&&protectedBody&&protectedBody.team!==p.team)continue;`,
`const p=bodies.current[i];if(ts<possessionGrace.current.until&&protectedBody&&protectedBody.team!==p.team)continue;const airborneChip=activeShotFlight.current?.type==="CHIP"&&ts<activeShotFlight.current.airborneUntil&&p.role!=="ARQ"&&ballFlight.current.type==="SHOT";if(airborneChip)continue;`,"chip clears field blocks");

  page=replaceRequired(page,
`b.vx=reception.ballVelocity.x;b.vy=reception.ballVelocity.y;lastTouch.current=i;ballRelease.current={player:i,until:ts+88};resolvedContactThisFrame=true;`,
`b.vx=reception.ballVelocity.x;b.vy=reception.ballVelocity.y;lastTouch.current=i;ballRelease.current={player:i,until:ts+88};resolvedContactThisFrame=true;if(contact.block)activeShotFlight.current=null;`,"shot flight clears on block");

  page=replaceRequired(page,
`if(b.y<top+b.r||b.y>bottom-b.r){b.vy*=-.78;b.y=Math.max(top+b.r,Math.min(bottom-b.r,b.y));aiOwner.current=null;ballFlight.current={type:"FREE",team:null,startedAt:ts}}`,
`if(b.y<top+b.r||b.y>bottom-b.r){const normal={x:0,y:b.y<top+b.r?1:-1},next=resolveRebound({x:b.vx,y:b.vy},normal,"SIDELINE");b.vx=next.x;b.vy=next.y;b.y=Math.max(top+b.r,Math.min(bottom-b.r,b.y));aiOwner.current=null;activeShotFlight.current=null;ballFlight.current={type:"FREE",team:null,startedAt:ts}}`,"sideline rebound");

  page=replaceRequired(page,
`if(!stepInGoal&&(b.x<left+b.r||b.x>right-b.r)){const nearPost=Math.abs(b.y-goalTop)<24||Math.abs(b.y-goalBottom)<24;if(nearPost&&Math.abs(b.vx)>240)effect(680,.09);b.vx*=-.78;b.x=Math.max(left+b.r,Math.min(right-b.r,b.x));aiOwner.current=null;ballFlight.current={type:"FREE",team:null,startedAt:ts}}`,
`if(!stepInGoal&&(b.x<left+b.r||b.x>right-b.r)){const nearTop=Math.abs(b.y-goalTop)<24,nearBottom=Math.abs(b.y-goalBottom)<24,nearPost=nearTop||nearBottom,post={x:b.x<left+b.r?left:right,y:nearTop?goalTop:nearBottom?goalBottom:b.y},normal=nearPost?postNormal(b,post):{x:b.x<left+b.r?1:-1,y:0},next=resolveRebound({x:b.vx,y:b.vy},normal,nearPost?"POST":"GOAL_FRAME");if(nearPost&&Math.abs(b.vx)>240)effect(680,.09);b.vx=next.x;b.vy=next.y;b.x=Math.max(left+b.r,Math.min(right-b.r,b.x));aiOwner.current=null;activeShotFlight.current=null;ballFlight.current={type:"FREE",team:null,startedAt:ts}}`,"goal frame rebound");

  page=replaceRequired(page,
`c.dataset.passErrors=String(passErrorLog.current.length);`,
`c.dataset.passErrors=String(passErrorLog.current.length);c.dataset.shotType=activeShotFlight.current?.type??"NONE";`,"shot telemetry dataset");
  write("page.tsx",page);
}

let version=read("version.ts");
if(version.includes('GAME_VERSION = "2.2.0"')){version=version.replace('GAME_VERSION = "2.2.0"','GAME_VERSION = "2.3.0"');write("version.ts",version)}
let pkg=read("../package.json");
if(pkg.includes('"version": "2.2.0"')){pkg=pkg.replace('"version": "2.2.0"','"version": "2.3.0"');writeFileSync(join(root,"package.json"),pkg)}

const finalPage=read("page.tsx"),finalPass=read("pass-system.ts"),finalVersion=read("version.ts");
const checks=[
 [finalVersion.includes('GAME_VERSION = "2.3.0"'),"version"],
 [finalPage.includes("MSC_V23_GAMEPLAY"),"runtime marker"],
 [finalPage.includes("shotEngine=useRef(new ShotSystem())"),"shot engine"],
 [finalPage.includes('shotType:ShotType')&&finalPage.includes('airborneMs:number'),"typed shot plan"],
 [finalPage.includes('activeShotFlight.current?.type==="CHIP"'),"contextual chip"],
 [finalPage.includes('resolveRebound')&&finalPage.includes('postNormal'),"rebound physics"],
 [finalPage.includes('dataset.shotType'),"shot telemetry"],
 [finalPass.includes("MSC_V23_PASS_POLISH")&&finalPass.includes("PASS_TYPE_TUNING"),"pass tuning"],
];
for(const [ok,label] of checks)if(!ok)throw new Error(`Mini Soccer Complete v2.3.0 verification failed: ${label}`);
console.log("Mini Soccer Complete v2.3.0 gameplay polish verification passed.");
