/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAvatar } from "@dicebear/core";
import { bigEars } from "@dicebear/collection";

import { AvatarSvgDisplay } from "./avatar-svg-display";

describe("AvatarSvgDisplay", () => {
  it("renders an img that fills the container", () => {
    const svg = createAvatar(bigEars, { seed: "test" }).toString();

    const { container } = render(
      <div className="h-20 w-20">
        <AvatarSvgDisplay svg={svg} className="h-full w-full" />
      </div>,
    );

    const image = container.querySelector("img");
    expect(image).toBeInTheDocument();
    expect(image).toHaveClass("object-contain");
    expect(image?.getAttribute("src")).toContain("data:image/svg+xml");
    expect(image?.getAttribute("src")).toContain("preserveAspectRatio");
  });
});
