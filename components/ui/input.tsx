import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import {
  fieldControlBaseClassName,
  fieldControlVariantClassNames,
} from "@/components/ui/field-control-variants";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  [
    ...fieldControlBaseClassName,
    "flex",
    "file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-base",
  ],
  {
    variants: {
      variant: fieldControlVariantClassNames,
      inputSize: {
        default: "h-12 rounded-xl px-3.5 text-base",
        lg: "h-12 rounded-xl px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "surface",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
