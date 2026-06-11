"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Brain, MessageSquare, LayoutGrid,
  ChevronRight, Sparkles,
  Globe, Trash2, Settings, BookOpen,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  subject: string;
  level: string;
  domain: string;
  avatarUrl: string | null;
  isPublished: boolean;
  description: string | null;
  _count: { conversations: number };
  knowledgeFiles: { id: string; name: string }[];
}

const DOMAIN_LABELS: Record<string, string> = {
  education: "Education", research: "Research", business: "Business", general: "General",
};

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents", icon: Brain },
  { label: "Marketplace", href: "/agents/marketplace", icon: Globe },
  { label: "Workspace", href: "/agents/workspace", icon: LayoutGrid },
];

function AgentAvatar({ agent, size = 48 }: { agent: Agent; size?: number }) {
  const colors = ["from-amber-400 to-orange-500", "from-emerald-400 to-teal-500", "from-violet-400 to-purple-500", "from-blue-400 to-indigo-500", "from-rose-400 to-pink-500"];
  const color = colors[agent.name.charCodeAt(0) % colors.length];
  if (agent.avatarUrl) return <img src={agent.avatarUrl} alt={agent.name} style={{ width: size, height: size }} className="rounded-full object-cover" />;
  return (
    <div style={{ width: size, height: size }} className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold font-manrope", color)}>
      {agent.name[0]?.toUpperCase()}
    </div>
  );
}

function AgentCard({ agent, index, onDelete }: { agent: Agent; index: number; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${agent.name}"?`)) return;
    setDeleting(true);
    await fetch(`/api/custom-agents/${agent.id}`, { method: "DELETE" });
    onDelete(agent.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => router.push(`/agents/${agent.id}/chat`)}
      style={{ "--shimmer-delay": `${index * 0.8}s` } as React.CSSProperties}
      className="glow-border elevated-surface rounded-2xl p-5 hover:shadow-elevation-lg hover:border-outline-variant/40 transition-all cursor-pointer group relative hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-4">
        <AgentAvatar agent={agent} size={44} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); router.push(`/agents/${agent.id}/settings`); }} className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
            <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button onClick={handleDelete} disabled={deleting} className="w-7 h-7 rounded-lg bg-surface-container hover:bg-error/10 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors">
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold font-manrope text-on-surface text-[15px] leading-tight">{agent.name}</h3>
          {agent.isPublished && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container font-medium">Published</span>}
        </div>
        <p className="text-[12px] text-on-surface-variant leading-relaxed line-clamp-2">
          {agent.description || agent.subject}
        </p>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {agent._count.conversations} chats
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {agent.knowledgeFiles.length} files
        </span>
        <span className="ml-auto text-[10px] font-medium text-on-surface-variant/60 uppercase tracking-wide">{DOMAIN_LABELS[agent.domain] || agent.domain}</span>
      </div>

      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-[11px] font-medium text-secondary">
          Chat <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </motion.div>
  );
}

