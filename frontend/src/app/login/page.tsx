"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/mock-fallback";
import {
  Bed,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  Activity,
  AlertCircle,
  Info,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isStrictBackend } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Error states matching Figma frames 81:11924 (field errors) & 81:12328 (alert error)
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    setUsernameError(null);
    setPasswordError(null);

    let hasValidationError = false;

    // Field-level validation matching Figma frame 81:11924
    if (!username.trim()) {
      setUsernameError("Username wajib diisi.");
      hasValidationError = true;
    }
    if (!password) {
      setPasswordError("Password wajib diisi.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(username, password);
      if (loggedInUser.role === "PETUGAS_ADMINISTRASI" || loggedInUser.role === "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/bed-management");
      }
    } catch (err: unknown) {
      // Credential mismatch error matching Figma frame 81:12328
      if (err instanceof Error) {
        setAlertError(err.message);
      } else {
        setAlertError("Username atau password salah. Silakan periksa kembali kredensial Anda.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemo = (usernameKey: string) => {
    const demo = DEMO_USERS[usernameKey];
    if (demo) {
      setUsername(demo.account.username);
      setPassword(demo.password);
      setAlertError(null);
      setUsernameError(null);
      setPasswordError(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 lg:bg-[#064e3b]">
      {/* Panel Kiri (Branding & Info) - Sembunyikan di HP, tampilkan di Desktop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#064e3b] via-[#053b2d] to-[#022c22] text-white relative overflow-hidden border-r border-[#022c22]">
        {/* Glow ambient background circles */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand & Identity */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-2xl shadow-lg shadow-emerald-950/40">
              +
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight leading-none">
                Inpatient Care
              </div>
              <p className="text-xs text-emerald-300/80 font-medium tracking-wide mt-1">
                Sistem Informasi Rawat Inap RSI
              </p>
            </div>
          </div>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-xl">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              HOSPITAL OPERATIONS PLATFORM
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Selamat Datang di SIMRS Rawat Inap
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Platform terintegrasi untuk pemantauan ketersediaan tempat tidur, antrean darurat IGD, rekam medis elektronik, dan kasir billing.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                <Bed className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Bed Management</div>
              <div className="text-[11px] text-emerald-200/70 mt-0.5">Real-time status ranap</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Antrean &amp; SPGDT</div>
              <div className="text-[11px] text-emerald-200/70 mt-0.5">FIFO &amp; RS jejaring</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">RME &amp; Billing</div>
              <div className="text-[11px] text-emerald-200/70 mt-0.5">Invoice resmi kasir</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-emerald-300/60">
          &copy; 2026 RSI Inpatient Care Platform. Terstandarisasi Kemenkes RI.
        </div>
      </div>

      {/* Panel Form Login: Full-width di HP, 50% di Desktop, dengan pb-20 agar tidak overlap */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-10 pb-20 bg-slate-50 lg:bg-white">
        <div className="max-w-sm w-full mx-auto space-y-6">
          {/* Header khusus mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              +
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Inpatient Care</h1>
              <p className="text-xs text-slate-500">SIMRS Rawat Inap RSI</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Masuk ke Sistem
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan akun petugas rumah sakit yang terdaftar
            </p>
          </div>

          {/* Alert Error State */}
          {alertError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium leading-snug">{alertError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError(null);
                    if (alertError) setAlertError(null);
                  }}
                  placeholder="Masukkan username"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    usernameError
                      ? "border-rose-400 ring-2 ring-rose-400/20 focus:border-rose-500"
                      : "border-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white"
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {usernameError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{usernameError}</span>
                </div>
              )}
            </div>

            {/* Field 2: Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (alertError) setAlertError(null);
                  }}
                  placeholder="Masukkan password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    passwordError
                      ? "border-rose-400 ring-2 ring-rose-400/20 focus:border-rose-500"
                      : "border-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white"
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Quick Select Demo Accounts for Instant Testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Pilihan Akun Uji Coba Cepat:
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleSelectDemo("admin.demo")}
                className="w-full p-2.5 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-left transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-purple-900 flex items-center gap-1.5">
                    <span>Super Admin</span>
                    <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">Akses Penuh</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    admin.demo
                  </div>
                </div>
                <span className="text-[10px] bg-purple-700 text-white font-medium px-2 py-0.5 rounded-full">
                  Pilih
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo("budi.santoso")}
                className="w-full p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                    <span>Budi Santoso</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">Bed Mgmt</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    budi.santoso
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-700 text-white font-medium px-2 py-0.5 rounded-full">
                  Pilih
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo("petugas.admin")}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-slate-900 flex items-center gap-1.5">
                    <span>Rina Aprilianti</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded">Admin Ranap</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    petugas.admin
                  </div>
                </div>
                <span className="text-[10px] bg-slate-700 text-white font-medium px-2 py-0.5 rounded-full">
                  Pilih
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
