import {
  BedItem,
  BedStatus,
  CreateAllocationPayload,
  CreateBedPayload,
  CreateQueuePayload,
  CreateReferralPayload,
  HospitalAvailability,
  KelasPerawatan,
  MonitoringItem,
  PasienCandidate,
  QueueItem,
  QueueStatus,
  ReferralHistoryItem,
  ReferralHospitalItem,
  ReferralItem,
  ReferralStatus,
  UpdateBedStatusPayload,
  UserAccount,
  UserRole,
} from "@/types";
import {
  buildMockMonitoringFromStore,
  DEMO_USERS,
  getMockBeds,
  getMockQueues,
  getMockReferralHospitals,
  getMockReferrals,
  INITIAL_PASIEN_CANDIDATES as SEED_PATIENTS,
  saveMockBeds,
  saveMockQueues,
  saveMockReferralHospitals,
  saveMockReferrals,
} from "./mock-fallback";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export function isStrictBackendMode(): boolean {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("rsi_strict_backend");
    if (local !== null) {
      return local === "true";
    }
  }
  return process.env.NEXT_PUBLIC_STRICT_BACKEND !== "false";
}

export function setStrictBackendMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("rsi_strict_backend", enabled ? "true" : "false");
    window.dispatchEvent(new Event("rsi_strict_mode_changed"));
  }
}

export function assertNotStrict(operationName: string): void {
  if (isStrictBackendMode()) {
    throw new Error(
      `[Strict Backend Mode] Operasi "${operationName}" gagal dijalankan ke server API Backend (${API_BASE_URL}). Pastikan server backend sedang aktif dan database terhubung.`
    );
  }
}


function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rsi_inpatient_token");
}

export async function getValidToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const currentToken = localStorage.getItem("rsi_inpatient_token");
  if (currentToken && !currentToken.startsWith("mock-")) {
    return currentToken;
  }

  // If in strict mode or token is mock/missing, attempt seamless backend auto-login
  if (isStrictBackendMode() || !currentToken || currentToken.startsWith("mock-")) {
    try {
      let username = "budi.santoso";
      const rawUser = localStorage.getItem("rsi_inpatient_user");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          if (parsed.username) username = parsed.username;
        } catch {}
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: "password123" }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const realToken = json.data?.token;
        if (realToken) {
          localStorage.setItem("rsi_inpatient_token", realToken);
          if (json.data?.user) {
            localStorage.setItem(
              "rsi_inpatient_user",
              JSON.stringify(json.data.user)
            );
          }
          return realToken;
        }
      }
    } catch {
      // Backend unreachable
    }
  }

  return currentToken;
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

function getCurrentUserName(): string {
  if (typeof window === "undefined") return "Rini Aprilianti";
  try {
    const raw = localStorage.getItem("rsi_inpatient_user");
    if (!raw) return "Rini Aprilianti";
    const u = JSON.parse(raw);
    return u?.nama_petugas || "Rini Aprilianti";
  } catch {
    return "Rini Aprilianti";
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
  const strict = isStrictBackendMode();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
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

      const rawRole = String(backendUser?.role || "").trim().toLowerCase();
      let mappedRole: UserRole = "PETUGAS_BED_MANAGEMENT";
      let roleLabel = "Petugas Bed Management";

      if (rawRole.includes("super") || rawRole === "super admin") {
        mappedRole = "SUPER_ADMIN";
        roleLabel = "Super Admin (Akses Penuh)";
      } else if (rawRole.includes("administrasi")) {
        mappedRole = "PETUGAS_ADMINISTRASI";
        roleLabel = "Petugas Administrasi";
      }

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

    // Backend returned non-200 status
    const json = await res.json().catch(() => null);
    const backendErrMsg =
      json?.error?.message ||
      json?.message ||
      (res.status === 401
        ? "Username atau password salah. Silakan periksa kembali kredensial Anda."
        : `Gagal login ke server backend (HTTP ${res.status}).`);

    if (strict) {
      throw new Error(backendErrMsg);
    }
  } catch (err: unknown) {
    if (strict) {
      if (err instanceof Error) {
        if (
          err.name === "AbortError" ||
          err.message.includes("fetch") ||
          err.message.includes("Failed to fetch") ||
          err.message.includes("network")
        ) {
          throw new Error(
            `Gagal terhubung ke API Backend (${API_BASE_URL}). Pastikan server backend sudah menyala dan database MySQL terhubung.`
          );
        }
        throw err;
      }
      throw new Error("Gagal terhubung ke API Backend.");
    }
  }

  assertNotStrict("login");

  // Fallback to Demo Accounts (Hanya aktif jika Strict Mode dinonaktifkan)
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

  // Convenience aliases for testing
  if (
    cleanUser === "admin.demo" ||
    cleanUser === "superadmin" ||
    cleanUser === "super.admin"
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
        user: DEMO_USERS["admin.demo"].account,
        source: "mock",
      };
    }
  }

  if (
    cleanUser === "rini" ||
    cleanUser === "admin" ||
    cleanUser === "administrasi"
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
        user: DEMO_USERS["rini.aprilianti"].account,
        source: "mock",
      };
    }
  }

  if (
    cleanUser === "bed" ||
    cleanUser === "bedmanagement" ||
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
  const token = await getValidToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
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

  assertNotStrict("fetchAvailableBedsApi");
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
  const token = await getValidToken();
  const role = getCurrentUserRole();

  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const endpoint = `${API_BASE_URL}/beds?page=1&limit=100`;

      let res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (res.status === 403) {
        res = await fetch(`${API_BASE_URL}/beds/available`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
      }

      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        const mapped: BedItem[] = rawItems.map(
          (b: Record<string, unknown>, idx: number) =>
            mapRawBedToBedItem(b, idx)
        );
        saveMockBeds(mapped);
        return { items: mapped, source: "backend" };
      }
    } catch {
      // Fallback to local stateful seed store
    }
  }

  assertNotStrict("fetchBedsApi");
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
    }
  }

  assertNotStrict("createBedApi");
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

      if (payload.status === "Terisi") {
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

  assertNotStrict("updateBedStatusApi");
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
    }
  }

  assertNotStrict("deleteBedApi");
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
      const bodyPayload: Record<string, unknown> = {
        id_pasien: payload.id_pasien,
        id_bed: payload.id_bed,
      };
      if (payload.id_antrean) {
        bodyPayload.id_antrean = payload.id_antrean;
      }

      const res = await fetch(`${API_BASE_URL}/allocations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
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
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data) {
          const bedItem: BedItem = {
            id_bed: data.id_bed,
            no_bed: data.bed?.no_bed || `BED-${data.id_bed}`,
            nama_bangsal: data.bed?.nama_bangsal || "Bangsal",
            nama_kamar: `Kamar ${data.id_bed}`,
            kelas_perawatan:
              (data.bed?.kelas_perawatan as KelasPerawatan) || "Kelas 1",
            tipe_bed: "Standar",
            status: "Terisi",
            fasilitas: "AC, Oksigen, Nurse Call",
            occupant: {
              id_pasien: data.id_pasien,
              nama_pasien: data.pasien?.nama_pasien || pasien.nama_pasien,
              no_rm: data.pasien?.no_rm || pasien.no_rm,
              dokter_dpjp: pasien.dokter_dpjp,
            },
            updated_relative: "Baru saja",
            updated_timestamp: new Date().toISOString(),
          };
          return {
            bed: bedItem,
            pasien,
            waktu_alokasi: formatBackendTimestamp(data.waktu_alokasi).timestamp,
          };
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
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

  assertNotStrict("createAllocationApi");
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

  // Also sync local queue status if patient had an active queue
  const queues = getMockQueues();
  const qIdx = queues.findIndex(
    (q) =>
      (payload.id_antrean && q.id_antrean === payload.id_antrean) ||
      (q.id_pasien === payload.id_pasien && q.status === "Menunggu")
  );
  if (qIdx !== -1) {
    queues[qIdx] = {
      ...queues[qIdx],
      status: "Dialokasikan",
      estimasi_tunggu: "Selesai Dialokasikan",
      alokasi_bed: {
        no_bed: updatedBed.no_bed,
        nama_bangsal: updatedBed.nama_bangsal,
        waktu_alokasi: timestamp,
      },
    };
    saveMockQueues(queues);
  }

  return {
    bed: updatedBed,
    pasien,
    waktu_alokasi: timestamp,
  };
}

// ==========================================
// UC-04: Daftar Tunggu Rawat Inap (FIFO) APIs
// ==========================================
function mapRawQueueToQueueItem(q: Record<string, unknown>, idx: number): QueueItem {
  const rawPasien = (q.pasien || {}) as Record<string, unknown>;
  const rawAkun = (q.akun || {}) as Record<string, unknown>;
  const rawAlokasi = q.rekam_alokasi as Record<string, unknown> | null;
  const rawBed = (rawAlokasi?.bed || {}) as Record<string, unknown>;

  const idPasien = Number(q.id_pasien || rawPasien.id_pasien || idx + 1);
  const noRm = String(rawPasien.no_rm || `RM-2026-0014${idx + 2}`);
  const matched =
    SEED_PATIENTS.find((p) => p.no_rm === noRm || p.id_pasien === idPasien) ||
    SEED_PATIENTS[idx % SEED_PATIENTS.length];

  const noAntrean = Number(q.no_antrean || idx + 1);
  const { relative, timestamp } = formatBackendTimestamp(
    q.waktu_masuk || q.created_at
  );
  const status = (q.status as QueueStatus) || "Menunggu";

  return {
    id_antrean: Number(q.id_antrean || idx + 1),
    no_antrean: noAntrean,
    no_antrean_formatted: `#${String(noAntrean).padStart(2, "0")}`,
    id_pasien: idPasien,
    no_rm: noRm,
    nama_pasien: String(rawPasien.nama_pasien || matched.nama_pasien),
    jenis_kelamin_usia: matched.jenis_kelamin_usia || "L, 45 thn",
    kondisi_pasien:
      rawPasien.kondisi_pasien === "Darurat" ? "Darurat" : "Stabil",
    kelas_perawatan: matched.kelas_rekomendasi || "Kelas 1",
    hak_kelas_jaminan: matched.hak_kelas_jaminan || "Kelas 1 (BPJS Kesehatan)",
    diagnosa: matched.diagnosa_masuk || "Observasi Rawat Inap",
    dokter_dpjp: matched.dokter_dpjp || "dr. Nanda Putra, Sp.PD",
    asal_instalasi: matched.asal_instalasi || "Poli Penyakit Dalam",
    catatan_tunggu:
      status === "Dialokasikan"
        ? "Telah mendapatkan alokasi kamar rawat inap."
        : "Menunggu ketersediaan kamar sesuai hak kelas pasien (FIFO).",
    waktu_masuk: String(q.waktu_masuk || new Date().toISOString()),
    waktu_masuk_formatted: timestamp,
    waktu_masuk_relative: relative,
    estimasi_tunggu:
      status === "Dialokasikan"
        ? "Selesai Dialokasikan"
        : status === "Batal"
        ? "Dibatalkan"
        : noAntrean === 1
        ? "± 20 Menit (Prioritas #1)"
        : `± ${noAntrean * 25} Menit`,
    status,
    dicatat_oleh: String(rawAkun.nama_petugas || "Rini Aprilianti"),
    alokasi_bed: rawAlokasi
      ? {
          id_alokasi: Number(rawAlokasi.id_alokasi || 1),
          no_bed: String(rawBed.no_bed || "BED-ANG-101"),
          nama_bangsal: String(rawBed.nama_bangsal || "Anggrek 1"),
          waktu_alokasi: formatBackendTimestamp(rawAlokasi.waktu_alokasi).timestamp,
        }
      : null,
  };
}

