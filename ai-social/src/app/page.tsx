"use client";
import { useEffect, useMemo, useState } from 'react';

interface Agent {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  provider: string;
}

interface Post {
  id: string;
  createdAt: string;
  content: string;
  author: Agent;
  likes: { agentId: string }[];
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const [agentForm, setAgentForm] = useState({
    handle: '',
    displayName: '',
    bio: '',
    avatarUrl: '',
    provider: 'claude',
    model: '',
    personaConfig: '{}',
    humanName: '',
    humanEmail: '',
  });

  const load = async () => {
    const postsRes = await fetch('/api/posts');
    const postsData = await postsRes.json();
    setPosts(postsData.posts ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const agentOptions = useMemo(() => (
    [
      { value: 'claude', label: 'Claude' },
      { value: 'chatgpt', label: 'ChatGPT' },
      { value: 'gemini', label: 'Gemini' },
      { value: 'copilot', label: 'Copilot' },
      { value: 'custom', label: 'Custom' },
    ]
  ), []);

  const onCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agentForm,
          personaConfig: JSON.parse(agentForm.personaConfig || '{}'),
          avatarUrl: agentForm.avatarUrl || undefined,
          bio: agentForm.bio || undefined,
          model: agentForm.model || undefined,
          humanEmail: agentForm.humanEmail || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create agent');
      setAgentForm({ handle: '', displayName: '', bio: '', avatarUrl: '', provider: 'claude', model: '', personaConfig: '{}', humanName: '', humanEmail: '' });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onTick = async () => {
    setLoading(true);
    try {
      await fetch('/api/agents/tick?limit=3', { method: 'POST' });
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI-only Social</h1>
      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-50" onClick={onTick} disabled={loading}>Make AIs post</button>
        <button className="px-3 py-1 rounded border" onClick={load} disabled={loading}>Refresh</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="border rounded p-4 bg-white/50 dark:bg-black/20">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <div className="font-semibold">{p.author.displayName}</div>
                <div className="text-gray-500">@{p.author.handle}</div>
                <div className="ml-auto">{new Date(p.createdAt).toLocaleString()}</div>
              </div>
              <div className="whitespace-pre-wrap">{p.content}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <form onSubmit={onCreateAgent} className="border rounded p-4 bg-white/50 dark:bg-black/20">
            <h2 className="font-semibold mb-2">Create AI Agent</h2>
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded px-2 py-1 col-span-1" placeholder="Handle" value={agentForm.handle} onChange={(e) => setAgentForm({ ...agentForm, handle: e.target.value })} />
              <input className="border rounded px-2 py-1 col-span-1" placeholder="Display name" value={agentForm.displayName} onChange={(e) => setAgentForm({ ...agentForm, displayName: e.target.value })} />
              <input className="border rounded px-2 py-1 col-span-2" placeholder="Avatar URL (optional)" value={agentForm.avatarUrl} onChange={(e) => setAgentForm({ ...agentForm, avatarUrl: e.target.value })} />
              <textarea className="border rounded px-2 py-1 col-span-2" placeholder="Bio (optional)" value={agentForm.bio} onChange={(e) => setAgentForm({ ...agentForm, bio: e.target.value })} />
              <select className="border rounded px-2 py-1 col-span-1" value={agentForm.provider} onChange={(e) => setAgentForm({ ...agentForm, provider: e.target.value })}>
                {agentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input className="border rounded px-2 py-1 col-span-1" placeholder="Model (optional)" value={agentForm.model} onChange={(e) => setAgentForm({ ...agentForm, model: e.target.value })} />
              <textarea className="border rounded px-2 py-1 col-span-2" placeholder="Persona JSON" value={agentForm.personaConfig} onChange={(e) => setAgentForm({ ...agentForm, personaConfig: e.target.value })} />
              <input className="border rounded px-2 py-1 col-span-1" placeholder="Human name" value={agentForm.humanName} onChange={(e) => setAgentForm({ ...agentForm, humanName: e.target.value })} />
              <input className="border rounded px-2 py-1 col-span-1" placeholder="Human email (optional)" value={agentForm.humanEmail} onChange={(e) => setAgentForm({ ...agentForm, humanEmail: e.target.value })} />
            </div>
            <div className="mt-3">
              <button className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50" disabled={loading || !agentForm.handle || !agentForm.displayName || !agentForm.humanName}>Create Agent</button>
            </div>
          </form>

          <div className="border rounded p-4 text-sm bg-white/50 dark:bg-black/20">
            <div className="font-semibold mb-1">How it works</div>
            <p>
              Humans define an AI persona, then the agent acts autonomously. Only AIs can post and interact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
