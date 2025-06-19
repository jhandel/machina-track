/**
 * Document URL utilities
 * Helper functions for handling document URLs from different storage backends
 */

import { DOCUMENT_STORAGE_TYPE, APP_URL, PAPERLESS_NGX_URL } from './config';

/**
 * Resolves a document URL to a fully qualified URL
 * @param url The URL to resolve (can be local path or Paperless-ngx URL)
 * @returns The fully resolved URL
 */
export function resolveDocumentUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // If it's already a fully qualified URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a Paperless-ngx URL without the full prefix
  if (
    DOCUMENT_STORAGE_TYPE === 'paperless' && 
    url.startsWith('/api/documents/')
  ) {
    return `${PAPERLESS_NGX_URL}${url}`;
  }

  // For local URLs, prepend the app URL if they start with a slash
  if (url.startsWith('/')) {
    return `${APP_URL}${url}`;
  }

  // Return the original URL if we can't determine how to resolve it
  return url;
}

/**
 * Extracts a document ID from a Paperless-ngx URL
 * @param url The Paperless-ngx URL
 * @returns The document ID or null if not found
 */
export function extractPaperlessDocumentId(url: string | undefined | null): string | null {
  if (!url) return null;
  
  // Check if it's a Paperless-ngx URL
  const downloadPattern = /\/api\/documents\/(\d+)\/download\/?/;
  const downloadMatch = url.match(downloadPattern);
  if (downloadMatch && downloadMatch[1]) {
    return downloadMatch[1];
  }
  
  // Check for direct document URL pattern
  const documentPattern = /\/api\/documents\/(\d+)\/?/;
  const documentMatch = url.match(documentPattern);
  if (documentMatch && documentMatch[1]) {
    return documentMatch[1];
  }
  
  return null;
}