export async function fetchQueuesApi(): Promise<{
  items: QueueItem[];
  source: "backend" | "mock";
}> {
  const token = await getValidToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/queues?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        const mapped: QueueItem[] = rawItems.map(
          (q: Record<string, unknown>, idx: number) =>
            mapRawQueueToQueueItem(q, idx)
        );
        saveMockQueues(mapped);
        return { items: mapped, source: "backend" };
      }
    } catch {
      // Fallback to local mock store
    }
  }

  assertNotStrict("fetchQueuesApi");
  return {
    items: getMockQueues(),
    source: "mock",
  };
}

export async function createQueueApi(
  payload: CreateQueuePayload
): Promise<QueueItem> {
  const queues = getMockQueues();
  const pasien =
    SEED_PATIENTS.find((p) => p.id_pasien === payload.id_pasien) ||
    SEED_PATIENTS[0];

  // Check if patient already has active waiting queue locally
  const activeExisting = queues.find(
    (q) => q.id_pasien === payload.id_pasien && q.status === "Menunggu"
  );
  if (activeExisting) {
    throw new Error(
      `Pasien ${pasien.nama_pasien} (${pasien.no_rm}) sudah terdaftar dalam daftar tunggu aktif (${activeExisting.no_antrean_formatted}).`
    );
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/queues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_pasien: payload.id_pasien }),
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message || "Pasien sudah memiliki antrean aktif."
        );
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const created = mapRawQueueToQueueItem(json.data, queues.length);
          const enriched: QueueItem = {
            ...created,
            kelas_perawatan: payload.kelas_perawatan || created.kelas_perawatan,
            catatan_tunggu: payload.catatan_tunggu || created.catatan_tunggu,
          };
          const updated = [...queues, enriched];
          saveMockQueues(updated);
          return enriched;
        }
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message.includes("antrean aktif")
      ) {
        throw err;
      }
    }
  }

  const nextNo =
    queues.length > 0 ? Math.max(...queues.map((q) => q.no_antrean)) + 1 : 1;
  const { relative, timestamp } = formatNowTimestamp();

  assertNotStrict("createQueueApi");
  const newQueue: QueueItem = {
    id_antrean:
      queues.length > 0 ? Math.max(...queues.map((q) => q.id_antrean)) + 1 : 1,
    no_antrean: nextNo,
    no_antrean_formatted: `#${String(nextNo).padStart(2, "0")}`,
    id_pasien: pasien.id_pasien,
    no_rm: pasien.no_rm,
    nama_pasien: pasien.nama_pasien,
    jenis_kelamin_usia: pasien.jenis_kelamin_usia,
    kondisi_pasien: pasien.kondisi_pasien || "Stabil",
    kelas_perawatan: payload.kelas_perawatan || pasien.kelas_rekomendasi,
    hak_kelas_jaminan: pasien.hak_kelas_jaminan,
    diagnosa: pasien.diagnosa_masuk,
    dokter_dpjp: pasien.dokter_dpjp,
    asal_instalasi: pasien.asal_instalasi || "Poli Rawat Jalan",
    catatan_tunggu:
      payload.catatan_tunggu ||
      "Menunggu ketersediaan bed sesuai kelas perawatan (antrean FIFO).",
    waktu_masuk: new Date().toISOString(),
    waktu_masuk_formatted: timestamp,
    waktu_masuk_relative: relative,
    estimasi_tunggu: `± ${nextNo * 25} Menit`,
    status: "Menunggu",
    dicatat_oleh: getCurrentUserName(),
    alokasi_bed: null,
  };

  const updated = [...queues, newQueue];
  saveMockQueues(updated);
  return newQueue;
}

export async function cancelQueueApi(id_antrean: number): Promise<QueueItem> {
  const queues = getMockQueues();
  const idx = queues.findIndex((q) => q.id_antrean === id_antrean);

  if (idx !== -1 && queues[idx].status !== "Menunggu") {
    throw new Error("Hanya antrean berstatus Menunggu yang dapat dibatalkan.");
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/queues/${id_antrean}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "Batal" }),
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message ||
            "Hanya antrean Menunggu yang dapat dibatalkan."
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Hanya antrean")) {
        throw err;
      }
    }
  }

  if (idx === -1) {
    throw new Error("Data antrean tidak ditemukan.");
  }

  assertNotStrict("cancelQueueApi");
  const updatedItem: QueueItem = {
    ...queues[idx],
    status: "Batal",
    estimasi_tunggu: "Dibatalkan",
  };
  queues[idx] = updatedItem;
  saveMockQueues(queues);
  return updatedItem;
}

// ==========================================
// UC-05: Rujukan Pasien Darurat APIs
// ==========================================
function mapRawHospitalToHospitalItem(
  h: Record<string, unknown>,
  idx: number
): ReferralHospitalItem {
  const seedHospitals = getMockReferralHospitals();
  const matched =
    seedHospitals.find((s) => s.id_rs === Number(h.id_rs)) ||
    seedHospitals[idx % seedHospitals.length];

  const statusKetersediaan: HospitalAvailability =
    h.status_ketersediaan === "Tersedia" ? "Tersedia" : "Tidak Tersedia";

  const { relative } = formatBackendTimestamp(h.terakhir_diperbarui);

  return {
    id_rs: Number(h.id_rs || idx + 1),
    nama_rs: String(h.nama_rs || matched.nama_rs),
    tipe_rs: matched.tipe_rs,
    jarak_estimasi: matched.jarak_estimasi,
    alamat: String(h.alamat || matched.alamat),
    kontak: String(h.kontak || matched.kontak),
    fasilitas_unggulan: matched.fasilitas_unggulan,
    kapasitas_info:
      statusKetersediaan === "Tersedia"
        ? matched.kapasitas_info.includes("Penuh")
          ? "Tersedia: 2 Bed ICU & Ruang Isolasi Siaga"
          : matched.kapasitas_info
        : "Kapasitas ICU & Rawat Inap Penuh",
    status_ketersediaan: statusKetersediaan,
    terakhir_diperbarui: h.terakhir_diperbarui
      ? String(h.terakhir_diperbarui)
      : null,
    terakhir_diperbarui_formatted: h.terakhir_diperbarui
      ? `${relative} dikonfirmasi`
      : "Belum dikonfirmasi hari ini",
    terakhir_diperbarui_oleh: h.terakhir_diperbarui_oleh
      ? String(h.terakhir_diperbarui_oleh)
      : "Petugas Administrasi",
    stale: Boolean(h.stale),
  };
}

