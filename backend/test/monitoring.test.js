// API check untuk UC-06. Butuh DATABASE_URL lokal; melewati diri bila tidak ada.
// Monitoring bersifat read-only: test memastikan tidak ada baris sumber yang berubah.
import "dotenv/config";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";

const RUN = Boolean(process.env.DATABASE_URL);
const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const STALE_MS = 5 * 60 * 1000;
const DAY = 86_400_000;

let server;
let baseUrl;
const akunIds = [];
const pasienIds = [];
const hospitalIds = [];
const referralIds = [];
const antreanIds = [];
let adminToken;
let outsiderToken;
let akunId;
let queueNoCounter = 0;

function tokenFor(akun) {
    return jwt.sign({ username: akun.username, role: akun.role }, process.env.JWT_SECRET, {
        subject: String(akun.id_akun),
        algorithm: "HS256",
        expiresIn: "1h",
    });
}

async function api(method, path, { token, body } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    return { status: res.status, body: await res.json() };
}

function dateOnly(offsetDays) {
    const date = new Date(Date.now() + offsetDays * DAY);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
    ).padStart(2, "0")}`;
}

async function createAkun(role, tag) {
    const akun = await prisma.akun.create({
        data: {
            username: `t_m_${tag}_${suffix}`,
            password: "not-used",
            role,
            nama_petugas: `Petugas ${tag}`,
        },
    });
    akunIds.push(akun.id_akun);
    return akun;
}

let pasienSeq = 0;
async function createPasien(nama) {
    pasienSeq += 1;
    const pasien = await prisma.pasien.create({
        data: {
            no_rm: `RMM${suffix.slice(-8)}${String(pasienSeq).padStart(4, "0")}`.slice(0, 20),
            nama_pasien: nama,
            kondisi_pasien: "Stabil",
            status_penanganan: "Menunggu",
        },
    });
    pasienIds.push(pasien.id_pasien);
    return pasien;
}

async function createHospital(overrides = {}) {
    const rs = await prisma.rumahSakitRujukan.create({
        data: {
            nama_rs: `RS Mon ${suffix}-${hospitalIds.length + 1}`,
            status_ketersediaan: "Tersedia",
            terakhir_diperbarui: new Date(),
            ...overrides,
        },
    });
    hospitalIds.push(rs.id_rs);
    return rs;
}

async function createQueue(pasien, { status = "Menunggu", waktuMasuk = new Date() } = {}) {
    // Nomor acak: suite lain memakai API yang mengambil max+1, sehingga nomor berurutan mudah disalip.
    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            const row = await prisma.daftarTunggu.create({
                data: {
                    id_pasien: pasien.id_pasien,
                    id_akun: akunId,
                    waktu_masuk: waktuMasuk,
                    no_antrean: 1 + Math.floor(Math.random() * 1_000_000_000),
                    status,
                },
            });
            antreanIds.push(row.id_antrean);
            return row;
        } catch (err) {
            if (err.code !== "P2002") {
                throw err;
            }
        }
    }

    throw new Error("Gagal mendapatkan nomor antrean unik untuk test.");
}

async function createReferral(pasien, hospital, { status = "Dibuat" } = {}) {
    const row = await prisma.suratRujukan.create({
        data: {
            no_rujukan: `RMJ-${suffix.slice(-8)}-${referralIds.length}`,
            id_pasien: pasien.id_pasien,
            id_rs: hospital.id_rs,
            id_akun: akunId,
            tanggal_rujukan: new Date(),
            alasan_rujukan: "Uji monitoring",
            status,
        },
    });
    referralIds.push(row.id_surat);
    return row;
}

function itemFor(items, id_pasien) {
    return items.find((item) => item.id_pasien === id_pasien);
}

describe("Monitoring (UC-06)", { skip: !RUN }, () => {
    before(async () => {
        server = app.listen(0);
        await once(server, "listening");
        baseUrl = `http://127.0.0.1:${server.address().port}/api`;

        const admin = await createAkun("Petugas Administrasi", "adm");
        akunId = admin.id_akun;
        adminToken = tokenFor(admin);
        outsiderToken = tokenFor(await createAkun("Petugas Lain", "out"));
    });

    after(async () => {
        await prisma.logAudit.deleteMany({ where: { id_akun: { in: akunIds } } });
        await prisma.rekamAlokasi.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.suratRujukan.deleteMany({ where: { id_surat: { in: referralIds } } });
        await prisma.daftarTunggu.deleteMany({ where: { id_antrean: { in: antreanIds } } });
        await prisma.rumahSakitRujukan.deleteMany({ where: { id_rs: { in: hospitalIds } } });
        await prisma.pasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: akunIds } } });

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await prisma.$disconnect();
    });

    test("monitoring memerlukan token yang dikenali dan menolak method tulis", async () => {
        assert.equal((await api("GET", "/monitoring")).status, 401);

        const unknownRole = await api("GET", "/monitoring", { token: outsiderToken });
        assert.equal(unknownRole.status, 401);
        assert.equal(unknownRole.body.error.code, "UNAUTHENTICATED");

        // Read-only: tidak ada endpoint PATCH/POST untuk monitoring.
        const patch = await api("PATCH", "/monitoring", { token: adminToken, body: {} });
        assert.equal(patch.status, 404);
        const post = await api("POST", "/monitoring", { token: adminToken, body: {} });
        assert.equal(post.status, 404);
    });

    test("menggabungkan status antrean dan rujukan milik pasien", async () => {
        const pasien = await createPasien(`Gabung ${suffix}`);
        const hospital = await createHospital();
        const antrean = await createQueue(pasien, { status: "Menunggu" });
        const referral = await createReferral(pasien, hospital, { status: "Dikirim" });

        const res = await api("GET", `/monitoring?q=${pasien.no_rm}`, { token: adminToken });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.items.length, 1);

        const item = res.body.data.items[0];
        assert.equal(item.id_pasien, pasien.id_pasien);
        assert.equal(item.no_rm, pasien.no_rm);
        assert.equal(item.nama_pasien, `Gabung ${suffix}`);
        assert.equal(item.antrean.id_antrean, antrean.id_antrean);
        assert.equal(item.antrean.status, "Menunggu");
        assert.equal(item.antrean.no_antrean, antrean.no_antrean);
        assert.equal(item.antrean.dicatat_oleh, "Petugas adm");
        assert.equal(item.antrean.alokasi, null);
        assert.equal(item.rujukan.id_surat, referral.id_surat);
        assert.equal(item.rujukan.status, "Dikirim");
        assert.equal(item.rujukan.dibuat_oleh, "Petugas adm");
        assert.equal(item.rujukan.rumah_sakit.id_rs, hospital.id_rs);
        assert.equal(item.rujukan.rumah_sakit.status_ketersediaan, "Tersedia");
        assert.equal(item.rujukan.rumah_sakit.stale, false);
    });

    test("pasien tanpa antrean atau rujukan tidak muncul; data tidak lengkap aman", async () => {
        const pasienKosong = await createPasien(`Kosong ${suffix}`);
        const pasienAntrean = await createPasien(`Hanya Antrean ${suffix}`);
        const pasienRujukan = await createPasien(`Hanya Rujukan ${suffix}`);

        await createQueue(pasienAntrean);
        await createReferral(pasienRujukan, await createHospital());

        const res = await api("GET", `/monitoring?q=${suffix}`, { token: adminToken });
        assert.equal(res.status, 200);

        assert.equal(itemFor(res.body.data.items, pasienKosong.id_pasien), undefined);

        const hanyaAntrean = itemFor(res.body.data.items, pasienAntrean.id_pasien);
        assert.ok(hanyaAntrean.antrean);
        assert.equal(hanyaAntrean.rujukan, null);

        const hanyaRujukan = itemFor(res.body.data.items, pasienRujukan.id_pasien);
        assert.equal(hanyaRujukan.antrean, null);
        assert.ok(hanyaRujukan.rujukan);
    });

    test("menampilkan antrean terbaru dan alokasi bed bila sudah dialokasikan", async () => {
        const pasien = await createPasien(`Alokasi ${suffix}`);
        await createQueue(pasien, {
            status: "Batal",
            waktuMasuk: new Date(Date.now() - DAY),
        });
        const bed = await prisma.bed.create({
            data: {
                no_bed: `M-${suffix}`,
                nama_bangsal: "Bangsal Mon",
                kelas_perawatan: "Kelas 2",
            },
        });
        const antrean = await createQueue(pasien, { status: "Dialokasikan" });
        const allocation = await prisma.rekamAlokasi.create({
            data: {
                id_pasien: pasien.id_pasien,
                id_bed: bed.id_bed,
                id_akun: akunId,
                id_antrean: antrean.id_antrean,
                waktu_alokasi: new Date(),
                status_alokasi: "Aktif",
            },
        });

        try {
            const res = await api("GET", `/monitoring?q=${pasien.no_rm}`, { token: adminToken });
            const item = res.body.data.items[0];
            assert.equal(item.antrean.id_antrean, antrean.id_antrean);
            assert.equal(item.antrean.status, "Dialokasikan");
            assert.equal(item.antrean.alokasi.id_alokasi, allocation.id_alokasi);
            assert.equal(item.antrean.alokasi.bed.no_bed, `M-${suffix}`);
        } finally {
            await prisma.rekamAlokasi.delete({ where: { id_alokasi: allocation.id_alokasi } });
            await prisma.bed.delete({ where: { id_bed: bed.id_bed } });
        }
    });

    test("filter status antrean, status rujukan, pencarian, dan rentang tanggal", async () => {
        const pasien = await createPasien(`Filter ${suffix}`);
        const hospital = await createHospital();
        await createQueue(pasien, { status: "Menunggu", waktuMasuk: new Date() });
        await createReferral(pasien, hospital, { status: "Batal" });

        const byStatusAntrean = await api("GET", `/monitoring?q=${pasien.no_rm}&status_antrean=Menunggu`, {
            token: adminToken,
        });
        assert.equal(byStatusAntrean.status, 200);
        assert.equal(byStatusAntrean.body.data.items.length, 1);

        const wrongStatusAntrean = await api(
            "GET",
            `/monitoring?q=${pasien.no_rm}&status_antrean=Dialokasikan`,
            { token: adminToken },
        );
        assert.equal(wrongStatusAntrean.body.data.items.length, 0);

        const byStatusRujukan = await api("GET", `/monitoring?q=${pasien.no_rm}&status_rujukan=Batal`, {
            token: adminToken,
        });
        assert.equal(byStatusRujukan.body.data.items.length, 1);

        const wrongStatusRujukan = await api(
            "GET",
            `/monitoring?q=${pasien.no_rm}&status_rujukan=Diterima`,
            { token: adminToken },
        );
        assert.equal(wrongStatusRujukan.body.data.items.length, 0);

        const byNama = await api("GET", `/monitoring?q=Filter ${suffix}`, { token: adminToken });
        assert.equal(byNama.body.data.items.length, 1);

        const today = await api("GET", `/monitoring?q=${pasien.no_rm}&dari=${dateOnly(0)}&sampai=${dateOnly(0)}`, {
            token: adminToken,
        });
        assert.equal(today.status, 200);
        assert.equal(today.body.data.items.length, 1);

        const past = await api("GET", `/monitoring?q=${pasien.no_rm}&sampai=${dateOnly(-2)}`, {
            token: adminToken,
        });
        assert.equal(past.body.data.items.length, 0);

        const future = await api("GET", `/monitoring?q=${pasien.no_rm}&dari=${dateOnly(1)}`, {
            token: adminToken,
        });
        assert.equal(future.body.data.items.length, 0);
    });

    test("indikator stale mengikuti terakhir_diperbarui RS", async () => {
        const pasien = await createPasien(`Stale ${suffix}`);
        const staleHospital = await createHospital({
            terakhir_diperbarui: new Date(Date.now() - STALE_MS - 60_000),
        });
        const freshHospital = await createHospital();

        await createReferral(pasien, staleHospital);
        const pasien2 = await createPasien(`Fresh ${suffix}`);
        await createReferral(pasien2, freshHospital);

        const res = await api("GET", `/monitoring?q=${suffix}`, { token: adminToken });
        const staleItem = itemFor(res.body.data.items, pasien.id_pasien);
        const freshItem = itemFor(res.body.data.items, pasien2.id_pasien);

        assert.equal(staleItem.rujukan.rumah_sakit.stale, true);
        assert.equal(staleItem.rujukan.rumah_sakit.status_ketersediaan, "Tersedia");
        assert.equal(freshItem.rujukan.rumah_sakit.stale, false);
    });

    test("monitoring tidak mengubah data sumber dan tidak menulis audit", async () => {
        const pasien = await createPasien(`Readonly ${suffix}`);
        const hospital = await createHospital();
        const antrean = await createQueue(pasien);
        const referral = await createReferral(pasien, hospital);

        // Suite lain menulis audit paralel; hitung hanya baris milik akun suite ini.
        const auditScope = { id_akun: { in: akunIds } };
        const auditBefore = await prisma.logAudit.count({ where: auditScope });
        const queueBefore = await prisma.daftarTunggu.findUnique({ where: { id_antrean: antrean.id_antrean } });
        const referralBefore = await prisma.suratRujukan.findUnique({ where: { id_surat: referral.id_surat } });

        const res = await api("GET", `/monitoring?q=${pasien.no_rm}`, { token: adminToken });
        assert.equal(res.status, 200);

        const queueAfter = await prisma.daftarTunggu.findUnique({ where: { id_antrean: antrean.id_antrean } });
        const referralAfter = await prisma.suratRujukan.findUnique({ where: { id_surat: referral.id_surat } });

        assert.deepEqual(queueAfter, queueBefore);
        assert.deepEqual(referralAfter, referralBefore);
        assert.equal(await prisma.logAudit.count({ where: auditScope }), auditBefore);
    });

    test("pagination, data kosong, dan validasi query", async () => {
        const first = await api("GET", "/monitoring?page=1&limit=1", { token: adminToken });
        assert.equal(first.status, 200);
        assert.equal(first.body.data.items.length <= 1, true);
        assert.equal(first.body.meta.page, 1);
        assert.equal(first.body.meta.limit, 1);
        assert.equal(typeof first.body.meta.total_pages, "number");

        const empty = await api("GET", "/monitoring?q=tidak-ada-pasien-ini", { token: adminToken });
        assert.equal(empty.status, 200);
        assert.deepEqual(empty.body.data.items, []);
        assert.equal(empty.body.meta.total, 0);

        const badStatus = await api("GET", "/monitoring?status_antrean=Selesai", { token: adminToken });
        assert.equal(badStatus.status, 400);
        assert.equal(badStatus.body.error.code, "VALIDATION_ERROR");

        const badDate = await api("GET", "/monitoring?dari=04-11-2026", { token: adminToken });
        assert.equal(badDate.status, 400);

        const reversed = await api("GET", `/monitoring?dari=${dateOnly(0)}&sampai=${dateOnly(-1)}`, {
            token: adminToken,
        });
        assert.equal(reversed.status, 400);

        const foreignQuery = await api("GET", "/monitoring?unknown=1", { token: adminToken });
        assert.equal(foreignQuery.status, 400);
    });
});
