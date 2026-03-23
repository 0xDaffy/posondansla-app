import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-xl border border-[#e6dbc8] bg-white px-3 text-sm text-[#171412] outline-none ring-offset-background placeholder:text-[#6b625b] focus-visible:ring-2 focus-visible:ring-[#2f6d58]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
