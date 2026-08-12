const COOKIE_NAME = "aw-site-access";

export function isSiteLockEnabled(): boolean {
  return Boolean(process.env.SITE_ACCESS_PASSWORD?.trim());
}

/** Edge-safe constant-time string compare (middleware runs on Edge). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function verifySitePassword(input: string): boolean {
  const expected = process.env.SITE_ACCESS_PASSWORD?.trim();
  if (!expected || !input) return false;
  return safeEqual(input.trim(), expected);
}

/** Cookie holds opaque token issued only after POST /api/site-access succeeds. */
export function isValidSiteAccessCookie(value: string | undefined): boolean {
  const expected = process.env.SITE_ACCESS_PASSWORD?.trim();
  if (!expected || !value) return false;
  return safeEqual(value, expected);
}

export function siteAccessCookieValue(): string {
  return process.env.SITE_ACCESS_PASSWORD?.trim() ?? "";
}

export { COOKIE_NAME };
