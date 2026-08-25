import { readdirSync } from "node:fs";
import { dirname,join } from "node:path";
import { fileURLToPath,pathToFileURL } from "node:url";
const here=dirname(fileURLToPath(import.meta.url));
const files=readdirSync(here).filter(name=>name.startsWith("v3-tail-")&&name.endsWith(".mjs")&&name!=="v3-tail-bundle.mjs").sort();
for(const name of files)await import(`${pathToFileURL(join(here,name)).href}?tail=${Date.now()}-${Math.random()}`);
console.log(`Mini Soccer Complete v3 final fix bundle passed (${files.length} modules).`);
