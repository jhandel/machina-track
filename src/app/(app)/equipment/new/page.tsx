// src/app/(app)/equipment/new/page.tsx
"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Factory } from "lucide-react";
import { EquipmentForm } from "@/app/(app)/equipment/components/EquipmentForm";

export default function NewEquipmentPage() {
  return (
    <div>
      <PageHeader
        title="Add New Equipment"
        icon={Factory}
        description="Register a new piece of machinery in the system."
      />
      <EquipmentForm mode="create" />
    </div>
  );
}
