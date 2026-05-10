/**
 * Returns true when navigation from the builder should show an unsaved-changes confirmation.
 * Only applies when the user is on a /builder route, has unsaved edits, and the target is outside /builder.
 */
export function shouldInterceptNavigation(
  pathname: string,
  href: string,
  isDirty: boolean,
): boolean {
  if (!isDirty) {
    return false;
  }

  if (!pathname.startsWith("/builder")) {
    return false;
  }

  const trimmedHref = href.trim();
  if (trimmedHref === "" || trimmedHref.startsWith("#")) {
    return false;
  }

  let targetPath: string;
  try {
    if (trimmedHref.startsWith("http://") || trimmedHref.startsWith("https://")) {
      const url = new URL(trimmedHref);
      targetPath = url.pathname;
    } else {
      targetPath = new URL(trimmedHref, "https://example.com").pathname;
    }
  } catch {
    return false;
  }

  if (targetPath.startsWith("/builder")) {
    return false;
  }

  return true;
}
