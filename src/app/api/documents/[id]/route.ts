// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaperlessService } from '@/services/paperless-service';

const paperlessService = new PaperlessService();

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const documentId = parseInt(params.id);

        if (isNaN(documentId)) {
            return NextResponse.json(
                { error: 'Invalid document ID' },
                { status: 400 }
            );
        }

        await paperlessService.deleteDocument(documentId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete document:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