export async function fetchReferralHospitalsApi(): Promise<{
  items: ReferralHospitalItem[];
  source: "backend" | "mock";
}> {
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(
        `${API_BASE_URL}/referral-hospitals?page=1&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped = rawItems.map(
            (h: Record<string, unknown>, idx: number) =>
              mapRawHospitalToHospitalItem(h, idx)
          );
          saveMockReferralHospitals(mapped);
          return { items: mapped, source: "backend" };
        }
      }
    } catch {
      // Fallback to local mock store
    }
  }

  assertNotStrict("fetchReferralHospitalsApi");
  return {
    items: getMockReferralHospitals(),
    source: "mock",
  };
}

export async function updateHospitalAvailabilityApi(
  id_rs: number,
  status_ketersediaan: HospitalAvailability
): Promise<ReferralHospitalItem> {
  const hospitals = getMockReferralHospitals();
  const idx = hospitals.findIndex((h) => h.id_rs === id_rs);

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/referral-hospitals/${id_rs}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status_ketersediaan }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const updated = mapRawHospitalToHospitalItem(
            json.data,
            idx !== -1 ? idx : 0
          );
          if (idx !== -1) {
            hospitals[idx] = updated;
            saveMockReferralHospitals(hospitals);
          }
          return updated;
        }
      }
    } catch {
      // continue local update
    }
  }

  const target =
    idx !== -1 ? hospitals[idx] : getMockReferralHospitals()[0];
  assertNotStrict("updateHospitalAvailabilityApi");
  const updatedLocal: ReferralHospitalItem = {
    ...target,
    status_ketersediaan,
    kapasitas_info:
      status_ketersediaan === "Tersedia"
        ? "Tersedia: 2 Bed ICU & 3 Bed Kelas 1/2 Siaga"
        : "Kapasitas ICU & Rawat Inap Penuh",
    terakhir_diperbarui: new Date().toISOString(),
    terakhir_diperbarui_formatted: "Baru saja dikonfirmasi",
    terakhir_diperbarui_oleh: getCurrentUserName(),
    stale: false,
  };

  if (idx !== -1) {
    hospitals[idx] = updatedLocal;
    saveMockReferralHospitals(hospitals);
  }
  return updatedLocal;
}

function mapRawReferralToReferralItem(
  r: Record<string, unknown>,
  idx: number
): ReferralItem {
  const rawPasien = (r.pasien || {}) as Record<string, unknown>;
  const rawRs = (r.rumah_sakit_rujukan || {}) as Record<string, unknown>;
  const rawAkun = (r.akun || {}) as Record<string, unknown>;

  const idPasien = Number(r.id_pasien || rawPasien.id_pasien || 5);
  const noRm = String(rawPasien.no_rm || "RM-2026-00175");
  const matchedPasien =
    SEED_PATIENTS.find((p) => p.no_rm === noRm || p.id_pasien === idPasien) ||
    SEED_PATIENTS[4];

  const { timestamp } = formatBackendTimestamp(
    r.tanggal_rujukan || r.created_at
  );

  return {
    id_surat: Number(r.id_surat || idx + 1),
    no_rujukan: String(r.no_rujukan || `RUJ-20261106-00${idx + 1}`),
    id_pasien: idPasien,
    no_rm: noRm,
    nama_pasien: String(rawPasien.nama_pasien || matchedPasien.nama_pasien),
    jenis_kelamin_usia: matchedPasien.jenis_kelamin_usia || "L, 62 thn",
    kondisi_pasien: "Darurat",
    diagnosa: matchedPasien.diagnosa_masuk,
    dokter_dpjp: matchedPasien.dokter_dpjp,
    tanda_vital:
      matchedPasien.tanda_vital ||
      "TD: 160/100 mmHg • Nadi: 112x/m • RR: 26x/m • SpO2: 92%",
    id_rs: Number(r.id_rs || rawRs.id_rs || 1),
    nama_rs: String(rawRs.nama_rs || "RS Umum Daerah Sehat Sentosa"),
    alamat_rs: String(rawRs.alamat || "Jl. Melati No. 12"),
    kontak_rs: String(rawRs.kontak || "021-5550101"),
    tanggal_rujukan: String(r.tanggal_rujukan || new Date().toISOString()),
    tanggal_rujukan_formatted: timestamp,
    alasan_rujukan: String(
      r.alasan_rujukan ||
        "Kapasitas tempat tidur ICU/Rawat Inap penuh; pasien kondisi darurat memerlukan penanganan segera."
    ),
    catatan_medis:
      "Pasien telah distabilisasi awal di IGD (oksigenasi, pemasangan akses intravena, dan terapi emergensi awal).",
    status: (r.status as ReferralStatus) || "Dibuat",
    dibuat_oleh: String(rawAkun.nama_petugas || "Rini Aprilianti"),
  };
}

export async function fetchReferralsApi(): Promise<{
  items: ReferralItem[];
  source: "backend" | "mock";
}> {
  const token = await getValidToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/referrals?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        const mapped = rawItems.map(
          (r: Record<string, unknown>, idx: number) =>
            mapRawReferralToReferralItem(r, idx)
        );
        saveMockReferrals(mapped);
        return { items: mapped, source: "backend" };
      }
    } catch {
      // Fallback to local mock store
    }
  }

  assertNotStrict("fetchReferralsApi");
  return {
    items: getMockReferrals(),
    source: "mock",
  };
}

export async function createReferralApi(
  payload: CreateReferralPayload
): Promise<ReferralItem> {
  const referrals = getMockReferrals();
  const hospitals = getMockReferralHospitals();
  const pasien =
    SEED_PATIENTS.find((p) => p.id_pasien === payload.id_pasien) ||
    SEED_PATIENTS[4];
  const rs =
    hospitals.find((h) => h.id_rs === payload.id_rs) || hospitals[0];

  if (rs.status_ketersediaan !== "Tersedia") {
    throw new Error(
      `Rumah sakit tujuan (${rs.nama_rs}) saat ini berstatus Tidak Tersedia. Silakan pilih RS rujukan yang berstatus Tersedia.`
    );
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/referrals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_pasien: payload.id_pasien,
          id_rs: payload.id_rs,
          alasan_rujukan: payload.alasan_rujukan,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const created = mapRawReferralToReferralItem(
            json.data,
            referrals.length
          );
          const enriched: ReferralItem = {
            ...created,
            catatan_medis: payload.catatan_medis || created.catatan_medis,
          };
          const updated = [enriched, ...referrals];
          saveMockReferrals(updated);
          return enriched;
        }
      }
    } catch {
      // fallback to local creation
    }
  }

  const now = new Date();
  const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}`;
  const seq = String(referrals.length + 1).padStart(3, "0");
  const { timestamp } = formatNowTimestamp();

  assertNotStrict("createReferralApi");
  const newReferral: ReferralItem = {
    id_surat:
      referrals.length > 0
        ? Math.max(...referrals.map((r) => r.id_surat)) + 1
        : 1,
    no_rujukan: `RUJ-${dateCode}-${seq}`,
    id_pasien: pasien.id_pasien,
    no_rm: pasien.no_rm,
    nama_pasien: pasien.nama_pasien,
    jenis_kelamin_usia: pasien.jenis_kelamin_usia,
    kondisi_pasien: "Darurat",
    diagnosa: pasien.diagnosa_masuk,
    dokter_dpjp: pasien.dokter_dpjp,
    tanda_vital:
      pasien.tanda_vital ||
      "TD: 165/105 mmHg • Nadi: 114x/m • RR: 28x/m • SpO2: 91%",
    id_rs: rs.id_rs,
    nama_rs: rs.nama_rs,
    alamat_rs: rs.alamat,
    kontak_rs: rs.kontak,
    tanggal_rujukan: now.toISOString(),
    tanggal_rujukan_formatted: timestamp,
    alasan_rujukan: payload.alasan_rujukan,
    catatan_medis:
      payload.catatan_medis ||
      "Telah dilakukan stabilisasi awal di IGD, pemasangan akses IV line, oksigenasi, dan terapi emergensi sesuai protokol.",
    status: "Dibuat",
    dibuat_oleh: getCurrentUserName(),
  };

  const updated = [newReferral, ...referrals];
  saveMockReferrals(updated);
  return newReferral;
}

export async function updateReferralStatusApi(
  id_surat: number,
  status: ReferralStatus
): Promise<ReferralItem> {
  const referrals = getMockReferrals();
  const idx = referrals.findIndex((r) => r.id_surat === id_surat);

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/referrals/${id_surat}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message ||
            `Transisi status ke ${status} tidak diizinkan.`
        );
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const updated = mapRawReferralToReferralItem(
            json.data,
            idx !== -1 ? idx : 0
          );
          if (idx !== -1) {
            referrals[idx] = updated;
            saveMockReferrals(referrals);
          }
          return updated;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("tidak")) {
        throw err;
      }
    }
  }

  if (idx === -1) {
    throw new Error("Surat rujukan tidak ditemukan.");
  }

  assertNotStrict("updateReferralStatusApi");
  const updatedLocal: ReferralItem = {
    ...referrals[idx],
    status,
  };
  referrals[idx] = updatedLocal;
  saveMockReferrals(referrals);
  return updatedLocal;
}

