import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const app=join(root,"app");
const read=path=>readFileSync(path,"utf8");
const write=(path,content)=>writeFileSync(path,content);
const replaceRequired=(source,from,to,label)=>{const next=source.replace(from,to);if(next===source)throw new Error(`Cross-platform v2.0.1 patch did not match: ${label}`);return next};

const pagePath=join(app,"page.tsx");
let page=read(pagePath);
if(!page.includes("MSC_CROSS_PLATFORM_V201")){
  page=replaceRequired(page,'"use client";','"use client";\n\nimport { isMobilePlatform } from "./platform";\n// MSC_CROSS_PLATFORM_V201 — desktop and mobile input sources are isolated.',"platform import");
  page=page.replaceAll('window.matchMedia("(hover:none) and (pointer:coarse)").matches','isMobilePlatform()');
  page=replaceRequired(page,
    'pointerAim=(event:ReactPointerEvent<HTMLCanvasElement>)=>{const canvas=canvasRef.current,player=bodies.current[active.current];',
    'pointerAim=(event:ReactPointerEvent<HTMLCanvasElement>)=>{if(isMobileRef.current&&event.pointerType!=="mouse")return;const canvas=canvasRef.current,player=bodies.current[active.current];',
    "desktop mouse aim guard");
  page=replaceRequired(page,
    'canvasPassDown=(event:ReactPointerEvent<HTMLCanvasElement>)=>{const now=performance.now();',
    'canvasPassDown=(event:ReactPointerEvent<HTMLCanvasElement>)=>{if(isMobileRef.current&&event.pointerType!=="mouse")return;const now=performance.now();',
    "canvas down guard");
  page=replaceRequired(page,
    'canvasPassUp=(event:ReactPointerEvent<HTMLCanvasElement>)=>{pointerAim(event);',
    'canvasPassUp=(event:ReactPointerEvent<HTMLCanvasElement>)=>{if(isMobileRef.current&&event.pointerType!=="mouse")return;pointerAim(event);',
    "canvas up guard");
  page=replaceRequired(page,
    'canvasPassCancel=(event:ReactPointerEvent<HTMLCanvasElement>)=>{inputManager.current.handleMouseUp(event.button);',
    'canvasPassCancel=(event:ReactPointerEvent<HTMLCanvasElement>)=>{if(isMobileRef.current&&event.pointerType!=="mouse")return;inputManager.current.handleMouseUp(event.button);',
    "canvas cancel guard");
  write(pagePath,page);
}

const cssPath=join(app,"mobile.css");
let css=read(cssPath);
if(!css.includes("MSC_CROSS_PLATFORM_V201")){
  css=css.replace('/* Mini Soccer Complete — dedicated mobile layer v1.2.0 */','/* Mini Soccer Complete — dedicated mobile layer v1.2.0 */\n/* MSC_CROSS_PLATFORM_V201 — narrow desktop windows must never receive the mobile match HUD. */');
  css=replaceRequired(css,'@media (max-width:950px){','@media (hover:none) and (pointer:coarse) and (max-width:1400px){',"mobile-only match layout");
  write(cssPath,css);
}

const versionPath=join(app,"version.ts");
let version=read(versionPath);
if(version.includes('GAME_VERSION = "2.0.0"')){
  version=version.replace('GAME_VERSION = "2.0.0"','GAME_VERSION = "2.0.1"');
  write(versionPath,version);
}

const packagePath=join(root,"package.json");
let pkg=read(packagePath);
if(pkg.includes('"version": "2.0.0"')){
  pkg=pkg.replace('"version": "2.0.0"','"version": "2.0.1"');
  write(packagePath,pkg);
}

const finalPage=read(pagePath),finalCss=read(cssPath),finalVersion=read(versionPath);
const checks=[
  [finalVersion.includes('GAME_VERSION = "2.0.1"'),"version 2.0.1"],
  [finalPage.includes('import { isMobilePlatform } from "./platform"'),"platform detector import"],
  [finalPage.includes('event.pointerType!=="mouse"'),"touch/mouse isolation"],
  [!finalPage.includes('window.matchMedia("(hover:none) and (pointer:coarse)").matches'),"central platform detection"],
  [finalCss.includes('@media (hover:none) and (pointer:coarse) and (max-width:1400px)'),"mobile-only narrow layout"],
];
for(const [ok,label] of checks)if(!ok)throw new Error(`Cross-platform v2.0.1 verification failed: ${label}`);
console.log("Mini Soccer Complete v2.0.1 cross-platform verification passed.");
