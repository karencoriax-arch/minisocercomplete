export type PassVector = {x:number;y:number};
export type PassFormat = 4|5|6;
export type GroundPassType = "SHORT"|"MEDIUM"|"LONG"|"THROUGH"|"FREE";
export type PassAssistMode = "ASSISTED"|"SEMI"|"MANUAL";

export type PassPlayer = PassVector&{
  vx:number;vy:number;r:number;team:0|1;rating:number;role:string;
};

export type PassAttributes = {
  passing:number;vision:number;control:number;composure:number;
};

export type PassSelection = {
  receiverIndex:number|null;
  confidence:number;
  userIntentDirection:PassVector;
  receiverLocked:boolean;
};

export type PassPlan = {
  receiverIndex:number|null;
  receiverLocked:boolean;
  confidence:number;
  passType:GroundPassType;
  origin:PassVector;
  receiverPosition:PassVector|null;
  predictedReceiverPosition:PassVector|null;
  targetPoint:PassVector;
  userIntentDirection:PassVector;
  physicalDirection:PassVector;
  distance:number;
  leadTime:number;
  leadDistance:number;
  desiredArrivalTime:number;
  recommendedSpeed:number;
  userPowerModifier:number;
  angularError:number;
  powerErrorModifier:number;
  initialVelocity:PassVector;
  receiverControlRadius:number;
};

export type PassPlanInput = {
  origin:PassVector;
  passer:PassPlayer;
  players:PassPlayer[];
  teamStart:number;
  teamEnd:number;
  selectedReceiver:number|null;
  receiverLocked:boolean;
  confidence?:number;
  userIntentDirection:PassVector;
  charge:number;
  assist:PassAssistMode;
  format:PassFormat;
  fieldDiagonal:number;
  bounds:{left:number;right:number;top:number;bottom:number};
  pressure:number;
  receiverPressure?:number;
  through?:boolean;
  tacticalTargetPoint?:PassVector|null;
  rng?:()=>number;
};

export type ReceptionQuality = "PERFECT"|"NORMAL"|"POOR"|"DEFLECTION";
export type ReceptionResult = {
  quality:ReceptionQuality;
  controlScore:number;
  controlRadius:number;
  ballVelocity:PassVector;
  claimPossession:boolean;
  graceMs:number;
  controlDelayMs:number;
};

export const DEBUG_PASS_SYSTEM=false;

export const PASS_PHYSICS={
  highSpeedDragPerFrame60:.9895,
  lowSpeedDragPerFrame60:.972,
  lowSpeedThreshold:155,
  stopSpeed:3,
  passerMomentumTransfer:.16,
  minimumSpeed:{4:225,5:230,6:235} as Record<PassFormat,number>,
  maximumSpeed:{4:640,5:680,6:720} as Record<PassFormat,number>,
  maximumLeadDistance:{4:88,5:108,6:130} as Record<PassFormat,number>,
};

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const length=(vector:PassVector)=>Math.hypot(vector.x,vector.y);

export function normalizePassVector(vector:PassVector,fallback:PassVector={x:1,y:0}){
  const magnitude=length(vector);
  if(magnitude>.0001)return{x:vector.x/magnitude,y:vector.y/magnitude};
  const fallbackMagnitude=length(fallback)||1;
  return{x:fallback.x/fallbackMagnitude,y:fallback.y/fallbackMagnitude};
}

export function derivePassAttributes(player:Pick<PassPlayer,"rating"|"role">):PassAttributes{
  const midfielder=player.role==="MED",attacker=player.role==="DEL"||player.role==="EXT",keeper=player.role==="ARQ";
  return{
    passing:clamp(player.rating+(midfielder?4:keeper?-7:0),55,99),
    vision:clamp(player.rating+(midfielder?5:attacker?1:keeper?-5:0),55,99),
    control:clamp(player.rating+(midfielder||attacker?3:keeper?-3:0),55,99),
    composure:clamp(player.rating+(midfielder?2:0),55,99),
  };
}

