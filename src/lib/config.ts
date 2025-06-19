/**
 * Environment configuration for the application
 */

// Core application config
export const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/machina-track.db';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

// Paperless-ngx integration config
export const PAPERLESS_NGX_URL = process.env.PAPERLESS_NGX_URL || '';
export const PAPERLESS_NGX_USERNAME = process.env.PAPERLESS_NGX_USERNAME || '';
export const PAPERLESS_NGX_PASSWORD = process.env.PAPERLESS_NGX_PASSWORD || '';
export const PAPERLESS_NGX_ENABLED = !!PAPERLESS_NGX_URL && !!PAPERLESS_NGX_USERNAME && !!PAPERLESS_NGX_PASSWORD;

// Document management configuration
export const DOCUMENT_STORAGE_TYPE = process.env.DOCUMENT_STORAGE_TYPE || 'local'; // 'local' or 'paperless'
export const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || 'public/uploads';

// Debug configuration
export const DEBUG_API = process.env.DEBUG_API === 'true' || process.env.NODE_ENV === 'development';

// Paperless-ngx tag and correspondent IDs for different document types
export const PAPERLESS_CALIBRATION_TAG_ID = process.env.PAPERLESS_CALIBRATION_TAG_ID || '';
