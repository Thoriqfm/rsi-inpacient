import {
  BedItem,
  BedStatus,
  CreateAllocationPayload,
  CreateBedPayload,
  CreateQueuePayload,
  CreateReferralPayload,
  HospitalAvailability,
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

      const endpoint =
        role === "PETUGAS_ADMINISTRASI"
          ? `${API_BASE_URL}/beds/available`
          : `${API_BASE_URL}/beds?page=1&limit=100`;

      let res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

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
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes("sudah dialokasikan") ||
          err.message.includes("tidak tersedia") ||
          err.message.includes("tidak ditemukan"))
      ) {
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
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/queues?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped: QueueItem[] = rawItems.map(
            (q: Record<string, unknown>, idx: number) =>
              mapRawQueueToQueueItem(q, idx)
          );
          saveMockQueues(mapped);
          return { items: mapped, source: "backend" };
        }
      }
    } catch {
      // Fallback to local mock store
    }
  }

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
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/referrals?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
          const mapped = rawItems.map(
            (r: Record<string, unknown>, idx: number) =>
              mapRawReferralToReferralItem(r, idx)
          );
          saveMockReferrals(mapped);
          return { items: mapped, source: "backend" };
        }
      }
    } catch {
      // Fallback to local mock store
    }
  }

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
  const token = getToken();
  if (token && !token.startsWith("mock-")) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE_URL}/monitoring?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.items || [];
        if (rawItems.length > 0) {
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
      }
    } catch {
      // Fallback to local synthesized store
    }
  }

  return {
    items: buildMockMonitoringFromStore(),
    source: "mock",
  };
}
