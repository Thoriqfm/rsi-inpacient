import {
  BedItem,
  BedStatus,
  BillingDetailItem,
  BillingItem,
  BillingPreviewResult,
  BillingStatus,
  CreateAllocationPayload,
  CreateBedPayload,
  CreateBillingPayload,
  CreateHistoryPayload,
  CreateQueuePayload,
  CreateReferralPayload,
  DetailRekapItem,
  HistoryPatientSummary,
  HistoryRecapItem,
  HistoryStatus,
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
  RmeRecordItem,
  TarifItem,
  RoomTariff,
  RoomAllocation,
  UpdateBedStatusPayload,
  UpdateHistoryPayload,
  UserAccount,
  UserRole,
} from "@/types";

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
export const API_BASE_URL = RAW_API_BASE_URL.trim().replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 30000;
const USER_STORAGE_KEY = "rsi_inpatient_user";
const TOKEN_STORAGE_KEY = "rsi_inpatient_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token || token.startsWith("mock-")) return null;
  return token;
}

export async function getValidToken(): Promise<string | null> {
  return getStoredToken();
}

function getStoredUserRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.role || null;
  } catch {
    return null;
  }
}

function notifyAuthExpired(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event("rsi_auth_expired"));
}

async function apiFetch(
  path: string,
  options: RequestInit & { skipAuth?: boolean; timeoutMs?: number } = {}
): Promise<Response> {
  const { skipAuth = false, timeoutMs = REQUEST_TIMEOUT_MS, headers, ...rest } =
    options;

  const token = skipAuth ? null : getStoredToken();
  if (!skipAuth && !token) {
    notifyAuthExpired();
    throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      signal: controller.signal,
    });

    if (res.status === 401 && !skipAuth) {
      notifyAuthExpired();
      const errJson = await res.json().catch(() => null);
      throw new Error(
        errJson?.error?.message ||
          "Sesi login Anda telah berakhir. Silakan masuk kembali."
      );
    }

    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Server backend tidak merespons (timeout). Jika server baru bangkit dari mode sleep, silakan coba beberapa detik lagi."
      );
    }
    if (
      err instanceof Error &&
      (err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError") ||
        err.message.includes("fetch"))
    ) {
      throw new Error(
        `Gagal terhubung ke server API Backend (${API_BASE_URL}). Pastikan koneksi internet dan server backend aktif.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function readErrorMessage(
  res: Response,
  fallback: string
): Promise<string> {
  const json = await res.json().catch(() => null);
  return json?.error?.message || json?.message || `${fallback} (HTTP ${res.status})`;
}

function mapBackendUser(backendUser: Record<string, unknown>, fallbackUsername = ""): UserAccount {
  const name = String(backendUser?.nama_petugas || fallbackUsername || "Petugas");
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
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
    id_akun: Number(backendUser?.id_akun || 0),
    username: String(backendUser?.username || fallbackUsername),
    nama_petugas: name,
    jabatan_label: roleLabel,
    inisial: initials || "PT",
    role: mappedRole,
  };
}

function formatBackendTimestamp(rawDate: unknown): {
  relative: string;
  timestamp: string;
} {
  if (!rawDate) {
    return {
      relative: "-",
      timestamp: "-",
    };
  }
  const date = new Date(String(rawDate));
  if (Number.isNaN(date.getTime())) {
    return {
      relative: "-",
      timestamp: "-",
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

function formatGenderAge(jenisKelamin: unknown, tanggalLahir: unknown): string {
  const jk =
    jenisKelamin === "Laki-laki"
      ? "L"
      : jenisKelamin === "Perempuan"
      ? "P"
      : "";
  let ageStr = "";
  if (tanggalLahir) {
    const dob = new Date(String(tanggalLahir));
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
        age--;
      }
      if (age >= 0) ageStr = `${age} thn`;
    }
  }
  if (jk && ageStr) return `${jk}, ${ageStr}`;
  return jk || ageStr || "-";
}

function mapRawBedToBedItem(b: Record<string, unknown>, idx: number): BedItem {
  const rawOccupant = b.occupant as {
    id_pasien?: number;
    no_rm?: string;
    nama_pasien?: string;
  } | null;

  const roomNumMatch = String(b.no_bed || "").match(/(\d+)$/);
  const roomNum = roomNumMatch ? roomNumMatch[1] : String(idx + 1);
  const isVip = b.kelas_perawatan === "VIP";
  const defaultKamar = isVip ? `Suite ${roomNum.slice(-2)}` : `Kamar ${roomNum}`;
  const defaultFasilitas = isVip
    ? "1 Tempat Tidur Elektrik • AC • Sofa Penunggu • Smart TV"
    : "1 Tempat Tidur • AC • Kamar Mandi Dalam • Oksigen Central";

  const { relative, timestamp } = formatBackendTimestamp(
    b.updated_at || b.created_at
  );

  return {
    id_bed: Number(b.id_bed || idx + 1),
    no_bed: String(b.no_bed || ""),
    nama_bangsal: String(b.nama_bangsal || "-"),
    nama_kamar: b.nama_kamar ? String(b.nama_kamar) : defaultKamar,
    kelas_perawatan: (b.kelas_perawatan as KelasPerawatan) || "Kelas 1",
    tipe_bed: String(b.tipe_bed || (isVip ? "1 Bed/Rm" : "2 Bed/Rm")),
    status: (b.status as BedStatus) || "Tersedia",
    fasilitas: b.fasilitas ? String(b.fasilitas) : defaultFasilitas,
    updated_relative: relative,
    updated_timestamp: timestamp,
    occupant: rawOccupant
      ? {
          id_pasien: rawOccupant.id_pasien,
          no_rm: rawOccupant.no_rm || "-",
          nama_pasien: rawOccupant.nama_pasien || "-",
        }
      : null,
  };
}

// ==========================================
// Auth APIs
// ==========================================
export async function loginApi(
  username: string,
  password: string
): Promise<{
  token: string;
  user: UserAccount;
}> {
  const cleanUser = username.trim().toLowerCase();
  const res = await apiFetch("/auth/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ username: cleanUser, password }),
  });

  if (!res.ok) {
    const msg =
      res.status === 401
        ? "Username atau password salah. Silakan periksa kembali kredensial Anda."
        : await readErrorMessage(res, "Gagal login ke server backend");
    throw new Error(msg);
  }

  const json = await res.json();
  const backendUser = (json.data?.user || {}) as Record<string, unknown>;
  const token = String(json.data?.token || "");
  if (!token) {
    throw new Error("Respons login tidak menyertakan token autentikasi.");
  }

  return {
    token,
    user: mapBackendUser(backendUser, cleanUser),
  };
}

export async function fetchCurrentUserApi(
  explicitToken?: string
): Promise<UserAccount> {
  const token = explicitToken || getStoredToken();
  if (!token) {
    throw new Error("Token autentikasi tidak ditemukan.");
  }

  const res = await apiFetch("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal memverifikasi sesi"));
  }
  const json = await res.json();
  return mapBackendUser((json.data || {}) as Record<string, unknown>);
}

export async function logoutApi(explicitToken?: string | null): Promise<void> {
  if (!explicitToken || explicitToken.startsWith("mock-")) return;
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${explicitToken}` },
    });
  } catch {
    // Abaikan error jaringan saat logout agar pembersihan sesi lokal tetap tuntas.
  }
}

