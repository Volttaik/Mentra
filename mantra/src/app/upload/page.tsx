"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Package, Upload, ChevronRight,
  X, Plus, Check, BookOpen, ArrowLeft, Loader2,
  File, AlertCircle, Clock, CheckCircle2, XCircle,
  Lock, Globe, Eye, EyeOff,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = [
  {
    id: "lecture",
    icon: FileText,
    title: "Lecture Notes",
    description: "PDFs, markdown notes, slides, or written materials",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "bundle",
    icon: Package,
    title: "Course Bundle",
    description: "Combined multi-format course stack",
    color: "bg-tertiary-fixed text-tertiary",
  },
];

const CATEGORIES = [
  "Computer Science", "Mathematics", "Physics", "Biology",
  "Chemistry", "Economics", "Engineering", "Medicine", "History", "Other",
];

const MODULE_TYPES = ["lecture", "flashcards", "quiz", "assignment"];
const STEPS = ["Type", "Details", "Content", "Modules", "Publish"];
const PLATFORM_COMMISSION = 0.1;

type FileStatus = "pending" | "processing" | "done" | "error";
interface FileUploadStatus {
  name: string;
  status: FileStatus;
  error?: string;
  isMt?: boolean;
}
interface ProcessingState {
  phase: "idle" | "creating" | "uploading" | "done" | "error";
  fileStatuses: FileUploadStatus[];
  textStatus: "idle" | "processing" | "done" | "error" | "skipped";
  textError?: string;
  stackSlug?: string;
  stackId?: string;
  createError?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    courseCode: "",
    university: "",
    semester: "",
    duration: "",
    tags: [] as string[],
    isPublic: true,
    isPaid: false,
    price: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [contentText, setContentText] = useState("");
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [modules, setModules] = useState([{ title: "", type: "lecture" }]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [processing, setProcessing] = useState<ProcessingState>({
    phase: "idle",
    fileStatuses: [],
    textStatus: "idle",
  });

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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setContentFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setContentFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) =>
    setContentFiles(prev => prev.filter((_, i) => i !== index));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (file: File) => {
    const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
    return ext;
  };

  const priceNum = parseFloat(form.price) || 0;
  const commission = priceNum * PLATFORM_COMMISSION;
  const creatorEarnings = priceNum - commission;
  const isBundle = selectedType === "bundle";

  const hasContent = contentFiles.length > 0 || contentText.trim().length > 0;

  const handlePublish = async () => {
    if (!session?.user) { router.push("/login"); return; }
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      setStep(1);
      return;
    }
    if (form.isPaid && (!form.price || priceNum <= 0)) {
      setError("Please enter a valid price for your paid stack.");
      return;
    }

    setPublishing(true);
    setError("");

    const fileStatuses: FileUploadStatus[] = contentFiles.map(f => ({
      name: f.name,
      status: "pending" as FileStatus,
    }));

    setProcessing({
      phase: "creating",
      fileStatuses,
      textStatus: contentText.trim() ? "idle" : "skipped",
    });
    setStep(5);

    try {
      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          department: isBundle ? null : form.category,
          courseCode: form.courseCode,
          university: isBundle ? null : (session.user as any).university ?? form.university,
          semester: isBundle ? null : form.semester,
          duration: isBundle ? form.duration : null,
          language: "PDF",
          tags: form.tags,
          modules: modules.filter(m => m.title.trim()),
          isPublic: form.isPublic,
          isPaid: form.isPaid,
          price: form.isPaid ? form.price : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProcessing(prev => ({ ...prev, phase: "error", createError: data.error ?? "Failed to create stack." }));
        setPublishing(false);
        return;
      }

      const { slug, id: stackId } = data;
      setProcessing(prev => ({ ...prev, phase: "uploading", stackSlug: slug, stackId }));

