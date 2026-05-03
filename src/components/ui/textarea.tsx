import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl bg-background px-4 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground outline-none focus:outline focus:outline-2 focus:outline-[#268ad1] disabled:cursor-not-allowed disabled:opacity-50 transition-all neu-inset border border-transparent focus:shadow-[inset_4px_4px_8px_hsl(var(--shadow-color-dark)),inset_-4px_-4px_8px_hsl(var(--shadow-color-light))]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
