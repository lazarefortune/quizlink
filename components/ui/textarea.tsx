import * as React from "react";

import { cn } from "@/lib/utils";

/** Shared field styles — design system Textarea (see /design-system). */
export const textareaFieldClassName =
  "flex min-h-[5rem] w-full rounded-lg border-2 border-border bg-card px-3.5 py-2.5 font-sans text-base text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-input focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaFieldClassName, "resize-y", className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
