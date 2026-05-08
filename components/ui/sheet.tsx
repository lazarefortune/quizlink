"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;

const SheetTrigger = DialogPrimitive.Trigger;

const SheetClose = DialogPrimitive.Close;

const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-black/45 backdrop-blur-md dark:bg-black/55",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-300 ease-out motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

type SheetContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  side?: "left" | "right" | "top" | "bottom";
  showCloseButton?: boolean;
  overlayClassName?: string;
  /** Overrides / extends default positioning and hit area for the close control */
  closeButtonClassName?: string;
};

const sheetEnterEase =
  "ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:ease-out";

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      side = "left",
      showCloseButton = true,
      overlayClassName,
      closeButtonClassName,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-[101] gap-4 bg-background p-0 shadow-xl outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "duration-300",
          sheetEnterEase,
          "motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
          side === "left" &&
            cn(
              "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-border",
              "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
            ),
          side === "right" &&
            cn(
              "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border",
              "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            ),
          side === "top" &&
            cn(
              "inset-x-0 top-0 border-b border-border",
              "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
            ),
          side === "bottom" &&
            cn(
              "inset-x-0 bottom-0 border-t border-border",
              "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            ),
          className,
        )}
        {...props}
      >
        {/* relative: absolute close button is scoped to the sheet pane, not the viewport */}
        <div className="relative flex h-full min-h-0 w-full flex-col">
          <SheetTitle className="sr-only">Panel</SheetTitle>
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-4 top-4 z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer",
                closeButtonClassName,
              )}
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          )}
        </div>
      </DialogPrimitive.Content>
    </SheetPortal>
  ),
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
