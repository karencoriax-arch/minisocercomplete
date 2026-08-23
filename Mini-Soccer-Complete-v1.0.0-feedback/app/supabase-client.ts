import { createClient } from "@supabase/supabase-js";

const PUBLIC_FEEDBACK_CONFIG = Object.freeze({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://kjegxaamhmddradrzgty.supabase.co",
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "sb_publishable_3ZXSX33rlnCt9pjiKarfnQ_YgyxfbI-",
});

export const supabase = createClient(PUBLIC_FEEDBACK_CONFIG.url, PUBLIC_FEEDBACK_CONFIG.publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
