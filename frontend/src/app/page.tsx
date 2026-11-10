"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.role === "PETUGAS_ADMINISTRASI" || user.role === "SUPER_ADMIN") {
          router.replace("/dashboard");
        } else {
          router.replace("/bed-management");
        }
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#102d2a] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#13c9b3]/30 border-t-[#13c9b3] rounded-full animate-spin" />
        <p className="text-sm text-teal-100/70">Memuat Sistem Inpatient Care...</p>
      </div>
    </div>
  );
}
