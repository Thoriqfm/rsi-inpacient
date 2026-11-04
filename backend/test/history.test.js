// API + integrity check untuk UC-07. Butuh DATABASE_URL lokal; melewati diri bila tidak ada.
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

let server;
let baseUrl;
const akunIds = [];
const pasienIds = [];
const rmeIds = [];
const rekapIds = [];
const tagihanIds = [];
let adminToken;
let adminAkunId;

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
            username: `t_h_${tag}_${suffix}`,
            password: "test-hash",
            role,
            nama_petugas: `Petugas ${tag}`,
        },
    });
    akunIds.push(akun.id_akun);
    return akun;
}

async function createPasien(nama = "Pasien History") {
    const pasien = await prisma.pasien.create({
        data: {
            no_rm: `RM${suffix.slice(-8)}${Math.floor(Math.random() * 10000)}`.slice(0, 20),
            nama_pasien: nama,
            kondisi_pasien: "Stabil",
        },
    });
    pasienIds.push(pasien.id_pasien);
    return pasien;
}

async function createRme(pasien, index = 1) {
    const rme = await prisma.rmeDummy.create({
        data: {
            id_pasien: pasien.id_pasien,
            kode_tindakan: `TD${index}`.slice(0, 20),
            nama_tindakan: `Tindakan ${index} ${suffix}`,
            tanggal_tindakan: new Date(Date.now() + index * 60_000),
            jumlah: index,
        },
    });
    rmeIds.push(rme.id_riwayat);
    return rme;
}

async function createRecap(body) {
    const res = await api("POST", "/histories", { token: adminToken, body });
    if (res.status === 201) rekapIds.push(res.body.data.id_rekap);
    return res;
}

