// src/components/consumable/ConsumableForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConsumableService } from "@/services/consumable-service";
import { SettingsService } from "@/services/settings-service";
import type { Consumable } from "@/lib/types";
import type {
  Location,
  ConsumableType,
  ConsumableMaterial,
} from "@/lib/database/interfaces";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConsumableFormProps {
  mode: "create" | "edit";
  consumableId?: string;
  initialData?: Consumable;
  onCancel?: () => void;
  onSuccess?: (consumable: Consumable) => void;
}

interface FormData {
  name: string;
  typeId: string;
  materialId?: string;
  size?: string;
  quantity: number;
  minQuantity: number;
  locationId: string;
  toolLifeHours?: number;
  remainingToolLifeHours?: number;
  supplier?: string;
  imageUrl?: string;
  notes?: string;
}

export function ConsumableForm({
  mode,
  consumableId,
  initialData,
  onCancel,
  onSuccess,
}: ConsumableFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [consumableTypes, setConsumableTypes] = useState<ConsumableType[]>([]);
  const [consumableMaterials, setConsumableMaterials] = useState<
    ConsumableMaterial[]
  >([]);

  const consumableService = new ConsumableService();

  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    typeId: initialData?.typeId || "",
    materialId: initialData?.materialId || "",
    size: initialData?.size || "",
    quantity: initialData?.quantity || 0,
    minQuantity: initialData?.minQuantity || 0,
    locationId: initialData?.locationId || "",
    toolLifeHours: initialData?.toolLifeHours || undefined,
    remainingToolLifeHours: initialData?.remainingToolLifeHours || undefined,
    supplier: initialData?.supplier || "",
    imageUrl: initialData?.imageUrl || "https://placehold.co/400x400.png",
    notes: initialData?.notes || "",
  });

  // Load locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationsData = await SettingsService.getLocations();
        setLocations(locationsData);
      } catch (error) {
        console.error("Error loading locations:", error);
        toast({
          title: "Warning",
          description: "Failed to load locations. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadLocations();
  }, [toast]);

  // Load consumable types on component mount
  useEffect(() => {
    const loadConsumableTypes = async () => {
      try {
        const typesData = await SettingsService.getConsumableTypes();
        setConsumableTypes(typesData);
      } catch (error) {
        console.error("Error loading consumable types:", error);
        toast({
          title: "Warning",
          description:
            "Failed to load consumable types. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadConsumableTypes();
  }, [toast]);

  // Load consumable materials on component mount
  useEffect(() => {
    const loadConsumableMaterials = async () => {
      try {
        const materialsData = await SettingsService.getConsumableMaterials();
        setConsumableMaterials(materialsData);
      } catch (error) {
        console.error("Error loading consumable materials:", error);
        toast({
          title: "Warning",
          description:
            "Failed to load consumable materials. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadConsumableMaterials();
  }, [toast]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let result: Consumable;

      if (mode === "edit" && consumableId) {
        result = await consumableService.update(consumableId, formData);
        toast({
          title: "Success",
          description: "The consumable has been updated successfully.",
        });
      } else {
        result = await consumableService.create(formData);
        toast({
          title: "Success",
          description: "The consumable has been added to inventory.",
        });
      }

      setHasUnsavedChanges(false);

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push("/inventory");
      }
    } catch (error) {
      console.error("Error saving consumable:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save consumable. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        router.push("/inventory");
      }
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    if (onCancel) {
      onCancel();
    } else {
      router.push("/inventory");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Consumable Item Details</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Fill in the information for the new consumable."
              : "Update the consumable information."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tool Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., 1/4 End Mill"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tool Type</Label>
            <Select
              value={formData.typeId}
              onValueChange={(value) => handleInputChange("typeId", value)}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select tool type" />
              </SelectTrigger>
              <SelectContent>
                {consumableTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Select
              value={formData.materialId || ""}
              onValueChange={(value) => handleInputChange("materialId", value)}
            >
              <SelectTrigger id="material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {consumableMaterials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size (Optional)</Label>
            <Input
              id="size"
              value={formData.size || ""}
              onChange={(e) => handleInputChange("size", e.target.value)}
              placeholder="e.g., 1/4 inch or 6mm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                handleInputChange("quantity", parseInt(e.target.value) || 0)
              }
              placeholder="e.g., 10"
              required
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minQuantity">Minimum Quantity</Label>
            <Input
              id="minQuantity"
              type="number"
              value={formData.minQuantity}
              onChange={(e) =>
                handleInputChange("minQuantity", parseInt(e.target.value) || 0)
              }
              placeholder="e.g., 5"
              required
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Storage Location</Label>
            <Select
              value={formData.locationId}
              onValueChange={(value) => handleInputChange("locationId", value)}
              required
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toolLifeHours">
              Expected Tool Life (Hours, Optional)
            </Label>
            <Input
              id="toolLifeHours"
              type="number"
              value={formData.toolLifeHours || ""}
              onChange={(e) =>
                handleInputChange(
                  "toolLifeHours",
                  parseInt(e.target.value) || undefined
                )
              }
              placeholder="e.g., 100"
              min="0"
            />
          </div>

          {mode === "edit" && formData.toolLifeHours && (
            <div className="space-y-2">
              <Label htmlFor="remainingToolLifeHours">
                Remaining Tool Life (Hours)
              </Label>
              <Input
                id="remainingToolLifeHours"
                type="number"
                value={formData.remainingToolLifeHours || ""}
                onChange={(e) =>
                  handleInputChange(
                    "remainingToolLifeHours",
                    parseInt(e.target.value) || undefined
                  )
                }
                placeholder="e.g., 50"
                min="0"
                max={formData.toolLifeHours}
              />
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="supplier">Supplier (Optional)</Label>
            <Input
              id="supplier"
              value={formData.supplier || ""}
              onChange={(e) => handleInputChange("supplier", e.target.value)}
              placeholder="e.g., ToolVendor Inc."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl || ""}
              onChange={(e) => handleInputChange("imageUrl", e.target.value)}
              placeholder="https://placehold.co/600x400.png"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any relevant notes about this consumable..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting
              ? mode === "create"
                ? "Adding..."
                : "Updating..."
              : mode === "create"
              ? "Add to Inventory"
              : "Update Consumable"}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave without
              saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
