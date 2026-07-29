import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold uppercase tracking-wide ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground btn-bouncy-primary",
        primary: "bg-primary text-primary-foreground btn-bouncy-primary",
        destructive: "bg-destructive text-destructive-foreground btn-bouncy-destructive",
        outline:
          "border-2 border-[hsl(var(--outline-button-border))] bg-card text-foreground btn-bouncy-outline hover:bg-zinc-100 dark:hover:bg-zinc-900",
        outlineBlue:
          "border-2 border-blue bg-card text-blue btn-bouncy-outline-blue hover:bg-blue/10 dark:hover:bg-blue/15",
        outlineSimple: "border-2 border-[hsl(var(--outline-button-border))] bg-card text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900",
        secondary: "bg-secondary text-secondary-foreground btn-bouncy",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline h-auto min-h-0 px-0 py-0 rounded-none bg-transparent shadow-none font-black uppercase",
        blue: "bg-blue text-blue-foreground btn-bouncy-blue",
        hero: "bg-primary text-primary-foreground btn-bouncy-primary text-base normal-case",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-13 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
    compoundVariants: [
      {
        variant: "link",
        class:
          "!h-auto !min-h-0 !p-0 !rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
      },
    ],
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const content = asChild ? (
      children
    ) : (
      <>
        {isLoading && <Loader2 className="animate-spin" />}
        {children}
      </>
    );
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
