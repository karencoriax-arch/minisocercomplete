import type { PassPlan } from "./pass-system";

export type AIPlayer = {
  x:number;y:number;vx:number;vy:number;r:number;team:0|1;
  rating:number;role:string;
};

export type AIBall = {x:number;y:number;vx:number;vy:number;r:number};
export type IntentMode = "shape"|"press"|"cover"|"support"|"run"|"wide"|"intercept"|"carry"|"receive";
export type TacticalIntent = {mode:IntentMode;until:number;targetX:number;targetY:number;mark:number};
export type CombinationMemory = {passer:number;receiver:number;until:number;returnX:number;returnY:number}|null;
export type TeamPhase = "BUILD_UP"|"PROGRESSION"|"FINAL_THIRD"|"CHANCE_CREATION"|"SHOOTING"|"DEFENSIVE_TRANSITION"|"DEFENDING"|"COUNTER_ATTACK";
export type TeamRole = "BALL_CARRIER"|"PRIMARY_RECEIVER"|"SUPPORT"|"RUNNER"|"WIDTH"|"COVER"|"FINISHER"|"CHASER"|"SHAPE";
export type ReceptionMode = "RECEIVE_TO_FEET"|"RUN_IN_BEHIND"|"SUPPORT";
export type PostPassMovement = "OVERLAP"|"UNDERLAP"|"SUPPORT"|"RUN_FORWARD"|"RETURN_TO_POSITION";
export type OrientedAction = "PASS"|"DRIVE"|"SHOOT";
export type PassAssist = "ASSISTED"|"SEMI"|"MANUAL";
export type PassReceiverLockMode = "LATE"|"ANIMATION_START"|"POWER_UP";
export type AssistedPassTarget = {
  receiver:number;score:number;angle:number;distance:number;desiredDistance:number;
  distanceMatch:number;passingLaneQuality:number;confidence:number;
  targetPosition:{x:number;y:number};receptionMode:ReceptionMode;
};
export type SpacePassRunner = {runner:number;score:number;targetPosition:{x:number;y:number}};
export const DEBUG_PASS_ASSIST=false;
export const PASS_ASSIST_CONFIG={
  arrowRadiusFactor:1.6,
  coneHalfAngleDegrees:{4:38,5:34,6:31} as Record<4|5|6,number>,
  targetLockMs:{4:200,5:190,6:180} as Record<4|5|6,number>,
  cancelLockAngleDegrees:30,
  switchMargin:.12,
};
export type TacticalSlotKind = "BALL_CARRIER"|"LEFT_SUPPORT"|"RIGHT_SUPPORT"|"DEPTH"|"COVERAGE"|"PRIMARY_PRESSER"|"SECONDARY_PRESSER"|"LINE_COVER"|"GOALKEEPER";
export type TacticalSlot = {kind:TacticalSlotKind;x:number;y:number};
export type PassIntent = {
  type:"PASS_INTENT";from:number;to:number;targetPosition:{x:number;y:number};
  force:number;createdAt:number;executeAt:number;arrivalTime:number;expiresAt:number;
  executed:boolean;human:boolean;receptionMode:ReceptionMode;nextAction:OrientedAction;postPassMovement:PostPassMovement;
  plan?:PassPlan;
};
export type PlannedAction = {type:"PASS"|"RUN"|"SUPPORT"|"SHOOT";from:number;to:number;target:{x:number;y:number}};
export type TeamBlackboard = {
  team:0|1;ballCarrier:number|null;possessionTeam:0|1|null;currentPlay:{id:number;type:string;stage:number;participants:number[];steps:PlannedAction[]}|null;
  passIntent:PassIntent|null;primaryRunner:number;supportRunner:number;defensiveCover:number;widthPlayer:number;
  attackingDirection:1|-1;pressureLevel:number;teamPhase:TeamPhase;attackingUrgency:number;
  possessionStartedAt:number;lastProgressAt:number;furthestProgress:number;nextTickAt:number;roles:Record<number,TeamRole>;
  tacticalSlots:Record<number,TacticalSlot>;primaryPresser:number;secondaryPresser:number;defensiveLineX:number;
  attackMomentum:number;progressivePasses:number;lastCarrier:number|null;
  responsibilityLockedUntil:number;presserLockedUntil:number;lastPossessionTeam:0|1|null;
  baseFormationPositions:Record<number,{x:number;y:number}>;blockShift:{x:number;y:number};
};

export type DifficultyKey = "EASY"|"NORMAL"|"MEDIUM"|"PROFESSIONAL"|"WORLD_CLASS";
export type AIProfile = {
  key:DifficultyKey;
  decisionInterval:number;anticipationTime:number;
  passVision:number;passAccuracy:number;shotAccuracy:number;
  interceptionSkill:number;markingSkill:number;positioningSkill:number;
  aggression:number;pressingIntensity:number;tacticalAwareness:number;combinationPlay:number;
  mistakeChance:number;attackingUrgency:number;choiceDepth:number;bestChoiceWeight:number;
  awareness:number;anticipation:number;passBias:number;combinationBias:number;
  decisionDelay:number;intentDuration:number;error:number;randomness:number;pressers:number;
};

export type CarrierDecision =
  | {type:"pass";score:number;target:number;aimX:number;aimY:number;force:number;oneTwo:boolean;receptionMode:ReceptionMode;nextAction:OrientedAction;postPassMovement:PostPassMovement}
  | {type:"shoot";score:number;aimX:number;aimY:number;force:number}
  | {type:"carry";score:number;aimX:number;aimY:number};

export type GoalkeeperDistribution =
  | {type:"PASS";target:number;targetPosition:{x:number;y:number};score:number;interceptionRisk:number}
  | {type:"CLEAR";target:null;targetPosition:{x:number;y:number};score:number;interceptionRisk:number};

type DecisionContext = {
  carrierIndex:number;
  players:AIPlayer[];
  ball:AIBall;
  teamStart:number;
  teamEnd:number;
  opponentStart:number;
  opponentEnd:number;
  direction:1|-1;
  left:number;
  right:number;
  top:number;
  bottom:number;
  goalY:number;
  profile:AIProfile;
  combination:CombinationMemory;
  teamPhase?:TeamPhase;
  attackingUrgency?:number;
};

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);

export function passForceForDistance(passDistance:number,kind:"normal"|"through"|"aerial"="normal"){
  const bonus=kind==="through"?42:kind==="aerial"?28:0;
  return clamp(180+passDistance*.48+bonus,205,515);
}

export function normalizedAim(x:number,y:number,fallback:{x:number;y:number}={x:1,y:0}){
  const length=Math.hypot(x,y);
  if(length>.001)return{x:x/length,y:y/length};
  const fallbackLength=Math.hypot(fallback.x,fallback.y)||1;
  return{x:fallback.x/fallbackLength,y:fallback.y/fallbackLength};
}

export function fixedRadiusAim(origin:{x:number;y:number},pointer:{x:number;y:number},radius=76,fallback:{x:number;y:number}={x:1,y:0}){
  const direction=normalizedAim(pointer.x-origin.x,pointer.y-origin.y,fallback);
  return {direction,endpoint:{x:origin.x+direction.x*radius,y:origin.y+direction.y*radius},radius};
}

export function screenToWorldPoint(
  pointer:{x:number;y:number},
  viewport:{left:number;top:number;width:number;height:number},
  world:{width:number;height:number},
){
  return{
    x:(pointer.x-viewport.left)*world.width/Math.max(1,viewport.width),
    y:(pointer.y-viewport.top)*world.height/Math.max(1,viewport.height),
  };
}

export function resolvePassIntentDirection(current:{x:number;y:number},directionalInput:{x:number;y:number}){
  const inputLength=Math.hypot(directionalInput.x,directionalInput.y);
  return inputLength>.001?normalizedAim(directionalInput.x,directionalInput.y):normalizedAim(current.x,current.y);
}

type AssistedPassArgs = {
  origin:{x:number;y:number};aim:{x:number;y:number};players:AIPlayer[];teamStart:number;teamEnd:number;
  opponentStart:number;opponentEnd:number;carrierIndex:number;assist:PassAssist;fieldDiagonal:number;
  formatPlayers?:4|5|6;attackingDirection?:1|-1;passPower?:number;
};

export function assistConeRadians(assist:PassAssist,format:4|5|6){
  const formatAngle=PASS_ASSIST_CONFIG.coneHalfAngleDegrees[format];
  return formatAngle*Math.PI/180*(assist==="SEMI"?.62:1);
}

function smoothFalloff(value:number){const t=clamp(value,0,1);return t*t*(3-2*t)}

