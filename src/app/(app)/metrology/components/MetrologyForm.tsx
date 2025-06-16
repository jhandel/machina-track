// src/components/metrology/MetrologyForm.tsx
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
  METROLOGY_STATUSES,
  MOCK_LOCATIONS,
  MOCK_MANUFACTURERS,
  MOCK_TOOL_TYPES_METROLOGY,
} from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MetrologyService } from "@/services/metrology-service";
import type { MetrologyTool } from "@/lib/types";
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

interface MetrologyFormProps {
  mode: "create" | "edit";
  toolId?: string;
  initialData?: MetrologyTool;
  onCancel?: () => void;
  onSuccess?: (tool: MetrologyTool) => void;
}

interface FormData {
  name: string;
  type: string;
  serialNumber: string;
  manufacturer?: string;
  calibrationIntervalDays: number;
  lastCalibrationDate?: string;
  location?: string;
  status:
    | "calibrated"
    | "due_calibration"
    | "out_of_service"
    | "awaiting_calibration";
  imageUrl?: string;
  notes?: string;
}

export function MetrologyForm({
  mode,
  toolId,
  initialData,
  onCancel,
  onSuccess,
}: MetrologyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const metrologyService = new MetrologyService();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "",
    serialNumber: "",
    manufacturer: "",
    calibrationIntervalDays: 365,
    lastCalibrationDate: "",
    location: "",
    status: "calibrated",
    imageUrl: "",
    notes: "",
  });

  // Load data for edit mode
  useEffect(() => {
    if (mode === "edit" && toolId && !initialData) {
      loadToolData();
    } else if (initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type,
        serialNumber: initialData.serialNumber,
        manufacturer: initialData.manufacturer || "",
        calibrationIntervalDays: initialData.calibrationIntervalDays,
        lastCalibrationDate: initialData.lastCalibrationDate || "",
        location: initialData.location || "",
        status: initialData.status,
        imageUrl: initialData.imageUrl || "",
        notes: initialData.notes || "",
      });
    }
  }, [mode, toolId, initialData]);

  const loadToolData = async () => {
    if (!toolId) return;

    setIsLoading(true);
    try {
      const tool = await metrologyService.getById(toolId);
      if (tool) {
        setFormData({
          name: tool.name,
          type: tool.type,
          serialNumber: tool.serialNumber,
          manufacturer: tool.manufacturer || "",
          calibrationIntervalDays: tool.calibrationIntervalDays,
          lastCalibrationDate: tool.lastCalibrationDate || "",
          location: tool.location || "",
          status: tool.status,
          imageUrl: tool.imageUrl || "",
          notes: tool.notes || "",
        });
      } else {
        toast({
          title: "Error",
          description: "Metrology tool not found",
          variant: "destructive",
        });
        router.push("/metrology");
      }
    } catch (error) {
      console.error("Error loading tool data:", error);
      toast({
        title: "Error",
        description: "Failed to load metrology tool data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const calculateNextCalibrationDate = (
    lastDate: string,
    intervalDays: number
  ): string => {
    if (!lastDate || !intervalDays) return "";

    const lastCalDate = new Date(lastDate);
    const nextDate = new Date(lastCalDate);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate.toISOString().split("T")[0];
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Calculate next calibration date if last calibration date is provided
      let nextCalibrationDate: string | undefined;
      if (formData.lastCalibrationDate && formData.calibrationIntervalDays) {
        nextCalibrationDate = calculateNextCalibrationDate(
          formData.lastCalibrationDate,
          formData.calibrationIntervalDays
        );
      }

      const toolData = {
        name: formData.name,
        type: formData.type,
        serialNumber: formData.serialNumber,
        manufacturer: formData.manufacturer || undefined,
        calibrationIntervalDays: formData.calibrationIntervalDays,
        lastCalibrationDate: formData.lastCalibrationDate || undefined,
        nextCalibrationDate,
        location: formData.location || undefined,
        status: formData.status,
        imageUrl: formData.imageUrl || undefined,
        notes: formData.notes || undefined,
        calibrationLogIds: initialData?.calibrationLogIds || [],
      };

      let result: MetrologyTool;

      if (mode === "create") {
        result = await metrologyService.create(toolData);
        toast({
          title: "Success",
          description: "Metrology tool created successfully",
        });
      } else {
        if (!toolId) throw new Error("Tool ID is required for edit mode");
        result = await metrologyService.update(toolId, toolData);
        toast({
          title: "Success",
          description: "Metrology tool updated successfully",
        });
      }

      setHasUnsavedChanges(false);

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/metrology/${result.id}`);
      }
    } catch (error) {
      console.error("Error saving metrology tool:", error);
      toast({
        title: "Error",
        description:
          mode === "create"
            ? "Failed to create metrology tool"
            : "Failed to update metrology tool",
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
        router.back();
      }
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const nextCalibrationDate =
    formData.lastCalibrationDate && formData.calibrationIntervalDays
      ? calculateNextCalibrationDate(
          formData.lastCalibrationDate,
          formData.calibrationIntervalDays
        )
      : "";

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Metrology Tool Details</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Enter the details for the new metrology tool"
                : "Update the metrology tool details"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tool Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Digital Caliper"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tool type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TOOL_TYPES_METROLOGY.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) =>
                    handleInputChange("serialNumber", e.target.value)
                  }
                  placeholder="e.g., SN123456"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Select
                  value={formData.manufacturer}
                  onValueChange={(value) =>
                    handleInputChange("manufacturer", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_MANUFACTURERS.map((manufacturer) => (
                      <SelectItem key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calibration Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calibrationIntervalDays">
                  Calibration Interval (Days) *
                </Label>
                <Input
                  id="calibrationIntervalDays"
                  type="number"
                  value={formData.calibrationIntervalDays}
                  onChange={(e) =>
                    handleInputChange(
                      "calibrationIntervalDays",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="365"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastCalibrationDate">
                  Last Calibration Date
                </Label>
                <Input
                  id="lastCalibrationDate"
                  type="date"
                  value={formData.lastCalibrationDate}
                  onChange={(e) =>
                    handleInputChange("lastCalibrationDate", e.target.value)
                  }
                />
              </div>
            </div>

            {nextCalibrationDate && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Next Calibration Due:</strong>{" "}
                  {new Date(nextCalibrationDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Location and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    handleInputChange("location", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    handleInputChange("status", value as FormData["status"])
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {METROLOGY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this metrology tool..."
                rows={4}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                ? "Create Tool"
                : "Update Tool"}
            </Button>
          </CardFooter>
        </Card>
      </form>
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to cancel? All
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
