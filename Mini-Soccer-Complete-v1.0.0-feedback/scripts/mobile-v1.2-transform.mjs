import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const app = join(root, "app");

function patchFile(path, marker, patches) {
  let source = readFileSync(path, "utf8");
  if (marker && source.includes(marker)) return;
  const original = source;
  for (const patch of patches) {
    const before = source;
    source = source.replace(patch.from, patch.to);
    if (source === before && patch.required !== false) {
      throw new Error(`Mobile v1.2 patch did not match in ${path}: ${String(patch.from).slice(0, 100)}`);
    }
  }
  if (source === original) throw new Error(`No changes applied to ${path}`);
  writeFileSync(path, source);
}

patchFile(join(app, "page.tsx"), "MSC_MOBILE_V12_RUNTIME", [
  { from: '"use client";', to: '"use client";\n\n// MSC_MOBILE_V12_RUNTIME — mobile-specific input/pacing layer generated at build time.' },
  { from: 'const FORMATION_PRESETS: Record<PlayerCount,Record<string,Position[]>> = {\n  4:', to: 'const FORMATION_PRESETS: Record<PlayerCount,Record<string,Position[]>> = {\n  3:{"1-1":[{x:76,y:50},{x:40,y:50},{x:8,y:50}]},\n  4:' },
  { from: 'const DEFAULT_FORMATION_NAME:Record<PlayerCount,string>={4:"1-1-1",5:"1-2-1",6:"2-2-1"};', to: 'const DEFAULT_FORMATION_NAME:Record<PlayerCount,string>={3:"1-1",4:"1-1-1",5:"1-2-1",6:"2-2-1"};' },
  { from: 'const MODE_FORMAT: Record<Mode,PlayerCount> = {Amistoso:5,Champions:6,Libertadores:6,Mundial:6,"Europa League":6,Carrera:5,Temporada:5};', to: 'const MODE_FORMAT: Record<Mode,PlayerCount> = {Amistoso:3,Champions:4,Libertadores:4,Mundial:4,"Europa League":4,Carrera:3,Temporada:3};' },
  { from: 'const [playerCount,setPlayerCount] = useState<PlayerCount>(5);', to: 'const [playerCount,setPlayerCount] = useState<PlayerCount>(3);' },
  { from: 'const [selected,setSelected] = useState(defaultSelection(5));', to: 'const [selected,setSelected] = useState(defaultSelection(3));' },
  { from: 'const [formationPositions,setFormationPositions] = useState<Position[]>(FORMATIONS[5]);', to: 'const [formationPositions,setFormationPositions] = useState<Position[]>(FORMATIONS[3]);' },
  { from: 'const [formationName,setFormationName] = useState(DEFAULT_FORMATION_NAME[5]);', to: 'const [formationName,setFormationName] = useState(DEFAULT_FORMATION_NAME[3]);' },
  { from: 'setFormationName(p.formationName||DEFAULT_FORMATION_NAME[5]);', to: 'setFormationName(p.formationName||DEFAULT_FORMATION_NAME[3]);' },
  { from: 'const restoredProfile=parseProfileState(localStorage.getItem("msc-profile-v1")),restoredSettings=parseSettingsState(localStorage.getItem("msc-settings-v1"));', to: 'const restoredProfileRaw=parseProfileState(localStorage.getItem("msc-profile-v1")),restoredProfile={...restoredProfileRaw,preferredFormat:(PUBLIC_FORMATS.includes(restoredProfileRaw.preferredFormat)?restoredProfileRaw.preferredFormat:3) as PlayerCount},restoredSettings=parseSettingsState(localStorage.getItem("msc-settings-v1"));' },
  { from: 'if(state&&state.tournamentType===cup)restored[cup]=state', to: 'if(state&&state.tournamentType===cup&&PUBLIC_FORMATS.includes(state.matchFormat))restored[cup]=state' },
  { from: 'const pitchLabel=playerCount===4?txt(lang,"Cancha rápida","Fast pitch"):playerCount===5?txt(lang,"Cancha competitiva","Competitive pitch"):txt(lang,"Cancha táctica","Tactical pitch");', to: 'const pitchLabel=playerCount===3?txt(lang,"Cancha compacta móvil","Compact mobile pitch"):txt(lang,"Cancha equilibrada móvil","Balanced mobile pitch");' },
  { from: 'txt(lang,`Elegí 4v4, 5v5 o 6v6 · el rival lo define el modo`,`Choose 4v4, 5v5 or 6v6 · the mode selects the opponent`)', to: 'txt(lang,`Elegí 3v3 o 4v4 · el rival lo define el modo`,`Choose 3v3 or 4v4 · the mode selects the opponent`)' },
  { from: 'format===5?txt(lang,"RECOMENDADO","RECOMMENDED"):format===4?txt(lang,"RÁPIDO","FAST"):txt(lang,"TÁCTICO","TACTICAL")', to: 'format===3?txt(lang,"MÓVIL ★","MOBILE ★"):txt(lang,"EQUILIBRADO","BALANCED")' },
  { from: 'format===4?txt(lang,"RÁPIDO","FAST"):format===5?txt(lang,"EQUILIBRADO ★","BALANCED ★"):txt(lang,"TÁCTICO","TACTICAL")', to: 'format===3?txt(lang,"DINÁMICO ★","DYNAMIC ★"):txt(lang,"EQUILIBRADO","BALANCED")' },
  { from: 'const autosaveRef=useRef(onAutosave),initialResumeSnapshot=useRef(resumeSnapshot);', to: 'const mobileMove=useRef({x:0,y:0,active:false}),isMobileRef=useRef(false);\n  const autosaveRef=useRef(onAutosave),initialResumeSnapshot=useRef(resumeSnapshot);' },
  { from: 'useEffect(()=>{inputManager.current.setBindings(activeBindings)},[activeBindings]);', to: 'useEffect(()=>{inputManager.current.setBindings(activeBindings)},[activeBindings]);\n  useEffect(()=>{isMobileRef.current=window.matchMedia("(hover:none) and (pointer:coarse)").matches;const handleStick=(event:Event)=>{const detail=(event as CustomEvent<{x:number;y:number;active:boolean}>).detail;if(!detail)return;mobileMove.current={x:detail.x,y:detail.y,active:detail.active};if(detail.active&&Math.hypot(detail.x,detail.y)>.12){const aim=normalizedAim(detail.x,detail.y,rawAimDirection.current);rawAimDirection.current=aim;lastPassIntentDirection.current=aim;passIntentTouched.current=true}};window.addEventListener("msc-mobile-stick",handleStick as EventListener);return()=>window.removeEventListener("msc-mobile-stick",handleStick as EventListener)},[]);' },
  { from: 'useEffect(()=>{const c=canvasRef.current;if(!c)return;const ctx=c.getContext("2d")!;let raf=0;const profile=createAIProfile(DIFFICULTY_KEYS[difficulty]),n=players.length,aiAccel=1010,aiMax=180;', to: 'useEffect(()=>{const c=canvasRef.current;if(!c)return;const ctx=c.getContext("2d")!;let raf=0;const mobileRuntime=window.matchMedia("(hover:none) and (pointer:coarse)").matches,baseProfile=createAIProfile(DIFFICULTY_KEYS[difficulty]),profile=mobileRuntime?{...baseProfile,decisionInterval:baseProfile.decisionInterval*1.12,decisionDelay:baseProfile.decisionDelay*1.12,intentDuration:baseProfile.intentDuration*1.08}:baseProfile,n=players.length,aiAccel=mobileRuntime?850:1010,aiMax=mobileRuntime?152:180;' },
  { from: 'const me=bodies.current[active.current];let mx=(inputManager.current.isHeld("MOVE_RIGHT")?1:0)-(inputManager.current.isHeld("MOVE_LEFT")?1:0),my=(inputManager.current.isHeld("MOVE_DOWN")?1:0)-(inputManager.current.isHeld("MOVE_UP")?1:0);const len=Math.hypot(mx,my)||1;mx/=len;my/=len;const moving=Math.abs(mx)+Math.abs(my)>0,sprint=inputManager.current.isHeld("SPRINT")&&staminaRef.current>4;', to: 'const me=bodies.current[active.current];let mx=mobileMove.current.active?mobileMove.current.x:(inputManager.current.isHeld("MOVE_RIGHT")?1:0)-(inputManager.current.isHeld("MOVE_LEFT")?1:0),my=mobileMove.current.active?mobileMove.current.y:(inputManager.current.isHeld("MOVE_DOWN")?1:0)-(inputManager.current.isHeld("MOVE_UP")?1:0);const moveLength=Math.hypot(mx,my);if(moveLength>1){mx/=moveLength;my/=moveLength}const moving=Math.hypot(mx,my)>.04,sprint=inputManager.current.isHeld("SPRINT")&&staminaRef.current>4;if(mobileMove.current.active&&moving){const joyAim=normalizedAim(mx,my,rawAimDirection.current);rawAimDirection.current=joyAim;lastPassIntentDirection.current=joyAim;passIntentTouched.current=true}' },
  { from: 'const accel=sprint?1430:1050;me.vx+=mx*accel*dt;me.vy+=my*accel*dt;', to: 'const accel=mobileRuntime?(sprint?1160:880):(sprint?1430:1050);me.vx+=mx*accel*dt;me.vy+=my*accel*dt;' },
  { from: 'const personality=playerPersonality(p),dribbling=owner===i?DRIBBLE_SPEED_MULTIPLIER:1,max=(i===active.current&&sprint?205:i===active.current?150:aiMax)*personality.pace*dribbling,sp=Math.hypot(p.vx,p.vy);', to: 'const personality=playerPersonality(p),dribbling=owner===i?DRIBBLE_SPEED_MULTIPLIER:1,controlledMax=i===active.current?(mobileRuntime?(sprint?172:128):(sprint?205:150)):aiMax,max=controlledMax*personality.pace*dribbling,sp=Math.hypot(p.vx,p.vy);' },
  { from: 'displayAim.current=normalizedAim(displayAim.current.x+(desired.x-displayAim.current.x)*.34,displayAim.current.y+(desired.y-displayAim.current.y)*.34,desired);', to: 'const aimFollow=mobileRuntime?.72:.34;displayAim.current=normalizedAim(displayAim.current.x+(desired.x-displayAim.current.x)*aimFollow,displayAim.current.y+(desired.y-displayAim.current.y)*aimFollow,desired);' },
  { from: 'const touch=(action:InputAction,value:boolean)=>inputManager.current.setTouchAction(action,value),touchPassMove=(e:ReactPointerEvent<HTMLButtonElement>)=>{const start=touchPassStart.current;if(!start)return;', to: 'const touch=(action:InputAction,value:boolean)=>inputManager.current.setTouchAction(action,value),touchPassMove=(e:ReactPointerEvent<HTMLButtonElement>)=>{if(isMobileRef.current)return;const start=touchPassStart.current;if(!start)return;' },
  { from: 'const aimY=cy+((inputManager.current.isHeld("MOVE_DOWN")?1:0)-(inputManager.current.isHeld("MOVE_UP")?1:0))*82,goalX=right+80,', to: 'const shootYInput=mobileMove.current.active?mobileMove.current.y:((inputManager.current.isHeld("MOVE_DOWN")?1:0)-(inputManager.current.isHeld("MOVE_UP")?1:0)),aimY=cy+shootYInput*82,goalX=right+80,' },
]);

