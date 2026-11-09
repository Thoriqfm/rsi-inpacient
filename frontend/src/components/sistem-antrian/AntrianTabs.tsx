"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Ambulance, Activity } from "lucide-react";

interface AntrianTabsProps {
  waitingCount?: number;
  referralCount?: number;
  monitoringCount?: number;
}

export function AntrianTabs({
  waitingCount,
  referralCount,
  monitoringCount,
}: AntrianTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Daftar Tunggu (FIFO)",
      sublabel: "Antrean Pasien Rawat Inap",
      href: "/sistem-antrian/daftar-tunggu",
      icon: Clock,
      active: pathname.includes("/daftar-tunggu"),
      badge: waitingCount,
      badgeColor: "bg-amber-500/15 text-amber-700 border-amber-300/60",
    },
    {
      label: "Rujukan Pasien Darurat",
      sublabel: "RS Jejaring & Rujukan",
      href: "/sistem-antrian/rujukan-pasien",
      icon: Ambulance,
      active: pathname.includes("/rujukan-pasien"),
      badge: referralCount,
      badgeColor: "bg-rose-500/15 text-rose-700 border-rose-300/60",
    },
    {
      label: "Pemantauan Status",
      sublabel: "Tracking & Status Pasien",
      href: "/sistem-antrian/pemantauan-status",
      icon: Activity,
      active: pathname.includes("/pemantauan-status"),
      badge: monitoringCount,
      badgeColor: "bg-teal-500/15 text-teal-800 border-teal-300/60",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-sm flex flex-wrap gap-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 min-w-[210px] flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${
              tab.active
                ? "bg-[#0d332f] text-white shadow-md shadow-teal-950/15"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  tab.active
                    ? "bg-[#13c9b3] text-[#0d332f]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold leading-tight">
                  {tab.label}
                </div>
                <div
                  className={`text-[11px] leading-tight mt-0.5 ${
                    tab.active ? "text-teal-200/80" : "text-slate-400"
                  }`}
                >
                  {tab.sublabel}
                </div>
              </div>
            </div>

            {typeof tab.badge === "number" && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  tab.active
                    ? "bg-[#13c9b3]/20 text-[#13c9b3] border-[#13c9b3]/40"
                    : tab.badgeColor
                }`}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
