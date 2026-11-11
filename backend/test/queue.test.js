// API + concurrency check untuk UC-04. Butuh DATABASE_URL lokal; melewati diri bila tidak ada.
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
const antreanIds = [];
const bedIds = [];
let adminToken;
let outsiderToken;

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
            username: `t_q_${tag}_${suffix}`,
            password: "not-used",
            role,
            nama_petugas: `Petugas ${tag}`,
        },
    });
    akunIds.push(akun.id_akun);
    return akun;
}

async function createPasien(nama = "Pasien Antrean") {
    const pasien = await prisma.pasien.create({
        data: {
            no_rm: `RMQ${suffix.slice(-8)}${String(pasienIds.length + 1).padStart(4, "0")}`.slice(0, 20),
            nama_pasien: nama,
        },
    });
    pasienIds.push(pasien.id_pasien);
    return pasien;
}

async function enqueue(token, pasien) {
    const res = await api("POST", "/queues", { token, body: { id_pasien: pasien.id_pasien } });
    if (res.status === 201) antreanIds.push(res.body.data.id_antrean);
    return res;
}

describe("Queue management (UC-04)", { skip: !RUN }, () => {
    before(async () => {
        server = app.listen(0);
        await once(server, "listening");
        baseUrl = `http://127.0.0.1:${server.address().port}/api`;

        adminToken = tokenFor(await createAkun("Petugas Administrasi", "adm"));
        outsiderToken = tokenFor(await createAkun("Petugas Lain", "out"));
    });

    after(async () => {
        await prisma.logAudit.deleteMany({ where: { id_akun: { in: akunIds } } });
        await prisma.riwayatStatusPasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.rekamAlokasi.deleteMany({ where: { id_akun: { in: akunIds } } });
        await prisma.daftarTunggu.deleteMany({ where: { id_akun: { in: akunIds } } });
        await prisma.bed.deleteMany({ where: { id_bed: { in: bedIds } } });
        await prisma.pasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: akunIds } } });

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await prisma.$disconnect();
    });

    test("antrean memerlukan token dengan role yang dikenali", async () => {
        const noToken = await api("GET", "/queues");
        assert.equal(noToken.status, 401);

        // Role di luar ROLE_LIST ditolak sebagai token tidak valid (401).
        const unknownRole = await api("GET", "/queues", { token: outsiderToken });
        assert.equal(unknownRole.status, 401);
        assert.equal(unknownRole.body.error.code, "UNAUTHENTICATED");
    });

    test("pendaftaran antrean menyimpan pasien, aktor, waktu, dan nomor", async () => {
        const pasien = await createPasien(`Antrean ${suffix}`);

        const res = await enqueue(adminToken, pasien);
        assert.equal(res.status, 201);
        assert.equal(res.body.data.status, "Menunggu");
        assert.equal(res.body.data.id_pasien, pasien.id_pasien);
        assert.equal(res.body.data.pasien.no_rm, pasien.no_rm);
        assert.equal(res.body.data.akun.nama_petugas, "Petugas adm");
        assert.ok(res.body.data.waktu_masuk);
        assert.ok(Number.isInteger(res.body.data.no_antrean));

        const detail = await api("GET", `/queues/${res.body.data.id_antrean}`, { token: adminToken });
        assert.equal(detail.status, 200);
        assert.equal(detail.body.data.id_antrean, res.body.data.id_antrean);
    });

    test("antrean aktif ganda ditolak, pembatalan membuka antrean baru", async () => {
        const pasien = await createPasien();
        const first = await enqueue(adminToken, pasien);
        assert.equal(first.status, 201);

        const duplicate = await enqueue(adminToken, pasien);
        assert.equal(duplicate.status, 409);
        assert.equal(duplicate.body.error.code, "QUEUE_ALREADY_ACTIVE");

        const cancelled = await api("PATCH", `/queues/${first.body.data.id_antrean}`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(cancelled.status, 200);
        assert.equal(cancelled.body.data.status, "Batal");

        const again = await enqueue(adminToken, pasien);
        assert.equal(again.status, 201);

        const cancelAgain = await api("PATCH", `/queues/${again.body.data.id_antrean}`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(cancelAgain.status, 200);

        const cancelTwice = await api("PATCH", `/queues/${again.body.data.id_antrean}`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(cancelTwice.status, 409);
        assert.equal(cancelTwice.body.error.code, "QUEUE_NOT_WAITING");

        // Status Dialokasikan hanya boleh dihasilkan modul Allocation.
        const allocated = await api("PATCH", `/queues/${again.body.data.id_antrean}`, {
            token: adminToken,
            body: { status: "Dialokasikan" },
        });
        assert.equal(allocated.status, 400);
        assert.equal(allocated.body.error.code, "VALIDATION_ERROR");
    });

    test("daftar antrean FIFO deterministik saat waktu masuk sama", async () => {
        const waktuMasuk = new Date("2026-01-01T00:00:00.000Z");
        const pasien = [];
        for (const tag of ["A", "B", "C"]) {
            pasien.push(await createPasien(`FIFO-${suffix}-${tag}`));
        }

        const created = [];
        for (const [index, item] of pasien.entries()) {
            const row = await prisma.daftarTunggu.create({
                data: {
                    id_pasien: item.id_pasien,
                    id_akun: akunIds[0],
                    waktu_masuk: waktuMasuk,
                    // Sengaja tidak berurutan: urutan harus dari waktu lalu id_antrean.
                    no_antrean: 900000 + index,
                    status: "Menunggu",
                },
            });
            created.push(row.id_antrean);
            antreanIds.push(row.id_antrean);
        }

        const res = await api("GET", `/queues?q=FIFO-${suffix}`, { token: adminToken });
        assert.equal(res.status, 200);
        assert.deepEqual(
            res.body.data.items.map((item) => item.id_antrean),
            created,
        );
    });

    test("pendaftaran bersamaan menghasilkan nomor antrean unik", async () => {
        const pasien = [];
        for (let index = 0; index < 4; index += 1) {
            pasien.push(await createPasien(`Bersamaan-${suffix}-${index}`));
        }

        const results = await Promise.all(pasien.map((item) => enqueue(adminToken, item)));

        assert.deepEqual(results.map((res) => res.status), [201, 201, 201, 201]);
        const numbers = results.map((res) => res.body.data.no_antrean);
        assert.equal(new Set(numbers).size, numbers.length);
    });

    test("alokasi dari antrean menandai Dialokasikan dan antrean tidak bisa dibatalkan", async () => {
        const pasien = await createPasien();
        const queued = await enqueue(adminToken, pasien);
        assert.equal(queued.status, 201);

        const bed = await prisma.bed.create({
            data: {
                no_bed: `Q-${suffix}`,
                nama_bangsal: "Bangsal Uji",
                kelas_perawatan: "Kelas 3",
                status: "Tersedia",
            },
        });
        bedIds.push(bed.id_bed);

        const allocation = await api("POST", "/allocations", {
            token: adminToken,
            body: {
                id_pasien: pasien.id_pasien,
                id_bed: bed.id_bed,
                id_antrean: queued.body.data.id_antrean,
            },
        });
        assert.equal(allocation.status, 201);

        const detail = await api("GET", `/queues/${queued.body.data.id_antrean}`, { token: adminToken });
        assert.equal(detail.body.data.status, "Dialokasikan");
        assert.equal(detail.body.data.rekam_alokasi.id_alokasi, allocation.body.data.id_alokasi);

        const cancel = await api("PATCH", `/queues/${queued.body.data.id_antrean}`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(cancel.status, 409);
        assert.equal(cancel.body.error.code, "QUEUE_NOT_WAITING");
    });

    test("validasi input dan resource tidak ditemukan", async () => {
        const invalid = await api("POST", "/queues", { token: adminToken, body: { id_pasien: "x" } });
        assert.equal(invalid.status, 400);
        assert.equal(invalid.body.error.code, "VALIDATION_ERROR");

        const missing = await api("POST", "/queues", { token: adminToken, body: { id_pasien: 99999999 } });
        assert.equal(missing.status, 404);
        assert.equal(missing.body.error.code, "PASIEN_NOT_FOUND");

        const missingDetail = await api("GET", "/queues/99999999", { token: adminToken });
        assert.equal(missingDetail.status, 404);
        assert.equal(missingDetail.body.error.code, "QUEUE_NOT_FOUND");

        const daruratPasien = await prisma.pasien.create({
            data: {
                no_rm: `RMD${suffix.slice(-7)}${Math.floor(Math.random() * 1000)}`.slice(0, 20),
                nama_pasien: "Pasien Darurat",
                kondisi_pasien: "Darurat",
            },
        });
        pasienIds.push(daruratPasien.id_pasien);

        const emergencyQueue = await enqueue(adminToken, daruratPasien);
        assert.equal(emergencyQueue.status, 422);
        assert.equal(emergencyQueue.body.error.code, "QUEUE_PATIENT_EMERGENCY");
    });
});
