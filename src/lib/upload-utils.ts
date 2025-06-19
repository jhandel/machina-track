/**
 * Upload utility functions for handling different types of file uploads
 */

export type UploadType = 'simple' | 'dms';

export interface SimpleUploadOptions {
    file: File;
}

export interface DMSUploadOptions {
    file: File;
    documentType: string;
    title?: string;
    tags?: string[];
    customFields?: Record<string, any>;
}

export interface UploadResult {
    success: boolean;
    data?: {
        url: string;
        storageType: string;
        fileName?: string;
        documentId?: number;
        originalName?: string;
        size?: number;
        type?: string;
        title?: string;
        documentType?: string;
    };
    warning?: string;
    error?: string;
    details?: string;
}

/**
 * Upload a simple file (images, basic documents) to local storage
 * Use this for equipment photos, profile pictures, etc.
 */
export async function uploadSimpleFile(
    options: SimpleUploadOptions
): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', options.file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        return result;
    } catch (error) {
        return {
            success: false,
            error: 'Network error during upload',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Upload a document to the Document Management System (paperless-ngx)
 * Use this for calibration certificates, service record attachments, etc.
 */
export async function uploadDMSDocument(
    options: DMSUploadOptions
): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', options.file);
    formData.append('documentType', options.documentType);

    if (options.title) {
        formData.append('title', options.title);
    }

    if (options.tags) {
        formData.append('tags', JSON.stringify(options.tags));
    }

    if (options.customFields) {
        formData.append('customFields', JSON.stringify(options.customFields));
    }

    try {
        const response = await fetch('/api/dms-upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        return result;
    } catch (error) {
        return {
            success: false,
            error: 'Network error during DMS upload',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Determine the appropriate upload type based on file usage context
 */
export function getRecommendedUploadType(context: string): UploadType {
    const dmsContexts = [
        'calibration',
        'certificate',
        'service-record',
        'maintenance-record',
        'compliance',
        'audit',
        'inspection',
        'documentation',
        'warranty',
        'manual',
        'specification'
    ];

    const contextLower = context.toLowerCase();

    if (dmsContexts.some(dmsContext => contextLower.includes(dmsContext))) {
        return 'dms';
    }

    return 'simple';
}
