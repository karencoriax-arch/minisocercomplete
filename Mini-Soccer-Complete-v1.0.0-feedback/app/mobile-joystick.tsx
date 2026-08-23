"use client";

import { useEffect } from "react";

type HudPoint = { x: number; y: number };
type HudLayout = Record<"joystick"|"pass"|"shoot"|"tackle"|"switch", HudPoint>;

const STORAGE_KEY = "msc-mobile-hud-v2";
const DEFAULT_LAYOUT: HudLayout = {
  joystick: { x: 12, y: 78 },
  pass: { x: 82, y: 71 },
  shoot: { x: 92, y: 78 },
  tackle: { x: 82, y: 88 },
  switch: { x: 92, y: 89 },
};

const clamp = (value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

function loadLayout(): HudLayout {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<HudLayout>|null;
    if (!parsed) return structuredClone(DEFAULT_LAYOUT);
    const next = structuredClone(DEFAULT_LAYOUT);
    (Object.keys(next) as Array<keyof HudLayout>).forEach((key)=>{
      const point=parsed[key];
      if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))next[key]={x:clamp(point.x,4,96),y:clamp(point.y,8,94)};
    });
    return next;
  } catch {
    return structuredClone(DEFAULT_LAYOUT);
  }
}

function emitStick(x:number,y:number,active:boolean){
  window.dispatchEvent(new CustomEvent("msc-mobile-stick",{detail:{x,y,active}}));
}

