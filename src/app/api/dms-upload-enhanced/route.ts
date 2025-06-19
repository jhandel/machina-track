import { NextRequest, NextResponse } from 'next/server';
import { PaperlessService } from '@/services';
import {
    PAPERLESS_NGX_ENABLED,
} from '@/lib/config';

// Progress callback interface
interface ProgressCallback {
    (stage: string, progress: number, message: string, details?: any): void;
}

/**
 * Enhanced DMS Upload endpoint with real-time progress updates
 * This endpoint provides Server-Sent Events for real-time progress updates
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Get required metadata for DMS
        const documentType = formData.get('documentType') as string || 'Document';
        const title = formData.get('title') as string || file.name;
        const tags = formData.get('tags') as string || '[]';
        const customFields = formData.get('customFields') as string || '{}';
        const useSSE = formData.get('useSSE') === 'true';

        // Validate file size (max 25MB for DMS uploads)
        const MAX_SIZE = 25 * 1024 * 1024; // 25MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, error: 'File size exceeds 25MB limit' },
                { status: 400 }
            );
        }

        // Validate file type for DMS (documents only)
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/tiff',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Unsupported file type: ${file.type}. Please use PDF, images, or common document formats.`
                },
                { status: 400 }
            );
        }

        // If SSE is requested, set up streaming response
        if (useSSE) {
            return handleSSEUpload(file, {
                title,
                documentType,
                tags: JSON.parse(tags),
                customFields: JSON.parse(customFields),
            });
        }

        // Otherwise, use the enhanced progress callback approach
        let currentProgress = {
            stage: 'preparing',
            progress: 0,
            message: 'Starting upload...',
            details: {}
        };

        const progressCallback: ProgressCallback = (stage, progress, message, details) => {
            currentProgress = { stage, progress, message, details: details || {} };
        };

        // Try to upload to Paperless-ngx first
        if (PAPERLESS_NGX_ENABLED) {
            try {
                console.log('Uploading document to Paperless-ngx DMS with enhanced progress...');

                const paperlessService = new PaperlessService();

                if (!paperlessService.isEnabled()) {
                    throw new Error('Paperless-ngx integration is not enabled');
                }

                const result = await paperlessService.uploadDocumentWithDetailedProgress(
                    file,
                    {
                        title,
                        documentType,
                        tags: JSON.parse(tags),
                        customFields: JSON.parse(customFields),
                    },
                    progressCallback
                );

                console.log('Document uploaded successfully to DMS:', result);

                return NextResponse.json({
                    success: true,
                    data: {
                        url: result.downloadUrl,
                        documentId: result.id,
                        storageType: 'paperless',
                        title: title,
                        documentType: documentType,
                    },
                    finalProgress: currentProgress
                });
            } catch (error) {
                console.error('Paperless-ngx DMS upload failed:', error);

                return NextResponse.json(
                    {
                        success: false,
                        error: 'Document management system is currently unavailable',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        storageType: 'dms_failed'
                    },
                    { status: 503 }
                );
            }
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Paperless-ngx is not configured',
                    storageType: 'not_configured'
                },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error('Error in enhanced DMS upload:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process document upload',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

async function handleSSEUpload(
    file: File,
    metadata: {
        title: string;
        documentType?: string;
        tags?: string[];
        customFields?: Record<string, any>;
    }
): Promise<Response> {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const sendUpdate = (stage: string, progress: number, message: string, details?: any) => {
                const data = {
                    stage,
                    progress,
                    message,
                    details: details || {},
                    timestamp: new Date().toISOString()
                };

                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                );
            };

            // Start the upload process
            (async () => {
                try {
                    if (PAPERLESS_NGX_ENABLED) {
                        const paperlessService = new PaperlessService();

                        if (!paperlessService.isEnabled()) {
                            throw new Error('Paperless-ngx integration is not enabled');
                        }

                        const result = await paperlessService.uploadDocumentWithDetailedProgress(
                            file,
                            metadata,
                            sendUpdate
                        );

                        // Send final success message
                        sendUpdate('complete', 100, 'Upload completed successfully!', {
                            result: {
                                url: result.downloadUrl,
                                documentId: result.id,
                                storageType: 'paperless',
                                title: metadata.title,
                                documentType: metadata.documentType,
                            }
                        });
                    } else {
                        throw new Error('Paperless-ngx is not configured');
                    }
                } catch (error) {
                    // Send error message
                    sendUpdate('error', 0, 'Upload failed', {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                } finally {
                    controller.close();
                }
            })();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
