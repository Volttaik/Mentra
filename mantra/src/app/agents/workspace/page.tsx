"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Plus, Pin, Trash2, X, Edit3, Save } from "lucide-react";
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

interface WorkspaceItem { id: string; title: string; content: string; type: string; pinned: boolean; updatedAt: string; }

const TYPE_COLORS: Record<string, string> = { note: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30", idea: "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800/30", reference: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30", summary: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30" };

export default function AgentWorkspacePage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "note" });

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (status !== "authenticated") return; fetch("/api/agent-workspace").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }); }, [status]);

  const createItem = async () => {
    if (!form.title.trim()) return;
    const res = await fetch("/api/agent-workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const item = await res.json();
    setItems(prev => [item, ...prev]);
    setShowCreate(false);
    setForm({ title: "", content: "", type: "note" });
  };

  const saveEdit = async (id: string) => {
    await fetch("/api/agent-workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content: editContent }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, content: editContent } : i));
    setEditingId(null);
  };

  const togglePin = async (item: WorkspaceItem) => {
    await fetch("/api/agent-workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, pinned: !item.pinned }) });
    setItems(prev => [...prev.map(i => i.id === item.id ? { ...i, pinned: !item.pinned } : i)].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/agent-workspace?id=${id}`, { method: "DELETE" });
  };

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => <Link key={item.href} href={item.href} className={cn("px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all", item.href === "/agents/workspace" ? "bg-secondary-container/60 text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface")}>{item.label}</Link>)}
        </div>
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-bold font-manrope text-on-surface">Workspace</h1><p className="text-sm text-on-surface-variant mt-1">Notes, ideas, references, and summaries</p></div>
          <button onClick={() => setShowCreate(true)} className="btn-primary px-5 py-2.5 text-sm gap-2"><Plus className="h-4 w-4" /> New Item</button>
        </div>
        {loading ? <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="elevated-surface rounded-2xl p-5 h-32 animate-pulse break-inside-avoid" />)}</div>
          : items.length === 0 ? (
            <div className="text-center py-20"><LayoutGrid className="h-12 w-12 text-outline-variant mx-auto mb-4" /><p className="text-on-surface-variant mb-4">Your workspace is empty</p><button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Add your first note</button></div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
              {items.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn("break-inside-avoid mb-4 rounded-2xl p-5 border transition-all", TYPE_COLORS[item.type] || TYPE_COLORS.note)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.pinned && <Pin className="h-3 w-3 text-secondary shrink-0" />}
                      <h3 className="font-semibold font-manrope text-on-surface text-sm">{item.title}</h3>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => togglePin(item)} className="p-1 text-on-surface-variant hover:text-secondary transition-colors"><Pin className="h-3 w-3" /></button>
                      <button onClick={() => { setEditingId(item.id); setEditContent(item.content); }} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"><Edit3 className="h-3 w-3" /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1 text-on-surface-variant hover:text-error transition-colors"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  {editingId === item.id ? (
                    <div>
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} className="w-full bg-transparent text-sm text-on-surface outline-none resize-none" />
                      <button onClick={() => saveEdit(item.id)} className="mt-2 flex items-center gap-1 text-xs text-secondary font-medium"><Save className="h-3 w-3" /> Save</button>
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface/80 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize", "bg-white/50 text-on-surface-variant")}>{item.type}</span>
                    <span className="text-[10px] text-on-surface-variant">{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
      </div>
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="elevated-surface-strong rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5"><h2 className="font-bold font-manrope text-on-surface">New Workspace Item</h2><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-on-surface-variant" /></button></div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Item title…" className="input-field" /></div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Type</label>
                  <div className="grid grid-cols-4 gap-2">{["note","idea","reference","summary"].map(t => <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={cn("py-2 rounded-xl text-xs font-medium border capitalize transition-all", form.type === t ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container" : "border-outline-variant/20 text-on-surface-variant")}>{t}</button>)}</div>
                </div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Content</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Write your content here…" className="input-field resize-none" /></div>
                <button onClick={createItem} disabled={!form.title.trim()} className="btn-primary w-full py-3 text-sm">Save Item</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
