import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-base ease-carevo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 ring-offset-background [&_svg]:h-5 [&_svg]:w-5 [&_svg]:stroke-[1.5]",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground shadow-none hover:bg-accent/90 active:bg-accent",
        secondary: "border border-border bg-card text-foreground hover:bg-secondary active:bg-secondary",
        outline: "border border-border bg-card text-foreground hover:bg-secondary active:bg-secondary",
        ghost: "text-secondary-foreground hover:bg-secondary hover:text-foreground active:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-10 px-3",
        lg: "h-12 px-6",
        icon: "h-11 w-11 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