export class PassIntentResolver{
  resolve(input:Pick<PassPlanInput,"players"|"teamStart"|"teamEnd"|"selectedReceiver"|"receiverLocked"|"confidence"|"userIntentDirection"|"passer"|"assist">):PassSelection{
    const direction=normalizePassVector(input.userIntentDirection);
    const candidate=input.selectedReceiver;
    const valid=input.assist!=="MANUAL"&&candidate!==null&&candidate>=input.teamStart&&candidate<input.teamEnd&&input.players[candidate]?.team===input.passer.team;
    return{
      receiverIndex:valid?candidate:null,
      confidence:valid?clamp(input.confidence??1,0,1):0,
      userIntentDirection:direction,
      receiverLocked:valid&&input.receiverLocked,
    };
  }
}

function classifyPass(distance:number,fieldDiagonal:number,through:boolean,hasReceiver:boolean):GroundPassType{
  if(!hasReceiver)return "FREE";
  if(through)return "THROUGH";
  const ratio=distance/Math.max(1,fieldDiagonal);
  if(ratio<=.13)return "SHORT";
  if(ratio>=.31)return "LONG";
  return "MEDIUM";
}

function arrivalTimeFor(distance:number,type:GroundPassType,fieldDiagonal:number){
  const ratio=distance/Math.max(1,fieldDiagonal);
  if(type==="SHORT")return clamp(.31+ratio*1.25,.32,.50);
  if(type==="MEDIUM")return clamp(.43+ratio*1.65,.53,.90);
  if(type==="THROUGH")return clamp(.42+ratio*1.45,.52,1.08);
  if(type==="LONG")return clamp(.58+ratio*1.62,.84,1.25);
  return clamp(.34+ratio*1.55,.38,1.12);
}

export class PassTrajectoryPlanner{
  calculateLeadTime(args:{passer:PassPlayer;receiver:PassPlayer;distance:number;passType:GroundPassType;receiverPressure:number;format:PassFormat}){
    const toReceiver=normalizePassVector({x:args.receiver.x-args.passer.x,y:args.receiver.y-args.passer.y});
    const receiverSpeed=Math.hypot(args.receiver.vx,args.receiver.vy);
    if(receiverSpeed<16)return 0;
    const radialVelocity=args.receiver.vx*toReceiver.x+args.receiver.vy*toReceiver.y;
    const radialRatio=radialVelocity/receiverSpeed;
    if(radialRatio<-.22)return clamp(.035+(1+radialRatio)*.045,0,.08);
    const scale=args.format===4?.92:args.format===6?1.08:1;
    const pressureReduction=clamp((95-args.receiverPressure)/95,0,1)*.10;
    if(args.passType==="THROUGH"||radialRatio>.42)return clamp((.28+args.distance/2300)*scale-pressureReduction,.24,.55);
    return clamp((.14+args.distance/3300)*scale-pressureReduction*.55,.10,.31);
  }

