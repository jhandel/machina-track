// src/app/(app)/metrology/new/page.tsx
import { PageHeader } from "@/components/common/PageHeader";
import { MetrologyForm } from "@/app/(app)/metrology/components/MetrologyForm";

export default function NewMetrologyToolPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Add New Metrology Tool"
        description="Register a new metrology tool in the system"
      />
      <MetrologyForm mode="create" />
    </div>
  );
}
