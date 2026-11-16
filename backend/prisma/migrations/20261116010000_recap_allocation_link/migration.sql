-- Preserve legacy recaps/invoices; bind only unambiguous sources in application transactions.
ALTER TABLE "rekap_tindakan" ADD COLUMN "id_alokasi" INTEGER NULL;
CREATE INDEX "idx_rekap_alokasi" ON "rekap_tindakan" ("id_alokasi");
ALTER TABLE "rekap_tindakan" ADD CONSTRAINT "fk_rekap_alokasi" FOREIGN KEY ("id_alokasi") REFERENCES "rekam_alokasi" ("id_alokasi") ON DELETE NO ACTION ON UPDATE NO ACTION;
