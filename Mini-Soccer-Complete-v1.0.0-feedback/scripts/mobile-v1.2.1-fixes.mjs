import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const app=join(root,"app");

function read(name){return readFileSync(join(app,name),"utf8")}
function write(name,content){writeFileSync(join(app,name),content)}
function replaceOrThrow(source,from,to,label){
  const next=source.replace(from,to);
  if(next===source)throw new Error(`Mobile v1.2.1 patch did not match: ${label}`);
  return next;
}

// 1) Goalkeeper: bounded rush, forced recovery and no endless chase outside the save zone.
let ai=read("game-ai.ts");
if(!ai.includes("MSC_MOBILE_V121_KEEPER")){
  ai=replaceOrThrow(ai,/export function goalkeeperTarget\([\s\S]*?\n}\n\nexport function chooseGoalkeeperDistribution/,`// MSC_MOBILE_V121_KEEPER\nexport function goalkeeperTarget(player:AIPlayer,ball:AIBall,direction:1|-1,bounds:{left:number;right:number;top:number;bottom:number},goalY:number,opponentDistance=Infinity){\n  const ownGoalX=direction>0?bounds.left:bounds.right,fieldWidth=bounds.right-bounds.left,areaDepth=Math.min(190,fieldWidth*.17);\n  const distanceFromGoal=Math.abs(ball.x-ownGoalX),ballInArea=distanceFromGoal<areaDepth,ballApproaching=ball.vx*direction<0;\n  const keeperDepth=(player.x-ownGoalX)*direction,keeperOutsideSaveZone=keeperDepth>areaDepth*.78||keeperDepth<4;\n  const centralBall=Math.abs(ball.y-goalY)<118,oneOnOne=ballInArea&&centralBall&&opponentDistance<122;\n  const safeRush=!keeperOutsideSaveZone&&oneOnOne&&(ballApproaching||distanceFromGoal<areaDepth*.56);\n  const angleDepth=clamp(distanceFromGoal*.06,0,40),baseX=ownGoalX+direction*(19+angleDepth);\n  const recoveryNeeded=keeperOutsideSaveZone||(!ballInArea&&distanceFromGoal>areaDepth*1.05);\n  const recoveryX=ownGoalX+direction*22,rushLimit=ownGoalX+direction*areaDepth*.66;\n  const rawRush=ball.x-direction*22,rushX=direction>0?clamp(rawRush,ownGoalX+8,rushLimit):clamp(rawRush,rushLimit,ownGoalX-8);\n  const lateralFactor=safeRush?.66:distanceFromGoal<fieldWidth*.30?.40:.26;\n  const targetY=recoveryNeeded?goalY+(ball.y-goalY)*.12:goalY+(ball.y-goalY)*lateralFactor;\n  const y=clamp(targetY,goalY-70,goalY+70);\n  const state=recoveryNeeded?"RECOVER_GOAL_POSITION":safeRush?"CHARGE_BALL":ballApproaching&&distanceFromGoal<fieldWidth*.34?"PREPARE_SAVE":Math.abs(ball.y-goalY)>36?"ADJUST_ANGLE":"HOLD_POSITION";\n  return {x:clamp(recoveryNeeded?recoveryX:safeRush?rushX:baseX,bounds.left+20,bounds.right-20),y,state};\n}\n\nexport function chooseGoalkeeperDistribution`,"goalkeeperTarget");
  write("game-ai.ts",ai);
}