      for (let i = 0; i < contentFiles.length; i++) {
        const file = contentFiles[i];
        setProcessing(prev => ({
          ...prev,
          fileStatuses: prev.fileStatuses.map((f, j) =>
            j === i ? { ...f, status: "processing" } : f
          ),
        }));

        try {
          const fd = new FormData();
          fd.append("file", file);
          const fileRes = await fetch(`/api/stacks/${slug}/files`, {
            method: "POST",
            body: fd,
          });
          const fileData = await fileRes.json();

          setProcessing(prev => ({
            ...prev,
            fileStatuses: prev.fileStatuses.map((f, j) =>
              j === i
                ? {
                    ...f,
                    status: fileRes.ok ? "done" : "error",
                    error: !fileRes.ok ? (fileData.error ?? "Upload failed") : undefined,
                    isMt: fileRes.ok && !!fileData.file?.mtContentId,
                  }
                : f
            ),
          }));
        } catch {
          setProcessing(prev => ({
            ...prev,
            fileStatuses: prev.fileStatuses.map((f, j) =>
              j === i ? { ...f, status: "error", error: "Network error — please check your connection." } : f
            ),
          }));
        }
      }

      if (contentText.trim()) {
        setProcessing(prev => ({ ...prev, textStatus: "processing" }));
        try {
          const txtRes = await fetch("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stackId,
              content: contentText,
              fileName: "content.md",
              fileType: "text/markdown",
            }),
          });
          const txtData = await txtRes.json();
          setProcessing(prev => ({
            ...prev,
            textStatus: txtRes.ok ? "done" : "error",
            textError: !txtRes.ok ? (txtData.error ?? "Failed to process text content.") : undefined,
          }));
        } catch {
          setProcessing(prev => ({
            ...prev,
            textStatus: "error",
            textError: "Network error while processing text content.",
          }));
        }
      }

      setProcessing(prev => ({ ...prev, phase: "done" }));
    } catch {
      setProcessing(prev => ({
        ...prev,
        phase: "error",
        createError: "Something went wrong. Please try again.",
      }));
    } finally {
      setPublishing(false);
    }
  };

  const goBack = (toStep: number) => {
    setStep(toStep);
    setProcessing({ phase: "idle", fileStatuses: [], textStatus: "idle" });
    setPublishing(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-[800px] mx-auto px-4 md:px-6 py-10 w-full">

        <div className="mb-10">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />Back to dashboard
          </Link>
          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-2">Create a new stack</h1>
          <p className="text-on-surface-variant text-sm">Share your academic knowledge with the world.</p>
        </div>

        {step < 5 && (
          <div className="flex items-center gap-1 mb-10 overflow-x-auto no-scrollbar">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    step === i
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : step > i
                      ? "text-secondary cursor-pointer hover:bg-surface-container"
                      : "text-on-surface-variant opacity-50 cursor-default"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    step > i ? "bg-secondary text-on-secondary"
                      : step === i ? "bg-on-secondary-container text-secondary-container"
                      : "bg-outline-variant/30 text-on-surface-variant"
                  )}>
                    {step > i ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-outline-variant shrink-0" />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error/20 rounded-xl flex items-center gap-3 text-sm text-error">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* ── Step 0: Content Type ── */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-manrope font-semibold text-lg text-primary mb-6">What are you sharing today?</h2>
            {CONTENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setStep(1); }}
                className={cn(
                  "w-full card-sm p-6 flex items-center gap-5 cursor-pointer group hover:-translate-y-0.5 transition-all text-left",
                  selectedType === type.id && "ring-2 ring-secondary"
                )}
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

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-manrope font-semibold text-lg text-primary">Content details</h2>

            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Stack title <span className="text-error">*</span></label>
              <input
                value={form.title}
                onChange={e => update("title", e.target.value)}
                placeholder="e.g. Advanced Algorithms — COMP 401"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Description <span className="text-error">*</span></label>
              <textarea
                value={form.description}
                onChange={e => update("description", e.target.value)}
                placeholder="Briefly describe what students will learn and what's included..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div className={cn("grid gap-4", isBundle ? "grid-cols-1" : "grid-cols-2")}>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Course code</label>
                <input value={form.courseCode} onChange={e => update("courseCode", e.target.value)} placeholder="e.g. CS 401" className="input-field" />
              </div>
              {isBundle ? (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Duration</label>
                  <input value={form.duration} onChange={e => update("duration", e.target.value)} placeholder="e.g. 12 weeks" className="input-field" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Semester</label>
                  <input value={form.semester} onChange={e => update("semester", e.target.value)} placeholder="e.g. Fall 2025" className="input-field" />
                </div>
              )}
            </div>

            {!isBundle && (
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
            )}

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
                {[
                  { label: "Public", value: true, icon: Globe },
                  { label: "Private", value: false, icon: Lock },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => update("isPublic", opt.value)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-semibold font-manrope flex items-center justify-center gap-2 transition-all border",
                      form.isPublic === opt.value
                        ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
                        : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    <opt.icon className="w-4 h-4" />{opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
              <button
                onClick={() => {
                  if (!form.title.trim() || !form.description.trim()) {
                    setError("Title and description are required.");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="btn-primary flex-1"
              >
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Content ── */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Add your content</h2>
              <p className="text-sm text-on-surface-variant">Upload files or write content directly. Files are encrypted and stored as MT content.</p>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Upload files</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
                  dragOver
                    ? "border-secondary bg-secondary-container/20"
                    : "border-outline-variant/30 hover:border-secondary/40 hover:bg-surface-container/50"
                )}
              >
                <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-on-secondary-container" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">Drop files here or click to browse</p>
                  <p className="text-xs text-on-surface-variant mt-1">PDF, DOCX, ZIP, PPTX, TXT, MD — up to 25 MB each</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.zip,.pptx,.ppt,.xlsx,.xls,.txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <AnimatePresence>
                {contentFiles.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
                    {contentFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl group">
                        <div className="w-9 h-9 bg-secondary-container rounded-lg flex items-center justify-center shrink-0">
                          <File className="w-4 h-4 text-on-secondary-container" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                          <p className="text-xs text-on-surface-variant flex items-center gap-2">
                            <span>{formatFileSize(file.size)}</span>
                            <span className="px-1.5 py-0.5 bg-secondary-container/50 text-secondary rounded text-[10px] font-medium">{getFileTypeLabel(file)}</span>
                          </p>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-on-surface-variant hover:text-error transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text editor with preview toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-primary">Write content</label>
                {contentText.trim().length > 0 && (
                  <button
                    onClick={() => setShowPreview(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors"
                  >
                    {showPreview ? <><EyeOff className="w-3.5 h-3.5" />Hide preview</> : <><Eye className="w-3.5 h-3.5" />Preview</>}
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {showPreview && contentText.trim() ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-[200px] max-h-[320px] overflow-y-auto p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl"
                  >
                    <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-3">Content preview</p>
                    <div className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-mono">
                      {contentText.slice(0, 2000)}{contentText.length > 2000 && <span className="text-on-surface-variant">…({contentText.length - 2000} more characters)</span>}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <textarea
                      value={contentText}
                      onChange={e => setContentText(e.target.value)}
                      placeholder="Write your lecture notes, course overview, or any supporting content here..."
                      rows={10}
                      className="input-field resize-none font-mono text-sm leading-relaxed"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-on-surface-variant">{contentText.length} characters</p>
                {!hasContent && (
                  <p className="text-xs text-on-surface-variant/60">You can also add content later from the stack page.</p>
                )}
              </div>
            </div>

            {hasContent && (
              <div className="flex items-center gap-2 p-3 bg-secondary-container/20 border border-secondary/15 rounded-xl text-xs text-on-secondary-container">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                <span>
                  {contentFiles.length > 0 && `${contentFiles.length} file${contentFiles.length > 1 ? "s" : ""} ready`}
                  {contentFiles.length > 0 && contentText.trim() && " · "}
                  {contentText.trim() && `${contentText.length} characters of text`}
                  {" "}· Will be encrypted with the MT engine on publish
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue →</button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Modules ── */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Organize your modules</h2>
              <p className="text-sm text-on-surface-variant">Break your content into structured learning modules.</p>
            </div>

            <div className="space-y-3 mt-6">
              {modules.map((mod, i) => (
                <div key={i} className="card-sm p-4 flex items-center gap-4">
                  <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center font-bold font-manrope text-xs text-on-secondary-container shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <input
                    value={mod.title}
                    onChange={e => {
                      const u = [...modules];
                      u[i].title = e.target.value;
                      setModules(u);
                    }}
                    placeholder={`Module ${i + 1} title...`}
                    className="flex-1 bg-transparent border-b border-outline-variant/30 py-1 text-sm text-on-surface focus:outline-none focus:border-secondary transition-colors placeholder:text-on-surface-variant/50"
                  />
                  <select
                    value={mod.type}
                    onChange={e => {
                      const u = [...modules];
                      u[i].type = e.target.value;
                      setModules(u);
                    }}
                    className="text-xs bg-surface-container text-on-surface-variant border-none rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    {MODULE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                  {modules.length > 1 && (
                    <button onClick={() => setModules(m => m.filter((_, j) => j !== i))} className="text-on-surface-variant hover:text-error transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addModule}
              className="w-full border-2 border-dashed border-outline-variant/30 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-all"
            >
              <Plus className="w-4 h-4" />Add module
            </button>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1">Review & Publish →</button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Publish ── */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-manrope font-semibold text-lg text-primary">Review & publish</h2>

            <div className="card p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-on-secondary-container" />
                </div>
                <div>
                  <h3 className="font-manrope font-semibold text-base text-primary">{form.title || "Untitled Stack"}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{form.description || "No description provided."}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant/10 text-sm">
                <div><span className="text-on-surface-variant text-xs">Type</span><p className="font-medium text-primary capitalize">{isBundle ? "Course Bundle" : "Lecture Notes"}</p></div>
                <div><span className="text-on-surface-variant text-xs">Course</span><p className="font-medium text-primary">{form.courseCode || "—"}</p></div>
                {!isBundle && (
                  <>
                    <div><span className="text-on-surface-variant text-xs">Semester</span><p className="font-medium text-primary">{form.semester || "—"}</p></div>
                    <div><span className="text-on-surface-variant text-xs">Department</span><p className="font-medium text-primary">{form.category || "—"}</p></div>
                  </>
                )}
                <div><span className="text-on-surface-variant text-xs">Modules</span><p className="font-medium text-primary">{modules.filter(m => m.title.trim()).length}</p></div>
                <div><span className="text-on-surface-variant text-xs">Visibility</span><p className="font-medium text-primary capitalize">{form.isPublic ? "Public" : "Private"}</p></div>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-outline-variant/10">
                  {form.tags.map(t => <span key={t} className="tag-accent text-xs">{t}</span>)}
                </div>
              )}
              {hasContent && (
                <div className="pt-2 border-t border-outline-variant/10">
                  <p className="text-xs text-on-surface-variant mb-1.5">Content to be uploaded:</p>
                  <div className="space-y-1">
                    {contentFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <File className="w-3 h-3 text-secondary shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-outline ml-auto shrink-0">{formatFileSize(f.size)}</span>
                      </div>
                    ))}
                    {contentText.trim() && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <FileText className="w-3 h-3 text-secondary shrink-0" />
                        <span>Text content ({contentText.length} characters)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="font-manrope font-semibold text-sm text-primary">Pricing</h3>
              <div className="flex gap-2">
                {[{ label: "Free", value: false }, { label: "Paid", value: true }].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => update("isPaid", opt.value)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-all border",
                      form.isPaid === opt.value
                        ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
                        : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {form.isPaid && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Selling price (₦)</label>
                      <input type="number" min="0" value={form.price} onChange={e => update("price", e.target.value)} placeholder="e.g. 1000" className="input-field" />
                    </div>
                    {priceNum > 0 && (
                      <div className="rounded-xl overflow-hidden border border-outline-variant/20 text-sm">
                        <div className="flex justify-between px-4 py-3 border-b border-outline-variant/10">
                          <span className="text-on-surface-variant">Stack price</span>
                          <span className="font-semibold text-primary">₦{priceNum.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 border-b border-outline-variant/10">
                          <span className="text-on-surface-variant">Mentra commission (10%)</span>
                          <span className="text-error">−₦{commission.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 bg-secondary-container/20">
                          <span className="font-semibold text-primary">Your earnings</span>
                          <span className="font-bold text-secondary">₦{creatorEarnings.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!form.isPaid && <p className="text-xs text-on-surface-variant">This stack will be available to everyone for free.</p>}
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl text-sm">
              <div className={cn("w-2 h-2 rounded-full shrink-0", form.isPublic ? "bg-secondary" : "bg-outline-variant")} />
              <span className="text-on-surface-variant">
                Publishing as <span className="font-semibold text-primary">{form.isPublic ? "Public" : "Private"}</span>
                {form.isPaid && priceNum > 0 ? ` · Paid (₦${priceNum.toLocaleString()})` : " · Free"}
              </span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary px-6">Back</button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-xl font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {publishing ? <><Loader2 className="w-5 h-5 animate-spin" />Creating…</> : "Publish stack"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Processing ── */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center pb-2">
              {processing.phase === "done" ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }} className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-secondary" />
                  </motion.div>
                  <h2 className="font-manrope font-bold text-xl text-primary">Stack published!</h2>
                  <p className="text-sm text-on-surface-variant mt-1">Your content has been secured and is ready to view.</p>
                </>
              ) : processing.phase === "error" && !processing.stackSlug ? (
                <>
                  <div className="w-16 h-16 bg-error-container/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-error" />
                  </div>
                  <h2 className="font-manrope font-bold text-xl text-primary">Failed to create stack</h2>
                  <p className="text-sm text-error mt-1">{processing.createError}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Loader2 className="w-8 h-8 text-on-secondary-container animate-spin" />
                  </div>
                  <h2 className="font-manrope font-bold text-xl text-primary">
                    {processing.phase === "creating" ? "Creating your stack…" : "Processing content…"}
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {processing.phase === "creating" ? "Setting up your stack in the database." : "Encrypting and securing your files with the MT engine."}
                  </p>
                </>
              )}
            </div>

            {(processing.fileStatuses.length > 0 || processing.textStatus !== "skipped") && (
              <div className="card p-5 space-y-3">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Upload progress</p>

                {processing.fileStatuses.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                      {f.status === "pending" && <Clock className="w-3.5 h-3.5 text-on-surface-variant" />}
                      {f.status === "processing" && <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />}
                      {f.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />}
                      {f.status === "error" && <XCircle className="w-3.5 h-3.5 text-error" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm truncate", f.status === "error" ? "text-error" : "text-primary")}>{f.name}</p>
                      {f.status === "error" && f.error && <p className="text-xs text-error/80">{f.error}</p>}
                      {f.status === "done" && f.isMt && <p className="text-xs text-secondary">Encrypted · MT secured</p>}
                      {f.status === "done" && !f.isMt && <p className="text-xs text-on-surface-variant">Uploaded</p>}
                      {f.status === "processing" && <p className="text-xs text-secondary">Extracting and encrypting…</p>}
                      {f.status === "pending" && <p className="text-xs text-on-surface-variant">Waiting…</p>}
                    </div>
                  </div>
                ))}

                {processing.textStatus !== "skipped" && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                      {processing.textStatus === "idle" && <Clock className="w-3.5 h-3.5 text-on-surface-variant" />}
                      {processing.textStatus === "processing" && <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />}
                      {processing.textStatus === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />}
                      {processing.textStatus === "error" && <XCircle className="w-3.5 h-3.5 text-error" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", processing.textStatus === "error" ? "text-error" : "text-primary")}>Text content</p>
                      {processing.textStatus === "error" && <p className="text-xs text-error/80">{processing.textError}</p>}
                      {processing.textStatus === "done" && <p className="text-xs text-secondary">Processed · MT secured</p>}
                      {processing.textStatus === "processing" && <p className="text-xs text-secondary">Processing…</p>}
                      {processing.textStatus === "idle" && <p className="text-xs text-on-surface-variant">Waiting…</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {processing.phase === "done" && processing.stackSlug && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/stacks/${processing.stackSlug}`)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-xl font-semibold font-manrope hover:opacity-90 transition-all"
                >
                  View your stack <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full flex items-center justify-center text-on-surface-variant hover:text-primary text-sm transition-colors py-2"
                >
                  Back to dashboard
                </button>
              </motion.div>
            )}

            {(processing.phase === "error" && !processing.stackSlug) && (
              <div className="flex gap-3">
                <button onClick={() => goBack(4)} className="flex-1 btn-secondary">Try again</button>
                <button onClick={() => router.push("/dashboard")} className="flex-1 btn-primary">Go to dashboard</button>
              </div>
            )}
          </motion.div>
        )}

      </main>
    </div>
  );
}
