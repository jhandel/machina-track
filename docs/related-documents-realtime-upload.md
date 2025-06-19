# Related Documents with Real-time Upload

## Overview

The Related Documents feature has been enhanced with real-time upload progress tracking, providing users with detailed feedback during document uploads to the Paperless-ngx DMS.

## Features

### Real-time Upload Progress
- **Live Progress Bar**: Shows upload progress from 0-100%
- **Stage-based Messages**: Displays different messages for each upload stage:
  - **Preparing**: Authentication, document type resolution, custom fields processing, tags processing
  - **Uploading**: File upload to DMS
  - **Processing**: Document queued for processing, analyzing document structure
  - **Indexing**: Extracting text and performing OCR
  - **Finalizing**: Indexing and creating searchable content, custom fields update
  - **Complete**: Upload completed successfully

### Interactive Upload Controls
- **Cancel Upload**: Users can cancel uploads in progress
- **Retry Failed Uploads**: Automatic retry option for failed uploads
- **Time Estimation**: Shows estimated time remaining during processing

### Enhanced User Experience
- **Detailed Progress Messages**: Context-aware messages explaining what's happening
- **Visual Feedback**: Progress bar with stage-specific colors and icons
- **Error Handling**: Clear error messages with retry options

## Technical Implementation

### Architecture
```
Client Component (RelatedDocuments) 
    ↓ uses
useRealtimeUpload Hook
    ↓ calls
/api/documents (with SSE support)
    ↓ uses
PaperlessService.uploadDocumentWithDetailedProgress()
```

### API Enhancement
The `/api/documents` endpoint now supports Server-Sent Events (SSE) for real-time progress:

```typescript
// Client request with SSE flag
formData.append('useSSE', 'true');

// Server streams progress updates
const stream = new ReadableStream({
    start(controller) {
        const onProgress = (stage, progress, message, details) => {
            const data = JSON.stringify({ stage, progress, message, details });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };
        // ... upload with progress callback
    }
});
```

### Real-time Hook
The `useRealtimeUpload` hook manages the upload lifecycle:

```typescript
const {
    status,           // Current upload status
    isUploading,      // Boolean upload state
    startUpload,      // Function to start upload
    cancelUpload,     // Function to cancel upload
    error,            // Error message if any
    result            // Upload result when complete
} = useRealtimeUpload();
```

### Progress Stages

1. **Preparing (0-25%)**: 
   - Authentication with Paperless-ngx
   - Document type resolution
   - Custom fields processing
   - Tags processing

2. **Uploading (25-40%)**:
   - File upload to DMS
   - Upload completion

3. **Processing (40-80%)**:
   - Document queued for processing
   - Document structure analysis
   - Text extraction and OCR
   - Content indexing

4. **Finalizing (80-100%)**:
   - Custom fields update
   - Final processing completion

## Usage

### Component Integration
```tsx
import { RelatedDocuments } from '@/components/common/RelatedDocuments';

<RelatedDocuments
  objectId="equipment-123"
  title="Equipment Documents"
  description="Documents related to this equipment"
  defaultDocumentType="Equipment Manual"
  additionalTags={["equipment", "manual"]}
/>
```

### Upload Progress Display
The component automatically shows the upload progress when a file is being uploaded:

- Progress bar with percentage
- Current stage and message
- Cancel/retry buttons as appropriate
- Time estimation for longer uploads

### Error Handling
- Network errors are displayed with retry options
- Validation errors show specific field issues
- Timeout errors include suggested actions

## Benefits

1. **Improved User Experience**: Users can see exactly what's happening during uploads
2. **Better Error Recovery**: Clear error messages and retry functionality
3. **Upload Management**: Ability to cancel long-running uploads
4. **Transparency**: Detailed progress information builds user confidence
5. **Performance Awareness**: Time estimates help users plan their workflow

## Configuration

The real-time upload feature works with the existing Paperless-ngx configuration:

```typescript
// Environment variables
PAPERLESS_NGX_URL=https://your-paperless-instance.com
PAPERLESS_NGX_USERNAME=your-username
PAPERLESS_NGX_PASSWORD=your-password
PAPERLESS_NGX_ENABLED=true
DOCUMENT_STORAGE_TYPE=paperless
```

## Future Enhancements

1. **Bulk Upload**: Support for multiple file uploads with aggregated progress
2. **Upload Queue**: Queue management for multiple simultaneous uploads
3. **Background Uploads**: Continue uploads when navigating away from the page
4. **Pause/Resume**: Ability to pause and resume large file uploads
5. **Progress Persistence**: Maintain progress state across page refreshes
