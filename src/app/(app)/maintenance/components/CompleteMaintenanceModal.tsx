"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare } from "lucide-react";
import type { MaintenanceTask, ServiceRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { maintenanceService } from "@/services/maintenance-service";

interface CompleteMaintenanceModalProps {
  task: MaintenanceTask;
  onCompleted: (
    updatedTask: MaintenanceTask,
    serviceRecord: ServiceRecord
  ) => void;
  buttonText?: string;
}

export default function CompleteMaintenanceModal({
  task,
  onCompleted,
  buttonText = "Mark as Complete",
}: CompleteMaintenanceModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    performedBy: "",
    descriptionOfWork: task.description,
    cost: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.performedBy || !formData.descriptionOfWork) {
      toast({
        title: "Missing Information",
        description: "Please provide who performed the work and a description.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const result = await maintenanceService.completeMaintenanceTask(task.id, {
        performedBy: formData.performedBy,
        descriptionOfWork: formData.descriptionOfWork,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        notes: formData.notes || undefined,
      });

      toast({
        title: "Maintenance Completed",
        description: `${task.description} has been completed and a service record created.`,
      });

      onCompleted(result.task, result.serviceRecord);
      setOpen(false);
    } catch (error) {
      console.error("Error completing maintenance task:", error);
      toast({
        title: "Update Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to complete maintenance task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextRecurrenceInfo = task.frequencyDays ? (
    <p className="text-sm text-muted-foreground mt-2">
      This is a recurring task. After completion, it will be automatically
      rescheduled for {task.frequencyDays} days from today.
    </p>
  ) : (
    <p className="text-sm text-muted-foreground mt-2">
      This is a one-time task. After completion, it will be marked as completed.
    </p>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CheckSquare className="mr-2 h-4 w-4" /> {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Complete Maintenance Task</DialogTitle>
            <DialogDescription>
              Record details about the completed maintenance. This will create a
              service record and
              {task.frequencyDays
                ? " reschedule the task for future maintenance."
                : " mark the task as completed."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="performedBy">Performed By *</Label>
              <Input
                id="performedBy"
                name="performedBy"
                value={formData.performedBy}
                onChange={handleChange}
                placeholder="Enter name of person who performed the work"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descriptionOfWork">Description of Work *</Label>
              <Textarea
                id="descriptionOfWork"
                name="descriptionOfWork"
                value={formData.descriptionOfWork}
                onChange={handleChange}
                placeholder="Describe the maintenance work that was performed"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cost">Cost (optional)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={handleChange}
                placeholder="Enter the cost of the service (if applicable)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes about the service"
              />
            </div>

            {nextRecurrenceInfo}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Completing..." : "Complete Maintenance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
