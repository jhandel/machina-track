"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { CalibrationLogForm } from "./CalibrationLogForm";
import { metrologyService } from "@/services";
import type { MetrologyTool, CalibrationLog } from "@/lib/types";

interface EditCalibrationLogModalProps {
  metrologyTool: MetrologyTool;
  calibrationLogId: string;
  onCalibrationLogUpdated: () => void;
}

export function EditCalibrationLogModal({
  metrologyTool,
  calibrationLogId,
  onCalibrationLogUpdated,
}: EditCalibrationLogModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calibrationLog, setCalibrationLog] = useState<CalibrationLog | null>(
    null
  );

  const handleSuccess = () => {
    setIsOpen(false);
    onCalibrationLogUpdated();
  };

  useEffect(() => {
    if (isOpen && !calibrationLog) {
      loadCalibrationLog();
    }
  }, [isOpen]);

  const loadCalibrationLog = async () => {
    try {
      setLoading(true);
      const logs = await metrologyService.getCalibrationLogs(metrologyTool.id);
      const log = logs.find((log) => log.id === calibrationLogId);

      if (log) {
        setCalibrationLog(log);
      } else {
        setError("Calibration log not found");
      }
    } catch (err) {
      console.error("Error loading calibration log:", err);
      setError("Failed to load calibration log data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="text-primary">
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Calibration Log</DialogTitle>
          <DialogDescription>
            Update calibration information for {metrologyTool.name}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading calibration log...
            </p>
          </div>
        )}

        {error && (
          <div className="py-6 text-center">
            <p className="text-red-500">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        )}

        {!loading && !error && calibrationLog && (
          <CalibrationLogForm
            mode="edit"
            metrologyTool={metrologyTool}
            calibrationLogId={calibrationLogId}
            initialData={calibrationLog}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
            isModal={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
