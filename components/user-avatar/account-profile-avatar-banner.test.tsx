/* @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createAvatar } from "@dicebear/core";
import { bigEars } from "@dicebear/collection";
import { describe, expect, it, vi } from "vitest";

import { AccountProfileAvatarBanner } from "./account-profile-avatar-banner";

describe("AccountProfileAvatarBanner", () => {
  it("calls onEdit when the banner is clicked", () => {
    const onEdit = vi.fn();
    const svg = createAvatar(bigEars, { seed: "test" }).toString();

    render(
      <AccountProfileAvatarBanner
        avatar={svg}
        backgroundColor="c8bfe8"
        name="Jonh Doe"
        email="test@example.com"
        editLabel="Modifier l'avatar"
        onEdit={onEdit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Modifier l'avatar" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("renders initials when avatar is missing", () => {
    render(
      <AccountProfileAvatarBanner
        avatar={null}
        backgroundColor="c8bfe8"
        name="Jonh Doe"
        email="test@example.com"
        editLabel="Edit avatar"
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});
