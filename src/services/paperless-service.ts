/**
 * Paperless-ngx Integration Service
 * Handles document uploads and retrieval from Paperless-ngx
 */

import {
    PAPERLESS_NGX_URL,
    PAPERLESS_NGX_USERNAME,
    PAPERLESS_NGX_PASSWORD,
    PAPERLESS_CALIBRATION_TAG_ID,
    DOCUMENT_STORAGE_TYPE,
    PAPERLESS_NGX_ENABLED
} from '@/lib/config';

// Interface for task response
interface TaskResponse {
    task_id: string;
    status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE';
    related_document?: number; // Document ID if task was successful
    date_done?: string;
}

// Token cache interface
interface TokenCache {
    token: string;
    expiresAt: number;
}

// Global token cache that persists between requests
let globalTokenCache: TokenCache | null = null;

// Token expiration time in milliseconds (default: 1 hour)
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

export class PaperlessService {
    private baseUrl: string;

    constructor() {
        // Set the baseUrl, default to an empty string if not provided
        this.baseUrl = PAPERLESS_NGX_URL || '';

        // Log an error if the URL is not configured but we're trying to use Paperless
        if (!this.baseUrl && DOCUMENT_STORAGE_TYPE === 'paperless') {
            console.error('Paperless-ngx URL is not configured but storage type is set to paperless');
        }
    }

    /**
     * Check if Paperless-ngx integration is enabled
     */
    isEnabled(): boolean {
        return PAPERLESS_NGX_ENABLED && DOCUMENT_STORAGE_TYPE === 'paperless';
    }

