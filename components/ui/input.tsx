import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: "default" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-lg border-2 border-border bg-card font-sans text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-input focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/50",
          "file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-base",
          inputSize === "default" && "h-12 px-3.5 text-base",
          inputSize === "lg" && "h-12 px-4 text-base",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
