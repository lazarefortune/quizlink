"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  "peer inline-flex shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground hover:border-primary/60",
        blue:
          "border-border data-[state=checked]:bg-blue data-[state=checked]:border-blue data-[state=checked]:text-blue-foreground hover:border-blue/60",
        destructive:
          "border-border data-[state=checked]:bg-destructive data-[state=checked]:border-destructive data-[state=checked]:text-destructive-foreground hover:border-destructive/60",
        warning:
          "border-border data-[state=checked]:bg-warning data-[state=checked]:border-warning data-[state=checked]:text-warning-foreground hover:border-warning/60",
        highlight:
          "border-border data-[state=checked]:bg-highlight data-[state=checked]:border-highlight data-[state=checked]:text-highlight-foreground hover:border-highlight/60",
        secondary:
          "border-border data-[state=checked]:bg-secondary data-[state=checked]:border-secondary-foreground/40 data-[state=checked]:text-secondary-foreground hover:border-secondary-foreground/30",
      },
      size: {
        sm: "h-4 w-4 rounded",
        default: "h-5 w-5 rounded-md",
        lg: "h-6 w-6 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const checkIconSize = {
  sm: "h-3 w-3",
  default: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

type CheckboxProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> &
  VariantProps<typeof checkboxVariants> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  };

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, variant, size = "default", checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(checkboxVariants({ variant, size }), className)}
        onClick={(e) => {
          onClick?.(e);
          onCheckedChange?.(!checked);
        }}
        {...props}
      >
        <Check
          className={cn(
            checkIconSize[size ?? "default"],
            "stroke-3 transition-all duration-150",
            checked ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants };
