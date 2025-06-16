// src/app/(app)/inventory/new/page.tsx
"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Package } from "lucide-react";
import { ConsumableForm } from "@/app/(app)/inventory/components/ConsumableForm";

export default function NewInventoryItemPage() {
  return (
    <div>
      <PageHeader
        title="Add New Consumable"
        icon={Package}
        description="Add a new tool or bit to your inventory."
      />
      <ConsumableForm mode="create" />
    </div>
  );
}
