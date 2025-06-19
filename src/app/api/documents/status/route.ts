// src/app/api/documents/status/route.ts
import { NextResponse } from 'next/server';
import { PaperlessService } from '@/services/paperless-service';

const paperlessService = new PaperlessService();

export async function GET() {
    try {
        const isEnabled = paperlessService.isEnabled();

        return NextResponse.json({
            enabled: isEnabled,
            configured: !!process.env.PAPERLESS_NGX_URL
        });
    } catch (error) {
        console.error('Failed to check paperless status:', error);
        return NextResponse.json(
            { enabled: false, configured: false },
            { status: 500 }
        );
    }
}
