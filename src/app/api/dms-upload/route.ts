import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';
import {
    LOCAL_UPLOAD_DIR,
    PAPERLESS_NGX_ENABLED,
} from '@/lib/config';
import { PaperlessService } from '@/services';

// Determine the upload directory for fallback
const UPLOAD_DIR = join(process.cwd(), LOCAL_UPLOAD_DIR || 'public/uploads');

// Ensure the upload directory exists for fallback storage
if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const config = {
    api: {
        bodyParser: false,
    },
};

/**
 * DMS Upload endpoint - Handles document management system uploads
 * This endpoint is specifically for documents that need to be managed in paperless-ngx
 * such as calibration certificates, service record attachments, etc.
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

        // Try to upload to Paperless-ngx first
        if (PAPERLESS_NGX_ENABLED) {
            try {
                console.log('Uploading document to Paperless-ngx DMS...');
                console.log('Document Type:', documentType);
                console.log('Title:', title);
                console.log('File size:', file.size, 'bytes');

                const paperlessService = new PaperlessService();

                if (!paperlessService.isEnabled()) {
                    throw new Error('Paperless-ngx integration is not enabled');
                }

                const result = await paperlessService.uploadDocument(
                    file,
                    {
                        title,
                        documentType,
                        tags: JSON.parse(tags),
                        customFields: JSON.parse(customFields),
                    }
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
                    }
                });
            } catch (error) {
                console.error('Paperless-ngx DMS upload failed:', error);

                // For DMS uploads, we should return an error rather than fallback
                // as these documents need proper document management
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Document management system is currently unavailable',
                        details: error instanceof Error ? error.message : 'Unknown error',
                        storageType: 'dms_failed'
                    },
                    { status: 503 } // Service Unavailable
                );
            }
        } else {
            // If Paperless is not enabled, still try to provide fallback but warn
            console.warn('Paperless-ngx is not enabled, falling back to local storage for DMS upload');

            // Create a unique filename
            const fileExtension = file.name.split('.').pop() || 'unknown';
            const fileName = `dms_${uuidv4()}.${fileExtension}`;
            const filePath = join(UPLOAD_DIR, fileName);

            try {
                // Convert the file to a buffer and save it
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await writeFile(filePath, buffer);

                // Return the URL to the uploaded file
                const relativePath = LOCAL_UPLOAD_DIR.startsWith('public/')
                    ? LOCAL_UPLOAD_DIR.substring(7) // Remove 'public/' for URL
                    : LOCAL_UPLOAD_DIR;

                const fileUrl = `/${relativePath}/${fileName}`;

                return NextResponse.json({
                    success: true,
                    data: {
                        url: fileUrl,
                        storageType: 'local_fallback',
                        title: title,
                        documentType: documentType,
                    },
                    warning: 'Document management system is not configured. File stored locally without DMS features.'
                });
            } catch (fallbackError) {
                console.error('Local fallback storage failed:', fallbackError);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Document management system is not available and local fallback failed',
                        details: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'
                    },
                    { status: 500 }
                );
            }
        }
    } catch (error) {
        console.error('Error in DMS upload:', error);
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
