"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const radioVariants = cva(
  "peer inline-flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-border data-[state=checked]:border-primary hover:border-primary/60",
        blue:
          "border-border data-[state=checked]:border-blue hover:border-blue/60",
        destructive:
          "border-border data-[state=checked]:border-destructive hover:border-destructive/60",
        warning:
          "border-border data-[state=checked]:border-warning hover:border-warning/60",
        highlight:
          "border-border data-[state=checked]:border-highlight hover:border-highlight/60",
        secondary:
          "border-border data-[state=checked]:border-secondary-foreground/40 hover:border-secondary-foreground/30",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const dotSize = {
  sm: "h-2 w-2",
  default: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

const dotColor: Record<string, string> = {
  primary: "bg-primary",
  blue: "bg-blue",
  destructive: "bg-destructive",
  warning: "bg-warning",
  highlight: "bg-highlight",
  secondary: "bg-secondary-foreground/60",
};

type RadioProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> &
  VariantProps<typeof radioVariants> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  };

const Radio = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ className, variant = "primary", size = "default", checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(radioVariants({ variant, size }), className)}
        onClick={(e) => {
          onClick?.(e);
          onCheckedChange?.(!checked);
        }}
        {...props}
      >
        <span
          className={cn(
            "rounded-full transition-all duration-150",
            dotSize[size ?? "default"],
            dotColor[variant ?? "primary"],
            checked ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
      </button>
    );
  }
);
Radio.displayName = "Radio";

export { Radio, radioVariants };