export async function fetchReferralHistoryApi(
  id_surat: number
): Promise<ReferralHistoryItem[]> {
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/referrals/${id_surat}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const rawList = json.data || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          return rawList.map((row: Record<string, unknown>, idx: number) => ({
            id_log: Number(row.id_log || idx + 1),
            aksi: String(row.aksi || "STATUS_CHANGE"),
            status_sebelumnya: row.status_sebelumnya
              ? String(row.status_sebelumnya)
              : null,
            status_baru: row.status_baru ? String(row.status_baru) : "Dibuat",
            nama_petugas: row.nama_petugas
              ? String(row.nama_petugas)
              : "Rini Aprilianti",
            waktu_aksi: String(row.waktu_aksi || new Date().toISOString()),
            waktu_aksi_formatted: formatBackendTimestamp(row.waktu_aksi)
              .timestamp,
          }));
        }
      }
    } catch {
      // fallback below
    }
  }

  assertNotStrict("fetchReferralHistory");
  const ref = getMockReferrals().find((r) => r.id_surat === id_surat);
  const baseLogs: ReferralHistoryItem[] = [
    {
      id_log: 1,
      aksi: "CREATE",
      status_sebelumnya: null,
      status_baru: "Dibuat",
      nama_petugas: ref?.dibuat_oleh || "Rini Aprilianti",
      waktu_aksi: ref?.tanggal_rujukan || new Date().toISOString(),
      waktu_aksi_formatted:
        ref?.tanggal_rujukan_formatted || "Hari ini, 08:40 WIB",
    },
  ];

  if (ref && (ref.status === "Dikirim" || ref.status === "Diterima")) {
    baseLogs.push({
      id_log: 2,
      aksi: "STATUS_CHANGE",
      status_sebelumnya: "Dibuat",
      status_baru: "Dikirim",
      nama_petugas: ref.dibuat_oleh || "Rini Aprilianti",
      waktu_aksi: new Date().toISOString(),
      waktu_aksi_formatted: "Hari ini, 09:00 WIB",
    });
  }
  if (ref && ref.status === "Diterima") {
    baseLogs.push({
      id_log: 3,
      aksi: "STATUS_CHANGE",
      status_sebelumnya: "Dikirim",
      status_baru: "Diterima",
      nama_petugas: "Budi Santoso",
      waktu_aksi: new Date().toISOString(),
      waktu_aksi_formatted: "Hari ini, 09:35 WIB",
    });
  }
  if (ref && ref.status === "Batal") {
    baseLogs.push({
      id_log: 2,
      aksi: "STATUS_CHANGE",
      status_sebelumnya: "Dibuat",
      status_baru: "Batal",
      nama_petugas: ref.dibuat_oleh || "Rini Aprilianti",
      waktu_aksi: new Date().toISOString(),
      waktu_aksi_formatted: "Hari ini, 09:20 WIB",
    });
  }

  return baseLogs;
}

// ==========================================
// UC-06: Pemantauan Status Penanganan APIs
// ==========================================
export async function fetchMonitoringApi(): Promise<{
  items: MonitoringItem[];
  source: "backend" | "mock";
}> {
  const token = await getValidToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/monitoring?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        const mapped: MonitoringItem[] = rawItems.map(
          (m: Record<string, unknown>, idx: number) => {
            const idPasien = Number(m.id_pasien || idx + 1);
            const noRm = String(m.no_rm || `RM-2026-0014${idx}`);
            const matched =
              SEED_PATIENTS.find(
                (p) => p.no_rm === noRm || p.id_pasien === idPasien
              ) || SEED_PATIENTS[idx % SEED_PATIENTS.length];

            const antrean = m.antrean as MonitoringItem["antrean"];
            const rujukan = m.rujukan as MonitoringItem["rujukan"];
            const isRujukan = Boolean(rujukan && !antrean);

            const rawTime =
              rujukan?.tanggal_rujukan ||
              antrean?.waktu_masuk ||
              m.tanggal_masuk;
            const { relative, timestamp } = formatBackendTimestamp(rawTime);

            let statusPenanganan = String(
              m.status_penanganan || "Menunggu Antrean"
            );
            if (antrean) {
              statusPenanganan =
                antrean.status === "Dialokasikan"
                  ? "Rawat Inap"
                  : antrean.status === "Batal"
                  ? "Dibatalkan"
                  : "Menunggu Antrean";
            } else if (rujukan) {
              statusPenanganan =
                rujukan.status === "Diterima"
                  ? "Dirujuk (Diterima RS Tujuan)"
                  : rujukan.status === "Dikirim"
                  ? "Dalam Perjalanan Rujukan"
                  : rujukan.status === "Batal"
                  ? "Rujukan Dibatalkan"
                  : "Surat Rujukan Dibuat";
            }

            return {
              id_pasien: idPasien,
              no_rm: noRm,
              nama_pasien: String(m.nama_pasien || matched.nama_pasien),
              jenis_kelamin_usia: matched.jenis_kelamin_usia,
              kondisi_pasien:
                m.kondisi_pasien === "Darurat" || isRujukan
                  ? "Darurat"
                  : "Stabil",
              status_penanganan: statusPenanganan,
              jalur_penanganan: isRujukan
                ? "Rujukan RS Lain"
                : "Daftar Tunggu",
              diagnosa: matched.diagnosa_masuk,
              dokter_dpjp: matched.dokter_dpjp,
              kelas_perawatan: matched.kelas_rekomendasi,
              waktu_terakhir: timestamp,
              waktu_terakhir_relative: relative,
              petugas_pj:
                rujukan?.dibuat_oleh ||
                antrean?.dicatat_oleh ||
                "Rini Aprilianti",
              antrean: antrean || null,
              rujukan: rujukan || null,
            };
          }
        );
        return { items: mapped, source: "backend" };
      }
    } catch {
      // Fallback to local synthesized store
    }
  }

  assertNotStrict("fetchMonitoringApi");
  return {
    items: buildMockMonitoringFromStore(),
    source: "mock",
  };
}


// ==========================================
// UC-07: Rekap Riwayat Layanan & Tindakan Pasien APIs
// ==========================================
import type {
  BillingDetailItem,
  BillingItem,
  BillingPreviewResult,
  BillingStatus,
  CreateBillingPayload,
  CreateHistoryPayload,
  DetailRekapItem,
  HistoryPatientSummary,
  HistoryRecapItem,
  HistoryStatus,
  RmeRecordItem,
  TarifItem,
  UpdateHistoryPayload,
} from "@/types";
import {
  getMockBillings,
  getMockHistories,
  getMockRmeByPatient,
  saveMockBillings,
  saveMockHistories,
  SEED_TARIFFS,
} from "./mock-fallback";

const HISTORY_VALID_TRANSITIONS: Record<HistoryStatus, HistoryStatus[]> = {
  Draft: ["Proses Verifikasi"],
  "Proses Verifikasi": ["Siap Billing"],
  "Siap Billing": [],
};

const BILLING_VALID_TRANSITIONS: Record<BillingStatus, BillingStatus[]> = {
  Draft: ["Belum Dibayar"],
  "Belum Dibayar": ["Lunas"],
  Lunas: [],
  Batal: [],
};

