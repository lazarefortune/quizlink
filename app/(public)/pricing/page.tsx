import { redirect } from "next/navigation";

/**
 * Pricing page removed: shop is now at /account/coins (authenticated only).
 * Redirect so old links and bookmarks still work.
 */
export default function PricingRedirectPage() {
  redirect("/account/coins");
}
