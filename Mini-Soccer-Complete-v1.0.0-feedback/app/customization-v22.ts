import type { EconomyState } from "./economy-v2";

export type CosmeticCategory = "KIT" | "BALL" | "TRAIL" | "GOAL_EFFECT" | "CELEBRATION" | "HUD_THEME";
export type CosmeticRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type CosmeticItem = {
  id: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  price: number;
  icon: string;
  name: [string, string];
  description: [string, string];
  preview: { primary: string; secondary: string; accent?: string };
};

export type CosmeticLoadout = {
  kit: string | null;
  ball: string | null;
  trail: string | null;
  goalEffect: string | null;
  celebration: string | null;
  hudTheme: string | null;
};

export type CustomizationState = {
  version: 1;
  owned: string[];
  equipped: CosmeticLoadout;
  totalSpentMsc: number;
  purchaseCount: number;
};

export const COSMETIC_CATALOG: CosmeticItem[] = [
  { id:"kit_msc_lime", category:"KIT", rarity:"COMMON", price:2200, icon:"👕", name:["MSC Lima","MSC Lime"], description:["Camiseta original negra con detalles lima.","Original black kit with lime details."], preview:{primary:"#111827",secondary:"#d9ff45"} },
  { id:"kit_msc_arctic", category:"KIT", rarity:"RARE", price:3600, icon:"👕", name:["MSC Ártico","MSC Arctic"], description:["Blanco frío con detalles celestes.","Cold white with cyan details."], preview:{primary:"#f8fafc",secondary:"#67e8f9"} },
  { id:"kit_msc_crimson", category:"KIT", rarity:"RARE", price:3600, icon:"👕", name:["MSC Carmesí","MSC Crimson"], description:["Rojo profundo con contraste oscuro.","Deep red with dark contrast."], preview:{primary:"#b91c1c",secondary:"#111827"} },
  { id:"kit_msc_void", category:"KIT", rarity:"EPIC", price:5200, icon:"👕", name:["MSC Void","MSC Void"], description:["Negro total con acentos violetas.","All-black kit with violet accents."], preview:{primary:"#030712",secondary:"#a78bfa"} },
  { id:"kit_msc_gold", category:"KIT", rarity:"LEGENDARY", price:7800, icon:"👕", name:["MSC Oro","MSC Gold"], description:["Edición dorada de prestigio. Solo cosmética.","Prestige gold edition. Cosmetic only."], preview:{primary:"#111827",secondary:"#facc15"} },

  { id:"ball_neon", category:"BALL", rarity:"COMMON", price:1500, icon:"⚽", name:["Balón Neón","Neon Ball"], description:["Balón blanco con paneles lima.","White ball with lime panels."], preview:{primary:"#f8fafc",secondary:"#d9ff45"} },
  { id:"ball_carbon", category:"BALL", rarity:"RARE", price:2600, icon:"⚽", name:["Balón Carbono","Carbon Ball"], description:["Acabado oscuro de alto contraste.","Dark high-contrast finish."], preview:{primary:"#111827",secondary:"#94a3b8"} },
  { id:"ball_retro", category:"BALL", rarity:"RARE", price:2800, icon:"⚽", name:["Balón Retro","Retro Ball"], description:["Diseño clásico inspirado en fútbol arcade.","Classic arcade-football inspired design."], preview:{primary:"#fef3c7",secondary:"#7c2d12"} },
  { id:"ball_plasma", category:"BALL", rarity:"EPIC", price:4300, icon:"⚽", name:["Balón Plasma","Plasma Ball"], description:["Paneles violetas y cian. Sin cambios físicos.","Violet and cyan panels. No physics changes."], preview:{primary:"#a78bfa",secondary:"#67e8f9"} },

  { id:"trail_lime", category:"TRAIL", rarity:"COMMON", price:1400, icon:"➜", name:["Estela Lima","Lime Trail"], description:["Rastro visual corto al moverse el balón.","Short visual trail while the ball moves."], preview:{primary:"#d9ff45",secondary:"#166534"} },
  { id:"trail_ice", category:"TRAIL", rarity:"RARE", price:2400, icon:"❄", name:["Estela Hielo","Ice Trail"], description:["Rastro celeste de baja intensidad.","Low-intensity cyan trail."], preview:{primary:"#67e8f9",secondary:"#1d4ed8"} },
  { id:"trail_fire", category:"TRAIL", rarity:"EPIC", price:3900, icon:"✦", name:["Estela Fuego","Fire Trail"], description:["Rastro cálido para remates y pases rápidos.","Warm trail for fast shots and passes."], preview:{primary:"#fb923c",secondary:"#dc2626"} },

  { id:"goal_flash", category:"GOAL_EFFECT", rarity:"COMMON", price:1800, icon:"✹", name:["Gol Flash","Goal Flash"], description:["Destello breve al convertir.","Brief flash after scoring."], preview:{primary:"#f8fafc",secondary:"#d9ff45"} },
  { id:"goal_confetti", category:"GOAL_EFFECT", rarity:"RARE", price:3200, icon:"✦", name:["Confeti MSC","MSC Confetti"], description:["Partículas 2D cortas tras el gol.","Short 2D particles after a goal."], preview:{primary:"#d9ff45",secondary:"#67e8f9",accent:"#fb7185"} },
  { id:"goal_shockwave", category:"GOAL_EFFECT", rarity:"EPIC", price:4800, icon:"◎", name:["Onda MSC","MSC Shockwave"], description:["Onda circular visual tras el gol.","Circular visual shockwave after a goal."], preview:{primary:"#a78bfa",secondary:"#d9ff45"} },

  { id:"celebration_slide", category:"CELEBRATION", rarity:"COMMON", price:1600, icon:"★", name:["Deslizamiento","Slide"], description:["Celebración 2D rápida y limpia.","Quick clean 2D celebration."], preview:{primary:"#d9ff45",secondary:"#111827"} },
  { id:"celebration_spin", category:"CELEBRATION", rarity:"RARE", price:2800, icon:"↻", name:["Giro MSC","MSC Spin"], description:["Animación 2D de giro tras el gol.","2D spin animation after scoring."], preview:{primary:"#67e8f9",secondary:"#111827"} },
  { id:"celebration_crown", category:"CELEBRATION", rarity:"EPIC", price:4500, icon:"♛", name:["Corona","Crown"], description:["Corona 2D de celebración, sin ventaja.","2D crown celebration, no gameplay advantage."], preview:{primary:"#facc15",secondary:"#111827"} },

  { id:"hud_lime", category:"HUD_THEME", rarity:"COMMON", price:1200, icon:"▣", name:["HUD Lima","Lime HUD"], description:["Tema oscuro clásico con acento lima.","Classic dark theme with lime accent."], preview:{primary:"#111827",secondary:"#d9ff45"} },
  { id:"hud_ice", category:"HUD_THEME", rarity:"RARE", price:2300, icon:"▣", name:["HUD Hielo","Ice HUD"], description:["Interfaz oscura con acentos celestes.","Dark interface with cyan accents."], preview:{primary:"#0f172a",secondary:"#67e8f9"} },
  { id:"hud_crimson", category:"HUD_THEME", rarity:"RARE", price:2300, icon:"▣", name:["HUD Carmesí","Crimson HUD"], description:["Interfaz oscura con acentos rojos.","Dark interface with red accents."], preview:{primary:"#111827",secondary:"#fb7185"} },
  { id:"hud_violet", category:"HUD_THEME", rarity:"EPIC", price:3600, icon:"▣", name:["HUD Violeta","Violet HUD"], description:["Interfaz nocturna con acentos violetas.","Night interface with violet accents."], preview:{primary:"#111827",secondary:"#a78bfa"} },
];