export default function MobileJoystick(){
  useEffect(()=>{
    const coarse=window.matchMedia("(hover:none) and (pointer:coarse)");
    if(!coarse.matches)return;

    const cleanupFns:Array<()=>void>=[];
    const installed=new WeakSet<HTMLElement>();

    const scan=()=>{
      document.querySelectorAll<HTMLElement>(".game-screen .touch-controls").forEach((controls)=>{
        if(installed.has(controls))return;
        const game=controls.closest<HTMLElement>(".game-screen");
        const pad=controls.querySelector<HTMLElement>(".dpad");
        const actionBox=controls.querySelector<HTMLElement>(".touch-actions");
        const buttons=actionBox?Array.from(actionBox.querySelectorAll<HTMLButtonElement>(":scope > button")):[];
        if(!game||!pad||!actionBox||buttons.length<4)return;
        installed.add(controls);
        controls.classList.add("mobile-hud-layout");
        pad.classList.add("virtual-joystick");
        actionBox.classList.add("free-hud-actions");

        const elementMap:Record<keyof HudLayout,HTMLElement>={joystick:pad,pass:buttons[0],shoot:buttons[1],tackle:buttons[2],switch:buttons[3]};
        let layout=loadLayout();
        let editing=false;
        let pausedByEditor=false;
        let stickPointer:number|null=null;
        let dragPointer:number|null=null;
        let dragKey:keyof HudLayout|null=null;

        const applyPoint=(key:keyof HudLayout)=>{
          const el=elementMap[key],point=layout[key];
          el.style.setProperty("--hud-x",`${point.x}%`);
          el.style.setProperty("--hud-y",`${point.y}%`);
          el.dataset.hudControl=key;
        };
        const applyLayout=()=>{(Object.keys(elementMap) as Array<keyof HudLayout>).forEach(applyPoint)};
        const saveLayout=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(layout));
        applyLayout();

        const editButton=document.createElement("button");
        editButton.type="button";
        editButton.className="mobile-hud-edit-button";
        editButton.textContent="EDITAR HUD";
        const resetButton=document.createElement("button");
        resetButton.type="button";
        resetButton.className="mobile-hud-reset-button";
        resetButton.textContent="RESTABLECER";
        resetButton.hidden=true;
        game.append(editButton,resetButton);

        const pauseForEditor=()=>{
          if(game.querySelector(".pause-overlay"))return;
          window.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
          pausedByEditor=true;
        };
        const resumeAfterEditor=()=>{
          if(!pausedByEditor)return;
          pausedByEditor=false;
          window.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
        };
        const setEditing=(value:boolean)=>{
          editing=value;
          game.classList.toggle("mobile-hud-editing",value);
          editButton.textContent=value?"GUARDAR HUD":"EDITAR HUD";
          resetButton.hidden=!value;
          if(value){emitStick(0,0,false);pauseForEditor()}else{saveLayout();resumeAfterEditor()}
        };

        const editClick=(event:Event)=>{event.preventDefault();event.stopPropagation();setEditing(!editing)};
        const resetClick=(event:Event)=>{
          event.preventDefault();event.stopPropagation();
          layout=structuredClone(DEFAULT_LAYOUT);applyLayout();saveLayout();
        };
        editButton.addEventListener("click",editClick);
        resetButton.addEventListener("click",resetClick);

        const updateDrag=(event:PointerEvent)=>{
          if(!editing||dragPointer!==event.pointerId||!dragKey)return;
          event.preventDefault();event.stopPropagation();
          const rect=controls.getBoundingClientRect();
          layout[dragKey]={
            x:clamp((event.clientX-rect.left)/Math.max(1,rect.width)*100,4,96),
            y:clamp((event.clientY-rect.top)/Math.max(1,rect.height)*100,8,94),
          };
          applyPoint(dragKey);
        };
        const endDrag=(event:PointerEvent)=>{
          if(dragPointer!==event.pointerId)return;
          event.preventDefault();event.stopPropagation();
          dragPointer=null;dragKey=null;saveLayout();
        };
        const beginDrag=(key:keyof HudLayout,event:PointerEvent)=>{
          event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
          dragPointer=event.pointerId;dragKey=key;
          try{elementMap[key].setPointerCapture(event.pointerId)}catch{}
          updateDrag(event);
        };

        const updateStick=(event:PointerEvent)=>{
          if(stickPointer!==event.pointerId)return;
          const rect=pad.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
          const dx=event.clientX-cx,dy=event.clientY-cy,distance=Math.hypot(dx,dy),travel=Math.max(30,rect.width*.31),deadZone=travel*.16;
          const visualScale=distance>travel?travel/Math.max(1,distance):1;
          pad.style.setProperty("--joy-x",`${(dx*visualScale).toFixed(1)}px`);
          pad.style.setProperty("--joy-y",`${(dy*visualScale).toFixed(1)}px`);
          if(distance<=deadZone){emitStick(0,0,true);return}
          const strength=clamp((distance-deadZone)/(travel-deadZone),0,1),ux=dx/Math.max(1,distance),uy=dy/Math.max(1,distance);
          emitStick(ux*strength,uy*strength,true);
        };
        const resetStick=()=>{
          stickPointer=null;pad.classList.remove("joystick-active");pad.style.setProperty("--joy-x","0px");pad.style.setProperty("--joy-y","0px");emitStick(0,0,false);
        };
        const padDown=(event:PointerEvent)=>{
          if(editing){beginDrag("joystick",event);return}
          if(stickPointer!==null)return;
          event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
          stickPointer=event.pointerId;pad.classList.add("joystick-active");
          try{pad.setPointerCapture(event.pointerId)}catch{}
          updateStick(event);
        };
        const padMove=(event:PointerEvent)=>{
          if(editing){updateDrag(event);return}
          if(stickPointer!==event.pointerId)return;
          event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();updateStick(event);
        };
        const padEnd=(event:PointerEvent)=>{
          if(editing){endDrag(event);return}
          if(stickPointer!==event.pointerId)return;
          event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();resetStick();
        };
        pad.addEventListener("pointerdown",padDown,{capture:true,passive:false});
        pad.addEventListener("pointermove",padMove,{capture:true,passive:false});
        pad.addEventListener("pointerup",padEnd,{capture:true,passive:false});
        pad.addEventListener("pointercancel",padEnd,{capture:true,passive:false});

        const actionCleanups:Array<()=>void>=[];
        (["pass","shoot","tackle","switch"] as Array<keyof HudLayout>).forEach((key)=>{
          const el=elementMap[key];
          const down=(event:PointerEvent)=>{if(editing)beginDrag(key,event)};
          const move=(event:PointerEvent)=>{if(editing)updateDrag(event)};
          const end=(event:PointerEvent)=>{if(editing)endDrag(event)};
          el.addEventListener("pointerdown",down,{capture:true,passive:false});
          el.addEventListener("pointermove",move,{capture:true,passive:false});
          el.addEventListener("pointerup",end,{capture:true,passive:false});
          el.addEventListener("pointercancel",end,{capture:true,passive:false});
          actionCleanups.push(()=>{el.removeEventListener("pointerdown",down,true);el.removeEventListener("pointermove",move,true);el.removeEventListener("pointerup",end,true);el.removeEventListener("pointercancel",end,true)});
        });

        const releaseOutside=(event:PointerEvent)=>{if(!editing&&stickPointer===event.pointerId)resetStick();if(editing)endDrag(event)};
        const visibility=()=>{if(document.hidden)resetStick()};
        window.addEventListener("pointerup",releaseOutside,true);
        window.addEventListener("pointercancel",releaseOutside,true);
        window.addEventListener("blur",resetStick);
        document.addEventListener("visibilitychange",visibility);

        cleanupFns.push(()=>{
          resetStick();resumeAfterEditor();
          editButton.removeEventListener("click",editClick);resetButton.removeEventListener("click",resetClick);
          editButton.remove();resetButton.remove();
          pad.removeEventListener("pointerdown",padDown,true);pad.removeEventListener("pointermove",padMove,true);pad.removeEventListener("pointerup",padEnd,true);pad.removeEventListener("pointercancel",padEnd,true);
          actionCleanups.forEach(fn=>fn());
          window.removeEventListener("pointerup",releaseOutside,true);window.removeEventListener("pointercancel",releaseOutside,true);window.removeEventListener("blur",resetStick);document.removeEventListener("visibilitychange",visibility);
        });
      });
    };

    scan();
    const observer=new MutationObserver(scan);
    observer.observe(document.body,{childList:true,subtree:true});
    const tryLandscape=()=>{const orientation=screen.orientation as ScreenOrientation&{lock?:(value:string)=>Promise<void>};orientation.lock?.("landscape").catch(()=>{})};
    const firstTouch=()=>{tryLandscape();window.removeEventListener("pointerdown",firstTouch,true)};
    window.addEventListener("pointerdown",firstTouch,true);

    return()=>{observer.disconnect();window.removeEventListener("pointerdown",firstTouch,true);cleanupFns.forEach(fn=>fn())};
  },[]);
  return null;
}
