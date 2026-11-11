// API check untuk UC-05. Butuh DATABASE_URL lokal; melewati diri bila tidak ada.
// Data sintetis: semua baris dibuat di sini dan dihapus kembali di after().
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

let server;
let baseUrl;
const akunIds = [];
const pasienIds = [];
const hospitalIds = [];
const referralIds = [];
let adminToken;
let outsiderToken;
let akunId;

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

async function createAkun(role, tag) {
    const akun = await prisma.akun.create({
        data: {
            username: `t_r_${tag}_${suffix}`,
            password: "not-used",
            role,
            nama_petugas: `Petugas ${tag}`,
        },
    });
    akunIds.push(akun.id_akun);
    return akun;
}

async function createPasien(nama = "Pasien Rujukan") {
    const pasien = await prisma.pasien.create({
        data: {
            no_rm: `RMR${suffix.slice(-8)}${String(pasienIds.length + 1).padStart(4, "0")}`.slice(0, 20),
            nama_pasien: nama,
            kondisi_pasien: "Darurat",
        },
    });
    pasienIds.push(pasien.id_pasien);
    return pasien;
}

async function createHospital(overrides = {}) {
    const rs = await prisma.rumahSakitRujukan.create({
        data: {
            nama_rs: `RS Uji ${suffix}-${hospitalIds.length + 1}`,
            alamat: "Jalan Uji",
            kontak: "0210000000",
            status_ketersediaan: "Tersedia",
            terakhir_diperbarui: new Date(),
            ...overrides,
        },
    });
    hospitalIds.push(rs.id_rs);
    return rs;
}

async function createReferral(pasien, hospital) {
    const res = await api("POST", "/referrals", {
        token: adminToken,
        body: { id_pasien: pasien.id_pasien, id_rs: hospital.id_rs, alasan_rujukan: "Butuh ICU" },
    });
    if (res.status === 201) referralIds.push(res.body.data.id_surat);
    return res;
}

