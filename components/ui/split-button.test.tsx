/* @vitest-environment jsdom */

import type { ComponentPropsWithoutRef } from "react";

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SplitButton,
  SplitButtonAction,
  SplitButtonMenu,
} from "@/components/ui/split-button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

vi.mock("@/components/ui/dropdown-menu", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/components/ui/dropdown-menu")>();
  const { DropdownMenu: DropdownMenuRoot } = mod;
  return {
    ...mod,
    DropdownMenu: (props: ComponentPropsWithoutRef<typeof DropdownMenuRoot>) => (
      <DropdownMenuRoot defaultOpen {...props} />
    ),
  };
});

/** Radix marks the trigger tree aria-hidden while the menu is open (defaultOpen mock). */
const hidden = { hidden: true } as const;

describe("SplitButton", () => {
  describe("declarative API", () => {
    it("calls onClick when the primary action is clicked", () => {
      const onClick = vi.fn();

      render(
        <SplitButton
          label="Export"
          onClick={onClick}
          options={[{ label: "PDF", onClick: vi.fn() }]}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Export", ...hidden }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("calls the option onClick when a menu item is clicked", () => {
      const onPdf = vi.fn();

      render(
        <SplitButton
          label="Export"
          onClick={vi.fn()}
          options={[{ label: "Export PDF", onClick: onPdf }]}
        />,
      );

      fireEvent.click(screen.getByRole("menuitem", { name: "Export PDF" }));
      expect(onPdf).toHaveBeenCalledTimes(1);
    });

    it("renders separators and marks disabled / destructive options", () => {
      render(
        <SplitButton
          label="Actions"
          onClick={vi.fn()}
          options={[
            { label: "Keep", onClick: vi.fn() },
            { type: "separator" },
            { label: "Disabled", onClick: vi.fn(), disabled: true },
            { label: "Delete", onClick: vi.fn(), destructive: true },
          ]}
        />,
      );

      expect(screen.getByRole("separator")).toBeInTheDocument();

      const disabledItem = screen.getByRole("menuitem", { name: "Disabled" });
      expect(disabledItem).toHaveAttribute("data-disabled");

      const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
      expect(deleteItem.className).toContain("text-destructive");
    });

    it("disables both segments when disabled", () => {
      render(
        <SplitButton
          label="Export"
          onClick={vi.fn()}
          disabled
          options={[{ label: "PDF", onClick: vi.fn() }]}
        />,
      );

      const buttons = screen.getAllByRole("button", hidden);
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).toBeDisabled();
    });

    it("disables both segments and shows busy state when isLoading", () => {
      render(
        <SplitButton
          label="Export"
          onClick={vi.fn()}
          isLoading
          options={[{ label: "PDF", onClick: vi.fn() }]}
        />,
      );

      const primary = screen.getByRole("button", { name: /Export/i, ...hidden });
      const menuTrigger = screen.getByRole("button", {
        name: "More options",
        ...hidden,
      });

      expect(primary).toBeDisabled();
      expect(primary).toHaveAttribute("aria-busy", "true");
      expect(menuTrigger).toBeDisabled();
    });

    it("applies shared base plate and per-segment bounce classes", () => {
      const { container } = render(
        <SplitButton
          label="Export"
          onClick={vi.fn()}
          variant="outline"
          size="lg"
          options={[{ label: "PDF", onClick: vi.fn() }]}
        />,
      );

      const shell = container.firstElementChild;
      expect(shell?.className).toContain("min-h-13");
      expect(shell?.className).toContain("rounded-2xl");
      expect(shell?.className).toContain("pb-[3px]");
      expect(shell?.className).not.toContain("has-[button:active]");
      expect(shell?.className).not.toContain("btn-bouncy");

      expect(
        container.querySelector('[data-slot="split-button-base"]'),
      ).toBeInTheDocument();

      const action = container.querySelector('[data-slot="split-button-action"]');
      const menu = container.querySelector('[data-slot="split-button-menu"]');
      expect(action?.className).toContain("active:translate-y-[3px]");
      expect(menu?.className).not.toContain("active:translate-y-[3px]");
      expect(menu?.className).toContain("active:translate-y-0");
    });

    it("uses matching filled press travel on primary action only", () => {
      const { container } = render(
        <SplitButton
          label="Export"
          onClick={vi.fn()}
          variant="primary"
          options={[{ label: "PDF", onClick: vi.fn() }]}
        />,
      );

      const action = container.querySelector('[data-slot="split-button-action"]');
      const menu = container.querySelector('[data-slot="split-button-menu"]');
      expect(action?.className).toContain("active:translate-y-1");
      expect(menu?.className).not.toContain("active:translate-y-1");
      expect(menu?.className).toContain("active:translate-y-0");
    });

    it("renders a visible divider between action and menu", () => {
      const { container } = render(
        <SplitButton
          label="Export"
          onClick={vi.fn()}
          options={[{ label: "PDF", onClick: vi.fn() }]}
        />,
      );

      expect(
        container.querySelector('[data-slot="split-button-divider"]'),
      ).toBeInTheDocument();
    });
  });

  describe("composition API", () => {
    it("renders custom menu children", () => {
      const onCustom = vi.fn();

      render(
        <SplitButton variant="secondary">
          <SplitButtonAction onClick={vi.fn()}>Save</SplitButtonAction>
          <SplitButtonMenu aria-label="Save options">
            <DropdownMenuItem onClick={onCustom}>Custom option</DropdownMenuItem>
          </SplitButtonMenu>
        </SplitButton>,
      );

      expect(
        screen.getByRole("button", { name: "Save options", ...hidden }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("menuitem", { name: "Custom option" }));
      expect(onCustom).toHaveBeenCalledTimes(1);
    });

    it("blocks interaction when root isLoading", () => {
      const onSave = vi.fn();

      render(
        <SplitButton isLoading>
          <SplitButtonAction onClick={onSave}>Save</SplitButtonAction>
          <SplitButtonMenu aria-label="Save options">
            <DropdownMenuItem>Option</DropdownMenuItem>
          </SplitButtonMenu>
        </SplitButton>,
      );

      const primary = screen.getByRole("button", { name: "Save", ...hidden });
      fireEvent.click(primary);
      expect(onSave).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Save options", ...hidden }),
      ).toBeDisabled();
    });
  });
});