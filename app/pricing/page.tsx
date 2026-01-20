import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PricingContent } from "./pricing-content";

export default async function PricingPage() {
  const session = await auth();

  // Redirect authenticated users to dashboard if they're already on the site
  // But allow unauthenticated users to see pricing
  return <PricingContent />;
}
