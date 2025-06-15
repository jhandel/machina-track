-- CreateTable
CREATE TABLE "calibration_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metrology_tool_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "notes" TEXT,
    "result" TEXT NOT NULL,
    "certificate_url" TEXT,
    "next_due_date" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calibration_logs_metrology_tool_id_fkey" FOREIGN KEY ("metrology_tool_id") REFERENCES "metrology_tools" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "cutting_tools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "material" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_quantity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "tool_life_hours" REAL,
    "remaining_tool_life_hours" REAL,
    "last_used_date" TEXT,
    "end_of_life_date" TEXT,
    "supplier" TEXT,
    "cost_per_unit" REAL,
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "machine_log_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipment_id" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "error_code" TEXT,
    "metric_name" TEXT NOT NULL,
    "metric_value" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "machine_log_entries_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "maintenance_parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maintenance_task_id" TEXT NOT NULL,
    "part_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_parts_maintenance_task_id_fkey" FOREIGN KEY ("maintenance_task_id") REFERENCES "maintenance_tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "maintenance_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipment_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency_days" INTEGER,
    "last_performed_date" TEXT,
    "next_due_date" TEXT,
    "assigned_to" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_tasks_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "service_record_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_record_id" TEXT NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_record_attachments_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maintenance_task_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "description_of_work" TEXT NOT NULL,
    "cost" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_records_maintenance_task_id_fkey" FOREIGN KEY ("maintenance_task_id") REFERENCES "maintenance_tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "metrology_tools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "manufacturer" TEXT,
    "calibration_interval_days" INTEGER NOT NULL,
    "last_calibration_date" TEXT,
    "next_calibration_date" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'calibrated',
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "purchase_date" TEXT,
    "status" TEXT NOT NULL DEFAULT 'operational',
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "idx_calibration_logs_tool" ON "calibration_logs"("metrology_tool_id");

-- CreateIndex
CREATE INDEX "idx_cutting_tools_quantity" ON "cutting_tools"("quantity");

-- CreateIndex
CREATE INDEX "idx_cutting_tools_location" ON "cutting_tools"("location");

-- CreateIndex
CREATE INDEX "idx_machine_logs_timestamp" ON "machine_log_entries"("timestamp");

-- CreateIndex
CREATE INDEX "idx_machine_logs_equipment" ON "machine_log_entries"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_tasks_equipment" ON "maintenance_tasks"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_tasks_next_due" ON "maintenance_tasks"("next_due_date");

-- CreateIndex
CREATE INDEX "idx_maintenance_tasks_status" ON "maintenance_tasks"("status");

-- CreateIndex
CREATE INDEX "idx_service_records_task" ON "service_records"("maintenance_task_id");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_metrology_tools_2" ON "metrology_tools"("serial_number");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "idx_metrology_tools_next_calibration" ON "metrology_tools"("next_calibration_date");

-- CreateIndex
CREATE INDEX "idx_metrology_tools_status" ON "metrology_tools"("status");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_equipment_2" ON "equipment"("serial_number");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "idx_equipment_location" ON "equipment"("location");

-- CreateIndex
CREATE INDEX "idx_equipment_status" ON "equipment"("status");
