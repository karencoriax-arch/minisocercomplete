export type StadiumGraphics = {
  crowdDetail: "LOW" | "MEDIUM" | "HIGH";
  fieldDetail: "LOW" | "MEDIUM" | "HIGH";
  lighting: "LOW" | "MEDIUM" | "HIGH";
  performanceMode: boolean;
};

type StadiumTheme = {
  id: string;
  stand: string;
  stand2: string;
  seatA: string;
  seatB: string;
  grassA: string;
  grassB: string;
  line: string;
  glow: string;
  accent: string;
  atmosphere: "night" | "river" | "classic" | "world" | "red" | "coast" | "snow" | "neon";
};

export const STADIUM_V2_NAMES = [
  "Arena Nocturna",
  "Estadio del Río",
  "Coliseo Europa",
  "Templo Mundial",
  "Fortaleza Roja",
  "Arena Costera",
  "Estadio Nevado",
  "Neón Metropolitano",
] as const;

const THEMES: Record<string, StadiumTheme> = {
  "Arena Nocturna": { id:"night", stand:"#071018", stand2:"#0b1b25", seatA:"#dbeafe", seatB:"#2563eb", grassA:"#0d6a3e", grassB:"#095f37", line:"#f8fafc", glow:"#93c5fd", accent:"#60a5fa", atmosphere:"night" },
  "Estadio del Río": { id:"river", stand:"#062c33", stand2:"#0b4750", seatA:"#a7f3d0", seatB:"#22d3ee", grassA:"#168351", grassB:"#117546", line:"#ecfeff", glow:"#67e8f9", accent:"#2dd4bf", atmosphere:"river" },
  "Coliseo Europa": { id:"europa", stand:"#242018", stand2:"#383126", seatA:"#f5d0a6", seatB:"#f59e0b", grassA:"#267847", grassB:"#206c40", line:"#fff7ed", glow:"#fbbf24", accent:"#eab308", atmosphere:"classic" },
  "Templo Mundial": { id:"world", stand:"#172033", stand2:"#24304a", seatA:"#ffffff", seatB:"#facc15", grassA:"#1a8150", grassB:"#127445", line:"#ffffff", glow:"#fde68a", accent:"#facc15", atmosphere:"world" },
  "Fortaleza Roja": { id:"red", stand:"#260808", stand2:"#451010", seatA:"#fecaca", seatB:"#dc2626", grassA:"#17663d", grassB:"#105a35", line:"#fff7f7", glow:"#fb7185", accent:"#ef4444", atmosphere:"red" },
  "Arena Costera": { id:"coast", stand:"#073b45", stand2:"#0e5963", seatA:"#fef3c7", seatB:"#06b6d4", grassA:"#1f8a58", grassB:"#177d4e", line:"#fffff4", glow:"#67e8f9", accent:"#fbbf24", atmosphere:"coast" },
  "Estadio Nevado": { id:"snow", stand:"#23354a", stand2:"#38516a", seatA:"#f8fafc", seatB:"#93c5fd", grassA:"#2a8258", grassB:"#21754e", line:"#ffffff", glow:"#dbeafe", accent:"#bfdbfe", atmosphere:"snow" },
  "Neón Metropolitano": { id:"neon", stand:"#10071d", stand2:"#21103a", seatA:"#c4b5fd", seatB:"#22d3ee", grassA:"#126f46", grassB:"#0a613c", line:"#f5f3ff", glow:"#d946ef", accent:"#22d3ee", atmosphere:"neon" },
};

const themeFor = (stadium: string) => THEMES[stadium] ?? THEMES["Arena Nocturna"];

function roundedRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number) {
  const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();
}

