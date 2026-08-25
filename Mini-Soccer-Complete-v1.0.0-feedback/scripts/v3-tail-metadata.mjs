import { readFileSync,writeFileSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url)),path=join(here,"..","app","layout.tsx");let source=readFileSync(path,"utf8");
if(!source.includes("MSC_V3_METADATA")){
 const old='Fútbol arcade móvil 3v3 y 4v4 con inteligencia colectiva, torneos, selecciones, clubes y modo temporada.';
 const fresh='Fútbol arcade 2D cross-platform para PC y móvil: 3v3/4v4, progresión, torneos, desafíos, 2 jugadores local y crossplay casual.';
 if(!source.includes(old))throw new Error("V3 metadata description pattern did not match");source=source.replace(old,fresh).replace('import type { Metadata, Viewport } from "next";','import type { Metadata, Viewport } from "next";\n// MSC_V3_METADATA — cross-platform public description.');writeFileSync(path,source);
}
if(!readFileSync(path,"utf8").includes("cross-platform"))throw new Error("V3 metadata verification failed");console.log("Mini Soccer Complete v3 metadata verified.");
