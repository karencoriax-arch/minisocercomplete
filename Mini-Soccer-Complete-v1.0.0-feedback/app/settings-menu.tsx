"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CRITICAL_INPUT_ACTIONS,
  DEFAULT_CONTROL_BINDINGS,
  assignBinding,
  cloneBindings,
  findBindingConflict,
  formatBinding,
  isActionUnbound,
  keyboardBinding,
  mouseBinding,
  removeBinding,
  type BindingSlot,
  type ControlProfileId,
  type InputAction,
  type InputBinding,
} from "./input-manager";
import type { SettingsState } from "./game-state";
import type { FeedbackCategory } from "./feedback-system";
import { applyGraphicsPreset } from "./graphics-settings";
import { GAME_TITLE, GAME_VERSION, INITIAL_RELEASE } from "./version";

export type SettingsCategory = "CONTROLS" | "GAMEPLAY" | "GRAPHICS" | "AUDIO" | "ACCESSIBILITY" | "ABOUT";

type SettingsMenuProps = {
  lang: "es" | "en";
  settings: SettingsState;
  onChange: (settings: SettingsState) => void;
  onBack: () => void;
  embedded?: boolean;
  initialCategory?: SettingsCategory;
  onFeedback?: (category?: FeedbackCategory) => void;
};

const tr = (lang: "es" | "en", es: string, en: string) => lang === "es" ? es : en;
let uiAudioContext: AudioContext | null = null;

function playUiTick(settings: SettingsState) {
  if (settings.audio.master <= 0 || settings.audio.ui <= 0) return;
  try {
    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = uiAudioContext || new AudioContextConstructor();
    uiAudioContext = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, now);
    oscillator.frequency.exponentialRampToValueAtTime(350, now + 0.035);
    gain.gain.setValueAtTime(0.025 * (settings.audio.master / 100) * (settings.audio.ui / 100), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  } catch {}
}

const ACTION_LABELS: Record<InputAction, [string, string]> = {
  MOVE_UP: ["Mover arriba", "Move up"],
  MOVE_LEFT: ["Mover izquierda", "Move left"],
  MOVE_DOWN: ["Mover abajo", "Move down"],
  MOVE_RIGHT: ["Mover derecha", "Move right"],
  PASS: ["Pase", "Pass"],
  SHOOT: ["Remate", "Shoot"],
  SPRINT: ["Sprint", "Sprint"],
  TACKLE: ["Quitar pelota", "Tackle"],
  SWITCH_PLAYER: ["Cambiar jugador", "Switch player"],
  CHANGE_TACTIC: ["Cambiar táctica", "Change tactic"],
  PAUSE: ["Pausa", "Pause"],
};

const ACTION_GROUPS: Array<{ label: [string, string]; actions: InputAction[] }> = [
  { label: ["Movimiento", "Movement"], actions: ["MOVE_UP", "MOVE_LEFT", "MOVE_DOWN", "MOVE_RIGHT", "SPRINT"] },
  { label: ["Ataque", "Attack"], actions: ["PASS", "SHOOT"] },
  { label: ["Defensa", "Defense"], actions: ["TACKLE", "SWITCH_PLAYER"] },
  { label: ["General", "General"], actions: ["CHANGE_TACTIC", "PAUSE"] },
];

const CATEGORIES: Array<{ id: SettingsCategory; icon: string; label: [string, string] }> = [
  { id: "CONTROLS", icon: "⌨", label: ["Controles", "Controls"] },
  { id: "GAMEPLAY", icon: "⚽", label: ["Jugabilidad", "Gameplay"] },
  { id: "GRAPHICS", icon: "◫", label: ["Gráficos", "Graphics"] },
  { id: "AUDIO", icon: "♫", label: ["Audio", "Audio"] },
  { id: "ACCESSIBILITY", icon: "◎", label: ["Accesibilidad", "Accessibility"] },
  { id: "ABOUT", icon: "ⓘ", label: ["Acerca del juego", "About the game"] },
];

function Toggle({ value, onChange, label, description }: { value: boolean; onChange: (value: boolean) => void; label: string; description?: string }) {
  return <button type="button" className={`console-toggle ${value ? "active" : ""}`} role="switch" aria-checked={value} onClick={() => onChange(!value)}><span><b>{label}</b>{description && <small>{description}</small>}</span><i><em /></i></button>;
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return <div className="console-setting-row"><span><b>{label}</b>{description && <small>{description}</small>}</span><div>{children}</div></div>;
}

