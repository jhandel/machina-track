// src/app/(app)/inventory/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConsumableService } from "@/services/consumable-service";
import type { Consumable } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsumableForm } from "@/app/(app)/inventory/components/ConsumableForm";

export default function EditConsumablePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consumable, setConsumable] = useState<Consumable | null>(null);
  const consumableService = new ConsumableService();

  const consumableId = params.id as string;

  useEffect(() => {
    const fetchConsumable = async () => {
      if (!consumableId) {
        setError("No consumable ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await consumableService.getById(consumableId);
        setConsumable(data);
      } catch (err) {
        console.error("Failed to fetch consumable:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch consumable"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsumable();
  }, [consumableId]);

  const handleSuccess = (updatedConsumable: Consumable) => {
    router.push(`/inventory/${updatedConsumable.id}`);
  };

  const handleCancel = () => {
    if (consumable) {
      router.push(`/inventory/${consumable.id}`);
    } else {
      router.push("/inventory");
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Edit Consumable"
          icon={Package}
          description="Update consumable information."
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

  if (isLoading || !consumable) {
    return (
      <div>
        <PageHeader
          title="Edit Consumable"
          icon={Package}
          description="Update consumable information."
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
        title={`Edit ${consumable.name}`}
        icon={Package}
        description={`Update information for ${consumable.type}${
          consumable.size ? ` (${consumable.size})` : ""
        }`}
        actions={
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        }
      />
      <ConsumableForm
        mode="edit"
        consumableId={consumable.id}
        initialData={consumable}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
