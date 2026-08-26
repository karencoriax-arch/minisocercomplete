import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const app=join(root,"app");
const read=name=>readFileSync(join(app,name),"utf8");
const write=(name,content)=>writeFileSync(join(app,name),content);
const replaceRequired=(source,from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`v2.2 store patch did not match: ${label}`);return next};

let page=read("page.tsx");
if(!page.includes("MSC_V22_STORE")){
  page=replaceRequired(page,
    '// MSC_V21_PROGRESSION — XP, levels, missions, achievements and lifetime stats.',
    '// MSC_V21_PROGRESSION — XP, levels, missions, achievements and lifetime stats.\nimport { DEFAULT_CUSTOMIZATION, cosmeticById, parseCustomizationState, type CosmeticItem, type CustomizationState } from "./customization-v22";\nimport { GameplayCosmeticLayer, StoreV22 } from "./customization-v22-ui";\n// MSC_V22_STORE — cosmetic-only store and persistent loadout.',
    "imports");

  page=replaceRequired(page,
    'type Screen = "profile" | "home" | "cupSetup" | "tournament" | "setup" | "squad" | "boosts" | "economy" | "progression" | "game" | "result" | "trophies" | "settings";',
    'type Screen = "profile" | "home" | "cupSetup" | "tournament" | "setup" | "squad" | "boosts" | "economy" | "store" | "progression" | "game" | "result" | "trophies" | "settings";',
    "screen union");

  page=replaceRequired(page,
    '  const [progression,setProgression]=useState<ProgressionState>(DEFAULT_PROGRESSION);\n  const progressionRef=useRef<ProgressionState>(DEFAULT_PROGRESSION);',
    '  const [progression,setProgression]=useState<ProgressionState>(DEFAULT_PROGRESSION);\n  const progressionRef=useRef<ProgressionState>(DEFAULT_PROGRESSION);\n  const [customization,setCustomization]=useState<CustomizationState>(DEFAULT_CUSTOMIZATION);',
    "customization state");

  page=replaceRequired(page,
    'const restoredProgression=parseProgressionState(localStorage.getItem("msc-progression-v21"));setProgression(restoredProgression);progressionRef.current=restoredProgression;',
    'const restoredProgression=parseProgressionState(localStorage.getItem("msc-progression-v21"));setProgression(restoredProgression);progressionRef.current=restoredProgression;setCustomization(parseCustomizationState(localStorage.getItem("msc-customization-v22")));',
    "customization hydration");

  page=replaceRequired(page,
    '  useEffect(()=>{progressionRef.current=progression;if(progressHydrated)localStorage.setItem("msc-progression-v21",JSON.stringify(progression))},[progression,progressHydrated]);',
    '  useEffect(()=>{progressionRef.current=progression;if(progressHydrated)localStorage.setItem("msc-progression-v21",JSON.stringify(progression))},[progression,progressHydrated]);\n  useEffect(()=>{if(progressHydrated)localStorage.setItem("msc-customization-v22",JSON.stringify(customization))},[customization,progressHydrated]);',
    "customization persistence");

  page=replaceRequired(page,
    '  const equippedKit=TEAMS.find(t=>t.id===economy.equippedKitId&&t.region==="Mundial")??null;',
    '  const equippedKit=TEAMS.find(t=>t.id===economy.equippedKitId&&t.region==="Mundial")??null;\n  const customKit=cosmeticById(customization.equipped.kit);\n  const cosmeticBall=cosmeticById(customization.equipped.ball);\n  const cosmeticTrail=cosmeticById(customization.equipped.trail);\n  const hudTheme=cosmeticById(customization.equipped.hudTheme);',
    "equipped cosmetics");

  page=replaceRequired(page,
    'className={`app resolution-${resolution.toLowerCase().replace(" ","-")} ${screen==="home"?"home-light":""} ${settings.accessibility.reducedMotion?"reduced-motion":""} ${settings.accessibility.highContrast?"high-contrast":""} ui-scale-${settings.accessibility.uiScale.toLowerCase()}`}',
    'className={`app resolution-${resolution.toLowerCase().replace(" ","-")} ${screen==="home"?"home-light":""} ${settings.accessibility.reducedMotion?"reduced-motion":""} ${settings.accessibility.highContrast?"high-contrast":""} ui-scale-${settings.accessibility.uiScale.toLowerCase()} hud-theme-${customization.equipped.hudTheme??"default"}`}',
    "hud theme class");
  page=replaceRequired(page,
    'style={{"--profile-accent":profile.accentColor} as CSSProperties}',
    'style={{"--profile-accent":hudTheme?.preview.secondary??profile.accentColor,"--lime":hudTheme?.preview.secondary??"#d9ff45","--panel":hudTheme?.preview.primary??"#101914"} as CSSProperties}',
    "hud theme accent and panel");

  page=replaceRequired(page,
    '    {screen==="economy" && <EconomyHub lang={lang} state={economy} teams={TEAMS} onChange={next=>{economyRef.current=next;setEconomy(next)}} onBack={()=>setScreen("home")} onProgression={()=>setScreen("progression")}/>}\n    {screen==="progression"',
    '    {screen==="economy" && <EconomyHub lang={lang} state={economy} teams={TEAMS} onChange={next=>{economyRef.current=next;setEconomy(next)}} onBack={()=>setScreen("home")} onProgression={()=>setScreen("progression")} onStore={()=>setScreen("store")} onNationalKitEquip={()=>setCustomization(current=>({...current,equipped:{...current.equipped,kit:null}}))}/>}\n    {screen==="store" && <StoreV22 lang={lang} economy={economy} customization={customization} onEconomyChange={next=>{economyRef.current=next;setEconomy(next)}} onCustomizationChange={setCustomization} onBack={()=>setScreen("economy")}/>}\n    {screen==="progression"',
    "store screen");

  page=replaceRequired(page,
    'onFinish={finish} boosts={matchBoosts} kitColors={equippedKit?{color:equippedKit.color,accent:equippedKit.accent,name:equippedKit.name}:null}/>',
    'onFinish={finish} boosts={matchBoosts} kitColors={customKit?.category==="KIT"?{color:customKit.preview.primary,accent:customKit.preview.secondary,name:(lang==="es"?customKit.name[0]:customKit.name[1])}:equippedKit?{color:equippedKit.color,accent:equippedKit.accent,name:equippedKit.name}:null} cosmeticBall={cosmeticBall} cosmeticTrail={cosmeticTrail}/>',
    "game cosmetic props");
  page=page.replace('    {screen==="result" && <Result','    {screen==="game"&&<GameplayCosmeticLayer customization={customization} goalActive={Boolean(goal)}/>}\n    {screen==="result" && <Result');
  if(!page.includes("GameplayCosmeticLayer customization"))throw new Error("v2.2 store patch did not match: gameplay cosmetic overlay");

  page=replaceRequired(page,
    'onFeedback,onExit,onFinish,boosts,kitColors}:{lang:Lang;',
    'onFeedback,onExit,onFinish,boosts,kitColors,cosmeticBall,cosmeticTrail}:{lang:Lang;',
    "game prop destructuring");
  page=replaceRequired(page,
    'onFinish:(s:[number,number],goals:GoalEvent[],report?:MatchReport)=>void;boosts:MatchBoostSelection;kitColors:{color:string;accent:string;name:string}|null}){',
    'onFinish:(s:[number,number],goals:GoalEvent[],report?:MatchReport)=>void;boosts:MatchBoostSelection;kitColors:{color:string;accent:string;name:string}|null;cosmeticBall:CosmeticItem|null;cosmeticTrail:CosmeticItem|null}){',
    "game cosmetic prop types");

  const oldBall='const b=renderBall,controlled=renderBodies[active.current];ctx.save();ctx.shadowColor="#000";ctx.shadowBlur=settings.graphics.playerShadows?8:0;ctx.fillStyle=ballStyle==="Neón"?"#d9ff45":ballStyle==="Champions"?"#f3f4f6":ballStyle==="Retro"?"#d7b98e":"#fff";ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.fillStyle=ballStyle==="Champions"?"#4f46e5":"#111";ctx.font="10px Arial";ctx.textAlign="center";ctx.fillText(ballStyle==="Champions"?"★":"◆",b.x,b.y+4);ctx.restore();';
  const newBall='const b=renderBall,controlled=renderBodies[active.current];if(cosmeticTrail&&Math.hypot(b.vx,b.vy)>35){const speed=Math.max(1,Math.hypot(b.vx,b.vy)),nx=b.vx/speed,ny=b.vy/speed;ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle=cosmeticTrail.preview.primary;ctx.lineWidth=Math.max(3,b.r*.7);ctx.lineCap="round";ctx.shadowColor=cosmeticTrail.preview.primary;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(b.x-nx*b.r,b.y-ny*b.r);ctx.lineTo(b.x-nx*(b.r+Math.min(38,speed*.045)),b.y-ny*(b.r+Math.min(38,speed*.045)));ctx.stroke();ctx.restore()}ctx.save();ctx.shadowColor=cosmeticBall?.preview.secondary??"#000";ctx.shadowBlur=cosmeticBall?12:(settings.graphics.playerShadows?8:0);ctx.fillStyle=cosmeticBall?.preview.primary??(ballStyle==="Neón"?"#d9ff45":ballStyle==="Champions"?"#f3f4f6":ballStyle==="Retro"?"#d7b98e":"#fff");ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.fillStyle=cosmeticBall?.preview.secondary??(ballStyle==="Champions"?"#4f46e5":"#111");ctx.font="10px Arial";ctx.textAlign="center";ctx.fillText(cosmeticBall?"◆":ballStyle==="Champions"?"★":"◆",b.x,b.y+4);ctx.restore();';
  page=replaceRequired(page,oldBall,newBall,"cosmetic ball and trail render");
  page=replaceRequired(page,
    '[difficulty,team,rival,ballStyle,passAssist,setScore,setGoal,cheer,crowdMurmur,effect,reset,rivalPlayers,players,formation,instructions,tactic,playerCount,fieldW,match,settings]',
    '[difficulty,team,rival,ballStyle,cosmeticBall,cosmeticTrail,passAssist,setScore,setGoal,cheer,crowdMurmur,effect,reset,rivalPlayers,players,formation,instructions,tactic,playerCount,fieldW,match,settings]',
    "render dependencies");

  write("page.tsx",page);
}

