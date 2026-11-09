"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RekapPasienRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/rekap-layanan");
  }, [router]);

  return (
    <div className="max-w-[1200px] mx-auto py-16 text-center text-slate-500 text-sm">
      Mengalihkan ke halaman Rekap Layanan & Tindakan...
    </div>
  );
}