function CreateAgentDialog({ onClose: _onClose, onCreate }: { onClose: () => void; onCreate: (a: Agent) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [level, setLevel] = useState("");
  const [tone, setTone] = useState("patient");
  const [domain, setDomain] = useState("education");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const SUBJECTS = ["Biology","Chemistry","Physics","Mathematics","History","Literature","Economics","Psychology","Computer Science","Philosophy","Law","Medicine","Engineering","Business","Other"];
  const LEVELS = ["High School","Undergraduate","Graduate","Self-study","Professional"];
  const TONES = [
    { value: "patient", label: "Patient & thorough" },
    { value: "concise", label: "Concise & direct" },
    { value: "socratic", label: "Socratic" },
    { value: "friendly", label: "Friendly & warm" },
    { value: "strict", label: "Strict & rigorous" },
    { value: "motivational", label: "Motivational" },
  ];
  const DOMAINS = [
    { value: "education", label: "Education" },
    { value: "research", label: "Research" },
    { value: "business", label: "Business" },
    { value: "general", label: "General" },
  ];

  const resolvedSubject = subject === "Other" ? customSubject : subject;

  const handleCreate = async () => {
    if (!resolvedSubject.trim() || !name.trim() || !level) return;
    setCreating(true);
    try {
      const res = await fetch("/api/custom-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject: resolvedSubject, level, tone, domain, description }),
      });
      if (!res.ok) { const e = await res.json(); alert(e.error || "Failed"); return; }
      const agent = await res.json();
      onCreate(agent);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="elevated-surface-strong rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold font-manrope text-lg text-on-surface">Create Agent</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Step {step} of 3</p>
          </div>
          <div className="flex gap-1">
            {[1,2,3].map(s => <div key={s} className={cn("h-1.5 w-8 rounded-full transition-colors", s <= step ? "bg-secondary" : "bg-outline-variant/30")} />)}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-on-surface">What subject will this agent specialise in?</p>
            <div className="grid grid-cols-3 gap-2">
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => setSubject(s)} className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all", subject === s ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container" : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high")}>
                  {s}
                </button>
              ))}
            </div>
            {subject === "Other" && (
              <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Enter subject…" className="input-field" />
            )}
            <button onClick={() => setStep(2)} disabled={!resolvedSubject.trim()} className="btn-primary w-full">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-on-surface block mb-2">Agent name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Professor Ada" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface block mb-2">Level</label>
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map(l => (
                  <button key={l} onClick={() => setLevel(l)} className={cn("px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all text-left", level === l ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container" : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep(3)} disabled={!name.trim() || !level} className="btn-primary flex-1">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-on-surface block mb-2">Communication style</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button key={t.value} onClick={() => setTone(t.value)} className={cn("px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all text-left", tone === t.value ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container" : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high")}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface block mb-2">Domain</label>
              <div className="grid grid-cols-2 gap-2">
                {DOMAINS.map(d => (
                  <button key={d.value} onClick={() => setDomain(d.value)} className={cn("px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all text-left", domain === d.value ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container" : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high")}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-on-surface block mb-2">Brief description (optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this agent specialise in?" rows={2} className="input-field resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
                {creating ? "Creating…" : "Create Agent"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function AgentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/custom-agents").then(r => r.json()).then(data => { setAgents(Array.isArray(data) ? data : []); setLoading(false); });
  }, [status]);

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        {/* Sub-navigation */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.href === "/agents";
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all", active ? "bg-secondary-container/60 text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface")}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg font-bold font-manrope text-on-surface">Mentra Agents</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Build AI agents that know your stacks, flows, and articles</p>
          </div>
          <motion.button onClick={() => setShowCreate(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary">
            <Plus className="h-4 w-4" /> New Agent
          </motion.button>
        </div>

        {/* Stats bar */}
        {!loading && agents.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: "Agents", value: agents.length, icon: Brain },
              { label: "Chats", value: agents.reduce((a, b) => a + b._count.conversations, 0), icon: MessageSquare },
              { label: "Files", value: agents.reduce((a, b) => a + b.knowledgeFiles.length, 0), icon: BookOpen },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="elevated-surface rounded-xl px-3 py-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-secondary-container/40 flex items-center justify-center shrink-0">
                  <s.icon className="h-3.5 w-3.5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-on-surface-variant truncate">{s.label}</p>
                  <p className="text-sm font-bold font-manrope text-on-surface">{s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Agents grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="elevated-surface rounded-2xl p-5 h-40">
                <div className="shimmer rounded-full w-11 h-11 mb-4" />
                <div className="shimmer rounded-lg h-4 w-2/3 mb-2" />
                <div className="shimmer rounded-lg h-3 w-full" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-secondary-container/30 flex items-center justify-center mx-auto mb-5">
              <Brain className="h-10 w-10 text-secondary" />
            </div>
            <h2 className="text-xl font-bold font-manrope text-on-surface mb-2">No agents yet</h2>
            <p className="text-sm text-on-surface-variant mb-6 max-w-xs mx-auto">Create your first AI agent. It will have full access to your stacks, flows, and articles.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Sparkles className="h-4 w-4" /> Create your first agent
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <AgentCard key={agent.id} agent={agent} index={i} onDelete={id => setAgents(prev => prev.filter(a => a.id !== id))} />
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: agents.length * 0.06 }}
              onClick={() => setShowCreate(true)}
              className="elevated-surface rounded-2xl p-5 border-2 border-dashed border-outline-variant/30 hover:border-secondary/40 hover:bg-secondary-container/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[160px] group">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/30 group-hover:bg-secondary-container/50 flex items-center justify-center transition-colors">
                <Plus className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-sm font-medium text-on-surface-variant">New Agent</p>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateAgentDialog onClose={() => setShowCreate(false)} onCreate={agent => { setAgents(prev => [agent, ...prev]); setShowCreate(false); }} />}
      </AnimatePresence>
    </div>
  );
}
