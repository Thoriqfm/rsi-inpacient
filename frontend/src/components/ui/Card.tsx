"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-2xs ${className}`}
    >
      {children}
    </div>
  );
}

export type StatTone = "emerald" | "amber" | "rose" | "slate";

interface StatCardProps {
  label: string;
  subtitle?: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: StatTone;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const STAT_TONE: Record<
  StatTone,
  { iconBg: string; activeBorder: string; hoverBorder: string }
> = {
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-700",
    activeBorder: "border-emerald-600 ring-2 ring-emerald-500/25",
    hoverBorder: "hover:border-emerald-400",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-700",
    activeBorder: "border-amber-500 ring-2 ring-amber-500/25",
    hoverBorder: "hover:border-amber-400",
  },
  rose: {
    iconBg: "bg-rose-50 text-rose-700",
    activeBorder: "border-rose-500 ring-2 ring-rose-500/25",
    hoverBorder: "hover:border-rose-400",
  },
  slate: {
    iconBg: "bg-slate-100 text-slate-700",
    activeBorder: "border-slate-600 ring-2 ring-slate-400/25",
    hoverBorder: "hover:border-slate-400",
  },
};

export function StatCard({
  label,
  subtitle,
  value,
  icon,
  tone = "emerald",
  active = false,
  href,
  onClick,
  className = "",
}: StatCardProps) {
  const palette = STAT_TONE[tone];
  const baseClass = `w-full text-left bg-white rounded-xl border p-4 sm:p-5 flex items-center justify-between shadow-2xs transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
    active ? palette.activeBorder : `border-slate-200 ${palette.hoverBorder}`
  } ${href || onClick ? "cursor-pointer hover:shadow-xs" : ""} ${className}`;

  const inner = (
    <>
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          aria-hidden="true"
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${palette.iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-800 truncate">
            {label}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500 mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
          {value}
        </span>
        {(href || onClick) && (
          <ChevronRight
            aria-hidden="true"
            className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform"
          />
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        {inner}
      </button>
    );
  }
  return <div className={baseClass}>{inner}</div>;
}