let economyUi=read("economy-v2-ui.tsx");
if(!economyUi.includes("MSC_V22_STORE_LINK")){
  economyUi=replaceRequired(economyUi,
    'export function EconomyHub({lang,state,teams,onChange,onBack,onProgression}:{lang:EconomyLang;state:EconomyState;teams:EconomyTeam[];onChange:(state:EconomyState)=>void;onBack:()=>void;onProgression:()=>void}){',
    'export function EconomyHub({lang,state,teams,onChange,onBack,onProgression,onStore,onNationalKitEquip}:{lang:EconomyLang;state:EconomyState;teams:EconomyTeam[];onChange:(state:EconomyState)=>void;onBack:()=>void;onProgression:()=>void;onStore:()=>void;onNationalKitEquip:()=>void}){\n  // MSC_V22_STORE_LINK — cosmetic store is separate from consumable resources.',
    "economy store signature");
  economyUi=replaceRequired(economyUi,
    'onClick={()=>onChange(equipKit(state,equipped?null:kit.id))}',
    'onClick={()=>{onChange(equipKit(state,equipped?null:kit.id));if(!equipped)onNationalKitEquip()}}',
    "national kit exclusivity");
  economyUi=replaceRequired(economyUi,
    '<nav className="v2-economy-tabs">',
    '<div className="v22-store-entry"><button onClick={onStore}><span>✦</span><div><small>MINI SOCCER COMPLETE 2.2</small><b>{tr(lang,"TIENDA 2.0 Y PERSONALIZACIÓN","STORE 2.0 & CUSTOMIZATION")}</b><em>{tr(lang,"Camisetas originales · pelotas · estelas · efectos de gol · celebraciones · HUD","Original kits · balls · trails · goal effects · celebrations · HUD")}</em></div><i>→</i></button></div><nav className="v2-economy-tabs">',
    "store entry");
  write("economy-v2-ui.tsx",economyUi);
}

