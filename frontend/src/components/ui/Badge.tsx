"use client";

import React from "react";

export type BadgeTone = "emerald" | "amber" | "rose" | "slate" | "sky";

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<
  BadgeTone,
  { pill: string; dot: string }
> = {
  emerald: {
    pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-600",
  },
  amber: {
    pill: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  rose: {
    pill: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-600",
  },
  slate: {
    pill: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  sky: {
    pill: "bg-sky-50 text-sky-800 border-sky-200",
    dot: "bg-sky-600",
  },
};

export function Badge({
  tone = "slate",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  const styles = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${styles.pill} ${className}`}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
