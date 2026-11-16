"use client";
import { useAuth } from "@/context/AuthContext";
import { RoleAccessDenied } from "@/components/layout/RoleAccessDenied";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Check,
  Clock,
  X,
  RefreshCw,
  MoreHorizontal,
  Plus,
  Calendar,
  Receipt,
  Tag,
} from "lucide-react";
import {
  BillingItem,
  BillingStatus,
  TarifItem,
} from "@/types";
import {
  cancelBillingApi,
  fetchBillingsApi,
  fetchTariffsApi,
  updateBillingStatusApi,
} from "@/lib/api-client";
import {
  Badge,
  Button,
  Modal,
  PageHeader,
  StatCard,
  Toast,
} from "@/components/ui";

export default function PembayaranDashboardPage() {
  const { user } = useAuth();

  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [tariffs, setTariffs] = useState<TarifItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Semua" | "Belum Dibayar" | "Lunas" | "Batal">("Semua");
  const [statusDropdown, setStatusDropdown] = useState<string>("Semua status");
  const dateRange = "Periode Aktif";

  // Modals state
  const [isTarifModalOpen, setIsTarifModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<BillingItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [statusModalTarget, setStatusModalTarget] = useState<BillingItem | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<BillingStatus>("Belum Dibayar");
  const [savingStatus, setSavingStatus] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Notifications
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tList] = await Promise.all([
        fetchBillingsApi(),
        fetchTariffsApi(),
      ]);
      setBillings(bRes.items);
      setTariffs(tList);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal memuat data tagihan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  // Counts for tabs & cards
  const counts = useMemo(() => {
    const belumDibayar = billings.filter((b) => b.status === "Belum Dibayar").length;
    const lunas = billings.filter((b) => b.status === "Lunas").length;
    const batal = billings.filter((b) => b.status === "Batal").length;
    return {
      semua: billings.length,
      belumDibayar,
      lunas,
      batal,
    };
  }, [billings]);

  // Filtering
  const filteredBillings = useMemo(() => {
    return billings.filter((b) => {
      // Filter tab
      if (activeTab === "Belum Dibayar" && b.status !== "Belum Dibayar") return false;
      if (activeTab === "Lunas" && b.status !== "Lunas") return false;
      if (activeTab === "Batal" && b.status !== "Batal") return false;

      // Filter dropdown status
      if (statusDropdown !== "Semua status" && b.status !== statusDropdown) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = b.no_tagihan.toLowerCase().includes(q);
        const matchNama = b.nama_pasien.toLowerCase().includes(q);
        const matchRm = b.no_rm.toLowerCase().includes(q);
        if (!matchInv && !matchNama && !matchRm) return false;
      }
      return true;
    });
  }, [billings, activeTab, statusDropdown, searchQuery]);

  // Status Change handler
  const handleSaveStatusChange = async () => {
    if (!statusModalTarget || savingStatus) return;
    setSavingStatus(true);
    try {
      await updateBillingStatusApi(statusModalTarget.id_tagihan, selectedNewStatus);
      showToast(
        `Status tagihan ${statusModalTarget.no_tagihan} berhasil diperbarui menjadi "${selectedNewStatus}".`
      );
      setStatusModalTarget(null);
      loadData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal memperbarui status tagihan.");
    } finally {
      setSavingStatus(false);
    }
  };

  // Cancel Invoice handler
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || cancelling) return;
    if (!cancelReason.trim()) {
      showError("Alasan pembatalan tagihan wajib diisi.");
      return;
    }

    setCancelling(true);
    try {
      await cancelBillingApi(cancelTarget.id_tagihan, cancelReason);
      showToast(`Tagihan ${cancelTarget.no_tagihan} berhasil dibatalkan.`);
      setCancelTarget(null);
      setCancelReason("");
      loadData();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Gagal membatalkan tagihan.");
    } finally {
      setCancelling(false);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (user?.role === "PETUGAS_BED_MANAGEMENT") {
    return <RoleAccessDenied moduleName="Pembayaran & Billing" />;
  }

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      <Toast message={errorMsg} tone="error" onClose={() => setErrorMsg(null)} />

      <PageHeader
        eyebrow="Manajemen Tagihan Rawat Inap"
        title="Pembayaran & Tagihan Pasien"
        description="Kelola perhitungan biaya pelayanan, penerbitan invoice kasir, dan status pelunasan pasien rawat inap."
        actions={
          <>
            <Link
              href="/pembayaran/tarif-kamar"
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-xs"
            >
              Tarif Kamar
            </Link>
            <Button variant="outline" size="sm" onClick={() => setIsTarifModalOpen(true)}>
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Master Tarif ({tariffs.length})</span>
            </Button>
            <Link
              href="/pembayaran/buat"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Tagihan</span>
            </Link>
          </>
        }
      />

      {/* 4 Financial & Status KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          label="Total Tagihan"
          subtitle="Seluruh invoice"
          value={counts.semua}
          tone="emerald"
          active={activeTab === "Semua"}
          onClick={() => {
            setActiveTab("Semua");
            setStatusDropdown("Semua status");
          }}
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          label="Belum Dibayar"
          subtitle="Perlu ditindaklanjuti"
          value={counts.belumDibayar}
          tone="amber"
          active={activeTab === "Belum Dibayar"}
          onClick={() => {
            setActiveTab("Belum Dibayar");
            setStatusDropdown("Semua status");
          }}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Lunas"
          subtitle="Pembayaran selesai"
          value={counts.lunas}
          tone="emerald"
          active={activeTab === "Lunas"}
          onClick={() => {
            setActiveTab("Lunas");
            setStatusDropdown("Semua status");
          }}
          icon={<Check className="w-5 h-5" />}
        />
        <StatCard
          label="Dibatalkan"
          subtitle="Invoice dibatalkan"
          value={counts.batal}
          tone="rose"
          active={activeTab === "Batal"}
          onClick={() => {
            setActiveTab("Batal");
            setStatusDropdown("Semua status");
          }}
          icon={<X className="w-5 h-5" />}
        />
      </div>

      {/* Main Container Card: Search, Tabs & Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pasien, No. RM, atau No. Invoice..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 bg-slate-50/60 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Date Range Box */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 shrink-0 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
            </div>

            {/* Status Dropdown */}
            <select
              value={statusDropdown}
              onChange={(e) => setStatusDropdown(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-emerald-500 shrink-0 shadow-2xs"
            >
              <option value="Semua status">Semua status</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
              <option value="Lunas">Lunas</option>
              <option value="Batal">Batal</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-4 sm:gap-6 text-xs font-medium overflow-x-auto no-scrollbar">
          {(
            [
              { id: "Semua", label: "Semua", count: counts.semua },
              { id: "Belum Dibayar", label: "Belum Dibayar", count: counts.belumDibayar },
              { id: "Lunas", label: "Lunas", count: counts.lunas },
              { id: "Batal", label: "Batal", count: counts.batal },
            ] as const
          ).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`pb-2.5 flex items-center gap-1.5 transition cursor-pointer relative shrink-0 ${
                  isActive
                    ? "text-emerald-700 font-semibold border-b-2 border-emerald-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop Table Content */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                <th className="py-3 px-4 w-12 text-center">NO.</th>
                <th className="py-3 px-4">NO. INVOICE</th>
                <th className="py-3 px-4">NAMA PASIEN</th>
                <th className="py-3 px-4">NO. RM</th>
                <th className="py-3 px-4">PERIODE</th>
                <th className="py-3 px-4">TOTAL TAGIHAN</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TANGGAL TERBIT</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data tagihan pasien...</span>
                  </td>
                </tr>
              ) : filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada data tagihan yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredBillings.map((item, idx) => (
                  <tr key={item.id_tagihan} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-normal text-center">
                      {String(idx + 1).padStart(2, "0")}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/pembayaran/${item.id_tagihan}`}
                        className="hover:text-emerald-700 transition"
                      >
                        {item.no_tagihan}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(item.nama_pasien)}
                        </div>
                        <span className="font-semibold text-slate-900">{item.nama_pasien}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">{item.no_rm}</td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.periode_perawatan || "-"}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      {formatRupiah(item.total_biaya_num)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === "Belum Dibayar" ? (
                        <Badge tone="amber" dot>
                          Belum Dibayar
                        </Badge>
                      ) : item.status === "Lunas" ? (
                        <Badge tone="emerald" dot>
                          Lunas
                        </Badge>
                      ) : item.status === "Batal" ? (
                        <Badge tone="rose" dot>
                          Batal
                        </Badge>
                      ) : (
                        <Badge tone="slate" dot>
                          Draft
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {item.tanggal_terbit_formatted || item.tanggal_diperbarui_formatted || "-"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2 relative">
                        <Link
                          href={`/pembayaran/${item.id_tagihan}`}
                          className="text-emerald-700 hover:text-emerald-800 font-medium text-xs px-2 py-1 rounded-md hover:bg-emerald-50 transition border border-emerald-200"
                        >
                          Lihat Detail
                        </Link>

                        {/* Quick Update Icon */}
                        {item.status !== "Batal" && (
                          <button
                            type="button"
                            title="Ubah Status Pembayaran"
                            onClick={() => {
                              setStatusModalTarget(item);
                              setSelectedNewStatus(
                                item.status === "Belum Dibayar" ? "Lunas" : "Belum Dibayar"
                              );
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* More Actions Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === item.id_tagihan ? null : item.id_tagihan
                              )
                            }
                            className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openDropdownId === item.id_tagihan && (
                            <div className="absolute right-0 top-7 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 animate-fadeIn text-left text-xs">
                              <Link
                                href={`/pembayaran/${item.id_tagihan}`}
                                className="block px-3.5 py-1.5 text-slate-700 hover:bg-slate-50"
                                onClick={() => setOpenDropdownId(null)}
                              >
                                Buka Tagihan
                              </Link>

                              {item.status !== "Batal" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setStatusModalTarget(item);
                                    setSelectedNewStatus(
                                      item.status === "Belum Dibayar" ? "Lunas" : "Belum Dibayar"
                                    );
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                  Ubah Status
                                </button>
                              )}

                              {(item.status === "Draft" || item.status === "Belum Dibayar") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setCancelTarget(item);
                                    setCancelReason("");
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  Batalkan Tagihan
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-3.5 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
              <span>Memuat data tagihan...</span>
            </div>
          ) : filteredBillings.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Tidak ada tagihan yang sesuai filter.
            </div>
          ) : (
            filteredBillings.map((item) => (
              <div
                key={item.id_tagihan}
                className="pt-3 first:pt-0 bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {item.no_tagihan}
                  </span>
                  {item.status === "Belum Dibayar" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Belum Dibayar
                    </span>
                  ) : item.status === "Lunas" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Lunas
                    </span>
                  ) : item.status === "Batal" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                      Batal
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Draft
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                    {item.nama_pasien}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {item.no_rm} • {item.periode_perawatan || "-"}
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatRupiah(item.total_biaya_num)}
                  </span>
                  <span className="text-[11px] text-slate-400">{item.tanggal_terbit_formatted}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/pembayaran/${item.id_tagihan}`}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium text-center transition"
                  >
                    Buka Tagihan
                  </Link>
                  {item.status !== "Batal" && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusModalTarget(item);
                        setSelectedNewStatus(
                          item.status === "Belum Dibayar" ? "Lunas" : "Belum Dibayar"
                        );
                      }}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
                    >
                      Ubah Status
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredBillings.length}</strong> dari{" "}
            <strong className="text-slate-800">{billings.length}</strong> tagihan
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center text-xs"
            >
              &lt;
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-medium flex items-center justify-center text-xs shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center text-xs hover:bg-slate-50"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center text-xs hover:bg-slate-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Ubah Status Pembayaran */}
      <Modal
        isOpen={!!statusModalTarget}
        onClose={() => !savingStatus && setStatusModalTarget(null)}
        title="Ubah Status Pembayaran"
        description="Perbarui status pembayaran invoice pasien."
        maxWidthClass="max-w-md"
      >
        {statusModalTarget && (
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-xs block">No. Invoice</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {statusModalTarget.no_tagihan}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Nama Pasien</span>
                <span className="font-semibold text-slate-900">
                  {statusModalTarget.nama_pasien}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Total Tagihan</span>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {formatRupiah(statusModalTarget.total_biaya_num)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Status Saat Ini</span>
                <Badge
                  tone={statusModalTarget.status === "Lunas" ? "emerald" : "amber"}
                  dot
                >
                  {statusModalTarget.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-800 block">
                Pilih status pembayaran
              </span>

              <label
                onClick={() => setSelectedNewStatus("Belum Dibayar")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedNewStatus === "Belum Dibayar"
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedNewStatus === "Belum Dibayar"
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedNewStatus === "Belum Dibayar" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Belum Dibayar</div>
                    <div className="text-xs text-slate-500">Pembayaran belum diterima</div>
                  </div>
                </div>
                {selectedNewStatus === "Belum Dibayar" && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </label>

              <label
                onClick={() => setSelectedNewStatus("Lunas")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedNewStatus === "Lunas"
                    ? "border-emerald-600 bg-emerald-50/50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedNewStatus === "Lunas"
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedNewStatus === "Lunas" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Lunas</div>
                    <div className="text-xs text-slate-500">Pembayaran telah diselesaikan</div>
                  </div>
                </div>
                {selectedNewStatus === "Lunas" && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={savingStatus}
                onClick={() => setStatusModalTarget(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                loading={savingStatus}
                disabled={savingStatus}
                onClick={handleSaveStatusChange}
              >
                {savingStatus ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Batalkan Tagihan */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => !cancelling && setCancelTarget(null)}
        title="Batalkan Tagihan?"
        description="Tindakan ini akan mengubah status tagihan menjadi Batal dan tidak dapat dipulihkan."
        maxWidthClass="max-w-md"
      >
        {cancelTarget && (
          <form onSubmit={handleConfirmCancel} className="space-y-4">
            <div className="bg-rose-50/70 rounded-xl p-3.5 border border-rose-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-mono tabular-nums font-semibold text-slate-900 block">
                  {cancelTarget.no_tagihan}
                </span>
                <span className="text-xs text-slate-600">{cancelTarget.nama_pasien}</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-rose-700">
                {formatRupiah(cancelTarget.total_biaya_num)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Alasan pembatalan *
              </label>
              <textarea
                rows={3}
                required
                maxLength={200}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tuliskan alasan pembatalan tagihan..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
              <div className="text-xs font-mono tabular-nums text-slate-500 text-right mt-1">
                {cancelReason.length}/200 karakter
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                loading={cancelling}
                disabled={cancelling}
              >
                {cancelling ? "Membatalkan..." : "Ya, Batalkan Tagihan"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: Master Tarif */}
      <Modal
        isOpen={isTarifModalOpen}
        onClose={() => setIsTarifModalOpen(false)}
        title="Master Tarif Pelayanan"
        description="Acuan harga satuan otomatis untuk kalkulasi tagihan pasien rawat inap"
        maxWidthClass="max-w-2xl"
      >
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="py-2.5 px-3">Kode</th>
                <th className="py-2.5 px-3">Nama Layanan</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">Tarif Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tariffs.map((t) => (
                <tr key={t.id_tarif} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono tabular-nums font-medium text-emerald-700">
                    {t.kode_tindakan}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {t.nama_tindakan}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{t.kategori}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {formatRupiah(t.harga_num)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
