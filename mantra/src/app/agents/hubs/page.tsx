"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Users, Globe, Lock, Search, Loader2, X, Brain, ArrowRight, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents" },
  { label: "Knowledge Hubs", href: "/agents/hubs" },
  { label: "Projects", href: "/agents/projects" },
  { label: "Workspace", href: "/agents/workspace" },
  { label: "Schedule", href: "/agents/schedule" },
];

interface Hub {
  id: string; slug: string; title: string; description: string | null; domain: string;
  isPublic: boolean; accessCost: number;
  creator: { name: string; username: string; image: string | null };
  stacks: { stack: { id: string; title: string; slug: string; banner: string | null } }[];
  _count: { members: number; stacks: number };
}

const DOMAIN_LABELS: Record<string, string> = { general: "General", education: "Education", research: "Research", business: "Business", science: "Science", arts: "Arts" };

function HubCard({ hub, index, isMine }: { hub: Hub; index: number; isMine?: boolean }) {
  const router = useRouter();
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => router.push(`/agents/hubs/${hub.id}`)}
      style={{ "--shimmer-delay": `${index * 0.7}s` } as React.CSSProperties}
      className="glow-border elevated-surface rounded-2xl p-5 hover:shadow-elevation-lg transition-all cursor-pointer hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-on-secondary-container" />
        </div>
        <div className="flex items-center gap-1.5">
          {hub.isPublic ? <Globe className="h-3.5 w-3.5 text-on-surface-variant" /> : <Lock className="h-3.5 w-3.5 text-on-surface-variant" />}
          {hub.accessCost > 0 && <span className="text-[11px] bg-secondary-container/50 text-on-secondary-container px-2 py-0.5 rounded-full">{hub.accessCost} credits</span>}
        </div>
      </div>
      <h3 className="font-semibold font-manrope text-on-surface text-[15px] mb-1.5 group-hover:text-secondary transition-colors">{hub.title}</h3>
      {hub.description && <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{hub.description}</p>}
      {hub.stacks.length > 0 && (
        <div className="flex gap-1 mb-3">
          {hub.stacks.slice(0, 3).map(s => (
            <div key={s.stack.id} className="flex-1 min-w-0 bg-surface-container rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-on-surface-variant truncate">{s.stack.title}</p>
            </div>
          ))}
          {hub._count.stacks > 3 && <div className="px-2 py-1.5 bg-surface-container rounded-lg text-[10px] text-on-surface-variant">+{hub._count.stacks - 3}</div>}
        </div>
      )}
      <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{hub._count.members}</span>
        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{hub._count.stacks} stacks</span>
        <span className="ml-auto text-on-surface-variant/60">{hub.creator.name}</span>
      </div>
    </motion.div>
  );
}

export default function KnowledgeHubsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", description: "", domain: "general", isPublic: true, accessCost: 0 });
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch(`/api/knowledge-hubs?mine=${mine}`).then(r => r.json()).then(data => { setHubs(Array.isArray(data) ? data : []); setLoading(false); });
  }, [status, mine]);

  const createHub = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/knowledge-hubs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const hub = await res.json();
    setHubs(prev => [hub, ...prev]);
    setShowCreate(false);
    setForm({ title: "", description: "", domain: "general", isPublic: true, accessCost: 0 });
    setCreating(false);
  };

  const filtered = hubs.filter(h => !search || h.title.toLowerCase().includes(search.toLowerCase()) || h.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all", item.href === "/agents/hubs" ? "bg-secondary-container/60 text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface")}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-manrope text-on-surface">Knowledge Hubs</h1>
            <p className="text-sm text-on-surface-variant mt-1">Group learning spaces powered by Stacks</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2.5 text-sm gap-2"><Plus className="h-4 w-4" /> New Hub</button>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hubs…" className="input-field pl-9" />
          </div>
          <div className="flex rounded-xl overflow-hidden border border-outline-variant/20">
            {[{ label: "All", val: false }, { label: "Mine", val: true }].map(tab => (
              <button key={tab.label} onClick={() => setMine(tab.val)} className={cn("px-4 py-2 text-sm font-medium transition-colors", mine === tab.val ? "bg-secondary-container/60 text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container")}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="elevated-surface rounded-2xl p-5 h-48"><div className="shimmer rounded-lg h-4 w-1/2 mb-3" /><div className="shimmer rounded-lg h-3 w-full mb-2" /><div className="shimmer rounded-lg h-3 w-3/4" /></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20"><BookOpen className="h-12 w-12 text-outline-variant mx-auto mb-4" /><p className="text-on-surface-variant">No hubs found</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((hub, i) => <HubCard key={hub.id} hub={hub} index={i} isMine={hub.creator.username === session?.user?.name} />)}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="elevated-surface-strong rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6"><h2 className="font-bold font-manrope text-on-surface">New Knowledge Hub</h2><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-on-surface-variant" /></button></div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Machine Learning Study Group" className="input-field" /></div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-field resize-none" /></div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Domain</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(DOMAIN_LABELS).map(([d, label]) => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, domain: d }))} className={cn("px-3 py-2 rounded-xl text-xs font-medium border capitalize transition-all", form.domain === d ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container" : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40")}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between"><span className="text-sm text-on-surface">Public hub</span><button onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))} className={cn("w-10 h-5.5 rounded-full transition-colors relative", form.isPublic ? "bg-secondary" : "bg-outline-variant/30")}><span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform", form.isPublic ? "translate-x-4.5" : "translate-x-0.5")} /></button></div>
                <button onClick={createHub} disabled={creating || !form.title.trim()} className="btn-primary w-full py-3 text-sm">{creating ? "Creating…" : "Create Hub"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
