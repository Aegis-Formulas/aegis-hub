/** Routes anyone can open without signing in. Everything else needs a session. */
const PUBLIC_PREFIXES = ["/sign-in", "/auth/", "/styleguide"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`));
}

export const HOME_PATH = "/home";

/**
 * Only allow redirects back into this app (a relative path), never to another site.
 * Blocks "//evil.com", "/\evil.com" and absolute URLs.
 */
export function safeNextPath(next: string | null | undefined, fallback = HOME_PATH): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