export const DEFAULT_CUSTOMIZATION: CustomizationState = {
  version: 1,
  owned: [],
  equipped: { kit:null, ball:null, trail:null, goalEffect:null, celebration:null, hudTheme:null },
  totalSpentMsc: 0,
  purchaseCount: 0,
};

const CATEGORY_TO_LOADOUT: Record<CosmeticCategory, keyof CosmeticLoadout> = {
  KIT:"kit", BALL:"ball", TRAIL:"trail", GOAL_EFFECT:"goalEffect", CELEBRATION:"celebration", HUD_THEME:"hudTheme",
};

const nonNegative=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
const validItem=(id:unknown): id is string => typeof id==="string" && COSMETIC_CATALOG.some(item=>item.id===id);

export function parseCustomizationState(raw:string|null):CustomizationState{
  if(!raw)return structuredClone(DEFAULT_CUSTOMIZATION);
  try{
    const value=JSON.parse(raw) as Partial<CustomizationState>;
    const owned=Array.isArray(value.owned)?Array.from(new Set(value.owned.filter(validItem))):[];
    const source=value.equipped??{} as CosmeticLoadout;
    const equipped:CosmeticLoadout={kit:null,ball:null,trail:null,goalEffect:null,celebration:null,hudTheme:null};
    for(const item of COSMETIC_CATALOG){
      const key=CATEGORY_TO_LOADOUT[item.category];
      if(source[key]===item.id&&owned.includes(item.id))equipped[key]=item.id;
    }
    return {version:1,owned,equipped,totalSpentMsc:nonNegative(value.totalSpentMsc),purchaseCount:nonNegative(value.purchaseCount)};
  }catch{return structuredClone(DEFAULT_CUSTOMIZATION)}
}