function mapRawHistoryToHistoryItem(
  row: Record<string, unknown>,
  idx: number
): HistoryRecapItem {
  const rawPasien = (row.pasien || {}) as Record<string, unknown>;
  const idPasien = Number(row.id_pasien || rawPasien.id_pasien || 1);
  const noRm = String(rawPasien.no_rm || `RM-2026-0014${idx + 2}`);
  const matched =
    SEED_PATIENTS.find((p) => p.no_rm === noRm || p.id_pasien === idPasien) ||
    SEED_PATIENTS[idx % SEED_PATIENTS.length];

  const { timestamp: dibuatFormatted } = formatBackendTimestamp(
    row.tanggal_dibuat
  );
  const { timestamp: diperbaruiFormatted } = formatBackendTimestamp(
    row.tanggal_diperbarui || row.tanggal_dibuat
  );

  const rawDetails = Array.isArray(row.detail_tindakan)
    ? (row.detail_tindakan as Record<string, unknown>[])
    : [];

  const fallbackRme = getMockRmeByPatient(idPasien);

  const detailTindakan: DetailRekapItem[] =
    rawDetails.length > 0
      ? rawDetails.map((d, dIdx) => {
          const kode = String(d.kode_tindakan || "TDK-VIS-01");
          const tarif = SEED_TARIFFS.find((t) => t.kode_tindakan === kode);
          const hargaSatuan = tarif ? tarif.harga_num : 150000;
          const jumlah = Number(d.jumlah || 1);
          return {
            id_detail_rekap: Number(d.id_detail_rekap || dIdx + 1),
            id_riwayat: Number(d.id_riwayat || dIdx + 1),
            kode_tindakan: kode,
            nama_tindakan: String(d.nama_tindakan || "Tindakan Medis"),
            tanggal_tindakan: String(
              d.tanggal_tindakan || new Date().toISOString()
            ),
            tanggal_tindakan_formatted: formatBackendTimestamp(
              d.tanggal_tindakan
            ).timestamp,
            jumlah,
            harga_satuan: hargaSatuan,
            subtotal: hargaSatuan * jumlah,
          };
        })
      : fallbackRme.map((r, rIdx) => ({
          id_detail_rekap: rIdx + 1,
          id_riwayat: r.id_riwayat,
          kode_tindakan: r.kode_tindakan,
          nama_tindakan: r.nama_tindakan,
          tanggal_tindakan: r.tanggal_tindakan,
          tanggal_tindakan_formatted: r.tanggal_tindakan_formatted,
          jumlah: r.jumlah,
          harga_satuan: r.harga_estimasi || 150000,
          subtotal: (r.harga_estimasi || 150000) * r.jumlah,
        }));

  const rawTagihan = Array.isArray(row.tagihan)
    ? (row.tagihan as Record<string, unknown>[])
    : [];

  return {
    id_rekap: Number(row.id_rekap || idx + 1),
    kode_rekap: String(row.kode_rekap || `RKP-20261106-00${idx + 1}`),
    id_pasien: idPasien,
    no_rm: noRm,
    nama_pasien: String(rawPasien.nama_pasien || matched.nama_pasien),
    jenis_kelamin_usia: matched.jenis_kelamin_usia,
    kelas_perawatan: matched.kelas_rekomendasi,
    dokter_dpjp: matched.dokter_dpjp,
    diagnosa: matched.diagnosa_masuk,
    hak_kelas_jaminan: matched.hak_kelas_jaminan,
    status: (row.status as HistoryStatus) || "Draft",
    catatan: row.catatan ? String(row.catatan) : null,
    keterangan: row.keterangan ? String(row.keterangan) : null,
    tanggal_dibuat: String(row.tanggal_dibuat || new Date().toISOString()),
    tanggal_dibuat_formatted: dibuatFormatted,
    tanggal_diperbarui: row.tanggal_diperbarui
      ? String(row.tanggal_diperbarui)
      : null,
    tanggal_diperbarui_formatted: diperbaruiFormatted,
    dibuat_oleh: String(row.dibuat_oleh || "Rini Aprilianti"),
    jumlah_tindakan: Number(row.jumlah_tindakan || detailTindakan.length),
    detail_tindakan: detailTindakan,
    tagihan: rawTagihan.map((t) => ({
      id_tagihan: Number(t.id_tagihan || 1),
      no_tagihan: String(t.no_tagihan || "TGH-20261106-001"),
      status: (t.status as BillingStatus) || "Draft",
    })),
  };
}

export async function fetchHistoriesApi(params?: {
  status?: HistoryStatus;
  id_pasien?: number;
  q?: string;
}): Promise<{
  items: HistoryRecapItem[];
  source: "backend" | "mock";
}> {
  const token = await getValidToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const searchParams = new URLSearchParams({ page: "1", limit: "100" });
      if (params?.status) searchParams.set("status", params.status);
      if (params?.id_pasien)
        searchParams.set("id_pasien", String(params.id_pasien));
      if (params?.q) searchParams.set("q", params.q);

      const res = await fetch(
        `${API_BASE_URL}/histories?${searchParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        const mapped: HistoryRecapItem[] = rawItems.map(
          (r: Record<string, unknown>, idx: number) =>
            mapRawHistoryToHistoryItem(r, idx)
        );
        if (!params?.status && !params?.id_pasien && !params?.q) {
          saveMockHistories(mapped);
        }
        return { items: mapped, source: "backend" };
      }
    } catch {
      // fallback to local store
    }
  }

  assertNotStrict("fetchHistoriesApi");
  let items = getMockHistories();
  // Sync tagihan refs from mock billings
  const billings = getMockBillings();
  items = items.map((h) => ({
    ...h,
    tagihan: billings
      .filter((b) => b.id_rekap === h.id_rekap)
      .map((b) => ({
        id_tagihan: b.id_tagihan,
        no_tagihan: b.no_tagihan,
        status: b.status,
      })),
  }));

  if (params?.status) {
    items = items.filter((h) => h.status === params.status);
  }
  if (params?.id_pasien) {
    items = items.filter((h) => h.id_pasien === params.id_pasien);
  }
  if (params?.q) {
    const q = params.q.toLowerCase();
    items = items.filter(
      (h) =>
        h.kode_rekap.toLowerCase().includes(q) ||
        h.no_rm.toLowerCase().includes(q) ||
        h.nama_pasien.toLowerCase().includes(q)
    );
  }

  return { items, source: "mock" };
}

export async function fetchHistoryByIdApi(
  id_rekap: number
): Promise<HistoryRecapItem> {
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/histories/${id_rekap}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return mapRawHistoryToHistoryItem(json.data, 0);
        }
      }
    } catch {
      // fallback below
    }
  }

  assertNotStrict("fetchHistoryByIdApi");
  const histories = getMockHistories();
  const billings = getMockBillings();
  const found = histories.find((h) => h.id_rekap === id_rekap);
  if (!found) {
    throw new Error("Data rekap tindakan tidak ditemukan.");
  }

  return {
    ...found,
    tagihan: billings
      .filter((b) => b.id_rekap === found.id_rekap)
      .map((b) => ({
        id_tagihan: b.id_tagihan,
        no_tagihan: b.no_tagihan,
        status: b.status,
      })),
  };
}

export async function searchHistoryPatientsApi(
  query = ""
): Promise<HistoryPatientSummary[]> {
  const histories = getMockHistories();
  const q = query.trim().toLowerCase();

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/histories/patients?q=${encodeURIComponent(q)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          return rawItems.map((row: Record<string, unknown>, idx: number) => {
            const idPasien = Number(row.id_pasien || idx + 1);
            const matched =
              SEED_PATIENTS.find((p) => p.id_pasien === idPasien) ||
              SEED_PATIENTS[idx % SEED_PATIENTS.length];
            return {
              id_pasien: idPasien,
              no_rm: String(row.no_rm || matched.no_rm),
              nama_pasien: String(row.nama_pasien || matched.nama_pasien),
              jenis_kelamin_usia: matched.jenis_kelamin_usia,
              kelas_perawatan: matched.kelas_rekomendasi,
              hak_kelas_jaminan: matched.hak_kelas_jaminan,
              dokter_dpjp: matched.dokter_dpjp,
              diagnosa_masuk: matched.diagnosa_masuk,
              status_penanganan: String(
                row.status_penanganan || "Rawat Inap"
              ),
              tanggal_masuk_formatted: "04 Nov 2026",
              jumlah_rme: Number(
                row.jumlah_rme || getMockRmeByPatient(idPasien).length
              ),
              jumlah_rekap: Number(
                row.jumlah_rekap ||
                  histories.filter((h) => h.id_pasien === idPasien).length
              ),
            };
          });
        }
      }
    } catch {
      // fallback below
    }
  }

  assertNotStrict("searchHistoryPatientsApi");

  return SEED_PATIENTS.filter((p) => {
    if (!q) return true;
    return (
      p.nama_pasien.toLowerCase().includes(q) ||
      p.no_rm.toLowerCase().includes(q) ||
      p.diagnosa_masuk.toLowerCase().includes(q) ||
      p.dokter_dpjp.toLowerCase().includes(q)
    );
  }).map((p) => ({
    id_pasien: p.id_pasien,
    no_rm: p.no_rm,
    nama_pasien: p.nama_pasien,
    jenis_kelamin_usia: p.jenis_kelamin_usia,
    kelas_perawatan: p.kelas_rekomendasi,
    hak_kelas_jaminan: p.hak_kelas_jaminan,
    dokter_dpjp: p.dokter_dpjp,
    diagnosa_masuk: p.diagnosa_masuk,
    status_penanganan:
      p.kondisi_pasien === "Darurat" ? "Dirujuk / IGD" : "Rawat Inap Aktif",
    tanggal_masuk_formatted: "04 Nov 2026",
    jumlah_rme: getMockRmeByPatient(p.id_pasien).length,
    jumlah_rekap: histories.filter((h) => h.id_pasien === p.id_pasien).length,
  }));
}

export async function fetchPatientRmeApi(id_pasien: number): Promise<{
  pasien: PasienCandidate;
  items: RmeRecordItem[];
  rekap_existing: HistoryRecapItem[];
}> {
  const pasien =
    SEED_PATIENTS.find((p) => p.id_pasien === id_pasien) || SEED_PATIENTS[0];
  const histories = getMockHistories().filter(
    (h) => h.id_pasien === id_pasien
  );

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/histories/rme?id_pasien=${id_pasien}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped: RmeRecordItem[] = rawItems.map(
            (r: Record<string, unknown>, idx: number) => {
              const kode = String(r.kode_tindakan || "TDK-VIS-01");
              const tarif = SEED_TARIFFS.find((t) => t.kode_tindakan === kode);
              return {
                id_riwayat: Number(r.id_riwayat || idx + 1),
                id_pasien,
                kode_tindakan: kode,
                nama_tindakan: String(r.nama_tindakan || "Tindakan Medis"),
                kategori: tarif?.kategori || "Pelayanan Medis",
                tanggal_tindakan: String(
                  r.tanggal_tindakan || new Date().toISOString()
                ),
                tanggal_tindakan_formatted: formatBackendTimestamp(
                  r.tanggal_tindakan
                ).timestamp,
                jumlah: Number(r.jumlah || 1),
                keterangan: r.keterangan ? String(r.keterangan) : null,
                harga_estimasi: tarif ? tarif.harga_num : 150000,
              };
            }
          );
          return {
            pasien,
            items: mapped,
            rekap_existing: histories,
          };
        }
      }
    } catch {
      // fallback below
    }
  }

  assertNotStrict("fetchPatientRme");
  return {
    pasien,
    items: getMockRmeByPatient(id_pasien),
    rekap_existing: histories,
  };
}

export async function createHistoryApi(
  payload: CreateHistoryPayload
): Promise<HistoryRecapItem> {
  assertNotStrict("createHistoryApi");
  const histories = getMockHistories();
  const pasien =
    SEED_PATIENTS.find((p) => p.id_pasien === payload.id_pasien) ||
    SEED_PATIENTS[0];

  const allRme = getMockRmeByPatient(payload.id_pasien);
  const selectedRme =
    payload.id_riwayat && payload.id_riwayat.length > 0
      ? allRme.filter((r) => payload.id_riwayat!.includes(r.id_riwayat))
      : allRme;

  if (selectedRme.length === 0) {
    throw new Error(
      "Pilih minimal 1 tindakan RME pasien untuk membuat snapshot rekap layanan."
    );
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/histories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_pasien: payload.id_pasien,
          ...(payload.id_riwayat ? { id_riwayat: payload.id_riwayat } : {}),
          ...(payload.catatan ? { catatan: payload.catatan } : {}),
          ...(payload.keterangan ? { keterangan: payload.keterangan } : {}),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const created = mapRawHistoryToHistoryItem(
            json.data,
            histories.length
          );
          const updated = [created, ...histories];
          saveMockHistories(updated);
          return created;
        }
      }
    } catch {
      // fallback to local store
    }
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}`;
  const seq = String(histories.length + 1).padStart(3, "0");
  const { timestamp } = formatNowTimestamp();

  const newRecap: HistoryRecapItem = {
    id_rekap:
      histories.length > 0
        ? Math.max(...histories.map((h) => h.id_rekap)) + 1
        : 1,
    kode_rekap: `RKP-${dateStr}-${seq}`,
    id_pasien: pasien.id_pasien,
    no_rm: pasien.no_rm,
    nama_pasien: pasien.nama_pasien,
    jenis_kelamin_usia: pasien.jenis_kelamin_usia,
    kelas_perawatan: pasien.kelas_rekomendasi,
    dokter_dpjp: pasien.dokter_dpjp,
    diagnosa: pasien.diagnosa_masuk,
    hak_kelas_jaminan: pasien.hak_kelas_jaminan,
    status: "Draft",
    catatan:
      payload.catatan?.trim() ||
      "Snapshot awal tindakan medis & perawatan rawat inap dari RME.",
    keterangan:
      payload.keterangan?.trim() ||
      "Draft rekap tindakan menunggu verifikasi kelengkapan berkas.",
    tanggal_dibuat: now.toISOString(),
    tanggal_dibuat_formatted: timestamp,
    tanggal_diperbarui: null,
    tanggal_diperbarui_formatted: timestamp,
    dibuat_oleh: getCurrentUserName(),
    jumlah_tindakan: selectedRme.length,
    detail_tindakan: selectedRme.map((r, idx) => ({
      id_detail_rekap: Date.now() + idx,
      id_riwayat: r.id_riwayat,
      kode_tindakan: r.kode_tindakan,
      nama_tindakan: r.nama_tindakan,
      tanggal_tindakan: r.tanggal_tindakan,
      tanggal_tindakan_formatted: r.tanggal_tindakan_formatted,
      jumlah: r.jumlah,
      harga_satuan: r.harga_estimasi || 150000,
      subtotal: (r.harga_estimasi || 150000) * r.jumlah,
    })),
    tagihan: [],
  };

  const updated = [newRecap, ...histories];
  saveMockHistories(updated);
  return newRecap;
}

export async function updateHistoryApi(
  id_rekap: number,
  payload: UpdateHistoryPayload
): Promise<HistoryRecapItem> {
  assertNotStrict("updateHistoryApi");
  const histories = getMockHistories();
  const idx = histories.findIndex((h) => h.id_rekap === id_rekap);

  if (idx !== -1) {
    const current = histories[idx];
    if (current.status === "Siap Billing") {
      throw new Error(
        "Rekap berstatus Siap Billing bersifat terkunci (immutable snapshot) dan tidak dapat diubah lagi."
      );
    }
    if (payload.status && payload.status !== current.status) {
      const allowed = HISTORY_VALID_TRANSITIONS[current.status] || [];
      if (!allowed.includes(payload.status)) {
        throw new Error(
          `Transisi status tidak diizinkan: Status "${current.status}" hanya dapat maju ke "${allowed.join(
            ", "
          )}".`
        );
      }
    }
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/histories/${id_rekap}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message ||
            "Perubahan status rekap tidak diizinkan oleh aturan state machine."
        );
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const updated = mapRawHistoryToHistoryItem(
            json.data,
            idx !== -1 ? idx : 0
          );
          if (idx !== -1) {
            histories[idx] = updated;
            saveMockHistories(histories);
          }
          return updated;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("tidak")) {
        throw err;
      }
    }
  }

  if (idx === -1) {
    throw new Error("Rekap tindakan tidak ditemukan.");
  }

  const { timestamp } = formatNowTimestamp();
  const updatedLocal: HistoryRecapItem = {
    ...histories[idx],
    status: payload.status ?? histories[idx].status,
    catatan:
      payload.catatan !== undefined ? payload.catatan : histories[idx].catatan,
    keterangan:
      payload.keterangan !== undefined
        ? payload.keterangan
        : histories[idx].keterangan,
    tanggal_diperbarui: new Date().toISOString(),
    tanggal_diperbarui_formatted: timestamp,
  };

  histories[idx] = updatedLocal;
  saveMockHistories(histories);
  return updatedLocal;
}

