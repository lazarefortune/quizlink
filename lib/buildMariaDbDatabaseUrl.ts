const ALLOW_PUBLIC_KEY_RETRIEVAL_PARAM = "allowPublicKeyRetrieval=true";

export function buildMariaDbDatabaseUrl(databaseUrl: string): string {
  if (databaseUrl.includes("allowPublicKeyRetrieval=")) {
    return databaseUrl;
  }

  const separator = databaseUrl.includes("?") ? "&" : "?";
  return `${databaseUrl}${separator}${ALLOW_PUBLIC_KEY_RETRIEVAL_PARAM}`;
}
