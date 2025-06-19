"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadStatus {
  stage:
    | "idle"
    | "preparing"
    | "uploading"
    | "processing"
    | "indexing"
    | "finalizing"
    | "complete"
    | "error"
    | "cancelled";
  progress: number;
  message: string;
  error?: string;
  canCancel?: boolean;
  canRetry?: boolean;
  details?: {
    currentStep?: string;
    totalSteps?: number;
    currentStepProgress?: number;
    timeRemaining?: string;
  };
}

interface UploadProgressProps {
  status: UploadStatus;
  fileName?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function UploadProgress({
  status,
  fileName,
  onCancel,
  onRetry,
  className,
}: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (status.stage) {
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "preparing":
      case "uploading":
      case "processing":
      case "indexing":
      case "finalizing":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status.stage) {
      case "complete":
        return "text-green-700";
      case "error":
        return "text-red-700";
      case "cancelled":
        return "text-yellow-700";
      case "preparing":
      case "uploading":
      case "processing":
      case "indexing":
      case "finalizing":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };

  const getProgressColor = () => {
    switch (status.stage) {
      case "complete":
        return "bg-green-600";
      case "error":
        return "bg-red-600";
      case "cancelled":
        return "bg-yellow-600";
      default:
        return "bg-blue-600";
    }
  };

  return (
    <div className={cn("space-y-3 p-4 border rounded-lg bg-card", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium">
              {fileName ? `Uploading ${fileName}` : "Document Upload"}
            </p>
            <p className={cn("text-xs", getStatusColor())}>{status.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.canRetry && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-8"
            >
              Retry
            </Button>
          )}
          {status.canCancel && onCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {status.stage !== "idle" && (
        <div className="space-y-2">
          <Progress value={status.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{status.progress}% complete</span>
            <div className="flex flex-col items-end">
              {status.details?.currentStep && (
                <span>Step: {status.details.currentStep}</span>
              )}
              {status.details?.timeRemaining && (
                <span>Est. {status.details.timeRemaining} remaining</span>
              )}
              {(status.stage === "processing" || status.stage === "indexing") &&
                !status.details?.timeRemaining && (
                  <span>Processing may take 30-60 seconds...</span>
                )}
            </div>
          </div>
        </div>
      )}

      {status.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{status.error}</p>
        </div>
      )}
    </div>
  );
}

export const createUploadStatus = (
  stage: UploadStatus["stage"] = "idle",
  progress: number = 0,
  message: string = "",
  options?: Partial<UploadStatus>
): UploadStatus => ({
  stage,
  progress,
  message,
  canCancel: stage === "uploading" || stage === "processing",
  canRetry: stage === "error",
  ...options,
});
