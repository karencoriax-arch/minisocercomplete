import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const app=join(here,"..","app");
const path=join(app,"economy-v2-ui.tsx");
let source=readFileSync(path,"utf8");
const replaceRequired=(from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`v2.1 economy UI patch did not match: ${label}`);source=next};

if(!source.includes("MSC_V21_MISSIONS_MOVED")){
  source=source.replace('  MISSION_CATALOG,\n','');
  source=source.replace('  claimMission,\n','');
  source=source.replace('  refreshDailyMissions,\n','');
  replaceRequired(
    'export function EconomyHub({lang,state:rawState,teams,onChange,onBack}:{lang:EconomyLang;state:EconomyState;teams:EconomyTeam[];onChange:(state:EconomyState)=>void;onBack:()=>void}){\n  const state=refreshDailyMissions(rawState),[tab,setTab]=useState<"KITS"|"RESOURCES"|"INVENTORY"|"MISSIONS">("KITS"),[notice,setNotice]=useState("");',
    'export function EconomyHub({lang,state,teams,onChange,onBack,onProgression}:{lang:EconomyLang;state:EconomyState;teams:EconomyTeam[];onChange:(state:EconomyState)=>void;onBack:()=>void;onProgression:()=>void}){\n  // MSC_V21_MISSIONS_MOVED — missions now live in the unified progression hub.\n  const [tab,setTab]=useState<"KITS"|"RESOURCES"|"INVENTORY">("KITS"),[notice,setNotice]=useState("");',
    "economy signature");
  source=source.replace(/\n  const claim=\(id:\(typeof MISSION_CATALOG\)\[number\]\["id"\]\)=>\{[^\n]+\};/,'');
  replaceRequired(
    '<button className={tab==="INVENTORY"?"active":""} onClick={()=>setTab("INVENTORY")}>▦ {tr(lang,"INVENTARIO","INVENTORY")}</button><button className={tab==="MISSIONS"?"active":""} onClick={()=>setTab("MISSIONS")}>✓ {tr(lang,"MISIONES","MISSIONS")}</button>',
    '<button className={tab==="INVENTORY"?"active":""} onClick={()=>setTab("INVENTORY")}>▦ {tr(lang,"INVENTARIO","INVENTORY")}</button><button onClick={onProgression}>★ {tr(lang,"PROGRESIÓN","PROGRESSION")}</button>',
    "mission tab replacement");
  source=source.replace(/\n    \{tab==="MISSIONS"&&<section>[\s\S]*?<\/section>\}/,'');
  writeFileSync(path,source);
}

const final=readFileSync(path,"utf8");
if(!final.includes("MSC_V21_MISSIONS_MOVED")||final.includes('tab==="MISSIONS"')||final.includes("MISSION_CATALOG"))throw new Error("v2.1 economy UI verification failed");
console.log("Mini Soccer Complete v2.1.0 economy mission migration passed.");