// ==========================================
// UC-02 & UC-03: Bed Management & Allocation APIs
// ==========================================
export async function fetchAvailableBedsApi(): Promise<{
  items: BedItem[];
}> {
  const res = await apiFetch("/beds/available");
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal memuat bed tersedia"));
  }
  const json = await res.json();
  const rawItems = json.data?.items || [];
  const mapped: BedItem[] = rawItems.map(
    (b: Record<string, unknown>, idx: number) =>
      mapRawBedToBedItem({ ...b, status: "Tersedia" }, idx)
  );
  return { items: mapped };
}

export async function fetchBedsApi(): Promise<{
  items: BedItem[];
}> {
  const res = await apiFetch("/beds?page=1&limit=100");

  if (res.status === 403) {
    const [availRes, allocRes] = await Promise.all([
      apiFetch("/beds/available"),
      apiFetch("/allocations?status_alokasi=Aktif&limit=100").catch(() => null),
    ]);

    if (!availRes.ok) {
      throw new Error(
        await readErrorMessage(availRes, "Gagal memuat data tempat tidur")
      );
    }

    const availJson = await availRes.json();
    const rawAvail = availJson.data?.items || [];
    const mappedAvail: BedItem[] = rawAvail.map(
      (b: Record<string, unknown>, idx: number) =>
        mapRawBedToBedItem({ ...b, status: "Tersedia" }, idx)
    );

    const mappedOccupied: BedItem[] = [];
    if (allocRes && allocRes.ok) {
      const allocJson = await allocRes.json().catch(() => null);
      const rawAllocs = allocJson?.data?.items || [];
      for (let i = 0; i < rawAllocs.length; i++) {
        const a = rawAllocs[i] as Record<string, unknown>;
        const rawBed = (a.bed || {}) as Record<string, unknown>;
        const rawPasien = (a.pasien || {}) as Record<string, unknown>;
        const idBed = Number(a.id_bed || rawBed.id_bed || 0);
        if (
          idBed > 0 &&
          !mappedAvail.some((item) => item.id_bed === idBed) &&
          !mappedOccupied.some((item) => item.id_bed === idBed)
        ) {
          mappedOccupied.push(
            mapRawBedToBedItem(
              {
                id_bed: idBed,
                no_bed: rawBed.no_bed,
                nama_bangsal: rawBed.nama_bangsal,
                kelas_perawatan: rawBed.kelas_perawatan,
                status: "Terisi",
                updated_at: a.waktu_alokasi || a.created_at,
                occupant: {
                  id_pasien: a.id_pasien,
                  no_rm: rawPasien.no_rm,
                  nama_pasien: rawPasien.nama_pasien,
                },
              },
              mappedAvail.length + i
            )
          );
        }
      }
    }

    const combined = [...mappedAvail, ...mappedOccupied].sort((a, b) =>
      a.no_bed.localeCompare(b.no_bed)
    );
    return { items: combined };
  }

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memuat data tempat tidur")
    );
  }

  const json = await res.json();
  const rawItems = json.data?.items || [];
  const mapped: BedItem[] = rawItems.map(
    (b: Record<string, unknown>, idx: number) => mapRawBedToBedItem(b, idx)
  );
  return { items: mapped };
}

export async function createBedApi(payload: CreateBedPayload): Promise<BedItem> {
  if (getStoredUserRole() === "PETUGAS_ADMINISTRASI") {
    throw new Error(
      "Akses ditolak: Petugas Administrasi tidak memiliki wewenang menambah data tempat tidur."
    );
  }

  const res = await apiFetch("/beds", {
    method: "POST",
    body: JSON.stringify({
      no_bed: payload.no_bed.trim(),
      nama_bangsal: payload.nama_bangsal.trim(),
      nama_kamar: payload.nama_kamar?.trim() || null,
      kelas_perawatan: payload.kelas_perawatan,
      tipe_bed: payload.tipe_bed?.trim() || null,
      fasilitas: payload.fasilitas?.trim() || null,
    }),
  });

  if (res.status === 409) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error?.message ||
        `Nomor tempat tidur ${payload.no_bed} sudah terdaftar di sistem.`
    );
  }
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal menyimpan bed di server")
    );
  }

  const json = await res.json();
  return mapRawBedToBedItem((json.data || {}) as Record<string, unknown>, 0);
}

export async function updateBedStatusApi(
  payload: UpdateBedStatusPayload
): Promise<BedItem> {
  if (getStoredUserRole() === "PETUGAS_ADMINISTRASI") {
    throw new Error(
      "Akses ditolak: Petugas Administrasi tidak memiliki wewenang mengubah status master bed."
    );
  }
  if (payload.status === "Terisi") {
    throw new Error(
      "Status 'Terisi' tidak dapat dipilih secara manual. Status ini hanya dihasilkan melalui proses Alokasi Kamar Pasien."
    );
  }

  let res = await apiFetch(`/beds/${payload.id_bed}`, {
    method: "PATCH",
    body: JSON.stringify({ status: payload.status }),
  });

  // Jika bed masih memiliki alokasi aktif (409 BED_IN_USE), selesaikan alokasi aktif terlebih dahulu
  if (res.status === 409) {
    const allocListRes = await apiFetch(
      `/allocations?id_bed=${payload.id_bed}&status_alokasi=Aktif&limit=5`
    ).catch(() => null);

    if (allocListRes && allocListRes.ok) {
      const allocListJson = await allocListRes.json().catch(() => null);
      const activeAllocs = allocListJson?.data?.items || [];
      for (const alloc of activeAllocs) {
        if (alloc?.id_alokasi) {
          await apiFetch(`/allocations/${alloc.id_alokasi}`, {
            method: "PATCH",
            body: JSON.stringify({ status_alokasi: "Selesai" }),
          });
        }
      }

      if (activeAllocs.length > 0) {
        if (payload.status === "Tersedia") {
          res = await apiFetch(`/beds/${payload.id_bed}`);
        } else {
          res = await apiFetch(`/beds/${payload.id_bed}`, {
            method: "PATCH",
            body: JSON.stringify({ status: payload.status }),
          });
        }
      }
    }
  }

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memperbarui status bed")
    );
  }

  const json = await res.json();
  return mapRawBedToBedItem((json.data || {}) as Record<string, unknown>, 0);
}

