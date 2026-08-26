import assert from "node:assert/strict";
import { DEFAULT_ECONOMY } from "../app/economy-v2.ts";
import { COSMETIC_CATALOG, DEFAULT_CUSTOMIZATION, buyCosmetic, cosmeticById, equipCosmetic, parseCustomizationState } from "../app/customization-v22.ts";

const PLAYERS=40;
const CYCLES=800;
const STARTING_MSC=100000;
const players=Array.from({length:PLAYERS},()=>({
  economy:{...structuredClone(DEFAULT_ECONOMY),msc:STARTING_MSC,totalEarnedMsc:STARTING_MSC},
  customization:structuredClone(DEFAULT_CUSTOMIZATION),
}));

let purchases=0,equips=0,serializations=0;
for(let step=0;step<CYCLES;step++){
  const profile=players[step%PLAYERS];
  const item=COSMETIC_CATALOG[(step*7+Math.floor(step/PLAYERS)*3)%COSMETIC_CATALOG.length];
  if(!profile.customization.owned.includes(item.id)){
    const result=buyCosmetic(profile.economy,profile.customization,item.id);
    assert.equal(result.ok,true,`compra falló en ciclo ${step} para ${item.id}`);
    profile.economy=result.economy;
    profile.customization=result.state;
    purchases++;
  }
  const beforeMsc=profile.economy.msc;
  profile.customization=equipCosmetic(profile.customization,item.id);
  equips++;
  assert.equal(profile.economy.msc,beforeMsc,"equipar nunca debe cobrar MSC");

  const restored=parseCustomizationState(JSON.stringify(profile.customization));
  serializations++;
  assert.deepEqual(restored,profile.customization,`persistencia inestable en ciclo ${step}`);
  profile.customization=restored;
  assert.ok(profile.economy.msc>=0,"saldo negativo");
  assert.equal(new Set(profile.customization.owned).size,profile.customization.owned.length,"inventario duplicado");
  for(const id of Object.values(profile.customization.equipped)){
    if(id===null)continue;
    assert.ok(profile.customization.owned.includes(id),`equipado sin poseer: ${id}`);
    assert.ok(cosmeticById(id),`equipado inexistente: ${id}`);
  }
}

let aggregateSpent=0,aggregateOwned=0;
for(const profile of players){
  const expectedSpent=profile.customization.owned.reduce((sum,id)=>sum+(cosmeticById(id)?.price??0),0);
  assert.equal(profile.customization.totalSpentMsc,expectedSpent,"totalSpentMsc debe coincidir con precios realmente comprados");
  assert.equal(profile.economy.msc,STARTING_MSC-expectedSpent,"saldo final debe reconciliar exactamente");
  assert.equal(profile.customization.purchaseCount,profile.customization.owned.length,"una compra por cosmético poseído");
  aggregateSpent+=expectedSpent;
  aggregateOwned+=profile.customization.owned.length;
}

assert.equal(equips,CYCLES);
assert.equal(serializations,CYCLES);
assert.ok(purchases>500,"la simulación debe ejecutar cientos de compras reales");
console.log(JSON.stringify({cycles:CYCLES,profiles:PLAYERS,purchases,equips,serializations,aggregateOwned,aggregateSpent,negativeBalances:0,duplicateInventory:0,invalidEquipped:0},null,2));
