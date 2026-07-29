"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Shared 3D base + per-segment press:
 * - Base plate = continuous raised ledge (matches btn-bouncy shadow color).
 * - Each face translates down onto that ledge independently so halves stay visually matched.
 */
const splitButtonShellVariants = cva(
  [
    "relative isolate inline-flex",
    "text-sm font-semibold uppercase tracking-wide",
    "has-[button:disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "rounded-xl pb-1",
        secondary: "rounded-xl pb-1",
        outline: "rounded-xl pb-[3px]",
        outlineBlue: "rounded-xl pb-[3px]",
        outlineSimple: "rounded-xl",
        destructive: "rounded-xl pb-1",
        blue: "rounded-xl pb-1",
      },
      size: {
        default: "min-h-11 rounded-xl",
        sm: "min-h-9 rounded-xl",
        lg: "min-h-13 rounded-2xl text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

const basePlateByVariant: Record<SplitButtonVariant, string | null> = {
  primary: "bg-[hsl(var(--primary-shadow))]",
  secondary: "bg-[hsl(0_0%_82%)] dark:bg-[hsl(220_15%_6%)]",
  outline: "bg-[hsl(var(--outline-button-border))]",
  outlineBlue: "bg-blue",
  outlineSimple: null,
  destructive: "bg-[hsl(var(--destructive-shadow))]",
  blue: "bg-[hsl(var(--blue-shadow))]",
};

const faceToneByVariant: Record<SplitButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110",
  secondary: "bg-secondary text-secondary-foreground hover:brightness-105",
  outline:
    "border-2 border-[hsl(var(--outline-button-border))] bg-card text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900",
  outlineBlue:
    "border-2 border-blue bg-card text-blue hover:bg-blue/10 dark:hover:bg-blue/15",
  outlineSimple:
    "border-2 border-[hsl(var(--outline-button-border))] bg-card text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900",
  destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
  blue: "bg-blue text-blue-foreground hover:brightness-110",
};

const actionSeamByVariant: Record<SplitButtonVariant, string> = {
  primary: "",
  secondary: "",
  outline: "border-r-0",
  outlineBlue: "border-r-0",
  outlineSimple: "border-r-0",
  destructive: "",
  blue: "",
};

const menuSeamByVariant: Record<SplitButtonVariant, string> = {
  primary: "",
  secondary: "",
  outline: "border-l-0",
  outlineBlue: "border-l-0",
  outlineSimple: "border-l-0",
  destructive: "",
  blue: "",
};

/** Same travel as `.btn-bouncy*` / outline active — per face, not the shell. */
const facePressByVariant: Record<SplitButtonVariant, string> = {
  primary: "active:translate-y-1",
  secondary: "active:translate-y-1",
  outline: "active:translate-y-[3px]",
  outlineBlue: "active:translate-y-[3px]",
  outlineSimple: "active:bg-zinc-200 dark:active:bg-zinc-800",
  destructive: "active:translate-y-1",
  blue: "active:translate-y-1",
};

const dividerByVariant: Record<SplitButtonVariant, string> = {
  primary: "bg-primary-foreground/20",
  secondary: "bg-foreground/10",
  outline: "bg-[hsl(var(--outline-button-border))]",
  outlineBlue: "bg-blue/60",
  outlineSimple: "bg-[hsl(var(--outline-button-border))]",
  destructive: "bg-destructive/70",
  blue: "bg-blue-foreground/20",
};

const actionRoundingBySize: Record<SplitButtonSize, string> = {
  default: "rounded-l-xl rounded-r-none",
  sm: "rounded-l-xl rounded-r-none",
  lg: "rounded-l-2xl rounded-r-none",
};

const menuRoundingBySize: Record<SplitButtonSize, string> = {
  default: "rounded-r-xl rounded-l-none",
  sm: "rounded-r-xl rounded-l-none",
  lg: "rounded-r-2xl rounded-l-none",
};

const actionPaddingBySize: Record<SplitButtonSize, string> = {
  default: "px-5 py-2",
  sm: "px-4 py-1.5",
  lg: "px-8 py-2.5",
};

const menuWidthBySize: Record<SplitButtonSize, string> = {
  default: "w-11 min-w-11",
  sm: "w-9 min-w-9",
  lg: "w-13 min-w-13",
};

const baseRoundingBySize: Record<SplitButtonSize, string> = {
  default: "rounded-xl",
  sm: "rounded-xl",
  lg: "rounded-2xl",
};

export type SplitButtonVariant = NonNullable<
  VariantProps<typeof splitButtonShellVariants>["variant"]
>;
export type SplitButtonSize = NonNullable<
  VariantProps<typeof splitButtonShellVariants>["size"]
>;

type SplitButtonContextValue = {
  variant: SplitButtonVariant;
  size: SplitButtonSize;
  disabled: boolean;
  isLoading: boolean;
  menuAlign: "start" | "center" | "end";
  menuAriaLabel: string;
};

const SplitButtonContext = React.createContext<SplitButtonContextValue | null>(null);

function useSplitButtonContext(): SplitButtonContextValue {
  const context = React.useContext(SplitButtonContext);
  if (!context) {
    throw new Error("SplitButton compound parts must be used within SplitButton");
  }
  return context;
}

export type SplitButtonActionOption = {
  label: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export type SplitButtonSeparatorOption = {
  type: "separator";
};

export type SplitButtonOption = SplitButtonActionOption | SplitButtonSeparatorOption;

type SplitButtonSharedProps = {
  variant?: SplitButtonVariant;
  size?: SplitButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  menuAriaLabel?: string;
};

type SplitButtonDeclarativeProps = SplitButtonSharedProps & {
  label: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  options: SplitButtonOption[];
  children?: never;
};

type SplitButtonCompositionProps = SplitButtonSharedProps & {
  children: React.ReactNode;
  label?: never;
  onClick?: never;
  options?: never;
};

export type SplitButtonProps = SplitButtonDeclarativeProps | SplitButtonCompositionProps;

function isSeparatorOption(option: SplitButtonOption): option is SplitButtonSeparatorOption {
  return "type" in option && option.type === "separator";
}

const segmentFocus =
  "relative select-none border-0 shadow-none outline-none transition-[transform,background-color,filter,opacity] duration-100 ease-out focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0";

function SplitButtonRoot({
  variant = "primary",
  size = "default",
  disabled = false,
  isLoading = false,
  className,
  align = "end",
  menuAriaLabel = "More options",
  children,
}: {
  variant?: SplitButtonVariant;
  size?: SplitButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  menuAriaLabel?: string;
  children: React.ReactNode;
}) {
  const basePlateClass = basePlateByVariant[variant];

  return (
    <SplitButtonContext.Provider
      value={{
        variant,
        size,
        disabled,
        isLoading,
        menuAlign: align,
        menuAriaLabel,
      }}
    >
      <div
        className={cn(splitButtonShellVariants({ variant, size }), className)}
        data-disabled={disabled || isLoading || undefined}
      >
        {basePlateClass ? (
          <span
            aria-hidden
            data-slot="split-button-base"
            className={cn("absolute inset-0", baseRoundingBySize[size], basePlateClass)}
          />
        ) : null}
        <div className="relative z-10 inline-flex min-h-inherit w-full items-stretch">
          {children}
        </div>
      </div>
    </SplitButtonContext.Provider>
  );
}

function SplitButtonDivider() {
  const { variant } = useSplitButtonContext();
  return (
    <span
      aria-hidden
      data-slot="split-button-divider"
      className={cn("relative z-20 w-0.5 shrink-0 self-stretch", dividerByVariant[variant])}
    />
  );
}

export type SplitButtonActionProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
};

const SplitButtonAction = React.forwardRef<HTMLButtonElement, SplitButtonActionProps>(
  ({ className, children, disabled, isLoading: actionLoading, ...props }, ref) => {
    const { variant, size, disabled: rootDisabled, isLoading: rootLoading } =
      useSplitButtonContext();
    const isBusy = Boolean(actionLoading || rootLoading);
    const isDisabled = Boolean(disabled || rootDisabled || isBusy);

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={isBusy || undefined}
        data-slot="split-button-action"
        className={cn(
          "inline-flex min-w-0 flex-1 items-center justify-center gap-2",
          segmentFocus,
          faceToneByVariant[variant],
          facePressByVariant[variant],
          actionSeamByVariant[variant],
          actionRoundingBySize[size],
          actionPaddingBySize[size],
          className,
        )}
        {...props}
      >
        {isBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);
SplitButtonAction.displayName = "SplitButtonAction";

export type SplitButtonMenuProps = {
  children: React.ReactNode;
  "aria-label"?: string;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
};

function SplitButtonMenu({
  children,
  "aria-label": ariaLabel,
  align,
  className,
  contentClassName,
}: SplitButtonMenuProps) {
  const {
    variant,
    size,
    disabled: rootDisabled,
    isLoading: rootLoading,
    menuAlign,
    menuAriaLabel,
  } = useSplitButtonContext();
  const isDisabled = rootDisabled || rootLoading;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          aria-label={ariaLabel ?? menuAriaLabel}
          data-slot="split-button-menu"
          className={cn(
            "inline-flex shrink-0 items-center justify-center",
            segmentFocus,
            faceToneByVariant[variant],
            menuSeamByVariant[variant],
            menuRoundingBySize[size],
            menuWidthBySize[size],
            // Menu opens on click — no press bounce (action segment only).
            "active:translate-y-0",
            className,
          )}
        >
          <ChevronDown aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align ?? menuAlign}
        sideOffset={6}
        className={contentClassName}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
SplitButtonMenu.displayName = "SplitButtonMenu";

function splitCompositionChildren(children: React.ReactNode): React.ReactNode {
  const childList = React.Children.toArray(children);
  const nodes: React.ReactNode[] = [];

  childList.forEach((child, index) => {
    if (index > 0) {
      nodes.push(<SplitButtonDivider key={`split-divider-${index}`} />);
    }
    nodes.push(child);
  });

  return nodes;
}

function SplitButtonDeclarative({
  label,
  onClick,
  options,
  ...shared
}: SplitButtonDeclarativeProps) {
  return (
    <SplitButtonRoot {...shared}>
      <SplitButtonAction onClick={onClick}>{label}</SplitButtonAction>
      <SplitButtonDivider />
      <SplitButtonMenu>
        {options.map((option, index) => {
          if (isSeparatorOption(option)) {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }

          return (
            <DropdownMenuItem
              key={`option-${index}`}
              disabled={option.disabled}
              onClick={option.onClick}
              className={option.destructive ? "text-destructive focus:text-destructive" : undefined}
            >
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </SplitButtonMenu>
    </SplitButtonRoot>
  );
}

function SplitButton(props: SplitButtonProps) {
  if ("options" in props && props.options !== undefined) {
    return <SplitButtonDeclarative {...props} />;
  }

  const { children, ...shared } = props;
  return (
    <SplitButtonRoot {...shared}>{splitCompositionChildren(children)}</SplitButtonRoot>
  );
}

export {
  SplitButton,
  SplitButtonAction,
  SplitButtonMenu,
  splitButtonShellVariants,
};
