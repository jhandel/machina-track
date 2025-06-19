"use client";

import React, { useState } from "react";
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
import { custom } from "zod";
import { uploadDMSDocument } from "@/lib/upload-utils";

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
  const [isLoading, setIsLoading] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let certificateUrl = formData.certificateUrl;

      // Upload certificate file if selected
      if (certificateFile) {
        setUploadProgress(10);

        try {
          const customFields = {
            metrologyToolId: metrologyTool.id,
            tool: metrologyTool.name,
            serialNumber: metrologyTool.serialNumber,
          };

          const tags = ["metrology", "calibration", "internal"];

          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return prev + 10;
            });
          }, 300);

          const result = await uploadDMSDocument({
            file: certificateFile,
            documentType: "Calibration Certificate",
            title: `Calibration for ${metrologyTool.name} - ${formData.date}`,
            tags,
            customFields,
          });

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (result.success && result.data) {
            certificateUrl = result.data.url;

            if (result.warning) {
              toast({
                title: "Upload Warning",
                description: result.warning,
                variant: "default",
              });
            }
          } else {
            throw new Error(result.error || "Failed to upload certificate");
          }
        } catch (error) {
          console.error("Error uploading certificate:", error);
          toast({
            title: "Upload Error",
            description:
              "Failed to upload calibration certificate. The log will be saved without the certificate.",
            variant: "destructive",
          });
        }
      }

      // Update the form data with the new certificate URL
      const updatedFormData = {
        ...formData,
        certificateUrl,
      };

      let result;
      if (mode === "create") {
        result = await metrologyService.createCalibrationLog(updatedFormData);

        // If creating a new calibration log, also update the metrology tool's calibration dates
        await metrologyService.update(metrologyTool.id, {
          lastCalibrationDate: formData.date,
          nextCalibrationDate: formData.nextDueDate,
          status: "calibrated",
        });
      } else if (mode === "edit" && calibrationLogId) {
        result = await metrologyService.updateCalibrationLog(
          calibrationLogId,
          updatedFormData
        );
      }

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
      setIsSubmitting(false);
      setUploadProgress(0);
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
          <Label htmlFor="certificate">Calibration Certificate</Label>
          <div className="flex items-center gap-2">
            <Input
              id="certificate"
              type="file"
              onChange={handleFileChange}
              className="flex-1"
              accept={
                DOCUMENT_STORAGE_TYPE === "paperless"
                  ? "application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tif,.tiff"
                  : "image/*,application/pdf"
              }
            />
            {formData.certificateUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const resolvedUrl = resolveDocumentUrl(
                    formData.certificateUrl
                  );
                  if (resolvedUrl) {
                    window.open(resolvedUrl, "_blank");
                  }
                }}
              >
                View
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {DOCUMENT_STORAGE_TYPE === "paperless"
              ? "Upload calibration certificate (PDF, Word, Excel, image files accepted)"
              : "Upload calibration certificate (PDF, images accepted)"}
          </p>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-bar">
              <div
                className={`progress-bar-fill progress-${
                  Math.round(uploadProgress / 10) * 10
                }`}
              ></div>
            </div>
          )}
        </div>

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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Saving...
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
