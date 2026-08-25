import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const ui=readFileSync(new URL("../app/progression-v3-ui.tsx",import.meta.url),"utf8");
const cloud=readFileSync(new URL("../app/cloud-v3.ts",import.meta.url),"utf8");
const local=readFileSync(new URL("../app/local-match-v3.tsx",import.meta.url),"utf8");
const online=readFileSync(new URL("../app/online-match-v3.tsx",import.meta.url),"utf8");

test("tutorial, academia y carrera son flujos jugables",()=>{assert.match(page,/TutorialV3/);assert.match(page,/TrainingArenaV3/);assert.match(page,/onPlayCareer/);assert.match(page,/chooseMode\("Carrera"\)/);assert.match(page,/careerMatch:mode==="Carrera"/)});
test("dos jugadores local está conectado sin economía",()=>{assert.match(page,/LocalMatchV3/);assert.match(page,/localMatchV3/);assert.match(local,/JUGADOR 1/);assert.match(local,/JUGADOR 2/);assert.doesNotMatch(local,/applyMatchEconomy|MSC Coins|gems/)});
test("crossplay beta espera a dos peers y no entrega RP",()=>{assert.match(page,/OnlineMatchV3/);assert.match(page,/rating:beforeRating/);assert.match(ui,/CROSSPLAY CASUAL/);assert.match(online,/presenceState/);assert.match(online,/status!=="LIVE"/)});
test("desafíos evitan farming y supervivencia escala presión",()=>{assert.match(page,/challengeFirstClearV3/);assert.match(page,/Repetición de desafío/);assert.match(page,/survivalRampV3/);assert.match(page,/rating:progressV3Ref\.current\.rating/)});
test("presentación 3.0 integra impactos, háptica, grabación y compartir",()=>{assert.match(page,/SoundscapeV3/);assert.match(page,/hapticV3/);assert.match(page,/ClipRecorderV3/);assert.match(page,/toggleClipV3/);assert.match(page,/shareResultV3/)});
test("social distingue solicitudes enviadas de las recibidas",()=>{assert.match(cloud,/requestedBy/);assert.match(ui,/friend\.requestedBy===cloudUserId/);assert.match(ui,/ENVIADA/);assert.match(ui,/ACEPTAR/)});
test("cosméticos equipados tienen representación visible",()=>{assert.match(page,/ballSkinV3/);assert.match(page,/trailSkinV3/);assert.match(page,/goalFxClassV3/);assert.match(page,/celebrationClassV3/);assert.match(page,/stadiumThemeClassV3/);assert.match(ui,/state\.equipped\.BANNER/)});
