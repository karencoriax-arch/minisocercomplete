"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  FEEDBACK_COOLDOWN_KEY,
  feedbackCooldownRemaining,
  submitFeedback,
  validateFeedback,
  type FeedbackCategory,
  type FeedbackContext,
  type FeedbackFormData,
  type FeedbackValidationCode,
} from "./feedback-system";
import { GAME_TITLE } from "./version";

const tr = (lang: "es" | "en", es: string, en: string) => lang === "es" ? es : en;

const CATEGORY_OPTIONS: Array<{ value: FeedbackCategory; icon: string; label: [string, string] }> = [
  { value: "bug", icon: "🐛", label: ["Bug", "Bug"] },
  { value: "idea", icon: "💡", label: ["Idea", "Idea"] },
  { value: "gameplay", icon: "⚽", label: ["Jugabilidad", "Gameplay"] },
  { value: "controls", icon: "🎮", label: ["Controles", "Controls"] },
  { value: "tournaments", icon: "🏆", label: ["Torneos", "Tournaments"] },
  { value: "other", icon: "💬", label: ["Otro", "Other"] },
];

const validationText = (lang: "es" | "en", code: FeedbackValidationCode) => ({
  RATING_REQUIRED: tr(lang, "Seleccioná una valoración del 1 al 5.", "Choose a rating from 1 to 5."),
  CATEGORY_REQUIRED: tr(lang, "Seleccioná una categoría.", "Choose a category."),
  MESSAGE_TOO_SHORT: tr(lang, "Escribí al menos 3 caracteres.", "Write at least 3 characters."),
  MESSAGE_TOO_LONG: tr(lang, "La opinión no puede superar los 2000 caracteres.", "Feedback cannot exceed 2000 characters."),
  EMAIL_INVALID: tr(lang, "Revisá el formato del email o dejalo vacío.", "Check the email format or leave it blank."),
})[code];

type FeedbackModalProps = {
  lang: "es" | "en";
  context: FeedbackContext;
  initialCategory?: FeedbackCategory;
  onClose: () => void;
};

