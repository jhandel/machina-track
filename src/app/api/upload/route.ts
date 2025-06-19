import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';
import { LOCAL_UPLOAD_DIR } from '@/lib/config';

// Determine the upload directory
const UPLOAD_DIR = join(process.cwd(), LOCAL_UPLOAD_DIR || 'public/uploads');

// Ensure the upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Simple Upload endpoint - Handles basic file uploads for images and simple files
 * This endpoint is for files that don't need document management features
 * such as equipment photos, profile pictures, etc.
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

    // Validate file size (max 10MB for simple uploads)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // For simple uploads, we primarily expect images but allow some common file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf', // Allow PDF for simple documents
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${file.type}. Please use common image formats, PDF, or text files.`
        },
        { status: 400 }
      );
    }

    // Create a unique filename
    const fileExtension = file.name.split('.').pop() || 'unknown';
    const fileName = `${uuidv4()}.${fileExtension}`;
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
          storageType: 'local',
          fileName: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type
        }
      });
    } catch (saveError) {
      console.error('Failed to save file:', saveError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save uploaded file',
          details: saveError instanceof Error ? saveError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process file upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
