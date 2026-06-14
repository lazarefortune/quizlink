"use server";

import { stripe } from "@/lib/stripe/stripe-client";
import { auth } from "@/lib/auth";
import { getStripeCustomerIdForUser } from "@/lib/subscription/getStripeCustomerIdForUser";

import {
  getActiveUserSubscriptionAccess,
  type ActiveUserSubscriptionAccess,
} from "@/lib/quiz/getActiveUserSubscriptionAccess";

type CreateProSubscriptionCheckoutResponse =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string; redirectTo?: string };

type CreateStripeBillingPortalSessionResponse =
  | { success: true; portalUrl: string }
  | { success: false; error: string };

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

function isStripeBillingPortalConfigError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("billing portal") ||
    message.includes("portal configuration") ||
    message.includes("no configuration")
  );
}

export async function createProSubscriptionCheckoutAction(): Promise<CreateProSubscriptionCheckoutResponse> {
  const stripeProPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!stripeProPriceId) {
    return { success: false, error: "Pro is not configured" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!session.user.email) {
    return { success: false, error: "Email is required" };
  }

  const activeAccess = await getActiveUserSubscriptionAccess(session.user.id);
  if (activeAccess.isActive) {
    return {
      success: false,
      error: "Already active",
      redirectTo: "/account",
    };
  }

  const baseUrl = getAppBaseUrl();

  // Try to reuse an existing Stripe customer for the same email.
  const existingCustomers = await stripe.customers.list({
    email: session.user.email,
    limit: 1,
  });

  const stripeCustomerId =
    existingCustomers.data[0]?.id ??
    (
      await stripe.customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id, kind: "pro_customer" },
      })
    ).id;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: stripeCustomerId,
    line_items: [{ price: stripeProPriceId, quantity: 1 }],
    metadata: {
      userId: session.user.id,
      kind: "pro_subscription",
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        kind: "pro_subscription",
      },
    },
    success_url: `${baseUrl}/account/pro/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/account/coins?subscription=cancelled`,
  });

  if (!checkoutSession.url) {
    return { success: false, error: "Failed to create checkout session" };
  }

  return { success: true, checkoutUrl: checkoutSession.url };
}

export type ProCheckoutSessionDetails =
  | {
      success: true;
      isValid: true;
      paymentStatus: string | null;
      subscriptionId: string | null;
      customerId: string | null;
    }
  | { success: true; isValid: false; error: string }
  | { success: false; error: string };

export async function getProCheckoutSessionDetails(
  sessionId: string,
): Promise<ProCheckoutSessionDetails> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.mode !== "subscription") {
      return { success: true, isValid: false, error: "Invalid checkout mode" };
    }

    const metadataUserId = checkoutSession.metadata?.userId;
    if (!metadataUserId || metadataUserId !== session.user.id) {
      return { success: true, isValid: false, error: "Unauthorized session" };
    }

    const kind = checkoutSession.metadata?.kind;
    if (kind != null && kind !== "pro_subscription") {
      return { success: true, isValid: false, error: "Invalid subscription kind" };
    }

    const subscriptionId =
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id ?? null;

    const customerId =
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id ?? null;

    return {
      success: true,
      isValid: true,
      paymentStatus: checkoutSession.payment_status ?? null,
      subscriptionId,
      customerId,
    };
  } catch (error) {
    console.error("[getProCheckoutSessionDetails] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load session",
    };
  }
}

export async function getProSubscriptionAccessAction(): Promise<
  | { success: true; access: ActiveUserSubscriptionAccess }
  | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const access = await getActiveUserSubscriptionAccess(session.user.id);
  return { success: true, access };
}

export async function createStripeBillingPortalSessionAction(): Promise<CreateStripeBillingPortalSessionResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const stripeCustomerId = await getStripeCustomerIdForUser(session.user.id);
  if (!stripeCustomerId) {
    return { success: false, error: "No Stripe customer" };
  }

  const baseUrl = getAppBaseUrl();

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/account?billing=return`,
    });

    if (!portalSession.url) {
      return { success: false, error: "Failed to create portal session" };
    }

    return { success: true, portalUrl: portalSession.url };
  } catch (error) {
    if (isStripeBillingPortalConfigError(error)) {
      return { success: false, error: "Portal not configured" };
    }
    return { success: false, error: "Portal session failed" };
  }
}

