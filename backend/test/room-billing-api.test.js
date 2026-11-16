// Opt-in only: TEST_DATABASE_URL must name an isolated test database.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import jwt from "jsonwebtoken";

const RUN = Boolean(process.env.TEST_DATABASE_URL);
if (RUN) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { default: prisma } = await import("../src/config/prisma.js");
const { default: app } = await import("../src/app.js");
const suffix = `${Date.now()}`;
let server, base, admin, manager, superAdmin, patient, otherPatient, rate;
const accounts = [], beds = [], recaps = [], rates = [], invoices = [], allocations = [];
const actionRates = [], rmeRows = [];
let counter = 0;

function token(account) {
    return jwt.sign({ username: account.username, role: account.role }, process.env.JWT_SECRET, {
        subject: String(account.id_akun), algorithm: "HS256", expiresIn: "1h",
    });
}
async function api(method, path, body, account = admin) {
    const response = await fetch(`${base}${path}`, { method,
        headers: { "content-type": "application/json", ...(account ? { authorization: `Bearer ${token(account)}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = { status: response.status, body: await response.json() };
    if (method === "POST" && path === "/billing" && response.status === 201) invoices.push(result.body.data.id_tagihan);
    if (method === "POST" && path === "/billing/room-tariffs" && response.status === 201) rates.push(result.body.data.id_tarif_kamar);
    return result;
}
async function makeRecap(id_pasien = patient.id_pasien) {
    const row = await prisma.rekapTindakan.create({ data: {
        id_pasien, id_akun: admin.id_akun, kode_rekap: `ROOM-${suffix}-${++counter}`, status: "Siap Billing",
    } });
    recaps.push(row.id_rekap); return row;
}
async function makeAllocation({ status = "Selesai", snapshot = true, id_pasien = patient.id_pasien } = {}) {
    const bed = await prisma.bed.create({ data: {
        no_bed: `RB${suffix}${++counter}`.slice(-20), nama_bangsal: "Uji Tarif", kelas_perawatan: "VIP",
    } }); beds.push(bed.id_bed);
    const row = await prisma.rekamAlokasi.create({ data: {
        id_pasien, id_bed: bed.id_bed, id_akun: manager.id_akun,
        waktu_alokasi: new Date("2026-11-01T00:00:00Z"),
        waktu_selesai: status === "Aktif" ? null : new Date("2026-11-02T01:00:00Z"),
        status_alokasi: status,
        ...(snapshot ? { id_tarif_kamar: rate.id_tarif_kamar, kelas_perawatan_snapshot: "VIP", harga_per_malam_snapshot: rate.harga_per_malam } : {}),
    } }); allocations.push(row.id_alokasi); return row;
}

describe("Room billing API, snapshot dan concurrency", { skip: !RUN }, () => {
    before(async () => {
        for (const [label, role] of [["adm", "Petugas Administrasi"], ["bed", "Petugas Bed Management"], ["super", "Super Admin"]]) {
            accounts.push(await prisma.akun.create({ data: { username: `room_${label}_${suffix}`, password: "synthetic-hash", role, nama_petugas: `Uji ${label}` } }));
        }
        [admin, manager, superAdmin] = accounts;
        patient = await prisma.pasien.create({ data: { no_rm: `RP${suffix}`, nama_pasien: "Pasien Uji Tarif" } });
        otherPatient = await prisma.pasien.create({ data: { no_rm: `RQ${suffix}`, nama_pasien: "Pasien Uji Lain" } });
        server = app.listen(0); await once(server, "listening"); base = `http://127.0.0.1:${server.address().port}/api`;
        const created = await api("POST", "/billing/room-tariffs", {
            kelas_perawatan: "VIP", harga_per_malam: "400000.25", tanggal_berlaku: "2026-01-01",
        }, superAdmin);
        assert.equal(created.status, 201, JSON.stringify(created.body));
        rate = await prisma.tarifKamar.findUnique({ where: { id_tarif_kamar: created.body.data.id_tarif_kamar } });
    });

    after(async () => {
        // Release circular invoice claims before deleting synthetic fixtures.
        await prisma.rekamAlokasi.updateMany({ where: { id_alokasi: { in: allocations } }, data: { id_tagihan_kamar: null } });
        await prisma.detailTagihan.deleteMany({ where: { id_tagihan: { in: invoices } } });
        await prisma.tagihan.deleteMany({ where: { id_tagihan: { in: invoices } } });
        await prisma.detailRekapTindakan.deleteMany({ where: { id_rekap: { in: recaps } } });
        await prisma.rekapTindakan.deleteMany({ where: { id_rekap: { in: recaps } } });
        await prisma.rmeDummy.deleteMany({ where: { id_riwayat: { in: rmeRows } } });
        await prisma.tarif.deleteMany({ where: { id_tarif: { in: actionRates } } });
        await prisma.rekamAlokasi.deleteMany({ where: { id_akun: manager.id_akun } });
        await prisma.riwayatStatusPasien.deleteMany({ where: { id_pasien: { in: [patient.id_pasien, otherPatient.id_pasien] } } });
        await prisma.bed.deleteMany({ where: { id_bed: { in: beds } } });
        await prisma.pasien.deleteMany({ where: { id_pasien: { in: [patient.id_pasien, otherPatient.id_pasien] } } });
        await prisma.tarifKamar.deleteMany({ where: { id_tarif_kamar: { in: rates } } });
        await prisma.logAudit.deleteMany({ where: { id_akun: { in: accounts.map((a) => a.id_akun) } } });
        await prisma.akun.deleteMany({ where: { id_akun: { in: accounts.map((a) => a.id_akun) } } });
        if (server) await new Promise((resolve) => server.close(resolve));
        await prisma.$disconnect();
    });

    test("auth, role dan input harga tetap diperiksa backend", async () => {
        assert.equal((await api("GET", "/billing/room-tariffs", undefined, null)).status, 401);
        assert.equal((await api("GET", "/billing/room-tariffs", undefined, manager)).status, 403);
        assert.equal((await api("GET", "/billing/room-tariffs")).status, 200);
        assert.equal((await api("POST", "/billing/room-tariffs", {}, admin)).status, 403);
        assert.equal((await api("POST", "/billing/room-tariffs", { kelas_perawatan: "VIP", harga_per_malam: "0", tanggal_berlaku: "2026-01-01" }, superAdmin)).status, 400);
    });

    test("overlap serentak ditolak; mengganti periode dilakukan atomik", async () => {
        const body = { kelas_perawatan: "Kelas 2", harga_per_malam: "200000.10", tanggal_berlaku: "2090-01-01", tanggal_berakhir: "2090-03-01" };
        const both = await Promise.all([api("POST", "/billing/room-tariffs", body, superAdmin), api("POST", "/billing/room-tariffs", { ...body, tanggal_berlaku: "2090-02-01" }, superAdmin)]);
        assert.deepEqual(both.map((r) => r.status).sort(), [201, 409]);
        const changed = await api("POST", "/billing/room-tariffs", { kelas_perawatan: "VIP", harga_per_malam: "500000.00", tanggal_berlaku: "2090-01-01", id_tarif_sebelumnya: rate.id_tarif_kamar }, superAdmin);
        assert.equal(changed.status, 201, JSON.stringify(changed.body));
        const old = await prisma.tarifKamar.findUnique({ where: { id_tarif_kamar: rate.id_tarif_kamar } });
        assert.equal(old.tanggal_berakhir.toISOString().slice(0, 10), "2090-01-01");
    });

    test("alokasi API menyimpan snapshot; mengganti kelas bed tidak mengubah harga", async () => {
        const bed = await prisma.bed.create({ data: { no_bed: `RS${suffix}`, nama_bangsal: "Uji", kelas_perawatan: "VIP" } }); beds.push(bed.id_bed);
        const created = await api("POST", "/allocations", { id_pasien: patient.id_pasien, id_bed: bed.id_bed }, manager);
        assert.equal(created.status, 201, JSON.stringify(created.body));
        allocations.push(created.body.data.id_alokasi);
        assert.equal(created.body.data.harga_per_malam_snapshot, "400000.25");
        await prisma.bed.update({ where: { id_bed: bed.id_bed }, data: { kelas_perawatan: "Kelas 1" } });
        const stored = await prisma.rekamAlokasi.findUnique({ where: { id_alokasi: created.body.data.id_alokasi } });
        assert.equal(stored.kelas_perawatan_snapshot, "VIP");
        assert.equal(stored.harga_per_malam_snapshot.toFixed(2), "400000.25");
    });

    test("25 jam ditagih dua malam; snapshot dipertahankan saat hitung ulang", async () => {
        const recap = await makeRecap(); const allocation = await makeAllocation();
        const body = { id_rekap: recap.id_rekap, id_alokasi_list: [allocation.id_alokasi] };
        const preview = await api("POST", "/billing/preview", body);
        assert.equal(preview.status, 200, JSON.stringify(preview.body));
        assert.equal(preview.body.data.items[0].jumlah, 2);
        assert.equal(preview.body.data.total_biaya, "800000.50");
        const created = await api("POST", "/billing", body);
        assert.equal(created.status, 201, JSON.stringify(created.body));
        assert.equal(created.body.data.detail_tagihan_list[0].jenis_item, "KAMAR");
        assert.equal(created.body.data.detail_tagihan_list[0].id_detail_rekap, null);
        assert.equal(created.body.data.total_biaya, "800000.50");
        const recalc = await api("POST", `/billing/${created.body.data.id_tagihan}/recalculate`, {});
        assert.equal(recalc.status, 200, JSON.stringify(recalc.body));
        assert.equal(recalc.body.data.total_biaya, "800000.50");
    });

    test("total tindakan dan kamar digabung dengan Decimal; invoice terbit tetap membeku", async () => {
        const recap = await makeRecap(); const allocation = await makeAllocation();
        const kode = `RK${suffix}`;
        const tarif = await prisma.tarif.create({ data: { kode_tindakan: kode, nama_tindakan: "Tindakan Uji",
            harga: "1500.50", tanggal_berlaku: new Date("2026-01-01"), status: "Aktif" } }); actionRates.push(tarif.id_tarif);
        const rme = await prisma.rmeDummy.create({ data: { id_pasien: patient.id_pasien, kode_tindakan: kode,
            nama_tindakan: "Tindakan Uji", tanggal_tindakan: new Date("2026-11-01"), jumlah: 2 } }); rmeRows.push(rme.id_riwayat);
        await prisma.detailRekapTindakan.create({ data: { id_rekap: recap.id_rekap, id_riwayat: rme.id_riwayat,
            kode_tindakan: kode, nama_tindakan: "Tindakan Uji", tanggal_tindakan: rme.tanggal_tindakan, jumlah: 2 } });
        const body = { id_rekap: recap.id_rekap, id_alokasi_list: [allocation.id_alokasi] };
        const preview = await api("POST", "/billing/preview", body);
        const created = await api("POST", "/billing", body);
        assert.equal(created.status, 201, JSON.stringify(created.body));
        assert.equal(created.body.data.total_biaya, "803001.50");
        assert.equal(preview.body.data.total_biaya, created.body.data.total_biaya);
        assert.deepEqual(created.body.data.detail_tagihan_list.map((d) => d.jenis_item).sort(), ["KAMAR", "TINDAKAN"]);
        const id = created.body.data.id_tagihan;
        assert.equal((await api("PATCH", `/billing/${id}/status`, { status: "Belum Dibayar" })).status, 200);
        assert.equal((await api("POST", `/billing/${id}/recalculate`, {})).status, 409);
        assert.equal((await api("GET", `/billing/${id}`)).body.data.total_biaya, "803001.50");
    });

    test("tarif hilang menggagalkan alokasi secara atomik", async () => {
        const bed = await prisma.bed.create({ data: { no_bed: `RN${suffix}`, nama_bangsal: "Uji", kelas_perawatan: "Kelas 2" } }); beds.push(bed.id_bed);
        const result = await api("POST", "/allocations", { id_pasien: patient.id_pasien, id_bed: bed.id_bed }, manager);
        assert.equal(result.status, 422, JSON.stringify(result.body));
        assert.equal(result.body.error.code, "ROOM_TARIFF_NOT_FOUND");
        assert.equal((await prisma.bed.findUnique({ where: { id_bed: bed.id_bed } })).status, "Tersedia");
        assert.equal(await prisma.rekamAlokasi.count({ where: { id_bed: bed.id_bed } }), 0);
    });

    test("dua rekap tidak dapat menagih alokasi sama; cancel membebaskan klaim tanpa menghapus snapshot", async () => {
        const allocation = await makeAllocation(); const first = await makeRecap(); const second = await makeRecap();
        const results = await Promise.all([first, second].map((r) => api("POST", "/billing", { id_rekap: r.id_rekap, id_alokasi_list: [allocation.id_alokasi] })));
        assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
        const winner = results.find((r) => r.status === 201).body.data;
        assert.equal((await api("POST", `/billing/${winner.id_tagihan}/cancel`, { alasan: "Koreksi uji" })).status, 200);
        const stored = await prisma.rekamAlokasi.findUnique({ where: { id_alokasi: allocation.id_alokasi } });
        assert.equal(stored.id_tagihan_kamar, null);
        const loser = results[0].status === 201 ? second : first;
        assert.equal((await api("POST", "/billing", { id_rekap: loser.id_rekap, id_alokasi_list: [allocation.id_alokasi] })).status, 201);
        const old = await api("GET", `/billing/${winner.id_tagihan}`);
        assert.equal(old.body.data.detail_tagihan_list[0].subtotal, "800000.50");
    });

    test("alokasi aktif hanya estimasi; batal, pasien lain dan snapshot hilang ditolak", async () => {
        const recap = await makeRecap(); const active = await makeAllocation({ status: "Aktif" });
        const body = { id_rekap: recap.id_rekap, id_alokasi_list: [active.id_alokasi] };
        const preview = await api("POST", "/billing/preview", body);
        assert.equal(preview.status, 200, JSON.stringify(preview.body));
        assert.equal(preview.body.data.items[0].estimasi, true);
        assert.equal((await api("POST", "/billing", body)).body.error.code, "ROOM_ALLOCATION_ACTIVE");
        for (const [options, code] of [[{ status: "Batal" }, "ROOM_ALLOCATION_INVALID"], [{ id_pasien: otherPatient.id_pasien }, "ROOM_ALLOCATION_INVALID"], [{ snapshot: false }, "ROOM_SNAPSHOT_MISSING"]]) {
            const allocation = await makeAllocation(options);
            const rejected = await api("POST", "/billing", { id_rekap: recap.id_rekap, id_alokasi_list: [allocation.id_alokasi] });
            assert.equal(rejected.body.error.code, code);
        }
        assert.equal((await api("POST", "/billing", { ...body, id_alokasi_list: [active.id_alokasi, active.id_alokasi] })).status, 400);
    });

    test("cancel dan hitung ulang bersamaan tidak meninggalkan klaim atau menghapus snapshot", async () => {
        const recap = await makeRecap(); const allocation = await makeAllocation();
        const created = await api("POST", "/billing", { id_rekap: recap.id_rekap, id_alokasi_list: [allocation.id_alokasi] });
        assert.equal(created.status, 201, JSON.stringify(created.body));
        const id = created.body.data.id_tagihan;
        const [recalc, cancelled] = await Promise.all([
            api("POST", `/billing/${id}/recalculate`, {}), api("POST", `/billing/${id}/cancel`, { alasan: "Uji request bersamaan" }),
        ]);
        assert.ok([200, 409].includes(recalc.status), JSON.stringify(recalc.body));
        assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
        assert.equal((await prisma.rekamAlokasi.findUnique({ where: { id_alokasi: allocation.id_alokasi } })).id_tagihan_kamar, null);
        const detail = await api("GET", `/billing/${id}`);
        assert.equal(detail.body.data.status, "Batal");
        assert.equal(detail.body.data.detail_tagihan_list[0].subtotal, "800000.50");
    });
});