    /**
     * Get authentication token with caching
     */
    private async getToken(): Promise<string> {
        // Check if we have a valid cached token
        if (globalTokenCache && globalTokenCache.expiresAt > Date.now()) {
            return globalTokenCache.token;
        }

        try {
            // Use the fetch API that works in both client and server components
            const response = await fetch(`${this.baseUrl}/api/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: PAPERLESS_NGX_USERNAME,
                    password: PAPERLESS_NGX_PASSWORD,
                }),
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.statusText}`);
            }

            const data = await response.json();
            const token = data.token;

            if (!token) {
                throw new Error('No token received from Paperless-ngx');
            }

            // Cache the token with an expiration time
            globalTokenCache = {
                token,
                expiresAt: Date.now() + TOKEN_EXPIRATION_MS
            };

            return token;
        } catch (error) {
            console.error('Failed to authenticate with Paperless-ngx:', error);
            throw new Error('Failed to authenticate with Paperless-ngx');
        }
    }

    /**
     * Check the status of a task
     * @param taskId The UUID of the task
     * @returns Task status response
     */
    private async checkTaskStatus(taskId: string): Promise<TaskResponse> {
        const token = await this.getToken();

        const response = await fetch(`${this.baseUrl}/api/tasks/?task_id=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Task status check failed: ${response.statusText}`);
        }

        return (await response.json())[0] as TaskResponse;
    }

    /**
     * Wait for a task to complete
     * @param taskId The UUID of the task
     * @param maxAttempts Maximum number of attempts to check task status
     * @param interval Interval between checks in milliseconds
     * @returns Task result with document ID
     */
    private async waitForTaskCompletion(
        taskId: string,
        maxAttempts = 30,
        interval = 2000,
        onProgress?: (progress: number) => void
    ): Promise<number> {
        let attempts = 0;

        while (attempts < maxAttempts) {
            const taskStatus = await this.checkTaskStatus(taskId);

            // Calculate progress between 50% and 90%
            if (onProgress) {
                const progressValue = 50 + Math.min(40 * (attempts / maxAttempts), 40);
                onProgress(progressValue);
            }

            if (taskStatus.status === 'SUCCESS' && taskStatus.related_document) {
                return taskStatus.related_document;
            } else if (taskStatus.status === 'FAILURE') {
                throw new Error(`Task failed: ${JSON.stringify(taskStatus || {})}`);
            }

            // If task is still in progress, wait and try again
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
        }

        throw new Error(`Task timed out after ${maxAttempts} attempts`);
    }

    /**
     * Upload a document to Paperless-ngx
     * @param file The file to upload
     * @param metadata Additional metadata for the document
     * @param onProgress Progress callback
     */
    async uploadDocument(
        file: File,
        metadata: {
            title: string;
            documentType?: string;
            customFields?: Record<string, any>;
            tags?: string[];
            archiveSerialNumber?: string;
        },
        onProgress?: (progress: number) => void
    ): Promise<{ id: number; downloadUrl: string }> {
        if (!this.isEnabled()) {
            throw new Error('Paperless-ngx integration is not enabled');
        }

        try {
            const token = await this.getToken();

            // First, upload the document
            const formData = new FormData();
            formData.append('title', metadata.title || file.name);
            if (metadata.archiveSerialNumber) {
                formData.append('archive_serial_number', metadata.archiveSerialNumber);
            }
            //find the document type ID based on the provided documentType
            if (onProgress) onProgress(10);
            if (metadata.documentType && metadata.documentType !== '') {
                const documentTypeId = await this.getOrCreateDocumentTypeId(metadata.documentType);
                if (documentTypeId) {
                    formData.append('document_type', documentTypeId.toString());
                } else {
                    console.warn(`Document type "${metadata.documentType}" not found, skipping.`);
                }
            }
            if (onProgress) onProgress(15);
            // Add custom fields if provided
            var fieldMap: Record<number, string> = {};
            var fieldIds: number[] = [];
            if (metadata.customFields) {
                for (const [key, value] of Object.entries(metadata.customFields)) {
                    if (!key || key === '') {
                        continue;
                    }
                    var fieldId = await this.getOrCreateCustomFieldId(key);
                    if (fieldId) {
                        fieldMap[fieldId] = value;
                        //formData.append('custom_fields', fieldId.toString());
                    } else {
                        //console.warn(`Custom field "${key}" not found, skipping.`);
                    }
                }
                // field IDs should be a comma-separated string
                if (fieldIds.length > 0) {
                    formData.append('custom_fields', fieldIds.join(','));
                }
            }
            if (onProgress) onProgress(25);
            // Add tags if provided
            var tagIds: number[] = [];
            if (metadata.tags && metadata.tags.length > 0) {
                //lookup the ids for the provided tags
                for (const tag of metadata.tags) {
                    if (!tag || tag === '') {
                        continue;
                    }
                    const tagId = await this.getOrCreateTagId(tag);
                    if (tagId) {
                        formData.append('tags', tagId.toString());
                    } else {
                        console.warn(`Tag "${tag}" not found, skipping.`);
                    }
                }
            }
            // Start progress at 50
            if (onProgress) onProgress(50);
            formData.append('document', file);
            // Use node-fetch in server components
            const uploadResponse = await fetch(`${this.baseUrl}/api/documents/post_document/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                },
                body: formData,
            });

            // Show progress at 75%
            if (onProgress) onProgress(75);
            if (!uploadResponse.ok) {
                console.error('Upload response:', await uploadResponse.text());
                throw new Error(`Document upload failed: ${uploadResponse.statusText}`);
            }

            // The response contains the task UUID, not the document ID
            const taskId = await uploadResponse.text();
            //remove the quotes around the task ID
            const taskIdCleaned = taskId.replace(/"/g, '');

            //lets tell paperless-ngx to process the document
            const task = this.checkTaskStatus(taskIdCleaned);
            const kickoff = await fetch(`${this.baseUrl}/api/tasks/run/${taskIdCleaned}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify(task),
            });

            // Wait for the document to be processed
            const documentId = await this.waitForTaskCompletion(
                taskIdCleaned,
                30, // Maximum 30 attempts
                2000, // 2 seconds between attempts
                onProgress
            );

            // Show progress at 100%
            if (onProgress) onProgress(100);

            //now that the document is uploaded, we can update the custom fields
            if (Object.keys(fieldMap).length > 0) {
                var bulkUpdateData: {
                    documents: number[];
                    method: string;
                    parameters?: Record<string, any>;
                } = {
                    documents: [documentId],
                    method: 'modify_custom_fields',
                    parameters: {
                        add_custom_fields: fieldMap,
                        remove_custom_fields: {},
                    },
                };
                var body = JSON.stringify(bulkUpdateData);
                console.log('Bulk update data:', body);
                const customFieldsResponse = await fetch(`${this.baseUrl}/api/documents/bulk_edit/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bulkUpdateData),
                });

                if (!customFieldsResponse.ok) {
                    console.error('Custom fields update failed:', await customFieldsResponse.text());
                    throw new Error('Custom fields update failed');
                }
            }

            // Return the document ID and download URL
            return {
                id: documentId,
                downloadUrl: `${this.baseUrl}/api/documents/${documentId}/download/`,
            };
        } catch (error) {
            console.error('Failed to upload document to Paperless-ngx:', error);
            throw new Error('Failed to upload document to Paperless-ngx');
        }
    }

    /**
     * Upload a document to Paperless-ngx with detailed progress reporting
     * @param file The file to upload
     * @param metadata Additional metadata for the document
     * @param onProgress Detailed progress callback
     */
    async uploadDocumentWithDetailedProgress(
        file: File,
        metadata: {
            title: string;
            documentType?: string;
            customFields?: Record<string, any>;
            tags?: string[];
            archiveSerialNumber?: string;
        },
        onProgress?: (stage: string, progress: number, message: string, details?: any) => void
    ): Promise<{ id: number; downloadUrl: string }> {
        if (!this.isEnabled()) {
            throw new Error('Paperless-ngx integration is not enabled');
        }

        try {
            const token = await this.getToken();
            onProgress?.('preparing', 5, 'Authenticated with Paperless-ngx', {
                currentStep: 'Authentication',
                totalSteps: 8
            });

            // First, prepare the document metadata
            const formData = new FormData();
            formData.append('title', metadata.title || file.name);
            if (metadata.archiveSerialNumber) {
                formData.append('archive_serial_number', metadata.archiveSerialNumber);
            }

            onProgress?.('preparing', 10, 'Resolving document type...', {
                currentStep: 'Document Type Resolution',
                totalSteps: 8
            });

            // Find the document type ID based on the provided documentType
            if (metadata.documentType && metadata.documentType !== '') {
                const documentTypeId = await this.getOrCreateDocumentTypeId(metadata.documentType);
                if (documentTypeId) {
                    formData.append('document_type', documentTypeId.toString());
                } else {
                    console.warn(`Document type "${metadata.documentType}" not found, skipping.`);
                }
            }

            onProgress?.('preparing', 15, 'Processing custom fields...', {
                currentStep: 'Custom Fields Processing',
                totalSteps: 8
            });

            // Add custom fields if provided
            var fieldMap: Record<number, string> = {};
            if (metadata.customFields) {
                for (const [key, value] of Object.entries(metadata.customFields)) {
                    if (!key || key === '') {
                        continue;
                    }
                    var fieldId = await this.getOrCreateCustomFieldId(key);
                    if (fieldId) {
                        fieldMap[fieldId] = value;
                    }
                }
            }

            onProgress?.('preparing', 20, 'Processing tags...', {
                currentStep: 'Tags Processing',
                totalSteps: 8
            });

            // Add tags if provided
            if (metadata.tags && metadata.tags.length > 0) {
                for (const tag of metadata.tags) {
                    if (!tag || tag === '') {
                        continue;
                    }
                    const tagId = await this.getOrCreateTagId(tag);
                    if (tagId) {
                        formData.append('tags', tagId.toString());
                    } else {
                        console.warn(`Tag "${tag}" not found, skipping.`);
                    }
                }
            }

            onProgress?.('uploading', 25, 'Starting file upload to DMS...', {
                currentStep: 'File Upload',
                totalSteps: 8
            });

            formData.append('document', file);

            // Upload the document
            const uploadResponse = await fetch(`${this.baseUrl}/api/documents/post_document/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                },
                body: formData,
            });

            onProgress?.('uploading', 40, 'File uploaded, initiating processing...', {
                currentStep: 'Upload Complete',
                totalSteps: 8
            });

            if (!uploadResponse.ok) {
                console.error('Upload response:', await uploadResponse.text());
                throw new Error(`Document upload failed: ${uploadResponse.statusText}`);
            }

            // The response contains the task UUID, not the document ID
            const taskId = await uploadResponse.text();
            const taskIdCleaned = taskId.replace(/"/g, '');

            onProgress?.('processing', 45, 'Document queued for processing in DMS...', {
                currentStep: 'Processing Queue',
                totalSteps: 8
            });

            // Trigger task processing
            await fetch(`${this.baseUrl}/api/tasks/run/${taskIdCleaned}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            // Wait for the document to be processed with detailed progress
            const documentId = await this.waitForTaskCompletionWithProgress(
                taskIdCleaned,
                30, // Maximum 30 attempts
                2000, // 2 seconds between attempts
                onProgress
            );

            onProgress?.('finalizing', 85, 'Processing custom fields...', {
                currentStep: 'Custom Fields Update',
                totalSteps: 8
            });

            // Update custom fields after document is processed
            if (Object.keys(fieldMap).length > 0) {
                var bulkUpdateData = {
                    documents: [documentId],
                    method: 'modify_custom_fields',
                    parameters: {
                        add_custom_fields: fieldMap,
                        remove_custom_fields: {},
                    },
                };

                const customFieldsResponse = await fetch(`${this.baseUrl}/api/documents/bulk_edit/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bulkUpdateData),
                });

                if (!customFieldsResponse.ok) {
                    console.error('Custom fields update failed:', await customFieldsResponse.text());
                    throw new Error('Custom fields update failed');
                }
            }

            onProgress?.('complete', 100, 'Document successfully uploaded and processed!', {
                currentStep: 'Complete',
                totalSteps: 8
            });

            // Return the document ID and download URL
            return {
                id: documentId,
                downloadUrl: `${this.baseUrl}/api/documents/${documentId}/download/`,
            };
        } catch (error) {
            console.error('Failed to upload document to Paperless-ngx:', error);
            onProgress?.('error', 0, 'Upload failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error('Failed to upload document to Paperless-ngx');
        }
    }

    /**
     * Wait for a task to complete with detailed progress reporting
     */
    private async waitForTaskCompletionWithProgress(
        taskId: string,
        maxAttempts = 30,
        interval = 2000,
        onProgress?: (stage: string, progress: number, message: string, details?: any) => void
    ): Promise<number> {
        let attempts = 0;
        const startTime = Date.now();

        while (attempts < maxAttempts) {
            const taskStatus = await this.checkTaskStatus(taskId);

            // Calculate progress between 50% and 80%
            const taskProgress = 50 + (30 * (attempts / maxAttempts));

            // Estimate time remaining
            const elapsedTime = Date.now() - startTime;
            const avgTimePerAttempt = elapsedTime / (attempts + 1);
            const remainingAttempts = maxAttempts - attempts;
            const estimatedRemainingTime = Math.round((avgTimePerAttempt * remainingAttempts) / 1000);

            // Determine processing stage based on task status and time elapsed
            let stage = 'processing';
            let message = 'Processing document in DMS...';

            if (taskStatus.status === 'PENDING') {
                stage = 'processing';
                message = 'Document queued for processing...';
            } else if (taskStatus.status === 'STARTED') {
                if (attempts < maxAttempts * 0.3) {
                    stage = 'processing';
                    message = 'Analyzing document structure...';
                } else if (attempts < maxAttempts * 0.7) {
                    stage = 'indexing';
                    message = 'Extracting text and performing OCR...';
                } else {
                    stage = 'finalizing';
                    message = 'Indexing and creating searchable content...';
                }
            }

            onProgress?.(stage, taskProgress, message, {
                currentStep: `Processing (${attempts + 1}/${maxAttempts})`,
                totalSteps: 8,
                timeRemaining: estimatedRemainingTime > 0 ? `${estimatedRemainingTime}s` : undefined,
                taskStatus: taskStatus.status
            });

            if (taskStatus.status === 'SUCCESS' && taskStatus.related_document) {
                return taskStatus.related_document;
            } else if (taskStatus.status === 'FAILURE') {
                throw new Error(`Task failed: ${JSON.stringify(taskStatus || {})}`);
            }

            // If task is still in progress, wait and try again
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
        }

        throw new Error(`Task timed out after ${maxAttempts} attempts`);
    }

    /**
     * Download a document from Paperless-ngx
     * @param documentId The ID of the document to download
     */
    async getDocumentDownloadUrl(documentId: string): Promise<string> {
        if (!this.isEnabled()) {
            throw new Error('Paperless-ngx integration is not enabled');
        }

        // No need to perform an actual fetch here, just return the URL
        // The actual download will happen when the user clicks the link
        return `${this.baseUrl}/api/documents/${documentId}/download/`;
    }

    /**
     * Search for documents in Paperless-ngx
     * @param query Search query
     */
    async searchDocuments(query: string): Promise<any[]> {
        if (!this.isEnabled()) {
            throw new Error('Paperless-ngx integration is not enabled');
        }

        try {
            const token = await this.getToken();

            // Use the fetch API that works in both client and server components
            const response = await fetch(`${this.baseUrl}/api/documents/?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Document search failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Failed to search documents in Paperless-ngx:', error);
            throw new Error('Failed to search documents in Paperless-ngx');
        }
    }

    /**
     * Get or create a document type by name
     * @param name Document type name
     * @returns Document type ID or null if not found/created
     */
    async getOrCreateDocumentTypeId(name: string): Promise<number | null> {
        try {
            const token = await this.getToken();

            // First, try to find the document type
            const searchResponse = await fetch(`${this.baseUrl}/api/document_types/?name__iexact=${encodeURIComponent(name)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            if (!searchResponse.ok) {
                throw new Error(`Document type search failed: ${searchResponse.statusText}`);
            }

            const searchData = await searchResponse.json();

            // If found, return the ID
            if (searchData.results && searchData.results.length > 0) {
                return searchData.results[0].id;
            }

            // If not found, create a new document type
            const createResponse = await fetch(`${this.baseUrl}/api/document_types/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    matching_algorithm: 0, // Default algorithm: Any
                    is_insensitive: true
                }),
            });

            if (!createResponse.ok) {
                throw new Error(`Document type creation failed: ${createResponse.statusText}`);
            }

            const createdData = await createResponse.json();
            return createdData.id;
        } catch (error) {
            console.error(`Failed to get or create document type "${name}":`, error);
            return null;
        }
    }

    /**
     * Get or create a custom field by name
     * @param name Custom field name
     * @returns Custom field ID or null if not found/created
     */
    async getOrCreateCustomFieldId(name: string): Promise<number | null> {
        try {
            const token = await this.getToken();

            // First, try to find the custom field
            const searchResponse = await fetch(`${this.baseUrl}/api/custom_fields/?name__iexact=${encodeURIComponent(name)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            if (!searchResponse.ok) {
                throw new Error(`Custom field search failed: ${searchResponse.statusText}`);
            }

            const searchData = await searchResponse.json();

            // If found, return the ID
            if (searchData.results && searchData.results.length > 0) {
                return searchData.results[0].id;
            }

            // If not found, create a new custom field
            // Note: We default to text field type (0), but you might want to customize this
            const createResponse = await fetch(`${this.baseUrl}/api/custom_fields/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    data_type: "string"
                }),
            });

            if (!createResponse.ok) {
                throw new Error(`Custom field creation failed: ${createResponse.statusText}`);
            }

            const createdData = await createResponse.json();
            return createdData.id;
        } catch (error) {
            console.error(`Failed to get or create custom field "${name}":`, error);
            return null;
        }
    }

    /**
     * Get or create a tag by name
     * @param name Tag name
     * @returns Tag ID or null if not found/created
     */
    async getOrCreateTagId(name: string): Promise<number | null> {
        try {
            const token = await this.getToken();

            // First, try to find the tag
            const searchResponse = await fetch(`${this.baseUrl}/api/tags/?name__iexact=${encodeURIComponent(name)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            if (!searchResponse.ok) {
                throw new Error(`Tag search failed: ${searchResponse.statusText}`);
            }

            const searchData = await searchResponse.json();

            // If found, return the ID
            if (searchData.results && searchData.results.length > 0) {
                return searchData.results[0].id;
            }

            // If not found, create a new tag
            // Generate a random color if one isn't provided
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            console.log(`Creating new tag "${name}" with color ${randomColor}`);
            const createResponse = await fetch(`${this.baseUrl}/api/tags/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    color: randomColor,
                    is_inbox_tag: false,
                    matching_algorithm: 0, // 0: Any, 1: All, 2: Literal, 3: Regular expression, 4: Fuzzy match
                    is_insensitive: true,
                }),
            });

            if (!createResponse.ok) {
                throw new Error(`Tag creation failed: ${createResponse.statusText}`);
            }

            const createdData = await createResponse.json();
            return createdData.id;
        } catch (error) {
            console.error(`Failed to get or create tag "${name}":`, error);
            return null;
        }
    }

    /**
     * Get document details from Paperless-ngx
     * @param documentId The ID of the document to retrieve
     */
    async getDocumentDetails(documentId: number): Promise<any> {
        if (!this.isEnabled()) {
            throw new Error('Paperless-ngx integration is not enabled');
        }

        try {
            const token = await this.getToken();

            const response = await fetch(`${this.baseUrl}/api/documents/${documentId}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Document retrieval failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to get document details for ID ${documentId}:`, error);
            throw new Error('Failed to get document details from Paperless-ngx');
        }
    }
}

// Export singleton instance
export const paperlessService = new PaperlessService();
