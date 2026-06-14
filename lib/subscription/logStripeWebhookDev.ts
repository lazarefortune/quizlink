export function logStripeWebhookDev(
  message: string,
  data?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info(`[Stripe Webhook] ${message}`, data ?? "");
  }
}
