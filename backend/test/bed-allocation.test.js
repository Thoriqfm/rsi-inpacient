// API + concurrency check untuk UC-02/UC-03. Butuh DATABASE_URL lokal; melewati diri bila tidak ada.
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
const bedIds = [];
const pasienIds = [];
const antreanIds = [];
let bedManagerToken;
let adminToken;

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

async function createAkun(role) {
    // Username unik per suite; tag pendek agar tidak bentrok antar-role.
    const tag = role === "Petugas Bed Management" ? "bed" : "adm";
    const akun = await prisma.akun.create({
        data: {
            username: `t_${tag}_${suffix}`,
            password: "not-used",
            role,
            nama_petugas: "Petugas Uji",
        },
    });
    akunIds.push(akun.id_akun);
    return akun;
}

async function createBed(status = "Tersedia") {
    const bed = await prisma.bed.create({
        data: {
            // no_bed maksimal 20 karakter; suffix penuh bisa melewati batas.
            no_bed: `T-${suffix.slice(-12)}-${bedIds.length + 1}`,
            nama_bangsal: "Bangsal Uji",
            kelas_perawatan: "Kelas 3",
            status,
        },
    });
    bedIds.push(bed.id_bed);
    return bed;
}

async function createPasien() {
    const pasien = await prisma.pasien.create({
        data: {
            no_rm: `RMA${suffix.slice(-8)}${String(pasienIds.length + 1).padStart(4, "0")}`.slice(0, 20),
            nama_pasien: "Pasien Uji",
        },
    });
    pasienIds.push(pasien.id_pasien);
    return pasien;
}

