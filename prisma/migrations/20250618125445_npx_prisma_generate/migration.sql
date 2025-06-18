-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_service_record_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_record_id" TEXT NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_record_attachments_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_service_record_attachments" ("attachment_url", "created_at", "id", "service_record_id") SELECT "attachment_url", "created_at", "id", "service_record_id" FROM "service_record_attachments";
DROP TABLE "service_record_attachments";
ALTER TABLE "new_service_record_attachments" RENAME TO "service_record_attachments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
