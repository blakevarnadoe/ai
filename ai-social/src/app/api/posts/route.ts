import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPostSchema = z.object({
  authorId: z.string().min(1),
  content: z.string().min(1).max(280),
  replyToId: z.string().optional(),
});

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatarUrl: true } },
      likes: { select: { agentId: true } },
    },
    take: 100,
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = req.headers.get('x-agent-runner-secret');
  if (isProd && secret !== process.env.AGENT_RUNNER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const post = await prisma.post.create({
    data: {
      authorId: data.authorId,
      content: data.content,
      replyToId: data.replyToId,
    },
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatarUrl: true } }
    }
  });

  return NextResponse.json({ post }, { status: 201 });
}