describe("Bed management & allocation", { skip: !RUN }, () => {
    before(async () => {
        server = app.listen(0);
        await once(server, "listening");
        baseUrl = `http://127.0.0.1:${server.address().port}/api`;

        bedManagerToken = tokenFor(await createAkun("Petugas Bed Management"));
        adminToken = tokenFor(await createAkun("Petugas Administrasi"));
    });

    after(async () => {
        await prisma.logAudit.deleteMany({ where: { id_akun: { in: akunIds } } });
        await prisma.riwayatStatusPasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.rekamAlokasi.deleteMany({ where: { id_akun: { in: akunIds } } });
        await prisma.daftarTunggu.deleteMany({ where: { id_antrean: { in: antreanIds } } });
        await prisma.bed.deleteMany({ where: { id_bed: { in: bedIds } } });
        await prisma.pasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: akunIds } } });

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await prisma.$disconnect();
    });

    test("mutasi master bed ditolak untuk Petugas Administrasi namun pemantauan diizinkan", async () => {
        const bed = await createBed("Tersedia");

        const listRes = await api("GET", "/beds", { token: adminToken });
        assert.equal(listRes.status, 200);

        const createRes = await api("POST", "/beds", {
            token: adminToken,
            body: {
                no_bed: `B-${suffix.slice(-5)}-ADM`,
                nama_bangsal: "Bangsal Uji",
                kelas_perawatan: "Kelas 1",
            },
        });
        assert.equal(createRes.status, 403);
        assert.equal(createRes.body.error.code, "FORBIDDEN");

        const updateRes = await api("PATCH", `/beds/${bed.id_bed}`, {
            token: adminToken,
            body: { status: "Pembersihan" },
        });
        assert.equal(updateRes.status, 403);

        const deleteRes = await api("DELETE", `/beds/${bed.id_bed}`, {
            token: adminToken,
        });
        assert.equal(deleteRes.status, 403);
    });

    test("Petugas Administrasi hanya melihat bed Tersedia", async () => {
        const available = await createBed("Tersedia");
        const occupied = await createBed("Terisi");

        const res = await api("GET", "/beds/available", { token: adminToken });

        assert.equal(res.status, 200);
        const ids = res.body.data.items.map((bed) => bed.id_bed);
        assert.ok(ids.includes(available.id_bed));
        assert.ok(!ids.includes(occupied.id_bed));
        // Informasi untuk alokasi dibatasi: tanpa status dan timestamp.
        assert.deepEqual(Object.keys(res.body.data.items[0]).sort(), [
            "id_bed",
            "kelas_perawatan",
            "nama_bangsal",
            "no_bed",
            "tipe_bed",
        ]);
    });

    test("alokasi mengubah status bed dan tidak bisa dobel", async () => {
        const bed = await createBed();
        const pasien = await createPasien();

        const first = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: bed.id_bed },
        });

        assert.equal(first.status, 201);
        assert.equal(first.body.data.status_alokasi, "Aktif");

        const bedAfter = await prisma.bed.findUnique({ where: { id_bed: bed.id_bed } });
        assert.equal(bedAfter.status, "Terisi");

        const pasienAfter = await prisma.pasien.findUnique({ where: { id_pasien: pasien.id_pasien } });
        assert.equal(pasienAfter.status_penanganan, "Rawat Inap");

        const second = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: bed.id_bed },
        });

        assert.equal(second.status, 409);
        assert.equal(second.body.error.code, "BED_UNAVAILABLE");
        assert.equal(await prisma.rekamAlokasi.count({ where: { id_bed: bed.id_bed } }), 1);
    });

    test("detail bed menyertakan occupant dan field kamar", async () => {
        const pasien = await createPasien();

        const created = await api("POST", "/beds", {
            token: bedManagerToken,
            body: {
                no_bed: `K-${suffix}`,
                nama_bangsal: "Bangsal Uji",
                nama_kamar: "Kamar 101",
                kelas_perawatan: "Kelas 1",
                fasilitas: "AC, Kamar Mandi Dalam",
            },
        });

        assert.equal(created.status, 201);
        assert.equal(created.body.data.nama_kamar, "Kamar 101");
        assert.equal(created.body.data.fasilitas, "AC, Kamar Mandi Dalam");
        assert.equal(created.body.data.occupant, null);
        bedIds.push(created.body.data.id_bed);

        const allocated = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: created.body.data.id_bed },
        });
        assert.equal(allocated.status, 201);

        const detail = await api("GET", `/beds/${created.body.data.id_bed}`, {
            token: bedManagerToken,
        });

        assert.equal(detail.status, 200);
        assert.deepEqual(detail.body.data.occupant, {
            no_rm: pasien.no_rm,
            nama_pasien: pasien.nama_pasien,
        });
    });

    test("status bed tidak bisa diubah manual selama alokasi aktif", async () => {
        const bed = await createBed();
        const pasien = await createPasien();

        await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: bed.id_bed },
        });

        const res = await api("PATCH", `/beds/${bed.id_bed}`, {
            token: bedManagerToken,
            body: { status: "Pemeliharaan" },
        });

        assert.equal(res.status, 409);
        assert.equal(res.body.error.code, "BED_IN_USE");
    });

    test("menyelesaikan alokasi membebaskan bed, penutupan kedua ditolak", async () => {
        const bed = await createBed();
        const pasien = await createPasien();

        const created = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: bed.id_bed },
        });

        const closed = await api("PATCH", `/allocations/${created.body.data.id_alokasi}`, {
            token: adminToken,
            body: { status_alokasi: "Selesai" },
        });

        assert.equal(closed.status, 200);
        assert.equal(closed.body.data.status_alokasi, "Selesai");
        assert.ok(closed.body.data.waktu_selesai);

        const bedAfter = await prisma.bed.findUnique({ where: { id_bed: bed.id_bed } });
        assert.equal(bedAfter.status, "Tersedia");

        const again = await api("PATCH", `/allocations/${created.body.data.id_alokasi}`, {
            token: adminToken,
            body: { status_alokasi: "Selesai" },
        });

        assert.equal(again.status, 409);
        assert.equal(again.body.error.code, "ALLOCATION_NOT_ACTIVE");
    });

    test("dua request bersamaan pada satu bed: satu sukses, satu konflik", async () => {
        const bed = await createBed();
        const pasienA = await createPasien();
        const pasienB = await createPasien();

        const [a, b] = await Promise.all([
            api("POST", "/allocations", {
                token: adminToken,
                body: { id_pasien: pasienA.id_pasien, id_bed: bed.id_bed },
            }),
            api("POST", "/allocations", {
                token: bedManagerToken,
                body: { id_pasien: pasienB.id_pasien, id_bed: bed.id_bed },
            }),
        ]);

        assert.deepEqual([a.status, b.status].sort(), [201, 409]);
        assert.equal(
            await prisma.rekamAlokasi.count({
                where: { id_bed: bed.id_bed, status_alokasi: "Aktif" },
            }),
            1,
        );
    });

    test("bed dengan alokasi aktif tidak bisa dihapus, setelah selesai menjadi soft delete", async () => {
        const bed = await createBed();
        const pasien = await createPasien();

        const created = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: bed.id_bed },
        });
        assert.equal(created.status, 201);

        const blocked = await api("DELETE", `/beds/${bed.id_bed}`, { token: bedManagerToken });
        assert.equal(blocked.status, 409);

        await api("PATCH", `/allocations/${created.body.data.id_alokasi}`, {
            token: adminToken,
            body: { status_alokasi: "Selesai" },
        });

        const deleted = await api("DELETE", `/beds/${bed.id_bed}`, { token: bedManagerToken });
        assert.equal(deleted.status, 200);

        const row = await prisma.bed.findUnique({ where: { id_bed: bed.id_bed } });
        assert.ok(row.deleted_at);

        const missing = await api("GET", `/beds/${bed.id_bed}`, { token: bedManagerToken });
        assert.equal(missing.status, 404);
    });

    test("alokasi dari antrean menandai antrean Dialokasikan", async () => {
        const bed = await createBed();
        const pasien = await createPasien();
        const antrean = await prisma.daftarTunggu.create({
            data: {
                id_pasien: pasien.id_pasien,
                id_akun: akunIds[0],
                waktu_masuk: new Date(),
                no_antrean: Number(suffix.slice(-6)) + Math.floor(Math.random() * 1000),
            },
        });
        antreanIds.push(antrean.id_antrean);

        const res = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: bed.id_bed, id_antrean: antrean.id_antrean },
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.data.id_antrean, antrean.id_antrean);

        const queueAfter = await prisma.daftarTunggu.findUnique({
            where: { id_antrean: antrean.id_antrean },
        });
        assert.equal(queueAfter.status, "Dialokasikan");

        // Alokasi ulang antrean yang sama ditolak oleh unique index id_antrean.
        const bed2 = await createBed();
        const again = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: bed2.id_bed, id_antrean: antrean.id_antrean },
        });
        assert.equal(again.status, 409);
    });

    test("validasi input dan resource tidak ditemukan", async () => {
        const invalid = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: "x" },
        });
        assert.equal(invalid.status, 400);
        assert.equal(invalid.body.error.code, "VALIDATION_ERROR");

        const pasien = await createPasien();
        const missingBed = await api("POST", "/allocations", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, id_bed: 99999999 },
        });
        assert.equal(missingBed.status, 404);
        assert.equal(missingBed.body.error.code, "BED_NOT_FOUND");

        const noToken = await api("GET", "/allocations");
        assert.equal(noToken.status, 401);
    });
});
