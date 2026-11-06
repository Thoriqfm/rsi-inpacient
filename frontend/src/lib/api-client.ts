import {
  BedItem,
  BedStatus,
  CreateAllocationPayload,
  CreateBedPayload,
  PasienCandidate,
  UpdateBedStatusPayload,
  UserAccount,
  UserRole,
} from "@/types";
import {
  DEMO_USERS,
  getMockBeds,
  INITIAL_PASIEN_CANDIDATES as SEED_PATIENTS,
  saveMockBeds,
} from "./mock-fallback";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rsi_inpatient_token");
}

function getCurrentUserRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("rsi_inpatient_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.role || null;
  } catch {
    return null;
  }
}

function formatNowTimestamp(): { relative: string; timestamp: string } {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return {
    relative: "Baru saja",
    timestamp: `Hari ini, ${hh}:${mm} WIB`,
  };
}

export async function loginApi(
  username: string,
  password: string
): Promise<{
  token: string;
  user: UserAccount;
  source: "backend" | "mock";
}> {
  const cleanUser = username.trim().toLowerCase();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleanUser, password }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const backendUser = json.data?.user;
      const name: string = backendUser?.nama_petugas || username;
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const rawRole = String(backendUser?.role || "");
      const mappedRole: UserRole =
        rawRole.toLowerCase().includes("administrasi")
          ? "PETUGAS_ADMINISTRASI"
          : rawRole.toLowerCase().includes("medis")
          ? "PETUGAS_MEDIS"
          : "PETUGAS_BED_MANAGEMENT";

      const roleLabel =
        mappedRole === "PETUGAS_ADMINISTRASI"
          ? "Petugas Administrasi"
          : mappedRole === "PETUGAS_MEDIS"
          ? "Petugas Medis"
          : "Petugas Bed Management";

      return {
        token: json.data.token,
        source: "backend",
        user: {
          id_akun: backendUser?.id_akun || 1,
          username: backendUser?.username || cleanUser,
          nama_petugas: name,
          jabatan_label: roleLabel,
          inisial: initials,
          role: mappedRole,
        },
      };
    }

    if (res.status === 401) {
      throw new Error("INVALID_CREDENTIALS");
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      // Check if demo credentials match before rejecting
      const demo = DEMO_USERS[cleanUser];
      if (!demo || demo.password !== password) {
        throw new Error("Username atau password yang Anda masukkan tidak valid.");
      }
    }
  }

  // Fallback to Demo Accounts
  const matchedDemo =
    DEMO_USERS[cleanUser] ||
    Object.values(DEMO_USERS).find(
      (u) =>
        u.account.username.toLowerCase() === cleanUser ||
        u.account.nama_petugas.toLowerCase() === cleanUser
    );

  if (matchedDemo && (matchedDemo.password === password || password === "demo" || password === "123456")) {
    return {
      token: `mock-jwt-token-${matchedDemo.account.id_akun}-${Date.now()}`,
      user: matchedDemo.account,
      source: "mock",
    };
  }

  // Also allow quick testing with "admin.demo", "admin", or "petugas"
  if (
    cleanUser === "admin.demo" ||
    cleanUser === "admin" ||
    cleanUser === "petugas"
  ) {
    if (
      password === "Admin123!" ||
      password === "password123" ||
      password === "admin" ||
      password === "demo" ||
      password.length >= 4
    ) {
      return {
        token: `mock-jwt-token-demo-${Date.now()}`,
        user: DEMO_USERS["budi.santoso"].account,
        source: "mock",
      };
    }
  }

  throw new Error(
    "Username atau password salah. Silakan periksa kembali kredensial Anda."
  );
}