export function FeedbackModal({ lang, context, initialCategory, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory | null>(initialCategory ?? null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [includeTechnicalInfo, setIncludeTechnicalInfo] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FeedbackValidationCode[]>([]);
  const [status, setStatus] = useState<"FORM" | "ERROR" | "SUCCESS">("FORM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const isBug = initialCategory === "bug";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), input:not([disabled])') ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSubmitting, onClose]);

  const formData: FeedbackFormData = { rating, category, message, email, includeTechnicalInfo };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    const errors = validateFeedback(formData);
    setValidationErrors(errors);
    setCooldownMessage("");
    if (errors.length) return;

    let lastSubmittedAt = 0;
    try { lastSubmittedAt = Number(localStorage.getItem(FEEDBACK_COOLDOWN_KEY) || 0); } catch {}
    const remaining = feedbackCooldownRemaining(lastSubmittedAt);
    if (remaining > 0) {
      const seconds = Math.ceil(remaining / 1000);
      setCooldownMessage(tr(lang, `Esperá ${seconds} segundos antes de enviar otra opinión.`, `Wait ${seconds} seconds before sending more feedback.`));
      return;
    }

    setIsSubmitting(true);
    setStatus("FORM");
    try {
      await submitFeedback(formData, context);
      try { localStorage.setItem(FEEDBACK_COOLDOWN_KEY, String(Date.now())); } catch {}
      setRating(0);
      setCategory(initialCategory ?? null);
      setMessage("");
      setEmail("");
      setIncludeTechnicalInfo(false);
      setValidationErrors([]);
      setStatus("SUCCESS");
    } catch {
      setStatus("ERROR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="feedback-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
    <div className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title" aria-describedby="feedback-description" tabIndex={-1} ref={dialogRef}>
      <button type="button" className="feedback-close" aria-label={tr(lang, "Cerrar formulario", "Close form")} onClick={onClose} disabled={isSubmitting}>×</button>
      {status === "SUCCESS" ? <section className="feedback-success" aria-live="polite"><span>✓</span><h2>{tr(lang, "¡GRACIAS!", "THANK YOU!")}</h2><p>{tr(lang, "Tu opinión fue enviada.", "Your feedback was sent.")}</p><small>{tr(lang, `Nos ayuda a seguir mejorando ${GAME_TITLE}.`, `It helps us keep improving ${GAME_TITLE}.`)}</small><button type="button" className="primary" onClick={onClose}>{tr(lang, "CERRAR", "CLOSE")}</button></section> : <form onSubmit={handleSubmit} noValidate>
        <header className="feedback-heading"><span>{isBug ? "🐛" : "💬"}</span><div><h2 id="feedback-title">{isBug ? tr(lang, "REPORTAR UN PROBLEMA", "REPORT A PROBLEM") : tr(lang, "CONTANOS QUÉ PENSÁS", "TELL US WHAT YOU THINK")}</h2><p id="feedback-description">{tr(lang, `Tu opinión nos ayuda a mejorar ${GAME_TITLE}.`, `Your feedback helps us improve ${GAME_TITLE}.`)}</p></div></header>

        <fieldset className="feedback-rating" aria-invalid={validationErrors.includes("RATING_REQUIRED")}><legend>{tr(lang, "¿Cómo fue tu experiencia?", "How was your experience?")} <b>*</b></legend><div onMouseLeave={() => setHoverRating(0)}>{[1, 2, 3, 4, 5].map(star => <button type="button" key={star} className={(hoverRating || rating) >= star ? "active" : ""} aria-label={tr(lang, `${star} ${star === 1 ? "estrella" : "estrellas"}`, `${star} ${star === 1 ? "star" : "stars"}`)} aria-pressed={rating === star} onMouseEnter={() => setHoverRating(star)} onFocus={() => setHoverRating(star)} onBlur={() => setHoverRating(0)} onClick={() => setRating(star)}>★</button>)}</div></fieldset>

        <fieldset className="feedback-categories" aria-invalid={validationErrors.includes("CATEGORY_REQUIRED")}><legend>{tr(lang, "¿Sobre qué querés comentar?", "What do you want to comment on?")} <b>*</b></legend><div>{CATEGORY_OPTIONS.map(option => <button type="button" key={option.value} className={category === option.value ? "active" : ""} aria-pressed={category === option.value} onClick={() => setCategory(option.value)}><span>{option.icon}</span>{tr(lang, ...option.label)}{category === option.value && <b>✓</b>}</button>)}</div></fieldset>

        <label className="feedback-message"><span>{isBug ? tr(lang, "¿QUÉ OCURRIÓ?", "WHAT HAPPENED?") : tr(lang, "TU OPINIÓN", "YOUR FEEDBACK")} <b>*</b><small>{message.length} / 2000</small></span><textarea value={message} minLength={3} maxLength={2000} aria-invalid={validationErrors.includes("MESSAGE_TOO_SHORT") || validationErrors.includes("MESSAGE_TOO_LONG")} onChange={event => setMessage(event.target.value)} placeholder={isBug ? tr(lang, "Contanos qué estabas haciendo y qué esperabas que pasara.", "Tell us what you were doing and what you expected to happen.") : tr(lang, "Escribí acá...", "Write here...")} /></label>

        <label className="feedback-email"><span>{tr(lang, "Email (opcional)", "Email (optional)")}</span><small>{tr(lang, "Dejanos tu email solo si querés que podamos contactarte sobre tu comentario.", "Leave your email only if you want us to contact you about your feedback.")}</small><input type="email" inputMode="email" maxLength={320} autoComplete="email" aria-invalid={validationErrors.includes("EMAIL_INVALID")} value={email} onChange={event => setEmail(event.target.value)} placeholder="nombre@email.com" /></label>

        <label className="feedback-technical"><input type="checkbox" checked={includeTechnicalInfo} onChange={event => setIncludeTechnicalInfo(event.target.checked)} /><span><b>{tr(lang, "Incluir información técnica", "Include technical information")}</b><small>{tr(lang, "Solo datos del dispositivo y del estado del juego para detectar problemas.", "Only device and game-state data used to diagnose problems.")}</small></span></label>

        {(validationErrors.length > 0 || cooldownMessage) && <div className="feedback-validation" role="alert">{validationErrors.map(code => <p key={code}>• {validationText(lang, code)}</p>)}{cooldownMessage && <p>• {cooldownMessage}</p>}</div>}
        {status === "ERROR" && <div className="feedback-error" role="alert"><b>{tr(lang, "No pudimos enviar tu opinión.", "We couldn't send your feedback.")}</b><span>{tr(lang, "Revisá tu conexión e intentá nuevamente.", "Check your connection and try again.")}</span></div>}

        <footer><button type="button" className="ghost" onClick={onClose} disabled={isSubmitting}>{tr(lang, "CANCELAR", "CANCEL")}</button><button type="submit" className="primary" disabled={isSubmitting}>{isSubmitting ? tr(lang, "ENVIANDO...", "SENDING...") : status === "ERROR" ? tr(lang, "REINTENTAR", "TRY AGAIN") : tr(lang, "ENVIAR OPINIÓN", "SEND FEEDBACK")}</button></footer>
      </form>}
    </div>
  </div>;
}
