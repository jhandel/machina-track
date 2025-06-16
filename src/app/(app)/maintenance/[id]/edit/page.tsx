// src/app/(app)/inventory/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Package, ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceService } from "@/services/maintenance-service";
import { EquipmentService } from "@/services/equipment-service";
import type { MaintenanceTask, Equipment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceForm } from "@/app/(app)/maintenance/components/MaintenanceForm";

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceTask, setMaintenanceTask] = useState<
    MaintenanceTask | undefined | null
  >(null);
  const maintenanceService = new MaintenanceService();

  const maintenanceTaskId = params.id as string;

  useEffect(() => {
    const fetchTaskData = async () => {
      if (!maintenanceTaskId) {
        setError("No task ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const maintenanceService = new MaintenanceService();
        const fetchedTask = await maintenanceService.getById(maintenanceTaskId);

        if (!fetchedTask) {
          setError("Task not found");
          setMaintenanceTask(undefined);
        } else {
          setMaintenanceTask(fetchedTask);

          // Fetch related equipment data
          try {
            const equipmentService = new EquipmentService();
            const fetchedEquipment = await equipmentService.getById(
              fetchedTask.equipmentId
            );
            setEquipment(fetchedEquipment);
          } catch (equipmentError) {
            console.warn("Could not fetch equipment data:", equipmentError);
            setEquipment(undefined);
          }
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch task data"
        );
        setMaintenanceTask(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [maintenanceTaskId]);

  const handleSuccess = (updatedMaintenanceTask: MaintenanceTask) => {
    router.push(`/maintenance/${updatedMaintenanceTask.id}`);
  };

  const handleCancel = () => {
    if (maintenanceTask) {
      router.push(`/maintenance/${maintenanceTask.id}`);
    } else {
      router.push("/maintenance");
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Edit Maintenance Task"
          icon={Package}
          description="Update maintenance task information."
        />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Error: {error}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/inventory")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Inventory
                </Button>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !maintenanceTask) {
    return (
      <div>
        <PageHeader title="Loading..." icon={ClipboardList} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading task details...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={maintenanceTask.description}
        icon={ClipboardList}
        description={`Maintenance for: ${
          equipment ? `${equipment.name} (${equipment.model})` : "Equipment"
        }`}
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        }
      />
      <MaintenanceForm
        mode="edit"
        taskId={maintenanceTask.id}
        initialData={maintenanceTask}
        preselectedEquipmentId={maintenanceTask.equipmentId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
