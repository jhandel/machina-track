/*
  Warnings:

  - You are about to drop the column `location` on the `consumables` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `consumables` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `consumables` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `metrology_tools` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturer` on the `metrology_tools` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `metrology_tools` table. All the data in the column will be lost.
  - Added the required column `location_id` to the `consumables` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_id` to the `consumables` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location_id` to the `equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_id` to the `metrology_tools` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Recreate consumables table with FK relationships
CREATE TABLE "new_consumables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "material_id" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_quantity" INTEGER NOT NULL DEFAULT 0,
    "location_id" TEXT NOT NULL,
    "tool_life_hours" REAL,
    "remaining_tool_life_hours" REAL,
    "last_used_date" TEXT,
    "end_of_life_date" TEXT,
    "supplier" TEXT,
    "cost_per_unit" REAL,
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consumables_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "consumable_types" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "consumables_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "consumable_materials" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "consumables_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- Migrate data for consumables - map string values to FK IDs
INSERT INTO "new_consumables" (
    "id", "name", "type_id", "material_id", "size", "quantity", "min_quantity", "location_id", 
    "tool_life_hours", "remaining_tool_life_hours", "last_used_date", "end_of_life_date", 
    "supplier", "cost_per_unit", "image_url", "notes", "created_at", "updated_at"
) 
SELECT 
    c."id", 
    c."name", 
    (SELECT ct.id FROM consumable_types ct WHERE ct.name = c.type) as type_id,
    (SELECT cm.id FROM consumable_materials cm WHERE cm.name = c.material) as material_id,
    c."size", 
    c."quantity", 
    c."min_quantity", 
    (SELECT l.id FROM locations l WHERE l.name = c.location) as location_id,
    c."tool_life_hours", 
    c."remaining_tool_life_hours", 
    c."last_used_date", 
    c."end_of_life_date", 
    c."supplier", 
    c."cost_per_unit", 
    c."image_url", 
    c."notes", 
    c."created_at", 
    c."updated_at"
FROM "consumables" c;

DROP TABLE "consumables";
ALTER TABLE "new_consumables" RENAME TO "consumables";

-- Recreate equipment table with FK relationships
CREATE TABLE "new_equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL UNIQUE,
    "location_id" TEXT NOT NULL,
    "purchase_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'operational',
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "equipment_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- Migrate data for equipment - map string values to FK IDs
INSERT INTO "new_equipment" (
    "id", "name", "model", "serial_number", "location_id", "purchase_date", 
    "status", "image_url", "notes", "created_at", "updated_at"
) 
SELECT 
    e."id", 
    e."name", 
    e."model", 
    e."serial_number", 
    (SELECT l.id FROM locations l WHERE l.name = e.location) as location_id,
    e."purchase_date", 
    e."status", 
    e."image_url", 
    e."notes", 
    e."created_at", 
    e."updated_at"
FROM "equipment" e;

DROP TABLE "equipment";
ALTER TABLE "new_equipment" RENAME TO "equipment";

-- Recreate metrology_tools table with FK relationships
CREATE TABLE "new_metrology_tools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL UNIQUE,
    "manufacturer_id" TEXT,
    "calibration_interval_days" INTEGER NOT NULL,
    "last_calibration_date" TEXT,
    "next_calibration_date" TEXT,
    "location_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'calibrated',
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "metrology_tools_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "metrology_tool_types" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "metrology_tools_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "metrology_tools_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- Migrate data for metrology_tools - map string values to FK IDs
INSERT INTO "new_metrology_tools" (
    "id", "name", "type_id", "serial_number", "manufacturer_id", "calibration_interval_days", 
    "last_calibration_date", "next_calibration_date", "location_id", "status", 
    "image_url", "notes", "created_at", "updated_at"
) 
SELECT 
    mt."id", 
    mt."name", 
    (SELECT mtt.id FROM metrology_tool_types mtt WHERE mtt.name = mt.type) as type_id,
    mt."serial_number", 
    (SELECT m.id FROM manufacturers m WHERE m.name = mt.manufacturer) as manufacturer_id,
    mt."calibration_interval_days", 
    mt."last_calibration_date", 
    mt."next_calibration_date", 
    (SELECT l.id FROM locations l WHERE l.name = mt.location) as location_id,
    mt."status", 
    mt."image_url", 
    mt."notes", 
    mt."created_at", 
    mt."updated_at"
FROM "metrology_tools" mt;

DROP TABLE "metrology_tools";
ALTER TABLE "new_metrology_tools" RENAME TO "metrology_tools";

-- Create all indexes
CREATE INDEX "idx_consumables_quantity" ON "consumables"("quantity");
CREATE INDEX "idx_consumables_location" ON "consumables"("location_id");
CREATE INDEX "idx_consumables_type" ON "consumables"("type_id");
CREATE INDEX "idx_consumables_material" ON "consumables"("material_id");

CREATE INDEX "idx_equipment_location" ON "equipment"("location_id");
CREATE INDEX "idx_equipment_status" ON "equipment"("status");

CREATE INDEX "idx_metrology_tools_next_calibration" ON "metrology_tools"("next_calibration_date");
CREATE INDEX "idx_metrology_tools_status" ON "metrology_tools"("status");
CREATE INDEX "idx_metrology_tools_type" ON "metrology_tools"("type_id");
CREATE INDEX "idx_metrology_tools_manufacturer" ON "metrology_tools"("manufacturer_id");
CREATE INDEX "idx_metrology_tools_location" ON "metrology_tools"("location_id");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
