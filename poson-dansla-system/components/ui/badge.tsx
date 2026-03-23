import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "pending" | "approved" | "rejected" | "in_progress";

const toneClass: Record<BadgeTone, string> = {
  pending: "bg-[#ffedc8] text-[#8b5a00]",
  approved: "bg-[#d8f5e7] text-[#1b633f]",
  rejected: "bg-[#ffd8d8] text-[#842a2a]",
  in_progress: "bg-[#dbeaff] text-[#234c7f]"
};

export function Badge({ tone = "pending", className, children }: React.PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", toneClass[tone], className)}>{children}</span>;
}