// 2) Passing: tap = short/soft, hold = progressively stronger. Compact formats remain below shot power.
let pass=read("pass-system.ts");
if(!pass.includes("MSC_MOBILE_V121_PASS_POWER")){
  pass=replaceOrThrow(pass,"minimumSpeed:{3:220,4:225,5:230,6:235}","minimumSpeed:{3:145,4:155,5:230,6:235}","compact minimum pass speed");
  pass=replaceOrThrow(pass,"maximumSpeed:{3:610,4:640,5:680,6:720}","maximumSpeed:{3:500,4:540,5:680,6:720}","compact maximum pass speed");
  pass=replaceOrThrow(pass,"    const userPowerModifier=clamp(.86+clamp(args.charge,0,1)*.30,.88,1.16);",`    // MSC_MOBILE_V121_PASS_POWER\n    const compactFormat=args.format===3||args.format===4,normalizedCharge=clamp(args.charge,0,1);\n    const userPowerModifier=compactFormat?clamp(.45+Math.pow(normalizedCharge,.82)*.78,.45,1.23):clamp(.86+normalizedCharge*.30,.88,1.16);`,"pass charge curve");
  pass=replaceOrThrow(pass,"    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,PASS_PHYSICS.minimumSpeed[args.format]*.88,PASS_PHYSICS.maximumSpeed[args.format]*1.05);",`    const lowerSpeed=compactFormat?PASS_PHYSICS.minimumSpeed[args.format]*.68:PASS_PHYSICS.minimumSpeed[args.format]*.88;\n    const finalSpeed=clamp(recommendedSpeed*userPowerModifier*powerErrorModifier,lowerSpeed,PASS_PHYSICS.maximumSpeed[args.format]*1.05);`,"pass final speed floor");
  write("pass-system.ts",pass);
}

