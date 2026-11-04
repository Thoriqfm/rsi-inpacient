// API check untuk penambahan RME dummy. Butuh DATABASE_URL lokal; melewati diri bila tidak ada.
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
let superToken;
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

async function createAkun(role, tag) {
    const akun = await prisma.akun.create({
        data: {
            username: `t_m_${tag}_${suffix}`,
            password: "test-hash",
            role,
            nama_petugas: `Petugas ${tag}`,
        },
    });
    akunIds.push(akun.id_akun);
    return akun;
}

describe("RME dummy (seed manual)", { skip: !RUN }, () => {
    let pasien;

    before(async () => {
        server = app.listen(0);
        await once(server, "listening");
        baseUrl = `http://127.0.0.1:${server.address().port}/api`;

        superToken = tokenFor(await createAkun("Super Admin", "sa"));
        adminToken = tokenFor(await createAkun("Petugas Administrasi", "adm"));

        pasien = await prisma.pasien.create({
            data: {
                no_rm: `RM${suffix.slice(-8)}${Math.floor(Math.random() * 10000)}`.slice(0, 20),
                nama_pasien: `Pasien RME ${suffix}`,
            },
        });
        pasienIds.push(pasien.id_pasien);
    });

    after(async () => {
        await prisma.rmeDummy.deleteMany({ where: { id_riwayat: { in: rmeIds } } });
        await prisma.pasien.deleteMany({ where: { id_pasien: { in: pasienIds } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: akunIds } } });

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await prisma.$disconnect();
    });

    test("hanya Super Admin yang boleh menambah RME", async () => {
        assert.equal(
            (await api("POST", "/rme", { body: { id_pasien: pasien.id_pasien, kode_tindakan: "X", nama_tindakan: "X" } })).status,
            401,
        );

        const forbidden = await api("POST", "/rme", {
            token: adminToken,
            body: { id_pasien: pasien.id_pasien, kode_tindakan: "X", nama_tindakan: "X" },
        });
        assert.equal(forbidden.status, 403);
        assert.equal(forbidden.body.error.code, "FORBIDDEN");
    });

    test("Super Admin menambah RME dan tanggal diisi server bila kosong", async () => {
        const res = await api("POST", "/rme", {
            token: superToken,
            body: {
                id_pasien: pasien.id_pasien,
                kode_tindakan: "TD-01",
                nama_tindakan: "Pemeriksaan Darah",
                keterangan: "Sintetis",
            },
        });

        assert.equal(res.status, 201);
        rmeIds.push(res.body.data.id_riwayat);
        assert.equal(res.body.data.id_pasien, pasien.id_pasien);
        assert.equal(res.body.data.jumlah, 1);
        assert.equal(res.body.data.keterangan, "Sintetis");
        assert.ok(res.body.data.tanggal_tindakan);
    });

    test("jumlah nol dan pasien tidak dikenal ditolak", async () => {
        const zero = await api("POST", "/rme", {
            token: superToken,
            body: {
                id_pasien: pasien.id_pasien,
                kode_tindakan: "TD-02",
                nama_tindakan: "Tindakan",
                jumlah: 0,
            },
        });
        assert.equal(zero.status, 400);
        assert.equal(zero.body.error.code, "VALIDATION_ERROR");

        const missing = await api("POST", "/rme", {
            token: superToken,
            body: { id_pasien: 99999999, kode_tindakan: "TD-03", nama_tindakan: "Tindakan" },
        });
        assert.equal(missing.status, 404);
        assert.equal(missing.body.error.code, "PASIEN_NOT_FOUND");
    });
});