export function SettingsMenu({ lang, settings, onChange, onBack, embedded = false, initialCategory = "CONTROLS", onFeedback }: SettingsMenuProps) {
  const [category, setCategory] = useState<SettingsCategory>(initialCategory);
  const [capture, setCapture] = useState<{ action: InputAction; slot: BindingSlot } | null>(null);
  const [pending, setPending] = useState<{ action: InputAction; slot: BindingSlot; binding: InputBinding; conflict: { action: InputAction; slot: BindingSlot } } | null>(null);
  const [warning, setWarning] = useState("");
  const [hardwareNote, setHardwareNote] = useState("");
  const [showChangelog, setShowChangelog] = useState(false);
  const activeProfile = settings.controls.activeProfile;
  const activeBindings = settings.controls.profiles[activeProfile];

  const update = (next: Partial<SettingsState>) => onChange({ ...settings, ...next });
  const updateGameplay = (next: Partial<SettingsState["gameplay"]>) => onChange({ ...settings, gameplay: { ...settings.gameplay, ...next } });
  const updateGraphics = (next: Partial<SettingsState["graphics"]>) => onChange({ ...settings, graphics: { ...settings.graphics, ...next, preset: next.preset ?? "CUSTOM" } });
  const updateAudio = (next: Partial<SettingsState["audio"]>) => {
    const audio = { ...settings.audio, ...next };
    onChange({ ...settings, audio, sound: audio.master > 0, music: audio.musicEnabled, crowd: audio.crowdEnabled });
  };
  const updateAccessibility = (next: Partial<SettingsState["accessibility"]>) => {
    const accessibility = { ...settings.accessibility, ...next };
    onChange({ ...settings, accessibility, reducedMotion: accessibility.reducedMotion });
  };
  const writeBindings = (bindings: typeof activeBindings) => onChange({
    ...settings,
    controls: { ...settings.controls, profiles: { ...settings.controls.profiles, [activeProfile]: bindings } },
  });

  useEffect(() => {
    if (!capture) return;
    const finish = (binding: InputBinding) => {
      const conflict = findBindingConflict(activeBindings, binding, capture);
      if (conflict) setPending({ ...capture, binding, conflict });
      else writeBindings(assignBinding(activeBindings, capture.action, capture.slot, binding, "REPLACE").bindings);
      setCapture(null);
    };
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") { setCapture(null); return; }
      if (event.repeat || ["Meta", "Control", "Alt"].includes(event.key)) return;
      finish(keyboardBinding(event.key));
    };
    const onMouse = (event: MouseEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      finish(mouseBinding(event.button));
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onMouse, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onMouse, true);
    };
  }, [capture, activeBindings]);

  const resolveConflict = (resolution: "REPLACE" | "SWAP" | "CANCEL") => {
    if (!pending) return;
    if (resolution !== "CANCEL") writeBindings(assignBinding(activeBindings, pending.action, pending.slot, pending.binding, resolution).bindings);
    setPending(null);
  };

  const remove = (action: InputAction, slot: BindingSlot) => {
    const next = removeBinding(activeBindings, action, slot);
    writeBindings(next);
    if (CRITICAL_INPUT_ACTIONS.includes(action) && isActionUnbound(next, action)) setWarning(tr(lang, `Atención: ${ACTION_LABELS[action][0]} quedó sin asignar.`, `Warning: ${ACTION_LABELS[action][1]} is now unbound.`));
    else setWarning("");
  };

  const setProfile = (profile: ControlProfileId) => onChange({ ...settings, controls: { ...settings.controls, activeProfile: profile } });
  const restoreControls = () => {
    if (!window.confirm(tr(lang, "¿Restaurar los controles predeterminados de este perfil?", "Restore the default controls for this profile?"))) return;
    writeBindings(cloneBindings(DEFAULT_CONTROL_BINDINGS));
    setWarning("");
  };
  const autoDetect = () => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const preset: "LOW" | "MEDIUM" | "HIGH" = cores <= 4 || memory <= 4 ? "LOW" : cores >= 8 && memory >= 8 ? "HIGH" : "MEDIUM";
    onChange(applyGraphicsPreset(settings, preset));
    setHardwareNote(tr(lang, `Perfil ${preset} aplicado según ${cores} núcleos y ${memory} GB estimados.`, `${preset} profile applied for ${cores} cores and an estimated ${memory} GB.`));
  };
  const categoryTitle = useMemo(() => CATEGORIES.find((item) => item.id === category)!, [category]);

  return <div className={`console-settings ${embedded ? "embedded" : ""}`} onPointerDownCapture={event => { if ((event.target as HTMLElement).closest("button,select,input")) playUiTick(settings); }} onContextMenu={event => (capture || pending) && event.preventDefault()}>
    <header><button type="button" onClick={onBack}>← {tr(lang, embedded ? "VOLVER A PAUSA" : "INICIO", embedded ? "BACK TO PAUSE" : "HOME")}</button><div><span>MINI SOCCER COMPLETE</span><h1>{tr(lang, "AJUSTES", "SETTINGS")}</h1></div><em>{categoryTitle.icon}</em></header>
    <div className="console-settings-layout">
      <nav aria-label={tr(lang, "Categorías de ajustes", "Settings categories")}><div className="settings-category-list">{CATEGORIES.map(item => <button type="button" key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}><i>{item.icon}</i><span>{tr(lang, ...item.label)}</span><b>›</b></button>)}</div>{onFeedback && <div className="settings-feedback-shortcuts"><button type="button" onClick={() => onFeedback()}><i>💬</i><span>{tr(lang, "Enviar opinión", "Send feedback")}</span><b>↗</b></button><button type="button" onClick={() => onFeedback("bug")}><i>🐛</i><span>{tr(lang, "Reportar problema", "Report a problem")}</span><b>↗</b></button></div>}</nav>
      <section className="console-settings-panel">
        <div className="console-panel-title"><span>{categoryTitle.icon}</span><div><h2>{tr(lang, ...categoryTitle.label)}</h2><p>{category === "CONTROLS" ? tr(lang, "Asigná hasta dos entradas por acción. Mouse y teclado son compatibles.", "Assign up to two inputs per action. Mouse and keyboard are supported.") : category === "GAMEPLAY" ? tr(lang, "Ajustá ayudas, cámara y comportamiento de repetición.", "Tune assists, camera and replay behavior.") : category === "GRAPHICS" ? tr(lang, "Cada opción modifica realmente el render y el rendimiento.", "Every option changes rendering or performance.") : category === "AUDIO" ? tr(lang, "Mezcla independiente para música, multitud y efectos.", "Independent mix for music, crowd and effects.") : category === "ACCESSIBILITY" ? tr(lang, "Opciones de lectura, contraste y movimiento.", "Readability, contrast and motion options.") : tr(lang, "Versión oficial, estado del lanzamiento y novedades.", "Official version, release status and what's new.")}</p></div></div>

        {category === "CONTROLS" && <div className="controls-settings">
          <div className="profile-tabs">{(["DEFAULT", "CUSTOM_1", "CUSTOM_2"] as const).map((profile, index) => <button type="button" key={profile} className={activeProfile === profile ? "active" : ""} onClick={() => setProfile(profile)}>{index === 0 ? tr(lang, "Predeterminado", "Default") : `${tr(lang, "Personalizado", "Custom")} ${index}`}</button>)}</div>
          {warning && <p className="settings-warning">⚠ {warning}</p>}
          {ACTION_GROUPS.map(group => <div className="binding-group" key={group.label[0]}><h3>{tr(lang, ...group.label)}</h3>{group.actions.map(action => <div className="binding-row" key={action}><span>{tr(lang, ...ACTION_LABELS[action])}</span>{(["primary", "secondary"] as const).map(slot => <div className="binding-slot" key={slot}><button type="button" className={!activeBindings[action][slot] ? "empty" : ""} onClick={() => setCapture({ action, slot })}>{formatBinding(activeBindings[action][slot], lang)}</button>{activeBindings[action][slot] && <button type="button" className="remove-binding" aria-label={tr(lang, "Quitar asignación", "Remove binding")} onClick={() => remove(action, slot)}>×</button>}</div>)}</div>)}</div>)}
          <button type="button" className="restore-settings" onClick={restoreControls}>↺ {tr(lang, "RESTAURAR PREDETERMINADOS", "RESTORE DEFAULTS")}</button>
        </div>}

        {category === "GAMEPLAY" && <div className="settings-stack">
          <SettingRow label={tr(lang, "Asistencia de pase", "Pass assistance")} description={tr(lang, "Afecta la selección y corrección del receptor.", "Changes receiver selection and correction.")}><select value={settings.gameplay.passAssist} onChange={event => updateGameplay({ passAssist: event.target.value as SettingsState["gameplay"]["passAssist"] })}><option value="ASSISTED">{tr(lang, "Asistida", "Assisted")}</option><option value="SEMI">Semi</option><option value="MANUAL">Manual</option></select></SettingRow>
          <SettingRow label={tr(lang, "Cambio automático", "Auto switch")} description={tr(lang, "Inteligente cambia al receptor y a la mejor opción en pelota libre, pero conserva la defensa manual.", "Smart switches to the receiver and best loose-ball option while keeping normal defense manual.")}><select value={settings.gameplay.autoSwitch} onChange={event => updateGameplay({ autoSwitch: event.target.value as SettingsState["gameplay"]["autoSwitch"] })}><option value="SMART">{tr(lang, "Inteligente ★ Recomendado", "Smart ★ Recommended")}</option><option value="PASSES_AND_LOOSE">{tr(lang, "Solo pases y pelotas libres", "Passes and loose balls only")}</option><option value="PASSES_ONLY">{tr(lang, "Solo pases", "Passes only")}</option><option value="MANUAL">{tr(lang, "Manual", "Manual")}</option></select></SettingRow>
          <SettingRow label={tr(lang, "Asistencia después del cambio", "Post-switch movement assist")} description={tr(lang, "Conserva brevemente la carrera del receptor para que el cambio no lo frene.", "Briefly preserves the receiver's run so switching does not stop them.")}><select value={settings.gameplay.switchMoveAssist} onChange={event => updateGameplay({ switchMoveAssist: event.target.value as SettingsState["gameplay"]["switchMoveAssist"] })}><option value="NONE">{tr(lang, "Ninguna", "None")}</option><option value="LOW">{tr(lang, "Baja ★", "Low ★")}</option><option value="HIGH">{tr(lang, "Alta", "High")}</option></select></SettingRow>
          <SettingRow label={tr(lang, "Cámara", "Camera")}><select value={settings.camera} onChange={event => update({ camera: event.target.value as SettingsState["camera"] })}><option value="CERCANA">{tr(lang, "Cercana", "Close")}</option><option value="EQUILIBRADA">{tr(lang, "Equilibrada", "Balanced")}</option><option value="ABIERTA">{tr(lang, "Abierta", "Wide")}</option></select></SettingRow>
          <Toggle value={settings.gameplay.passArrow} onChange={passArrow => updateGameplay({ passArrow })} label={tr(lang, "Flecha de pase", "Pass arrow")} description={tr(lang, "Muestra dirección y potencia mientras cargás.", "Shows direction and power while charging.")} />
          <Toggle value={settings.gameplay.receiverIndicator} onChange={receiverIndicator => updateGameplay({ receiverIndicator })} label={tr(lang, "Indicador de receptor", "Receiver indicator")} />
          <Toggle value={settings.gameplay.automaticReplays} onChange={automaticReplays => updateGameplay({ automaticReplays })} label={tr(lang, "Repeticiones automáticas", "Automatic replays")} description={tr(lang, "Podés omitirlas con Espacio, Esc o clic.", "Skip with Space, Esc or click.")} />
          <Toggle value={settings.gameplay.dynamicZoom} onChange={dynamicZoom => updateGameplay({ dynamicZoom })} label={tr(lang, "Zoom dinámico suave", "Smooth dynamic zoom")} />
        </div>}

        {category === "GRAPHICS" && <div className="settings-stack">
          <div className="preset-grid">{(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "ULTRA"] as const).map(preset => <button type="button" key={preset} className={settings.graphics.preset === preset ? "active" : ""} onClick={() => onChange(applyGraphicsPreset(settings, preset))}>{preset.replace("_", " ")}</button>)}</div>
          <button type="button" className="auto-detect" onClick={autoDetect}>◈ {tr(lang, "DETECCIÓN AUTOMÁTICA", "AUTO DETECT")}</button>{hardwareNote && <p className="hardware-note">{hardwareNote}</p>}
          <SettingRow label={tr(lang, "Escala de render", "Render scale")} description={`${settings.graphics.renderScale}%`}><input type="range" min="50" max="100" step="5" value={settings.graphics.renderScale} onChange={event => updateGraphics({ renderScale: Number(event.target.value) as SettingsState["graphics"]["renderScale"] })} /></SettingRow>
          <SettingRow label={tr(lang, "Límite de FPS", "FPS limit")}><select value={settings.graphics.fpsLimit} onChange={event => updateGraphics({ fpsLimit: Number(event.target.value) as SettingsState["graphics"]["fpsLimit"] })}><option value="30">30</option><option value="60">60</option><option value="120">120</option><option value="0">{tr(lang, "Sin límite", "Unlimited")}</option></select></SettingRow>
          {(["particles", "crowdDetail", "fieldDetail", "lighting"] as const).map(key => <SettingRow key={key} label={key === "particles" ? tr(lang, "Partículas", "Particles") : key === "crowdDetail" ? tr(lang, "Detalle del público", "Crowd detail") : key === "fieldDetail" ? tr(lang, "Detalle del campo", "Field detail") : tr(lang, "Iluminación", "Lighting")}><select value={settings.graphics[key]} onChange={event => updateGraphics({ [key]: event.target.value } as Partial<SettingsState["graphics"]>)}><option value="LOW">{tr(lang, "Bajo", "Low")}</option><option value="MEDIUM">{tr(lang, "Medio", "Medium")}</option><option value="HIGH">{tr(lang, "Alto", "High")}</option></select></SettingRow>)}
          <Toggle value={settings.graphics.vsync} onChange={vsync => updateGraphics({ vsync, fpsLimit: vsync ? 60 : 120 })} label="V-Sync" description={tr(lang, "Sincroniza el límite con 60 Hz; al desactivarlo libera hasta 120 FPS.", "Syncs the cap to 60 Hz; disabling it unlocks up to 120 FPS.")} />
          <Toggle value={settings.graphics.showFps} onChange={showFps => updateGraphics({ showFps })} label={tr(lang, "Mostrar FPS", "Show FPS")} />
          <Toggle value={settings.graphics.performanceMode} onChange={performanceMode => updateGraphics({ performanceMode })} label={tr(lang, "Modo rendimiento", "Performance mode")} />
          <Toggle value={settings.graphics.playerShadows} onChange={playerShadows => updateGraphics({ playerShadows })} label={tr(lang, "Sombras de jugadores", "Player shadows")} />
          <Toggle value={settings.graphics.antiAliasing} onChange={antiAliasing => updateGraphics({ antiAliasing })} label={tr(lang, "Suavizado", "Anti-aliasing")} />
        </div>}

        {category === "AUDIO" && <div className="settings-stack audio-settings">
          {(["master", "music", "crowd", "effects", "ui"] as const).map(key => <SettingRow key={key} label={key === "master" ? tr(lang, "Volumen general", "Master volume") : key === "music" ? tr(lang, "Música", "Music") : key === "crowd" ? tr(lang, "Multitud", "Crowd") : key === "effects" ? tr(lang, "Efectos", "Effects") : tr(lang, "Interfaz", "Interface")} description={`${Math.round(settings.audio[key])}%`}><input type="range" min="0" max="100" value={settings.audio[key]} onChange={event => updateAudio({ [key]: Number(event.target.value) })} /></SettingRow>)}
          <Toggle value={settings.audio.musicEnabled} onChange={musicEnabled => { updateAudio({ musicEnabled }); }} label={tr(lang, "Música activada", "Music enabled")} />
          <Toggle value={settings.audio.crowdEnabled} onChange={crowdEnabled => { updateAudio({ crowdEnabled }); }} label={tr(lang, "Multitud activada", "Crowd enabled")} />
          <Toggle value={settings.audio.effectsEnabled} onChange={effectsEnabled => { updateAudio({ effectsEnabled }); }} label={tr(lang, "Efectos activados", "Effects enabled")} />
        </div>}

        {category === "ACCESSIBILITY" && <div className="settings-stack">
          <SettingRow label={tr(lang, "Idioma", "Language")}><select value={settings.language} onChange={event => update({ language: event.target.value as SettingsState["language"] })}><option value="es">Español</option><option value="en">English</option></select></SettingRow>
          <SettingRow label={tr(lang, "Resolución de interfaz", "Interface resolution")}><select value={settings.resolution} onChange={event => update({ resolution: event.target.value as SettingsState["resolution"] })}><option>Auto</option><option>720p</option><option>1080p</option><option>Compacta</option></select></SettingRow>
          <SettingRow label={tr(lang, "Escala de interfaz", "Interface scale")}><select value={settings.accessibility.uiScale} onChange={event => updateAccessibility({ uiScale: event.target.value as SettingsState["accessibility"]["uiScale"] })}><option value="SMALL">{tr(lang, "Pequeña", "Small")}</option><option value="NORMAL">{tr(lang, "Normal", "Normal")}</option><option value="LARGE">{tr(lang, "Grande", "Large")}</option></select></SettingRow>
          <SettingRow label={tr(lang, "Tamaño de indicadores", "Indicator size")}><select value={settings.accessibility.indicatorScale} onChange={event => updateAccessibility({ indicatorScale: event.target.value as SettingsState["accessibility"]["indicatorScale"] })}><option value="SMALL">{tr(lang, "Pequeño", "Small")}</option><option value="NORMAL">{tr(lang, "Normal", "Normal")}</option><option value="LARGE">{tr(lang, "Grande", "Large")}</option></select></SettingRow>
          <Toggle value={settings.accessibility.reducedMotion} onChange={reducedMotion => updateAccessibility({ reducedMotion })} label={tr(lang, "Movimiento reducido", "Reduced motion")} />
          <Toggle value={settings.accessibility.highContrast} onChange={highContrast => updateAccessibility({ highContrast })} label={tr(lang, "Alto contraste", "High contrast")} />
          <Toggle value={settings.accessibility.highlightControlled} onChange={highlightControlled => updateAccessibility({ highlightControlled })} label={tr(lang, "Resaltar jugador controlado", "Highlight controlled player")} />
          <Toggle value={settings.accessibility.highlightReceiver} onChange={highlightReceiver => updateAccessibility({ highlightReceiver })} label={tr(lang, "Resaltar receptor", "Highlight receiver")} />
          <Toggle value={settings.accessibility.reduceVisualEffects} onChange={reduceVisualEffects => updateAccessibility({ reduceVisualEffects })} label={tr(lang, "Reducir efectos visuales", "Reduce visual effects")} />
        </div>}

        {category === "ABOUT" && <div className="about-game">
          <section className="about-version-card"><span>MSC</span><div><small>{tr(lang, "VERSIÓN OFICIAL ESTABLE", "OFFICIAL STABLE RELEASE")}</small><h3>{GAME_TITLE}</h3><p>{tr(lang, "Versión", "Version")} {GAME_VERSION}</p></div><strong>STABLE</strong></section>
          {onFeedback && <section className="about-feedback-card"><div><span>💬</span><div><h3>{tr(lang, "AYUDANOS A MEJORAR", "HELP US IMPROVE")}</h3><p>{tr(lang, "Compartí una idea o avisá si encontraste un problema.", "Share an idea or tell us if you found a problem.")}</p></div></div><div><button type="button" onClick={() => onFeedback()}>{tr(lang, "ENVIAR OPINIÓN", "SEND FEEDBACK")}</button><button type="button" onClick={() => onFeedback("bug")}>{tr(lang, "REPORTAR PROBLEMA", "REPORT A PROBLEM")}</button></div></section>}
          <button type="button" className="changelog-toggle" aria-expanded={showChangelog} onClick={() => setShowChangelog(value => !value)}><span>✦</span><b>{tr(lang, "NOVEDADES", "WHAT'S NEW")}</b><i>{showChangelog ? "−" : "+"}</i></button>
          {showChangelog && <section className="changelog-panel"><header><small>v{GAME_VERSION}</small><h3>{tr(lang, ...INITIAL_RELEASE.title)}</h3></header><div className="changelog-grid">{INITIAL_RELEASE.sections.map(section => <article key={section.title[0]}><h4>{tr(lang, ...section.title)}</h4><ul>{section.items.map(item => <li key={item[0]}>{tr(lang, ...item)}</li>)}</ul></article>)}</div></section>}
        </div>}
      </section>
    </div>

    {capture && <div className="binding-capture" role="dialog" aria-modal="true"><div><span>⌨</span><h2>{tr(lang, "PRESIONÁ UNA TECLA O BOTÓN DEL MOUSE", "PRESS A KEY OR MOUSE BUTTON")}</h2><p>{tr(lang, "Esc para cancelar", "Esc to cancel")}</p></div></div>}
    {pending && <div className="binding-conflict" role="dialog" aria-modal="true"><div><span>⚠</span><h2>{tr(lang, "CONFLICTO DE CONTROL", "CONTROL CONFLICT")}</h2><p>{formatBinding(pending.binding, lang)} {tr(lang, `ya está asignado a ${ACTION_LABELS[pending.conflict.action][0]}.`, `is already assigned to ${ACTION_LABELS[pending.conflict.action][1]}.`)}</p><div><button type="button" onClick={() => resolveConflict("REPLACE")}>{tr(lang, "REEMPLAZAR", "REPLACE")}</button><button type="button" onClick={() => resolveConflict("SWAP")}>{tr(lang, "INTERCAMBIAR", "SWAP")}</button><button type="button" onClick={() => resolveConflict("CANCEL")}>{tr(lang, "CANCELAR", "CANCEL")}</button></div></div></div>}
  </div>;
}
