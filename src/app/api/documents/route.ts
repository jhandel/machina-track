// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaperlessService } from '@/services/paperless-service';

const paperlessService = new PaperlessService();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fieldName = searchParams.get('fieldName');
        const fieldValue = searchParams.get('fieldValue');

        if (!fieldName || !fieldValue) {
            return NextResponse.json(
                { error: 'Missing fieldName or fieldValue parameters' },
                { status: 400 }
            );
        }

        const documents = await paperlessService.getDocumentsByCustomField(fieldName, fieldValue);

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const documentType = formData.get('documentType') as string;
        const customFields = JSON.parse(formData.get('customFields') as string || '{}');
        const tags = JSON.parse(formData.get('tags') as string || '[]');
        const useSSE = formData.get('useSSE') === 'true';

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // If SSE is requested, return a streaming response
        if (useSSE) {
            const encoder = new TextEncoder();

            const stream = new ReadableStream({
                start(controller) {
                    const onProgress = (stage: string, progress: number, message: string, details?: any) => {
                        const data = JSON.stringify({ stage, progress, message, details });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    };

                    paperlessService.uploadDocumentWithDetailedProgress(file, {
                        title: title || file.name,
                        documentType,
                        customFields,
                        tags,
                    }, onProgress).then(result => {
                        // Send final success message
                        const data = JSON.stringify({
                            stage: 'complete',
                            progress: 100,
                            message: 'Upload completed successfully!',
                            details: { result }
                        });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        controller.close();
                    }).catch(error => {
                        // Send error message
                        const data = JSON.stringify({
                            stage: 'error',
                            progress: 0,
                            message: 'Upload failed',
                            details: { error: error.message }
                        });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        controller.close();
                    });
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

        // Fallback to regular JSON response
        const result = await paperlessService.uploadDocument(file, {
            title: title || file.name,
            documentType,
            customFields,
            tags,
        });

        return NextResponse.json({ document: result });
    } catch (error) {
        console.error('Failed to upload document:', error);
        return NextResponse.json(
            { error: 'Failed to upload document' },
            { status: 500 }
        );
    }
}
