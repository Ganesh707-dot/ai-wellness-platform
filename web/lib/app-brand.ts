/** Single place for product naming (avoids scattered magic strings). */
export const APP_NAME = "Veridian Clinical";
/** Brand word only — use in interviews: “Veridian” (from Latin *viridis*, green / life). */
export const BRAND_NAME = "Veridian";
export const APP_TAGLINE = "Enterprise AI wellness & telehealth";
export const BRAND_DOMAIN = "veridian-clinical.health";
export const BRAND_SLUG = "veridian-clinical";
export const MEETING_CODE_PREFIX = "VCLN";
export const MODEL_PREFIX = "vcln";

/** Live deployment */
export const LIVE_SITE_URL = "https://veridian-clinical.vercel.app";
export const VERCEL_PROJECT_NAME = "veridian-clinical";

/** Old hostnames → 301 to LIVE_SITE_URL (keep for bookmarks / old links). */
export const LEGACY_SITE_HOSTS = ["maha-ai-wellness.vercel.app"] as const;
