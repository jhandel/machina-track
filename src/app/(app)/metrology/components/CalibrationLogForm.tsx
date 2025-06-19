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
import { RealtimeUploadComponent } from "@/components/ui/realtime-upload";

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
  const [pendingCertificateUrl, setPendingCertificateUrl] = useState<
    string | null
  >(null);
  const [hasFileSelected, setHasFileSelected] = useState(false);
  const [isUploadInProgress, setIsUploadInProgress] = useState(false);

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

  const handleUploadComplete = (result: {
    url: string;
    documentId?: number;
    storageType?: string;
  }) => {
    setPendingCertificateUrl(result.url);
    setIsUploadInProgress(false);
    toast({
      title: "Certificate Uploaded",
      description:
        "Calibration certificate has been uploaded. You can now save the calibration log.",
    });
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    setIsUploadInProgress(false);
    // Error handling is done in the RealtimeUploadComponent
  };

  const handleUploadStart = () => {
    setIsUploadInProgress(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there's a file selected but not yet uploaded
    if (hasFileSelected && !pendingCertificateUrl && !formData.certificateUrl) {
      toast({
        title: "Upload Required",
        description:
          "Please upload the calibration certificate before saving the log.",
        variant: "destructive",
      });
      return;
    }

    // Check if upload is in progress
    if (isUploadInProgress) {
      toast({
        title: "Upload In Progress",
        description:
          "Please wait for the certificate upload to complete before saving.",
        variant: "default",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the pending certificate URL if available, otherwise use existing
      const certificateUrl = pendingCertificateUrl || formData.certificateUrl;

      // Update the form data with the certificate URL
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
      // Reset upload state
      setPendingCertificateUrl(null);
      setHasFileSelected(false);
      setIsUploadInProgress(false);
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

        <RealtimeUploadComponent
          label="Calibration Certificate"
          description={
            DOCUMENT_STORAGE_TYPE === "paperless"
              ? "Upload calibration certificate with real-time progress (PDF, Word, Excel, image files accepted)"
              : "Upload calibration certificate with real-time progress (PDF, images accepted)"
          }
          documentType="Calibration Certificate"
          title={`Calibration for ${metrologyTool.name} - ${formData.date}`}
          tags={["metrology", "calibration", "internal"]}
          customFields={{
            metrologyToolId: metrologyTool.id,
            tool: metrologyTool.name,
            serialNumber: metrologyTool.serialNumber,
          }}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onUploadStart={handleUploadStart}
          onFileSelected={(file) => setHasFileSelected(!!file)}
          accept={
            DOCUMENT_STORAGE_TYPE === "paperless"
              ? ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tif,.tiff"
              : ".pdf,.jpg,.jpeg,.png"
          }
        />

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

        {pendingCertificateUrl && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              ✅ New certificate uploaded and ready to be saved with this
              calibration log.
            </p>
          </div>
        )}

        {hasFileSelected &&
          !pendingCertificateUrl &&
          !isUploadInProgress &&
          !formData.certificateUrl && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ File selected but not yet uploaded. Please click the Upload
                button to upload the certificate.
              </p>
            </div>
          )}

        {isUploadInProgress && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              ⏳ Upload in progress... Please wait for the upload to complete
              before saving.
            </p>
          </div>
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
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            isUploadInProgress ||
            (hasFileSelected &&
              !pendingCertificateUrl &&
              !isUploadInProgress &&
              !formData.certificateUrl)
          }
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Saving...
            </>
          ) : isUploadInProgress ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Upload in
              Progress...
            </>
          ) : hasFileSelected &&
            !pendingCertificateUrl &&
            !formData.certificateUrl ? (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Certificate First
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