function assistedCandidate(args:AssistedPassArgs,index:number,preserveSelection=false):AssistedPassTarget|null{
  if(args.assist==="MANUAL"||index===args.carrierIndex||index<args.teamStart||index>=args.teamEnd||args.players[index]?.role==="ARQ")return null;
  const base=normalizedAim(args.aim.x,args.aim.y),profile=createAIProfile("MEDIUM"),format=args.formatPlayers??5,direction=args.attackingDirection??1,power=clamp(args.passPower??.45,0,1);
  const receiver=args.players[index],currentDx=receiver.x-args.origin.x,currentDy=receiver.y-args.origin.y,currentDistance=Math.hypot(currentDx,currentDy);if(currentDistance<34)return null;
  const estimatedSpeed=passForceForDistance(currentDistance),travelTime=currentDistance/estimatedSpeed,predictionTime=clamp(travelTime*.62,.20,.45),runSpeed=Math.hypot(receiver.vx,receiver.vy),towardPasser=runSpeed>.001?-(receiver.vx*currentDx+receiver.vy*currentDy)/(runSpeed*currentDistance):0;
  const receiverPressure=nearestOpponentDistance(receiver.x,receiver.y,args.players,args.opponentStart,args.opponentEnd),leadFactor=runSpeed<18?0:towardPasser>.22||receiverPressure<72?.28:1;
  const leadTime=predictionTime*leadFactor,targetPosition={x:receiver.x+receiver.vx*leadTime,y:receiver.y+receiver.vy*leadTime},dx=targetPosition.x-args.origin.x,dy=targetPosition.y-args.origin.y,d=Math.hypot(dx,dy);
  const dot=clamp((dx/d)*base.x+(dy/d)*base.y,-1,1),angle=Math.acos(dot),cone=assistConeRadians(args.assist,format);
  if(!preserveSelection&&(angle>cone||dot<=.05))return null;
  const lane=passingLaneQuality(args.origin.x,args.origin.y,targetPosition.x,targetPosition.y,args.players,args.opponentStart,args.opponentEnd,profile),progress=dx*direction;
  const minDistance=args.fieldDiagonal*.07,maxDistance=args.fieldDiagonal*.50,desiredDistance=minDistance+(maxDistance-minDistance)*power;
  const distanceSuitability=clamp(1-Math.abs(d-desiredDistance)/(args.fieldDiagonal*.32),0,1),alignment=1-smoothFalloff(angle/cone)*.82,forwardProgress=clamp(progress/(args.fieldDiagonal*.3),-1,1),openness=clamp(receiverPressure/(args.fieldDiagonal*.14),0,1),interceptionRisk=1-lane,roleValue=(receiver.role==="DEL"||receiver.role==="EXT")&&progress>0?1:receiver.role==="MED"?.65:.35,tacticalValue=roleValue*.58+openness*.42;
  const score=alignment*4+distanceSuitability*1.5+lane*2+tacticalValue*1.2+forwardProgress*.8-interceptionRisk*2.3;
  if(!preserveSelection&&score<1.35)return null;
  const receptionMode:ReceptionMode=runSpeed>42&&receiver.vx*direction>12&&leadFactor>.5?"RUN_IN_BEHIND":progress<0?"SUPPORT":"RECEIVE_TO_FEET";
  return {receiver:index,score,angle,distance:d,desiredDistance,distanceMatch:distanceSuitability,passingLaneQuality:lane,confidence:clamp(score/7.5,0,1),targetPosition,receptionMode};
}

export function findAssistedPassCandidates(args:AssistedPassArgs):AssistedPassTarget[]{
  if(args.assist==="MANUAL")return[];
  const candidates:AssistedPassTarget[]=[];
  for(let i=args.teamStart;i<args.teamEnd;i++){
    const candidate=assistedCandidate(args,i);if(candidate)candidates.push(candidate);
  }
  return candidates.sort((a,b)=>b.score-a.score);
}

export function findAssistedPassTarget(args:AssistedPassArgs):AssistedPassTarget|null{
  return findAssistedPassCandidates(args)[0]??null;
}

export function findSpacePassRunner(args:{
  origin:{x:number;y:number};targetPoint:{x:number;y:number};players:AIPlayer[];
  teamStart:number;teamEnd:number;carrierIndex:number;attackingDirection:1|-1;
}):SpacePassRunner|null{
  const passDirection=normalizedAim(args.targetPoint.x-args.origin.x,args.targetPoint.y-args.origin.y),passDistance=distance(args.origin,args.targetPoint);
  let best:SpacePassRunner|null=null;
  for(let index=args.teamStart;index<args.teamEnd;index++){
    if(index===args.carrierIndex||args.players[index]?.role==="ARQ")continue;
    const player=args.players[index],relative={x:player.x-args.origin.x,y:player.y-args.origin.y},along=relative.x*passDirection.x+relative.y*passDirection.y,lateral=Math.abs(relative.x*passDirection.y-relative.y*passDirection.x);
    if(along<18||along>passDistance+150||lateral>185)continue;
    const targetDistance=distance(player,args.targetPoint),velocityToward=(player.vx*passDirection.x+player.vy*passDirection.y),forwardValue=(args.targetPoint.x-player.x)*args.attackingDirection,roleBonus=player.role==="DEL"||player.role==="EXT"?80:player.role==="MED"?40:0;
    const score=500-targetDistance-lateral*.65+velocityToward*.35+clamp(forwardValue,-120,180)*.22+roleBonus;
    if(!best||score>best.score)best={runner:index,score,targetPosition:{...args.targetPoint}};
  }
  return best&&best.score>110?best:null;
}

export class PassTargetSelector{
  private currentTarget:AssistedPassTarget|null=null;
  private candidates:AssistedPassTarget[]=[];
  private receiverLocked=false;
  private preparing=false;
  private candidateLockUntil=0;
  private intentWindowUntil=0;
  private capturedIntent={x:1,y:0};
  private latestIntent={x:1,y:0};
  private lastConeRadians=34*Math.PI/180;
  private lastDesiredDistance=0;
  private lastPower=0;
  private restartSelection=false;
  readonly lockMode:PassReceiverLockMode;
  readonly switchMargin:number;
  constructor(lockMode:PassReceiverLockMode="LATE",switchMargin=PASS_ASSIST_CONFIG.switchMargin){this.lockMode=lockMode;this.switchMargin=switchMargin}
  reset(){this.currentTarget=null;this.candidates=[];this.receiverLocked=false;this.preparing=false;this.candidateLockUntil=0;this.intentWindowUntil=0;this.restartSelection=false}
  beginPowerUp(now=0,direction=this.capturedIntent){this.preparing=true;this.capturedIntent=normalizedAim(direction.x,direction.y,this.capturedIntent);this.latestIntent=this.capturedIntent;this.intentWindowUntil=now+180;this.candidateLockUntil=0;this.restartSelection=true;this.receiverLocked=this.lockMode==="POWER_UP"}
  resolveIntent(now:number,rawDirection:{x:number;y:number}){
    const next=normalizedAim(rawDirection.x,rawDirection.y,this.capturedIntent);
    this.latestIntent=next;
    if(!this.preparing){this.capturedIntent=next;return next}
    const dot=clamp(this.capturedIntent.x*next.x+this.capturedIntent.y*next.y,-1,1),changedClearly=Math.acos(dot)>PASS_ASSIST_CONFIG.cancelLockAngleDegrees*Math.PI/180;
    if(changedClearly){this.currentTarget=null;this.candidates=[];this.candidateLockUntil=0;this.restartSelection=true;this.capturedIntent=next;this.intentWindowUntil=now+180;return next}
    if(now<=this.intentWindowUntil)this.capturedIntent=next;
    return next;
  }
  beginAnimation(){if(this.lockMode==="ANIMATION_START")this.receiverLocked=true;return this.currentTarget}
  lockLate(){if(this.lockMode==="LATE")this.receiverLocked=true;return this.currentTarget}
  isLocked(now=0){return this.receiverLocked||now<this.candidateLockUntil}
  getTarget(){return this.currentTarget}
  getDebugState(now=0){return{passIntentDirection:this.latestIntent,assistCone:this.lastConeRadians,candidateScore:this.currentTarget?.score??null,selectedReceiver:this.currentTarget?.receiver??-1,receiverLock:this.isLocked(now),intentWindowRemaining:Math.max(0,this.intentWindowUntil-now),receiverLockRemaining:this.receiverLocked?Infinity:Math.max(0,this.candidateLockUntil-now),desiredDistance:this.lastDesiredDistance,power:this.lastPower,candidates:this.candidates.map(candidate=>({...candidate,targetPosition:{...candidate.targetPosition}}))}}
  update(args:AssistedPassArgs&{now?:number}){
    if(args.assist==="MANUAL"){this.reset();return null}
    const now=args.now??0,format=args.formatPlayers??5,power=clamp(args.passPower??.45,0,1),lockTime=PASS_ASSIST_CONFIG.targetLockMs[format];
    this.lastConeRadians=assistConeRadians(args.assist,format);this.lastPower=power;this.lastDesiredDistance=args.fieldDiagonal*.07+(args.fieldDiagonal*.50-args.fieldDiagonal*.07)*power;
    if(this.receiverLocked)return this.currentTarget;
    this.candidates=findAssistedPassCandidates(args);const candidate=this.candidates[0]??null;
    if(this.restartSelection){this.currentTarget=candidate;this.restartSelection=false;if(candidate)this.candidateLockUntil=now+lockTime;return this.currentTarget}
    if(!this.currentTarget){this.currentTarget=candidate;if(candidate)this.candidateLockUntil=now+lockTime;return this.currentTarget}
    if(now<this.candidateLockUntil){this.currentTarget=assistedCandidate(args,this.currentTarget.receiver,true)??this.currentTarget;return this.currentTarget}
    const refreshed=assistedCandidate(args,this.currentTarget.receiver);
    if(!refreshed){this.currentTarget=candidate;if(candidate)this.candidateLockUntil=now+lockTime;return this.currentTarget}
    if(!candidate||candidate.receiver===refreshed.receiver){this.currentTarget=refreshed;return this.currentTarget}
    if(candidate.score>refreshed.score+this.switchMargin){this.currentTarget=candidate;this.candidateLockUntil=now+lockTime}
    else this.currentTarget=refreshed;
    return this.currentTarget;
  }
}

