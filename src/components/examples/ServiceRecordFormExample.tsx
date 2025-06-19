/**
 * Example Service Record Form with DMS Upload Integration
 * This demonstrates how to implement service record attachments using the new DMS upload system
 */

"use client";

import React, { useState } from "react";
import { Save, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadDMSDocument } from "@/lib/upload-utils";
import { useToast } from "@/hooks/use-toast";

interface ServiceRecordAttachment {
  file: File;
  documentType: string;
  title: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export function ServiceRecordFormExample() {
  const [attachments, setAttachments] = useState<ServiceRecordAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {}
  );
  const { toast } = useToast();

  const handleFileSelect = (files: FileList) => {
    const newAttachments: ServiceRecordAttachment[] = Array.from(files).map(
      (file) => ({
        file,
        documentType: getDocumentTypeFromFile(file),
        title: file.name,
        uploading: false,
        uploaded: false,
      })
    );

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const getDocumentTypeFromFile = (file: File): string => {
    const fileName = file.name.toLowerCase();

    if (fileName.includes("invoice") || fileName.includes("receipt")) {
      return "Service Invoice";
    } else if (fileName.includes("warranty")) {
      return "Warranty Document";
    } else if (fileName.includes("manual") || fileName.includes("guide")) {
      return "Service Manual";
    } else if (fileName.includes("report")) {
      return "Service Report";
    } else if (file.type.startsWith("image/")) {
      return "Service Photo";
    } else {
      return "Service Document";
    }
  };

  const uploadAttachment = async (index: number) => {
    const attachment = attachments[index];
    if (!attachment || attachment.uploading || attachment.uploaded) return;

    setAttachments((prev) =>
      prev.map((att, i) =>
        i === index ? { ...att, uploading: true, error: undefined } : att
      )
    );

    try {
      const result = await uploadDMSDocument({
        file: attachment.file,
        documentType: attachment.documentType,
        title: attachment.title,
        tags: ["service-record", "maintenance", "attachment"],
        customFields: {
          equipmentId: "EQ-001", // This would come from the form context
          serviceDate: new Date().toISOString(),
          attachmentType: attachment.documentType,
        },
      });

      if (result.success && result.data) {
        setAttachments((prev) =>
          prev.map((att, i) =>
            i === index
              ? {
                  ...att,
                  uploading: false,
                  uploaded: true,
                  url: result.data!.url,
                }
              : att
          )
        );

        toast({
          title: "Upload Successful",
          description: `${attachment.title} has been uploaded to the document management system.`,
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      setAttachments((prev) =>
        prev.map((att, i) =>
          i === index
            ? {
                ...att,
                uploading: false,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : att
        )
      );

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${attachment.title}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAttachmentDetails = (
    index: number,
    field: keyof ServiceRecordAttachment,
    value: string
  ) => {
    setAttachments((prev) =>
      prev.map((att, i) => (i === index ? { ...att, [field]: value } : att))
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Service Record Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-4">
            Upload service documents, photos, invoices, manuals, and reports
          </p>
          <Input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff,.txt,.csv"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Select Documents
              </span>
            </Button>
          </Label>
        </div>

        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Document Attachments</h3>
            {attachments.map((attachment, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{attachment.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label htmlFor={`title-${index}`}>Document Title</Label>
                    <Input
                      id={`title-${index}`}
                      value={attachment.title}
                      onChange={(e) =>
                        updateAttachmentDetails(index, "title", e.target.value)
                      }
                      disabled={attachment.uploading || attachment.uploaded}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`type-${index}`}>Document Type</Label>
                    <select
                      id={`type-${index}`}
                      value={attachment.documentType}
                      onChange={(e) =>
                        updateAttachmentDetails(
                          index,
                          "documentType",
                          e.target.value
                        )
                      }
                      disabled={attachment.uploading || attachment.uploaded}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      title="Select document type"
                    >
                      <option value="Service Document">Service Document</option>
                      <option value="Service Invoice">Service Invoice</option>
                      <option value="Service Report">Service Report</option>
                      <option value="Service Photo">Service Photo</option>
                      <option value="Warranty Document">
                        Warranty Document
                      </option>
                      <option value="Service Manual">Service Manual</option>
                      <option value="Parts List">Parts List</option>
                      <option value="Inspection Report">
                        Inspection Report
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {attachment.uploaded && (
                      <span className="text-green-600 text-sm">
                        ✓ Uploaded to DMS
                      </span>
                    )}
                    {attachment.uploading && (
                      <span className="text-blue-600 text-sm">
                        ⏳ Uploading...
                      </span>
                    )}
                    {attachment.error && (
                      <span className="text-red-600 text-sm">
                        ❌ {attachment.error}
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {!attachment.uploaded && !attachment.uploading && (
                      <Button
                        size="sm"
                        onClick={() => uploadAttachment(index)}
                        disabled={!attachment.title.trim()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload to DMS
                      </Button>
                    )}
                    {attachment.uploaded && attachment.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(attachment.url, "_blank")}
                      >
                        View Document
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Summary */}
        {attachments.length > 0 && (
          <Card className="bg-gray-50 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  {attachments.filter((a) => a.uploaded).length} of{" "}
                  {attachments.length} documents uploaded
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  attachments.forEach((_, index) => {
                    if (
                      !attachments[index].uploaded &&
                      !attachments[index].uploading
                    ) {
                      uploadAttachment(index);
                    }
                  });
                }}
                disabled={attachments.every((a) => a.uploaded || a.uploading)}
              >
                Upload All Remaining
              </Button>
            </div>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline">Cancel</Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Service Record
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
