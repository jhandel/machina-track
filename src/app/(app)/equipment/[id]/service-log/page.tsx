"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Wrench, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { equipmentService } from "@/services/equipment-service";
import type { Equipment } from "@/lib/types";
import Link from "next/link";
import ServiceLogForm from "../../components/ServiceLogForm";

export default function NewServiceLogPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = typeof params.id === "string" ? params.id : "";

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEquipment = async () => {
      if (!equipmentId) {
        setError("No equipment ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await equipmentService.getById(equipmentId);
        if (!data) {
          setError("Equipment not found");
        } else {
          setEquipment(data);
        }
      } catch (err) {
        console.error("Error loading equipment:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load equipment"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [equipmentId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Loading..." icon={Wrench} />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">Loading equipment details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div>
        <PageHeader title="Error" icon={Wrench} />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              {error || "Failed to load equipment details"}
            </div>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href="/equipment">Back to Equipment List</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Add Service Log"
        icon={Wrench}
        description={`Record service work for ${equipment.name} (${equipment.model})`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/equipment/${equipmentId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Equipment
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <ServiceLogForm equipmentId={equipmentId} />
        </CardContent>
      </Card>
    </div>
  );
}
