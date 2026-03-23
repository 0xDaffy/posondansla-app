import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-[#e6dbc8] bg-[#fffaf3] p-4 shadow-[0_12px_30px_rgba(58,42,18,0.09)]", className)}
      {...props}
    />
  );
}
