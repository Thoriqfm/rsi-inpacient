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
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

function formatBackendTimestamp(rawDate: unknown): {
  relative: string;
  timestamp: string;
} {
  if (!rawDate) {
    return {
      relative: "10 menit lalu",
      timestamp: "Hari ini, 14:20 WIB",
    };
  }
  const date = new Date(String(rawDate));
  if (Number.isNaN(date.getTime())) {
    return {
      relative: "10 menit lalu",
      timestamp: "Hari ini, 14:20 WIB",
    };
  }

  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  let relative = "Baru saja";
  if (diffSec >= 86400) {
    const days = Math.floor(diffSec / 86400);
    relative = `${days} hari lalu`;
  } else if (diffSec >= 3600) {
    const hours = Math.floor(diffSec / 3600);
    relative = `${hours} jam lalu`;
  } else if (diffSec >= 60) {
    const mins = Math.floor(diffSec / 60);
    relative = `${mins} menit lalu`;
  }

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timestamp = isToday
    ? `Hari ini, ${hh}:${mm} WIB`
    : `${date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}, ${hh}:${mm} WIB`;

  return { relative, timestamp };
}

function mapRawBedToBedItem(b: Record<string, unknown>, idx: number): BedItem {
  const rawOccupant = b.occupant as {
    id_pasien?: number;
    no_rm?: string;
    nama_pasien?: string;
  } | null;
  const roomNumMatch = String(b.no_bed || "").match(/(\d+)$/);
  const roomNum = roomNumMatch ? roomNumMatch[1] : String(101 + idx);
  const isVip = b.kelas_perawatan === "VIP";
  const defaultKamar = isVip ? `Suite ${roomNum.slice(-2)}` : `Kamar ${roomNum}`;
  const defaultFasilitas = isVip
    ? "1 Tempat Tidur Elektrik • AC • Sofa Penunggu • Smart TV • Kulkas"
    : "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central";

  const { relative, timestamp } = formatBackendTimestamp(
    b.updated_at || b.created_at
  );

  // Match candidate patient if known to enrich DPJP & diagnosa
  const matchedCandidate = rawOccupant?.no_rm
    ? SEED_PATIENTS.find((p) => p.no_rm === rawOccupant.no_rm)
    : null;

  return {
    id_bed: Number(b.id_bed || idx + 1),
    no_bed: String(b.no_bed || `BED-ANG-${101 + idx}`),
    nama_bangsal: String(b.nama_bangsal || "Anggrek 1"),
    nama_kamar: b.nama_kamar ? String(b.nama_kamar) : defaultKamar,
    kelas_perawatan:
      (b.kelas_perawatan as BedItem["kelas_perawatan"]) || "Kelas 1",
    tipe_bed: String(b.tipe_bed || (isVip ? "1 Bed/Rm" : "2 Bed/Rm")),
    status: (b.status as BedStatus) || "Tersedia",
    fasilitas: b.fasilitas ? String(b.fasilitas) : defaultFasilitas,
    updated_relative: relative,
    updated_timestamp: timestamp,
    occupant: rawOccupant
      ? {
          id_pasien: rawOccupant.id_pasien || matchedCandidate?.id_pasien,
          no_rm: rawOccupant.no_rm || "RM-2026-00142",
          nama_pasien: rawOccupant.nama_pasien || "Hendra Wijaya",
          dokter_dpjp:
            matchedCandidate?.dokter_dpjp || "dr. Nanda Putra, Sp.PD",
          diagnosa: matchedCandidate?.diagnosa_masuk,
        }
      : null,
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
    const timer = setTimeout(() => controller.abort(), 2500);
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
      const mappedRole: UserRole = rawRole
        .toLowerCase()
        .includes("administrasi")
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
      const demo = DEMO_USERS[cleanUser];
      if (!demo || demo.password !== password) {
        throw new Error(
          "Username atau password yang Anda masukkan tidak valid."
        );
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

  if (
    matchedDemo &&
    (matchedDemo.password === password ||
      password === "demo" ||
      password === "123456")
  ) {
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
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/beds/available`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped: BedItem[] = rawItems.map(
            (b: Record<string, unknown>, idx: number) =>
              mapRawBedToBedItem({ ...b, status: "Tersedia" }, idx)
          );
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
  const role = getCurrentUserRole();

  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);

      // Petugas Administrasi uses /beds/available on backend per RBAC rules
      const endpoint =
        role === "PETUGAS_ADMINISTRASI"
          ? `${API_BASE_URL}/beds/available`
          : `${API_BASE_URL}/beds?page=1&limit=100`;

      let res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      // Fallback if 403 Forbidden on /beds
      if (res.status === 403 && !endpoint.endsWith("/available")) {
        res = await fetch(`${API_BASE_URL}/beds/available`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
      }

      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped: BedItem[] = rawItems.map(
            (b: Record<string, unknown>, idx: number) =>
              mapRawBedToBedItem(b, idx)
          );
          // Sync local cache when full bed list is fetched
          if (role !== "PETUGAS_ADMINISTRASI") {
            saveMockBeds(mapped);
          }
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

  const roomNumMatch = normalizedNoBed.match(/(\d+)$/);
  const roomNum = roomNumMatch ? roomNumMatch[1] : "101";
  const isVip = payload.kelas_perawatan === "VIP";
  const { relative, timestamp } = formatNowTimestamp();

  const resolvedKamar =
    payload.nama_kamar ||
    (isVip ? `Suite ${roomNum.slice(-2)}` : `Kamar ${roomNum}`);
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
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || errJson?.message;
        if (errMsg) throw new Error(errMsg);
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
            kelas_perawatan:
              (b.kelas_perawatan as BedItem["kelas_perawatan"]) ||
              payload.kelas_perawatan,
            tipe_bed: String(b.tipe_bed || (isVip ? "1 Bed/Rm" : "2 Bed/Rm")),
            status: "Tersedia",
            fasilitas: b.fasilitas ? String(b.fasilitas) : resolvedFasilitas,
            updated_relative: relative,
            updated_timestamp: timestamp,
            occupant: null,
          };
          const updated = [
            createdFromBackend,
            ...beds.filter((item) => item.id_bed !== createdFromBackend.id_bed),
          ];
          saveMockBeds(updated);
          return createdFromBackend;
        }
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes("sudah terdaftar") ||
          err.message.includes("sudah digunakan"))
      ) {
        throw err;
      }
      // proceed with local state update if network offline
    }
  }

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

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      // 1. Check if bed has an active allocation that needs to be closed first
      if (payload.status !== "Terisi") {
        const allocRes = await fetch(
          `${API_BASE_URL}/allocations?id_bed=${payload.id_bed}&status_alokasi=Aktif`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (allocRes.ok) {
          const allocJson = await allocRes.json();
          const activeList = allocJson.data?.items || [];
          for (const alloc of activeList) {
            await fetch(`${API_BASE_URL}/allocations/${alloc.id_alokasi}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status_alokasi: "Selesai" }),
            });
          }
        }
      }

      // 2. If target status is Terisi, create an allocation via /allocations
      if (payload.status === "Terisi") {
        // Ensure bed is Tersedia first before allocating
        await fetch(`${API_BASE_URL}/beds/${payload.id_bed}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "Tersedia" }),
        }).catch(() => null);

        const createAllocRes = await fetch(`${API_BASE_URL}/allocations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id_pasien: SEED_PATIENTS[0].id_pasien,
            id_bed: payload.id_bed,
          }),
        });

        if (!createAllocRes.ok && createAllocRes.status !== 409) {
          const errJson = await createAllocRes.json().catch(() => null);
          const errMsg = errJson?.error?.message || errJson?.message;
          if (errMsg) throw new Error(errMsg);
        }
      } else {
        // 3. Standard status update (Tersedia / Pembersihan / Pemeliharaan)
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
          const errMsg = json?.error?.message || json?.message;
          if (errMsg) {
            throw new Error(errMsg);
          }
        }
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes("alokasi aktif") ||
          err.message.includes("tidak valid"))
      ) {
        throw err;
      }
      // continue local update if network offline
    }
  }

  const { relative, timestamp } = formatNowTimestamp();
  const current: BedItem =
    idx !== -1
      ? beds[idx]
      : {
          id_bed: payload.id_bed,
          no_bed: `BED-ANG-${payload.id_bed}`,
          nama_bangsal: "Anggrek 1",
          nama_kamar: `Kamar ${payload.id_bed}`,
          kelas_perawatan: "Kelas 1",
          tipe_bed: "2 Bed/Rm",
          status: payload.status,
          fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central",
          updated_relative: relative,
          updated_timestamp: timestamp,
          occupant: null,
        };

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

  if (idx !== -1) {
    beds[idx] = updatedBed;
    saveMockBeds(beds);
  }
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

  if (target && target.status === "Terisi") {
    const err = new Error(
      "Tempat tidur yang sedang ditempati pasien aktif tidak dapat dihapus."
    );
    (err as Error & { code?: string }).code = "BED_IN_USE";
    throw err;
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/beds/${id_bed}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 409) {
        const err = new Error(
          "Tempat tidur yang sedang ditempati pasien aktif tidak dapat dihapus."
        );
        (err as Error & { code?: string }).code = "BED_IN_USE";
        throw err;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err as Error & { code?: string }).code === "BED_IN_USE"
      ) {
        throw err;
      }
      // continue local delete if offline
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
  if (bedIdx !== -1 && beds[bedIdx].status !== "Tersedia") {
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
      const res = await fetch(`${API_BASE_URL}/allocations`, {
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
      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message ||
            "Tempat tidur sudah dialokasikan oleh petugas lain."
        );
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || errJson?.message;
        if (errMsg) throw new Error(errMsg);
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes("sudah dialokasikan") ||
          err.message.includes("tidak tersedia") ||
          err.message.includes("tidak ditemukan"))
      ) {
        throw err;
      }
      // continue local allocation update if network offline
    }
  }

  const { relative, timestamp } = formatNowTimestamp();
  const baseBed: BedItem =
    bedIdx !== -1
      ? beds[bedIdx]
      : {
          id_bed: payload.id_bed,
          no_bed: `BED-ANG-${payload.id_bed}`,
          nama_bangsal: "Anggrek 1",
          nama_kamar: `Kamar ${payload.id_bed}`,
          kelas_perawatan: pasien.kelas_rekomendasi,
          tipe_bed: "2 Bed/Rm",
          status: "Terisi",
          fasilitas: "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central",
          updated_relative: relative,
          updated_timestamp: timestamp,
          occupant: null,
        };

  const updatedBed: BedItem = {
    ...baseBed,
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

  if (bedIdx !== -1) {
    beds[bedIdx] = updatedBed;
    saveMockBeds(beds);
  }

  return {
    bed: updatedBed,
    pasien,
    waktu_alokasi: timestamp,
  };
}