export function manualDirectionalPass(args:{
  origin:{x:number;y:number};aim:{x:number;y:number};charge:number;rating:number;pressure:number;
  assist:PassAssist;players:AIPlayer[];teamStart:number;teamEnd:number;carrierIndex:number;
  opponentStart?:number;opponentEnd?:number;fieldDiagonal:number;formatPlayers?:4|5|6;attackingDirection?:1|-1;
  lockedReceiver?:number;lockedTargetPosition?:{x:number;y:number};lockedReceptionMode?:ReceptionMode;rng?:()=>number;
}){
  const rng=args.rng??Math.random,base=normalizedAim(args.aim.x,args.aim.y),candidate=findAssistedPassTarget({...args,passPower:args.charge,opponentStart:args.opponentStart??args.teamEnd,opponentEnd:args.opponentEnd??args.players.length});
  let lockedValid=candidate;
  if(args.assist!=="MANUAL"&&args.lockedReceiver!==undefined&&args.lockedReceiver>=args.teamStart&&args.lockedReceiver<args.teamEnd&&args.lockedReceiver!==args.carrierIndex){
    const mate=args.players[args.lockedReceiver],d=Math.hypot(mate.x-args.origin.x,mate.y-args.origin.y),travelTime=Math.min(1.15,d/passForceForDistance(d));
    lockedValid={receiver:args.lockedReceiver,score:candidate?.score??0,angle:0,targetPosition:args.lockedTargetPosition??{x:mate.x+mate.vx*travelTime,y:mate.y+mate.vy*travelTime},receptionMode:args.lockedReceptionMode??(Math.hypot(mate.vx,mate.vy)>42?"RUN_IN_BEHIND":"RECEIVE_TO_FEET")};
  }
  let direction=base;const receiver=lockedValid?.receiver??-1,targetPoint=lockedValid?.targetPosition;
  if(targetPoint){const toward=normalizedAim(targetPoint.x-args.origin.x,targetPoint.y-args.origin.y),blend=args.assist==="ASSISTED"?1:.62;direction=normalizedAim(base.x*(1-blend)+toward.x*blend,base.y*(1-blend)+toward.y*blend,base)}
  const accuracy=Math.max(.72,Math.min(.98,.72+(args.rating-70)*.008)),pressureFactor=1+Math.max(0,Math.min(1,args.pressure/120))*.65;
  const maxError=(1-accuracy)*.22*pressureFactor,error=(rng()-.5)*2*maxError,cos=Math.cos(error),sin=Math.sin(error);
  direction=normalizedAim(direction.x*cos-direction.y*sin,direction.x*sin+direction.y*cos,direction);
  const power=Math.max(.12,Math.min(1,args.charge)),assistedDistance=targetPoint?Math.hypot(targetPoint.x-args.origin.x,targetPoint.y-args.origin.y):0;
  const force=targetPoint?clamp(passForceForDistance(assistedDistance)*(.72+power*.48),185,515):205+power*235,projectedDistance=targetPoint?assistedDistance:Math.min(args.fieldDiagonal*.58,120+power*args.fieldDiagonal*.42);
  const targetPosition={x:args.origin.x+direction.x*projectedDistance,y:args.origin.y+direction.y*projectedDistance};
  // A receiver reacts to the user's lane, but never changes the ball direction.
  let reactingReceiver=receiver,bestLane=Infinity;
  for(let i=args.teamStart;i<args.teamEnd;i++){
    if(i===args.carrierIndex||args.players[i]?.role==="ARQ")continue;
    const p=args.players[i],rx=p.x-args.origin.x,ry=p.y-args.origin.y,along=rx*direction.x+ry*direction.y;if(along<30)continue;
    const lateral=Math.abs(rx*direction.y-ry*direction.x),arrivalGap=Math.abs(along-projectedDistance)*.16,score=lateral+arrivalGap;
    if(score<bestLane){bestLane=score;reactingReceiver=i}
  }
  return {direction,force,targetPosition,receiver:reactingReceiver,selectedReceiver:receiver,power,receptionMode:lockedValid?.receptionMode??"RUN_IN_BEHIND",targetScore:lockedValid?.score??-Infinity};
}

export function receptionRestitution(relativeNormal:number,plannedReception:boolean){
  if(plannedReception)return .02;
  return Math.abs(relativeNormal)>300?.15:.13;
}

export function cushionReception(ballVelocity:{x:number;y:number},receiverVelocity:{x:number;y:number}){
  return {x:ballVelocity.x*.58+receiverVelocity.x*.42,y:ballVelocity.y*.58+receiverVelocity.y*.42};
}

export function createTeamBlackboard(team:0|1,direction:1|-1):TeamBlackboard{
  return {team,ballCarrier:null,possessionTeam:null,currentPlay:null,passIntent:null,primaryRunner:-1,supportRunner:-1,defensiveCover:-1,widthPlayer:-1,attackingDirection:direction,pressureLevel:0,teamPhase:"DEFENDING",attackingUrgency:0,possessionStartedAt:0,lastProgressAt:0,furthestProgress:0,nextTickAt:0,roles:{},tacticalSlots:{},primaryPresser:-1,secondaryPresser:-1,defensiveLineX:0,attackMomentum:0,progressivePasses:0,lastCarrier:null,responsibilityLockedUntil:0,presserLockedUntil:0,lastPossessionTeam:null,baseFormationPositions:{},blockShift:{x:0,y:0}};
}

type CoreProfile = Omit<AIProfile,"awareness"|"anticipation"|"passBias"|"combinationBias"|"decisionDelay"|"intentDuration"|"error"|"randomness"|"pressers">;
const buildProfile=(profile:CoreProfile):AIProfile=>({
  ...profile,
  awareness:profile.tacticalAwareness,
  anticipation:profile.anticipationTime,
  passBias:.46+profile.passVision*.46,
  combinationBias:profile.combinationPlay,
  decisionDelay:profile.decisionInterval,
  intentDuration:Math.round(clamp(profile.decisionInterval*1.55,300,570)),
  error:1-profile.passAccuracy,
  randomness:profile.mistakeChance,
  pressers:profile.pressingIntensity>=.64?2:1,
});

export const DIFFICULTY_PROFILES:Record<DifficultyKey,AIProfile>={
  EASY:buildProfile({key:"EASY",decisionInterval:350,anticipationTime:.20,passVision:.55,passAccuracy:.72,shotAccuracy:.62,interceptionSkill:.40,markingSkill:.45,positioningSkill:.50,aggression:.45,pressingIntensity:.35,tacticalAwareness:.45,combinationPlay:.25,mistakeChance:.12,attackingUrgency:.50,choiceDepth:3,bestChoiceWeight:.50}),
  NORMAL:buildProfile({key:"NORMAL",decisionInterval:250,anticipationTime:.35,passVision:.68,passAccuracy:.80,shotAccuracy:.70,interceptionSkill:.55,markingSkill:.58,positioningSkill:.62,aggression:.55,pressingIntensity:.50,tacticalAwareness:.60,combinationPlay:.45,mistakeChance:.08,attackingUrgency:.62,choiceDepth:2,bestChoiceWeight:.68}),
  MEDIUM:buildProfile({key:"MEDIUM",decisionInterval:180,anticipationTime:.50,passVision:.78,passAccuracy:.86,shotAccuracy:.78,interceptionSkill:.68,markingSkill:.70,positioningSkill:.75,aggression:.65,pressingIntensity:.64,tacticalAwareness:.74,combinationPlay:.62,mistakeChance:.05,attackingUrgency:.72,choiceDepth:2,bestChoiceWeight:.80}),
  PROFESSIONAL:buildProfile({key:"PROFESSIONAL",decisionInterval:110,anticipationTime:.75,passVision:.90,passAccuracy:.91,shotAccuracy:.86,interceptionSkill:.84,markingSkill:.84,positioningSkill:.88,aggression:.76,pressingIntensity:.77,tacticalAwareness:.90,combinationPlay:.85,mistakeChance:.025,attackingUrgency:.84,choiceDepth:2,bestChoiceWeight:.94}),
  WORLD_CLASS:buildProfile({key:"WORLD_CLASS",decisionInterval:65,anticipationTime:1,passVision:.98,passAccuracy:.95,shotAccuracy:.91,interceptionSkill:.94,markingSkill:.94,positioningSkill:.96,aggression:.86,pressingIntensity:.88,tacticalAwareness:.98,combinationPlay:.96,mistakeChance:.01,attackingUrgency:.94,choiceDepth:1,bestChoiceWeight:1}),
};

export function createAIProfile(difficulty:DifficultyKey="MEDIUM"):AIProfile{
  return {...DIFFICULTY_PROFILES[difficulty]};
}

export function chooseActionByDifficulty<T extends {score:number}>(actions:T[],profile:AIProfile,rng:()=>number=Math.random):T{
  if(actions.length===0)throw new Error("No AI actions available");
  const sorted=[...actions].sort((a,b)=>b.score-a.score),pool=sorted.slice(0,Math.min(profile.choiceDepth,sorted.length));
  if(pool.length===1||profile.bestChoiceWeight>=1)return pool[0];
  if(rng()<profile.mistakeChance)return pool[Math.min(pool.length-1,1+Math.floor(rng()*Math.max(1,pool.length-1)))];
  if(rng()<profile.bestChoiceWeight)return pool[0];
  const alternatives=pool.slice(1),total=alternatives.reduce((sum,item)=>sum+Math.max(1,item.score-alternatives[alternatives.length-1].score+12),0);
  let cursor=rng()*total;
  for(const item of alternatives){cursor-=Math.max(1,item.score-alternatives[alternatives.length-1].score+12);if(cursor<=0)return item}
  return alternatives[alternatives.length-1]??pool[0];
}

function pointToSegment(px:number,py:number,ax:number,ay:number,bx:number,by:number){
  const abx=bx-ax,aby=by-ay,lengthSq=abx*abx+aby*aby||1;
  const t=clamp(((px-ax)*abx+(py-ay)*aby)/lengthSq,0,1);
  const x=ax+abx*t,y=ay+aby*t;
  return {distance:Math.hypot(px-x,py-y),t,x,y};
}

function nearestOpponentDistance(x:number,y:number,players:AIPlayer[],start:number,end:number){
  let result=Infinity;
  for(let i=start;i<end;i++)result=Math.min(result,Math.hypot(players[i].x-x,players[i].y-y));
  return result;
}

function laneRisk(ax:number,ay:number,bx:number,by:number,passSpeed:number,players:AIPlayer[],start:number,end:number,profile:AIProfile){
  const passDistance=Math.hypot(bx-ax,by-ay)||1,passTime=passDistance/Math.max(220,passSpeed);
  let risk=0;
  for(let i=start;i<end;i++){
    const opponent=players[i],projection=pointToSegment(opponent.x,opponent.y,ax,ay,bx,by);
    if(projection.t<.06||projection.t>.98)continue;
    const ballArrival=passTime*projection.t;
    const reach=22+(155+profile.anticipation*30)*ballArrival;
    if(projection.distance<reach){
      const centrality=1-Math.abs(.5-projection.t)*1.35;
      risk+=clamp((reach-projection.distance)/Math.max(1,reach),0,1)*(90+profile.anticipation*75)*centrality;
    }
  }
  return risk;
}

