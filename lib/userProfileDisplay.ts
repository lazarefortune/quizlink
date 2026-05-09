export function getUserInitials(name: string, email: string): string {
  const trimmedName = name.trim();
  if (trimmedName.length > 0) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0];
      const last = parts[parts.length - 1]?.[0];
      if (first && last) {
        return `${first}${last}`.toUpperCase();
      }
    }
    return trimmedName.slice(0, 2).toUpperCase();
  }
  const localPart = email.split("@")[0]?.trim() ?? "";
  if (localPart.length > 0) {
    return localPart.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function getDisplayTitle(name: string, email: string): string {
  const trimmed = name.trim();
  if (trimmed.length > 0) return trimmed;
  const localPart = email.split("@")[0]?.trim();
  if (localPart && localPart.length > 0) return localPart;
  return email || "…";
}