describe("Referral management (UC-05)", { skip: !RUN }, () => {
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
        await prisma.riwayatStatusPasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.suratRujukan.deleteMany({ where: { id_surat: { in: referralIds } } });
        await prisma.rumahSakitRujukan.deleteMany({ where: { id_rs: { in: hospitalIds } } });
        await prisma.pasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: akunIds } } });

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await prisma.$disconnect();
    });

    test("endpoint rujukan memerlukan token yang dikenali", async () => {
        assert.equal((await api("GET", "/referrals")).status, 401);
        assert.equal((await api("GET", "/referral-hospitals")).status, 401);

        const unknownRole = await api("GET", "/referrals", { token: outsiderToken });
        assert.equal(unknownRole.status, 401);
        assert.equal(unknownRole.body.error.code, "UNAUTHENTICATED");
    });

    test("daftar RS menampilkan ketersediaan, aktor, dan indikator stale", async () => {
        const fresh = await createHospital();
        const stale = await createHospital({ terakhir_diperbarui: new Date(Date.now() - STALE_MS - 1000) });
        const never = await createHospital({ terakhir_diperbarui: null });

        const res = await api("GET", `/referral-hospitals?q=RS Uji ${suffix}`, { token: adminToken });
        assert.equal(res.status, 200);

        const byId = new Map(res.body.data.items.map((item) => [item.id_rs, item]));
        assert.equal(byId.get(fresh.id_rs).stale, false);
        assert.equal(byId.get(stale.id_rs).stale, true);
        assert.equal(byId.get(never.id_rs).stale, true);
        // Belum ada pembaruan manual: aktor null, bukan nama kosong.
        assert.equal(byId.get(fresh.id_rs).terakhir_diperbarui_oleh, null);
        assert.equal(res.body.meta.total >= 3, true);
    });

    test("pembaruan ketersediaan mencatat waktu, aktor, dan audit", async () => {
        const hospital = await createHospital({ status_ketersediaan: "Tidak Tersedia" });

        const res = await api("PATCH", `/referral-hospitals/${hospital.id_rs}/availability`, {
            token: adminToken,
            body: { status_ketersediaan: "Tersedia" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.data.status_ketersediaan, "Tersedia");
        assert.ok(res.body.data.terakhir_diperbarui);
        assert.equal(res.body.data.stale, false);
        assert.equal(res.body.data.terakhir_diperbarui_oleh, "Petugas adm");

        const log = await prisma.logAudit.findFirst({
            where: { nama_tabel: "rumah_sakit_rujukan", id_referensi: hospital.id_rs },
            orderBy: { id_log: "desc" },
        });
        assert.equal(log.id_akun, akunId);
        assert.equal(log.aksi, "UPDATE");
        assert.equal(JSON.parse(log.data_sebelum).status_ketersediaan, "Tidak Tersedia");
        assert.equal(JSON.parse(log.data_sesudah).status_ketersediaan, "Tersedia");

        const invalid = await api("PATCH", `/referral-hospitals/${hospital.id_rs}/availability`, {
            token: adminToken,
            body: { status_ketersediaan: "Mungkin" },
        });
        assert.equal(invalid.status, 400);
        assert.equal(invalid.body.error.code, "VALIDATION_ERROR");

        const missing = await api("PATCH", "/referral-hospitals/99999999/availability", {
            token: adminToken,
            body: { status_ketersediaan: "Tersedia" },
        });
        assert.equal(missing.status, 404);
        assert.equal(missing.body.error.code, "REFERRAL_HOSPITAL_NOT_FOUND");
    });

    test("pembuatan rujukan menyimpan pasien, RS, aktor, waktu, dan nomor", async () => {
        const pasien = await createPasien(`Rujuk ${suffix}`);
        const hospital = await createHospital();

        const res = await createReferral(pasien, hospital);
        assert.equal(res.status, 201);
        assert.equal(res.body.data.status, "Dibuat");
        assert.equal(res.body.data.id_pasien, pasien.id_pasien);
        assert.equal(res.body.data.id_rs, hospital.id_rs);
        assert.equal(res.body.data.alasan_rujukan, "Butuh ICU");
        assert.match(res.body.data.no_rujukan, /^RUJ-\d{8}-\d{3,}$/);
        assert.equal(res.body.data.akun.nama_petugas, "Petugas adm");
        assert.equal(res.body.data.rumah_sakit_rujukan.nama_rs, hospital.nama_rs);
        assert.ok(res.body.data.tanggal_rujukan);

        const detail = await api("GET", `/referrals/${res.body.data.id_surat}`, { token: adminToken });
        assert.equal(detail.status, 200);
        assert.equal(detail.body.data.pasien.no_rm, pasien.no_rm);

        const history = await api("GET", `/referrals/${res.body.data.id_surat}/history`, {
            token: adminToken,
        });
        assert.equal(history.status, 200);
        assert.equal(history.body.data.items.length, 1);
        assert.equal(history.body.data.items[0].aksi, "CREATE");
        assert.equal(history.body.data.items[0].status_baru, "Dibuat");
        assert.equal(history.body.data.items[0].nama_petugas, "Petugas adm");
    });

    test("transisi status sah, transisi terlarang ditolak, riwayat lengkap", async () => {
        const pasien = await createPasien();
        const hospital = await createHospital();
        const created = await createReferral(pasien, hospital);
        const id = created.body.data.id_surat;

        const toDikirim = await api("PATCH", `/referrals/${id}/status`, {
            token: adminToken,
            body: { status: "Dikirim" },
        });
        assert.equal(toDikirim.status, 200);
        assert.equal(toDikirim.body.data.status, "Dikirim");

        // Kembali ke Dibuat bukan transisi sah.
        const backward = await api("PATCH", `/referrals/${id}/status`, {
            token: adminToken,
            body: { status: "Dibuat" },
        });
        assert.equal(backward.status, 409);
        assert.equal(backward.body.error.code, "REFERRAL_STATUS_INVALID");

        const toDiterima = await api("PATCH", `/referrals/${id}/status`, {
            token: adminToken,
            body: { status: "Diterima" },
        });
        assert.equal(toDiterima.status, 200);

        // Diterima adalah status final.
        const finalCancel = await api("PATCH", `/referrals/${id}/status`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(finalCancel.status, 409);

        const unknown = await api("PATCH", `/referrals/${id}/status`, {
            token: adminToken,
            body: { status: "Selesai" },
        });
        assert.equal(unknown.status, 400);
        assert.equal(unknown.body.error.code, "VALIDATION_ERROR");

        const history = await api("GET", `/referrals/${id}/history`, { token: adminToken });
        assert.deepEqual(
            history.body.data.items.map((item) => [item.aksi, item.status_sebelumnya, item.status_baru]),
            [
                ["CREATE", null, "Dibuat"],
                ["STATUS_CHANGE", "Dibuat", "Dikirim"],
                ["STATUS_CHANGE", "Dikirim", "Diterima"],
            ],
        );
    });

    test("rujukan dapat dibatalkan dari Dibuat maupun Dikirim", async () => {
        const pasien = await createPasien();
        const hospital = await createHospital();
        const created = await createReferral(pasien, hospital);
        const id = created.body.data.id_surat;

        const cancelled = await api("PATCH", `/referrals/${id}/status`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(cancelled.status, 200);
        assert.equal(cancelled.body.data.status, "Batal");

        const again = await api("PATCH", `/referrals/${id}/status`, {
            token: adminToken,
            body: { status: "Dikirim" },
        });
        assert.equal(again.status, 409);
        assert.equal(again.body.error.code, "REFERRAL_STATUS_INVALID");

        const other = await createReferral(pasien, hospital);
        const toDikirim = await api("PATCH", `/referrals/${other.body.data.id_surat}/status`, {
            token: adminToken,
            body: { status: "Dikirim" },
        });
        assert.equal(toDikirim.status, 200);

        const cancelSent = await api("PATCH", `/referrals/${other.body.data.id_surat}/status`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(cancelSent.status, 200);
    });

    test("daftar rujukan mendukung filter status, pasien, RS, dan pencarian", async () => {
        const pasien = await createPasien(`Cari ${suffix}`);
        const hospital = await createHospital();
        const created = await createReferral(pasien, hospital);
        await api("PATCH", `/referrals/${created.body.data.id_surat}/status`, {
            token: adminToken,
            body: { status: "Dikirim" },
        });

        const byStatus = await api("GET", "/referrals?status=Dikirim&q=Cari " + suffix, {
            token: adminToken,
        });
        assert.equal(byStatus.status, 200);
        assert.equal(byStatus.body.data.items.length, 1);

        const byPatient = await api("GET", `/referrals?id_pasien=${pasien.id_pasien}`, {
            token: adminToken,
        });
        assert.equal(byPatient.body.data.items.length, 1);

        const byHospital = await api("GET", `/referrals?id_rs=${hospital.id_rs}`, { token: adminToken });
        assert.equal(byHospital.body.data.items.length, 1);

        const byNumber = await api("GET", `/referrals?q=${created.body.data.no_rujukan}`, {
            token: adminToken,
        });
        assert.equal(byNumber.body.data.items.length, 1);

        const foreignQuery = await api("GET", "/referrals?status=Batal&unknown=1", { token: adminToken });
        assert.equal(foreignQuery.status, 400);
    });

    test("pembuatan rujukan bersamaan menghasilkan nomor unik", async () => {
        const hospital = await createHospital();
        const pasien = [];
        for (let index = 0; index < 4; index += 1) {
            pasien.push(await createPasien(`Serentak-${suffix}-${index}`));
        }

        const results = await Promise.all(pasien.map((item) => createReferral(item, hospital)));

        assert.deepEqual(results.map((res) => res.status), [201, 201, 201, 201]);
        const numbers = results.map((res) => res.body.data.no_rujukan);
        assert.equal(new Set(numbers).size, numbers.length);
    });

    test("validasi input dan resource tidak ditemukan", async () => {
        const pasien = await createPasien();
        const hospital = await createHospital();

        const noPatient = await api("POST", "/referrals", {
            token: adminToken,
            body: { id_pasien: 99999999, id_rs: hospital.id_rs },
        });
        assert.equal(noPatient.status, 404);
        assert.equal(noPatient.body.error.code, "PASIEN_NOT_FOUND");

        const noHospital = await api("POST", "/referrals", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_rs: 99999999 },
        });
        assert.equal(noHospital.status, 404);
        assert.equal(noHospital.body.error.code, "REFERRAL_HOSPITAL_NOT_FOUND");

        const invalid = await api("POST", "/referrals", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien },
        });
        assert.equal(invalid.status, 400);
        assert.equal(invalid.body.error.code, "VALIDATION_ERROR");

        const missingHistory = await api("GET", "/referrals/99999999/history", { token: adminToken });
        assert.equal(missingHistory.status, 404);
        assert.equal(missingHistory.body.error.code, "REFERRAL_NOT_FOUND");

        const fullHospital = await createHospital({ status_ketersediaan: "Tidak Tersedia" });
        const unavailableRes = await createReferral(pasien, fullHospital);
        assert.equal(unavailableRes.status, 409);
        assert.equal(unavailableRes.body.error.code, "REFERRAL_HOSPITAL_UNAVAILABLE");

        const stablePasien = await prisma.pasien.create({
            data: {
                no_rm: `RMS${suffix.slice(-7)}${Math.floor(Math.random() * 1000)}`.slice(0, 20),
                nama_pasien: "Pasien Stabil",
                kondisi_pasien: "Stabil",
            },
        });
        pasienIds.push(stablePasien.id_pasien);

        const stableReferral = await createReferral(stablePasien, hospital);
        assert.equal(stableReferral.status, 422);
        assert.equal(stableReferral.body.error.code, "REFERRAL_PATIENT_NOT_EMERGENCY");
    });
});
