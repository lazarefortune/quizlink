import { PricingContent } from "./pricing-content";
import { getActiveCoinPacks } from "@/lib/stripe/coin-packs";

export default async function PricingPage() {
  const packs = await getActiveCoinPacks();

  return <PricingContent initialPacks={packs} />;
}
