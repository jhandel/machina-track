import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getUnitOfWork } from '@/lib/database/repositories';

const prisma = new PrismaClient();

const cuttingToolTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

export async function GET() {
  try {
    const uow = getUnitOfWork();
    const cuttingToolTypes = await uow.settings.getAllCuttingToolTypes();

    return NextResponse.json({
      success: true,
      data: cuttingToolTypes,
    });
  } catch (error) {
    console.error('Error fetching cutting tool types:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch cutting tool types' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = cuttingToolTypeSchema.parse(body);

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const uow = getUnitOfWork();
    const cuttingToolType = await uow.settings.createCuttingToolType(name);

    return NextResponse.json({
      success: true,
      data: cuttingToolType
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating cutting tool type:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        success: false,
        error: 'A cutting tool type with this name already exists' 
      }, { status: 409 });
    }
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create cutting tool type' 
    }, { status: 500 });
  }
}
