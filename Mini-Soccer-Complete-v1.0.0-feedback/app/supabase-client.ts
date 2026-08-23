import { createClient } from "@supabase/supabase-js";

type PublicViteEnvironment = ImportMeta & {
  readonly env?: Record<string, string | undefined>;
};

const publicEnvironment = (import.meta as PublicViteEnvironment).env;

const PUBLIC_FEEDBACK_CONFIG = Object.freeze({
  url: publicEnvironment?.VITE_SUPABASE_URL?.trim() || "https://kjegxaamhmddradrzgty.supabase.co",
  publishableKey: publicEnvironment?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "sb_publishable_3ZXSX33rlnCt9pjiKarfnQ_YgyxfbI-",
});

export const supabase = createClient(PUBLIC_FEEDBACK_CONFIG.url, PUBLIC_FEEDBACK_CONFIG.publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
