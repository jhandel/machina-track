"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowLeft, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalibrationLogForm } from "../../../../components/CalibrationLogForm";
import { metrologyService } from "@/services";
import type { MetrologyTool, CalibrationLog } from "@/lib/types";

export default function EditCalibrationLogPage({
  params,
}: {
  params: { id: string; logId: string };
}) {
  const router = useRouter();
  const [metrologyTool, setMetrologyTool] = useState<MetrologyTool | null>(
    null
  );
  const [calibrationLog, setCalibrationLog] = useState<CalibrationLog | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!params.id || !params.logId) return;

      try {
        setLoading(true);

        // Load metrology tool
        const tool = await metrologyService.getById(params.id);
        if (!tool) {
          setError("Metrology tool not found");
          return;
        }
        setMetrologyTool(tool);

        // Load calibration log
        const logs = await metrologyService.getCalibrationLogs(params.id);
        const log = logs.find((log) => log.id === params.logId);

        if (!log) {
          setError("Calibration log not found");
          return;
        }

        setCalibrationLog(log);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id, params.logId]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Edit Calibration Log"
          icon={Ruler}
          description="Loading calibration log information..."
        />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !metrologyTool || !calibrationLog) {
    return (
      <div>
        <PageHeader
          title="Error"
          icon={Ruler}
          description={error || "Failed to load calibration log"}
        />
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error || "An error occurred"}</p>
          <Button asChild variant="outline">
            <Link href={`/metrology/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tool
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Calibration Log"
        icon={Ruler}
        description={`Update calibration log for ${metrologyTool.name}`}
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
          mode="edit"
          metrologyTool={metrologyTool}
          calibrationLogId={params.logId}
          initialData={calibrationLog}
          onSuccess={() => {
            router.push(`/metrology/${params.id}`);
          }}
        />
      </div>
    </div>
  );
}
