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
      badgeColor: "bg-[#fef3e9] text-[#b45309] border-[#fed7aa]",
    },
    {
      label: "Rujukan Pasien Darurat",
      sublabel: "RS Jejaring & Rujukan",
      href: "/sistem-antrian/rujukan-pasien",
      icon: Ambulance,
      active: pathname.includes("/rujukan-pasien"),
      badge: referralCount,
      badgeColor: "bg-[#fdf0f0] text-[#dc2626] border-[#fecaca]",
    },
    {
      label: "Pemantauan Status",
      sublabel: "Tracking & Status Pasien",
      href: "/sistem-antrian/pemantauan-status",
      icon: Activity,
      active: pathname.includes("/pemantauan-status"),
      badge: monitoringCount,
      badgeColor: "bg-[#e6f4ef] text-[#016b46] border-[#cbe7dd]",
    },
  ];

  return (
    <div className="bg-white rounded-[12px] border border-[#e9ebf0] p-1.5 shadow-[0px_4px_8px_rgba(26,39,50,0.02)] flex flex-wrap gap-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 min-w-[210px] flex items-center justify-between gap-3 px-4 py-2.5 rounded-[8px] transition cursor-pointer ${
              tab.active
                ? "bg-[#0a2e28] text-white shadow-xs"
                : "text-[#666666] hover:bg-slate-50 hover:text-[#1e1e1e]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                  tab.active
                    ? "bg-[#00b89f] text-white font-bold"
                    : "bg-slate-100 text-[#4b5563]"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold leading-tight">
                  {tab.label}
                </div>
                <div
                  className={`text-[10px] leading-tight mt-0.5 ${
                    tab.active ? "text-teal-200/70" : "text-[#8c8c8c]"
                  }`}
                >
                  {tab.sublabel}
                </div>
              </div>
            </div>

            {typeof tab.badge === "number" && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  tab.active
                    ? "bg-[#00b89f]/20 text-teal-200 border-[#00b89f]/40"
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
