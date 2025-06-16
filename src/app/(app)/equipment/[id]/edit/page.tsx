// src/app/(app)/equipment/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Factory, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { EquipmentService } from "@/services/equipment-service";
import type { Equipment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentForm } from "@/app/(app)/equipment/components/EquipmentForm";

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const equipmentService = new EquipmentService();

  const equipmentId = params.id as string;

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!equipmentId) {
        setError("No equipment ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await equipmentService.getById(equipmentId);
        setEquipment(data);
      } catch (err) {
        console.error("Failed to fetch equipment:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch equipment"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [equipmentId]);

  const handleSuccess = (updatedEquipment: Equipment) => {
    router.push(`/equipment/${updatedEquipment.id}`);
  };

  const handleCancel = () => {
    if (equipment) {
      router.push(`/equipment/${equipment.id}`);
    } else {
      router.push("/equipment");
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Edit Equipment"
          icon={Factory}
          description="Update equipment information."
        />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive mb-4">Error: {error}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/equipment")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Equipment
                </Button>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !equipment) {
    return (
      <div>
        <PageHeader
          title="Edit Equipment"
          icon={Factory}
          description="Update equipment information."
        />
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${equipment.name}`}
        icon={Factory}
        description={`Update information for ${equipment.model} (S/N: ${equipment.serialNumber})`}
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        }
      />
      <EquipmentForm
        mode="edit"
        equipmentId={equipment.id}
        initialData={equipment}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
