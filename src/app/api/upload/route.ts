import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';
import {
  DOCUMENT_STORAGE_TYPE,
  LOCAL_UPLOAD_DIR,
  PAPERLESS_NGX_ENABLED,
  PAPERLESS_NGX_URL,
  PAPERLESS_NGX_USERNAME,
  PAPERLESS_NGX_PASSWORD,
  PAPERLESS_CALIBRATION_TAG_ID
} from '@/lib/config';
import { PaperlessService } from '@/services';
import { json } from 'stream/consumers';

// Determine the upload directory
const UPLOAD_DIR = join(process.cwd(), LOCAL_UPLOAD_DIR || 'public/uploads');

// Ensure the upload directory exists for local storage
if (DOCUMENT_STORAGE_TYPE === 'local' && !existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Get optional metadata
    const destination = formData.get('destination') as string || 'local';
    const documentType = formData.get('documentType') as string || undefined;
    const title = formData.get('title') as string || file.name;
    const tags = formData.get('tags') as string || '';
    const customFields = JSON.parse(formData.get('customFields') as string) || {};

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Handle upload based on storage type
    if (destination === 'paperless' && PAPERLESS_NGX_ENABLED) {
      // Use Paperless-ngx for storage
      try {
        console.log('Using Paperless-ngx for document storage');
        console.log('Paperless URL:', PAPERLESS_NGX_URL);
        console.log('Document Type:', documentType);
        console.log('Title:', title);

        // Create a new instance of PaperlessService for this request
        const paperlessService = new PaperlessService();

        // Check if Paperless is enabled
        if (!paperlessService.isEnabled()) {
          console.log('Paperless is not enabled according to the service');
          throw new Error('Paperless-ngx integration is not enabled');
        }

        console.log('Uploading document to Paperless-ngx...');
        const result = await paperlessService.uploadDocument(
          file,
          {
            title,
            documentType,
            tags: JSON.parse(tags || '[]'),
            customFields: customFields ? customFields : {},
          }
        );

        console.log('Document uploaded successfully:', result);

        return NextResponse.json({
          success: true,
          data: {
            url: result.downloadUrl,
            documentId: result.id,
            storageType: 'paperless',
          }
        });
      } catch (error) {
        console.error('Paperless-ngx upload failed:', error);
        // Fallback to local storage in case of Paperless-ngx failure
        console.log('Falling back to local storage after Paperless-ngx failure');

        // Create a unique filename
        const fileExtension = file.name.split('.').pop() || 'unknown';
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = join(UPLOAD_DIR, fileName);

        try {
          // Ensure upload directory exists
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }

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
              storageType: 'local',
              note: 'Paperless-ngx upload failed, using local storage as fallback'
            }
          });
        } catch (fallbackError) {
          console.error('Even local fallback storage failed:', fallbackError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to upload to Paperless-ngx and local fallback also failed',
              details: error instanceof Error ? error.message : 'Unknown error',
              fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'
            },
            { status: 500 }
          );
        }
      }
    } else {
      // Use local file storage (default)
      // Create a unique filename
      const fileExtension = file.name.split('.').pop() || 'unknown';
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(UPLOAD_DIR, fileName);

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
          storageType: 'local'
        }
      });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
