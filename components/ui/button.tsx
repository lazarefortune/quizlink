import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base uppercase font-medium ring-offset-background transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:cursor-pointer",
  {
    variants: {
      variant: {
        /* Duolingo-style: 3D au repos, hover = couleur plus foncée, active = plat + translateY (effet enfoncé) */
        primary:
          "bg-primary text-primary-foreground shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-primary)] hover:bg-primary/90 hover:shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-primary)] active:bg-primary/95 active:shadow-none active:translate-y-[4px]",
        secondary:
        //   "bg-secondary text-secondary-foreground border-2 border-border shadow-[var(--shadow-gaming-depth)] hover:bg-secondary/75 hover:border-border/80 hover:shadow-[var(--shadow-gaming-depth)] active:shadow-none active:translate-y-[4px] dark:border-secondary-foreground/20 dark:hover:bg-secondary/60",
          "bg-secondary text-secondary-foreground border-2 border-b-4 border-border hover:bg-secondary/75 hover:border-border/80 active:bg-secondary/85 active:border-b-2 active:shadow-none active:translate-y-[4px] dark:border-secondary-foreground/20 dark:hover:bg-secondary/60",
        /* Légère ombre haut/gauche/droite + ombre normale en bas, effet enfoncé au clic */
        outline:
          "border-2 border-b-6 border-primary bg-background text-primary shadow-[var(--shadow-outline-subtle),var(--shadow-outline-depth)] hover:bg-primary/10 hover:shadow-[var(--shadow-outline-subtle),var(--shadow-outline-depth)] active:bg-primary/15 active:shadow-none active:translate-y-[4px] active:border-b-2 dark:bg-card dark:hover:bg-primary/15 dark:active:bg-primary/20",
        ghost:
          "bg-transparent hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-destructive)] hover:bg-destructive/85 hover:shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-destructive)] active:bg-destructive/90 active:shadow-none active:translate-y-[4px]",
        blue:
          "bg-blue text-blue-foreground shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-blue)] hover:bg-blue/90 hover:shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-blue)] active:bg-blue/95 active:shadow-none active:translate-y-[4px]",
        outlineBlue:
          "border-2 border-b-6 border-blue bg-background text-blue shadow-[var(--shadow-outline-subtle),var(--shadow-outline-depth)] hover:bg-blue/10 hover:shadow-[var(--shadow-outline-subtle),var(--shadow-outline-depth)] active:bg-blue/15 active:shadow-none active:translate-y-[4px] active:border-b-2 dark:bg-card dark:hover:bg-blue/15 dark:active:bg-blue/20",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-md",
        sm: "h-9 px-4 rounded-md text-sm",
        lg: "h-11 px-6 rounded-md text-base",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
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
