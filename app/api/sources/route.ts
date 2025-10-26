import { NextResponse } from 'next/server';

import { fetchCarArticles } from '@/lib/fetchCarFeeds';

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const articles = await fetchCarArticles(limit && Number.isFinite(limit) ? Math.max(1, Math.min(limit, 20)) : 8);

  return NextResponse.json({ articles });
}
