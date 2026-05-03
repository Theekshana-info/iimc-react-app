import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl bg-background px-4 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground outline-none focus:outline focus:outline-2 focus:outline-[#268ad1] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm neu-inset transition-all focus:shadow-[inset_4px_4px_8px_hsl(var(--shadow-color-dark)),inset_-4px_-4px_8px_hsl(var(--shadow-color-light))]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
