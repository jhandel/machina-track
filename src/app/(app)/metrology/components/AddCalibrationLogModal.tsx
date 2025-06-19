"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { CalibrationLogForm } from "./CalibrationLogForm";
import type { MetrologyTool } from "@/lib/types";

interface AddCalibrationLogModalProps {
  metrologyTool: MetrologyTool;
  onCalibrationLogAdded: () => void;
}

export function AddCalibrationLogModal({
  metrologyTool,
  onCalibrationLogAdded,
}: AddCalibrationLogModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    onCalibrationLogAdded();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Log New Calibration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add Calibration Log for {metrologyTool.name}
          </DialogTitle>
          <DialogDescription>
            Record a calibration event for this metrology tool.
          </DialogDescription>
        </DialogHeader>
        <CalibrationLogForm
          mode="create"
          metrologyTool={metrologyTool}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  );
}