  plan(args:{selection:PassSelection;input:PassPlanInput;preliminaryType:GroundPassType}){
    const {selection,input}=args,receiver=selection.receiverIndex===null?null:input.players[selection.receiverIndex]??null;
    if(!receiver){
      const projectedDistance=clamp(input.fieldDiagonal*(.075+clamp(input.charge,0,1)*.38),92,input.fieldDiagonal*.48);
      return{
        receiver:null,
        receiverPosition:null,
        predictedReceiverPosition:null,
        targetPoint:{x:clamp(input.origin.x+selection.userIntentDirection.x*projectedDistance,input.bounds.left+16,input.bounds.right-16),y:clamp(input.origin.y+selection.userIntentDirection.y*projectedDistance,input.bounds.top+16,input.bounds.bottom-16)},
        leadTime:0,
        leadDistance:0,
      };
    }
    const directDistance=Math.hypot(receiver.x-input.origin.x,receiver.y-input.origin.y);
    const receiverPressure=input.receiverPressure??999;
    const leadTime=this.calculateLeadTime({passer:input.passer,receiver,distance:directDistance,passType:args.preliminaryType,receiverPressure,format:input.format});
    const rawLead={x:receiver.vx*leadTime,y:receiver.vy*leadTime},rawLeadDistance=length(rawLead),maxLead=PASS_PHYSICS.maximumLeadDistance[input.format]*(args.preliminaryType==="THROUGH"?1.12:1);
    const leadScale=rawLeadDistance>maxLead?maxLead/rawLeadDistance:1;
    let predicted={x:receiver.x+rawLead.x*leadScale,y:receiver.y+rawLead.y*leadScale};
    if(input.tacticalTargetPoint&&args.preliminaryType==="THROUGH"){
      const tacticalOffset={x:input.tacticalTargetPoint.x-receiver.x,y:input.tacticalTargetPoint.y-receiver.y},tacticalDistance=length(tacticalOffset),tacticalScale=tacticalDistance>maxLead?maxLead/tacticalDistance:1;
      const tactical={x:receiver.x+tacticalOffset.x*tacticalScale,y:receiver.y+tacticalOffset.y*tacticalScale};
      predicted={x:predicted.x*.62+tactical.x*.38,y:predicted.y*.62+tactical.y*.38};
    }
    predicted={x:clamp(predicted.x,input.bounds.left+22,input.bounds.right-22),y:clamp(predicted.y,input.bounds.top+22,input.bounds.bottom-22)};
    return{
      receiver,
      receiverPosition:{x:receiver.x,y:receiver.y},
      predictedReceiverPosition:predicted,
      targetPoint:predicted,
      leadTime,
      leadDistance:Math.hypot(predicted.x-receiver.x,predicted.y-receiver.y),
    };
  }
}

export class PassPowerCalculator{
  calculate(args:{distance:number;passType:GroundPassType;format:PassFormat;fieldDiagonal:number;charge:number;attributes:PassAttributes;pressure:number;rng:()=>number}){
    const nominalArrivalTime=arrivalTimeFor(args.distance,args.passType,args.fieldDiagonal);
    const dragRate=-60*Math.log(PASS_PHYSICS.highSpeedDragPerFrame60);
    const dragCompensatedSpeed=args.distance*dragRate/Math.max(.001,1-Math.exp(-dragRate*nominalArrivalTime));
    const recommendedSpeed=clamp(dragCompensatedSpeed,PASS_PHYSICS.minimumSpeed[args.format],PASS_PHYSICS.maximumSpeed[args.format]);
    const userPowerModifier=clamp(.86+clamp(args.charge,0,1)*.30,.88,1.16);
    const pressure=clamp(args.pressure,0,1),technicalQuality=(args.attributes.passing*.58+args.attributes.composure*.42)/100;
    const angularRange=(.008+(1-technicalQuality)*.055)*(1+pressure*.85),angularError=(args.rng()-.5)*2*angularRange;
    const powerRange=.018+(1-technicalQuality)*.085+pressure*.035,powerErrorModifier=1+(args.rng()-.5)*2*powerRange;
    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.88,PASS_PHYSICS.maximumSpeed[args.format]*1.05);
    const arrivalRatio=args.distance*dragRate/Math.max(1,finalSpeed),physicalArrival=arrivalRatio<.985?-Math.log(1-arrivalRatio)/dragRate:args.distance/(finalSpeed*.52),desiredArrivalTime=clamp(physicalArrival,.24,1.8);
    return{desiredArrivalTime,recommendedSpeed,userPowerModifier,angularError,powerErrorModifier,finalSpeed};
  }
}

export class BallKickPhysics{
  kick(args:{direction:PassVector;speed:number;passerVelocity:PassVector;format:PassFormat}){
    const direction=normalizePassVector(args.direction);
    let velocity={
      x:direction.x*args.speed+args.passerVelocity.x*PASS_PHYSICS.passerMomentumTransfer,
      y:direction.y*args.speed+args.passerVelocity.y*PASS_PHYSICS.passerMomentumTransfer,
    };
    const speed=length(velocity),limit=PASS_PHYSICS.maximumSpeed[args.format]*1.08;
    if(speed>limit)velocity={x:velocity.x/speed*limit,y:velocity.y/speed*limit};
    return velocity;
  }
}