export async function deleteHistoryApi(id_rekap: number): Promise<void> {
  const histories = getMockHistories();
  const billings = getMockBillings();
  const target = histories.find((h) => h.id_rekap === id_rekap);

  const linkedBilling = billings.find((b) => b.id_rekap === id_rekap);
  if (linkedBilling || (target && target.tagihan.length > 0)) {
    const noInv =
      linkedBilling?.no_tagihan || target?.tagihan[0]?.no_tagihan || "Aktif";
    const err = new Error(
      `Rekap tindakan ini tidak dapat dihapus karena sudah digunakan pada Tagihan (${noInv}).`
    );
    (err as Error & { code?: string }).code = "HISTORY_HAS_INVOICE";
    throw err;
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/histories/${id_rekap}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 409) {
        const err = new Error(
          "Rekap sudah digunakan pada tagihan dan tidak dapat dihapus."
        );
        (err as Error & { code?: string }).code = "HISTORY_HAS_INVOICE";
        throw err;
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err as Error & { code?: string }).code === "HISTORY_HAS_INVOICE"
      ) {
        throw err;
      }
    }
  }

  assertNotStrict("deleteHistoryApi");
  const remaining = histories.filter((h) => h.id_rekap !== id_rekap);
  saveMockHistories(remaining);
}

// ==========================================
// UC-08 & UC-09: Perhitungan Biaya & Pengelolaan Tagihan (Billing) APIs
// ==========================================
export async function fetchTariffsApi(): Promise<TarifItem[]> {
  return SEED_TARIFFS;
}