describe("History management (UC-07)", { skip: !RUN }, () => {
    before(async () => {
        server = app.listen(0);
        await once(server, "listening");
        baseUrl = `http://127.0.0.1:${server.address().port}/api`;

        const admin = await createAkun("Petugas Administrasi", "adm");
        adminAkunId = admin.id_akun;
        adminToken = tokenFor(admin);
    });

    after(async () => {
        await prisma.logAudit.deleteMany({ where: { id_akun: { in: akunIds } } });
        await prisma.detailTagihan.deleteMany({ where: { id_tagihan: { in: tagihanIds } } });
        await prisma.tagihan.deleteMany({ where: { id_tagihan: { in: tagihanIds } } });
        await prisma.detailRekapTindakan.deleteMany({ where: { id_rekap: { in: rekapIds } } });
        await prisma.rekapTindakan.deleteMany({ where: { id_rekap: { in: rekapIds } } });
        await prisma.rmeDummy.deleteMany({ where: { id_riwayat: { in: rmeIds } } });
        await prisma.pasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: akunIds } } });

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await prisma.$disconnect();
    });

    test("rekap memerlukan token dan role Petugas Administrasi", async () => {
        assert.equal((await api("GET", "/histories")).status, 401);

        const bedManagement = await createAkun("Petugas Bed Management", "bed");
        const forbidden = await api("GET", "/histories", { token: tokenFor(bedManagement) });
        assert.equal(forbidden.status, 403);
        assert.equal(forbidden.body.error.code, "FORBIDDEN");

        assert.equal((await api("GET", "/histories", { token: adminToken })).status, 200);
    });

    test("pembuatan rekap menyalin snapshot RME, aktor, dan audit", async () => {
        const pasien = await createPasien(`Rekap ${suffix}`);
        const rme1 = await createRme(pasien, 1);
        const rme2 = await createRme(pasien, 2);

        const res = await createRecap({
            id_pasien: pasien.id_pasien,
            id_riwayat: [rme2.id_riwayat, rme1.id_riwayat],
            catatan: "Rekap uji",
        });

        assert.equal(res.status, 201);
        assert.match(res.body.data.kode_rekap, /^RKP-\d{8}-\d{3}$/);
        assert.equal(res.body.data.status, "Draft");
        assert.equal(res.body.data.id_pasien, pasien.id_pasien);
        assert.equal(res.body.data.dibuat_oleh, "Petugas adm");
        assert.equal(res.body.data.jumlah_tindakan, 2);
        assert.equal(res.body.data.catatan, "Rekap uji");
        assert.equal(res.body.data.detail_tindakan.length, 2);
        assert.deepEqual(
            res.body.data.detail_tindakan.map((item) => item.id_riwayat),
            [rme1.id_riwayat, rme2.id_riwayat],
        );
        assert.equal(res.body.data.detail_tindakan[1].nama_tindakan, rme2.nama_tindakan);
        assert.equal(res.body.data.detail_tindakan[1].jumlah, 2);

        // Sumber RME tidak berubah karena pembuatan rekap.
        const source = await prisma.rmeDummy.findMany({
            where: { id_pasien: pasien.id_pasien },
            orderBy: { id_riwayat: "asc" },
        });
        assert.equal(source.length, 2);
        assert.equal(source[0].nama_tindakan, rme1.nama_tindakan);
        assert.equal(source[1].nama_tindakan, rme2.nama_tindakan);

        const audit = await prisma.logAudit.findFirst({
            where: {
                nama_tabel: "rekap_tindakan",
                id_referensi: res.body.data.id_rekap,
                aksi: "CREATE",
            },
        });
        assert.ok(audit);
        assert.equal(audit.id_akun, adminAkunId);
    });

    test("tanpa id_riwayat seluruh RME pasien dijadikan snapshot", async () => {
        const pasien = await createPasien(`Semua RME ${suffix}`);
        await createRme(pasien, 1);
        await createRme(pasien, 2);

        const res = await createRecap({ id_pasien: pasien.id_pasien });

        assert.equal(res.status, 201);
        assert.equal(res.body.data.jumlah_tindakan, 2);
    });

    test("RME pasien lain dan id_riwayat duplikat ditolak", async () => {
        const pasienA = await createPasien(`Pasien A ${suffix}`);
        const pasienB = await createPasien(`Pasien B ${suffix}`);
        const rmeB = await createRme(pasienB, 1);

        const mismatch = await createRecap({
            id_pasien: pasienA.id_pasien,
            id_riwayat: [rmeB.id_riwayat],
        });
        assert.equal(mismatch.status, 422);
        assert.equal(mismatch.body.error.code, "HISTORY_RME_MISMATCH");

        const duplicate = await createRecap({
            id_pasien: pasienB.id_pasien,
            id_riwayat: [rmeB.id_riwayat, rmeB.id_riwayat],
        });
        assert.equal(duplicate.status, 400);
        assert.equal(duplicate.body.error.code, "VALIDATION_ERROR");
    });

    test("daftar, pencarian pasien, sumber RME, dan detail rekap", async () => {
        const pasien = await createPasien(`Cari ${suffix}`);
        const rme = await createRme(pasien, 1);
        const created = await createRecap({ id_pasien: pasien.id_pasien });
        assert.equal(created.status, 201);

        const list = await api("GET", `/histories?q=${encodeURIComponent(pasien.no_rm)}`, {
            token: adminToken,
        });
        assert.equal(list.status, 200);
        const item = list.body.data.items.find((row) => row.id_rekap === created.body.data.id_rekap);
        assert.ok(item);
        assert.equal(item.pasien.no_rm, pasien.no_rm);
        assert.equal(item.jumlah_tindakan, 1);

        const detail = await api("GET", `/histories/${created.body.data.id_rekap}`, {
            token: adminToken,
        });
        assert.equal(detail.status, 200);
        assert.equal(detail.body.data.kode_rekap, created.body.data.kode_rekap);

        const patients = await api("GET", `/histories/patients?q=${encodeURIComponent(pasien.nama_pasien)}`, {
            token: adminToken,
        });
        assert.equal(patients.status, 200);
        const found = patients.body.data.items.find((row) => row.id_pasien === pasien.id_pasien);
        assert.ok(found);
        assert.equal(found.jumlah_rme, 1);
        assert.equal(found.jumlah_rekap, 1);

        const source = await api("GET", `/histories/rme?id_pasien=${pasien.id_pasien}`, {
            token: adminToken,
        });
        assert.equal(source.status, 200);
        assert.equal(source.body.data.items.length, 1);
        assert.equal(source.body.data.items[0].id_riwayat, rme.id_riwayat);
    });

    test("status hanya bergerak maju dan rekap Siap Billing terkunci", async () => {
        const pasien = await createPasien(`Status ${suffix}`);
        await createRme(pasien, 1);
        const created = await createRecap({ id_pasien: pasien.id_pasien });
        const id = created.body.data.id_rekap;

        const direct = await api("PATCH", `/histories/${id}`, {
            token: adminToken,
            body: { status: "Siap Billing" },
        });
        assert.equal(direct.status, 409);
        assert.equal(direct.body.error.code, "HISTORY_STATUS_INVALID");

        const verified = await api("PATCH", `/histories/${id}`, {
            token: adminToken,
            body: { status: "Proses Verifikasi" },
        });
        assert.equal(verified.status, 200);
        assert.equal(verified.body.data.status, "Proses Verifikasi");

        const ready = await api("PATCH", `/histories/${id}`, {
            token: adminToken,
            body: { status: "Siap Billing", catatan: "Siap ditagihkan" },
        });
        assert.equal(ready.status, 200);
        assert.equal(ready.body.data.status, "Siap Billing");
        assert.equal(ready.body.data.catatan, "Siap ditagihkan");

        const locked = await api("PATCH", `/histories/${id}`, {
            token: adminToken,
            body: { catatan: "Koreksi" },
        });
        assert.equal(locked.status, 409);
        assert.equal(locked.body.error.code, "HISTORY_LOCKED");

        const auditCount = await prisma.logAudit.count({
            where: {
                nama_tabel: "rekap_tindakan",
                id_referensi: id,
                aksi: "STATUS_CHANGE",
            },
        });
        assert.equal(auditCount, 2);
    });

    test("soft delete menyembunyikan rekap tanpa menghapus RME sumber", async () => {
        const pasien = await createPasien(`Hapus ${suffix}`);
        await createRme(pasien, 1);
        const created = await createRecap({ id_pasien: pasien.id_pasien });
        const id = created.body.data.id_rekap;

        const removed = await api("DELETE", `/histories/${id}`, { token: adminToken });
        assert.equal(removed.status, 200);
        assert.deepEqual(removed.body.data, { id_rekap: id, deleted: true });

        assert.equal((await api("GET", `/histories/${id}`, { token: adminToken })).status, 404);
        assert.equal((await api("DELETE", `/histories/${id}`, { token: adminToken })).status, 404);

        const list = await api("GET", `/histories?q=${encodeURIComponent(pasien.no_rm)}`, {
            token: adminToken,
        });
        assert.equal(list.body.data.items.length, 0);

        const row = await prisma.rekapTindakan.findUnique({ where: { id_rekap: id } });
        assert.ok(row.deleted_at);

        const source = await prisma.rmeDummy.count({ where: { id_pasien: pasien.id_pasien } });
        assert.equal(source, 1);

        assert.equal(
            await prisma.logAudit.count({
                where: { nama_tabel: "rekap_tindakan", id_referensi: id, aksi: "DELETE" },
            }),
            1,
        );
    });

    test("rekap yang sudah dipakai tagihan tidak dapat dihapus", async () => {
        const pasien = await createPasien(`Tagihan ${suffix}`);
        await createRme(pasien, 1);
        const created = await createRecap({ id_pasien: pasien.id_pasien });

        const tagihan = await prisma.tagihan.create({
            data: {
                id_pasien: pasien.id_pasien,
                id_rekap: created.body.data.id_rekap,
                id_akun: adminAkunId,
                no_tagihan: `TGH-${suffix}-${tagihanIds.length + 1}`.slice(0, 30),
                total_biaya: 0,
                tanggal_dibuat: new Date(),
            },
        });
        tagihanIds.push(tagihan.id_tagihan);

        const res = await api("DELETE", `/histories/${created.body.data.id_rekap}`, {
            token: adminToken,
        });
        assert.equal(res.status, 409);
        assert.equal(res.body.error.code, "HISTORY_HAS_INVOICE");
    });
});
