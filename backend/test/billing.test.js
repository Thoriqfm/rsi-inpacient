// API + integrity check untuk UC-08/UC-09. Butuh DATABASE_URL lokal; melewati diri bila tidak ada.
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
const tarifIds = [];
const tagihanIds = [];
let adminToken;
let adminAkunId;
let counter = 0;
let recapCounter = 0;

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
            username: `t_b_${tag}_${suffix}`,
            password: "hash",
            role,
            nama_petugas: `Petugas ${tag}`,
        },
    });
    akunIds.push(akun.id_akun);
    return akun;
}

function newCode() {
    counter += 1;
    return `T${suffix.slice(-6)}${String(counter).padStart(2, "0")}`;
}

async function createTarif({ kode, harga, mulai, berakhir = null, status = "Aktif" }) {
    const tarif = await prisma.tarif.create({
        data: {
            kode_tindakan: kode,
            nama_tindakan: `Tindakan ${kode}`,
            harga,
            tanggal_berlaku: new Date(mulai),
            tanggal_berakhir: berakhir ? new Date(berakhir) : null,
            status,
        },
    });
    tarifIds.push(tarif.id_tarif);
    return tarif;
}

// Rekap + detail dibuat langsung agar tanggal tindakan bisa dikendalikan.
async function createRecap({ status = "Siap Billing", details = [] } = {}) {
    const pasien = await prisma.pasien.create({
        data: {
            no_rm: `RMB${suffix.slice(-8)}${String(pasienIds.length + 1).padStart(4, "0")}`.slice(0, 20),
            nama_pasien: `Pasien Billing ${suffix}`,
            kondisi_pasien: "Stabil",
        },
    });
    pasienIds.push(pasien.id_pasien);

    const detailRows = [];
    for (const detail of details) {
        const rme = await prisma.rmeDummy.create({
            data: {
                id_pasien: pasien.id_pasien,
                kode_tindakan: detail.kode,
                nama_tindakan: `Tindakan ${detail.kode}`,
                tanggal_tindakan: new Date(detail.tanggal),
                jumlah: detail.jumlah,
            },
        });
        rmeIds.push(rme.id_riwayat);
        detailRows.push({
            id_riwayat: rme.id_riwayat,
            kode_tindakan: detail.kode,
            nama_tindakan: rme.nama_tindakan,
            tanggal_tindakan: rme.tanggal_tindakan,
            jumlah: detail.jumlah,
        });
    }

    const rekap = await prisma.rekapTindakan.create({
        data: {
            kode_rekap: `BIL-${suffix}-${(recapCounter += 1)}`.slice(0, 30),
            id_pasien: pasien.id_pasien,
            id_akun: adminAkunId,
            status,
            tanggal_dibuat: new Date(),
            detail_rekap_tindakan_list: { create: detailRows },
        },
        select: { id_rekap: true },
    });
    rekapIds.push(rekap.id_rekap);

    return { id_rekap: rekap.id_rekap, pasien, details: detailRows };
}

async function createInvoice(id_rekap, { token = adminToken } = {}) {
    const res = await api("POST", "/billing", { token, body: { id_rekap } });
    if (res.status === 201) tagihanIds.push(res.body.data.id_tagihan);
    return res;
}

