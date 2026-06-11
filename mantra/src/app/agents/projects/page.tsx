"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, Plus, CheckCircle2, Circle, X, Trash2, Calendar, ChevronRight, Brain, BookOpen, LayoutGrid, BarChart2, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Agents", href: "/agents", icon: Brain },
  { label: "Knowledge Hubs", href: "/agents/hubs", icon: BookOpen },
  { label: "Projects", href: "/agents/projects", icon: FolderKanban },
  { label: "Workspace", href: "/agents/workspace", icon: LayoutGrid },
  { label: "Schedule", href: "/agents/schedule", icon: Calendar },
  { label: "Analytics", href: "/agents/analytics", icon: BarChart2 },
  { label: "WhatsApp", href: "/agents/whatsapp", icon: MessageCircle },
];

interface Task { id: string; label: string; done: boolean; order: number; }
interface Project { id: string; title: string; subject: string | null; deadline: string | null; status: string; priority: string; tasks: Task[]; }

const STATUS_STYLE: Record<string, string> = { todo: "bg-surface-container text-on-surface-variant", "in-progress": "bg-secondary-container/50 text-on-secondary-container", done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
const PRIORITY_DOT: Record<string, string> = { high: "bg-error", medium: "bg-secondary", low: "bg-outline-variant" };

function ProjectCard({ project, onDelete, onToggleTask }: { project: Project; onDelete: () => void; onToggleTask: (tid: string, done: boolean) => void }) {
  const done = project.tasks.filter(t => t.done).length;
  const pct = project.tasks.length ? Math.round((done / project.tasks.length) * 100) : 0;
  return (
    <div className="elevated-surface rounded-2xl p-5 shadow-elevation-sm hover:shadow-elevation-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_DOT[project.priority])} />
          <h3 className="font-semibold font-manrope text-on-surface text-sm">{project.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize", STATUS_STYLE[project.status])}>{project.status.replace("-", " ")}</span>
          <button onClick={onDelete} className="text-on-surface-variant hover:text-error transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {project.subject && <p className="text-xs text-on-surface-variant mb-3">{project.subject}</p>}
      {project.tasks.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {project.tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 cursor-pointer group" onClick={() => onToggleTask(t.id, !t.done)}>
              {t.done ? <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" /> : <Circle className="h-3.5 w-3.5 text-outline-variant shrink-0 group-hover:text-secondary transition-colors" />}
              <span className={cn("text-xs", t.done ? "line-through text-on-surface-variant" : "text-on-surface")}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
      {project.tasks.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-on-surface-variant">{done}/{project.tasks.length}</span>
        </div>
      )}
      {project.deadline && <p className="text-[11px] text-on-surface-variant mt-2 flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(project.deadline).toLocaleDateString()}</p>}
    </div>
  );
}

export default function AgentProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", deadline: "", priority: "medium", taskInput: "", tasks: [] as string[] });

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (status !== "authenticated") return; fetch("/api/agent-projects").then(r => r.json()).then(d => { setProjects(Array.isArray(d) ? d : []); setLoading(false); }); }, [status]);

  const createProject = async () => {
    if (!form.title.trim()) return;
    const res = await fetch("/api/agent-projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title, subject: form.subject, deadline: form.deadline || undefined, priority: form.priority, tasks: form.tasks }) });
    const p = await res.json();
    setProjects(prev => [p, ...prev]);
    setShowCreate(false);
    setForm({ title: "", subject: "", deadline: "", priority: "medium", taskInput: "", tasks: [] });
  };

  const toggleTask = async (projectId: string, taskId: string, done: boolean) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, done } : t) } : p));
    await fetch(`/api/agent-projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId, done }) });
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await fetch(`/api/agent-projects/${id}`, { method: "DELETE" });
  };

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-20">
        <div className="flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.href === "/agents/projects";
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all", active
                  ? "bg-secondary-container/60 text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface")}>
                <Icon className="h-3.5 w-3.5 shrink-0" /><span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-lg font-bold font-manrope text-on-surface">Projects</h1><p className="text-xs text-on-surface-variant mt-0.5">Track your study and research projects</p></div>
          <button onClick={() => setShowCreate(true)} className="btn-primary whitespace-nowrap"><Plus className="h-4 w-4" /> New Project</button>
        </div>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="elevated-surface rounded-2xl p-5 h-40 animate-pulse" />)}</div>
          : projects.length === 0 ? (
            <div className="text-center py-20"><FolderKanban className="h-12 w-12 text-outline-variant mx-auto mb-4" /><p className="text-on-surface-variant mb-4">No projects yet</p><button onClick={() => setShowCreate(true)} className="btn-primary">Create your first project</button></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, i) => <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><ProjectCard project={p} onDelete={() => deleteProject(p.id)} onToggleTask={(tid, done) => toggleTask(p.id, tid, done)} /></motion.div>)}
            </div>
          )}
      </div>
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="elevated-surface-strong rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="font-bold font-manrope text-on-surface">New Project</h2><button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-on-surface-variant" /></button></div>
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Quantum Computing Research" className="input-field" /></div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Subject</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Physics" className="input-field" /></div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="input-field" /></div>
                <div><label className="text-sm font-medium text-on-surface block mb-1.5">Priority</label>
                  <div className="flex gap-2">{["low","medium","high"].map(p => <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} className={cn("flex-1 py-2 rounded-xl text-xs font-medium border capitalize transition-all", form.priority === p ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container" : "border-outline-variant/20 text-on-surface-variant")}>{p}</button>)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface block mb-1.5">Tasks</label>
                  <div className="flex gap-2 mb-2">
                    <input value={form.taskInput} onChange={e => setForm(f => ({ ...f, taskInput: e.target.value }))} onKeyDown={e => { if (e.key === "Enter" && form.taskInput.trim()) { setForm(f => ({ ...f, tasks: [...f.tasks, f.taskInput.trim()], taskInput: "" })); } }} placeholder="Add task and press Enter" className="input-field flex-1" />
                  </div>
                  {form.tasks.map((t, i) => <div key={i} className="flex items-center gap-2 py-1.5"><Circle className="h-3.5 w-3.5 text-outline-variant" /><span className="text-sm text-on-surface flex-1">{t}</span><button onClick={() => setForm(f => ({ ...f, tasks: f.tasks.filter((_, j) => j !== i) }))} className="text-on-surface-variant hover:text-error"><X className="h-3.5 w-3.5" /></button></div>)}
                </div>
                <button onClick={createProject} disabled={!form.title.trim()} className="btn-primary w-full">Create Project</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
