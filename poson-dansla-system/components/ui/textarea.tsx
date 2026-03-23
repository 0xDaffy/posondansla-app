import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[90px] w-full rounded-xl border border-[#e6dbc8] bg-white px-3 py-2 text-sm text-[#171412] outline-none placeholder:text-[#6b625b] focus-visible:ring-2 focus-visible:ring-[#2f6d58]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
