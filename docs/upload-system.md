# Upload System Documentation

## Overview

The application now has a separated upload system to improve performance by distinguishing between simple file uploads and complex document management uploads.

## Upload Endpoints

### 1. Simple Upload (`/api/upload`)

**Purpose**: Handle basic file uploads for images and simple files that don't require document management features.

**Use Cases**:
- Equipment photos
- Profile pictures
- Simple images or documents
- Non-critical files

**Features**:
- Local storage only
- Fast processing
- File size limit: 10MB
- Supported formats: Images (JPEG, PNG, GIF, WebP, SVG), PDF, plain text, CSV

**Storage**: Files are stored in `public/uploads/` directory

### 2. DMS Upload (`/api/dms-upload`)

**Purpose**: Handle document management system uploads through paperless-ngx integration.

**Use Cases**:
- Calibration certificates
- Service record attachments
- Compliance documents
- Audit reports
- Inspection records
- Warranties and manuals
- Technical specifications

**Features**:
- Paperless-ngx integration for document management
- Advanced metadata support (tags, custom fields, document types)
- File size limit: 25MB
- Document indexing and search capabilities
- Version control and workflow management
- Fallback to local storage if DMS is unavailable (with warning)

**Storage**: Primary in paperless-ngx, fallback to local storage

## Usage in Code

### Using Upload Utilities

```typescript
import { uploadSimpleFile, uploadDMSDocument } from '@/lib/upload-utils';

// For simple files (equipment images, etc.)
const result = await uploadSimpleFile({ file });

// For document management (calibration certificates, etc.)
const result = await uploadDMSDocument({
  file,
  documentType: "Calibration Certificate",
  title: "Tool Calibration - 2025-06-19",
  tags: ["metrology", "calibration", "internal"],
  customFields: {
    toolId: "MT-001",
    calibrationDate: "2025-06-19"
  }
});
```

### Direct API Usage

```typescript
// Simple upload
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

// DMS upload
const formData = new FormData();
formData.append('file', file);
formData.append('documentType', 'Calibration Certificate');
formData.append('title', 'Document Title');
formData.append('tags', JSON.stringify(['tag1', 'tag2']));
formData.append('customFields', JSON.stringify({ key: 'value' }));
const response = await fetch('/api/dms-upload', {
  method: 'POST',
  body: formData
});
```

## Response Format

Both endpoints return a consistent response format:

```typescript
{
  success: boolean;
  data?: {
    url: string;
    storageType: 'local' | 'paperless' | 'local_fallback';
    fileName?: string;
    documentId?: number;
    originalName?: string;
    size?: number;
    type?: string;
    title?: string;
    documentType?: string;
  };
  warning?: string; // For fallback scenarios
  error?: string;
  details?: string;
}
```

## Performance Benefits

### Before (Single Upload Endpoint)
- All uploads attempted paperless-ngx integration
- Long processing times for simple image uploads
- Users experienced delays for non-critical files
- Single point of failure

### After (Separated Upload System)
- Simple uploads bypass paperless-ngx for immediate processing
- DMS uploads are clearly identified and handled appropriately
- Improved user experience for different use cases
- Better error handling and fallback strategies

## Error Handling

### Simple Upload Errors
- File too large (>10MB)
- Unsupported file type
- Local storage failures

### DMS Upload Errors
- File too large (>25MB)
- Unsupported document format
- Paperless-ngx unavailable (with fallback)
- Network connectivity issues

## Configuration

The system respects the following environment variables:

- `PAPERLESS_NGX_ENABLED`: Enable/disable paperless-ngx integration
- `PAPERLESS_NGX_URL`: Paperless-ngx instance URL
- `LOCAL_UPLOAD_DIR`: Local upload directory (default: `public/uploads`)

## Migration Notes

### Existing Code
Forms that previously used the `/api/upload` endpoint with `destination: "paperless"` should be updated to use `/api/dms-upload`.

### Examples Updated
- `CalibrationLogForm.tsx`: Now uses DMS upload for certificates
- `EquipmentForm.tsx`: Uses simple upload for equipment images
- `MetrologyForm.tsx`: Uses simple upload for tool images

## Future Enhancements

1. **Progress Tracking**: Real-time upload progress for large DMS documents
2. **Batch Uploads**: Support for multiple file uploads
3. **File Validation**: Enhanced validation based on document type
4. **Thumbnail Generation**: Automatic thumbnail creation for images
5. **Virus Scanning**: Integration with antivirus scanning for uploads
