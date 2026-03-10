import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db/client';
import { searches } from '@/lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const rows = await db.select().from(searches).where(eq(searches.id, id)).limit(1);
    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Search ${id} not found or has expired`, statusCode: 404 },
        { status: 404 },
      );
    }
    return NextResponse.json(row.results, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: `Search ${id} not found or has expired`, statusCode: 404 },
      { status: 404 },
    );
  }
}
