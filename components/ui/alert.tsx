import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Info, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex w-full items-start gap-3 rounded-xl border-2 p-4",
  {
    variants: {
      variant: {
        info:
          "bg-card text-card-foreground border-blue/30 dark:border-blue/40 [&_.alert-icon-wrap]:bg-blue/15 [&_.alert-icon-wrap]:text-blue",
        success:
          "bg-card text-card-foreground border-primary/35 dark:border-primary/50 [&_.alert-icon-wrap]:bg-primary/15 [&_.alert-icon-wrap]:text-primary",
        error:
          "bg-card text-card-foreground border-destructive/35 dark:border-destructive/50 [&_.alert-icon-wrap]:bg-destructive/15 [&_.alert-icon-wrap]:text-destructive",
        warning:
          "bg-card text-card-foreground border-warning/40 dark:border-warning/50 [&_.alert-icon-wrap]:bg-warning/15 [&_.alert-icon-wrap]:text-warning",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, children, ...props }, ref) => {
    const IconComponent =
      variant === "success"
        ? CheckCircle2
        : variant === "error"
          ? XCircle
          : variant === "warning"
            ? AlertTriangle
            : Info;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start flex-col sm:flex-row justify-start sm:justify-start gap-3">
          <span className="alert-icon-wrap inline-flex size-8 shrink-0 items-center justify-center rounded-lg">
            <IconComponent className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            {title && (
              <h5 className="mb-1 font-semibold leading-none tracking-tight">
                {title}
              </h5>
            )}
            <div className="text-sm [&_p]:leading-relaxed">{children}</div>
          </div>
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
