import { supabase } from "./supabase-client";
import { GAME_VERSION } from "./version";
import { buildFeedbackPayloadForVersion, type FeedbackContext, type FeedbackFormData, type FeedbackPayload } from "./feedback-core";

export * from "./feedback-core";

export function buildFeedbackPayload(formData: FeedbackFormData, context: FeedbackContext): FeedbackPayload {
  return buildFeedbackPayloadForVersion(formData, context, GAME_VERSION);
}

export async function submitFeedback(formData: FeedbackFormData, context: FeedbackContext): Promise<void> {
  const payload = buildFeedbackPayload(formData, context);
  const { error } = await supabase.from("feedback").insert(payload);
  if (error) {
    console.error("[Feedback] Supabase insert failed:", error);
    throw error;
  }
}
