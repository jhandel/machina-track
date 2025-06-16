// src/app/(app)/metrology/[id]/edit/page.tsx
"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { MetrologyForm } from "@/app/(app)/metrology/components/MetrologyForm";
import { Ruler } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditMetrologyToolPage() {
  const params = useParams();
  const toolId = typeof params.id === "string" ? params.id : "";

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Edit Metrology Tool"
        description="Update metrology tool information"
        icon={Ruler}
      />

      <MetrologyForm mode="edit" toolId={toolId} />
    </div>
  );
}
