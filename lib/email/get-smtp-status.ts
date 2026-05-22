export type SmtpStatus = {
  mode: "development" | "production";
  host: string;
  port: string;
  from: string;
  mailpitUrl: string | null;
};

export function getSmtpStatus(): SmtpStatus {
  const isDevelopment = process.env.NODE_ENV === "development" || !process.env.SMTP_HOST;

  return {
    mode: isDevelopment ? "development" : "production",
    host: process.env.SMTP_HOST || "localhost",
    port: process.env.SMTP_PORT || "1025",
    from: process.env.SMTP_FROM || "noreply@quizlink.fr",
    mailpitUrl: isDevelopment ? "http://localhost:8025" : null,
  };
}

export function isAdminTestEmailAllowedInEnvironment(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return process.env.ALLOW_ADMIN_EMAIL_TEST !== "false";
}

export function canOverrideAdminTestEmailRecipient(): boolean {
  return process.env.NODE_ENV !== "production";
}