// 3) Match runtime: manual keeper switching near own goal, automatic release back to AI, safer auto-switch and functional camera/zoom.
let page=read("page.tsx");
if(!page.includes("MSC_MOBILE_V121_RUNTIME")){
  page=replaceOrThrow(page,"manualSwitchGraceUntil=useRef(0),receiverSwitchLockUntil=useRef(0),nextSwitchCandidate=useRef(-1)","manualSwitchGraceUntil=useRef(0),receiverSwitchLockUntil=useRef(0),manualKeeperUntil=useRef(0),lastOutfieldActive=useRef(0),nextSwitchCandidate=useRef(-1)","keeper runtime refs");

  page=replaceOrThrow(page,/const switchBest=useCallback\(\(\)=>\{[\s\S]*?\},\[players\.length\]\);\n  const prepareHumanPass=/,`const switchBest=useCallback(()=>{\n    const now=performance.now(),current=bodies.current[active.current],keeperIndex=bodies.current.findIndex((player,index)=>index<players.length&&player.role==="ARQ"),b=ball.current;\n    const nearestOutfield=()=>{let best=-1,bestDistance=Infinity;for(let i=0;i<players.length;i++){const player=bodies.current[i];if(!player||player.role==="ARQ")continue;const d=Math.hypot(player.x-b.x,player.y-b.y);if(d<bestDistance){bestDistance=d;best=i}}return best};\n    if(keeperIndex>=0){\n      const keeper=bodies.current[keeperIndex],keeperDistance=Math.hypot(keeper.x-b.x,keeper.y-b.y),ballNearOwnGoal=b.x<fieldW*.36;\n      if(current?.role==="ARQ"){const fallback=nearestOutfield();if(fallback>=0){active.current=fallback;lastOutfieldActive.current=fallback}manualKeeperUntil.current=0;manualSwitchGraceUntil.current=now+320;pendingReceiverSwitch.current=null;autoSwitchMovement.current=null;return}\n      if(ballNearOwnGoal&&keeperDistance<168){lastOutfieldActive.current=active.current;active.current=keeperIndex;manualKeeperUntil.current=now+2600;manualSwitchGraceUntil.current=now+320;receiverSwitchLockUntil.current=now+320;pendingReceiverSwitch.current=null;autoSwitchMovement.current=null;return}\n    }\n    const owner=aiOwner.current,context=owner===null?"LOOSE":bodies.current[owner]?.team===0?"ATTACK":"DEFENSE",candidate=bestSwitchCandidate({players:bodies.current,start:0,end:players.length,current:active.current,ball:ball.current,ownGoalX:46,attackingDirection:1,context});\n    let target=candidate?.index??-1;if(target>=0&&bodies.current[target]?.role==="ARQ")target=nearestOutfield();if(target<0)return;active.current=target;lastOutfieldActive.current=target;nextSwitchCandidate.current=-1;manualSwitchGraceUntil.current=now+420;receiverSwitchLockUntil.current=now+420;pendingReceiverSwitch.current=null;autoSwitchMovement.current=null\n  },[players.length,fieldW]);\n  const prepareHumanPass=`,"manual keeper switch callback");

  page=replaceOrThrow(page,"const me=bodies.current[active.current];let mx=mobileMove.current.active?mobileMove.current.x:",`// MSC_MOBILE_V121_RUNTIME\n        const activeBefore=bodies.current[active.current];if(activeBefore?.role==="ARQ"&&manualKeeperUntil.current>0&&(ts>=manualKeeperUntil.current||b.x>left+(right-left)*.36)){let fallback=lastOutfieldActive.current;if(!bodies.current[fallback]||bodies.current[fallback].role==="ARQ"){let best=-1,bestDistance=Infinity;for(let i=0;i<n;i++){const candidate=bodies.current[i];if(!candidate||candidate.role==="ARQ")continue;const d=Math.hypot(candidate.x-b.x,candidate.y-b.y);if(d<bestDistance){bestDistance=d;best=i}}fallback=best}if(fallback>=0)active.current=fallback;manualKeeperUntil.current=0;pendingReceiverSwitch.current=null;autoSwitchMovement.current=null}\n        const me=bodies.current[active.current];let mx=mobileMove.current.active?mobileMove.current.x:`,"automatic keeper release");

  page=replaceOrThrow(page,"const switchContext=owner===null?\"LOOSE\":bodies.current[owner]?.team===0?\"ATTACK\":\"DEFENSE\",candidate=bestSwitchCandidate({players:bodies.current,start:0,end:n,current:active.current,ball:b,ownGoalX:left,attackingDirection:1,context:switchContext});","const switchContext=owner===null?\"LOOSE\":bodies.current[owner]?.team===0?\"ATTACK\":\"DEFENSE\",candidateRaw=bestSwitchCandidate({players:bodies.current,start:0,end:n,current:active.current,ball:b,ownGoalX:left,attackingDirection:1,context:switchContext}),candidate=candidateRaw&&bodies.current[candidateRaw.index]?.role!==\"ARQ\"?candidateRaw:null;","prevent automatic keeper switching");

  page=replaceOrThrow(page,"const commitHumanPass=useCallback((charge:number)=>{passChargeRef.current=Math.max(12,charge*100);releasePass.current=true},[]);","const commitHumanPass=useCallback((charge:number)=>{passChargeRef.current=isMobileRef.current?Math.max(3,charge*100):Math.max(12,charge*100);releasePass.current=true},[]);","mobile tap pass floor");
  page=page.replaceAll("Math.max(12,passChargeRef.current)/100","Math.max(mobileRuntime?3:12,passChargeRef.current)/100");

  page=replaceOrThrow(page,/if\(settings\.gameplay\.dynamicZoom&&bodies\.current\.length&&fpsFrames\.current%10===0\)\{const xs=bodies\.current\.map\(player=>player\.x\),spread=\(Math\.max\(\.\.\.xs\)-Math\.min\(\.\.\.xs\)\)\/Math\.max\(1,fieldW\),zoom=Math\.max\(\.97,Math\.min\(1\.025,1\.025-spread\*\.055\)\);c\.style\.transform=`scale\(\$\{zoom\.toFixed\(3\)\}\)`\}else if\(!settings\.gameplay\.dynamicZoom\)c\.style\.transform="";/,`const cameraBase=mobileRuntime?(settings.camera==="CERCANA"?1.12:settings.camera==="ABIERTA"?.98:1.055):(settings.camera==="CERCANA"?1.06:settings.camera==="ABIERTA"?.94:1);\n      if(settings.gameplay.dynamicZoom&&bodies.current.length&&fpsFrames.current%10===0){const xs=bodies.current.map(player=>player.x),spread=(Math.max(...xs)-Math.min(...xs))/Math.max(1,fieldW),dynamicOffset=(.5-spread)*.045,zoom=Math.max(cameraBase-.035,Math.min(cameraBase+.025,cameraBase+dynamicOffset));c.style.transform=\`scale(\${zoom.toFixed(3)})\`}else c.style.transform=\`scale(\${cameraBase.toFixed(3)})\`;`,"functional camera and dynamic zoom");
  write("page.tsx",page);
}