export async function fetchAvailableBedsApi(): Promise<{
  items: BedItem[];
  source: "backend" | "mock";
}> {
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${API_BASE_URL}/beds/available`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped: BedItem[] = rawItems.map((b: Record<string, unknown>, idx: number) => {
            const roomNumMatch = String(b.no_bed || "").match(/(\d+)$/);
            const roomNum = roomNumMatch ? roomNumMatch[1] : String(101 + idx);
            const isVip = b.kelas_perawatan === "VIP";
            const defaultKamar = isVip ? `Suite ${roomNum.slice(-2)}` : `Kamar ${roomNum}`;
            const defaultFasilitas = isVip
              ? "1 Tempat Tidur Elektrik • AC • Sofa Penunggu • Smart TV • Kulkas"
              : "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central";

            return {
              id_bed: Number(b.id_bed || idx + 1),
              no_bed: String(b.no_bed || `BED-ANG-${101 + idx}`),
              nama_bangsal: String(b.nama_bangsal || "Anggrek 1"),
              nama_kamar: b.nama_kamar ? String(b.nama_kamar) : defaultKamar,
              kelas_perawatan: (b.kelas_perawatan as BedItem["kelas_perawatan"]) || "Kelas 1",
              tipe_bed: String(b.tipe_bed || (isVip ? "1 Bed/Rm" : "2 Bed/Rm")),
              status: "Tersedia",
              fasilitas: b.fasilitas ? String(b.fasilitas) : defaultFasilitas,
              updated_relative: "10 menit lalu",
              updated_timestamp: "Hari ini, 14:20 WIB",
              occupant: null,
            };
          });
          return { items: mapped, source: "backend" };
        }
      }
    } catch {
      // Fallback to local stateful store
    }
  }

  const allBeds = getMockBeds();
  return {
    items: allBeds.filter((b) => b.status === "Tersedia"),
    source: "mock",
  };
}

export async function fetchBedsApi(): Promise<{
  items: BedItem[];
  source: "backend" | "mock";
}> {
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${API_BASE_URL}/beds?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped: BedItem[] = rawItems.map((b: Record<string, unknown>, idx: number) => {
            const rawOccupant = b.occupant as { no_rm?: string; nama_pasien?: string } | null;
            const roomNumMatch = String(b.no_bed || "").match(/(\d+)$/);
            const roomNum = roomNumMatch ? roomNumMatch[1] : String(101 + idx);
            const isVip = b.kelas_perawatan === "VIP";
            const defaultKamar = isVip ? `Suite ${roomNum.slice(-2)}` : `Kamar ${roomNum}`;
            const defaultFasilitas = isVip
              ? "1 Tempat Tidur Elektrik • AC • Sofa Penunggu • Smart TV • Kulkas"
              : "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central";

            return {
              id_bed: Number(b.id_bed || idx + 1),
              no_bed: String(b.no_bed || `BED-ANG-${101 + idx}`),
              nama_bangsal: String(b.nama_bangsal || "Anggrek 1"),
              nama_kamar: b.nama_kamar ? String(b.nama_kamar) : defaultKamar,
              kelas_perawatan: (b.kelas_perawatan as BedItem["kelas_perawatan"]) || "Kelas 1",
              tipe_bed: String(b.tipe_bed || (isVip ? "1 Bed/Rm" : "2 Bed/Rm")),
              status: (b.status as BedStatus) || "Tersedia",
              fasilitas: b.fasilitas ? String(b.fasilitas) : defaultFasilitas,
              updated_relative: "10 menit lalu",
              updated_timestamp: "Hari ini, 14:20 WIB",
              occupant: rawOccupant
                ? {
                    no_rm: rawOccupant.no_rm || "RM-2026-00142",
                    nama_pasien: rawOccupant.nama_pasien || "Hendra Wijaya",
                    dokter_dpjp: "dr. Nanda Putra, Sp.PD",
                  }
                : null,
            };
          });
          return { items: mapped, source: "backend" };
        }
      }
    } catch {
      // Fallback to local stateful seed store
    }
  }

  return {
    items: getMockBeds(),
    source: "mock",
  };
}

export async function createBedApi(
  payload: CreateBedPayload
): Promise<BedItem> {
  if (getCurrentUserRole() === "PETUGAS_ADMINISTRASI") {
    throw new Error(
      "Akses ditolak: Petugas Administrasi tidak memiliki wewenang mendaftarkan bed baru. Wewenang ini khusus Petugas Bed Management."
    );
  }
  const beds = getMockBeds();
  const normalizedNoBed = payload.no_bed.trim().toUpperCase();

  const exists = beds.some(
    (b) => b.no_bed.toUpperCase() === normalizedNoBed
  );
  if (exists) {
    const error = new Error(
      `Nomor Bed "${normalizedNoBed}" sudah terdaftar di sistem.`
    );
    (error as Error & { code?: string }).code = "DUPLICATE_BED";
    throw error;
  }

  const roomNumMatch = normalizedNoBed.match(/(\d+)$/);
  const roomNum = roomNumMatch ? roomNumMatch[1] : "101";
  const isVip = payload.kelas_perawatan === "VIP";
  const { relative, timestamp } = formatNowTimestamp();

  const resolvedKamar =
    payload.nama_kamar || (isVip ? `Suite ${roomNum.slice(-2)}` : `Kamar ${roomNum}`);
  const resolvedFasilitas =
    payload.fasilitas ||
    (isVip
      ? "1 Tempat Tidur Elektrik, AC, Sofa Penunggu, Smart TV, Kulkas"
      : "1 Tempat Tidur, AC, Kamar Mandi Dalam, Oksigen Central");

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/beds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          no_bed: normalizedNoBed,
          nama_bangsal: payload.nama_bangsal,
          nama_kamar: resolvedKamar,
          kelas_perawatan: payload.kelas_perawatan,
          tipe_bed: payload.tipe_bed || (isVip ? "1 Bed/Rm" : "2 Bed/Rm"),
          fasilitas: resolvedFasilitas,
          status: "Tersedia",
        }),
      });
      if (res.status === 409) {
        throw new Error(`Nomor Bed "${normalizedNoBed}" sudah terdaftar.`);
      }
      if (res.ok) {
        const json = await res.json();
        const b = json.data;
        if (b) {
          const createdFromBackend: BedItem = {
            id_bed: Number(b.id_bed),
            no_bed: String(b.no_bed),
            nama_bangsal: String(b.nama_bangsal),
            nama_kamar: b.nama_kamar ? String(b.nama_kamar) : resolvedKamar,
            kelas_perawatan: (b.kelas_perawatan as BedItem["kelas_perawatan"]) || payload.kelas_perawatan,
            tipe_bed: String(b.tipe_bed || (isVip ? "1 Bed/Rm" : "2 Bed/Rm")),
            status: "Tersedia",
            fasilitas: b.fasilitas ? String(b.fasilitas) : resolvedFasilitas,
            updated_relative: relative,
            updated_timestamp: timestamp,
            occupant: null,
          };
          const updated = [createdFromBackend, ...beds];
          saveMockBeds(updated);
          return createdFromBackend;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("sudah terdaftar")) {
        throw err;
      }
      // proceed with local state update
    }
  }

  const newBed: BedItem = {
    id_bed: Math.max(0, ...beds.map((b) => b.id_bed)) + 1,
    no_bed: normalizedNoBed,
    nama_bangsal: payload.nama_bangsal,
    nama_kamar: resolvedKamar,
    kelas_perawatan: payload.kelas_perawatan,
    tipe_bed:
      payload.tipe_bed ||
      (isVip
        ? "1 Bed/Rm"
        : payload.kelas_perawatan === "Kelas 1"
        ? "2 Bed/Rm"
        : payload.kelas_perawatan === "Kelas 2"
        ? "4 Bed/Rm"
        : "6 Bed/Rm"),
    status: "Tersedia",
    fasilitas: resolvedFasilitas,
    updated_relative: relative,
    updated_timestamp: timestamp,
    occupant: null,
  };

  const updated = [newBed, ...beds];
  saveMockBeds(updated);
  return newBed;
}

export async function updateBedStatusApi(
  payload: UpdateBedStatusPayload
): Promise<BedItem> {
  if (getCurrentUserRole() === "PETUGAS_ADMINISTRASI") {
    throw new Error(
      "Akses ditolak: Petugas Administrasi tidak memiliki wewenang mengubah status master bed."
    );
  }
  const beds = getMockBeds();
  const idx = beds.findIndex((b) => b.id_bed === payload.id_bed);
  if (idx === -1) {
    throw new Error("Data tempat tidur tidak ditemukan.");
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/beds/${payload.id_bed}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: payload.status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.message) {
          throw new Error(json.message);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Terisi")) {
        throw err;
      }
      // continue local update
    }
  }

  const { relative, timestamp } = formatNowTimestamp();
  const current = beds[idx];
  const updatedBed: BedItem = {
    ...current,
    status: payload.status,
    updated_relative: relative,
    updated_timestamp: timestamp,
    occupant:
      payload.status === "Terisi"
        ? current.occupant || {
            no_rm: "RM-2026-00142",
            nama_pasien: "Hendra Wijaya",
            dokter_dpjp: "dr. Nanda Putra, Sp.PD",
          }
        : null,
  };

  beds[idx] = updatedBed;
  saveMockBeds(beds);
  return updatedBed;
}

export async function deleteBedApi(id_bed: number): Promise<void> {
  if (getCurrentUserRole() === "PETUGAS_ADMINISTRASI") {
    throw new Error(
      "Akses ditolak: Petugas Administrasi tidak memiliki wewenang menghapus data tempat tidur."
    );
  }
  const beds = getMockBeds();
  const target = beds.find((b) => b.id_bed === id_bed);
  if (!target) {
    throw new Error("Data tempat tidur tidak ditemukan.");
  }

  if (target.status === "Terisi") {
    const err = new Error(
      "Tempat tidur yang sedang ditempati pasien aktif tidak dapat dihapus."
    );
    (err as Error & { code?: string }).code = "BED_IN_USE";
    throw err;
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      await fetch(`${API_BASE_URL}/beds/${id_bed}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // continue local delete
    }
  }

  const remaining = beds.filter((b) => b.id_bed !== id_bed);
  saveMockBeds(remaining);
}

