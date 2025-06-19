// src/components/metrology/MetrologyForm.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Save, ArrowLeft, Upload, ImageIcon } from "lucide-react";
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
import { METROLOGY_STATUSES } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MetrologyService } from "@/services/metrology-service";
import { SettingsService } from "@/services/settings-service";
import type { MetrologyTool } from "@/lib/types";
import type {
  Location,
  Manufacturer,
  MetrologyToolType,
} from "@/lib/database/interfaces";
import Image from "next/image";
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
import { uploadSimpleFile } from "@/lib/upload-utils";

interface MetrologyFormProps {
  mode: "create" | "edit";
  toolId?: string;
  initialData?: MetrologyTool;
  onCancel?: () => void;
  onSuccess?: (tool: MetrologyTool) => void;
}

interface FormData {
  name: string;
  typeId: string;
  serialNumber: string;
  manufacturerId?: string;
  calibrationIntervalDays: number;
  lastCalibrationDate?: string;
  locationId?: string;
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [metrologyToolTypes, setMetrologyToolTypes] = useState<
    MetrologyToolType[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const metrologyService = new MetrologyService();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    typeId: "",
    serialNumber: "",
    manufacturerId: "",
    calibrationIntervalDays: 365,
    lastCalibrationDate: "",
    locationId: "",
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
        typeId: initialData.typeId,
        serialNumber: initialData.serialNumber,
        manufacturerId: initialData.manufacturerId || "",
        calibrationIntervalDays: initialData.calibrationIntervalDays,
        lastCalibrationDate: initialData.lastCalibrationDate || "",
        locationId: initialData.locationId || "",
        status: initialData.status,
        imageUrl: initialData.imageUrl || "",
        notes: initialData.notes || "",
      });
      setImagePreview(initialData.imageUrl || null);
    }
  }, [mode, toolId, initialData]);

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

  // Load manufacturers on component mount
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        const manufacturersData = await SettingsService.getManufacturers();
        setManufacturers(manufacturersData);
      } catch (error) {
        console.error("Error loading manufacturers:", error);
        toast({
          title: "Warning",
          description: "Failed to load manufacturers. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadManufacturers();
  }, [toast]);

  // Load metrology tool types on component mount
  useEffect(() => {
    const loadMetrologyToolTypes = async () => {
      try {
        const toolTypesData = await SettingsService.getMetrologyToolTypes();
        setMetrologyToolTypes(toolTypesData);
      } catch (error) {
        console.error("Error loading metrology tool types:", error);
        toast({
          title: "Warning",
          description: "Failed to load tool types. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadMetrologyToolTypes();
  }, [toast]);

  const loadToolData = async () => {
    if (!toolId) return;

    setIsLoading(true);
    try {
      const tool = await metrologyService.getById(toolId);
      if (tool) {
        setFormData({
          name: tool.name,
          typeId: tool.typeId,
          serialNumber: tool.serialNumber,
          manufacturerId: tool.manufacturerId || "",
          calibrationIntervalDays: tool.calibrationIntervalDays,
          lastCalibrationDate: tool.lastCalibrationDate || "",
          locationId: tool.locationId || "",
          status: tool.status,
          imageUrl: tool.imageUrl || "",
          notes: tool.notes || "",
        });
        setImagePreview(tool.imageUrl || null);
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
        typeId: formData.typeId,
        serialNumber: formData.serialNumber,
        manufacturerId: formData.manufacturerId || undefined,
        calibrationIntervalDays: formData.calibrationIntervalDays,
        lastCalibrationDate: formData.lastCalibrationDate || undefined,
        nextCalibrationDate,
        locationId: formData.locationId || undefined,
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

  const processFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Only image files are allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Image file size must be less than 5MB",
        variant: "destructive",
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setHasUnsavedChanges(true);

    try {
      setIsUploading(true);

      // Upload the file using the simple upload utility
      const result = await uploadSimpleFile({ file });

      if (result.success && result.data) {
        // Update form data with the new image URL
        handleInputChange("imageUrl", result.data.url);

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        throw new Error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });

      // Reset preview on error
      if (formData.imageUrl) {
        setImagePreview(formData.imageUrl);
      } else {
        setImagePreview(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      await processFile(file);
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
                  value={formData.typeId}
                  onValueChange={(value) => handleInputChange("typeId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tool type" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrologyToolTypes.map((toolType) => (
                      <SelectItem key={toolType.id} value={toolType.id}>
                        {toolType.name}
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
                  value={formData.manufacturerId}
                  onValueChange={(value) =>
                    handleInputChange("manufacturerId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
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
                  value={formData.locationId}
                  onValueChange={(value) =>
                    handleInputChange("locationId", value)
                  }
                >
                  <SelectTrigger>
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

            {/* Image Upload */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrl">Tool Image</Label>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      handleInputChange("imageUrl", e.target.value)
                    }
                    placeholder="Or enter image URL directly"
                    className="w-full"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    aria-label="Upload metrology tool image"
                    title="Select an image for the metrology tool"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported image formats: JPG, PNG, GIF, SVG. Maximum file
                  size: 5MB. You can drag and drop an image directly into the
                  area below.
                </p>
                {imagePreview && (
                  <div className="relative h-64 w-full">
                    <Image
                      src={imagePreview}
                      alt="Metrology tool preview"
                      fill
                      className="object-contain rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 bg-background opacity-80 hover:opacity-100"
                      onClick={() => {
                        setImagePreview(null);
                        handleInputChange("imageUrl", "");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      <span className="sr-only">Remove image</span>
                    </Button>
                  </div>
                )}
                {!imagePreview && (
                  <div
                    ref={dropZoneRef}
                    className={`h-64 w-full flex items-center justify-center border border-dashed rounded-md transition-colors cursor-pointer ${
                      isDragging
                        ? "bg-primary/10 border-primary"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    aria-label="Drag and drop an image here, or click to upload"
                  >
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        {isDragging
                          ? "Drop image here"
                          : "Drag and drop an image here, or click to upload"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
