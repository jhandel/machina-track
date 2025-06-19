"use client";

import React, { useState, useEffect } from "react";
import { Save, ArrowLeft, Upload } from "lucide-react";
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
import { metrologyService } from "@/services";
import type { MetrologyTool, CalibrationLog } from "@/lib/types";
import { resolveDocumentUrl } from "@/lib/document-utils";
import { DOCUMENT_STORAGE_TYPE } from "@/lib/config";
import "./calibration-log.css";
import { useRealtimeUpload } from "@/hooks/use-realtime-upload";
import { UploadProgress } from "@/components/ui/upload-progress";

interface CalibrationLogFormProps {
  mode: "create" | "edit";
  metrologyTool: MetrologyTool;
  calibrationLogId?: string;
  initialData?: CalibrationLog;
  onCancel?: () => void;
  onSuccess?: (calibrationLog: CalibrationLog) => void;
  isModal?: boolean;
}

export function CalibrationLogForm({
  mode,
  metrologyTool,
  calibrationLogId,
  initialData,
  onCancel,
  onSuccess,
  isModal = false,
}: CalibrationLogFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createdCalibrationLog, setCreatedCalibrationLog] =
    useState<CalibrationLog | null>(null);

  const {
    status: uploadStatus,
    isUploading,
    startUpload,
    result: uploadResult,
  } = useRealtimeUpload();

  const [formData, setFormData] = useState<Omit<CalibrationLog, "id">>({
    metrologyToolId: metrologyTool.id,
    date: initialData?.date || new Date().toISOString().split("T")[0],
    performedBy: initialData?.performedBy || "",
    notes: initialData?.notes || "",
    result: initialData?.result || "pass",
    certificateUrl: initialData?.certificateUrl || "",
    nextDueDate:
      initialData?.nextDueDate ||
      calculateNextDueDate(
        new Date().toISOString().split("T")[0],
        metrologyTool.calibrationIntervalDays
      ),
  });

  function calculateNextDueDate(date: string, intervalDays: number): string {
    const currentDate = new Date(date);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate.toISOString().split("T")[0];
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If it's the date field, also update the next due date
    if (name === "date") {
      const nextDueDate = calculateNextDueDate(
        value,
        metrologyTool.calibrationIntervalDays
      );
      setFormData((prev) => ({ ...prev, nextDueDate }));
    }
  };

  // Handle upload completion - update the calibration log with certificate URL
  React.useEffect(() => {
    if (uploadResult && createdCalibrationLog && !isUploading) {
      const updateCalibrationLogWithCertificate = async () => {
        try {
          const updatedLog = await metrologyService.updateCalibrationLog(
            createdCalibrationLog.id,
            { certificateUrl: uploadResult.url }
          );

          toast({
            title: "Success",
            description:
              "Calibration log created and certificate uploaded successfully.",
          });

          if (onSuccess) {
            onSuccess(updatedLog);
          } else {
            router.push(`/metrology/${metrologyTool.id}`);
            router.refresh();
          }
        } catch (error) {
          console.error(
            "Error updating calibration log with certificate:",
            error
          );
          toast({
            title: "Warning",
            description:
              "Calibration log created but failed to attach certificate. You can manually upload it later.",
            variant: "destructive",
          });

          if (onSuccess && createdCalibrationLog) {
            onSuccess(createdCalibrationLog);
          } else {
            router.push(`/metrology/${metrologyTool.id}`);
            router.refresh();
          }
        } finally {
          setIsSubmitting(false);
          setCreatedCalibrationLog(null);
          setSelectedFile(null);
        }
      };

      updateCalibrationLogWithCertificate();
    }
  }, [
    uploadResult,
    createdCalibrationLog,
    isUploading,
    metrologyService,
    toast,
    onSuccess,
    router,
    metrologyTool.id,
  ]);

  // Handle upload errors
  React.useEffect(() => {
    if (uploadStatus.stage === "error" && createdCalibrationLog) {
      toast({
        title: "Warning",
        description: `Calibration log created but certificate upload failed: ${uploadStatus.error}. You can manually upload it later.`,
        variant: "destructive",
      });

      if (onSuccess) {
        onSuccess(createdCalibrationLog);
      } else {
        router.push(`/metrology/${metrologyTool.id}`);
        router.refresh();
      }

      setIsSubmitting(false);
      setCreatedCalibrationLog(null);
      setSelectedFile(null);
    }
  }, [
    uploadStatus.stage,
    uploadStatus.error,
    createdCalibrationLog,
    toast,
    onSuccess,
    router,
    metrologyTool.id,
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the calibration log first (without certificate URL)
      let result;
      if (mode === "create") {
        result = await metrologyService.createCalibrationLog({
          ...formData,
          certificateUrl: "", // Will be updated after upload
        });
        var newStatus: MetrologyTool["status"] =
          result.result == "pass" ? "calibrated" : "out_of_calibration";
        // If creating a new calibration log, also update the metrology tool's calibration dates
        await metrologyService.update(metrologyTool.id, {
          lastCalibrationDate: formData.date,
          nextCalibrationDate: formData.nextDueDate,
          status: newStatus,
        });
      } else if (mode === "edit" && calibrationLogId) {
        result = await metrologyService.updateCalibrationLog(
          calibrationLogId,
          formData
        );
      }

      // If there's a file selected, upload it and update the calibration log
      if (selectedFile && result) {
        setCreatedCalibrationLog(result);

        // Start the file upload
        await startUpload({
          file: selectedFile,
          documentType: "Calibration Certificate",
          title: `Calibration for ${metrologyTool.name} - ${formData.date}`,
          tags: ["metrology", "calibration", "internal"],
          customFields: {
            metrologyToolId: metrologyTool.id,
            tool: metrologyTool.name,
            serialNumber: metrologyTool.serialNumber,
            associatedObjId: result.id,
          },
        });

        // The upload completion will be handled by the useEffect hooks
        return;
      }

      // If no file selected, complete the process
      toast({
        title: "Success",
        description: `Calibration log ${
          mode === "create" ? "created" : "updated"
        } successfully.`,
      });

      if (onSuccess && result) {
        onSuccess(result);
      } else {
        router.push(`/metrology/${metrologyTool.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error(
        `Error ${mode === "create" ? "creating" : "updating"} calibration log:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to ${
          mode === "create" ? "create" : "update"
        } calibration log. Please try again.`,
        variant: "destructive",
      });
    } finally {
      if (!selectedFile) {
        setIsSubmitting(false);
      }
      // If file selected, setIsSubmitting(false) will be called after upload completes
    }
  };

  const title =
    mode === "create" ? "Add Calibration Log" : "Edit Calibration Log";
  const description =
    mode === "create"
      ? `Record a new calibration for ${metrologyTool.name}`
      : `Update calibration information for ${metrologyTool.name}`;

  // Form content that will be used in both modal and page versions
  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Calibration Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextDueDate">Next Calibration Date</Label>
            <Input
              id="nextDueDate"
              name="nextDueDate"
              type="date"
              value={formData.nextDueDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="performedBy">Performed By</Label>
          <Input
            id="performedBy"
            name="performedBy"
            value={formData.performedBy}
            onChange={handleInputChange}
            placeholder="Name of technician or service provider"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="result">Calibration Result</Label>
          <Select
            value={formData.result}
            onValueChange={(value) => handleSelectChange("result", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
              <SelectItem value="adjusted">Adjusted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificate">
            Calibration Certificate (Optional)
          </Label>
          <Input
            id="certificate"
            type="file"
            accept={
              DOCUMENT_STORAGE_TYPE === "paperless"
                ? ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tif,.tiff"
                : ".pdf,.jpg,.jpeg,.png"
            }
            onChange={handleFileSelect}
            disabled={isSubmitting || isUploading}
          />
          <p className="text-sm text-muted-foreground">
            {DOCUMENT_STORAGE_TYPE === "paperless"
              ? "Upload calibration certificate (PDF, Word, Excel, image files accepted)"
              : "Upload calibration certificate (PDF, images accepted)"}
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              📎 Selected file: {selectedFile.name}
            </p>
          </div>
        )}

        {formData.certificateUrl && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 flex-1">
              Current certificate: {formData.certificateUrl.split("/").pop()}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const resolvedUrl = resolveDocumentUrl(formData.certificateUrl);
                if (resolvedUrl) {
                  window.open(resolvedUrl, "_blank");
                }
              }}
            >
              View
            </Button>
          </div>
        )}

        {/* Show upload progress when upload is in progress */}
        {isUploading && (
          <UploadProgress
            status={uploadStatus}
            fileName={selectedFile?.name}
            onCancel={() => {}}
            onRetry={() => {}}
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            placeholder="Add any additional information about the calibration"
            rows={4}
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => router.back())}
        >
          {isModal ? (
            "Cancel"
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
            </>
          )}
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {isUploading ? "Uploading Certificate..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Calibration Log
            </>
          )}
        </Button>
      </div>
    </form>
  );

  // If in modal mode, return just the form content
  if (isModal) {
    return formContent;
  }

  // Otherwise, wrap in a card for page display
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