export function cosmeticById(id:string|null|undefined){return id?COSMETIC_CATALOG.find(item=>item.id===id)??null:null}
export function cosmeticsByCategory(category:CosmeticCategory){return COSMETIC_CATALOG.filter(item=>item.category===category)}
export function ownsCosmetic(state:CustomizationState,id:string){return state.owned.includes(id)}

export function buyCosmetic(economy:EconomyState,state:CustomizationState,itemId:string){
  const item=cosmeticById(itemId);
  if(!item)return {ok:false as const,reason:"INVALID" as const,economy,state};
  if(state.owned.includes(item.id))return {ok:false as const,reason:"OWNED" as const,economy,state};
  if(economy.msc<item.price)return {ok:false as const,reason:"MSC" as const,economy,state};
  return {
    ok:true as const,reason:null,
    economy:{...economy,msc:economy.msc-item.price},
    state:{...state,owned:[...state.owned,item.id],totalSpentMsc:state.totalSpentMsc+item.price,purchaseCount:state.purchaseCount+1},
  };
}

export function equipCosmetic(state:CustomizationState,itemId:string|null,category?:CosmeticCategory){
  if(itemId===null){
    if(!category)return state;
    return {...state,equipped:{...state.equipped,[CATEGORY_TO_LOADOUT[category]]:null}};
  }
  const item=cosmeticById(itemId);
  if(!item||!state.owned.includes(item.id))return state;
  const key=CATEGORY_TO_LOADOUT[item.category];
  return {...state,equipped:{...state.equipped,[key]:item.id}};
}

export function equippedCosmetics(state:CustomizationState){
  return Object.values(state.equipped).map(cosmeticById).filter((item):item is CosmeticItem=>Boolean(item));
}

export function collectionProgress(state:CustomizationState){
  return {owned:state.owned.length,total:COSMETIC_CATALOG.length,percent:Math.round(state.owned.length/Math.max(1,COSMETIC_CATALOG.length)*100)};
}

export function hudThemeColors(state:CustomizationState){
  const item=cosmeticById(state.equipped.hudTheme);
  return item?.category==="HUD_THEME"?item.preview:{primary:"#111827",secondary:"#d9ff45"};
}
