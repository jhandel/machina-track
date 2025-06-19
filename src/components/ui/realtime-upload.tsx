"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadProgress } from "@/components/ui/upload-progress";
import { useRealtimeUpload } from "@/hooks/use-realtime-upload";
import { useToast } from "@/hooks/use-toast";

interface RealtimeUploadComponentProps {
  onUploadComplete?: (result: {
    url: string;
    documentId?: number;
    storageType?: string;
  }) => void;
  onUploadError?: (error: string) => void;
  onUploadStart?: () => void;
  onFileSelected?: (file: File | null) => void;
  documentType?: string;
  title?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function RealtimeUploadComponent({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  onFileSelected,
  documentType,
  title,
  tags,
  customFields,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.tiff,.webp,.txt,.csv",
  maxSize = 25,
  disabled = false,
  className,
  label = "Upload Document",
  description = "Select a document to upload to the document management system with real-time progress",
}: RealtimeUploadComponentProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { status, isUploading, startUpload, cancelUpload, result } =
    useRealtimeUpload();

  // Handle upload completion
  React.useEffect(() => {
    if (result && !isUploading) {
      toast({
        title: "Upload Complete",
        description: "Your document has been successfully uploaded to the DMS.",
      });
      onUploadComplete?.(result);
      setSelectedFile(null);
    }
  }, [result, isUploading, onUploadComplete, toast]);

  // Handle upload errors
  React.useEffect(() => {
    if (status.stage === "error" && status.error) {
      toast({
        title: "Upload Failed",
        description: status.error,
        variant: "destructive",
      });
      onUploadError?.(status.error);
    }
  }, [status.stage, status.error, onUploadError, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `File size must be less than ${maxSize}MB`,
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      onFileSelected?.(file);
    } else {
      setSelectedFile(null);
      onFileSelected?.(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    onUploadStart?.();

    await startUpload({
      file: selectedFile,
      documentType: documentType || "Document",
      title: title || selectedFile.name,
      tags: tags || [],
      customFields: customFields || {},
    });
  };

  const handleCancel = () => {
    cancelUpload();
    setSelectedFile(null);
  };

  const handleRetry = () => {
    if (selectedFile) {
      handleUpload();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="realtime-upload-input">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="realtime-upload-input"
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="flex-1"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || disabled || isUploading}
            className="shrink-0"
          >
            {isUploading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {(status.stage !== "idle" || isUploading) && (
        <UploadProgress
          status={status}
          fileName={selectedFile?.name}
          onCancel={handleCancel}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