function mapRawBillingToBillingItem(
  row: Record<string, unknown>,
  idx: number
): BillingItem {
  const rawPasien = (row.pasien || {}) as Record<string, unknown>;
  const idPasien = Number(row.id_pasien || rawPasien.id_pasien || 1);
  const noRm = String(rawPasien.no_rm || `RM-2026-0014${idx + 2}`);
  const matched =
    SEED_PATIENTS.find((p) => p.no_rm === noRm || p.id_pasien === idPasien) ||
    SEED_PATIENTS[idx % SEED_PATIENTS.length];

  const { timestamp: dibuatFormatted } = formatBackendTimestamp(
    row.tanggal_dibuat
  );
  const { timestamp: diperbaruiFormatted } = formatBackendTimestamp(
    row.tanggal_diperbarui || row.tanggal_dibuat
  );

  const rawDetails = Array.isArray(row.detail_tagihan_list)
    ? (row.detail_tagihan_list as Record<string, unknown>[])
    : [];

  const detailList: BillingDetailItem[] = rawDetails.map((d, dIdx) => {
    const hargaNum = Number(d.harga_satuan || 150000);
    const jumlah = Number(d.jumlah || 1);
    const subNum = Number(d.subtotal || hargaNum * jumlah);
    const matchedTarif = SEED_TARIFFS.find(
      (t) =>
        t.id_tarif === Number(d.id_tarif) ||
        t.nama_tindakan === String(d.nama_tindakan)
    );
    return {
      id_detail_tagihan: Number(d.id_detail_tagihan || dIdx + 1),
      id_detail_rekap: Number(d.id_detail_rekap || dIdx + 1),
      id_tarif: Number(d.id_tarif || matchedTarif?.id_tarif || 1),
      kode_tindakan: String(
        d.kode_tindakan || matchedTarif?.kode_tindakan || `TDK-0${dIdx + 1}`
      ),
      nama_tindakan: String(d.nama_tindakan || "Tindakan Pelayanan"),
      tanggal_tindakan_formatted: "05 Nov 2026",
      jumlah,
      harga_satuan: hargaNum.toFixed(2),
      harga_satuan_num: hargaNum,
      subtotal: subNum.toFixed(2),
      subtotal_num: subNum,
    };
  });

  const totalNum = Number(row.total_biaya || 0);

  return {
    id_tagihan: Number(row.id_tagihan || idx + 1),
    id_pasien: idPasien,
    id_rekap: Number(row.id_rekap || 1),
    kode_rekap: String(row.kode_rekap || `RKP-20261106-00${idx + 1}`),
    no_tagihan: String(row.no_tagihan || `TGH-20261106-00${idx + 1}`),
    no_rm: noRm,
    nama_pasien: String(rawPasien.nama_pasien || matched.nama_pasien),
    jenis_kelamin_usia: matched.jenis_kelamin_usia,
    kelas_perawatan: matched.kelas_rekomendasi,
    dokter_dpjp: matched.dokter_dpjp,
    diagnosa: matched.diagnosa_masuk,
    hak_kelas_jaminan: matched.hak_kelas_jaminan,
    total_biaya: totalNum.toFixed(2),
    total_biaya_num: totalNum,
    status: (row.status as BillingStatus) || "Draft",
    catatan_penyesuaian: row.catatan_penyesuaian
      ? String(row.catatan_penyesuaian)
      : null,
    alasan_pembatalan: row.alasan_pembatalan
      ? String(row.alasan_pembatalan)
      : null,
    tanggal_dibuat: String(row.tanggal_dibuat || new Date().toISOString()),
    tanggal_dibuat_formatted: dibuatFormatted,
    tanggal_diperbarui: row.tanggal_diperbarui
      ? String(row.tanggal_diperbarui)
      : null,
    tanggal_diperbarui_formatted: diperbaruiFormatted,
    tanggal_dibatalkan: row.tanggal_dibatalkan
      ? String(row.tanggal_dibatalkan)
      : null,
    tanggal_dibatalkan_formatted: row.tanggal_dibatalkan
      ? formatBackendTimestamp(row.tanggal_dibatalkan).timestamp
      : null,
    dibuat_oleh: String(row.dibuat_oleh || "Rini Aprilianti"),
    jumlah_item: Number(row.jumlah_item || detailList.length || 1),
    detail_tagihan_list: detailList,
  };
}

export async function fetchBillingsApi(params?: {
  status?: BillingStatus;
  id_pasien?: number;
  q?: string;
}): Promise<{
  items: BillingItem[];
  source: "backend" | "mock";
}> {
  const token = await getValidToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const searchParams = new URLSearchParams({ page: "1", limit: "100" });
      if (params?.status) searchParams.set("status", params.status);
      if (params?.id_pasien)
        searchParams.set("id_pasien", String(params.id_pasien));
      if (params?.q) searchParams.set("q", params.q);

      const res = await fetch(
        `${API_BASE_URL}/billing?${searchParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        const mapped: BillingItem[] = rawItems.map(
          (b: Record<string, unknown>, idx: number) =>
            mapRawBillingToBillingItem(b, idx)
        );
        if (!params?.status && !params?.id_pasien && !params?.q) {
          saveMockBillings(mapped);
        }
        return { items: mapped, source: "backend" };
      }
    } catch {
      // fallback to local store
    }
  }

  assertNotStrict("fetchBillingsApi");
  let items = getMockBillings();
  if (params?.status) {
    items = items.filter((b) => b.status === params.status);
  }
  if (params?.id_pasien) {
    items = items.filter((b) => b.id_pasien === params.id_pasien);
  }
  if (params?.q) {
    const q = params.q.toLowerCase();
    items = items.filter(
      (b) =>
        b.no_tagihan.toLowerCase().includes(q) ||
        b.kode_rekap.toLowerCase().includes(q) ||
        b.no_rm.toLowerCase().includes(q) ||
        b.nama_pasien.toLowerCase().includes(q)
    );
  }

  return { items, source: "mock" };
}

export async function fetchBillingByIdApi(
  id_tagihan: number
): Promise<BillingItem> {
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/billing/${id_tagihan}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return mapRawBillingToBillingItem(json.data, 0);
        }
      }
    } catch {
      // fallback below
    }
  }

  assertNotStrict("fetchBillingByIdApi");
  const billings = getMockBillings();
  const found = billings.find((b) => b.id_tagihan === id_tagihan);
  if (!found) {
    throw new Error("Data tagihan tidak ditemukan.");
  }
  return found;
}

export async function previewBillingApi(
  id_rekap: number
): Promise<BillingPreviewResult> {
  assertNotStrict("previewBillingApi");
  const histories = getMockHistories();
  const rekap = histories.find((h) => h.id_rekap === id_rekap);

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/billing/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_rekap }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data) {
          const idPasien = Number(
            data.pasien?.id_pasien || rekap?.id_pasien || 1
          );
          const matched =
            SEED_PATIENTS.find((p) => p.id_pasien === idPasien) ||
            SEED_PATIENTS[0];

          const rawItems = Array.isArray(data.items) ? data.items : [];
          const items: BillingDetailItem[] = rawItems.map(
            (item: Record<string, unknown>, idx: number) => {
              const hargaNum = Number(item.harga_satuan || 150000);
              const jumlah = Number(item.jumlah || 1);
              const subNum = Number(item.subtotal || hargaNum * jumlah);
              return {
                id_detail_rekap: Number(item.id_detail_rekap || idx + 1),
                id_tarif: Number(item.id_tarif || idx + 1),
                kode_tindakan: String(item.kode_tindakan || "TDK-01"),
                nama_tindakan: String(item.nama_tindakan || "Tindakan Medis"),
                tanggal_tindakan: String(
                  item.tanggal_tindakan || new Date().toISOString()
                ),
                tanggal_tindakan_formatted: formatBackendTimestamp(
                  item.tanggal_tindakan
                ).timestamp,
                jumlah,
                harga_satuan: hargaNum.toFixed(2),
                harga_satuan_num: hargaNum,
                subtotal: subNum.toFixed(2),
                subtotal_num: subNum,
              };
            }
          );

          const totalNum = Number(data.total_biaya || 0);
          return {
            id_rekap: Number(data.id_rekap || id_rekap),
            kode_rekap: String(data.kode_rekap || rekap?.kode_rekap),
            status: (data.status as HistoryStatus) || "Siap Billing",
            pasien: {
              id_pasien: idPasien,
              no_rm: String(data.pasien?.no_rm || matched.no_rm),
              nama_pasien: String(
                data.pasien?.nama_pasien || matched.nama_pasien
              ),
              jenis_kelamin_usia: matched.jenis_kelamin_usia,
              kelas_perawatan: matched.kelas_rekomendasi,
              dokter_dpjp: matched.dokter_dpjp,
              diagnosa: matched.diagnosa_masuk,
              hak_kelas_jaminan: matched.hak_kelas_jaminan,
            },
            acuan_tarif: String(data.acuan_tarif || "tanggal_tindakan"),
            items,
            total_biaya: totalNum.toFixed(2),
            total_biaya_num: totalNum,
          };
        }
      }
    } catch {
      // fallback below
    }
  }

  if (!rekap) {
    throw new Error("Rekap tindakan tidak ditemukan.");
  }

  if (rekap.status !== "Siap Billing") {
    throw new Error(
      `Rekap ${rekap.kode_rekap} masih berstatus "${rekap.status}". Hanya rekap berstatus "Siap Billing" yang dapat dihitung biayanya.`
    );
  }

  let totalNum = 0;
  const items: BillingDetailItem[] = rekap.detail_tindakan.map((d, idx) => {
    const matchedTarif = SEED_TARIFFS.find(
      (t) => t.kode_tindakan === d.kode_tindakan
    );
    const hargaNum = matchedTarif
      ? matchedTarif.harga_num
      : d.harga_satuan || 150000;
    const subNum = hargaNum * d.jumlah;
    totalNum += subNum;

    return {
      id_detail_rekap: d.id_detail_rekap || idx + 1,
      id_tarif: matchedTarif?.id_tarif || idx + 1,
      kode_tindakan: d.kode_tindakan,
      nama_tindakan: d.nama_tindakan,
      tanggal_tindakan: d.tanggal_tindakan,
      tanggal_tindakan_formatted: d.tanggal_tindakan_formatted,
      jumlah: d.jumlah,
      harga_satuan: hargaNum.toFixed(2),
      harga_satuan_num: hargaNum,
      subtotal: subNum.toFixed(2),
      subtotal_num: subNum,
    };
  });

  return {
    id_rekap: rekap.id_rekap,
    kode_rekap: rekap.kode_rekap,
    status: rekap.status,
    pasien: {
      id_pasien: rekap.id_pasien,
      no_rm: rekap.no_rm,
      nama_pasien: rekap.nama_pasien,
      jenis_kelamin_usia: rekap.jenis_kelamin_usia,
      kelas_perawatan: rekap.kelas_perawatan,
      dokter_dpjp: rekap.dokter_dpjp,
      diagnosa: rekap.diagnosa,
      hak_kelas_jaminan: rekap.hak_kelas_jaminan,
    },
    acuan_tarif: "tanggal_tindakan",
    items,
    total_biaya: totalNum.toFixed(2),
    total_biaya_num: totalNum,
  };
}

export async function createBillingApi(
  payload: CreateBillingPayload
): Promise<BillingItem> {
  assertNotStrict("createBillingApi");
  const billings = getMockBillings();
  const activeExisting = billings.find(
    (b) => b.id_rekap === payload.id_rekap && b.status !== "Batal"
  );
  if (activeExisting) {
    throw new Error(
      `Rekap ini sudah memiliki tagihan aktif (${activeExisting.no_tagihan} - Status: ${activeExisting.status}).`
    );
  }

  const preview = await previewBillingApi(payload.id_rekap);

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/billing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_rekap: payload.id_rekap,
          ...(payload.catatan ? { catatan: payload.catatan } : {}),
        }),
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message || "Rekap sudah memiliki tagihan aktif."
        );
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const created = mapRawBillingToBillingItem(
            json.data,
            billings.length
          );
          const updated = [created, ...billings];
          saveMockBillings(updated);
          return created;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("sudah memiliki")) {
        throw err;
      }
    }
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}`;
  const seq = String(billings.length + 1).padStart(3, "0");
  const { timestamp } = formatNowTimestamp();

  const newBilling: BillingItem = {
    id_tagihan:
      billings.length > 0
        ? Math.max(...billings.map((b) => b.id_tagihan)) + 1
        : 1,
    id_pasien: preview.pasien.id_pasien,
    id_rekap: preview.id_rekap,
    kode_rekap: preview.kode_rekap,
    no_tagihan: `TGH-${dateStr}-${seq}`,
    no_rm: preview.pasien.no_rm,
    nama_pasien: preview.pasien.nama_pasien,
    jenis_kelamin_usia: preview.pasien.jenis_kelamin_usia,
    kelas_perawatan: preview.pasien.kelas_perawatan,
    dokter_dpjp: preview.pasien.dokter_dpjp,
    diagnosa: preview.pasien.diagnosa,
    hak_kelas_jaminan: preview.pasien.hak_kelas_jaminan,
    total_biaya: preview.total_biaya,
    total_biaya_num: preview.total_biaya_num,
    status: "Draft",
    catatan_penyesuaian:
      payload.catatan?.trim() ||
      "Tagihan berhasil dikalkulasi otomatis berdasarkan rekap tindakan Siap Billing dan master tarif aktif.",
    alasan_pembatalan: null,
    tanggal_dibuat: now.toISOString(),
    tanggal_dibuat_formatted: timestamp,
    tanggal_diperbarui: null,
    tanggal_diperbarui_formatted: timestamp,
    tanggal_dibatalkan: null,
    tanggal_dibatalkan_formatted: null,
    dibuat_oleh: getCurrentUserName(),
    jumlah_item: preview.items.length,
    detail_tagihan_list: preview.items.map((item, idx) => ({
      ...item,
      id_detail_tagihan: Date.now() + idx,
    })),
  };

  const updated = [newBilling, ...billings];
  saveMockBillings(updated);
  return newBilling;
}

export async function updateBillingStatusApi(
  id_tagihan: number,
  status: BillingStatus,
  catatan_penyesuaian?: string
): Promise<BillingItem> {
  assertNotStrict("updateBillingStatusApi");
  const billings = getMockBillings();
  const idx = billings.findIndex((b) => b.id_tagihan === id_tagihan);

  if (status === "Batal") {
    throw new Error(
      "Pembatalan tagihan wajib menyertakan alasan pembatalan resmi."
    );
  }

  if (idx !== -1) {
    const current = billings[idx];
    if (status !== current.status) {
      const allowed = BILLING_VALID_TRANSITIONS[current.status] || [];
      if (!allowed.includes(status)) {
        throw new Error(
          `Transisi status tidak diizinkan: Status "${current.status}" tidak dapat berubah menjadi "${status}".`
        );
      }
    }
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/billing/${id_tagihan}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message || "Perubahan status tagihan ditolak."
        );
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const updated = mapRawBillingToBillingItem(
            json.data,
            idx !== -1 ? idx : 0
          );
          if (idx !== -1) {
            billings[idx] = {
              ...updated,
              catatan_penyesuaian:
                catatan_penyesuaian ?? updated.catatan_penyesuaian,
            };
            saveMockBillings(billings);
          }
          return billings[idx] || updated;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("tidak")) {
        throw err;
      }
    }
  }

  if (idx === -1) {
    throw new Error("Tagihan tidak ditemukan.");
  }

  const { timestamp } = formatNowTimestamp();
  const updatedLocal: BillingItem = {
    ...billings[idx],
    status,
    catatan_penyesuaian:
      catatan_penyesuaian !== undefined
        ? catatan_penyesuaian
        : billings[idx].catatan_penyesuaian,
    tanggal_diperbarui: new Date().toISOString(),
    tanggal_diperbarui_formatted: timestamp,
  };

  billings[idx] = updatedLocal;
  saveMockBillings(billings);
  return updatedLocal;
}