// 4) Settings UI: make every category usable on landscape phones and provide immediate applied feedback.
let settings=read("settings-menu.tsx");
if(!settings.includes("MSC_MOBILE_V121_SETTINGS")){
  settings=replaceOrThrow(settings,"    const context = uiAudioContext || new AudioContextConstructor();\n    uiAudioContext = context;","    const context = uiAudioContext || new AudioContextConstructor();\n    uiAudioContext = context;\n    if (context.state === \"suspended\") void context.resume();","resume mobile UI audio context");
  settings=replaceOrThrow(settings,"  const [showChangelog, setShowChangelog] = useState(false);","  const [showChangelog, setShowChangelog] = useState(false);\n  const [applied, setApplied] = useState(false); // MSC_MOBILE_V121_SETTINGS","settings applied state");
  settings=replaceOrThrow(settings,"  const activeBindings = settings.controls.profiles[activeProfile];\n\n  const update = (next: Partial<SettingsState>) => onChange({ ...settings, ...next });","  const activeBindings = settings.controls.profiles[activeProfile];\n  const applyChange = (next: SettingsState) => { onChange(next); setApplied(true); window.setTimeout(() => setApplied(false), 850); };\n\n  useEffect(() => { document.querySelector<HTMLElement>(\".console-settings-panel\")?.scrollTo({ top: 0 }); }, [category]);\n\n  const update = (next: Partial<SettingsState>) => applyChange({ ...settings, ...next });","settings apply helper");
  settings=settings.replaceAll("onChange({ ...settings, gameplay: { ...settings.gameplay, ...next } });","applyChange({ ...settings, gameplay: { ...settings.gameplay, ...next } });");
  settings=settings.replaceAll("onChange({ ...settings, graphics: { ...settings.graphics, ...next, preset: next.preset ?? \"CUSTOM\" } });","applyChange({ ...settings, graphics: { ...settings.graphics, ...next, preset: next.preset ?? \"CUSTOM\" } });");
  settings=settings.replaceAll("onChange({ ...settings, audio, sound: audio.master > 0, music: audio.musicEnabled, crowd: audio.crowdEnabled });","applyChange({ ...settings, audio, sound: audio.master > 0, music: audio.musicEnabled, crowd: audio.crowdEnabled });");
  settings=settings.replaceAll("onChange({ ...settings, accessibility, reducedMotion: accessibility.reducedMotion });","applyChange({ ...settings, accessibility, reducedMotion: accessibility.reducedMotion });");
  settings=settings.replaceAll("const writeBindings = (bindings: typeof activeBindings) => onChange({","const writeBindings = (bindings: typeof activeBindings) => applyChange({");
  settings=settings.replaceAll("const setProfile = (profile: ControlProfileId) => onChange({","const setProfile = (profile: ControlProfileId) => applyChange({");
  settings=settings.replaceAll("    onChange(applyGraphicsPreset(settings, preset));","    applyChange(applyGraphicsPreset(settings, preset));");
  settings=settings.replaceAll("onClick={() => onChange(applyGraphicsPreset(settings, preset))}","onClick={() => applyChange(applyGraphicsPreset(settings, preset))}");
  settings=replaceOrThrow(settings,"  return <div className={`console-settings ${embedded ? \"embedded\" : \"\"}`}","  return <div className={`console-settings ${embedded ? \"embedded\" : \"\"}`}","settings root anchor");
  settings=replaceOrThrow(settings,"    <header><button type=\"button\" onClick={onBack}>","    {applied && <div className=\"settings-applied-toast\">✓ {tr(lang, \"APLICADO\", \"APPLIED\")}</div>}\n    <header><button type=\"button\" onClick={onBack}>","settings applied toast");
  write("settings-menu.tsx",settings);
}

