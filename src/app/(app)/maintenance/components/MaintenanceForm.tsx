// src/components/maintenance/MaintenanceForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Save, ArrowLeft, Calendar, User, Wrench } from "lucide-react";
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
import { MAINTENANCE_STATUSES } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceService } from "@/services/maintenance-service";
import { EquipmentService } from "@/services/equipment-service";
import type { MaintenanceTask, Equipment } from "@/lib/types";
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

interface MaintenanceFormProps {
  mode: "create" | "edit";
  taskId?: string;
  initialData?: MaintenanceTask;
  preselectedEquipmentId?: string;
  onCancel?: () => void;
  onSuccess?: (task: MaintenanceTask) => void;
}

interface FormData {
  equipmentId: string;
  description: string;
  frequencyDays: string;
  lastPerformedDate: string;
  nextDueDate: string;
  assignedTo: string;
  notes: string;
  status: MaintenanceTask["status"];
}

const initialFormData: FormData = {
  equipmentId: "",
  description: "",
  frequencyDays: "",
  lastPerformedDate: "",
  nextDueDate: "",
  assignedTo: "",
  notes: "",
  status: "pending",
};

export function MaintenanceForm({
  mode,
  taskId,
  initialData,
  preselectedEquipmentId,
  onCancel,
  onSuccess,
}: MaintenanceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const maintenanceService = new MaintenanceService();
  const equipmentService = new EquipmentService();

  // Load equipment list
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setIsLoadingEquipment(true);
        const response = await equipmentService.getAll();
        if (response.success && response.data) {
          setEquipment(response.data as Equipment[]);
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
        toast({
          title: "Warning",
          description:
            "Failed to load equipment list. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, []);

  // Load existing maintenance task data for edit mode
  useEffect(() => {
    if (mode === "edit" && taskId && !initialData) {
      const fetchMaintenanceTask = async () => {
        try {
          setIsLoading(true);
          const task = await maintenanceService.getById(taskId);
          populateFormFromTask(task);
        } catch (error) {
          console.error("Error fetching maintenance task:", error);
          toast({
            title: "Error",
            description: "Failed to load maintenance task data.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchMaintenanceTask();
    } else if (initialData) {
      populateFormFromTask(initialData);
    }
  }, [mode, taskId, initialData]);

  // Set preselected equipment if provided
  useEffect(() => {
    if (preselectedEquipmentId && mode === "create") {
      setFormData((prev) => ({
        ...prev,
        equipmentId: preselectedEquipmentId,
      }));
    }
  }, [preselectedEquipmentId, mode]);

  // Force re-render when equipment list loads and we have form data
  useEffect(() => {
    if (!isLoadingEquipment && equipment.length > 0 && formData.equipmentId) {
      // Check if the selected equipment exists in the loaded list
      const selectedExists = equipment.some(
        (eq) => eq.id === formData.equipmentId
      );
      if (!selectedExists) {
        console.warn(
          `Selected equipment ID ${formData.equipmentId} not found in equipment list`
        );
      }
    }
  }, [isLoadingEquipment, equipment, formData.equipmentId]);

  const populateFormFromTask = (task: MaintenanceTask) => {
    setFormData({
      equipmentId: task.equipmentId || "",
      description: task.description || "",
      frequencyDays: task.frequencyDays?.toString() || "",
      lastPerformedDate: task.lastPerformedDate
        ? task.lastPerformedDate.split("T")[0]
        : "",
      nextDueDate: task.nextDueDate ? task.nextDueDate.split("T")[0] : "",
      assignedTo: task.assignedTo || "",
      notes: task.notes || "",
      status: task.status || "pending",
    });
    console.log("Form populated with task data:", task);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === "equipmentId" && equipment.length === 0) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);

    // Auto-calculate next due date when frequency or last performed date changes
    if (field === "frequencyDays" || field === "lastPerformedDate") {
      const updatedData = { ...formData, [field]: value };
      if (updatedData.frequencyDays && updatedData.lastPerformedDate) {
        const frequency = parseInt(updatedData.frequencyDays);
        const lastDate = new Date(updatedData.lastPerformedDate);
        if (!isNaN(frequency) && !isNaN(lastDate.getTime())) {
          const nextDate = new Date(lastDate);
          nextDate.setDate(nextDate.getDate() + frequency);
          setFormData((prev) => ({
            ...prev,
            [field]: value,
            nextDueDate: nextDate.toISOString().split("T")[0],
          }));
          return;
        }
      }
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.equipmentId.trim()) {
      errors.push("Equipment selection is required");
    }
    if (!formData.description.trim()) {
      errors.push("Description is required");
    }
    if (formData.frequencyDays && isNaN(parseInt(formData.frequencyDays))) {
      errors.push("Frequency must be a valid number");
    }
    if (
      formData.lastPerformedDate &&
      isNaN(new Date(formData.lastPerformedDate).getTime())
    ) {
      errors.push("Last performed date must be a valid date");
    }
    if (
      formData.nextDueDate &&
      isNaN(new Date(formData.nextDueDate).getTime())
    ) {
      errors.push("Next due date must be a valid date");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData: Omit<MaintenanceTask, "id"> = {
        equipmentId: formData.equipmentId,
        description: formData.description,
        frequencyDays: formData.frequencyDays
          ? parseInt(formData.frequencyDays)
          : undefined,
        lastPerformedDate: formData.lastPerformedDate || undefined,
        nextDueDate: formData.nextDueDate || undefined,
        assignedTo: formData.assignedTo || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
      };

      let result: MaintenanceTask;

      if (mode === "create") {
        result = await maintenanceService.create(taskData);
        toast({
          title: "Success",
          description: "Maintenance task created successfully",
        });
      } else if (taskId) {
        result = await maintenanceService.update(taskId, taskData);
        toast({
          title: "Success",
          description: "Maintenance task updated successfully",
        });
      }

      setHasUnsavedChanges(false);

      if (onSuccess && result!) {
        onSuccess(result);
      } else {
        router.push("/maintenance");
      }
    } catch (error) {
      console.error("Error saving maintenance task:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          mode === "create" ? "create" : "update"
        } maintenance task`,
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
        router.push("/maintenance");
      }
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    if (onCancel) {
      onCancel();
    } else {
      router.push("/maintenance");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const selectedEquipment = equipment.find(
    (eq) => eq.id === formData.equipmentId
  );

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Maintenance Task Details
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Fill in the information for the new maintenance task."
                : "Update the maintenance task information."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="equipmentId">Equipment *</Label>
              <Select
                key={`equipment-select-${
                  isLoadingEquipment ? "loading" : equipment.length
                }`}
                value={formData.equipmentId}
                onValueChange={(value) =>
                  handleInputChange("equipmentId", value)
                }
                disabled={isLoadingEquipment}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingEquipment
                        ? "Loading equipment..."
                        : "Select equipment..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name} ({eq.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEquipment && (
                <p className="text-sm text-muted-foreground mt-1">
                  Location: {selectedEquipment.location}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance task..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequencyDays">Frequency (days)</Label>
                <Input
                  id="frequencyDays"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.frequencyDays}
                  onChange={(e) =>
                    handleInputChange("frequencyDays", e.target.value)
                  }
                  min="1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty for one-time tasks
                </p>
              </div>

              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="Person responsible"
                  value={formData.assignedTo}
                  onChange={(e) =>
                    handleInputChange("assignedTo", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastPerformedDate">Last Performed Date</Label>
                <Input
                  id="lastPerformedDate"
                  type="date"
                  value={formData.lastPerformedDate}
                  onChange={(e) =>
                    handleInputChange("lastPerformedDate", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="nextDueDate">Next Due Date</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) =>
                    handleInputChange("nextDueDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: MaintenanceTask["status"]) =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
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
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                ? "Create Task"
                : "Update Task"}
            </Button>
          </CardFooter>
        </Card>
      </form>

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
    </>
  );
}
