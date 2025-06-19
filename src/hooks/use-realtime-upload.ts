"use client";

import { useState, useCallback } from 'react';
import { UploadStatus, createUploadStatus } from "@/components/ui/upload-progress";

export interface RealtimeUploadOptions {
    file: File;
    documentType?: string;
    title?: string;
    tags?: string[];
    customFields?: Record<string, any>;
}

export interface UseRealtimeUploadReturn {
    status: UploadStatus;
    isUploading: boolean;
    startUpload: (options: RealtimeUploadOptions) => Promise<void>;
    cancelUpload: () => void;
    error: string | null;
    result: any | null;
}

export function useRealtimeUpload(): UseRealtimeUploadReturn {
    const [status, setStatus] = useState<UploadStatus>(
        createUploadStatus('idle', 0, '')
    );
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any | null>(null);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);

    const startUpload = useCallback(async (options: RealtimeUploadOptions) => {
        setIsUploading(true);
        setError(null);
        setResult(null);
        setStatus(createUploadStatus('preparing', 0, 'Preparing upload...', { canCancel: true }));

        try {
            // First, try the SSE approach
            const formData = new FormData();
            formData.append('file', options.file);
            formData.append('useSSE', 'true');

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

            // Use fetch for SSE
            const response = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Check if the response is Server-Sent Events
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('text/event-stream')) {
                // Handle SSE response
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.substring(6));

                                    setStatus(createUploadStatus(
                                        data.stage,
                                        data.progress,
                                        data.message,
                                        {
                                            canCancel: data.stage !== 'complete' && data.stage !== 'error',
                                            canRetry: data.stage === 'error',
                                            details: data.details
                                        }
                                    ));

                                    if (data.stage === 'complete') {
                                        setResult(data.details?.result);
                                        setIsUploading(false);
                                    } else if (data.stage === 'error') {
                                        setError(data.details?.error || 'Upload failed');
                                        setIsUploading(false);
                                    }
                                } catch (parseError) {
                                    console.warn('Failed to parse SSE data:', parseError);
                                }
                            }
                        }
                    }
                }
            } else {
                // Handle regular JSON response (fallback)
                const result = await response.json();

                if (result.success) {
                    setStatus(createUploadStatus('complete', 100, 'Upload completed successfully!'));
                    setResult(result.data);
                    setIsUploading(false);
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setError(errorMessage);
            setStatus(createUploadStatus(
                'error',
                0,
                'Upload failed',
                {
                    error: errorMessage,
                    canRetry: true
                }
            ));
            setIsUploading(false);
        }
    }, []);

    const cancelUpload = useCallback(() => {
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
        }

        setStatus(createUploadStatus('cancelled', 0, 'Upload cancelled by user'));
        setIsUploading(false);
    }, [eventSource]);

    return {
        status,
        isUploading,
        startUpload,
        cancelUpload,
        error,
        result,
    };
}
