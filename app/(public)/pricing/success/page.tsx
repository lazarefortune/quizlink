import { Suspense } from "react";
import PricingSuccessContent from "./pricing-success-content";

export default function PricingSuccessPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingSuccessContent />
    </Suspense>
  );
}
