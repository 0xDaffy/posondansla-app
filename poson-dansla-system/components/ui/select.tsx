import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-[#e6dbc8] bg-white px-3 text-sm text-[#171412] outline-none focus-visible:ring-2 focus-visible:ring-[#2f6d58]",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
