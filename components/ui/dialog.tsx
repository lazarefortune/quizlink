"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn("quizlink-dialog-overlay fixed inset-0 z-[101] bg-black/60", className)}
      {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    onOverlayClick?: React.MouseEventHandler<HTMLDivElement>;
    /** No X button (e.g. GDPR consent that must be resolved via actions). */
    hideCloseButton?: boolean;
    /** Higher z-index, blocks Escape and outside dismiss (must use buttons to leave). */
    blocking?: boolean;
  }
>(
  (
    {
      className,
      children,
      onOverlayClick,
      hideCloseButton,
      blocking,
      onEscapeKeyDown,
      onPointerDownOutside,
      onInteractOutside,
      ...props
    },
    ref,
  ) => (
    <DialogPortal>
      <DialogOverlay
        onClick={(event) => {
          if (blocking) {
            event.preventDefault();
          }
          onOverlayClick?.(event);
        }}
        className={cn(blocking ? "z-[199]" : undefined)}
      />
      <div
        className={cn(
          "fixed inset-0 flex min-w-0 items-center justify-center overflow-x-hidden overflow-y-auto p-4 sm:p-6",
          blocking ? "z-[200]" : "z-[102]",
        )}
      >
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "quizlink-dialog-content relative grid w-full min-w-0 max-w-full gap-4 border border-border bg-background p-4 shadow-lg sm:max-w-5xl rounded-md sm:rounded-lg sm:p-6",
            "max-h-[90vh] overflow-y-auto overflow-x-hidden",
            "opacity-0",
            className,
          )}
          onEscapeKeyDown={(event) => {
            if (blocking) {
              event.preventDefault();
            }
            onEscapeKeyDown?.(event);
          }}
          onPointerDownOutside={(event) => {
            if (blocking) {
              event.preventDefault();
            }
            onPointerDownOutside?.(event);
          }}
          onInteractOutside={(event) => {
            if (blocking) {
              event.preventDefault();
            }
            onInteractOutside?.(event);
          }}
          {...props}
        >
          {children}
          {!hideCloseButton ? (
            <DialogPrimitive.Close className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer sm:right-4 sm:top-4">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, id: _unusedTitleId, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg md:text-xl uppercase font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, id: _unusedDescriptionId, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
