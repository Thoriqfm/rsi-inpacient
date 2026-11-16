"use client";

import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerOutline"
  | "warning"
  | "info";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 shadow-2xs focus-visible:ring-emerald-500",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 focus-visible:ring-slate-400",
  outline:
    "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-2xs focus-visible:ring-emerald-500",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent focus-visible:ring-emerald-500",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-2xs focus-visible:ring-rose-500",
  dangerOutline:
    "bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 focus-visible:ring-rose-500",
  warning:
    "bg-amber-600 text-white hover:bg-amber-700 border border-amber-600 shadow-2xs focus-visible:ring-amber-500",
  info:
    "bg-sky-600 text-white hover:bg-sky-700 border border-sky-600 shadow-2xs focus-visible:ring-sky-500",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-xs sm:text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-sm rounded-lg gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-55 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin shrink-0"
        />
      )}
      {children}
    </button>
  );
}