function pressureAround(x:number,y:number,players:AIPlayer[],start:number,end:number,radius:number){
  let nearest=Infinity,count=0;
  for(let i=start;i<end;i++){const d=Math.hypot(players[i].x-x,players[i].y-y);nearest=Math.min(nearest,d);if(d<radius)count++}
  return {nearest,count};
}

function phaseForCarrier(carrier:AIPlayer,direction:1|-1,left:number,right:number,pressure:number):TeamPhase{
  const progress=direction>0?(carrier.x-left)/(right-left):(right-carrier.x)/(right-left);
  if(progress<.27)return "BUILD_UP";
  if(progress<.58)return pressure>1?"COUNTER_ATTACK":"PROGRESSION";
  if(progress<.78)return "FINAL_THIRD";
  return pressure>1?"CHANCE_CREATION":"SHOOTING";
}

function bestRoleCandidate(candidates:number[],players:AIPlayer[],score:(player:AIPlayer,index:number)=>number,used:Set<number>){
  let best=-1,bestScore=-Infinity;
  for(const index of candidates){if(used.has(index))continue;const value=score(players[index],index);if(value>bestScore){bestScore=value;best=index}}
  if(best>=0)used.add(best);
  return best;
}

export function playerPersonality(player:Pick<AIPlayer,"rating"|"role">&{name?:string}){
  const name=(player.name??"").toLowerCase(),quality=clamp((player.rating-72)/24,0,1);
  const explosive=/mbapp|vin[ií]cius|vini|salah|haaland|rodrygo|yamal|messi|ronaldo/.test(name);
  const controller=/rodri|modri[cć]|kroos|de bruyne|enzo|pedri|valverde/.test(name);
  const finisher=player.role==="DEL"||/haaland|mbapp|kane|lautaro|ronaldo/.test(name);
  const defender=player.role==="DEF"||player.role==="ARQ";
  return {
    pace:clamp(.94+quality*.08+(explosive?.055:0)-(controller?.025:0),.91,1.09),
    runBias:clamp(.38+quality*.25+(explosive?.28:0)+(finisher?.14:0)-(defender?.18:0),.18,1),
    passBias:clamp(.42+quality*.34+(controller?.24:0)-(finisher?.07:0),.25,1),
    driveBias:clamp(.34+quality*.28+(explosive?.27:0)-(defender?.14:0),.18,1),
    shotBias:clamp(.30+quality*.28+(finisher?.32:0),.2,1),
    positioning:clamp(.46+quality*.42+(controller||defender ? .12 : 0),.4,1),
  };
}

export function separationSteering(index:number,players:AIPlayer[],start:number,end:number,minDistance=70){
  const player=players[index];let x=0,y=0,crowding=0;
  for(let i=start;i<end;i++){
    if(i===index)continue;
    const dx=player.x-players[i].x,dy=player.y-players[i].y,gap=Math.hypot(dx,dy);
    if(gap>=minDistance)continue;
    const overlap=(minDistance-gap)/minDistance;
    // A quadratic ramp is deliberately gentle at the edge and decisive only
    // during a real overlap. It prevents the old magnetic-bounce effect.
    const strength=overlap*overlap+(overlap>.55?(overlap-.55)*.45:0);
    if(gap>.001){x+=dx/gap*strength;y+=dy/gap*strength}else{x+=(index<i?-1:1)*strength}
    crowding+=strength;
  }
  const magnitude=Math.hypot(x,y);
  if(magnitude>1){x/=magnitude;y/=magnitude}
  return {x,y,crowding};
}

export function teamSpacingMetrics(players:AIPlayer[],start:number,end:number,minimumDistance:number){
  let minimum=Infinity,overlapPairs=0,severeOverlaps=0;
  for(let i=start;i<end;i++)for(let j=i+1;j<end;j++){
    const gap=distance(players[i],players[j]);minimum=Math.min(minimum,gap);
    if(gap<minimumDistance)overlapPairs++;
    // Touching rims is not a stack. Count only real disc overlap or a very
    // compressed tactical gap, whichever is stricter for the current format.
    if(gap<Math.max((players[i].r+players[j].r)*.9,minimumDistance*.24))severeOverlaps++;
  }
  return {minimumDistance:Number.isFinite(minimum)?minimum:0,overlapPairs,severeOverlaps};
}

export function teamStructureMetrics(board:TeamBlackboard,players:AIPlayer[],start:number,end:number){
  let totalError=0,measured=0,maximumError=0;
  for(let i=start;i<end;i++){
    if(i===board.ballCarrier)continue;
    const target=board.tacticalSlots[i]??board.baseFormationPositions[i];
    if(!target)continue;
    const error=distance(players[i],target);totalError+=error;maximumError=Math.max(maximumError,error);measured++;
  }
  return {averageError:measured?totalError/measured:0,maximumError,measured};
}

function defensivePressureScore(index:number,players:AIPlayer[],ball:AIBall,teammates:number[],ownGoalX:number,goalY:number,direction:1|-1){
  const player=players[index],ballDistance=distance(player,ball);
  const goalDistance=Math.hypot(player.x-ownGoalX,player.y-goalY);
  const ballGoalDistance=Math.hypot(ball.x-ownGoalX,ball.y-goalY);
  const goalSide=goalDistance<=ballGoalDistance+24?1:0;
  const approachX=ball.x-player.x,approachY=ball.y-player.y,toGoalX=ownGoalX-ball.x,toGoalY=goalY-ball.y;
  const approachLength=Math.hypot(approachX,approachY)||1,goalLength=Math.hypot(toGoalX,toGoalY)||1;
  const correctAngle=clamp(-((approachX/approachLength)*(toGoalX/goalLength)+(approachY/approachLength)*(toGoalY/goalLength)),-1,1);
  const coverAvailable=teammates.some(i=>i!==index&&players[i].role!=="ARQ"&&Math.hypot(players[i].x-ownGoalX,players[i].y-goalY)<goalDistance+80)?1:0;
  const formationBreak=Math.max(0,(player.x-ball.x)*direction)*.34;
  const goalExposure=!coverAvailable&&player.role==="DEF"?105:0;
  const suitability=player.role==="MED"?44:player.role==="DEF"?32:player.role==="DEL"||player.role==="EXT"?20:0;
  return -ballDistance*2+correctAngle*54+goalSide*42+suitability+coverAvailable*38-formationBreak-goalExposure;
}

function reserveTacticalPoint(point:{x:number;y:number},reserved:Array<{x:number;y:number}>,minimumDistance:number,top:number,bottom:number){
  let x=point.x,y=point.y;
  for(let pass=0;pass<3;pass++)for(const occupied of reserved){
    const dx=x-occupied.x,dy=y-occupied.y,gap=Math.hypot(dx,dy);
    if(gap>=minimumDistance)continue;
    const sign=dy===0?(reserved.length%2===0?1:-1):Math.sign(dy),push=minimumDistance-gap;
    y+=sign*push*.78;x+=(dx===0?(reserved.length%2===0?1:-1):Math.sign(dx))*push*.22;
    y=clamp(y,top+28,bottom-28);
  }
  return {x,y};
}

export function passingLaneQuality(ax:number,ay:number,bx:number,by:number,players:AIPlayer[],opponentStart:number,opponentEnd:number,profile=createAIProfile("MEDIUM")){
  const speed=passForceForDistance(Math.hypot(bx-ax,by-ay));
  return clamp(1-laneRisk(ax,ay,bx,by,speed,players,opponentStart,opponentEnd,profile)/180,0,1);
}

export function choosePostPassMovement(player:AIPlayer,direction:1|-1,inFinalThird:boolean,rng:()=>number=Math.random):PostPassMovement{
  const personality=playerPersonality(player),roll=rng();
  if(inFinalThird&&roll<.22+personality.runBias*.38)return "RUN_FORWARD";
  if((player.role==="EXT"||player.role==="DEF")&&roll<.47)return "OVERLAP";
  if(player.role==="MED"&&roll<.48)return "UNDERLAP";
  if(roll<.76)return "SUPPORT";
  return "RETURN_TO_POSITION";
}

export function goalkeeperTarget(player:AIPlayer,ball:AIBall,direction:1|-1,bounds:{left:number;right:number;top:number;bottom:number},goalY:number,opponentDistance=Infinity){
  const ownGoalX=direction>0?bounds.left:bounds.right,fieldWidth=bounds.right-bounds.left,areaDepth=Math.min(190,fieldWidth*.17);
  const distanceFromGoal=Math.abs(ball.x-ownGoalX),ballInArea=distanceFromGoal<areaDepth;
  const ballApproaching=ball.vx*direction<0,oneOnOne=ballInArea&&opponentDistance<126;
  const safeRush=oneOnOne&&(ballApproaching||distanceFromGoal<areaDepth*.62);
  const angleDepth=clamp(distanceFromGoal*.07,0,46),baseX=ownGoalX+direction*(20+angleDepth);
  const rushX=clamp(ball.x-direction*24,ownGoalX-direction*2,ownGoalX+direction*areaDepth*.78);
  const lateralFactor=safeRush?.72:distanceFromGoal<fieldWidth*.32?.43:.29;
  const y=clamp(goalY+(ball.y-goalY)*lateralFactor,goalY-72,goalY+72);
  const recovering=!ballInArea&&Math.abs(player.x-baseX)>64;
  const state=safeRush?"CHARGE_BALL":recovering?"RECOVER_GOAL_POSITION":ballApproaching&&distanceFromGoal<fieldWidth*.36?"PREPARE_SAVE":Math.abs(ball.y-goalY)>38?"ADJUST_ANGLE":"HOLD_POSITION";
  return {x:clamp(safeRush?rushX:baseX,bounds.left+20,bounds.right-20),y,state};
}

