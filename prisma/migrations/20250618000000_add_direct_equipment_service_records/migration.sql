-- Make maintenance_task_id optional in service_records
ALTER TABLE "service_records" RENAME TO "service_records_old";

-- Create new table with equipment_id and optional maintenance_task_id
CREATE TABLE "service_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "maintenance_task_id" TEXT,
  "equipment_id" TEXT,
  "date" TEXT NOT NULL,
  "performed_by" TEXT NOT NULL,
  "description_of_work" TEXT NOT NULL,
  "cost" REAL,
  "notes" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("maintenance_task_id") REFERENCES "maintenance_tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Copy data from old table to new table
INSERT INTO "service_records" ("id", "maintenance_task_id", "date", "performed_by", "description_of_work", "cost", "notes", "created_at")
SELECT "id", "maintenance_task_id", "date", "performed_by", "description_of_work", "cost", "notes", "created_at"
FROM "service_records_old";

-- Create the indexes - using DROP IF EXISTS to avoid errors if they already exist
DROP INDEX IF EXISTS "idx_service_records_task";
CREATE INDEX "idx_service_records_task" ON "service_records"("maintenance_task_id");
CREATE INDEX "idx_service_records_equipment" ON "service_records"("equipment_id");

-- Drop the old table
DROP TABLE "service_records_old";

-- For existing service records, set equipment_id based on maintenance_task
UPDATE "service_records"
SET "equipment_id" = (
  SELECT "equipment_id" 
  FROM "maintenance_tasks" 
  WHERE "maintenance_tasks"."id" = "service_records"."maintenance_task_id"
)
WHERE "maintenance_task_id" IS NOT NULL;