export async function deleteBedApi(id_bed: number): Promise<void> {
  if (getStoredUserRole() === "PETUGAS_ADMINISTRASI") {
    throw new Error(
      "Akses ditolak: Petugas Administrasi tidak memiliki wewenang menghapus data tempat tidur."
    );
  }

  const res = await apiFetch(`/beds/${id_bed}`, {
    method: "DELETE",
  });

  if (res.status === 409) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error?.message ||
        "Tempat tidur yang sedang ditempati pasien aktif tidak dapat dihapus."
    );
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal menghapus bed"));
  }
}

export async function createAllocationApi(
  payload: CreateAllocationPayload
): Promise<{
  bed: BedItem;
  pasien: PasienCandidate;
  waktu_alokasi: string;
}> {
  const bodyPayload: Record<string, unknown> = {
    id_pasien: payload.id_pasien,
    id_bed: payload.id_bed,
  };
  if (payload.id_antrean) {
    bodyPayload.id_antrean = payload.id_antrean;
  }

  const res = await apiFetch("/allocations", {
    method: "POST",
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
    throw new Error(
      await readErrorMessage(res, "Gagal mengalokasikan kamar pasien")
    );
  }

  const json = await res.json();
  const data = (json.data || {}) as Record<string, unknown>;
  const rawBed = (data.bed || {}) as Record<string, unknown>;
  const rawPasien = (data.pasien || {}) as Record<string, unknown>;

  const bedItem: BedItem = {
    id_bed: Number(data.id_bed || payload.id_bed),
    no_bed: String(rawBed.no_bed || `BED-${data.id_bed}`),
    nama_bangsal: String(rawBed.nama_bangsal || "Bangsal"),
    nama_kamar: String(rawBed.nama_kamar || `Kamar ${data.id_bed}`),
    kelas_perawatan: (rawBed.kelas_perawatan as KelasPerawatan) || "Kelas 1",
    tipe_bed: String(rawBed.tipe_bed || "Standar"),
    status: "Terisi",
    fasilitas: String(rawBed.fasilitas || "AC, Oksigen Central"),
    occupant: {
      id_pasien: Number(data.id_pasien || payload.id_pasien),
      nama_pasien: String(rawPasien.nama_pasien || "-"),
      no_rm: String(rawPasien.no_rm || "-"),
    },
    updated_relative: "Baru saja",
    updated_timestamp: formatBackendTimestamp(data.waktu_alokasi).timestamp,
  };

  const resultPasien: PasienCandidate = {
    id_pasien: Number(data.id_pasien || payload.id_pasien),
    no_rm: String(rawPasien.no_rm || "-"),
    nama_pasien: String(rawPasien.nama_pasien || "-"),
    jenis_kelamin_usia: "-",
    dokter_dpjp: "DPJP Rawat Inap",
    hak_kelas_jaminan: "BPJS / Umum",
    kelas_rekomendasi: bedItem.kelas_perawatan,
    diagnosa_masuk: "-",
    status_penanganan: "Rawat Inap",
  };

  return {
    bed: bedItem,
    pasien: resultPasien,
    waktu_alokasi: formatBackendTimestamp(data.waktu_alokasi).timestamp,
  };
}

// ==========================================
// UC-04: Daftar Tunggu Rawat Inap (FIFO) APIs
// ==========================================
function mapRawQueueToQueueItem(
  q: Record<string, unknown>,
  idx: number
): QueueItem {
  const rawPasien = (q.pasien || {}) as Record<string, unknown>;
  const rawAkun = (q.akun || {}) as Record<string, unknown>;
  const rawAlokasi = q.rekam_alokasi as Record<string, unknown> | null;
  const rawBed = (rawAlokasi?.bed || {}) as Record<string, unknown>;

  const noAntrean = Number(q.no_antrean || idx + 1);
  const { relative, timestamp } = formatBackendTimestamp(
    q.waktu_masuk || q.created_at
  );
  const status = (q.status as QueueStatus) || "Menunggu";

  return {
    id_antrean: Number(q.id_antrean || idx + 1),
    no_antrean: noAntrean,
    no_antrean_formatted: `#${String(noAntrean).padStart(2, "0")}`,
    id_pasien: Number(q.id_pasien || rawPasien.id_pasien || 0),
    no_rm: String(rawPasien.no_rm || "-"),
    nama_pasien: String(rawPasien.nama_pasien || "-"),
    jenis_kelamin_usia: formatGenderAge(
      rawPasien.jenis_kelamin,
      rawPasien.tanggal_lahir
    ),
    kondisi_pasien:
      rawPasien.kondisi_pasien === "Darurat" ? "Darurat" : "Stabil",
    kelas_perawatan: (rawBed.kelas_perawatan as KelasPerawatan) || "Kelas 1",
    hak_kelas_jaminan: "BPJS Kesehatan / Umum",
    diagnosa: "Observasi Rawat Inap",
    dokter_dpjp: "DPJP Rawat Inap",
    asal_instalasi: "IGD / Poli Rawat Jalan",
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
    dicatat_oleh: String(rawAkun.nama_petugas || "Petugas Administrasi"),
    alokasi_bed: rawAlokasi
      ? {
          id_alokasi: Number(rawAlokasi.id_alokasi || 0),
          no_bed: String(rawBed.no_bed || "-"),
          nama_bangsal: String(rawBed.nama_bangsal || "-"),
          waktu_alokasi: formatBackendTimestamp(rawAlokasi.waktu_alokasi)
            .timestamp,
        }
      : null,
  };
}

export async function fetchQueuesApi(): Promise<{
  items: QueueItem[];
}> {
  const res = await apiFetch("/queues?page=1&limit=100");
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memuat data daftar tunggu")
    );
  }
  const json = await res.json();
  const rawItems = json.data?.items || [];
  return {
    items: rawItems.map((q: Record<string, unknown>, idx: number) =>
      mapRawQueueToQueueItem(q, idx)
    ),
  };
}

