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
      href: "/sistem-antrian/daftar-tunggu",
      icon: Clock,
      active: pathname.includes("/daftar-tunggu"),
      count: waitingCount,
    },
    {
      label: "Rujukan Pasien",
      href: "/sistem-antrian/rujukan-pasien",
      icon: Ambulance,
      active: pathname.includes("/rujukan-pasien"),
      count: referralCount,
    },
    {
      label: "Pemantauan Status",
      href: "/sistem-antrian/pemantauan-status",
      icon: Activity,
      active: pathname.includes("/pemantauan-status"),
      count: monitoringCount,
    },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar pt-1 pb-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`pb-3 -mb-[1px] text-xs sm:text-sm flex items-center gap-2 font-medium transition cursor-pointer shrink-0 border-b-2 ${
              isActive
                ? "text-emerald-700 font-semibold border-emerald-600"
                : "text-slate-500 hover:text-slate-900 border-transparent"
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${
                isActive ? "text-emerald-600" : "text-slate-400"
              }`}
            />
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