export async function createAllocationApi(
  payload: CreateAllocationPayload
): Promise<{
  bed: BedItem;
  pasien: PasienCandidate;
  waktu_alokasi: string;
}> {
  const beds = getMockBeds();
  const bedIdx = beds.findIndex((b) => b.id_bed === payload.id_bed);
  if (bedIdx === -1) {
    throw new Error("Tempat tidur tidak ditemukan.");
  }
  if (beds[bedIdx].status !== "Tersedia") {
    throw new Error(
      `Tempat tidur ${beds[bedIdx].no_bed} sudah tidak berstatus Tersedia.`
    );
  }

  const pasien =
    SEED_PATIENTS.find((p) => p.id_pasien === payload.id_pasien) ||
    SEED_PATIENTS[0];

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      await fetch(`${API_BASE_URL}/allocations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_pasien: payload.id_pasien,
          id_bed: payload.id_bed,
        }),
      });
    } catch {
      // continue local allocation update
    }
  }

  const { relative, timestamp } = formatNowTimestamp();
  const updatedBed: BedItem = {
    ...beds[bedIdx],
    status: "Terisi",
    updated_relative: relative,
    updated_timestamp: timestamp,
    occupant: {
      id_pasien: pasien.id_pasien,
      nama_pasien: pasien.nama_pasien,
      no_rm: pasien.no_rm,
      dokter_dpjp: pasien.dokter_dpjp,
      diagnosa: pasien.diagnosa_masuk,
    },
  };

  beds[bedIdx] = updatedBed;
  saveMockBeds(beds);

  return {
    bed: updatedBed,
    pasien,
    waktu_alokasi: timestamp,
  };
}
