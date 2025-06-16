// src/app/(app)/inventory/new/page.tsx
"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Package } from "lucide-react";
import { MaintenanceForm } from "@/app/(app)/maintenance/components/MaintenanceForm";

export default function NewInventoryItemPage() {
  return (
    <div>
      <PageHeader
        title="Add New Maintenance Task"
        icon={Package}
        description="Add a new maintenance task."
      />
      <MaintenanceForm mode="create" />
    </div>
  );
}