export async function createQueueApi(
  payload: CreateQueuePayload
): Promise<QueueItem> {
  const res = await apiFetch("/queues", {
    method: "POST",
    body: JSON.stringify({ id_pasien: payload.id_pasien }),
  });

  if (res.status === 409) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error?.message || "Pasien sudah memiliki antrean aktif."
    );
  }
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal mendaftarkan antrean pasien")
    );
  }

  const json = await res.json();
  const created = mapRawQueueToQueueItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
  return {
    ...created,
    kelas_perawatan: payload.kelas_perawatan || created.kelas_perawatan,
    catatan_tunggu: payload.catatan_tunggu || created.catatan_tunggu,
  };
}

export async function cancelQueueApi(id_antrean: number): Promise<QueueItem> {
  const res = await apiFetch(`/queues/${id_antrean}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Batal" }),
  });

  if (res.status === 409) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error?.message ||
        "Hanya antrean Menunggu yang dapat dibatalkan."
    );
  }
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal membatalkan antrean"));
  }

  const json = await res.json();
  return mapRawQueueToQueueItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

// ==========================================
// UC-05: Rujukan Pasien Darurat APIs
// ==========================================
function mapRawHospitalToHospitalItem(
  h: Record<string, unknown>,
  idx: number
): ReferralHospitalItem {
  const statusKetersediaan: HospitalAvailability =
    h.status_ketersediaan === "Tersedia" ? "Tersedia" : "Tidak Tersedia";

  const { relative } = formatBackendTimestamp(h.terakhir_diperbarui);

  return {
    id_rs: Number(h.id_rs || idx + 1),
    nama_rs: String(h.nama_rs || "-"),
    tipe_rs: "Rumah Sakit Jejaring SPGDT",
    jarak_estimasi: "-",
    alamat: String(h.alamat || "-"),
    kontak: String(h.kontak || "-"),
    fasilitas_unggulan: ["IGD 24 Jam", "ICU / HCU", "Rawat Inap"],
    kapasitas_info:
      statusKetersediaan === "Tersedia"
        ? "Kapasitas Tersedia (Siaga Rujukan)"
        : "Kapasitas Penuh / Tidak Tersedia",
    status_ketersediaan: statusKetersediaan,
    terakhir_diperbarui: h.terakhir_diperbarui
      ? String(h.terakhir_diperbarui)
      : null,
    terakhir_diperbarui_formatted: h.terakhir_diperbarui
      ? `${relative} dikonfirmasi`
      : "Belum dikonfirmasi",
    terakhir_diperbarui_oleh: h.terakhir_diperbarui_oleh
      ? String(h.terakhir_diperbarui_oleh)
      : "Petugas Administrasi",
    stale: Boolean(h.stale),
  };
}

export async function fetchReferralHospitalsApi(): Promise<{
  items: ReferralHospitalItem[];
}> {
  const res = await apiFetch("/referral-hospitals?page=1&limit=50");
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memuat daftar RS rujukan")
    );
  }
  const json = await res.json();
  const rawItems = json.data?.items || [];
  return {
    items: rawItems.map((h: Record<string, unknown>, idx: number) =>
      mapRawHospitalToHospitalItem(h, idx)
    ),
  };
}

export async function updateHospitalAvailabilityApi(
  id_rs: number,
  status_ketersediaan: HospitalAvailability
): Promise<ReferralHospitalItem> {
  const res = await apiFetch(`/referral-hospitals/${id_rs}/availability`, {
    method: "PATCH",
    body: JSON.stringify({ status_ketersediaan }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memperbarui status RS rujukan")
    );
  }

  const json = await res.json();
  return mapRawHospitalToHospitalItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

function mapRawReferralToReferralItem(
  r: Record<string, unknown>,
  idx: number
): ReferralItem {
  const rawPasien = (r.pasien || {}) as Record<string, unknown>;
  const rawRs = (r.rumah_sakit_rujukan || {}) as Record<string, unknown>;
  const rawAkun = (r.akun || {}) as Record<string, unknown>;

  const { timestamp } = formatBackendTimestamp(
    r.tanggal_rujukan || r.created_at
  );

  return {
    id_surat: Number(r.id_surat || idx + 1),
    no_rujukan: String(r.no_rujukan || "-"),
    id_pasien: Number(r.id_pasien || rawPasien.id_pasien || 0),
    no_rm: String(rawPasien.no_rm || "-"),
    nama_pasien: String(rawPasien.nama_pasien || "-"),
    jenis_kelamin_usia: formatGenderAge(
      rawPasien.jenis_kelamin,
      rawPasien.tanggal_lahir
    ),
    kondisi_pasien:
      rawPasien.kondisi_pasien === "Stabil" ? "Stabil" : "Darurat",
    diagnosa: "Kondisi Darurat (SPGDT)",
    dokter_dpjp: "DPJP IGD",
    tanda_vital: "Terpantau di IGD",
    id_rs: Number(r.id_rs || rawRs.id_rs || 0),
    nama_rs: String(rawRs.nama_rs || "-"),
    alamat_rs: String(rawRs.alamat || "-"),
    kontak_rs: String(rawRs.kontak || "-"),
    tanggal_rujukan: String(r.tanggal_rujukan || new Date().toISOString()),
    tanggal_rujukan_formatted: timestamp,
    alasan_rujukan: String(r.alasan_rujukan || "-"),
    catatan_medis: String(r.alasan_rujukan || "-"),
    status: (r.status as ReferralStatus) || "Dibuat",
    dibuat_oleh: String(rawAkun.nama_petugas || "Petugas Administrasi"),
  };
}

export async function fetchReferralsApi(): Promise<{
  items: ReferralItem[];
}> {
  const res = await apiFetch("/referrals?page=1&limit=100");
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal memuat data rujukan"));
  }
  const json = await res.json();
  const rawItems = json.data?.items || [];
  return {
    items: rawItems.map((r: Record<string, unknown>, idx: number) =>
      mapRawReferralToReferralItem(r, idx)
    ),
  };
}

export async function createReferralApi(
  payload: CreateReferralPayload
): Promise<ReferralItem> {
  const res = await apiFetch("/referrals", {
    method: "POST",
    body: JSON.stringify({
      id_pasien: payload.id_pasien,
      id_rs: payload.id_rs,
      alasan_rujukan: payload.alasan_rujukan,
    }),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal menerbitkan rujukan"));
  }

  const json = await res.json();
  const created = mapRawReferralToReferralItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
  return {
    ...created,
    catatan_medis: payload.catatan_medis || created.catatan_medis,
  };
}

export async function updateReferralStatusApi(
  id_surat: number,
  status: ReferralStatus
): Promise<ReferralItem> {
  const res = await apiFetch(`/referrals/${id_surat}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  if (res.status === 409) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error?.message ||
        `Transisi status ke ${status} tidak diizinkan.`
    );
  }
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memperbarui status rujukan")
    );
  }

  const json = await res.json();
  return mapRawReferralToReferralItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function fetchReferralHistoryApi(
  id_surat: number
): Promise<ReferralHistoryItem[]> {
  const res = await apiFetch(`/referrals/${id_surat}/history`);
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memuat riwayat rujukan")
    );
  }

  const json = await res.json();
  const rawList = Array.isArray(json.data?.items)
    ? json.data.items
    : Array.isArray(json.data)
      ? json.data
      : [];

  return rawList.map((row: Record<string, unknown>, idx: number) => ({
    id_log: Number(row.id_log || idx + 1),
    aksi: String(row.aksi || "STATUS_CHANGE"),
    status_sebelumnya: row.status_sebelumnya
      ? String(row.status_sebelumnya)
      : null,
    status_baru: row.status_baru ? String(row.status_baru) : "Dibuat",
    nama_petugas: row.nama_petugas ? String(row.nama_petugas) : "Petugas",
    waktu_aksi: String(row.waktu_aksi || new Date().toISOString()),
    waktu_aksi_formatted: formatBackendTimestamp(row.waktu_aksi).timestamp,
  }));
}

