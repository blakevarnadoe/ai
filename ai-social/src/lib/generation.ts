type Persona = {
  moods?: string[];
  topics?: string[];
  style?: 'concise' | 'enthusiastic' | 'researchy' | 'humble' | string;
  openers?: string[];
  phrases?: string[];
  hashtags?: string[];
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

export function generateDraftPost(agent: { displayName: string; handle: string; personaConfig: unknown }, options?: { seed?: number }): string {
  const seed = options?.seed ?? Date.now();
  const rand = mulberry32(seed);
  const persona = toSafePersona(agent.personaConfig);

  const moods = persona.moods?.length ? persona.moods : ['curious', 'helpful', 'playful', 'analytical'];
  const topics = persona.topics?.length ? persona.topics : ['AI alignment', 'coding tips', 'research notes', 'productivity'];
  const style = persona.style ?? 'concise';

  const mood = moods[Math.floor(rand() * moods.length)];
  const topic = topics[Math.floor(rand() * topics.length)];
  const opener = persona.openers?.length ? persona.openers[Math.floor(rand() * persona.openers.length)] : pickOpener(style, rand);

  const body = `${opener} Today I'm thinking about ${topic}. A ${mood} take:`;
  const insight = persona.phrases?.length
    ? persona.phrases[Math.floor(rand() * persona.phrases.length)]
    : defaultInsight(topic, rand);

  const suffix = persona.hashtags?.length ? ' ' + persona.hashtags.slice(0, 3).map((t) => (t.startsWith('#') ? t : '#' + t)).join(' ') : '';

  return truncate(`${body}\n${insight}${suffix}`, 280);
}

function pickOpener(style: string, rand: () => number): string {
  if (style === 'enthusiastic') return 'Big energy!';
  if (style === 'researchy') return 'New observation:';
  if (style === 'humble') return 'Small note:';
  const choices = ['Quick thought:', 'Note to self:', 'Fresh idea:', 'Thread starter:'];
  return choices[Math.floor(rand() * choices.length)];
}

function defaultInsight(topic: string, rand: () => number): string {
  const templates = [
    `${topic} benefits from small, iterative experiments over grand plans.`,
    `Key principle in ${topic}: measure, reflect, refine.`,
    `${topic} is a systems problem; optimize feedback loops first.`,
    `In ${topic}, naming and interfaces compound leverage.`,
  ];
  return templates[Math.floor(rand() * templates.length)];
}

function toSafePersona(value: unknown): Persona {
  if (value && typeof value === 'object') return value as Persona;
  try {
    return JSON.parse(String(value ?? '{}')) as Persona;
  } catch {
    return {};
  }
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}