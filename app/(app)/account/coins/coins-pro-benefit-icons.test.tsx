/* @vitest-environment jsdom */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { COINS_PAGE_PRO_BENEFIT_KEYS } from "@/lib/subscription/proSubscriptionConstants";

import { ProBenefitIcon } from "./coins-pro-benefit-icons";

describe("ProBenefitIcon", () => {
  it("renders an svg for every pro benefit key", () => {
    for (const benefitKey of COINS_PAGE_PRO_BENEFIT_KEYS) {
      const { container } = render(<ProBenefitIcon benefitKey={benefitKey} />);
      expect(container.querySelector("svg")).toBeTruthy();
    }
  });
});