// ==========================================
// UC-06: Pemantauan Status Penanganan APIs
// ==========================================
export async function fetchMonitoringApi(): Promise<{
  items: MonitoringItem[];
}> {
  const res = await apiFetch("/monitoring?page=1&limit=100");
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memuat pemantauan status pasien")
    );
  }

  const json = await res.json();
  const rawItems = json.data?.items || [];
  const mapped: MonitoringItem[] = rawItems.map(
    (m: Record<string, unknown>, idx: number) => {
      const antrean = m.antrean as MonitoringItem["antrean"];
      const rujukan = m.rujukan as MonitoringItem["rujukan"];
      const isRujukan = Boolean(rujukan && !antrean);

      const rawTime =
        rujukan?.tanggal_rujukan || antrean?.waktu_masuk || m.tanggal_masuk;
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
        id_pasien: Number(m.id_pasien || idx + 1),
        no_rm: String(m.no_rm || "-"),
        nama_pasien: String(m.nama_pasien || "-"),
        jenis_kelamin_usia: formatGenderAge(m.jenis_kelamin, m.tanggal_lahir),
        kondisi_pasien:
          m.kondisi_pasien === "Darurat" || isRujukan ? "Darurat" : "Stabil",
        status_penanganan: statusPenanganan,
        jalur_penanganan: isRujukan ? "Rujukan RS Lain" : "Daftar Tunggu",
        diagnosa: isRujukan ? "Penanganan Darurat (Rujukan)" : "Rawat Inap",
        dokter_dpjp: "DPJP Penanggung Jawab",
        kelas_perawatan:
          (antrean?.alokasi?.bed?.kelas_perawatan as KelasPerawatan) ||
          "Kelas 1",
        waktu_terakhir: timestamp,
        waktu_terakhir_relative: relative,
        petugas_pj:
          rujukan?.dibuat_oleh ||
          antrean?.dicatat_oleh ||
          "Petugas Administrasi",
        antrean: antrean || null,
        rujukan: rujukan || null,
      };
    }
  );
  return { items: mapped };
}