export function chooseGoalkeeperDistribution(args:{
  keeperIndex:number;players:AIPlayer[];teamStart:number;teamEnd:number;opponentStart:number;opponentEnd:number;
  direction:1|-1;left:number;right:number;top:number;bottom:number;profile?:AIProfile;
}):GoalkeeperDistribution{
  const {keeperIndex,players,teamStart,teamEnd,opponentStart,opponentEnd,direction,left,right,top,bottom}=args,keeper=players[keeperIndex],profile=args.profile??createAIProfile("PROFESSIONAL"),fieldWidth=right-left;
  let best:GoalkeeperDistribution|null=null;
  for(let index=teamStart;index<teamEnd;index++){
    if(index===keeperIndex||players[index]?.role==="ARQ")continue;
    const teammate=players[index],distanceToMate=distance(keeper,teammate);if(distanceToMate<55)continue;
    const travelTime=distanceToMate/passForceForDistance(distanceToMate),targetPosition={x:clamp(teammate.x+teammate.vx*Math.min(.42,travelTime),left+28,right-28),y:clamp(teammate.y+teammate.vy*Math.min(.42,travelTime),top+28,bottom-28)};
    const lane=passingLaneQuality(keeper.x,keeper.y,targetPosition.x,targetPosition.y,players,opponentStart,opponentEnd,profile),interceptionRisk=1-lane;
    let nearestPressure=Infinity;for(let opponent=opponentStart;opponent<opponentEnd;opponent++)nearestPressure=Math.min(nearestPressure,distance(teammate,players[opponent]));
    const teammateSpace=clamp(nearestPressure/180,0,1),safeDistance=1-clamp(Math.abs(distanceToMate-fieldWidth*.17)/(fieldWidth*.2),0,1),bodySpeed=Math.hypot(teammate.vx,teammate.vy),bodyOrientation=bodySpeed<12?.7:clamp((teammate.vx/bodySpeed)*direction*.5+.5,0,1),tacticalSupport=teammate.role==="DEF"?1:teammate.role==="MED"?.78:.42,forwardProgress=clamp((teammate.x-keeper.x)*direction/Math.max(1,fieldWidth),-.2,.6),immediatePressure=1-teammateSpace;
    const score=lane*3+teammateSpace*2.5+safeDistance*1.5+bodyOrientation+tacticalSupport*1.5+forwardProgress*.7-interceptionRisk*4-immediatePressure*2.5;
    if(interceptionRisk>.49||immediatePressure>.78)continue;
    const candidate:GoalkeeperDistribution={type:"PASS",target:index,targetPosition,score,interceptionRisk};if(!best||candidate.score>best.score)best=candidate;
  }
  if(best)return best;
  const safeZones=[top+(bottom-top)*.22,bottom-(bottom-top)*.22].map(y=>({x:clamp(keeper.x+direction*fieldWidth*.38,left+35,right-35),y}));
  let target=safeZones[0],space=-Infinity;
  for(const zone of safeZones){const available=nearestOpponentDistance(zone.x,zone.y,players,opponentStart,opponentEnd);if(available>space){space=available;target=zone}}
  return{type:"CLEAR",target:null,targetPosition:target,score:space*.01,interceptionRisk:clamp(1-space/260,0,1)};
}

export function goalkeeperSaveOutcome(keeper:AIPlayer,ballSpeed:number,pressure:number,rng:()=>number=Math.random){
  const quality=clamp((keeper.rating-70)/25,0,1),catchChance=clamp(.78+quality*.16-ballSpeed/1150-pressure*.09,.12,.9);
  return rng()<catchChance?"CATCH" as const:"PARRY" as const;
}

export function shotTarget(carrier:AIPlayer,goalX:number,goalY:number,top:number,bottom:number,profile:AIProfile,rng:()=>number=Math.random){
  const lanes=[goalY-38,goalY+38,goalY],personality=playerPersonality(carrier),lane=lanes[Math.min(2,Math.floor(rng()*3))];
  const error=(rng()-.5)*42*(1-profile.shotAccuracy)*2.2*(1-(carrier.rating-70)/80);
  return {x:goalX,y:clamp(lane+error,top+30,bottom-30),quality:personality.shotBias};
}

// Kept as a compatibility reference while saved replays migrate to tactical slots.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function legacyUpdateTeamBlackboard(board:TeamBlackboard,args:{
  now:number;owner:number|null;players:AIPlayer[];ball:AIBall;teamStart:number;teamEnd:number;opponentStart:number;opponentEnd:number;
  left:number;right:number;top:number;bottom:number;goalY:number;profile:AIProfile;force?:boolean;
}){
  const {now,owner,players,ball,teamStart,teamEnd,opponentStart,opponentEnd,left,right,goalY,profile}=args;
  const carrierChanged=board.ballCarrier!==owner,hasPossession=owner!==null&&players[owner]?.team===board.team;
  if(!args.force&&!carrierChanged&&now<board.nextTickAt)return board;
  board.nextTickAt=now+clamp(profile.decisionInterval*.28,50,100);
  board.possessionTeam=owner===null?null:players[owner]?.team??null;
  board.ballCarrier=hasPossession?owner:null;
  board.roles={};
  const teammates=Array.from({length:teamEnd-teamStart},(_,offset)=>teamStart+offset);
  const opponents=Array.from({length:opponentEnd-opponentStart},(_,offset)=>opponentStart+offset);
  const direction=board.attackingDirection,ownGoalX=direction>0?left:right;
  if(hasPossession&&owner!==null){
    const carrier=players[owner],pressure=pressureAround(carrier.x,carrier.y,players,opponentStart,opponentEnd,132).count;
    board.pressureLevel=pressure;
    if(carrierChanged||board.possessionStartedAt===0){board.possessionStartedAt=now;board.lastProgressAt=now;board.furthestProgress=carrier.x*direction}
    const currentProgress=carrier.x*direction;if(currentProgress>board.furthestProgress+38){board.furthestProgress=currentProgress;board.lastProgressAt=now}
    const stalledFor=Math.max(0,now-board.lastProgressAt),heldFor=Math.max(0,now-board.possessionStartedAt);
    const situationalUrgency=clamp(Math.max(stalledFor/8000,heldFor/12000),0,1);
    board.attackingUrgency=clamp(profile.attackingUrgency*.68+situationalUrgency*.32,0,1);
    board.teamPhase=phaseForCarrier(carrier,direction,left,right,pressure);
    board.roles[owner]="BALL_CARRIER";
    const used=new Set<number>([owner]),available=teammates.filter(i=>i!==owner);
    const progressOf=(p:AIPlayer)=>(p.x-carrier.x)*direction;
    const receiver=bestRoleCandidate(available,players,p=>{
      const open=nearestOpponentDistance(p.x,p.y,players,opponentStart,opponentEnd),progress=progressOf(p),central=120-Math.abs(p.y-goalY)*.18;
      return open*(.28+profile.passVision*.24)+progress*(.45+board.attackingUrgency*.9)+central*profile.tacticalAwareness+(p.role==="MED"?25:0);
    },used);
    const runner=bestRoleCandidate(available,players,p=>progressOf(p)*1.05+nearestOpponentDistance(p.x,p.y,players,opponentStart,opponentEnd)*.35+(p.role==="DEL"||p.role==="EXT"?70:0),used);
    const support=bestRoleCandidate(available,players,p=>-distance(p,carrier)*.45+nearestOpponentDistance(p.x,p.y,players,opponentStart,opponentEnd)*.4+(p.role==="MED"?55:0),used);
    const width=bestRoleCandidate(available,players,p=>Math.abs(p.y-goalY)*.72+nearestOpponentDistance(p.x,p.y,players,opponentStart,opponentEnd)*.25+(p.role==="EXT"?60:0),used);
    const cover=bestRoleCandidate(available,players,p=>-Math.abs(p.x-ownGoalX)*.8+(p.role==="DEF"||p.role==="ARQ"?95:0),used);
    board.primaryRunner=runner;board.supportRunner=support;board.widthPlayer=width;board.defensiveCover=cover;
    if(receiver>=0)board.roles[receiver]="PRIMARY_RECEIVER";
    if(runner>=0)board.roles[runner]=board.teamPhase==="FINAL_THIRD"||board.teamPhase==="CHANCE_CREATION"||board.teamPhase==="SHOOTING"?"FINISHER":"RUNNER";
    if(support>=0)board.roles[support]="SUPPORT";
    if(width>=0)board.roles[width]="WIDTH";
    if(cover>=0)board.roles[cover]="COVER";
    for(const index of teammates)if(!board.roles[index])board.roles[index]="SHAPE";
    if(carrierChanged||!board.currentPlay){
      const participants=[owner,...[receiver,runner,support].filter(i=>i>=0)],steps:PlannedAction[]=[];
      if(receiver>=0)steps.push({type:"PASS",from:owner,to:receiver,target:{x:players[receiver].x,y:players[receiver].y}});
      if(profile.combinationPlay>=.4&&runner>=0)steps.push({type:"RUN",from:runner,to:runner,target:{x:clamp(players[runner].x+direction*130,left+25,right-25),y:players[runner].y}});
      if(profile.combinationPlay>=.6&&receiver>=0&&runner>=0)steps.push({type:"PASS",from:receiver,to:runner,target:{x:clamp(players[runner].x+direction*85,left+25,right-25),y:players[runner].y}});
      board.currentPlay={id:Math.floor(now*10)+board.team,type:board.teamPhase==="BUILD_UP"?"SAFE_BUILD_UP":board.teamPhase==="FINAL_THIRD"||board.teamPhase==="CHANCE_CREATION"?"THROUGH_BALL_ATTACK":"PROGRESSIVE_ATTACK",stage:0,participants,steps};
    }
  }else{
    const justLost=board.possessionStartedAt>0&&now-board.lastProgressAt<900;
    board.teamPhase=justLost?"DEFENSIVE_TRANSITION":"DEFENDING";board.attackingUrgency=0;board.pressureLevel=0;board.possessionStartedAt=0;board.currentPlay=null;
    const used=new Set<number>();
    const chaser=bestRoleCandidate(teammates,players,p=>-distance(p,ball),used);
    const cover=bestRoleCandidate(teammates,players,p=>-Math.abs(p.x-ownGoalX)*.75+(p.role==="DEF"||p.role==="ARQ"?100:0),used);
    if(chaser>=0)board.roles[chaser]="CHASER";if(cover>=0)board.roles[cover]="COVER";
    for(const index of teammates)if(!board.roles[index]){
      const threat=opponents.reduce((best,i)=>Math.abs(players[i].x-ownGoalX)<Math.abs(players[best].x-ownGoalX)?i:best,opponents[0]);
      board.roles[index]=threat===undefined?"SHAPE":"SUPPORT";
    }
    board.primaryRunner=-1;board.supportRunner=-1;board.widthPlayer=-1;board.defensiveCover=cover;
  }
  if(board.passIntent&&board.passIntent.expiresAt<now)board.passIntent=null;
  return board;
}