patchFile(join(app, "pass-system.ts"), "MSC_MOBILE_V12_PASS", [
  { from: 'export type PassFormat = 4|5|6;', to: '// MSC_MOBILE_V12_PASS\nexport type PassFormat = 3|4|5|6;' },
  { from: 'minimumSpeed:{4:225,5:230,6:235}', to: 'minimumSpeed:{3:220,4:225,5:230,6:235}' },
  { from: 'maximumSpeed:{4:640,5:680,6:720}', to: 'maximumSpeed:{3:610,4:640,5:680,6:720}' },
  { from: 'maximumLeadDistance:{4:88,5:108,6:130}', to: 'maximumLeadDistance:{3:78,4:88,5:108,6:130}' },
  { from: 'const scale=args.format===4?.92:args.format===6?1.08:1;', to: 'const scale=args.format===3?.88:args.format===4?.92:args.format===6?1.08:1;' },
]);

patchFile(join(app, "game-ai.ts"), "MSC_MOBILE_V12_AI", [
  { from: 'export type PassReceiverLockMode = "LATE"|"ANIMATION_START"|"POWER_UP";', to: '// MSC_MOBILE_V12_AI\nexport type PassReceiverLockMode = "LATE"|"ANIMATION_START"|"POWER_UP";' },
  { from: 'coneHalfAngleDegrees:{4:38,5:34,6:31}', to: 'coneHalfAngleDegrees:{3:40,4:38,5:34,6:31}' },
  { from: 'targetLockMs:{4:200,5:190,6:180}', to: 'targetLockMs:{3:210,4:200,5:190,6:180}' },
  { from: /4\|5\|6/g, to: '3|4|5|6', required: false },
]);

console.log("Mini Soccer Complete v1.2.0 mobile runtime patch applied.");