let css=read("globals.css");
if(!css.includes("MSC_V22_STORE_STYLES")){
  css+=`\n/* MSC_V22_STORE_STYLES */\n${read("customization-v22.css")}\n.v22-store-entry{margin:16px 0}.v22-store-entry>button{width:100%;background:linear-gradient(135deg,#111820,#18231d);border:1px solid #334139;border-radius:17px;color:#fff;padding:16px 18px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;text-align:left;cursor:pointer}.v22-store-entry>button>span{font-size:2rem;color:var(--profile-accent,#d9ff45)}.v22-store-entry div{display:grid;gap:3px}.v22-store-entry small{font-size:.62rem;letter-spacing:.12em;color:#8d9a91}.v22-store-entry b{font-size:1rem}.v22-store-entry em{font-size:.75rem;color:#9eaaa3;font-style:normal}.v22-store-entry>button>i{font-size:1.4rem;font-style:normal}\n`;
  write("globals.css",css);
}

let version=read("version.ts");
if(version.includes('GAME_VERSION = "2.1.0"')){version=version.replace('GAME_VERSION = "2.1.0"','GAME_VERSION = "2.2.0"');write("version.ts",version)}
let pkg=read("../package.json");
if(pkg.includes('"version": "2.1.0"')){pkg=pkg.replace('"version": "2.1.0"','"version": "2.2.0"');writeFileSync(join(root,"package.json"),pkg)}

