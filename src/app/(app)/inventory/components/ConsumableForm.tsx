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
import {
  MOCK_LOCATIONS,
  MOCK_TOOL_TYPES_CUTTING,
  MOCK_MATERIALS_CUTTING,
} from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConsumableService } from "@/services/consumable-service";
import type { Consumable } from "@/lib/types";
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
  type: string;
  material?: string;
  size?: string;
  quantity: number;
  minQuantity: number;
  location: string;
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

  const consumableService = new ConsumableService();

  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    type: initialData?.type || "",
    material: initialData?.material || "",
    size: initialData?.size || "",
    quantity: initialData?.quantity || 0,
    minQuantity: initialData?.minQuantity || 0,
    location: initialData?.location || "",
    toolLifeHours: initialData?.toolLifeHours || undefined,
    remainingToolLifeHours: initialData?.remainingToolLifeHours || undefined,
    supplier: initialData?.supplier || "",
    imageUrl: initialData?.imageUrl || "https://placehold.co/400x400.png",
    notes: initialData?.notes || "",
  });

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
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select tool type" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_TOOL_TYPES_CUTTING.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Select
              value={formData.material || ""}
              onValueChange={(value) => handleInputChange("material", value)}
            >
              <SelectTrigger id="material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_MATERIALS_CUTTING.map((mat) => (
                  <SelectItem key={mat} value={mat}>
                    {mat}
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
              value={formData.location}
              onValueChange={(value) => handleInputChange("location", value)}
              required
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
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