// ==========================================
// UC-07: Rekap Riwayat Layanan & Tindakan Pasien APIs
// ==========================================
function mapRawHistoryToHistoryItem(
  row: Record<string, unknown>,
  idx: number
): HistoryRecapItem {
  const rawPasien = (row.pasien || {}) as Record<string, unknown>;
  const idPasien = Number(row.id_pasien || rawPasien.id_pasien || 0);

  const { timestamp: dibuatFormatted } = formatBackendTimestamp(
    row.tanggal_dibuat
  );
  const { timestamp: diperbaruiFormatted } = formatBackendTimestamp(
    row.tanggal_diperbarui || row.tanggal_dibuat
  );

  const rawDetails = Array.isArray(row.detail_tindakan)
    ? (row.detail_tindakan as Record<string, unknown>[])
    : [];

  const detailTindakan: DetailRekapItem[] = rawDetails.map((d, dIdx) => ({
    id_detail_rekap: Number(d.id_detail_rekap || dIdx + 1),
    id_riwayat: Number(d.id_riwayat || dIdx + 1),
    kode_tindakan: String(d.kode_tindakan || "-"),
    nama_tindakan: String(d.nama_tindakan || "Tindakan Medis"),
    tanggal_tindakan: String(
      d.tanggal_tindakan || new Date().toISOString()
    ),
    tanggal_tindakan_formatted: formatBackendTimestamp(d.tanggal_tindakan)
      .timestamp,
    jumlah: Number(d.jumlah || 1),
  }));

  const rawTagihan = Array.isArray(row.tagihan)
    ? (row.tagihan as Record<string, unknown>[])
    : [];

  return {
    id_rekap: Number(row.id_rekap || idx + 1),
    kode_rekap: String(row.kode_rekap || "-"),
    id_pasien: idPasien,
    no_rm: String(rawPasien.no_rm || "-"),
    nama_pasien: String(rawPasien.nama_pasien || "-"),
    jenis_kelamin_usia: formatGenderAge(
      rawPasien.jenis_kelamin,
      rawPasien.tanggal_lahir
    ),
    kelas_perawatan: "Kelas 1",
    dokter_dpjp: "DPJP Rawat Inap",
    diagnosa: "Pelayanan Rawat Inap",
    hak_kelas_jaminan: "BPJS Kesehatan / Umum",
    status: (row.status as HistoryStatus) || "Draft",
    catatan: row.catatan ? String(row.catatan) : null,
    keterangan: row.keterangan ? String(row.keterangan) : null,
    tanggal_dibuat: String(row.tanggal_dibuat || new Date().toISOString()),
    tanggal_dibuat_formatted: dibuatFormatted,
    tanggal_diperbarui: row.tanggal_diperbarui
      ? String(row.tanggal_diperbarui)
      : null,
    tanggal_diperbarui_formatted: diperbaruiFormatted,
    dibuat_oleh: String(row.dibuat_oleh || "Petugas Administrasi"),
    diperbarui_oleh: String(
      row.diperbarui_oleh || row.dibuat_oleh || "Petugas Administrasi"
    ),
    jumlah_tindakan: Number(row.jumlah_tindakan ?? detailTindakan.length),
    detail_tindakan: detailTindakan,
    tagihan: rawTagihan.map((t) => ({
      id_tagihan: Number(t.id_tagihan || 0),
      no_tagihan: String(t.no_tagihan || "-"),
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
}> {
  const searchParams = new URLSearchParams({ page: "1", limit: "100" });
  if (params?.status) searchParams.set("status", params.status);
  if (params?.id_pasien) searchParams.set("id_pasien", String(params.id_pasien));
  if (params?.q) searchParams.set("q", params.q);

  const res = await apiFetch(`/histories?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memuat daftar rekap tindakan")
    );
  }
  const json = await res.json();
  const rawItems = json.data?.items || [];
  return {
    items: rawItems.map((r: Record<string, unknown>, idx: number) =>
      mapRawHistoryToHistoryItem(r, idx)
    ),
  };
}

export async function fetchHistoryByIdApi(
  id_rekap: number
): Promise<HistoryRecapItem> {
  const res = await apiFetch(`/histories/${id_rekap}`);
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Data rekap tindakan tidak ditemukan")
    );
  }
  const json = await res.json();
  return mapRawHistoryToHistoryItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function searchHistoryPatientsApi(
  query = ""
): Promise<HistoryPatientSummary[]> {
  const q = query.trim();
  const queryStr = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await apiFetch(`/histories/patients${queryStr}`);
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal mencari data pasien")
    );
  }

  const json = await res.json();
  const rawItems = json.data?.items || json.data || [];
  return rawItems.map((row: Record<string, unknown>, idx: number) => ({
    id_pasien: Number(row.id_pasien || idx + 1),
    no_rm: String(row.no_rm || "-"),
    nama_pasien: String(row.nama_pasien || "-"),
    jenis_kelamin_usia: formatGenderAge(row.jenis_kelamin, row.tanggal_lahir),
    kelas_perawatan: "Kelas 1",
    hak_kelas_jaminan: "BPJS Kesehatan / Umum",
    dokter_dpjp: "DPJP Rawat Inap",
    diagnosa_masuk: "Pelayanan Rawat Inap",
    kondisi_pasien:
      row.kondisi_pasien === "Darurat"
        ? "Darurat"
        : row.kondisi_pasien === "Stabil"
        ? "Stabil"
        : "Stabil",
    status_penanganan: String(row.status_penanganan || "Terdaftar"),
    tanggal_masuk_formatted: row.tanggal_masuk
      ? formatBackendTimestamp(row.tanggal_masuk).timestamp
      : "-",
    jumlah_rme: Number(row.jumlah_rme ?? 0),
    jumlah_rekap: Number(row.jumlah_rekap ?? 0),
  }));
}

export async function fetchPatientRmeApi(id_pasien: number): Promise<{
  pasien: PasienCandidate;
  items: RmeRecordItem[];
  rekap_existing: HistoryRecapItem[];
}> {
  const res = await apiFetch(`/histories/rme?id_pasien=${id_pasien}`);
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memuat data RME pasien")
    );
  }

  const json = await res.json();
  const rawItems = json.data?.items || [];
  const rawPasien = (json.data?.pasien || {}) as Record<string, unknown>;

  const resolvedPasien: PasienCandidate = {
    id_pasien: Number(rawPasien.id_pasien || id_pasien),
    no_rm: String(rawPasien.no_rm || "-"),
    nama_pasien: String(rawPasien.nama_pasien || "-"),
    jenis_kelamin_usia: formatGenderAge(
      rawPasien.jenis_kelamin,
      rawPasien.tanggal_lahir
    ),
    dokter_dpjp: "DPJP Rawat Inap",
    hak_kelas_jaminan: "BPJS Kesehatan / Umum",
    kelas_rekomendasi: "Kelas 1",
    diagnosa_masuk: "Pelayanan Rawat Inap",
    kondisi_pasien:
      rawPasien.kondisi_pasien === "Darurat" ? "Darurat" : "Stabil",
    status_penanganan: String(rawPasien.status_penanganan || "Terdaftar"),
  };

  const mapped: RmeRecordItem[] = rawItems.map(
    (r: Record<string, unknown>, idx: number) => ({
      id_riwayat: Number(r.id_riwayat || idx + 1),
      id_pasien,
      kode_tindakan: String(r.kode_tindakan || "-"),
      nama_tindakan: String(r.nama_tindakan || "Tindakan Medis"),
      kategori: "Pelayanan Medis",
      tanggal_tindakan: String(r.tanggal_tindakan || new Date().toISOString()),
      tanggal_tindakan_formatted: formatBackendTimestamp(r.tanggal_tindakan)
        .timestamp,
      jumlah: Number(r.jumlah || 1),
      keterangan: r.keterangan ? String(r.keterangan) : null,
    })
  );

  let rekapExisting: HistoryRecapItem[] = [];
  const existingRes = await apiFetch(`/histories?id_pasien=${id_pasien}`).catch(
    () => null
  );
  if (existingRes && existingRes.ok) {
    const existingJson = await existingRes.json();
    const rawList = existingJson.data?.items || [];
    rekapExisting = rawList.map((row: Record<string, unknown>, idx: number) =>
      mapRawHistoryToHistoryItem(row, idx)
    );
  }

  return {
    pasien: resolvedPasien,
    items: mapped,
    rekap_existing: rekapExisting,
  };
}

export async function createHistoryApi(
  payload: CreateHistoryPayload
): Promise<HistoryRecapItem> {
  const res = await apiFetch("/histories", {
    method: "POST",
    body: JSON.stringify({
      id_pasien: payload.id_pasien,
      ...(payload.id_riwayat ? { id_riwayat: payload.id_riwayat } : {}),
      ...(payload.catatan ? { catatan: payload.catatan } : {}),
      ...(payload.keterangan ? { keterangan: payload.keterangan } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal membuat rekap tindakan")
    );
  }

  const json = await res.json();
  return mapRawHistoryToHistoryItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function updateHistoryApi(
  id_rekap: number,
  payload: UpdateHistoryPayload
): Promise<HistoryRecapItem> {
  const res = await apiFetch(`/histories/${id_rekap}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error?.message ||
        "Perubahan status rekap tidak diizinkan oleh aturan state machine."
    );
  }
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal memperbarui rekap tindakan")
    );
  }

  const json = await res.json();
  return mapRawHistoryToHistoryItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function deleteHistoryApi(id_rekap: number): Promise<void> {
  const res = await apiFetch(`/histories/${id_rekap}`, {
    method: "DELETE",
  });

  if (res.status === 409) {
    const errJson = await res.json().catch(() => null);
    throw new Error(
      errJson?.error?.message ||
        "Rekap sudah digunakan pada tagihan dan tidak dapat dihapus."
    );
  }
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal menghapus rekap tindakan")
    );
  }
}