const finalPage=read("page.tsx"),finalUi=read("economy-v2-ui.tsx"),finalCss=read("globals.css"),finalVersion=read("version.ts");
const checks=[
  [finalVersion.includes('GAME_VERSION = "2.2.0"'),"version 2.2.0"],
  [finalPage.includes("MSC_V22_STORE")&&finalPage.includes('screen==="store"'),"store runtime"],
  [finalPage.includes("msc-customization-v22"),"customization persistence"],
  [finalPage.includes("cosmeticBall?.preview.primary")&&finalPage.includes("cosmeticTrail.preview.primary"),"ball and trail cosmetics"],
  [finalPage.includes("customKit?.category===\"KIT\"")||finalPage.includes('customKit?.category==="KIT"'),"custom kit render"],
  [finalPage.includes('"--lime":hudTheme?.preview.secondary')&&finalPage.includes('"--panel":hudTheme?.preview.primary'),"hud theme reaches match UI"],
  [finalPage.includes("GameplayCosmeticLayer"),"goal cosmetic layer"],
  [finalPage.includes("onNationalKitEquip")&&finalUi.includes("onNationalKitEquip"),"mutually exclusive kit equip"],
  [finalUi.includes("MSC_V22_STORE_LINK")&&finalUi.includes("TIENDA 2.0"),"economy store entry"],
  [finalCss.includes("MSC_V22_STORE_STYLES")&&finalCss.includes("v22-store-page"),"store styles"],
];
for(const [ok,label] of checks)if(!ok)throw new Error(`Mini Soccer Complete v2.2.0 verification failed: ${label}`);
console.log("Mini Soccer Complete v2.2.0 store/customization verification passed.");