describe("Billing (UC-08/UC-09)", { skip: !RUN }, () => {
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
        await prisma.tarif.deleteMany({ where: { id_tarif: { in: tarifIds } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: akunIds } } });

        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await prisma.$disconnect();
    });

    test("billing memerlukan token dan role Petugas Administrasi", async () => {
        assert.equal((await api("GET", "/billing")).status, 401);

        const bedManagement = await createAkun("Petugas Bed Management", "bed");
        const forbidden = await api("GET", "/billing", { token: tokenFor(bedManagement) });
        assert.equal(forbidden.status, 403);
        assert.equal(forbidden.body.error.code, "FORBIDDEN");

        assert.equal((await api("GET", "/billing", { token: adminToken })).status, 200);
    });

    test("preview memakai tarif yang berlaku pada tanggal tindakan dan Decimal-safe", async () => {
        const kodeA = newCode();
        const kodeB = newCode();
        const rekap = await createRecap({
            details: [
                { kode: kodeA, tanggal: "2026-01-10T09:00:00.000Z", jumlah: 3 },
                // Kode A punya tarif lebih baru setelah tanggal tindakan: harus diabaikan.
                { kode: kodeB, tanggal: "2026-02-10T09:00:00.000Z", jumlah: 1 },
            ],
        });

        await createTarif({ kode: kodeA, harga: "999.99", mulai: "2025-01-01", berakhir: "2025-12-31" });
        await createTarif({ kode: kodeA, harga: "1234.56", mulai: "2026-01-01" });
        await createTarif({ kode: kodeA, harga: "5000.00", mulai: "2026-03-01" });
        // PC-17: Tarif Nonaktif diabaikan; hanya tarif berstatus Aktif yang dipakai.
        await createTarif({ kode: kodeB, harga: "9999.00", mulai: "2026-02-01", status: "Nonaktif" });
        await createTarif({ kode: kodeB, harga: "2000.00", mulai: "2026-01-01", status: "Aktif" });

        const res = await api("POST", "/billing/preview", {
            token: adminToken,
            body: { id_rekap: rekap.id_rekap },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.data.acuan_tarif, "tanggal_tindakan");
        assert.equal(res.body.data.items.length, 2);
        assert.equal(res.body.data.items[0].harga_satuan, "1234.56");
        assert.equal(res.body.data.items[0].subtotal, "3703.68");
        assert.equal(res.body.data.items[1].harga_satuan, "2000.00");
        assert.equal(res.body.data.total_biaya, "5703.68");
    });

    test("preview menolak rekap belum Siap Billing, tanpa tindakan, dan tarif hilang", async () => {
        const draft = await createRecap({ status: "Draft", details: [] });
        const notReady = await api("POST", "/billing/preview", {
            token: adminToken,
            body: { id_rekap: draft.id_rekap },
        });
        assert.equal(notReady.status, 422);
        assert.equal(notReady.body.error.code, "BILLING_NOT_READY");

        const empty = await createRecap({ details: [] });
        const noDetails = await api("POST", "/billing/preview", {
            token: adminToken,
            body: { id_rekap: empty.id_rekap },
        });
        assert.equal(noDetails.status, 422);
        assert.equal(noDetails.body.error.code, "BILLING_NO_DETAILS");

        const kode = newCode();
        const rekap = await createRecap({
            details: [{ kode, tanggal: "2026-01-10T09:00:00.000Z", jumlah: 1 }],
        });
        const missing = await api("POST", "/billing/preview", {
            token: adminToken,
            body: { id_rekap: rekap.id_rekap },
        });
        assert.equal(missing.status, 422);
        assert.equal(missing.body.error.code, "TARIFF_NOT_FOUND");
        assert.equal(missing.body.error.details[0].kode_tindakan, kode);
    });

    test("penerbitan membuat Draft, snapshot detail, audit, dan menolak invoice ganda", async () => {
        const kode = newCode();
        const rekap = await createRecap({
            details: [{ kode, tanggal: "2026-01-10T09:00:00.000Z", jumlah: 2 }],
        });
        await createTarif({ kode, harga: "1500.50", mulai: "2026-01-01" });

        const created = await createInvoice(rekap.id_rekap);
        assert.equal(created.status, 201);
        assert.match(created.body.data.no_tagihan, /^TGH-\d{8}-\d{3}$/);
        assert.equal(created.body.data.status, "Draft");
        assert.equal(created.body.data.total_biaya, "3001.00");
        assert.equal(created.body.data.detail_tagihan_list.length, 1);
        assert.equal(created.body.data.detail_tagihan_list[0].harga_satuan, "1500.50");
        assert.equal(created.body.data.detail_tagihan_list[0].subtotal, "3001.00");
        assert.match(created.body.data.kode_rekap, /^BIL-/);

        const audit = await prisma.logAudit.findFirst({
            where: { nama_tabel: "tagihan", id_referensi: created.body.data.id_tagihan, aksi: "CREATE" },
        });
        assert.ok(audit);

        const duplicate = await createInvoice(rekap.id_rekap);
        assert.equal(duplicate.status, 409);
        assert.equal(duplicate.body.error.code, "BILLING_ALREADY_INVOICED");

        const list = await api("GET", `/billing?q=${encodeURIComponent(created.body.data.no_tagihan)}`, {
            token: adminToken,
        });
        assert.equal(list.status, 200);
        assert.equal(list.body.data.items.length, 1);
        assert.equal(list.body.data.items[0].jumlah_item, 1);

        const detail = await api("GET", `/billing/${created.body.data.id_tagihan}`, {
            token: adminToken,
        });
        assert.equal(detail.status, 200);
        assert.equal(detail.body.data.detail_tagihan_list[0].nama_tindakan, `Tindakan ${kode}`);
    });

    test("status hanya boleh mengikuti state machine dan Lunas terkunci", async () => {
        const kode = newCode();
        const rekap = await createRecap({
            details: [{ kode, tanggal: "2026-01-10T09:00:00.000Z", jumlah: 1 }],
        });
        await createTarif({ kode, harga: "100.00", mulai: "2026-01-01" });
        const created = await createInvoice(rekap.id_rekap);
        const id = created.body.data.id_tagihan;

        const toCancel = await api("PATCH", `/billing/${id}/status`, {
            token: adminToken,
            body: { status: "Batal" },
        });
        assert.equal(toCancel.status, 409);
        assert.equal(toCancel.body.error.code, "BILLING_USE_CANCEL");

        const skip = await api("PATCH", `/billing/${id}/status`, {
            token: adminToken,
            body: { status: "Lunas" },
        });
        assert.equal(skip.status, 409);
        assert.equal(skip.body.error.code, "BILLING_STATUS_INVALID");

        const issued = await api("PATCH", `/billing/${id}/status`, {
            token: adminToken,
            body: { status: "Belum Dibayar" },
        });
        assert.equal(issued.status, 200);
        assert.equal(issued.body.data.status, "Belum Dibayar");

        const recalc = await api("POST", `/billing/${id}/recalculate`, { token: adminToken });
        assert.equal(recalc.status, 409);
        assert.equal(recalc.body.error.code, "BILLING_RECALC_NOT_ALLOWED");

        const paid = await api("PATCH", `/billing/${id}/status`, {
            token: adminToken,
            body: { status: "Lunas" },
        });
        assert.equal(paid.status, 200);
        assert.equal(paid.body.data.status, "Lunas");

        const cancelPaid = await api("POST", `/billing/${id}/cancel`, {
            token: adminToken,
            body: { alasan: "Salah input" },
        });
        assert.equal(cancelPaid.status, 409);
        assert.equal(cancelPaid.body.error.code, "BILLING_CANCEL_NOT_ALLOWED");
    });

    test("recalculate hanya untuk Draft, membekukan nominal setelah terbit, dan cancel ber-audit", async () => {
        const kode = newCode();
        const rekap = await createRecap({
            details: [{ kode, tanggal: "2026-01-10T09:00:00.000Z", jumlah: 1 }],
        });
        await createTarif({ kode, harga: "250.00", mulai: "2026-01-01" });
        const created = await createInvoice(rekap.id_rekap);
        const id = created.body.data.id_tagihan;

        // Data sumber berubah sebelum terbit: hitung ulang memakai nilai terbaru.
        await prisma.detailRekapTindakan.updateMany({
            where: { id_rekap: rekap.id_rekap },
            data: { jumlah: 4 },
        });

        const recalculated = await api("POST", `/billing/${id}/recalculate`, {
            token: adminToken,
            body: { catatan_penyesuaian: "Koreksi jumlah tindakan" },
        });
        assert.equal(recalculated.status, 200);
        assert.equal(recalculated.body.data.total_biaya, "1000.00");
        assert.equal(recalculated.body.data.catatan_penyesuaian, "Koreksi jumlah tindakan");
        assert.equal(recalculated.body.data.detail_tagihan_list[0].jumlah, 4);

        const audit = await prisma.logAudit.findFirst({
            where: { nama_tabel: "tagihan", id_referensi: id, aksi: "UPDATE" },
        });
        assert.ok(audit);

        const noReason = await api("POST", `/billing/${id}/cancel`, {
            token: adminToken,
            body: { alasan: " " },
        });
        assert.equal(noReason.status, 400);
        assert.equal(noReason.body.error.code, "VALIDATION_ERROR");

        const canceled = await api("POST", `/billing/${id}/cancel`, {
            token: adminToken,
            body: { alasan: "Pasien pindah penjamin" },
        });
        assert.equal(canceled.status, 200);
        assert.equal(canceled.body.data.status, "Batal");
        assert.equal(canceled.body.data.alasan_pembatalan, "Pasien pindah penjamin");
        assert.ok(canceled.body.data.tanggal_dibatalkan);

        assert.equal(
            await prisma.logAudit.count({
                where: { nama_tabel: "tagihan", id_referensi: id, aksi: "CANCEL" },
            }),
            1,
        );

        const reissue = await createInvoice(rekap.id_rekap);
        assert.equal(reissue.status, 201);
        assert.notEqual(reissue.body.data.id_tagihan, id);
    });
});
