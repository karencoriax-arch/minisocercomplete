import test from "node:test";
import assert from "node:assert/strict";
import {assistConeRadians,chooseActionByDifficulty,chooseCarrierDecision,chooseHumanPass,createAIProfile,createPassIntent,createTeamBlackboard,cushionReception,DIFFICULTY_PROFILES,findAssistedPassCandidates,findAssistedPassTarget,findSpacePassRunner,fixedRadiusAim,goalkeeperTarget,manualDirectionalPass,PASS_ASSIST_CONFIG,PassTargetSelector,passForceForDistance,playerPersonality,predictInterception,receptionRestitution,resolvePassIntentDirection,screenToWorldPoint,separationSteering,shotTarget,teamSpacingMetrics,teamStructureMetrics,updateTeamBlackboard} from "../app/game-ai.ts";

const player=(x,y,team,role="MED")=>({x,y,vx:0,vy:0,r:18,team,rating:86,role});
const bounds={left:46,right:1154,top:74,bottom:646};
const context=(players,profile=createAIProfile("WORLD_CLASS"))=>({
  carrierIndex:0,players,ball:{x:205,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:3,
  opponentStart:3,opponentEnd:players.length,direction:1,left:46,right:1154,top:74,bottom:646,
  goalY:360,profile,combination:null,
});

test("el apuntado con mouse mantiene radio fijo aunque el cursor esté cerca o lejos",()=>{
  const near=fixedRadiusAim({x:100,y:100},{x:110,y:100},80),far=fixedRadiusAim({x:100,y:100},{x:900,y:100},80);
  assert.deepEqual(near.direction,far.direction);
  assert.equal(Math.round(Math.hypot(near.endpoint.x-100,near.endpoint.y-100)),80);
  assert.equal(Math.round(Math.hypot(far.endpoint.x-100,far.endpoint.y-100)),80);
});

test("el mouse se convierte a coordenadas del mundo antes de calcular la intención",()=>{
  const world=screenToWorldPoint({x:410,y:260},{left:10,top:60,width:800,height:400},{width:1600,height:800});
  assert.deepEqual(world,{x:800,y:400});
});

test("la flecha y los conos usan radios estables por formato",()=>{
  assert.equal(PASS_ASSIST_CONFIG.arrowRadiusFactor,1.6);
  assert.equal(Math.round(assistConeRadians("ASSISTED",4)*180/Math.PI),38);
  assert.equal(Math.round(assistConeRadians("ASSISTED",5)*180/Math.PI),34);
  assert.equal(Math.round(assistConeRadians("ASSISTED",6)*180/Math.PI),31);
  assert.ok(assistConeRadians("SEMI",5)<assistConeRadians("ASSISTED",5));
});

test("la IA evita de forma consistente una línea de pase bloqueada",()=>{
  const players=[player(200,340,0),player(520,340,0,"DEL"),player(470,510,0,"EXT"),player(350,340,1,"DEF"),player(235,310,1,"MED")];
  let safe=0,blocked=0,passes=0;
  for(let i=0;i<160;i++){
    const decision=chooseCarrierDecision(context(players));
    if(decision.type==="pass"){passes++;if(decision.target===2)safe++;if(decision.target===1)blocked++}
  }
  assert.ok(passes>90,"debe buscar pases cuando está presionada");
  assert.ok(safe>blocked*4,"debe preferir claramente el receptor con línea libre");
});

test("la IA no dispara desde una distancia absurda",()=>{
  const players=[player(160,340,0),player(360,240,0),player(390,500,0),player(720,340,1),player(850,470,1)];
  for(let i=0;i<100;i++)assert.notEqual(chooseCarrierDecision(context(players)).type,"shoot");
});

test("la potencia de pase aumenta con la distancia",()=>{
  const shortPlayers=[player(200,340,0),player(350,260,0),player(330,470,0),player(230,300,1),player(900,500,1)];
  const longPlayers=[player(200,340,0),player(720,240,0),player(680,520,0),player(230,300,1),player(900,500,1)];
  const forces=players=>Array.from({length:120},()=>chooseCarrierDecision(context(players))).filter(d=>d.type==="pass").map(d=>d.force);
  const short=forces(shortPlayers),long=forces(longPlayers);
  assert.ok(short.length&&long.length,"ambos escenarios deben producir pases");
  assert.ok(Math.min(...long)>Math.max(...short),"el pase largo debe salir con más potencia");
});

test("la dificultad mejora decisiones y anticipación, no solo velocidad",()=>{
  const easy=createAIProfile("EASY"),medium=createAIProfile("MEDIUM"),professional=createAIProfile("PROFESSIONAL"),world=createAIProfile("WORLD_CLASS");
  assert.ok(easy.decisionDelay>medium.decisionDelay&&medium.decisionDelay>professional.decisionDelay&&professional.decisionDelay>world.decisionDelay);
  assert.ok(easy.anticipationTime<medium.anticipationTime&&medium.anticipationTime<professional.anticipationTime&&professional.anticipationTime<world.anticipationTime);
  assert.ok(easy.passAccuracy<medium.passAccuracy&&medium.passAccuracy<professional.passAccuracy&&professional.passAccuracy<world.passAccuracy);
  assert.ok(easy.tacticalAwareness<medium.tacticalAwareness&&medium.tacticalAwareness<professional.tacticalAwareness&&professional.tacticalAwareness<world.tacticalAwareness);
});

test("un defensor anticipa una pelota que cruza por su zona",()=>{
  const defender=player(520,340,0,"DEF"),ball={x:300,y:340,vx:430,vy:0,r:9};
  const point=predictInterception(defender,ball,createAIProfile("WORLD_CLASS"),bounds);
  assert.ok(point,"debe encontrar un punto de intercepción alcanzable");
  assert.ok(point.x>ball.x&&point.x<700);
});

test("el pase humano solo puede elegir compañeros del equipo del jugador controlado",()=>{
  const players=[player(200,340,0),player(430,340,0,"DEL"),player(270,345,1,"DEF"),player(480,300,1,"MED")];
  const target=chooseHumanPass({carrierIndex:0,players,ball:{x:202,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:2,opponentStart:2,opponentEnd:4,direction:1,moveX:1,moveY:0,through:false,aerial:false,...bounds});
  assert.equal(target?.target,1,"J nunca debe seleccionar a un rival aunque esté más cerca");
});

test("la intención se comunica antes de ejecutar el pase",()=>{
  const intent=createPassIntent({from:0,to:1,targetPosition:{x:420,y:300},passDistance:220,force:300,now:1000,human:true});
  assert.ok(intent.executeAt>intent.createdAt,"el receptor debe tener tiempo para arrancar");
  assert.equal(intent.executeAt-intent.createdAt,68);
  assert.equal(intent.executed,false);
  assert.ok(intent.arrivalTime>=.24&&intent.arrivalTime<=1.4);
});

test("el coordinador asigna un único receptor, corredor, apoyo y cobertura",()=>{
  const players=[player(210,340,0),player(410,250,0,"DEL"),player(380,460,0,"MED"),player(320,130,0,"EXT"),player(130,520,0,"DEF"),player(650,340,1,"DEF"),player(790,230,1,"MED"),player(760,490,1,"DEL"),player(900,160,1,"EXT"),player(970,520,1,"DEF")];
  const board=createTeamBlackboard(0,1);
  updateTeamBlackboard(board,{now:1000,owner:0,players,ball:{x:210,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:5,opponentStart:5,opponentEnd:10,goalY:360,profile:createAIProfile("WORLD_CLASS"),force:true,...bounds});
  const assigned=[board.primaryRunner,board.supportRunner,board.widthPlayer,board.defensiveCover].filter(index=>index>=0);
  assert.equal(new Set(assigned).size,assigned.length,"los roles reservados no deben duplicarse");
  assert.equal(board.roles[0],"BALL_CARRIER");
  assert.equal(Object.values(board.roles).filter(role=>role==="PRIMARY_RECEIVER").length,1);
  assert.ok(board.nextTickAt-1000>=150&&board.nextTickAt-1000<=280,"las decisiones colectivas deben usar ticks estables de 150–280 ms");
  assert.ok(board.currentPlay?.steps.length>=2,"debe existir una secuencia compartida de varias acciones");
});

test("los pases bajan de potencia y una recepción anunciada amortigua el impacto",()=>{
  assert.ok(passForceForDistance(120)<passForceForDistance(430));
  assert.ok(passForceForDistance(900)<=515,"ningún pase debe salir con potencia descontrolada");
  assert.equal(receptionRestitution(-460,true),.02);
  const received=cushionReception({x:420,y:70},{x:100,y:10});
  assert.ok(Math.hypot(received.x,received.y)<Math.hypot(420,70),"el receptor debe amortiguar sin pegar la pelota");
});

test("sin posesión siempre existe un perseguidor para que el equipo rival no quede quieto",()=>{
  const players=[player(210,340,0),player(410,250,0),player(380,460,0),player(650,340,1),player(790,230,1),player(760,490,1)];
  const board=createTeamBlackboard(1,-1);
  updateTeamBlackboard(board,{now:1000,owner:null,players,ball:{x:520,y:390,vx:80,vy:0,r:9},teamStart:3,teamEnd:6,opponentStart:0,opponentEnd:3,goalY:360,profile:createAIProfile("PROFESSIONAL"),force:true,...bounds});
  assert.equal(Object.values(board.roles).filter(role=>role==="CHASER").length,1);
  assert.equal(Object.keys(board.roles).length,3,"todos los bots deben recibir una tarea táctica");
});

test("los cinco perfiles centrales contienen los parámetros tácticos solicitados",()=>{
  assert.deepEqual(Object.keys(DIFFICULTY_PROFILES),["EASY","NORMAL","MEDIUM","PROFESSIONAL","WORLD_CLASS"]);
  assert.equal(DIFFICULTY_PROFILES.EASY.decisionInterval,350);
  assert.equal(DIFFICULTY_PROFILES.PROFESSIONAL.anticipationTime,.75);
  assert.equal(DIFFICULTY_PROFILES.WORLD_CLASS.positioningSkill,.96);
  assert.equal(DIFFICULTY_PROFILES.WORLD_CLASS.mistakeChance,.01);
});

test("Fácil elige entre opciones razonables y Pro Mundial selecciona la mejor",()=>{
  const actions=[{id:"A",score:90},{id:"B",score:82},{id:"C",score:70},{id:"D",score:20}];
  const easyChoices=new Set(Array.from({length:80},(_,i)=>chooseActionByDifficulty(actions,createAIProfile("EASY"),()=>((i*37)%101)/101).id));
  assert.ok([...easyChoices].every(id=>["A","B","C"].includes(id)),"Fácil nunca debe elegir una opción absurda");
  assert.ok(easyChoices.size>=2,"Fácil debe variar entre buenas alternativas");
  assert.equal(chooseActionByDifficulty(actions,createAIProfile("WORLD_CLASS"),()=>.99).id,"A");
});

test("la anticipación defensiva crece sin aumentar la velocidad física del jugador",()=>{
  const defender=player(610,340,0,"DEF"),movingBall={x:300,y:340,vx:360,vy:0,r:9};
  const easy=predictInterception(defender,movingBall,createAIProfile("EASY"),bounds);
  const world=predictInterception(defender,movingBall,createAIProfile("WORLD_CLASS"),bounds);
  assert.equal(easy,null,"Fácil reacciona tarde ante una pelota todavía lejana");
  assert.ok(world&&world.time>.2,"Pro Mundial debe leer la trayectoria con anticipación");
});

test("la separación táctica empuja compañeros cercanos y no altera a los que ya tienen espacio",()=>{
  const crowded=[player(200,300,0),player(225,300,0),player(420,300,0)];
  const force=separationSteering(0,crowded,0,3,70);
  assert.ok(force.x<0&&force.crowding>0,"el jugador debe salir del amontonamiento");
  assert.deepEqual(separationSteering(2,crowded,0,3,70),{x:0,y:0,crowding:0});
});

test("la separación suave nunca aplica una fuerza magnética descontrolada",()=>{
  const stacked=[player(200,300,0),player(200,300,0),player(202,300,0),player(204,300,0)];
  const force=separationSteering(0,stacked,0,4,120);
  assert.ok(Math.hypot(force.x,force.y)<=1.0001);
  const metrics=teamSpacingMetrics(stacked,0,4,120);
  assert.equal(metrics.overlapPairs,6);
  assert.ok(metrics.severeOverlaps>=3);
});

test("los slots dinámicos crean profundidad, apoyo y cobertura sin apilar funciones",()=>{
  const players=[player(300,340,0),player(470,220,0,"DEL"),player(430,470,0,"MED"),player(250,150,0,"EXT"),player(170,530,0,"DEF"),player(650,340,1,"DEF"),player(800,230,1),player(840,500,1)];
  const board=createTeamBlackboard(0,1);
  updateTeamBlackboard(board,{now:1000,owner:0,players,ball:{x:300,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:5,opponentStart:5,opponentEnd:8,goalY:360,profile:createAIProfile("PROFESSIONAL"),force:true,...bounds});
  const slots=Object.values(board.tacticalSlots);
  assert.ok(slots.some(slot=>slot.kind==="DEPTH"&&slot.x>players[0].x));
  assert.ok(slots.some(slot=>slot.kind==="COVERAGE"&&slot.x<players[0].x));
  assert.equal(new Set(Object.keys(board.roles)).size,5);
});

test("la defensa elige exactamente un presionador y un bloqueador de salida",()=>{
  const players=[player(220,260,0,"DEF"),player(230,450,0),player(140,350,0,"ARQ"),player(610,340,1),player(720,230,1),player(750,490,1)];
  const board=createTeamBlackboard(0,1);
  updateTeamBlackboard(board,{now:1000,owner:3,players,ball:{x:610,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:6,goalY:360,profile:createAIProfile("WORLD_CLASS"),force:true,...bounds});
  assert.ok(board.primaryPresser>=0&&board.secondaryPresser>=0);
  assert.notEqual(board.primaryPresser,board.secondaryPresser);
  assert.equal(board.tacticalSlots[board.primaryPresser].kind,"PRIMARY_PRESSER");
  assert.equal(board.tacticalSlots[board.secondaryPresser].kind,"SECONDARY_PRESSER");
});

test("el presionador conserva su responsabilidad y no cambia por una diferencia mínima",()=>{
  const players=[player(250,280,0,"DEF"),player(248,425,0,"MED"),player(105,360,0,"ARQ"),player(610,350,1,"MED"),player(750,240,1),player(760,480,1)];
  const board=createTeamBlackboard(0,1),profile=createAIProfile("PROFESSIONAL"),movingBall={x:610,y:350,vx:0,vy:0,r:9};
  updateTeamBlackboard(board,{now:1000,owner:3,players,ball:movingBall,teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:6,goalY:360,profile,force:true,...bounds});
  const first=board.primaryPresser;
  players[first===0?1:0].x+=6;
  updateTeamBlackboard(board,{now:1320,owner:3,players,ball:{...movingBall,y:365},teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:6,goalY:360,profile,force:true,...bounds});
  assert.equal(board.primaryPresser,first,"una ventaja marginal no debe producir un cambio nervioso de presionador");
});

test("los objetivos defensivos reservados no colocan presionador y cobertura en el mismo punto",()=>{
  const players=[player(420,330,0,"DEF"),player(425,345,0,"MED"),player(100,360,0,"ARQ"),player(610,340,1),player(760,220,1),player(780,490,1)];
  const board=createTeamBlackboard(0,1);
  updateTeamBlackboard(board,{now:1000,owner:3,players,ball:{x:610,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:6,goalY:360,profile:createAIProfile("MEDIUM"),force:true,...bounds});
  const primary=board.tacticalSlots[board.primaryPresser],secondary=board.tacticalSlots[board.secondaryPresser];
  assert.ok(Math.hypot(primary.x-secondary.x,primary.y-secondary.y)>70);
});

test("la formación elástica se desplaza como bloque desde anclas persistentes",()=>{
  const players=[player(260,220,0,"DEL"),player(220,360,0,"MED"),player(145,470,0,"DEF"),player(78,360,0,"ARQ"),player(820,340,1),player(900,220,1)];
  const basePositions={0:{x:300,y:220},1:{x:235,y:360},2:{x:150,y:470},3:{x:78,y:360}};
  const board=createTeamBlackboard(0,1);
  updateTeamBlackboard(board,{now:1000,owner:4,players,ball:{x:760,y:470,vx:0,vy:0,r:9},teamStart:0,teamEnd:4,opponentStart:4,opponentEnd:6,goalY:360,profile:createAIProfile("MEDIUM"),basePositions,structureDiscipline:.76,rotationFreedom:.72,force:true,...bounds});
  assert.ok(board.blockShift.x>0&&board.blockShift.y>0,"el bloque debe acompañar parcialmente a la pelota");
  assert.ok(board.blockShift.x<(760-(bounds.left+bounds.right)/2),"el equipo no debe trasladarse por completo hasta la pelota");
  const shaped=Object.entries(board.roles).filter(([,role])=>role==="SHAPE").map(([index])=>board.tacticalSlots[Number(index)]);
  assert.ok(shaped.every(slot=>slot.x<760),"los jugadores de estructura no deben terminar encima del balón");
});

test("la estructura defensiva vuelve hacia sus objetivos tácticos medibles",()=>{
  const players=[player(300,200,0,"DEL"),player(240,360,0,"MED"),player(150,500,0,"DEF"),player(78,360,0,"ARQ"),player(700,340,1),player(820,240,1)];
  const board=createTeamBlackboard(0,1),basePositions={0:{x:310,y:210},1:{x:235,y:360},2:{x:150,y:500},3:{x:78,y:360}};
  updateTeamBlackboard(board,{now:1000,owner:4,players,ball:{x:700,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:4,opponentStart:4,opponentEnd:6,goalY:360,profile:createAIProfile("PROFESSIONAL"),basePositions,structureDiscipline:.9,rotationFreedom:.45,force:true,...bounds});
  const before=teamStructureMetrics(board,players,0,4).averageError;
  for(let i=0;i<4;i++){const target=board.tacticalSlots[i];players[i].x=target.x;players[i].y=target.y}
  const after=teamStructureMetrics(board,players,0,4).averageError;
  assert.ok(before>0&&after<.001,"la recuperación debe converger hacia la estructura asignada");
});

test("el momentum crece cuando una recepción rompe una línea",()=>{
  const players=[player(250,340,0),player(450,340,0,"DEL"),player(360,500,0),player(720,340,1),player(820,500,1)];
  const board=createTeamBlackboard(0,1);
  updateTeamBlackboard(board,{now:1000,owner:0,players,ball:{x:250,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:5,goalY:360,profile:createAIProfile("MEDIUM"),force:true,...bounds});
  const before=board.attackMomentum;
  updateTeamBlackboard(board,{now:1200,owner:1,players,ball:{x:450,y:340,vx:0,vy:0,r:9},teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:5,goalY:360,profile:createAIProfile("MEDIUM"),force:true,...bounds});
  assert.ok(board.attackMomentum>before&&board.progressivePasses===1);
});

test("el arquero sigue el ángulo y sale en un mano a mano",()=>{
  const keeper=player(80,360,0,"ARQ"),moving={x:190,y:430,vx:-80,vy:0,r:9};
  const tracking=goalkeeperTarget(keeper,moving,1,bounds,360,190),rushing=goalkeeperTarget(keeper,moving,1,bounds,360,70);
  assert.ok(tracking.y>360,"debe acompañar lateralmente la pelota");
  assert.equal(rushing.state,"CHARGE_BALL");
  assert.ok(rushing.x>tracking.x,"en el mano a mano debe achicar");
});

test("las estrellas tienen personalidad y los tiros no apuntan siempre al centro",()=>{
  const mbappe=playerPersonality({...player(0,0,0,"DEL"),name:"Kylian Mbappé",rating:94});
  const rodri=playerPersonality({...player(0,0,0,"MED"),name:"Rodri",rating:91});
  assert.ok(mbappe.runBias>rodri.runBias&&rodri.passBias>mbappe.passBias);
  const target=shotTarget({...player(900,300,0,"DEL"),rating:92},1230,360,bounds.top,bounds.bottom,createAIProfile("PROFESSIONAL"),()=>0);
  assert.ok(target.y<360&&target.y>=bounds.top+30);
});

test("el pase manual respeta exactamente la dirección sin asistencia",()=>{
  const players=[player(200,300,0),player(430,410,0),player(700,300,1)];
  const pass=manualDirectionalPass({origin:{x:200,y:300},aim:{x:0,y:-1},charge:.5,rating:99,pressure:0,assist:"MANUAL",players,teamStart:0,teamEnd:2,carrierIndex:0,fieldDiagonal:1200,rng:()=>.5});
  assert.ok(Math.abs(pass.direction.x)<.0001&&pass.direction.y<-.999,"la pelota no debe autoapuntar al compañero");
  assert.ok(pass.targetPosition.y<300&&Math.abs(pass.targetPosition.x-200)<.001);
});

test("la carga aumenta potencia y la asistencia solo corrige un ángulo pequeño",()=>{
  const players=[player(200,300,0),player(500,330,0),player(700,300,1)],base={origin:{x:200,y:300},aim:{x:1,y:0},rating:90,pressure:0,players,teamStart:0,teamEnd:2,carrierIndex:0,fieldDiagonal:1200,rng:()=>.5};
  const short=manualDirectionalPass({...base,charge:.15,assist:"MANUAL"}),long=manualDirectionalPass({...base,charge:1,assist:"MANUAL"}),assisted=manualDirectionalPass({...base,charge:.5,assist:"ASSISTED"});
  assert.ok(long.force>short.force&&long.targetPosition.x>short.targetPosition.x);
  assert.ok(assisted.direction.y>0&&assisted.selectedReceiver===1,"la ayuda debe seleccionar al compañero dentro del cono");
});

test("el cono asistido interpreta la dirección pero nunca elige fuera de ella",()=>{
  const players=[player(200,300,0),player(470,390,0),player(200,520,0),player(380,345,1),player(650,300,1)];
  const target=findAssistedPassTarget({origin:{x:200,y:300},aim:{x:1,y:.2},players,teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:5,carrierIndex:0,assist:"ASSISTED",fieldDiagonal:1200,formatPlayers:5,attackingDirection:1});
  assert.equal(target?.receiver,1,"debe escoger al compañero alineado y no al que está fuera del cono");
  const none=findAssistedPassTarget({origin:{x:200,y:300},aim:{x:-1,y:0},players,teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:5,carrierIndex:0,assist:"ASSISTED",fieldDiagonal:1200,formatPlayers:5,attackingDirection:1});
  assert.equal(none,null);
});

test("manual no selecciona receptor y semiasistida exige más precisión",()=>{
  const players=[player(200,300,0),player(480,450,0),player(600,300,1)],common={origin:{x:200,y:300},aim:{x:1,y:0},players,teamStart:0,teamEnd:2,opponentStart:2,opponentEnd:3,carrierIndex:0,fieldDiagonal:1200,formatPlayers:5,attackingDirection:1};
  assert.equal(findAssistedPassTarget({...common,assist:"MANUAL"}),null);
  assert.ok(findAssistedPassTarget({...common,assist:"ASSISTED"}),"asistida debe aceptar un compañero dentro del cono amplio");
  assert.equal(findAssistedPassTarget({...common,assist:"SEMI"}),null,"semiasistida no debe corregir una intención lejana");
});

test("WASD no puede sobrescribir la intención de pase",()=>{
  const current={x:0,y:-1},movementDirection={x:1,y:0};
  const withoutAim=resolvePassIntentDirection(current,{x:0,y:0});
  assert.deepEqual(withoutAim,current,"sin input de apuntado debe conservar la intención aunque el movimiento sea distinto");
  assert.notDeepEqual(withoutAim,movementDirection);
  const diagonal=resolvePassIntentDirection(current,{x:1,y:-1});
  assert.ok(diagonal.x>.7&&diagonal.y<-.7,"las flechas deben poder apuntar en diagonal mientras WASD mueve por separado");
});

test("el selector asistido conserva receptor mientras el pasador corre",()=>{
  const players=[player(200,300,0),player(470,355,0),player(720,520,0),player(620,120,1)];
  const selector=new PassTargetSelector("LATE"),common={aim:{x:1,y:.18},passPower:.45,players,teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:4,carrierIndex:0,assist:"ASSISTED",fieldDiagonal:1200,formatPlayers:5,attackingDirection:1};
  const standing=selector.update({...common,origin:{x:200,y:300}});
  const running=selector.update({...common,origin:{x:248,y:300}});
  assert.equal(standing?.receiver,1);
  assert.equal(running?.receiver,1,"cambiar la posición del portador no debe convertir su movimiento en dirección de pase");
});

test("la potencia distingue receptores cercanos y lejanos en una misma dirección",()=>{
  const players=[player(200,300,0),player(340,325,0),player(700,390,0),player(700,560,1)],common={origin:{x:200,y:300},aim:{x:1,y:.16},players,teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:4,carrierIndex:0,assist:"ASSISTED",fieldDiagonal:1200,formatPlayers:5,attackingDirection:1};
  assert.equal(findAssistedPassTarget({...common,passPower:.12})?.receiver,1,"un toque corto debe preferir al compañero cercano");
  assert.equal(findAssistedPassTarget({...common,passPower:1})?.receiver,2,"una carga alta debe preferir al compañero lejano");
});

test("el bloqueo LATE permite corregir antes de soltar y congela el receptor después",()=>{
  const players=[player(200,300,0),player(340,325,0),player(700,390,0),player(700,560,1)],common={origin:{x:200,y:300},aim:{x:1,y:.16},players,teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:4,carrierIndex:0,assist:"ASSISTED",fieldDiagonal:1200,formatPlayers:5,attackingDirection:1};
  const selector=new PassTargetSelector("LATE");
  selector.update({...common,now:0,passPower:.12});
  selector.beginPowerUp(0,common.aim);
  assert.equal(selector.update({...common,now:220,passPower:1})?.receiver,2,"después de la ventana estable puede cambiar al receptor coherente con la potencia");
  assert.equal(selector.lockLate()?.receiver,2);
  assert.equal(selector.update({...common,now:260,aim:{x:0,y:1},passPower:.12})?.receiver,2,"después del lock final no debe saltar a otro jugador");
  assert.equal(selector.isLocked(),true);
});

test("el punto del receptor bloqueado no se recalcula después del lock",()=>{
  const players=[player(200,300,0),{...player(470,330,0),vx:120,vy:0},player(700,300,1)],lockedPoint={x:515,y:330};
  const pass=manualDirectionalPass({origin:{x:200,y:300},aim:{x:1,y:0},charge:.55,rating:94,pressure:0,assist:"ASSISTED",players,teamStart:0,teamEnd:2,opponentStart:2,opponentEnd:3,carrierIndex:0,fieldDiagonal:1200,lockedReceiver:1,lockedTargetPosition:lockedPoint,rng:()=>.5});
  assert.equal(pass.selectedReceiver,1);
  assert.ok(Math.abs(pass.targetPosition.x-lockedPoint.x)<.001&&Math.abs(pass.targetPosition.y-lockedPoint.y)<.001);
});

const mandatoryPassScene=()=>[
  player(200,340,0,"MED"),
  player(420,300,0,"MED"),
  player(720,245,0,"DEL"),
  player(455,520,0,"EXT"),
  player(510,455,1,"DEF"),
  player(690,500,1,"MED"),
  player(900,380,1,"DEF"),
];

const mandatoryPassArgs=players=>({origin:{x:players[0].x,y:players[0].y},aim:{x:1,y:-.18},passPower:.30,players,teamStart:0,teamEnd:4,opponentStart:4,opponentEnd:7,carrierIndex:0,assist:"ASSISTED",fieldDiagonal:1200,formatPlayers:5,attackingDirection:1});

test("escena obligatoria 1: quieto selecciona al receptor de la intención",()=>{
  const players=mandatoryPassScene();
  assert.equal(findAssistedPassTarget(mandatoryPassArgs(players))?.receiver,1);
});

test("escena obligatoria 2: correr horizontalmente mantiene el mismo receptor",()=>{
  const players=mandatoryPassScene();players[0].vx=180;
  const selector=new PassTargetSelector("LATE"),common=mandatoryPassArgs(players);
  assert.equal(selector.update({...common,now:0})?.receiver,1);
  players[0].x+=52;
  assert.equal(selector.update({...common,now:90,origin:{x:players[0].x,y:players[0].y}})?.receiver,1);
});

test("escena obligatoria 3: correr al lado opuesto no cambia la intención",()=>{
  const players=mandatoryPassScene();players[0].vx=-190;players[0].x-=45;
  const target=findAssistedPassTarget({...mandatoryPassArgs(players),origin:{x:players[0].x,y:players[0].y}});
  assert.equal(target?.receiver,1,"la velocidad del pasador nunca participa en la dirección de selección");
});

test("escena obligatoria 4: potencia separa dos receptores en la misma dirección",()=>{
  const players=mandatoryPassScene(),common=mandatoryPassArgs(players);
  assert.equal(findAssistedPassTarget({...common,passPower:.12})?.receiver,1);
  assert.equal(findAssistedPassTarget({...common,passPower:1})?.receiver,2);
});

test("escena obligatoria 5: el receptor móvil usa una posición futura",()=>{
  const players=mandatoryPassScene();players[1].vx=115;players[1].vy=-38;
  const target=findAssistedPassTarget(mandatoryPassArgs(players));
  assert.equal(target?.receiver,1);
  assert.ok(target.targetPosition.x>players[1].x&&target.targetPosition.y<players[1].y,"el objetivo debe adelantarse en la dirección real del receptor");
});

test("un cambio claro de dirección cancela el lock temporal, uno pequeño no",()=>{
  const players=mandatoryPassScene(),selector=new PassTargetSelector("LATE"),common=mandatoryPassArgs(players);
  selector.update({...common,now:0});selector.beginPowerUp(0,common.aim);
  selector.resolveIntent(80,{x:1,y:-.08});
  assert.equal(selector.getTarget()?.receiver,1,"un ajuste pequeño conserva el candidato");
  selector.resolveIntent(210,{x:-1,y:0});
  assert.equal(selector.getTarget(),null,"un giro claro debe cancelar la memoria anterior");
});

test("al presionar pase se descarta un preview viejo y se captura la intención actual",()=>{
  const players=mandatoryPassScene(),selector=new PassTargetSelector("LATE"),common=mandatoryPassArgs(players);
  assert.equal(selector.update({...common,now:0})?.receiver,1);
  const newIntent={x:.76,y:.65};
  selector.beginPowerUp(40,newIntent);
  const captured=selector.resolveIntent(50,newIntent),target=selector.update({...common,now:50,aim:captured});
  assert.equal(target?.receiver,3,"un toque rápido no debe ejecutar el receptor que quedó seleccionado antes de pulsar pase");
});

test("la flecha sigue ajustes pequeños del mouse sin perder el receptor bloqueado",()=>{
  const players=mandatoryPassScene(),selector=new PassTargetSelector("LATE"),common=mandatoryPassArgs(players);
  selector.beginPowerUp(0,common.aim);
  selector.update({...common,now:0});
  const adjusted=selector.resolveIntent(260,{x:.985,y:-.172});
  const target=selector.update({...common,now:260,aim:adjusted});
  assert.ok(Math.abs(adjusted.y+.172)<.01,"el indicador debe continuar siguiendo al mouse");
  assert.equal(target?.receiver,1,"la histéresis debe conservar el receptor ante una corrección pequeña");
});

test("debug enumera candidatos y conserva la puntuación del receptor seleccionado",()=>{
  const players=mandatoryPassScene(),selector=new PassTargetSelector("LATE"),common=mandatoryPassArgs(players);
  const selected=selector.update({...common,now:0}),debug=selector.getDebugState(0);
  assert.ok(debug.candidates.length>=1);
  assert.equal(debug.selectedReceiver,selected?.receiver);
  assert.equal(debug.candidateScore,selected?.score);
  assert.ok(debug.desiredDistance>0&&debug.power===common.passPower);
  assert.deepEqual(findAssistedPassCandidates(common).map(candidate=>candidate.receiver),debug.candidates.map(candidate=>candidate.receiver));
});

test("un pase a espacio no inventa receptor pero activa un corredor compatible",()=>{
  const players=[player(200,340,0,"MED"),player(390,250,0,"DEL"),player(330,520,0,"MED"),player(600,420,1,"DEF")];
  const targetPoint={x:610,y:190},runner=findSpacePassRunner({origin:{x:200,y:340},targetPoint,players,teamStart:0,teamEnd:3,carrierIndex:0,attackingDirection:1});
  assert.equal(runner?.runner,1);
  assert.deepEqual(runner?.targetPosition,targetPoint);
  assert.equal(findAssistedPassTarget({origin:{x:200,y:340},aim:{x:-1,y:0},passPower:.5,players,teamStart:0,teamEnd:3,opponentStart:3,opponentEnd:4,carrierIndex:0,assist:"ASSISTED",fieldDiagonal:1200,formatPlayers:5,attackingDirection:1}),null);
});