export async function recalculateBillingApi(
  id_tagihan: number,
  catatan_penyesuaian?: string
): Promise<BillingItem> {
  assertNotStrict("recalculateBillingApi");
  const billings = getMockBillings();
  const idx = billings.findIndex((b) => b.id_tagihan === id_tagihan);

  if (idx !== -1 && billings[idx].status !== "Draft") {
    throw new Error(
      "Hanya tagihan berstatus Draft yang dapat dihitung ulang (Recalculate). Tagihan yang sudah diterbitkan telah dikunci nominalnya."
    );
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/billing/${id_tagihan}/recalculate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message ||
            "Hanya tagihan Draft yang dapat dihitung ulang."
        );
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const updated = mapRawBillingToBillingItem(
            json.data,
            idx !== -1 ? idx : 0
          );
          if (idx !== -1) {
            billings[idx] = {
              ...updated,
              catatan_penyesuaian:
                catatan_penyesuaian ?? updated.catatan_penyesuaian,
            };
            saveMockBillings(billings);
          }
          return billings[idx] || updated;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Hanya tagihan")) {
        throw err;
      }
    }
  }

  if (idx === -1) {
    throw new Error("Tagihan tidak ditemukan.");
  }

  const current = billings[idx];
  const preview = await previewBillingApi(current.id_rekap);
  const { timestamp } = formatNowTimestamp();

  const updatedLocal: BillingItem = {
    ...current,
    total_biaya: preview.total_biaya,
    total_biaya_num: preview.total_biaya_num,
    jumlah_item: preview.items.length,
    detail_tagihan_list: preview.items.map((item, dIdx) => ({
      ...item,
      id_detail_tagihan: current.detail_tagihan_list[dIdx]?.id_detail_tagihan || Date.now() + dIdx,
    })),
    catatan_penyesuaian:
      catatan_penyesuaian !== undefined
        ? catatan_penyesuaian
        : current.catatan_penyesuaian,
    tanggal_diperbarui: new Date().toISOString(),
    tanggal_diperbarui_formatted: timestamp,
  };

  billings[idx] = updatedLocal;
  saveMockBillings(billings);
  return updatedLocal;
}

export async function cancelBillingApi(
  id_tagihan: number,
  alasan: string
): Promise<BillingItem> {
  if (!alasan.trim()) {
    throw new Error("Alasan pembatalan tagihan wajib diisi.");
  }

  assertNotStrict("cancelBillingApi");
  const billings = getMockBillings();
  const idx = billings.findIndex((b) => b.id_tagihan === id_tagihan);

  if (
    idx !== -1 &&
    billings[idx].status !== "Draft" &&
    billings[idx].status !== "Belum Dibayar"
  ) {
    throw new Error(
      `Tagihan berstatus "${billings[idx].status}" sudah bersifat final dan tidak dapat dibatalkan.`
    );
  }

  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const res = await fetch(`${API_BASE_URL}/billing/${id_tagihan}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alasan: alasan.trim() }),
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error?.message || "Tagihan tidak dapat dibatalkan."
        );
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const updated = mapRawBillingToBillingItem(
            json.data,
            idx !== -1 ? idx : 0
          );
          if (idx !== -1) {
            billings[idx] = updated;
            saveMockBillings(billings);
          }
          return updated;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("tidak dapat")) {
        throw err;
      }
    }
  }

  if (idx === -1) {
    throw new Error("Tagihan tidak ditemukan.");
  }

  const { timestamp } = formatNowTimestamp();
  const nowIso = new Date().toISOString();

  const updatedLocal: BillingItem = {
    ...billings[idx],
    status: "Batal",
    alasan_pembatalan: alasan.trim(),
    tanggal_dibatalkan: nowIso,
    tanggal_dibatalkan_formatted: timestamp,
    tanggal_diperbarui: nowIso,
    tanggal_diperbarui_formatted: timestamp,
  };

  billings[idx] = updatedLocal;
  saveMockBillings(billings);
  return updatedLocal;
}
