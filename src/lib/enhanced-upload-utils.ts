import { UploadStatus, createUploadStatus } from "@/components/ui/upload-progress";

export interface EnhancedDMSUploadOptions {
    file: File;
    documentType?: string;
    title?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    onProgress?: (status: UploadStatus) => void;
    onCancel?: () => void;
}

export interface UploadJob {
    id: string;
    file: File;
    options: EnhancedDMSUploadOptions;
    controller: AbortController;
    status: UploadStatus;
}

class EnhancedUploadManager {
    private jobs = new Map<string, UploadJob>();

    async uploadDMSDocument(options: EnhancedDMSUploadOptions): Promise<{
        success: boolean;
        data?: { url: string; documentId?: number; storageType?: string; title?: string; documentType?: string; };
        error?: string;
        warning?: string;
        jobId: string;
    }> {
        const jobId = `upload_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const controller = new AbortController();

        const job: UploadJob = {
            id: jobId,
            file: options.file,
            options,
            controller,
            status: createUploadStatus('idle', 0, 'Preparing upload...')
        };

        this.jobs.set(jobId, job);

        try {
            // Update status to uploading
            this.updateJobStatus(jobId, createUploadStatus(
                'preparing',
                5,
                'Preparing document metadata...',
                { canCancel: true }
            ));

            const formData = new FormData();
            formData.append('file', options.file);

            if (options.documentType) {
                formData.append('documentType', options.documentType);
            }

            if (options.title) {
                formData.append('title', options.title);
            }

            if (options.tags) {
                formData.append('tags', JSON.stringify(options.tags));
            }

            if (options.customFields) {
                formData.append('customFields', JSON.stringify(options.customFields));
            }

            // Update status to uploading file
            this.updateJobStatus(jobId, createUploadStatus(
                'uploading',
                15,
                'Uploading file to server...',
                { canCancel: true }
            ));

            const response = await fetch('/api/dms-upload-enhanced', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            if (controller.signal.aborted) {
                this.updateJobStatus(jobId, createUploadStatus(
                    'cancelled',
                    0,
                    'Upload cancelled by user'
                ));
                return {
                    success: false,
                    error: 'Upload cancelled by user',
                    jobId
                };
            }

            // Update status to processing
            this.updateJobStatus(jobId, createUploadStatus(
                'processing',
                50,
                'Processing document in DMS...',
                { canCancel: false }
            ));

            const result = await response.json();

            if (result.success) {
                this.updateJobStatus(jobId, createUploadStatus(
                    'complete',
                    100,
                    'Document uploaded successfully!'
                ));

                return {
                    ...result,
                    jobId
                };
            } else {
                this.updateJobStatus(jobId, createUploadStatus(
                    'error',
                    0,
                    'Upload failed',
                    {
                        error: result.error || 'Unknown error occurred',
                        canRetry: true
                    }
                ));

                return {
                    ...result,
                    jobId
                };
            }
        } catch (error) {
            if (controller.signal.aborted) {
                this.updateJobStatus(jobId, createUploadStatus(
                    'cancelled',
                    0,
                    'Upload cancelled by user'
                ));
                return {
                    success: false,
                    error: 'Upload cancelled by user',
                    jobId
                };
            }

            const errorMessage = error instanceof Error ? error.message : 'Network error during DMS upload';

            this.updateJobStatus(jobId, createUploadStatus(
                'error',
                0,
                'Upload failed',
                {
                    error: errorMessage,
                    canRetry: true
                }
            ));

            return {
                success: false,
                error: errorMessage,
                jobId
            };
        }
    }

    private updateJobStatus(jobId: string, status: UploadStatus) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.status = status;
            job.options.onProgress?.(status);
        }
    }

    cancelUpload(jobId: string) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.controller.abort();
            this.updateJobStatus(jobId, createUploadStatus(
                'cancelled',
                0,
                'Upload cancelled by user'
            ));
        }
    }

    retryUpload(jobId: string): Promise<{
        success: boolean;
        data?: { url: string; documentId?: number; storageType?: string; title?: string; documentType?: string; };
        error?: string;
        warning?: string;
        jobId: string;
    }> {
        const job = this.jobs.get(jobId);
        if (job) {
            // Remove the old job and create a new one
            this.jobs.delete(jobId);
            return this.uploadDMSDocument(job.options);
        }

        return Promise.resolve({
            success: false,
            error: 'Job not found',
            jobId
        });
    }

    getJobStatus(jobId: string): UploadStatus | null {
        const job = this.jobs.get(jobId);
        return job ? job.status : null;
    }

    cleanup(jobId: string) {
        this.jobs.delete(jobId);
    }
}

export const enhancedUploadManager = new EnhancedUploadManager();
