"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

interface AlertBannerProps {
  tone?: "error" | "warning" | "info" | "success";
  message: string;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

const ALERT_STYLES = {
  error: "bg-rose-50 border-rose-200 text-rose-800",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  info: "bg-sky-50 border-sky-200 text-sky-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
};

export function AlertBanner({
  tone = "error",
  message,
  action,
  onDismiss,
}: AlertBannerProps) {
  const Icon = tone === "info" ? Info : tone === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`p-4 rounded-xl border text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn ${ALERT_STYLES[tone]}`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <Icon aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-relaxed">{message}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Tutup notifikasi"
            className="p-1 rounded hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Toast({
  message,
  tone = "success",
  onClose,
}: {
  message: string | null;
  tone?: "success" | "error";
  onClose?: () => void;
}) {
  if (!message) return null;
  const isError = tone === "error";
  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 max-w-md animate-scaleUp no-print ${
        isError
          ? "bg-rose-900 text-white border-rose-500/40"
          : "bg-[#064e3b] text-white border-emerald-500/30"
      }`}
    >
      {isError ? (
        <AlertTriangle aria-hidden="true" className="w-4 h-4 text-rose-300 shrink-0" />
      ) : (
        <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-300 shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-medium">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pesan"
          className="text-white/70 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 px-4 text-center space-y-2">
      {icon && (
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto"
        >
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
