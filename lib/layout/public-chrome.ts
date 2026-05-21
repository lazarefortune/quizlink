/** Route prefixes where the public marketing header is hidden (app shells provide their own chrome). */
export const PUBLIC_HEADER_HIDE_PREFIXES = [
  "/dashboard",
  "/auth",
  "/account",
  "/generate",
  "/builder",
  "/admin",
  "/p/",
  "/quiz/",
] as const;

export function shouldHidePublicHeader(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }

  return PUBLIC_HEADER_HIDE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Inner bar height — keep in sync with `PublicHeader` and `--public-header-height` in globals.css */
export const PUBLIC_HEADER_INNER_HEIGHT_CLASS = "h-20";

/** Public pages inside the root main column (below optional header). */
export const PUBLIC_MAIN_MIN_HEIGHT_CLASS = "min-h-0 flex-1";

/** Auth routes: no public header/footer — fill the viewport. */
export const AUTH_LAYOUT_MIN_HEIGHT_CLASS = "flex min-h-dvh min-w-0 w-full flex-1 flex-col";

/** Auth form split view (form + side panel). */
export const AUTH_FORM_PAGE_MIN_HEIGHT_CLASS = "flex min-h-full w-full min-w-0 flex-1 flex-col lg:min-h-0 lg:flex-row";
