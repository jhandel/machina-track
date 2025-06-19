"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalibrationLogForm } from "../../../components/CalibrationLogForm";
import { metrologyService } from "@/services";
import type { MetrologyTool } from "@/lib/types";

export default function AddCalibrationLogPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [metrologyTool, setMetrologyTool] = useState<MetrologyTool | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrologyTool() {
      if (!params.id) return;

      try {
        setLoading(true);
        const tool = await metrologyService.getById(params.id);
        if (!tool) {
          setError("Metrology tool not found");
          return;
        }
        setMetrologyTool(tool);
      } catch (err) {
        console.error("Error loading metrology tool:", err);
        setError("Failed to load metrology tool");
      } finally {
        setLoading(false);
      }
    }

    loadMetrologyTool();
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Add Calibration Log"
          icon={Ruler}
          description="Loading metrology tool information..."
        />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !metrologyTool) {
    return (
      <div>
        <PageHeader
          title="Error"
          icon={Ruler}
          description={error || "Failed to load metrology tool"}
        />
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error || "An error occurred"}</p>
          <Button asChild variant="outline">
            <Link href="/metrology">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Metrology Tools
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Add Calibration Log"
        icon={Ruler}
        description={`Record a calibration for ${metrologyTool.name}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/metrology/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tool
            </Link>
          </Button>
        }
      />

      <div className="mt-6">
        <CalibrationLogForm
          mode="create"
          metrologyTool={metrologyTool}
          onSuccess={() => {
            router.push(`/metrology/${params.id}`);
          }}
        />
      </div>
    </div>
  );
}