export class PassInterceptionSystem{
  closestPointOnTrajectory(origin:PassVector,velocity:PassVector,point:PassVector,maxTime=1.4){
    const speedSq=velocity.x*velocity.x+velocity.y*velocity.y;
    const time=speedSq<1?0:clamp(((point.x-origin.x)*velocity.x+(point.y-origin.y)*velocity.y)/speedSq,0,maxTime);
    const closest={x:origin.x+velocity.x*time,y:origin.y+velocity.y*time};
    return{time,point:closest,distance:Math.hypot(point.x-closest.x,point.y-closest.y)};
  }

  canPhysicallyIntercept(origin:PassVector,velocity:PassVector,defender:PassPlayer,reactionTime=.18){
    const approach=this.closestPointOnTrajectory(origin,velocity,defender,1.35),available=Math.max(0,approach.time-reactionTime),reachable=defender.r+22+available*185;
    return{...approach,interceptable:approach.distance<=reachable};
  }
}

export class ReceptionSystem{
  controlRadius(playerRadius:number,ballRadius:number,planned:boolean){return playerRadius*(planned?1.22:1.05)+ballRadius}

  resolve(args:{ballVelocity:PassVector;receiver:PassPlayer;ballRadius:number;distance:number;pressureDistance:number;planned:boolean;orientedDirection?:PassVector}) : ReceptionResult|null{
    const controlRadius=this.controlRadius(args.receiver.r,args.ballRadius,args.planned);
    if(args.distance>controlRadius)return null;
    const attributes=derivePassAttributes(args.receiver),incomingSpeed=Math.hypot(args.ballVelocity.x,args.ballVelocity.y),receiverSpeed=Math.hypot(args.receiver.vx,args.receiver.vy);
    const speedDifficulty=clamp((incomingSpeed-205)/430,0,1)*31,pressureDifficulty=clamp((105-args.pressureDistance)/105,0,1)*20,movementDifficulty=clamp(receiverSpeed/205,0,1)*8;
    const controlScore=attributes.control*.72+attributes.composure*.28-speedDifficulty-pressureDifficulty-movementDifficulty+(args.planned?7:0);
    const naturalDirection=receiverSpeed>18?{x:args.receiver.vx,y:args.receiver.vy}:args.orientedDirection??{x:args.receiver.team===0?1:-1,y:0},orientation=normalizePassVector(naturalDirection);
    let quality:ReceptionQuality,ballVelocity:PassVector,claimPossession=false,graceMs=0,controlDelayMs=0;
    if(controlScore>=74){quality="PERFECT";const touch=clamp(incomingSpeed*.032,7,23);ballVelocity={x:args.receiver.vx*.50+orientation.x*touch,y:args.receiver.vy*.50+orientation.y*touch};claimPossession=true;graceMs=205;controlDelayMs=55+clamp((incomingSpeed-300)/8,0,35)}
    else if(controlScore>=52){quality="NORMAL";const touch=clamp(incomingSpeed*.072,16,42);ballVelocity={x:args.receiver.vx*.42+args.ballVelocity.x*.065+orientation.x*touch,y:args.receiver.vy*.42+args.ballVelocity.y*.065+orientation.y*touch};claimPossession=Math.hypot(ballVelocity.x,ballVelocity.y)<168;graceMs=claimPossession?160:0;controlDelayMs=105+clamp((incomingSpeed-260)/5,0,55)}
    else if(args.planned){quality="POOR";ballVelocity={x:args.ballVelocity.x*.26+args.receiver.vx*.18+orientation.x*28,y:args.ballVelocity.y*.26+args.receiver.vy*.18+orientation.y*28};controlDelayMs=205}
    else{quality="DEFLECTION";ballVelocity={x:args.ballVelocity.x*.40+args.receiver.vx*.20,y:args.ballVelocity.y*.40+args.receiver.vy*.20};controlDelayMs=240}
    return{quality,controlScore,controlRadius,ballVelocity,claimPossession,graceMs,controlDelayMs};
  }
}

