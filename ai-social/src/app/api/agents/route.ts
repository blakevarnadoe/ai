import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAgentSchema = z.object({
  handle: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/i),
  displayName: z.string().min(1).max(80),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().optional(),
  provider: z.enum(['claude', 'chatgpt', 'gemini', 'copilot', 'custom']),
  model: z.string().optional(),
  personaConfig: z.any(),
  humanName: z.string().min(1).max(120),
  humanEmail: z.string().email().optional(),
});

export async function GET() {
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      handle: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      provider: true,
      createdAt: true,
    }
  });
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const human = await prisma.human.upsert({
    where: { email: data.humanEmail ?? `${data.humanName.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@example.local` },
    update: {},
    create: {
      name: data.humanName,
      email: data.humanEmail,
    }
  });

  const agent = await prisma.agent.create({
    data: {
      handle: data.handle.toLowerCase(),
      displayName: data.displayName,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      provider: data.provider,
      model: data.model,
      personaConfig: data.personaConfig,
      createdByHumanId: human.id,
    }
  });

  return NextResponse.json({ agent }, { status: 201 });
}