function drawSeats(ctx: CanvasRenderingContext2D, theme: StadiumTheme, W:number,H:number,left:number,right:number,top:number,bottom:number,count:number) {
  ctx.fillStyle=theme.stand;ctx.fillRect(0,0,W,top);ctx.fillRect(0,bottom,W,H-bottom);ctx.fillRect(0,top,left,bottom-top);ctx.fillRect(right,top,W-right,bottom-top);
  ctx.fillStyle=theme.stand2;ctx.fillRect(0,8,W,18);ctx.fillRect(0,H-26,W,18);ctx.fillRect(5,top,18,bottom-top);ctx.fillRect(W-23,top,18,bottom-top);
  const perimeter=2*(W+(bottom-top));
  for(let i=0;i<count;i++){
    const p=(i/count)*perimeter;
    let x=0,y=0;
    if(p<W){x=p;y=34+(i%4)*7}
    else if(p<W+(bottom-top)){x=W-34-(i%3)*6;y=top+(p-W)}
    else if(p<2*W+(bottom-top)){x=W-(p-(W+(bottom-top)));y=bottom+10+(i%4)*6}
    else{x=34+(i%3)*6;y=bottom-(p-(2*W+(bottom-top)))}
    ctx.fillStyle=i%5===0?theme.accent:i%2===0?theme.seatA:theme.seatB;
    ctx.globalAlpha=.78;ctx.fillRect(x,y,3,3);ctx.globalAlpha=1;
  }
  ctx.strokeStyle="rgba(255,255,255,.16)";ctx.lineWidth=1;ctx.strokeRect(27,29,W-54,Math.max(16,top-42));ctx.strokeRect(27,bottom+7,W-54,Math.max(16,H-bottom-36));
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, theme: StadiumTheme, W:number,H:number,left:number,right:number,top:number,bottom:number,high:boolean) {
  if(theme.atmosphere==="river"){
    ctx.fillStyle="rgba(34,211,238,.16)";ctx.fillRect(28,H-25,W-56,8);for(let i=0;i<12;i++){ctx.fillStyle=i%2?"rgba(103,232,249,.2)":"rgba(255,255,255,.12)";ctx.fillRect(40+i*W/12,H-22,36,2)}
  } else if(theme.atmosphere==="snow"){
    ctx.fillStyle="rgba(248,250,252,.82)";ctx.fillRect(0,top-7,W,6);ctx.fillRect(0,bottom+1,W,7);if(high){for(let i=0;i<42;i++){ctx.globalAlpha=.45+(i%5)*.08;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc((i*67)%W,(i*31)%H,1+(i%3)*.35,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  } else if(theme.atmosphere==="coast"){
    ctx.fillStyle="rgba(250,204,21,.17)";ctx.fillRect(0,H-20,W,20);ctx.strokeStyle="rgba(103,232,249,.38)";for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(0,H-28-i*3);for(let x=0;x<=W;x+=30)ctx.lineTo(x,H-28-i*3+Math.sin((x+i*18)/40)*2);ctx.stroke()}
  } else if(theme.atmosphere==="red"){
    ctx.fillStyle="rgba(239,68,68,.15)";ctx.fillRect(0,0,W,top);ctx.fillStyle="#7f1d1d";ctx.fillRect(W/2-35,top-18,70,18);ctx.fillStyle="#fecaca";ctx.font="bold 10px Arial";ctx.textAlign="center";ctx.fillText("FORTALEZA",W/2,top-6)
  } else if(theme.atmosphere==="world"){
    const flags=["#60a5fa","#fff","#facc15","#ef4444","#22c55e"];for(let i=0;i<10;i++){ctx.fillStyle=flags[i%flags.length];ctx.fillRect(48+i*(W-96)/10,31,24,9)}
  } else if(theme.atmosphere==="classic"){
    ctx.strokeStyle="rgba(251,191,36,.36)";ctx.lineWidth=2;for(let i=0;i<7;i++){const x=60+i*(W-120)/6;ctx.beginPath();ctx.moveTo(x,top-8);ctx.lineTo(x,28);ctx.stroke()}
  } else if(theme.atmosphere==="neon"){
    ctx.shadowBlur=high?18:8;ctx.shadowColor=theme.glow;ctx.strokeStyle=theme.glow;ctx.lineWidth=2;ctx.strokeRect(28,28,W-56,H-56);ctx.shadowBlur=0;ctx.strokeStyle=theme.accent;ctx.beginPath();ctx.moveTo(0,top-5);ctx.lineTo(W,top-5);ctx.moveTo(0,bottom+5);ctx.lineTo(W,bottom+5);ctx.stroke()
  }
}

function drawGoals(ctx: CanvasRenderingContext2D, left:number,right:number,goalTop:number,goalBottom:number,theme: StadiumTheme,detail:boolean) {
  const depth=32;
  ctx.fillStyle="rgba(255,255,255,.09)";ctx.fillRect(left-depth,goalTop,depth,goalBottom-goalTop);ctx.fillRect(right,goalTop,depth,goalBottom-goalTop);
  ctx.strokeStyle=theme.line;ctx.lineWidth=3;ctx.strokeRect(left-depth,goalTop,depth,goalBottom-goalTop);ctx.strokeRect(right,goalTop,depth,goalBottom-goalTop);
  if(detail){ctx.lineWidth=.8;ctx.globalAlpha=.42;for(let y=goalTop+9;y<goalBottom;y+=10){ctx.beginPath();ctx.moveTo(left-depth,y);ctx.lineTo(left,y);ctx.moveTo(right,y);ctx.lineTo(right+depth,y);ctx.stroke()}for(let x=left-depth+8;x<left;x+=8){ctx.beginPath();ctx.moveTo(x,goalTop);ctx.lineTo(x,goalBottom);ctx.stroke()}for(let x=right+8;x<right+depth;x+=8){ctx.beginPath();ctx.moveTo(x,goalTop);ctx.lineTo(x,goalBottom);ctx.stroke()}ctx.globalAlpha=1}
}

export function drawStadiumV2(ctx:CanvasRenderingContext2D,args:{
  stadium:string;W:number;H:number;left:number;right:number;top:number;bottom:number;cy:number;goalTop:number;goalBottom:number;graphics:StadiumGraphics;
}){
  const {stadium,W,H,left,right,top,bottom,cy,goalTop,goalBottom,graphics}=args,theme=themeFor(stadium),high=!graphics.performanceMode&&graphics.lighting!=="LOW";
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,theme.stand2);bg.addColorStop(.5,theme.stand);bg.addColorStop(1,"#030706");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const crowdCount=graphics.performanceMode?90:graphics.crowdDetail==="LOW"?150:graphics.crowdDetail==="MEDIUM"?300:520;drawSeats(ctx,theme,W,H,left,right,top,bottom,crowdCount);drawAtmosphere(ctx,theme,W,H,left,right,top,bottom,high);

  if(high){const light=ctx.createRadialGradient(W/2,top,20,W/2,top,Math.max(W,H)*.68);light.addColorStop(0,"rgba(255,255,255,.12)");light.addColorStop(.5,"rgba(255,255,255,.025)");light.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=light;ctx.fillRect(0,0,W,H)}
  ctx.save();ctx.shadowColor="rgba(0,0,0,.65)";ctx.shadowBlur=18;ctx.fillStyle=theme.grassA;ctx.fillRect(left,top,right-left,bottom-top);ctx.restore();
  const stripeCount=graphics.fieldDetail==="LOW"?8:graphics.fieldDetail==="MEDIUM"?12:16;for(let i=0;i<stripeCount;i++){ctx.fillStyle=i%2?theme.grassA:theme.grassB;ctx.fillRect(left+i*(right-left)/stripeCount,top,(right-left)/stripeCount+.5,bottom-top)}
  if(graphics.fieldDetail==="HIGH"&&!graphics.performanceMode){ctx.globalAlpha=.08;ctx.strokeStyle="#fff";ctx.lineWidth=1;for(let y=top+10;y<bottom;y+=18){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke()}ctx.globalAlpha=1}

  ctx.strokeStyle=theme.line;ctx.fillStyle=theme.line;ctx.lineWidth=3;ctx.strokeRect(left,top,right-left,bottom-top);ctx.beginPath();ctx.moveTo(W/2,top);ctx.lineTo(W/2,bottom);ctx.stroke();ctx.beginPath();ctx.arc(W/2,cy,70,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(W/2,cy,3,0,Math.PI*2);ctx.fill();
  const areaH=Math.min(270,(bottom-top)*.48);ctx.strokeRect(left,cy-areaH/2,155,areaH);ctx.strokeRect(right-155,cy-areaH/2,155,areaH);ctx.strokeRect(left,cy-72,58,144);ctx.strokeRect(right-58,cy-72,58,144);ctx.beginPath();ctx.arc(left+103,cy,3,0,Math.PI*2);ctx.arc(right-103,cy,3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(left,top,13,0,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.arc(left,bottom,13,-Math.PI/2,0);ctx.stroke();ctx.beginPath();ctx.arc(right,top,13,Math.PI/2,Math.PI);ctx.stroke();ctx.beginPath();ctx.arc(right,bottom,13,Math.PI,Math.PI*1.5);ctx.stroke();
  drawGoals(ctx,left,right,goalTop,goalBottom,theme,graphics.fieldDetail!=="LOW"&&!graphics.performanceMode);

  ctx.fillStyle="rgba(2,8,5,.7)";roundedRect(ctx,W/2-68,top-26,136,18,5);ctx.fill();ctx.fillStyle=theme.accent;ctx.font="bold 9px Arial";ctx.textAlign="center";ctx.fillText(stadium.toUpperCase(),W/2,top-13);
  ctx.strokeStyle=high?theme.glow:"rgba(255,255,255,.18)";ctx.globalAlpha=high?.42:.18;ctx.lineWidth=2;ctx.strokeRect(left-4,top-4,right-left+8,bottom-top+8);ctx.globalAlpha=1;
}
