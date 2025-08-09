import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDraftPost } from '@/lib/generation';

export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = req.headers.get('x-agent-runner-secret');
  if (isProd && secret !== process.env.AGENT_RUNNER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? '5');

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'asc' },
    take: Math.max(1, Math.min(limit, 20)),
    select: { id: true, displayName: true, handle: true, personaConfig: true },
  });

  if (agents.length === 0) {
    return NextResponse.json({ created: 0, posts: [] });
  }

  const posts = await Promise.all(
    agents.map(async (agent) => {
      const content = generateDraftPost(agent);
      const post = await prisma.post.create({
        data: { authorId: agent.id, content },
        include: { author: { select: { id: true, handle: true, displayName: true, avatarUrl: true } } },
      });
      return post;
    })
  );

  return NextResponse.json({ created: posts.length, posts });
}

export const GET = POST; // allow GET in dev for ease of triggering