export function updateTeamBlackboard(board:TeamBlackboard,args:{
  now:number;owner:number|null;players:AIPlayer[];ball:AIBall;teamStart:number;teamEnd:number;opponentStart:number;opponentEnd:number;
  left:number;right:number;top:number;bottom:number;goalY:number;profile:AIProfile;force?:boolean;
  basePositions?:Record<number,{x:number;y:number}>;structureDiscipline?:number;rotationFreedom?:number;
}){
  const {now,owner,players,ball,teamStart,teamEnd,opponentStart,opponentEnd,left,right,top,bottom,goalY,profile}=args;
  const observedPossession=owner===null?null:players[owner]?.team??null;
  const hasPossession=owner!==null&&players[owner]?.team===board.team,carrierChanged=hasPossession&&board.lastCarrier!==owner;
  const possessionChanged=observedPossession!==board.lastPossessionTeam,criticalEvent=carrierChanged||possessionChanged;
  if(!args.force&&!criticalEvent&&now<board.nextTickAt)return board;
  // Collective thought is intentionally slower than rendering and movement.
  // Critical events still bypass the timer immediately.
  board.nextTickAt=now+clamp(profile.decisionInterval*.75,150,280);
  board.possessionTeam=observedPossession;board.lastPossessionTeam=observedPossession;
  if(!args.force&&!criticalEvent&&now<board.responsibilityLockedUntil){
    if(board.passIntent&&board.passIntent.expiresAt<now)board.passIntent=null;
    return board;
  }
  const previousRoles={...board.roles},previousPrimary=board.primaryPresser;
  board.ballCarrier=hasPossession?owner:null;board.roles={};board.tacticalSlots={};
  const teammates=Array.from({length:teamEnd-teamStart},(_,offset)=>teamStart+offset),direction=board.attackingDirection;
  if(args.basePositions)board.baseFormationPositions={...args.basePositions};
  const ownGoalX=direction>0?left:right,fieldMid=(left+right)/2,fieldWidth=right-left,fieldHeight=bottom-top;
  const discipline=clamp(args.structureDiscipline??.75,.35,.95),rotationFreedom=clamp(args.rotationFreedom??.65,.35,1);
  const horizontalFactor=.24-discipline*.08,verticalFactor=.21-discipline*.07;
  const teamShiftX=clamp((ball.x-fieldMid)*horizontalFactor,-fieldWidth*(.08+rotationFreedom*.035),fieldWidth*(.08+rotationFreedom*.035));
  const teamShiftY=clamp((ball.y-goalY)*verticalFactor,-fieldHeight*(.07+rotationFreedom*.025),fieldHeight*(.07+rotationFreedom*.025));
  board.blockShift={x:teamShiftX,y:teamShiftY};
  const spacingRatio=teammates.length===4?.09:teammates.length===5?.10:teammates.length>=6?.095:.085;
  const minimumTacticalDistance=fieldWidth*spacingRatio;
  const inBounds=(x:number,y:number)=>({x:clamp(x,left+26,right-26),y:clamp(y,top+28,bottom-28)});
  const defenders=teammates.filter(i=>players[i].role==="DEF"||players[i].role==="ARQ");
  const lineSource=(defenders.length?defenders:teammates).map(i=>players[i].x).sort((a,b)=>a-b);
  board.defensiveLineX=lineSource.length?lineSource[Math.floor(lineSource.length/2)]:ownGoalX+direction*fieldWidth*.17;

  if(hasPossession&&owner!==null){
    const carrier=players[owner],progress=direction>0?(carrier.x-left)/fieldWidth:(right-carrier.x)/fieldWidth;
    const pressure=pressureAround(carrier.x,carrier.y,players,opponentStart,opponentEnd,132).count;
    board.pressureLevel=pressure;board.teamPhase=phaseForCarrier(carrier,direction,left,right,pressure);
    if(board.possessionStartedAt===0){board.possessionStartedAt=now;board.lastProgressAt=now;board.furthestProgress=carrier.x*direction;board.progressivePasses=0}
    if(carrierChanged&&board.lastCarrier!==null){
      const previous=players[board.lastCarrier];
      if(previous&&(carrier.x-previous.x)*direction>28){board.progressivePasses++;board.attackMomentum=clamp(board.attackMomentum+.13,0,1)}
    }
    const currentProgress=carrier.x*direction;
    if(currentProgress>board.furthestProgress+28){board.furthestProgress=currentProgress;board.lastProgressAt=now;board.attackMomentum=clamp(board.attackMomentum+.045,0,1)}
    const stalledFor=now-board.lastProgressAt,heldFor=now-board.possessionStartedAt;
    board.attackMomentum=clamp(board.attackMomentum+(progress>.7?.035:.006)-(stalledFor>6500?.012:0),0,1);
    board.attackingUrgency=clamp(profile.attackingUrgency*.57+Math.min(1,heldFor/8000)*.18+Math.min(1,stalledFor/7000)*.15+board.attackMomentum*.25,0,1);
    board.primaryPresser=-1;board.secondaryPresser=-1;board.roles[owner]="BALL_CARRIER";
    board.tacticalSlots[owner]={kind:"BALL_CARRIER",x:carrier.x,y:carrier.y};

    const used=new Set<number>([owner]),available=teammates.filter(i=>i!==owner);
    const crowdingAt=(candidate:number)=>available.reduce((sum,i)=>i===candidate?sum:sum+Math.max(0,70-distance(players[candidate],players[i]))/70,0);
    const scoreCandidate=(i:number,kind:"receiver"|"depth"|"support"|"width"|"cover")=>{
      const p=players[i],ahead=(p.x-carrier.x)*direction,open=nearestOpponentDistance(p.x,p.y,players,opponentStart,opponentEnd);
      const lane=passingLaneQuality(carrier.x,carrier.y,p.x,p.y,players,opponentStart,opponentEnd,profile),personality=playerPersonality(p);
      const expectedRole:TeamRole=kind==="depth"?"RUNNER":kind==="support"?"SUPPORT":kind==="width"?"WIDTH":kind==="cover"?"COVER":"PRIMARY_RECEIVER";
      const stabilityBonus=previousRoles[i]===expectedRole||expectedRole==="RUNNER"&&previousRoles[i]==="FINISHER"?64:0;
      const crowdPenalty=crowdingAt(i)*3*38,laneBonus=lane*2.2*38;
      if(kind==="depth")return ahead*1.25+open*.32+personality.runBias*92+(p.role==="DEL"||p.role==="EXT"?64:0)-crowdPenalty+laneBonus+stabilityBonus;
      if(kind==="support")return -Math.abs(distance(p,carrier)-112)*.52+open*.34+personality.passBias*58-crowdPenalty+laneBonus+stabilityBonus;
      if(kind==="width")return Math.abs(p.y-goalY)*.62+open*.26+(p.role==="EXT"?72:0)-crowdPenalty+laneBonus+stabilityBonus;
      if(kind==="cover")return -Math.abs(p.x-ownGoalX)*.55+(p.role==="DEF"||p.role==="ARQ"?115:0)-crowdPenalty+stabilityBonus;
      return ahead*(.52+board.attackingUrgency*.72)+open*.34+personality.passBias*56-crowdPenalty+laneBonus+stabilityBonus;
    };
    const receiver=bestRoleCandidate(available,players,(_,i)=>scoreCandidate(i,"receiver"),used);
    const runner=bestRoleCandidate(available,players,(_,i)=>scoreCandidate(i,"depth"),used);
    const support=bestRoleCandidate(available,players,(_,i)=>scoreCandidate(i,"support"),used);
    const cover=bestRoleCandidate(available,players,(_,i)=>scoreCandidate(i,"cover"),used);
    const width=bestRoleCandidate(available,players,(_,i)=>scoreCandidate(i,"width"),used);
    board.primaryRunner=runner;board.supportRunner=support;board.widthPlayer=width;board.defensiveCover=cover;
    const supportSign=(carrier.y<goalY?1:-1),finalThird=progress>.69;
    const slotDepth=145+board.attackMomentum*85+(finalThird?45:0);
    const slots:Array<[number,TeamRole,TacticalSlotKind,number,number]>=[];
    if(receiver>=0)slots.push([receiver,"PRIMARY_RECEIVER",receiver===runner?"DEPTH":"RIGHT_SUPPORT",carrier.x+direction*(finalThird?82:54),carrier.y+supportSign*102]);
    if(runner>=0)slots.push([runner,finalThird?"FINISHER":"RUNNER","DEPTH",carrier.x+direction*slotDepth,carrier.y+(players[runner].y-goalY)*.42]);
    if(support>=0)slots.push([support,"SUPPORT","LEFT_SUPPORT",carrier.x-direction*68,carrier.y-supportSign*104]);
    if(width>=0)slots.push([width,"WIDTH","RIGHT_SUPPORT",carrier.x+direction*42,players[width].y<goalY?top+58:bottom-58]);
    if(cover>=0)slots.push([cover,"COVER","COVERAGE",carrier.x-direction*(138+board.attackMomentum*24),goalY+(players[cover].y-goalY)*.55]);
    const reserved=[{x:carrier.x,y:carrier.y}];
    for(const [index,role,kind,x,y] of slots){
      const raw=inBounds(x+teamShiftX*.18,y+teamShiftY*.34),point=reserveTacticalPoint(raw,reserved,minimumTacticalDistance,top,bottom);
      reserved.push(point);board.roles[index]=role;board.tacticalSlots[index]={kind,x:point.x,y:point.y};
    }
    for(const index of teammates)if(!board.roles[index]){
      board.roles[index]="SHAPE";const p=players[index],base=board.baseFormationPositions[index]??p,point=inBounds(base.x+teamShiftX,base.y+teamShiftY);board.tacticalSlots[index]={kind:"LINE_COVER",x:point.x,y:point.y};
    }
    if(carrierChanged||!board.currentPlay){
      const participants=[owner,...[receiver,runner,support].filter(i=>i>=0)],steps:PlannedAction[]=[];
      if(receiver>=0)steps.push({type:"PASS",from:owner,to:receiver,target:{x:board.tacticalSlots[receiver].x,y:board.tacticalSlots[receiver].y}});
      if(runner>=0)steps.push({type:"RUN",from:runner,to:runner,target:{x:board.tacticalSlots[runner].x,y:board.tacticalSlots[runner].y}});
      if(receiver>=0&&runner>=0&&profile.combinationPlay>.42)steps.push({type:"PASS",from:receiver,to:runner,target:{x:board.tacticalSlots[runner].x,y:board.tacticalSlots[runner].y}});
      board.currentPlay={id:Math.floor(now*10)+board.team,type:finalThird?"THROUGH_BALL_ATTACK":board.teamPhase==="BUILD_UP"?"SAFE_BUILD_UP":"PROGRESSIVE_ATTACK",stage:0,participants,steps};
    }
    board.responsibilityLockedUntil=now+clamp(420-profile.tacticalAwareness*130,250,370);
    board.lastCarrier=owner;
  }else{
    if(board.possessionStartedAt>0)board.attackMomentum=clamp(board.attackMomentum*.55,0,1);
    board.teamPhase=board.possessionStartedAt>0?"DEFENSIVE_TRANSITION":"DEFENDING";board.attackingUrgency=0;board.possessionStartedAt=0;board.currentPlay=null;board.lastCarrier=null;
    const candidates=teammates.filter(i=>players[i].role!=="ARQ"),used=new Set<number>();
    const pressureCandidates=candidates.length?candidates:teammates;
    let primary=bestRoleCandidate(pressureCandidates,players,(_,i)=>defensivePressureScore(i,players,ball,teammates,ownGoalX,goalY,direction),used);
    if(previousPrimary>=teamStart&&previousPrimary<teamEnd&&players[previousPrimary].role!=="ARQ"&&now<board.presserLockedUntil){
      const oldScore=defensivePressureScore(previousPrimary,players,ball,teammates,ownGoalX,goalY,direction);
      const bestScore=primary>=0?defensivePressureScore(primary,players,ball,teammates,ownGoalX,goalY,direction):-Infinity;
      if(oldScore>=bestScore-72){used.delete(primary);primary=previousPrimary;used.add(primary)}
    }
    const secondary=bestRoleCandidate(candidates.length?candidates:teammates,players,p=>{
      const lane=pointToSegment(p.x,p.y,ball.x,ball.y,fieldMid,goalY);return -lane.distance*.8-distance(p,ball)*.22+playerPersonality(p).positioning*45;
    },used);
    const cover=bestRoleCandidate(teammates,players,p=>-Math.abs(p.x-ownGoalX)+(p.role==="DEF"||p.role==="ARQ"?120:0),used);
    board.primaryPresser=primary;board.secondaryPresser=secondary;board.defensiveCover=cover;
    const reserved:Array<{x:number;y:number}>=[];
    if(primary>=0){board.roles[primary]="CHASER";const point=inBounds(ball.x-direction*14,ball.y);reserved.push(point);board.tacticalSlots[primary]={kind:"PRIMARY_PRESSER",...point}}
    if(secondary>=0){board.roles[secondary]="SUPPORT";const exitY=ball.y<goalY?ball.y+72:ball.y-72,raw=inBounds(ball.x-direction*62,exitY),point=reserveTacticalPoint(raw,reserved,minimumTacticalDistance*.82,top,bottom);reserved.push(point);board.tacticalSlots[secondary]={kind:"SECONDARY_PRESSER",...point}}
    if(cover>=0){const coverBase=board.baseFormationPositions[cover]??players[cover];board.roles[cover]="COVER";const raw=inBounds(coverBase.x+teamShiftX*.24,coverBase.y+teamShiftY*.34),point=reserveTacticalPoint(raw,reserved,minimumTacticalDistance*.82,top,bottom);reserved.push(point);board.tacticalSlots[cover]={kind:players[cover].role==="ARQ"?"GOALKEEPER":"LINE_COVER",...point}}
    for(const index of teammates)if(!board.roles[index]){
      board.roles[index]="SHAPE";const p=players[index],base=board.baseFormationPositions[index]??p;
      const lineClamp=ownGoalX+direction*(p.role==="DEF"?fieldWidth*.18:p.role==="MED"?fieldWidth*.31:fieldWidth*.43);
      const shiftedX=base.x+teamShiftX*(p.role==="DEL"||p.role==="EXT"?.72:.48),structuredX=direction>0?Math.min(shiftedX,lineClamp):Math.max(shiftedX,lineClamp);
      const raw=inBounds(structuredX,base.y+teamShiftY),point=reserveTacticalPoint(raw,reserved,minimumTacticalDistance*.82,top,bottom);reserved.push(point);board.tacticalSlots[index]={kind:p.role==="ARQ"?"GOALKEEPER":"LINE_COVER",...point};
    }
    board.presserLockedUntil=primary===previousPrimary&&board.presserLockedUntil>now?board.presserLockedUntil:now+clamp(760-profile.tacticalAwareness*180,480,700);
    board.responsibilityLockedUntil=now+clamp(420-profile.tacticalAwareness*130,250,370);
    board.primaryRunner=-1;board.supportRunner=-1;board.widthPlayer=-1;
  }
  if(board.passIntent&&board.passIntent.expiresAt<now)board.passIntent=null;
  return board;
}

