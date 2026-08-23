import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const pagePath=join(root,"app","page.tsx");
let page=readFileSync(pagePath,"utf8");
if(!page.includes("MSC_MOBILE_V12_FOLLOWUP")){
  page=page.replace("// MSC_MOBILE_V12_RUNTIME — mobile-specific input/pacing layer generated at build time.","// MSC_MOBILE_V12_RUNTIME — mobile-specific input/pacing layer generated at build time.\n// MSC_MOBILE_V12_FOLLOWUP — joystick aim follows the analog vector continuously.");
  page=page.replace('passIntentDirection.current=passTargetSelector.current.resolveIntent(ts,rawAimDirection.current);','passIntentDirection.current=mobileRuntime?rawAimDirection.current:passTargetSelector.current.resolveIntent(ts,rawAimDirection.current);');
  writeFileSync(pagePath,page);
}

const match=readFileSync(join(root,"app","match-config.ts"),"utf8");
const pass=readFileSync(join(root,"app","pass-system.ts"),"utf8");
const ai=readFileSync(join(root,"app","game-ai.ts"),"utf8");
const version=readFileSync(join(root,"app","version.ts"),"utf8");
const joystick=readFileSync(join(root,"app","mobile-joystick.tsx"),"utf8");
const css=readFileSync(join(root,"app","mobile.css"),"utf8");
const checks=[
  [page.includes("MSC_MOBILE_V12_RUNTIME"),"page runtime marker"],
  [page.includes('3:{"1-1"'),"3v3 formation"],
  [page.includes("mobileMove.current.active"),"analog movement"],
  [page.includes("mobileRuntime?rawAimDirection.current"),"joystick pass aim"],
  [!page.includes("Elegí 4v4, 5v5 o 6v6"),"legacy visible format copy removed"],
  [match.includes("PUBLIC_FORMATS:PublicMatchFormat[]=[3,4]"),"3v3/4v4 public formats"],
  [pass.includes("PassFormat = 3|4|5|6"),"3v3 pass physics support"],
  [ai.includes("coneHalfAngleDegrees:{3:40,4:38"),"3v3 pass assist support"],
  [version.includes('GAME_VERSION = "1.2.1"'),"v1.2.1"],
  [joystick.includes("msc-mobile-stick")&&joystick.includes("msc-mobile-hud-v2"),"stable analog HUD controller"],
  [css.includes("mobile-hud-editing")&&css.includes("orientation:portrait"),"editable HUD and landscape gate"],
];
for(const [ok,label] of checks)if(!ok)throw new Error(`Mobile v1.2 verification failed: ${label}`);
console.log("Mini Soccer Complete v1.2 base verification passed for v1.2.1.");
