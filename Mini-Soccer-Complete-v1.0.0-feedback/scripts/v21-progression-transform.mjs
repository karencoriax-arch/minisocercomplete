import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const app=join(root,"app");
const read=name=>readFileSync(join(app,name),"utf8");
const write=(name,content)=>writeFileSync(join(app,name),content);
const replaceRequired=(source,from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`v2.1 progression patch did not match: ${label}`);return next};

let page=read("page.tsx");
if(!page.includes("MSC_V21_PROGRESSION")){
  page=replaceRequired(page,
    '// MSC_V2_RUNTIME — economy, content and presentation expansion.',
    '// MSC_V2_RUNTIME — economy, content and presentation expansion.\nimport { DEFAULT_PROGRESSION, applyProgressionMatch, parseProgressionState, type ProgressionState } from "./progression-v21";\nimport { ProgressionHub, ProgressionMini } from "./progression-v21-ui";\n// MSC_V21_PROGRESSION — XP, levels, missions, achievements and lifetime stats.',
    "progression imports");

  page=replaceRequired(page,
    'type Screen = "profile" | "home" | "cupSetup" | "tournament" | "setup" | "squad" | "boosts" | "economy" | "game" | "result" | "trophies" | "settings";',
    'type Screen = "profile" | "home" | "cupSetup" | "tournament" | "setup" | "squad" | "boosts" | "economy" | "progression" | "game" | "result" | "trophies" | "settings";',
    "screen union");

  page=replaceRequired(page,
    '  const [economy,setEconomy] = useState<EconomyState>(DEFAULT_ECONOMY);\n  const economyRef=useRef<EconomyState>(DEFAULT_ECONOMY);',
    '  const [economy,setEconomy] = useState<EconomyState>(DEFAULT_ECONOMY);\n  const economyRef=useRef<EconomyState>(DEFAULT_ECONOMY);\n  const [progression,setProgression]=useState<ProgressionState>(DEFAULT_PROGRESSION);\n  const progressionRef=useRef<ProgressionState>(DEFAULT_PROGRESSION);',
    "progression state");

  page=replaceRequired(page,
    '    setCareer(parseCareerState(localStorage.getItem("msc-career-v1")));const restoredEconomy=parseEconomyState(localStorage.getItem("msc-economy-v2"));setEconomy(restoredEconomy);economyRef.current=restoredEconomy;',
    '    setCareer(parseCareerState(localStorage.getItem("msc-career-v1")));const restoredEconomy=parseEconomyState(localStorage.getItem("msc-economy-v2"));setEconomy(restoredEconomy);economyRef.current=restoredEconomy;const restoredProgression=parseProgressionState(localStorage.getItem("msc-progression-v21"));setProgression(restoredProgression);progressionRef.current=restoredProgression;',
    "progression hydration");

  page=replaceRequired(page,
    '  useEffect(()=>{economyRef.current=economy;if(progressHydrated)localStorage.setItem("msc-economy-v2",JSON.stringify(economy))},[economy,progressHydrated]);',
    '  useEffect(()=>{economyRef.current=economy;if(progressHydrated)localStorage.setItem("msc-economy-v2",JSON.stringify(economy))},[economy,progressHydrated]);\n  useEffect(()=>{progressionRef.current=progression;if(progressHydrated)localStorage.setItem("msc-progression-v21",JSON.stringify(progression))},[progression,progressHydrated]);',
    "progression persistence");

  page=replaceRequired(page,
    '    const economyResult=applyMatchEconomy(economyRef.current,{played:!meta.simulated,simulated:meta.simulated,won:finalScore[0]>finalScore[1],drew:finalScore[0]===finalScore[1],goalsFor:finalScore[0],goalsAgainst:finalScore[1],completedPasses:finalReport.completedPasses[0],difficulty,freeGoals:meta.freeGoals,tournamentChampion:championThisMatch});economyRef.current=economyResult.state;setEconomy(economyResult.state);setLastMatchReward(economyResult.reward);matchOutcomeMeta.current={simulated:false,freeGoals:0};',
    '    const economyResult=applyMatchEconomy(economyRef.current,{played:!meta.simulated,simulated:meta.simulated,won:finalScore[0]>finalScore[1],drew:finalScore[0]===finalScore[1],goalsFor:finalScore[0],goalsAgainst:finalScore[1],completedPasses:finalReport.completedPasses[0],difficulty,freeGoals:meta.freeGoals,tournamentChampion:championThisMatch});economyRef.current=economyResult.state;setEconomy(economyResult.state);setLastMatchReward(economyResult.reward);const progressionResult=applyProgressionMatch(progressionRef.current,{played:!meta.simulated,simulated:meta.simulated,won:finalScore[0]>finalScore[1],drew:finalScore[0]===finalScore[1],goalsFor:Math.max(0,finalScore[0]-meta.freeGoals),goalsAgainst:finalScore[1],completedPasses:finalReport.completedPasses[0],teamId,difficulty,maxDeficit:finalReport.maxDeficit,tournamentChampion:championThisMatch,tournamentUnbeaten:championThisMatch&&Boolean(completedCup?.state.fixtures.filter(f=>f.status==="PLAYED"&&(f.homeTeamId===completedCup!.state.selectedTeamId||f.awayTeamId===completedCup!.state.selectedTeamId)).every(f=>(f.homeTeamId===completedCup!.state.selectedTeamId?(f.homeGoals??0)>=(f.awayGoals??0):(f.awayGoals??0)>=(f.homeGoals??0))))});progressionRef.current=progressionResult.state;setProgression(progressionResult.state);matchOutcomeMeta.current={simulated:false,freeGoals:0};',
    "apply progression after match");

  page=replaceRequired(page,
    '<div className="top-actions"><WalletBar state={economy} lang={lang} compact/><span className="level-pill">S{season} · {wins}/10</span>',
    '<div className="top-actions"><WalletBar state={economy} lang={lang} compact/><ProgressionMini state={progression} lang={lang} onOpen={()=>setScreen("progression")}/><span className="level-pill">S{season} · {wins}/10</span>',
    "top level button");

  page=replaceRequired(page,
    '    {screen==="economy" && <EconomyHub lang={lang} state={economy} teams={TEAMS} onChange={next=>{economyRef.current=next;setEconomy(next)}} onBack={()=>setScreen("home")}/>} ',
    '    {screen==="economy" && <EconomyHub lang={lang} state={economy} teams={TEAMS} onChange={next=>{economyRef.current=next;setEconomy(next)}} onBack={()=>setScreen("home")} onProgression={()=>setScreen("progression")}/>}\n    {screen==="progression" && <ProgressionHub lang={lang} state={progression} economy={economy} onChange={next=>{progressionRef.current=next;setProgression(next)}} onEconomyChange={next=>{economyRef.current=next;setEconomy(next)}} onBack={()=>setScreen("home")}/>} ',
    "progression screen");

  write("page.tsx",page);
}

let css=read("globals.css");
if(!css.includes("v21-progression-page")){
  css += `\n/* MSC_V21_PROGRESSION_STYLES */\n${read("progression-v21.css")}\n`;
  write("globals.css",css);
}

let version=read("version.ts");
if(version.includes('GAME_VERSION = "2.0.1"')){
  version=version.replace('GAME_VERSION = "2.0.1"','GAME_VERSION = "2.1.0"');
  write("version.ts",version);
}

const finalPage=read("page.tsx"),finalVersion=read("version.ts"),finalCss=read("globals.css");
const checks=[
  [finalVersion.includes('GAME_VERSION = "2.1.0"'),"version 2.1.0"],
  [finalPage.includes("MSC_V21_PROGRESSION"),"runtime marker"],
  [finalPage.includes("applyProgressionMatch"),"match progression"],
  [finalPage.includes('screen==="progression"'),"progression screen"],
  [finalPage.includes("msc-progression-v21"),"progression persistence"],
  [finalCss.includes("v21-progression-page"),"progression styles"],
];
for(const [ok,label] of checks)if(!ok)throw new Error(`Mini Soccer Complete v2.1.0 verification failed: ${label}`);
console.log("Mini Soccer Complete v2.1.0 progression verification passed.");
