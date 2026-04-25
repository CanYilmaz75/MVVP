import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-secondary-foreground",
        primary: "border-primary/10 bg-primary/5 text-primary",
        success: "border-success/10 bg-success/10 text-success",
        warning: "border-warning/20 bg-warning/10 text-foreground",
        destructive: "border-destructive/10 bg-destructive/10 text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
