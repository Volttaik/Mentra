"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Video, FileText, Package, Radio, Upload, ChevronRight,
  X, Plus, Check, BookOpen, ArrowLeft, Loader2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = [
  { id: "lecture", icon: FileText, title: "Lecture Notes", description: "PDFs, markdown notes, slides, or written materials", color: "bg-secondary-container text-on-secondary-container" },
  { id: "video", icon: Video, title: "Video Lecture", description: "High-quality video teaching content", color: "bg-primary-fixed text-primary" },
  { id: "bundle", icon: Package, title: "Course Bundle", description: "Combined multi-format course stack", color: "bg-tertiary-fixed text-tertiary" },
  { id: "live", icon: Radio, title: "Live Session", description: "Interactive real-time mentoring or tutoring", color: "bg-surface-container-high text-on-surface-variant" },
];

const CATEGORIES = [
  "Computer Science", "Mathematics", "Physics", "Biology",
  "Chemistry", "Economics", "Engineering", "Medicine", "History", "Other",
];

const STEPS = ["Content Type", "Details", "Modules", "Publish"];

export default function UploadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", category: "", courseCode: "",
    university: "", semester: "", tags: [] as string[], isPublic: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [modules, setModules] = useState([{ title: "", type: "lecture" }]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, t] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) =>
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  const addModule = () =>
    setModules(prev => [...prev, { title: "", type: "lecture" }]);

  const handlePublish = async () => {
    if (!session?.user) { router.push("/login"); return; }
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      setStep(1);
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          department: form.category,
          courseCode: form.courseCode,
          university: session.user.university ?? form.university,
          semester: form.semester,
          language: selectedType === "video" ? "Video" : selectedType === "live" ? "Live" : "PDF",
          tags: form.tags,
          modules: modules.filter(m => m.title.trim()),
          isPublic: form.isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to publish. Please try again.");
        setPublishing(false);
        return;
      }
      router.push(`/stacks/${data.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-[800px] mx-auto px-4 md:px-6 py-10 w-full">
        <div className="mb-10">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />Back to dashboard
          </Link>
          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-2">Create a new stack</h1>
          <p className="text-on-surface-variant">Share your academic knowledge with the world.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  step === i ? "bg-secondary-container text-on-secondary-container font-semibold" :
                  step > i ? "text-secondary cursor-pointer hover:bg-surface-container" :
                  "text-on-surface-variant opacity-50 cursor-default"
                )}
              >
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", step > i ? "bg-secondary text-on-secondary" : step === i ? "bg-on-secondary-container text-secondary-container" : "bg-outline-variant/30 text-on-surface-variant")}>
                  {step > i ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-outline-variant shrink-0" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
            {error}
          </div>
        )}

        {/* Step 0: Content Type */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-manrope font-semibold text-lg text-primary mb-6">What are you sharing today?</h2>
            {CONTENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setStep(1); }}
                className={cn("w-full card-sm p-6 flex items-center gap-5 cursor-pointer group hover:-translate-y-0.5 transition-all text-left", selectedType === type.id && "ring-2 ring-secondary")}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", type.color)}>
                  <type.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-manrope font-semibold text-base text-primary group-hover:text-secondary transition-colors">{type.title}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{type.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-on-surface-variant group-hover:text-secondary transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-manrope font-semibold text-lg text-primary mb-6">Content details</h2>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Stack title *</label>
              <input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Advanced Algorithms — COMP 401" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Description *</label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Briefly describe what students will learn and what's included..." rows={4} className="input-field resize-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Course code</label>
                <input value={form.courseCode} onChange={e => update("courseCode", e.target.value)} placeholder="e.g. CS 401" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Semester</label>
                <input value={form.semester} onChange={e => update("semester", e.target.value)} placeholder="e.g. Fall 2025" className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">University</label>
                <input value={form.university} onChange={e => update("university", e.target.value)} placeholder="Your university" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Department</label>
                <select value={form.category} onChange={e => update("category", e.target.value)} className="input-field">
                  <option value="">Select a department</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Tags</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 tag-accent text-xs">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-error transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag and press Enter"
                  className="input-field flex-1"
                />
                <button onClick={addTag} className="btn-primary px-4 py-3 rounded-xl"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Visibility</label>
              <div className="flex gap-2">
                {[{ label: "Public", value: true }, { label: "Private", value: false }].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => update("isPublic", opt.value)}
                    className={cn("flex-1 py-3 rounded-xl text-sm font-semibold font-manrope capitalize transition-all border", form.isPublic === opt.value ? "bg-secondary-container border-secondary/30 text-on-secondary-container" : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => { if (!form.title.trim() || !form.description.trim()) { setError("Title and description are required."); return; } setError(""); setStep(2); }} className="btn-primary flex-1">Continue →</button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Modules */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-manrope font-semibold text-lg text-primary mb-6">Organize your modules</h2>
            {modules.map((mod, i) => (
              <div key={i} className="card-sm p-5 flex items-center gap-4">
                <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center font-bold font-manrope text-sm text-on-secondary-container shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <input
                  value={mod.title}
                  onChange={e => { const u = [...modules]; u[i].title = e.target.value; setModules(u); }}
                  placeholder={`Module ${i + 1} title...`}
                  className="flex-1 bg-transparent border-b border-outline-variant/30 py-1 text-sm text-on-surface focus:outline-none focus:border-secondary transition-colors placeholder:text-on-surface-variant/50"
                />
                <select
                  value={mod.type}
                  onChange={e => { const u = [...modules]; u[i].type = e.target.value; setModules(u); }}
                  className="text-xs bg-surface-container text-on-surface-variant border-none rounded-lg px-2 py-1.5 focus:outline-none"
                >
                  {["lecture", "assignment", "quiz", "video", "flashcard"].map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
                {modules.length > 1 && (
                  <button onClick={() => setModules(m => m.filter((_, j) => j !== i))} className="text-on-surface-variant hover:text-error transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addModule} className="w-full border-2 border-dashed border-outline-variant/30 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-all">
              <Plus className="w-4 h-4" />Add module
            </button>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">Review & Publish →</button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Publish */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-manrope font-semibold text-lg text-primary mb-6">Ready to publish?</h2>
            <div className="card p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-on-secondary-container" />
                </div>
                <div>
                  <h3 className="font-manrope font-semibold text-base text-primary">{form.title || "Untitled Stack"}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{form.description || "No description provided."}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant/10 text-sm">
                <div><span className="text-on-surface-variant">Course:</span> <span className="font-medium text-primary">{form.courseCode || "—"}</span></div>
                <div><span className="text-on-surface-variant">Semester:</span> <span className="font-medium text-primary">{form.semester || "—"}</span></div>
                <div><span className="text-on-surface-variant">Department:</span> <span className="font-medium text-primary">{form.category || "—"}</span></div>
                <div><span className="text-on-surface-variant">Modules:</span> <span className="font-medium text-primary">{modules.filter(m => m.title.trim()).length}</span></div>
                <div><span className="text-on-surface-variant">Visibility:</span> <span className="font-medium text-primary capitalize">{form.isPublic ? "Public" : "Private"}</span></div>
                <div><span className="text-on-surface-variant">Type:</span> <span className="font-medium text-primary capitalize">{selectedType}</span></div>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {form.tags.map(t => <span key={t} className="tag-accent text-xs">{t}</span>)}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-xl font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all shadow-card"
              >
                {publishing ? <><Loader2 className="w-5 h-5 animate-spin" />Publishing…</> : "Publish stack"}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