export function createPassIntent(args:{from:number;to:number;targetPosition:{x:number;y:number};passDistance:number;force:number;now:number;human:boolean;receptionMode?:ReceptionMode;nextAction?:OrientedAction;postPassMovement?:PostPassMovement;plan?:PassPlan}){
  const arrivalTime=args.plan?.desiredArrivalTime??clamp(args.passDistance/Math.max(1,args.force),.24,1.4);
  return {type:"PASS_INTENT" as const,from:args.from,to:args.to,targetPosition:args.plan?.targetPoint??args.targetPosition,force:args.plan?Math.hypot(args.plan.initialVelocity.x,args.plan.initialVelocity.y):args.force,createdAt:args.now,executeAt:args.now+68,arrivalTime,expiresAt:args.now+1800,executed:false,human:args.human,receptionMode:args.receptionMode??"RECEIVE_TO_FEET",nextAction:args.nextAction??"PASS",postPassMovement:args.postPassMovement??"SUPPORT",plan:args.plan};
}

export function chooseHumanPass(args:{carrierIndex:number;players:AIPlayer[];ball:AIBall;teamStart:number;teamEnd:number;opponentStart:number;opponentEnd:number;direction:1|-1;moveX:number;moveY:number;through:boolean;aerial:boolean;left:number;right:number;top:number;bottom:number}){
  const {carrierIndex,players,ball,teamStart,teamEnd,opponentStart,opponentEnd,direction,left,right,top,bottom}=args,carrier=players[carrierIndex];
  const inputLength=Math.hypot(args.moveX,args.moveY),inputX=inputLength?args.moveX/inputLength:direction,inputY=inputLength?args.moveY/inputLength:0,profile=createAIProfile("PROFESSIONAL");
  let best:{target:number;aimX:number;aimY:number;force:number;distance:number;score:number}|null=null;
  for(let i=teamStart;i<teamEnd;i++){
    if(i===carrierIndex)continue;
    const receiver=players[i],dx=receiver.x-carrier.x,dy=receiver.y-carrier.y,distanceToMate=Math.hypot(dx,dy);if(distanceToMate<42)continue;
    const alignment=(dx/(distanceToMate||1))*inputX+(dy/(distanceToMate||1))*inputY,kind=args.through?"through":args.aerial?"aerial":"normal";
    const initialForce=passForceForDistance(distanceToMate,kind),travelTime=distanceToMate/initialForce,lead=args.through?42:18;
    const aimX=clamp(receiver.x+receiver.vx*travelTime+direction*lead,left+24,right-24),aimY=clamp(receiver.y+receiver.vy*travelTime,top+24,bottom-24);
    const targetDistance=Math.hypot(aimX-ball.x,aimY-ball.y),force=passForceForDistance(targetDistance,kind),open=nearestOpponentDistance(receiver.x,receiver.y,players,opponentStart,opponentEnd),risk=laneRisk(ball.x,ball.y,aimX,aimY,force,players,opponentStart,opponentEnd,profile),progress=dx*direction;
    const score=alignment*105+open*.42+progress*.28-risk*1.55-distanceToMate*.035;
    if(!best||score>best.score)best={target:i,aimX,aimY,force,distance:targetDistance,score};
  }
  return best;
}

function bestCarryTarget(ctx:DecisionContext){
  const {players,carrierIndex,opponentStart,opponentEnd,direction,left,right,top,bottom}=ctx,carrier=players[carrierIndex];
  const candidates=[0,-.62,.62,-1.05,1.05].map(angle=>{
    const length=105,dx=Math.cos(angle)*direction*length,dy=Math.sin(angle)*length;
    const x=clamp(carrier.x+dx,left+30,right-30),y=clamp(carrier.y+dy,top+30,bottom-30);
    const space=nearestOpponentDistance(x,y,players,opponentStart,opponentEnd);
    const widthPenalty=(y<top+42||y>bottom-42)?55:0;
    return {x,y,score:space*.68+Math.abs(x-carrier.x)*.34-widthPenalty};
  });
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0];
}