let css=read("mobile.css");
if(!css.includes("MSC_MOBILE_V121_SETTINGS_CSS")){
  css=replaceOrThrow(css,"transform:scale(1.06)!important;transform-origin:center center","transform-origin:center center","remove forced camera transform");
  css+=`\n\n/* MSC_MOBILE_V121_SETTINGS_CSS — touch-safe settings and visible live feedback. */\n.settings-applied-toast{position:fixed;z-index:160;right:max(10px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));padding:7px 11px;border:1px solid rgba(217,255,69,.75);border-radius:999px;background:rgba(7,20,11,.94);color:#d9ff45;font-size:9px;font-weight:950;letter-spacing:.08em;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none}\n@media (hover:none) and (pointer:coarse) and (orientation:landscape){\n  .console-settings{width:100vw!important;height:100dvh!important;min-height:100dvh!important;margin:0!important;border:0!important;overflow:hidden!important}\n  .console-settings>header{height:52px!important;grid-template-columns:132px 1fr 42px!important;padding:0 max(10px,env(safe-area-inset-left))!important}\n  .console-settings>header h1{font-size:16px!important;margin-top:2px!important}.console-settings>header span{font-size:6px!important}.console-settings>header em{font-size:22px!important}\n  .console-settings-layout{height:calc(100dvh - 52px)!important;min-height:0!important;grid-template-columns:150px minmax(0,1fr)!important}\n  .console-settings nav{height:100%!important;overflow-y:auto!important;padding:4px 0 10px!important;-webkit-overflow-scrolling:touch}\n  .console-settings nav button{min-height:43px!important;padding:8px 9px!important;grid-template-columns:27px 1fr 12px!important;touch-action:manipulation!important}\n  .console-settings nav button i{font-size:15px!important}.console-settings nav button span{display:block!important;font-size:8px!important}.console-settings nav button b{display:block!important;font-size:14px!important}\n  .console-settings-panel{height:100%!important;max-height:none!important;overflow-y:auto!important;padding:10px 12px 30px!important;-webkit-overflow-scrolling:touch}\n  .console-panel-title{padding-bottom:9px!important;margin-bottom:9px!important}.console-panel-title>span{width:34px!important;height:34px!important;font-size:18px!important}.console-panel-title h2{font-size:17px!important}.console-panel-title p{font-size:7px!important}\n  .console-setting-row,.console-toggle{min-height:48px!important;padding:7px 10px!important;gap:10px!important}.console-setting-row b,.console-toggle b{font-size:9px!important}.console-setting-row small,.console-toggle small{font-size:7px!important}\n  .console-setting-row select{padding:8px!important}.console-setting-row input[type=range]{height:30px!important;touch-action:pan-x!important}\n  .preset-grid{grid-template-columns:repeat(5,1fr)!important}.preset-grid button,.profile-tabs button,.auto-detect,.restore-settings{min-height:38px!important;padding:7px 5px!important}\n  .settings-feedback-shortcuts{display:none!important}\n}\n`;
  write("mobile.css",css);
}

// Final verification: fail the build rather than publish a half-applied patch.
const checks=[
  [read("game-ai.ts").includes("MSC_MOBILE_V121_KEEPER"),"goalkeeper recovery"],
  [read("pass-system.ts").includes("MSC_MOBILE_V121_PASS_POWER"),"progressive pass power"],
  [read("page.tsx").includes("manualKeeperUntil")&&read("page.tsx").includes("MSC_MOBILE_V121_RUNTIME"),"manual keeper runtime"],
  [read("settings-menu.tsx").includes("settings-applied-toast"),"settings feedback"],
  [read("mobile.css").includes("MSC_MOBILE_V121_SETTINGS_CSS")&&!read("mobile.css").includes("transform:scale(1.06)!important"),"mobile settings/camera css"],
];
for(const [ok,label] of checks)if(!ok)throw new Error(`Mobile v1.2.1 verification failed: ${label}`);
console.log("Mini Soccer Complete v1.2.1 fixes verified.");
