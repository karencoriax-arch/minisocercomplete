import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ECONOMY } from "../app/economy-v2.ts";
import { COSMETIC_CATALOG, DEFAULT_CUSTOMIZATION, buyCosmetic, collectionProgress, equipCosmetic, equippedCosmetics, parseCustomizationState } from "../app/customization-v22.ts";

const funded=()=>({...DEFAULT_ECONOMY,msc:100000,totalEarnedMsc:100000,inventory:{...DEFAULT_ECONOMY.inventory,resources:{...DEFAULT_ECONOMY.inventory.resources}}});
const fresh=()=>structuredClone(DEFAULT_CUSTOMIZATION);

test("catálogo v2.2 es 100% cosmético y tiene todas las categorías",()=>{
  const categories=new Set(COSMETIC_CATALOG.map(item=>item.category));
  assert.deepEqual([...categories].sort(),["BALL","CELEBRATION","GOAL_EFFECT","HUD_THEME","KIT","TRAIL"]);
  assert.ok(COSMETIC_CATALOG.length>=20);
  for(const item of COSMETIC_CATALOG){
    assert.ok(item.price>=1000);
    assert.ok(item.preview.primary&&item.preview.secondary);
    assert.equal("speed" in item,false);
    assert.equal("power" in item,false);
    assert.equal("rating" in item,false);
  }
});

test("comprar descuenta MSC una vez y no altera MSC ganado histórico",()=>{
  const economy=funded(),state=fresh(),item=COSMETIC_CATALOG[0];
  const result=buyCosmetic(economy,state,item.id);
  assert.equal(result.ok,true);
  assert.equal(result.economy.msc,economy.msc-item.price);
  assert.equal(result.economy.totalEarnedMsc,economy.totalEarnedMsc);
  assert.equal(result.state.totalSpentMsc,item.price);
  assert.equal(result.state.purchaseCount,1);
  assert.deepEqual(result.state.owned,[item.id]);
});

test("no se puede comprar dos veces ni quedar con saldo negativo",()=>{
  const item=COSMETIC_CATALOG[0];
  const first=buyCosmetic(funded(),fresh(),item.id);
  assert.equal(first.ok,true);
  const duplicate=buyCosmetic(first.economy,first.state,item.id);
  assert.equal(duplicate.ok,false);
  assert.equal(duplicate.reason,"OWNED");
  const poor=buyCosmetic({...funded(),msc:item.price-1},fresh(),item.id);
  assert.equal(poor.ok,false);
  assert.equal(poor.reason,"MSC");
  assert.equal(poor.economy.msc,item.price-1);
});

test("solo se equipa contenido realmente comprado",()=>{
  const item=COSMETIC_CATALOG.find(x=>x.category==="BALL");
  assert.ok(item);
  const ignored=equipCosmetic(fresh(),item.id);
  assert.equal(ignored.equipped.ball,null);
  const bought=buyCosmetic(funded(),fresh(),item.id);
  assert.equal(bought.ok,true);
  const equipped=equipCosmetic(bought.state,item.id);
  assert.equal(equipped.equipped.ball,item.id);
  assert.equal(equippedCosmetics(equipped).length,1);
});

test("parser elimina ids corruptos, duplicados y equipamiento no poseído",()=>{
  const valid=COSMETIC_CATALOG[0];
  const parsed=parseCustomizationState(JSON.stringify({
    version:999,
    owned:[valid.id,valid.id,"hacked_item"],
    equipped:{kit:"hacked_item",ball:"hacked_item",trail:null,goalEffect:null,celebration:null,hudTheme:null},
    totalSpentMsc:-99,
    purchaseCount:-4,
  }));
  assert.deepEqual(parsed.owned,[valid.id]);
  assert.equal(parsed.equipped.kit,null);
  assert.equal(parsed.equipped.ball,null);
  assert.equal(parsed.totalSpentMsc,0);
  assert.equal(parsed.purchaseCount,0);
});

test("colección informa progreso exacto",()=>{
  let economy=funded(),state=fresh();
  for(const item of COSMETIC_CATALOG.slice(0,3)){
    const result=buyCosmetic(economy,state,item.id);
    assert.equal(result.ok,true);
    economy=result.economy;state=result.state;
  }
  const progress=collectionProgress(state);
  assert.equal(progress.owned,3);
  assert.equal(progress.total,COSMETIC_CATALOG.length);
  assert.equal(progress.percent,Math.round(3/COSMETIC_CATALOG.length*100));
});
