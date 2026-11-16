import { test } from "node:test";
import assert from "node:assert/strict";
import { countRoomNights, jakartaDate } from "../src/shared/utils/room-billing.js";
import { createRoomTariffSchema, previewBillingSchema } from "../src/modules/billing/billing.validation.js";
import { reconcileRoomSnapshotSchema } from "../src/modules/allocation/allocation.validation.js";

test("kamar: elapsed 24 jam, pembulatan ke atas dan minimal satu malam", () => {
    const start = new Date("2026-11-01T23:00:00+07:00");
    for (const [seconds, nights] of [[0, 1], [8 * 3600, 1], [86400, 1], [86401, 2], [25 * 3600, 2], [172800, 2], [172801, 3]]) {
        assert.equal(countRoomNights(start, new Date(start.getTime() + seconds * 1000)), nights);
    }
    for (const end of [null, new Date("invalid"), new Date(start.getTime() - 1000)]) {
        assert.throws(() => countRoomNights(start, end), { code: "ROOM_ALLOCATION_INVALID" });
    }
    assert.throws(() => countRoomNights(null, start), { code: "ROOM_ALLOCATION_INVALID" });
    assert.equal(jakartaDate(new Date("2026-11-01T17:00:00Z")).toISOString(), "2026-11-02T00:00:00.000Z");
    assert.equal(jakartaDate(new Date("2026-11-01T16:59:59Z")).toISOString(), "2026-11-01T00:00:00.000Z");
});

test("kamar: validasi kelas, uang, periode dan sumber input dari client", () => {
    const rate = { kelas_perawatan: "VIP", harga_per_malam: "400000.25", tanggal_berlaku: "2026-11-01" };
    assert.equal(createRoomTariffSchema.safeParse(rate).success, true);
    for (const change of [{ kelas_perawatan: "Kelas I" }, { harga_per_malam: "0" }, { harga_per_malam: "1.001" },
        { tanggal_berlaku: "2026-02-30" }, { tanggal_berakhir: "2026-11-01" }, { tanggal_berakhir: "2026-10-31" }]) {
        assert.equal(createRoomTariffSchema.safeParse({ ...rate, ...change }).success, false);
    }
    assert.equal(previewBillingSchema.safeParse({ id_rekap: 1, id_alokasi_list: [1, 1] }).success, false);
    assert.equal(previewBillingSchema.safeParse({ id_rekap: 1, id_alokasi_list: [1], jumlah_malam: 1 }).success, false);
    assert.equal(previewBillingSchema.safeParse({ id_rekap: 1, id_alokasi_list: [1], harga_per_malam: "1" }).success, false);
});

test("rekonsiliasi: tarif, alasan dan konfirmasi wajib; waktu dan nominal tidak diterima", () => {
    const body = { id_tarif_kamar: 1, alasan: "Alokasi sebelum fitur tarif kamar", konfirmasi: true };
    assert.equal(reconcileRoomSnapshotSchema.safeParse(body).success, true);
    for (const change of [{ id_tarif_kamar: 0 }, { alasan: " " }, { konfirmasi: false }, { harga_per_malam: "1" }, { waktu_alokasi: new Date().toISOString() }]) {
        assert.equal(reconcileRoomSnapshotSchema.safeParse({ ...body, ...change }).success, false);
    }
});
