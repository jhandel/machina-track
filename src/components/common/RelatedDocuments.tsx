// src/components/common/RelatedDocuments.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeUpload } from "@/hooks/use-realtime-upload";
import { UploadProgress } from "@/components/ui/upload-progress";
import type { PaperlessDocument } from "@/lib/types";
import { resolveDocumentUrl } from "@/lib/document-utils";

interface RelatedDocumentsProps {
  /**
   * The ID of the object (equipment, metrology tool, etc.) to show documents for
   */
  objectId: string;
  /**
   * Optional title for the card
   */
  title?: string;
  /**
   * Optional description for what types of documents can be uploaded
   */
  description?: string;
  /**
   * Default document type for new uploads
   */
  defaultDocumentType?: string;
  /**
   * Additional tags to add to uploaded documents
   */
  additionalTags?: string[];
}

export function RelatedDocuments({
  objectId,
  title = "Related Documents",
  description = "Documents associated with this item",
  defaultDocumentType = "Related Document",
  additionalTags = [],
}: RelatedDocumentsProps) {
  const { toast } = useToast();
  const realtimeUpload = useRealtimeUpload();

  const [documents, setDocuments] = useState<PaperlessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentType, setDocumentType] = useState(defaultDocumentType);
  const [paperlessEnabled, setPaperlessEnabled] = useState<boolean | null>(
    null
  );

  // Check if Paperless is enabled
  const checkPaperlessStatus = async () => {
    try {
      const response = await fetch("/api/documents/status");
      const data = await response.json();
      setPaperlessEnabled(data.enabled);
    } catch (error) {
      console.error("Failed to check Paperless status:", error);
      setPaperlessEnabled(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/documents?fieldName=associatedObjId&fieldValue=${encodeURIComponent(
          objectId
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Failed to fetch related documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch related documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await checkPaperlessStatus();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (paperlessEnabled === true) {
      fetchDocuments();
    } else if (paperlessEnabled === false) {
      setLoading(false);
    }
  }, [objectId, paperlessEnabled]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const tags = ["related-document", ...additionalTags];

    try {
      // Use the realtime upload hook but with our documents API
      await realtimeUpload.startUpload({
        file: selectedFile,
        title: documentTitle || selectedFile.name,
        documentType,
        customFields: {
          associatedObjId: objectId,
        },
        tags,
      });

      // The realtime hook will handle the upload progress automatically
      // We just need to handle the result when it completes
    } catch (error) {
      console.error("Failed to upload document:", error);
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  // Effect to handle upload completion
  React.useEffect(() => {
    if (realtimeUpload.status.stage === "complete" && realtimeUpload.result) {
      toast({
        title: "Document Uploaded",
        description: `${
          documentTitle || selectedFile?.name || "Document"
        } has been uploaded successfully.`,
      });

      // Reset form
      setSelectedFile(null);
      setDocumentTitle("");
      setDocumentType(defaultDocumentType);
      setUploadDialogOpen(false);

      // Refresh documents list
      fetchDocuments();
    } else if (realtimeUpload.status.stage === "error") {
      toast({
        title: "Upload Failed",
        description: realtimeUpload.error || "Failed to upload document",
        variant: "destructive",
      });
    }
  }, [
    realtimeUpload.status.stage,
    realtimeUpload.result,
    realtimeUpload.error,
    documentTitle,
    selectedFile,
    defaultDocumentType,
    toast,
  ]);

  const handleDelete = async (documentId: number, documentTitle: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast({
        title: "Document Deleted",
        description: `${documentTitle} has been deleted successfully.`,
        variant: "destructive",
      });

      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (paperlessEnabled === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Document management system is not configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a new document to associate with this item.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff,.txt,.csv"
                  />
                </div>
                {selectedFile && (
                  <>
                    <div>
                      <Label htmlFor="document-title">Document Title</Label>
                      <Input
                        id="document-title"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        placeholder="Enter document title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document-type">Document Type</Label>
                      <Input
                        id="document-type"
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        placeholder="Enter document type"
                      />
                    </div>
                  </>
                )}

                {/* Show upload progress when uploading */}
                {realtimeUpload.isUploading && selectedFile && (
                  <div className="space-y-2">
                    <UploadProgress
                      status={realtimeUpload.status}
                      fileName={selectedFile.name}
                      onCancel={realtimeUpload.cancelUpload}
                      onRetry={() => handleUpload()}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (realtimeUpload.isUploading) {
                      realtimeUpload.cancelUpload();
                    }
                    setUploadDialogOpen(false);
                    setSelectedFile(null);
                    setDocumentTitle("");
                    setDocumentType(defaultDocumentType);
                  }}
                >
                  {realtimeUpload.isUploading ? "Cancel Upload" : "Cancel"}
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || realtimeUpload.isUploading}
                >
                  {realtimeUpload.isUploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">
              Loading documents...
            </span>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Added: {formatDate(doc.added)}
                      {doc.original_file_name &&
                        doc.original_file_name !== doc.title && (
                          <span className="ml-2">
                            ({doc.original_file_name})
                          </span>
                        )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={resolveDocumentUrl(
                        `/api/documents/${doc.id}/download/`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Download ${doc.title}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{doc.title}"? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(doc.id, doc.title)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents found</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
