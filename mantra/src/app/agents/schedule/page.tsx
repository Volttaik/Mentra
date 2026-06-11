"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Check, Clock, Trash2, X, BookOpen } from "lucide-react";
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

interface Session { id: string; title: string; subject: string | null; date: string; duration: number; completed: boolean; notes: string | null; stackId: string | null; }

function timeLabel(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0 && diff > -86400000) return "Today";
  if (diff >= 0 && diff < 86400000) return "Today";
  if (diff >= 86400000 && diff < 172800000) return "Tomorrow";
  return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

export default function AgentSchedulePage() {
  const { status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", date: "", duration: 60, notes: "" });

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (status !== "authenticated") return; fetch("/api/agent-schedule").then(r => r.json()).then(d => { setSessions(Array.isArray(d) ? d : []); setLoading(false); }); }, [status]);

  const createSession = async () => {
    if (!form.title.trim() || !form.date) return;
    const res = await fetch("/api/agent-schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const s = await res.json();
    setSessions(prev => [...prev, s].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setShowCreate(false);
    setForm({ title: "", subject: "", date: "", duration: 60, notes: "" });
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, completed } : s));
    await fetch("/api/agent-schedule", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, completed }) });
  };

  const deleteSession = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    await fetch(`/api/agent-schedule?id=${id}`, { method: "DELETE" });
  };

  const upcoming = sessions.filter(s => !s.completed);
  const completed = sessions.filter(s => s.completed);

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => <Link key={item.href} href={item.href} className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all", item.href === "/agents/schedule" ? "bg-secondary-container/60 text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface")}>{item.label}</Link>)}
        </div>
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold font-manrope text-on-surface">Study Schedule</h1><p className="text-sm text-on-surface-variant mt-1">Plan and track your study sessions</p></div>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2.5 text-sm gap-2"><Plus className="h-4 w-4" /> New Session</button>
        </div>
        {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="elevated-surface rounded-2xl p-5 h-20 animate-pulse" />)}</div>
          : sessions.length === 0 ? (
            <div className="text-center py-20"><Calendar className="h-12 w-12 text-outline-variant mx-auto mb-4" /><p className="text-on-surface-variant mb-4">No sessions scheduled</p><button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Schedule a session</button></div>
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Upcoming ({upcoming.length})</h2>
                  <div className="space-y-3">
                    {upcoming.map((s, i) => (
                      <motion.div key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="elevated-surface rounded-2xl p-4 flex items-center gap-4">
                        <button onClick={() => toggleComplete(s.id, true)} className="w-9 h-9 rounded-xl border-2 border-outline-variant/40 hover:border-secondary hover:bg-secondary-container/20 flex items-center justify-center transition-all shrink-0">
                          <Check className="h-4 w-4 text-transparent hover:text-secondary" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-on-surface font-manrope">{s.title}</p>
                          {s.subject && <p className="text-xs text-on-surface-variant">{s.subject}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-secondary">{timeLabel(s.date)}</p>
                          <p className="text-[11px] text-on-surface-variant flex items-center gap-1 justify-end mt-0.5"><Clock className="h-3 w-3" />{s.duration}min</p>
                        </div>
                        <button onClick={() => deleteSession(s.id)} className="text-on-surface-variant hover:text-error transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {completed.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Completed ({completed.length})</h2>
                  <div className="space-y-2">
                    {completed.slice(0, 5).map(s => (
                      <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container/50">
                        <Check className="h-4 w-4 text-secondary shrink-0" />
                        <p className="text-sm text-on-surface-variant line-through flex-1">{s.title}</p>
                        <p className="text-[11px] text-on-surface-variant">{new Date(s.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="elevated-surface-strong rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5"><h2 className="font-bold font-manrope text-on-surface">New Session</h2><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-on-surface-variant" /></button></div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Calculus revision" className="input-field" /></div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Subject</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" className="input-field" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium text-on-surface block mb-1.5">Date & Time *</label><input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" /></div>
                  <div><label className="text-sm font-medium text-on-surface block mb-1.5">Duration (min)</label><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))} min={15} max={480} step={15} className="input-field" /></div>
                </div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input-field resize-none" /></div>
                <button onClick={createSession} disabled={!form.title.trim() || !form.date} className="btn-primary w-full py-3 text-sm">Schedule Session</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
