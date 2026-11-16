"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bed,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  Activity,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

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


  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Panel Kiri (Identitas Klinis Rumah Sakit) - Tetap menggunakan hijau brand #064e3b tanpa efek glow blur generik */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-12 bg-[#064e3b] text-white border-r border-[#022c22]">
        {/* Top Header: Brand & Identity */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center text-xl">
              +
            </div>
            <div>
              <div className="text-white font-bold text-lg tracking-tight leading-none">
                Inpatient Care
              </div>
              <p className="text-xs text-emerald-200/80 font-medium mt-1">
                Sistem Informasi Rawat Inap RSI
              </p>
            </div>
          </div>
        </div>

        {/* Middle Content: Structured Swiss Grid */}
        <div className="my-auto py-8 space-y-7 max-w-lg">
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              HOSPITAL OPERATIONS PLATFORM
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight leading-snug">
              Kendali Terintegrasi Operasional Rawat Inap
            </h1>
            <p className="text-sm text-emerald-100/85 leading-relaxed">
              Satu sistem operasional terstruktur untuk pemantauan ketersediaan bed bangsal, antrean FIFO, rujukan SPGDT, rekap tindakan RME, dan kasir billing rumah sakit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[#053f30] border border-emerald-700/60">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2.5">
                <Bed className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-white">Inventaris Bed</div>
              <div className="text-xs text-emerald-200/75 mt-0.5">Kontrol status bangsal</div>
            </div>

            <div className="p-4 rounded-xl bg-[#053f30] border border-emerald-700/60">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-white">FIFO &amp; Rujukan</div>
              <div className="text-xs text-emerald-200/75 mt-0.5">Antrean &amp; SPGDT IGD</div>
            </div>

            <div className="p-4 rounded-xl bg-[#053f30] border border-emerald-700/60">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-white">RME &amp; Billing</div>
              <div className="text-xs text-emerald-200/75 mt-0.5">Tagihan resmi kasir</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-emerald-200/70 border-t border-emerald-800/70 pt-5">
          &copy; 2026 RSI Inpatient Care Platform • Akses Terbatas Petugas Terdaftar
        </div>
      </div>

      {/* Panel Form Login: Latar putih bersih */}
      <div className="w-full lg:w-[52%] min-h-screen flex items-center justify-center p-6 sm:p-10 pb-20 bg-white">
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

        </div>
      </div>
    </div>
  );
}