export function chooseCarrierDecision(ctx:DecisionContext):CarrierDecision{
  const {carrierIndex,players,ball,teamStart,teamEnd,opponentStart,opponentEnd,direction,left,right,top,bottom,goalY,profile,combination}=ctx;
  const carrier=players[carrierIndex],goalX=direction>0?right+76:left-76;
  const phase=ctx.teamPhase??"PROGRESSION",urgency=Math.max(ctx.attackingUrgency??0,profile.attackingUrgency*.62),finalThird=phase==="FINAL_THIRD"||phase==="CHANCE_CREATION"||phase==="SHOOTING";
  const pressure=pressureAround(carrier.x,carrier.y,players,opponentStart,opponentEnd,135);
  const congestion=pressureAround(carrier.x,carrier.y,players,opponentStart,opponentEnd,210).count;
  const carrierPersonality=playerPersonality(carrier);
  const options:Array<CarrierDecision&{safety:number;progress:number}> = [];
  for(let i=teamStart;i<teamEnd;i++){
    if(i===carrierIndex)continue;
    const receiver=players[i],passDistance=distance(carrier,receiver);
    if(passDistance<45)continue;
    const progress=(receiver.x-carrier.x)*direction;
    const firstForce=passForceForDistance(passDistance),travelTime=passDistance/firstForce,predictionWindow=Math.min(travelTime,profile.anticipationTime);
    const futureX=receiver.x+receiver.vx*predictionWindow,futureY=receiver.y+receiver.vy*predictionWindow;
    const candidatePoints=[{x:futureX,y:futureY,space:0},{x:futureX+direction*(18+urgency*38),y:futureY,space:12+urgency*28}];
    if(profile.passVision>=.72)candidatePoints.push({x:futureX+direction*38,y:futureY-34,space:22},{x:futureX+direction*38,y:futureY+34,space:22});
    if(profile.passVision>=.88)candidatePoints.push({x:futureX+direction*58,y:goalY+(futureY-goalY)*.48,space:34});
    const receivingPoints=candidatePoints.map(point=>({x:clamp(point.x,left+24,right-24),y:clamp(point.y,top+24,bottom-24),bonus:point.space}));
    let aimX=receiver.x,aimY=receiver.y,bestPoint=-Infinity;
    for(const point of receivingPoints){const open=nearestOpponentDistance(point.x,point.y,players,opponentStart,opponentEnd),pointProgress=(point.x-receiver.x)*direction,shooting=Math.abs(goalX-point.x)<(right-left)*.24?75:0,risk=laneRisk(ball.x,ball.y,point.x,point.y,firstForce,players,opponentStart,opponentEnd,profile),pointScore=open*(.28+profile.passVision*.28)+pointProgress*(.42+urgency*.82)+shooting*(finalThird?1.7:1)*profile.tacticalAwareness+point.bonus-risk*(.92+profile.tacticalAwareness*.48);if(pointScore>bestPoint){bestPoint=pointScore;aimX=point.x;aimY=point.y}}
    const targetDistance=Math.hypot(aimX-ball.x,aimY-ball.y),force=passForceForDistance(targetDistance);
    const risk=laneRisk(ball.x,ball.y,aimX,aimY,force,players,opponentStart,opponentEnd,profile);
    const openness=nearestOpponentDistance(receiver.x,receiver.y,players,opponentStart,opponentEnd);
    const diagonal=Math.min(100,Math.abs(receiver.y-carrier.y))*.22;
    const switchBonus=congestion>1?Math.min(120,Math.abs(receiver.y-carrier.y))*.42:0;
    const backwardSafety=progress<0&&pressure.nearest<115?42:0,backwardPenalty=progress<0?(18+urgency*70+(finalThird?75:0)):0;
    const roleBonus=(receiver.role==="DEL"||receiver.role==="EXT")&&progress>0?24:receiver.role==="MED"?12:0;
    const returnPass=combination&&combination.receiver===carrierIndex&&combination.passer===i&&combination.until>0;
    const receiverPersonality=playerPersonality(receiver),intoSpace=(aimX-receiver.x)*direction>26;
    const receptionMode:ReceptionMode=intoSpace&&progress>18?"RUN_IN_BEHIND":progress<0?"SUPPORT":"RECEIVE_TO_FEET";
    const nextAction:OrientedAction=finalThird&&Math.abs(goalX-aimX)<(right-left)*.22?"SHOOT":receiverPersonality.driveBias>.7&&openness>135?"DRIVE":"PASS";
    const postPassMovement=choosePostPassMovement(carrier,direction,finalThird);
    let score=openness*(.22+profile.passVision*.22)+progress*(.34+urgency*.72+(finalThird?.42:0))+diagonal+switchBonus*profile.tacticalAwareness+backwardSafety+roleBonus+bestPoint*.24-risk*(1.1+profile.tacticalAwareness*.45)-backwardPenalty+(Math.random()-.5)*profile.mistakeChance*46+(returnPass?65+profile.combinationPlay*84:0)+receiverPersonality.runBias*(receptionMode==="RUN_IN_BEHIND"?70:14);
    if(finalThird){score+=(progress>0?progress*.6:progress*.55)+ (receptionMode==="RUN_IN_BEHIND"?92:0);if(progress<0)score*=.45}
    options.push({type:"pass",score,target:i,aimX,aimY,force,oneTwo:!!returnPass,receptionMode,nextAction,postPassMovement,safety:openness-risk,progress});
  }
  options.sort((a,b)=>b.score-a.score);
  const bestPass=options[0];
  const goalDistance=Math.abs(goalX-carrier.x),shotForce=clamp(500+goalDistance*.18,520,760),targetLane=shotTarget(carrier,goalX,goalY,top,bottom,profile);
  const shotRisk=laneRisk(ball.x,ball.y,targetLane.x,targetLane.y,shotForce,players,opponentStart,opponentEnd,profile);
  const angleQuality=1-clamp(Math.abs(carrier.y-goalY)/((bottom-top)*.48),0,1);
  const shootRange=(right-left)*(.2+profile.tacticalAwareness*.12);
  const openGoal=Math.max(0,165-shotRisk),goodShotAngle=angleQuality>.42;
  let shootScore=goalDistance<shootRange?150+angleQuality*2*70+openGoal*3-shotRisk*2-goalDistance*.12+carrierPersonality.shotBias*95:-Infinity;
  if(finalThird)shootScore*=phase==="SHOOTING"&&goodShotAngle?3:2;
  const carry=bestCarryTarget(ctx),forwardSpace=nearestOpponentDistance(carry.x,carry.y,players,opponentStart,opponentEnd);
  const carryScore=carry.score+(forwardSpace>100?95:0)+(pressure.nearest>150?55:0)-pressure.count*(50+profile.tacticalAwareness*12)+urgency*72+(finalThird?45:0)+carrierPersonality.driveBias*70;
  let passScore=bestPass?bestPass.score+profile.passBias*78*carrierPersonality.passBias+(pressure.nearest<120?70:0)+urgency*Math.max(0,bestPass.progress)*.58: -Infinity;
  if(bestPass&&bestPass.safety<15)passScore-=95;
  const actions:CarrierDecision[]=[{type:"carry",score:carryScore,aimX:carry.x,aimY:carry.y}];
  if(bestPass&&Number.isFinite(passScore))actions.push({...bestPass,score:passScore});
  if(Number.isFinite(shootScore))actions.push({type:"shoot",score:shootScore,aimX:targetLane.x,aimY:targetLane.y,force:shotForce});
  const choice=chooseActionByDifficulty(actions,profile);
  if(choice.type==="shoot"){
    const error=(Math.random()-.5)*(bottom-top)*(1-profile.shotAccuracy)*.34;
    return {...choice,aimY:clamp(choice.aimY+error,top+32,bottom-32)};
  }
  if(choice.type==="pass"){
    const missRadius=(1-profile.passAccuracy)*Math.max(18,Math.hypot(choice.aimX-ball.x,choice.aimY-ball.y)*.18),angle=Math.random()*Math.PI*2;
    return {...choice,aimX:clamp(choice.aimX+Math.cos(angle)*missRadius,left+24,right-24),aimY:clamp(choice.aimY+Math.sin(angle)*missRadius,top+24,bottom-24)};
  }
  return choice;
}

export function predictInterception(player:AIPlayer,ball:AIBall,profile:AIProfile,bounds:{left:number;right:number;top:number;bottom:number}){
  const speedSq=ball.vx*ball.vx+ball.vy*ball.vy;
  if(speedSq<90*90)return null;
  const rawTime=((player.x-ball.x)*ball.vx+(player.y-ball.y)*ball.vy)/speedSq;
  const time=clamp(rawTime,.08,profile.anticipationTime);
  const x=clamp(ball.x+ball.vx*time,bounds.left+24,bounds.right-24),y=clamp(ball.y+ball.vy*time,bounds.top+24,bounds.bottom-24);
  const required=Math.hypot(x-player.x,y-player.y),reachable=178*time+25+profile.interceptionSkill*20;
  return required<reachable?{x,y,time}:null;
}

export function chooseDangerousOpponent(player:AIPlayer,players:AIPlayer[],start:number,end:number,ownGoalX:number,goalY:number,profile:AIProfile=createAIProfile("MEDIUM")){
  let best=start,bestScore=-Infinity;
  for(let i=start;i<end;i++){
    const opponent=players[i],lead=profile.anticipationTime*profile.markingSkill,predicted={x:opponent.x+opponent.vx*lead,y:opponent.y+opponent.vy*lead},goalThreat=700-Math.abs(predicted.x-ownGoalX),central=160-Math.abs(predicted.y-goalY),free=distance(player,predicted)<230?30:70;
    const score=goalThreat*(.5+profile.markingSkill*.24)+central*.22+free+(opponent.role==="DEL"||opponent.role==="EXT"?35:0);
    if(score>bestScore){bestScore=score;best=i}
  }
  return best;
}

export function clampTarget(x:number,y:number,bounds:{left:number;right:number;top:number;bottom:number}){
  return {x:clamp(x,bounds.left+24,bounds.right-24),y:clamp(y,bounds.top+24,bounds.bottom-24)};
}
