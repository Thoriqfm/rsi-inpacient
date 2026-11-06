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
      if (loggedInUser.role === "PETUGAS_ADMINISTRASI") {
        router.push("/bed-management/alokasi");
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0d2a27]">
      {/* LEFT PANEL: Hospital Operations Platform Branding (Figma 81:11793 & 81:12602) */}
      <div className="relative flex-1 bg-gradient-to-br from-[#102d2a] via-[#0d332f] to-[#092220] p-8 lg:p-14 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-teal-800/30">
        {/* Glow ambient background circles */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[#13c9b3]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-[#0d9488]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand & Identity */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#13c9b3] text-[#0d332f] font-black flex items-center justify-center text-2xl shadow-lg shadow-teal-500/20">
              +
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight leading-none flex items-center gap-2">
                Inpatient Care
              </div>
              <p className="text-xs text-teal-300/80 font-medium tracking-wide mt-1">
                Sistem Informasi Rawat Inap
              </p>
            </div>
          </div>
        </div>

        {/* Middle Content: Tag, Heading, and Glass Cards */}
        <div className="relative z-10 my-10 lg:my-0 space-y-6 max-w-xl">
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#13c9b3]">
              HOSPITAL OPERATIONS PLATFORM
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Selamat Datang
            </h1>
            <p className="text-sm text-slate-300/85 leading-relaxed">
              Masuk untuk mengakses sistem sesuai dengan peran dan wewenang Anda di rumah sakit.
            </p>
          </div>

          {/* Glassmorphism Feature Cards as shown in Figma 81:11793 & 81:12602 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Card 1: Ketersediaan Tempat Tidur */}
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-[#13c9b3] mb-3">
                <Bed className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-teal-200/80 font-medium">
                  Ketersediaan Tempat Tidur
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  Informasi rawat inap terintegrasi
                </div>
                {/* 4 mini bar charts as in Figma 81:11837 */}
                <div className="flex items-end gap-1.5 mt-3 h-5">
                  <span className="w-3 bg-teal-400/40 rounded-t h-2" />
                  <span className="w-3 bg-teal-400/60 rounded-t h-3.5" />
                  <span className="w-3 bg-[#13c9b3] rounded-t h-5" />
                  <span className="w-3 bg-teal-400/50 rounded-t h-3" />
                </div>
              </div>
            </div>

            {/* Card 2: Operasional Aktif */}
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Operasional Aktif</div>
                <div className="text-[11px] text-teal-200/80 mt-0.5">
                  Pemantauan real-time
                </div>
              </div>
            </div>

            {/* Card 3: Data Terlindungi */}
            <div className="bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Data Terlindungi</div>
                <div className="text-[11px] text-teal-200/80 mt-0.5">
                  Akses sesuai kewenangan
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note (Figma 81:11866) */}
        <div className="relative z-10 pt-4 text-xs text-teal-200/60 flex items-center justify-between border-t border-teal-800/30">
          <span>Sistem internal rumah sakit • Akses terbatas untuk staf yang berwenang.</span>
        </div>
      </div>

      {/* RIGHT PANEL: Login Form Card (Figma 81:11793 & 81:12602) */}
      <div className="flex-1 bg-gradient-to-b from-[#f9fbfa] via-[#f2f7f5] to-[#ebf3f0] flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-[440px] bg-white rounded-3xl p-7 sm:p-9 shadow-xl shadow-teal-950/5 border border-slate-100">
          {/* Form Header */}
          <div className="space-y-1 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-[#13c9b3] flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Gunakan akun petugas yang telah terdaftar.
            </p>
          </div>

          {/* Alert Error State: Frame 81:12328 */}
          {alertError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
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
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    usernameError
                      ? "border-rose-400 ring-2 ring-rose-400/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-2 focus:ring-[#13c9b3]/40 focus:border-[#13c9b3]"
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {/* Validation Error: Frame 81:11924 */}
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
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    passwordError
                      ? "border-rose-400 ring-2 ring-rose-400/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-2 focus:ring-[#13c9b3]/40 focus:border-[#13c9b3]"
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? "Button - Sembunyikan password" : "Button - Tampilkan password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Validation Error: Frame 81:11924 */}
              {passwordError && (
                <div className="mt-1.5 flex items-center gap-1.5 text-rose-600 text-[11px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Submit Button (Figma 81:11909) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-[#13c9b3] hover:bg-[#0fb39f] active:bg-[#0c9d8c] text-[#0d332f] font-bold rounded-xl text-sm transition duration-150 shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0d332f]/30 border-t-[#0d332f] rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Form Notes matching Figma frame 81:11913 & 81:11919 */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Akses sistem diberikan sesuai peran akun Anda.</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Autentikasi ini disimulasikan untuk prototipe. Pada implementasi SIMRS produksi, proses login divalidasi ke basis data rumah sakit dan menerapkan sesi terenkripsi.
            </p>
          </div>

          {/* Quick Select Demo Accounts for Instant Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Pilihan Akun Uji Coba Cepat:
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleSelectDemo("budi.santoso")}
                className="w-full p-2 rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-50 text-left transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-teal-900">
                    Budi Santoso
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Petugas Bed Management (budi.santoso)
                  </div>
                </div>
                <span className="text-[10px] bg-teal-600 text-white font-medium px-2 py-0.5 rounded-full">
                  Pilih
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo("rini.aprilianti")}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-left transition flex items-center justify-between text-xs group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-slate-900">
                    Rini Aprilianti
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Petugas Administrasi (rini.aprilianti)
                  </div>
                </div>
                <span className="text-[10px] bg-slate-600 text-white font-medium px-2 py-0.5 rounded-full">
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
