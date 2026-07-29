export function extractQuizNameFromBuilderSnapshot(snapshot: string | null): string | null {
  if (snapshot === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(snapshot) as { name?: unknown };
    return typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    return null;
  }
}