export class PassSystem{
  readonly intentResolver=new PassIntentResolver();
  readonly trajectoryPlanner=new PassTrajectoryPlanner();
  readonly powerCalculator=new PassPowerCalculator();
  readonly ballKickPhysics=new BallKickPhysics();
  readonly interceptionSystem=new PassInterceptionSystem();
  readonly receptionSystem=new ReceptionSystem();

  plan(input:PassPlanInput):PassPlan{
    const selection=this.intentResolver.resolve(input),receiver=selection.receiverIndex===null?null:input.players[selection.receiverIndex],directDistance=receiver?Math.hypot(receiver.x-input.origin.x,receiver.y-input.origin.y):input.fieldDiagonal*(.075+clamp(input.charge,0,1)*.38);
    const preliminaryType=classifyPass(directDistance,input.fieldDiagonal,Boolean(input.through),Boolean(receiver));
    const trajectory=this.trajectoryPlanner.plan({selection,input,preliminaryType}),distance=Math.hypot(trajectory.targetPoint.x-input.origin.x,trajectory.targetPoint.y-input.origin.y),passType=classifyPass(distance,input.fieldDiagonal,Boolean(input.through),Boolean(receiver));
    const power=this.powerCalculator.calculate({distance,passType,format:input.format,fieldDiagonal:input.fieldDiagonal,charge:input.charge,attributes:derivePassAttributes(input.passer),pressure:input.pressure,rng:input.rng??Math.random});
    const idealDirection=normalizePassVector({x:trajectory.targetPoint.x-input.origin.x,y:trajectory.targetPoint.y-input.origin.y},selection.userIntentDirection),cos=Math.cos(power.angularError),sin=Math.sin(power.angularError),physicalDirection=normalizePassVector({x:idealDirection.x*cos-idealDirection.y*sin,y:idealDirection.x*sin+idealDirection.y*cos},idealDirection);
    const initialVelocity=this.ballKickPhysics.kick({direction:physicalDirection,speed:power.finalSpeed,passerVelocity:{x:input.passer.vx,y:input.passer.vy},format:input.format});
    return{
      receiverIndex:selection.receiverIndex,receiverLocked:selection.receiverLocked,confidence:selection.confidence,passType,origin:{...input.origin},receiverPosition:trajectory.receiverPosition,predictedReceiverPosition:trajectory.predictedReceiverPosition,targetPoint:trajectory.targetPoint,userIntentDirection:selection.userIntentDirection,physicalDirection,distance,leadTime:trajectory.leadTime,leadDistance:trajectory.leadDistance,desiredArrivalTime:power.desiredArrivalTime,recommendedSpeed:power.recommendedSpeed,userPowerModifier:power.userPowerModifier,angularError:power.angularError,powerErrorModifier:power.powerErrorModifier,initialVelocity,receiverControlRadius:receiver?this.receptionSystem.controlRadius(receiver.r,9,true):0,
    };
  }
}

export function applyBallDrag(velocity:PassVector,deltaTime:number){
  const speed=length(velocity),drag=speed>PASS_PHYSICS.lowSpeedThreshold?PASS_PHYSICS.highSpeedDragPerFrame60:PASS_PHYSICS.lowSpeedDragPerFrame60,factor=Math.pow(drag,Math.max(0,deltaTime)*60);
  const next={x:velocity.x*factor,y:velocity.y*factor};
  return length(next)<PASS_PHYSICS.stopSpeed?{x:0,y:0}:next;
}

export function passDebugEnabled(search=""){
  if(DEBUG_PASS_SYSTEM)return true;
  return /(?:^|[?&])debugPass=(?:1|true)(?:&|$)/i.test(search);
}
