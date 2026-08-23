"use client";

import { useEffect } from "react";

const DIRECTION_BUTTONS = {
  up: 0,
  left: 1,
  down: 2,
  right: 3,
} as const;

function dispatchPointer(button: HTMLButtonElement | undefined, type: "pointerdown" | "pointerup", pointerId: number) {
  if (!button) return;
  if (typeof PointerEvent === "function") {
    button.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType: "touch",
      isPrimary: true,
    }));
    return;
  }
  button.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
}

export default function MobileJoystick() {
  useEffect(() => {
    const cleanups = new Map<HTMLElement, () => void>();

    const install = (pad: HTMLElement) => {
      if (cleanups.has(pad)) return;
      const buttons = Array.from(pad.querySelectorAll<HTMLButtonElement>(":scope > button"));
      if (buttons.length < 4) return;

      let activePointer: number | null = null;
      let held = new Set<number>();

      const setHeld = (next: Set<number>, pointerId: number) => {
        for (const index of held) {
          if (!next.has(index)) dispatchPointer(buttons[index], "pointerup", pointerId);
        }
        for (const index of next) {
          if (!held.has(index)) dispatchPointer(buttons[index], "pointerdown", pointerId);
        }
        held = next;
      };

      const update = (event: PointerEvent) => {
        const rect = pad.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const distance = Math.hypot(dx, dy);
        const travel = Math.max(28, rect.width * 0.29);
        const deadZone = travel * 0.30;
        const scale = distance > travel ? travel / distance : 1;
        const knobX = dx * scale;
        const knobY = dy * scale;

        pad.style.setProperty("--joy-x", `${knobX.toFixed(1)}px`);
        pad.style.setProperty("--joy-y", `${knobY.toFixed(1)}px`);

        const next = new Set<number>();
        if (dy < -deadZone) next.add(DIRECTION_BUTTONS.up);
        if (dy > deadZone) next.add(DIRECTION_BUTTONS.down);
        if (dx < -deadZone) next.add(DIRECTION_BUTTONS.left);
        if (dx > deadZone) next.add(DIRECTION_BUTTONS.right);
        setHeld(next, event.pointerId);
      };

      const reset = (pointerId: number) => {
        setHeld(new Set(), pointerId);
        pad.style.setProperty("--joy-x", "0px");
        pad.style.setProperty("--joy-y", "0px");
        pad.classList.remove("joystick-active");
        activePointer = null;
      };

      const down = (event: PointerEvent) => {
        if (activePointer !== null) return;
        activePointer = event.pointerId;
        event.preventDefault();
        pad.classList.add("joystick-active");
        try { pad.setPointerCapture(event.pointerId); } catch {}
        update(event);
      };

      const move = (event: PointerEvent) => {
        if (event.pointerId !== activePointer) return;
        event.preventDefault();
        update(event);
      };

      const end = (event: PointerEvent) => {
        if (event.pointerId !== activePointer) return;
        event.preventDefault();
        reset(event.pointerId);
      };

      pad.classList.add("virtual-joystick");
      pad.addEventListener("pointerdown", down, { passive: false });
      pad.addEventListener("pointermove", move, { passive: false });
      pad.addEventListener("pointerup", end, { passive: false });
      pad.addEventListener("pointercancel", end, { passive: false });
      pad.addEventListener("lostpointercapture", end, { passive: false });

      cleanups.set(pad, () => {
        pad.removeEventListener("pointerdown", down);
        pad.removeEventListener("pointermove", move);
        pad.removeEventListener("pointerup", end);
        pad.removeEventListener("pointercancel", end);
        pad.removeEventListener("lostpointercapture", end);
      });
    };

    const scan = () => document.querySelectorAll<HTMLElement>(".touch-controls .dpad").forEach(install);
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
    };
  }, []);

  return null;
}
