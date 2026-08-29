import { describe, it, expect, afterEach } from "vitest";

import {
  canOverrideAdminTestEmailRecipient,
  getSmtpStatus,
  isAdminTestEmailAllowedInEnvironment,
} from "./get-smtp-status";

const originalEnv = { ...process.env };

describe("get-smtp-status", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function setNodeEnv(value: string) {
    // TS marks `process.env` as readonly in Node types.
    (process.env as unknown as Record<string, string | undefined>).NODE_ENV =
      value;
  }

  it("returns development defaults when SMTP_HOST is unset", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_PORT;
    setNodeEnv("production");

    expect(getSmtpStatus()).toEqual({
      mode: "development",
      host: "localhost",
      port: "1025",
      from: "contact@quizlink.fr",
      mailpitUrl: "http://localhost:8025",
    });
  });

  it("returns production mode when SMTP_HOST is set in production", () => {
    setNodeEnv("production");
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_FROM = "noreply@custom.test";

    expect(getSmtpStatus()).toEqual({
      mode: "production",
      host: "smtp.example.com",
      port: "465",
      from: "noreply@custom.test",
      mailpitUrl: null,
    });
  });

  it("allows admin tests unless explicitly disabled in production", () => {
    setNodeEnv("production");
    delete process.env.ALLOW_ADMIN_EMAIL_TEST;

    expect(isAdminTestEmailAllowedInEnvironment()).toBe(true);

    process.env.ALLOW_ADMIN_EMAIL_TEST = "false";
    expect(isAdminTestEmailAllowedInEnvironment()).toBe(false);
  });

  it("disallows recipient override in production", () => {
    setNodeEnv("production");
    expect(canOverrideAdminTestEmailRecipient()).toBe(false);

    setNodeEnv("development");
    expect(canOverrideAdminTestEmailRecipient()).toBe(true);
  });
});