// ==========================================
// UC-08 & UC-09: Perhitungan Biaya & Pengelolaan Tagihan (Billing) APIs
// ==========================================
export async function fetchTariffsApi(): Promise<TarifItem[]> {
  const res = await apiFetch("/billing/tariffs");
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal memuat master tarif"));
  }
  const json = await res.json();
  const rawItems = json.data?.items || [];
  return rawItems.map((t: Record<string, unknown>, idx: number) => {
    const hargaNum = Number(t.harga || 0);
    return {
      id_tarif: Number(t.id_tarif || idx + 1),
      kode_tindakan: String(t.kode_tindakan || "-"),
      nama_tindakan: String(t.nama_tindakan || "Tindakan Medis"),
      kategori: "Pelayanan Medis",
      harga: hargaNum.toFixed(2),
      harga_num: hargaNum,
      tanggal_berlaku: String(t.tanggal_berlaku || ""),
      tanggal_berakhir: t.tanggal_berakhir ? String(t.tanggal_berakhir) : null,
      status: (t.status as "Aktif" | "Nonaktif") || "Aktif",
    };
  });
}

function mapRawBillingToBillingItem(
  row: Record<string, unknown>,
  idx: number
): BillingItem {
  const rawPasien = (row.pasien || {}) as Record<string, unknown>;

  const { timestamp: dibuatFormatted } = formatBackendTimestamp(
    row.tanggal_dibuat
  );
  const { timestamp: diperbaruiFormatted } = formatBackendTimestamp(
    row.tanggal_diperbarui || row.tanggal_dibuat
  );

  const rawDetails = Array.isArray(row.detail_tagihan_list)
    ? (row.detail_tagihan_list as Record<string, unknown>[])
    : [];

  const detailList = rawDetails.map((item, idx) => mapBillingDetail(item, idx, dibuatFormatted));

  const totalNum = Number(row.total_biaya || 0);

  return {
    id_tagihan: Number(row.id_tagihan || idx + 1),
    id_pasien: Number(row.id_pasien || rawPasien.id_pasien || 0),
    id_rekap: Number(row.id_rekap || 0),
    kode_rekap: String(row.kode_rekap || "-"),
    no_tagihan: String(row.no_tagihan || "-"),
    no_rm: String(rawPasien.no_rm || "-"),
    nama_pasien: String(rawPasien.nama_pasien || "-"),
    jenis_kelamin_usia: formatGenderAge(
      rawPasien.jenis_kelamin,
      rawPasien.tanggal_lahir
    ),
    kelas_perawatan: "Kelas 1",
    dokter_dpjp: "DPJP Rawat Inap",
    diagnosa: "Pelayanan Rawat Inap",
    hak_kelas_jaminan: "BPJS Kesehatan / Umum",
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
    dibuat_oleh: String(row.dibuat_oleh || "Petugas Administrasi"),
    jumlah_item: Number(row.jumlah_item ?? detailList.length),
    detail_tagihan_list: detailList,
  };
}

