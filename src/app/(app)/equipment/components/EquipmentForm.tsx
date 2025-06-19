// src/components/equipment/EquipmentForm.tsx
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
import { EQUIPMENT_STATUSES } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { EquipmentService } from "@/services/equipment-service";
import { SettingsService } from "@/services/settings-service";
import type { Equipment } from "@/lib/types";
import type { Location } from "@/lib/database/interfaces";
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

interface EquipmentFormProps {
  mode: "create" | "edit";
  equipmentId?: string;
  initialData?: Equipment;
  onCancel?: () => void;
  onSuccess?: (equipment: Equipment) => void;
}

interface FormData {
  name: string;
  model: string;
  serialNumber: string;
  locationId: string;
  status: "operational" | "maintenance" | "decommissioned";
  purchaseDate?: string;
  imageUrl?: string;
  notes?: string;
}

export function EquipmentForm({
  mode,
  equipmentId,
  initialData,
  onCancel,
  onSuccess,
}: EquipmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    model: initialData?.model || "",
    serialNumber: initialData?.serialNumber || "",
    locationId: initialData?.locationId || "",
    status: initialData?.status || "operational",
    purchaseDate: initialData?.purchaseDate
      ? new Date(initialData.purchaseDate).toISOString().split("T")[0]
      : "",
    imageUrl: initialData?.imageUrl || "https://placehold.co/600x400.png",
    notes: initialData?.notes || "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    formData.imageUrl || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const equipmentService = new EquipmentService();

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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
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
    setIsDirty(true);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let result: Equipment;

      if (mode === "create") {
        result = await equipmentService.create({
          name: formData.name,
          model: formData.model,
          serialNumber: formData.serialNumber,
          locationId: formData.locationId,
          status: formData.status,
          purchaseDate: formData.purchaseDate || undefined,
          imageUrl: formData.imageUrl || undefined,
          notes: formData.notes || undefined,
        });

        toast({
          title: "Success",
          description: "The equipment has been successfully registered.",
        });
      } else {
        if (!equipmentId)
          throw new Error("Equipment ID is required for editing");

        result = await equipmentService.update(equipmentId, {
          name: formData.name,
          model: formData.model,
          serialNumber: formData.serialNumber,
          locationId: formData.locationId,
          status: formData.status,
          purchaseDate: formData.purchaseDate || undefined,
          imageUrl: formData.imageUrl || undefined,
          notes: formData.notes || undefined,
        });

        toast({
          title: "Success",
          description: "The equipment has been successfully updated.",
        });
      }

      setIsDirty(false);

      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push("/equipment");
      }
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} equipment:`,
        error
      );
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${
                mode === "create" ? "register" : "update"
              } equipment. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigation = (href: string) => {
    if (isDirty) {
      setPendingNavigation(href);
      setShowUnsavedDialog(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        router.push(href);
      }
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      if (onCancel && pendingNavigation === "/equipment") {
        onCancel();
      } else {
        router.push(pendingNavigation);
      }
    }
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Equipment Details</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Fill in the information for the new equipment."
                : "Update the equipment information below."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., CNC Mill XM-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder="e.g., XM-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) =>
                  handleInputChange("serialNumber", e.target.value)
                }
                placeholder="e.g., CNCX500-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) =>
                  handleInputChange("locationId", value)
                }
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleInputChange(
                    "status",
                    value as "operational" | "maintenance" | "decommissioned"
                  )
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_STATUSES.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  handleInputChange("purchaseDate", e.target.value)
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrl">Equipment Image</Label>
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
                    aria-label="Upload equipment image"
                    title="Select an image for the equipment"
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
                      alt="Equipment preview"
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Enter any relevant notes..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleNavigation("/equipment")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting
                ? mode === "create"
                  ? "Saving..."
                  : "Updating..."
                : mode === "create"
                ? "Save Equipment"
                : "Update Equipment"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? All
              unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmNavigation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
