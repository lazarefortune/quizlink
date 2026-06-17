import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import {
  getStripeInvoiceBillingPeriod,
  getStripeSubscriptionBillingPeriod,
  stripeUnixToDate,
} from "./stripeSubscriptionHelpers";

describe("stripeSubscriptionHelpers", () => {
  it("converts Stripe unix seconds to Date", () => {
    const date = stripeUnixToDate(1_700_000_000);
    expect(date).toEqual(new Date(1_700_000_000_000));
  });

  it("reads billing period from subscription items (Stripe API v20)", () => {
    const subscription = {
      items: {
        data: [
          {
            current_period_start: 1_700_000_000,
            current_period_end: 1_702_592_000,
          },
        ],
      },
    } as Stripe.Subscription;

    const period = getStripeSubscriptionBillingPeriod(subscription);
    expect(period.currentPeriodStart).toEqual(new Date(1_700_000_000_000));
    expect(period.currentPeriodEnd).toEqual(new Date(1_702_592_000_000));
  });

  it("falls back to legacy subscription-level period fields", () => {
    const subscription = {
      items: { data: [] },
      current_period_start: 1_600_000_000,
      current_period_end: 1_602_592_000,
    } as unknown as Stripe.Subscription;

    const period = getStripeSubscriptionBillingPeriod(subscription);
    expect(period.currentPeriodStart).toEqual(new Date(1_600_000_000_000));
    expect(period.currentPeriodEnd).toEqual(new Date(1_602_592_000_000));
  });

  it("reads invoice billing period from unix timestamps", () => {
    const invoice = {
      period_start: 1_700_000_000,
      period_end: 1_702_592_000,
    } as Stripe.Invoice;

    const period = getStripeInvoiceBillingPeriod(invoice);
    expect(period.currentPeriodStart).toEqual(new Date(1_700_000_000_000));
    expect(period.currentPeriodEnd).toEqual(new Date(1_702_592_000_000));
  });
});
