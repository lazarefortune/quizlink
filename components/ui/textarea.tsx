import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import {
  fieldControlBaseClassName,
  fieldControlElevatedClassName,
  fieldControlVariantClassNames,
} from "@/components/ui/field-control-variants";
import { cn } from "@/lib/utils";

const textareaVariants = cva([...fieldControlBaseClassName, "resize-y"], {
  variants: {
    variant: fieldControlVariantClassNames,
    textareaSize: {
      default: "min-h-[5rem] rounded-xl px-3.5 py-2.5 text-base",
      sm: "min-h-[2.75rem] rounded-xl px-3.5 py-2 text-base",
    },
  },
  defaultVariants: {
    variant: "surface",
    textareaSize: "default",
  },
});

/** @deprecated Préférer `textareaVariants({ variant: "elevated" })` */
export const textareaFieldClassName = cn(
  fieldControlBaseClassName,
  fieldControlElevatedClassName,
  "min-h-[5rem] rounded-xl px-3.5 py-2.5 text-base resize-y",
);

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  VariantProps<typeof textareaVariants>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, textareaSize, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
