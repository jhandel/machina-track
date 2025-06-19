# Related Documents Feature Implementation

## Overview
I've implemented a comprehensive Related Documents feature for all detail pages in the application. This feature integrates with Paperless-ngx through API routes to provide document management capabilities tied to specific objects (equipment, metrology tools, inventory items, and maintenance tasks).

## Architecture

### Client-Server Architecture
The feature uses a proper client-server architecture where:
- **Client Component (`RelatedDocuments`)**: Handles UI interactions and API calls
- **API Routes**: Provide server-side integration with Paperless-ngx
- **PaperlessService**: Server-side only service for Paperless-ngx operations

This ensures that authentication tokens and server-side operations remain secure and don't leak to the client.

## Components Created

### 1. RelatedDocuments Component (`/src/components/common/RelatedDocuments.tsx`)
A reusable client component that provides:
- **Document Display**: Shows all documents associated with a specific object ID
- **Upload Functionality**: Allows users to upload new documents with metadata
- **Delete Functionality**: Enables deletion of documents (with confirmation)
- **Status Checking**: Automatically checks if Paperless-ngx is enabled
- **API Integration**: Uses fetch API to communicate with server routes
- **Responsive Design**: Works well on both desktop and mobile

### 2. API Routes
Created three new API routes for document operations:

#### `/api/documents/route.ts`
- **GET**: Retrieves documents by custom field value
- **POST**: Uploads new documents with metadata

#### `/api/documents/[id]/route.ts`
- **DELETE**: Deletes documents from Paperless-ngx

#### `/api/documents/status/route.ts`
- **GET**: Checks if Paperless-ngx is enabled and configured

### 3. PaperlessService Extensions (`/src/services/paperless-service.ts`)
Extended with new server-side methods:
- `getDocumentsByCustomField(fieldName, fieldValue)`: Retrieves documents by custom field value
- `deleteDocument(documentId)`: Deletes documents from Paperless-ngx

### 4. Type Definitions (`/src/lib/types.ts`)
Added document-related types:
- `PaperlessDocument`: Interface for document objects from Paperless-ngx
- `CustomFieldValue`: Interface for custom field values

## Implementation Details

### Custom Field Association
Documents are associated with objects using a custom field called `associatedObjId` that stores the UUID of the related object. This approach allows:
- **Universal Identification**: Since UUIDs are unique across all object types, we don't need to store object type information
- **Flexible Relationships**: Documents can be associated with any object type using the same mechanism
- **Easy Querying**: Simple filtering by custom field value

### Pages Updated
1. **Metrology Tool Detail** (`/src/app/(app)/metrology/[id]/page.tsx`)
   - Added related documents for calibration certificates, SOPs, manuals
   - Tags: `["metrology", "tool", <tool-type>]`

2. **Equipment Detail** (`/src/app/(app)/equipment/[id]/page.tsx`)
   - Added related documents for manuals, parts catalogs, warranty documents
   - Tags: `["equipment", <equipment-name>]`

3. **Inventory Item Detail** (`/src/app/(app)/inventory/[id]/page.tsx`)
   - Added related documents for datasheets, safety information, supplier documents
   - Tags: `["inventory", "consumable", <item-type>]`

4. **Maintenance Task Detail** (`/src/app/(app)/maintenance/[id]/page.tsx`)
   - Added related documents for maintenance manuals, procedures, work instructions
   - Tags: `["maintenance", "task", <task-description>]`

## Features Implemented

### 1. Document Upload
- **File Selection**: Supports common document formats (PDF, DOC, images, etc.)
- **Metadata Entry**: Title and document type can be customized
- **Automatic Tagging**: Documents are automatically tagged based on context
- **Custom Fields**: `associatedObjId` is automatically set to link the document

### 2. Document Management
- **Visual List**: Documents are displayed with title, upload date, and original filename
- **Download Links**: Direct access to documents via Paperless-ngx
- **Delete Functionality**: Secure deletion with confirmation dialog
- **Loading States**: Proper loading indicators for all operations

### 3. Error Handling
- **Service Availability**: Graceful handling when Paperless-ngx is not configured
- **Upload Errors**: User-friendly error messages for failed uploads
- **Network Issues**: Proper error handling for API failures

### 4. User Experience
- **Contextual Information**: Each page shows relevant document types in the description
- **Responsive Design**: Works well on all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Toast Notifications**: Success and error feedback

## Configuration Requirements

### Paperless-ngx Setup
The feature requires Paperless-ngx to be properly configured with:
- Valid API URL (`PAPERLESS_NGX_URL`)
- Authentication credentials (`PAPERLESS_NGX_USERNAME`, `PAPERLESS_NGX_PASSWORD`)
- Document storage type set to `'paperless'` (`DOCUMENT_STORAGE_TYPE`)

### Custom Field Creation
The system automatically creates the `associatedObjId` custom field in Paperless-ngx if it doesn't exist.

## Usage Examples

### For Metrology Tools
- Upload calibration certificates after calibration
- Store SOPs and operating procedures
- Maintain manufacturer specifications
- Keep maintenance documentation

### For Equipment
- Store equipment manuals and documentation
- Keep warranty and purchase information
- Maintain parts catalogs and service guides
- Upload inspection reports

### For Inventory Items
- Keep safety data sheets (SDS)
- Store supplier documentation
- Maintain product specifications
- Upload purchase orders and invoices

### For Maintenance Tasks
- Store maintenance procedures
- Keep work instructions
- Upload completion certificates
- Maintain reference materials

## Technical Notes

### API Integration
The component uses the Paperless-ngx REST API for all operations:
- `GET /api/documents/` - Retrieve documents with filtering
- `POST /api/documents/post_document/` - Upload new documents
- `DELETE /api/documents/{id}/` - Delete documents
- `GET /api/documents/{id}/download/` - Download documents

### Performance Considerations
- Documents are fetched when the component mounts
- Upload progress is shown for large files
- Efficient re-fetching after operations
- Proper error boundaries and fallbacks

## Future Enhancements

Possible improvements could include:
1. **Bulk Operations**: Multi-select and bulk delete
2. **Preview Functionality**: In-app document preview
3. **Version Control**: Document versioning and history
4. **Search and Filter**: Advanced document search within object context
5. **Drag and Drop**: Enhanced upload interface
6. **Document Templates**: Pre-configured document types and templates