export async function fetchBillingsApi(params?: {
  status?: BillingStatus;
  id_pasien?: number;
  q?: string;
}): Promise<{
  items: BillingItem[];
}> {
  const searchParams = new URLSearchParams({ page: "1", limit: "100" });
  if (params?.status) searchParams.set("status", params.status);
  if (params?.id_pasien) searchParams.set("id_pasien", String(params.id_pasien));
  if (params?.q) searchParams.set("q", params.q);

  const res = await apiFetch(`/billing?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Gagal memuat daftar tagihan"));
  }
  const json = await res.json();
  const rawItems = json.data?.items || [];
  return {
    items: rawItems.map((b: Record<string, unknown>, idx: number) =>
      mapRawBillingToBillingItem(b, idx)
    ),
  };
}

export async function fetchBillingByIdApi(
  id_tagihan: number
): Promise<BillingItem> {
  const res = await apiFetch(`/billing/${id_tagihan}`);
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Data tagihan tidak ditemukan")
    );
  }
  const json = await res.json();
  return mapRawBillingToBillingItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function previewBillingApi(
  id_rekap: number,
  id_alokasi_list: number[] = []
): Promise<BillingPreviewResult> {
  const res = await apiFetch("/billing/preview", {
    method: "POST",
    body: JSON.stringify({ id_rekap, id_alokasi_list }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal melakukan kalkulasi preview tagihan")
    );
  }

  const json = await res.json();
  const data = (json.data || {}) as Record<string, unknown>;
  const rawPasien = (data.pasien || {}) as Record<string, unknown>;
  const rawItems = Array.isArray(data.items) ? data.items : [];

  const items = rawItems.map((item: Record<string, unknown>, idx: number) => mapBillingDetail(item, idx));

  const totalNum = Number(data.total_biaya || 0);
  return {
    id_rekap: Number(data.id_rekap || id_rekap),
    kode_rekap: String(data.kode_rekap || `RKP-${id_rekap}`),
    status: (data.status as HistoryStatus) || "Siap Billing",
    pasien: {
      id_pasien: Number(rawPasien.id_pasien || 0),
      no_rm: String(rawPasien.no_rm || "-"),
      nama_pasien: String(rawPasien.nama_pasien || "-"),
      jenis_kelamin_usia: formatGenderAge(
        rawPasien.jenis_kelamin,
        rawPasien.tanggal_lahir
      ),
      kelas_perawatan: "Kelas 1",
      dokter_dpjp: "DPJP Rawat Inap",
      diagnosa: "Pelayanan Rawat Inap",
      hak_kelas_jaminan: "BPJS Kesehatan / Umum",
    },
    acuan_tarif: String(data.acuan_tarif || "tanggal_tindakan"),
    items,
    total_biaya: totalNum.toFixed(2),
    total_biaya_num: totalNum,
  };
}

export async function createBillingApi(
  payload: CreateBillingPayload
): Promise<BillingItem> {
  const res = await apiFetch("/billing", {
    method: "POST",
    body: JSON.stringify({
      id_rekap: payload.id_rekap,
      id_alokasi_list: payload.id_alokasi_list || [],
      ...(payload.catatan ? { catatan: payload.catatan } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Gagal membuat tagihan di server")
    );
  }

  const json = await res.json();
  return mapRawBillingToBillingItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function updateBillingStatusApi(
  id_tagihan: number,
  status: BillingStatus
): Promise<BillingItem> {
  if (status === "Batal") {
    throw new Error(
      "Pembatalan tagihan wajib menyertakan alasan pembatalan resmi."
    );
  }

  const res = await apiFetch(`/billing/${id_tagihan}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Perubahan status tagihan ditolak oleh server")
    );
  }

  const json = await res.json();
  return mapRawBillingToBillingItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function recalculateBillingApi(
  id_tagihan: number,
  catatan_penyesuaian?: string
): Promise<BillingItem> {
  const res = await apiFetch(`/billing/${id_tagihan}/recalculate`, {
    method: "POST",
    body: JSON.stringify(
      catatan_penyesuaian !== undefined ? { catatan_penyesuaian } : {}
    ),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Hanya tagihan Draft yang dapat dihitung ulang")
    );
  }

  const json = await res.json();
  return mapRawBillingToBillingItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

export async function cancelBillingApi(
  id_tagihan: number,
  alasan: string
): Promise<BillingItem> {
  if (!alasan.trim()) {
    throw new Error("Alasan pembatalan tagihan wajib diisi.");
  }

  const res = await apiFetch(`/billing/${id_tagihan}/cancel`, {
    method: "POST",
    body: JSON.stringify({ alasan: alasan.trim() }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Tagihan tidak dapat dibatalkan")
    );
  }

  const json = await res.json();
  return mapRawBillingToBillingItem(
    (json.data || {}) as Record<string, unknown>,
    0
  );
}

function mapBillingDetail(item: Record<string, unknown>, idx: number, fallbackDate = "-"): BillingDetailItem {
  const room = item.jenis_item === "KAMAR";
  const start = item.waktu_mulai ? String(item.waktu_mulai) : null;
  const end = item.waktu_selesai ? String(item.waktu_selesai) : null;
  return {
    id_detail_tagihan: item.id_detail_tagihan == null ? undefined : Number(item.id_detail_tagihan),
    jenis_item: room ? "KAMAR" : "TINDAKAN",
    id_detail_rekap: item.id_detail_rekap == null ? null : Number(item.id_detail_rekap),
    id_tarif: item.id_tarif == null ? null : Number(item.id_tarif),
    id_alokasi: item.id_alokasi == null ? null : Number(item.id_alokasi),
    id_tarif_kamar: item.id_tarif_kamar == null ? null : Number(item.id_tarif_kamar),
    kelas_perawatan_snapshot: item.kelas_perawatan_snapshot == null ? null : String(item.kelas_perawatan_snapshot),
    waktu_mulai: start, waktu_selesai: end, estimasi: item.estimasi === true,
    kode_tindakan: room ? `KAMAR-${item.id_alokasi}` : String(item.kode_tindakan || `TRF-${item.id_tarif || idx + 1}`),
    nama_tindakan: String(item.nama_tindakan || "Pelayanan"),
    kategori: room ? "Akomodasi Kamar" : "Tindakan Medis",
    satuan: room ? "malam" : "tindakan",
    tanggal_tindakan_formatted: room && start && end
      ? `${formatBackendTimestamp(start).timestamp} ? ${formatBackendTimestamp(end).timestamp}${item.estimasi ? " (estimasi)" : ""}`
      : item.tanggal_tindakan ? formatBackendTimestamp(item.tanggal_tindakan).timestamp : fallbackDate,
    jumlah: Number(item.jumlah),
    harga_satuan: String(item.harga_satuan), harga_satuan_num: Number(item.harga_satuan),
    subtotal: String(item.subtotal), subtotal_num: Number(item.subtotal),
  };
}

export async function fetchRoomTariffsApi(): Promise<RoomTariff[]> {
  const res = await apiFetch("/billing/room-tariffs");
  if (!res.ok) throw new Error(await readErrorMessage(res, "Gagal memuat tarif kamar."));
  return (await res.json()).data.items;
}

export async function createRoomTariffApi(payload: {
  kelas_perawatan: KelasPerawatan; harga_per_malam: string; tanggal_berlaku: string;
  tanggal_berakhir?: string; id_tarif_sebelumnya?: number;
}): Promise<RoomTariff> {
  const res = await apiFetch("/billing/room-tariffs", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Gagal menyimpan tarif kamar."));
  return (await res.json()).data;
}

export async function fetchRoomAllocationsApi(id_pasien: number): Promise<RoomAllocation[]> {
  const items: RoomAllocation[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await apiFetch(`/allocations?id_pasien=${id_pasien}&page=${page}&limit=100`);
    if (!res.ok) throw new Error(await readErrorMessage(res, "Gagal memuat alokasi kamar pasien."));
    const json = await res.json();
    items.push(...json.data.items);
    totalPages = json.meta.total_pages;
    page++;
  } while (page <= totalPages);
  return items;
}
