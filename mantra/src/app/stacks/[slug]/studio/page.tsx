"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Save, Image as ImageIcon, Palette,
  FileText, Tag, Globe, Lock, Trash2, Upload, Check, AlertTriangle,
  Eye, BookOpen, GraduationCap, Building, Calendar, Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StackData {
  id: string; title: string; slug: string; description: string;
  courseCode: string; university: string; department: string;
  semester: string; language: string; isPublic: boolean;
  isPaid: boolean; price: number | null; readme: string | null;
  banner: string | null; tags: string[];
  owner: { id: string; name: string; username: string };
}

const SEMESTERS = ["Fall 2024", "Spring 2025", "Summer 2025", "Fall 2025", "Year-Round"];
const LANGUAGES = ["PDF", "Document", "Markdown", "Jupyter", "Python", "Video"];
const DEPARTMENTS = [
  "Computer Science", "Mathematics", "Physics", "Biology",
  "Chemistry", "Economics", "Engineering", "Medicine", "Law", "Arts",
];

export default function StackStudioPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [stack, setStack] = useState<StackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [activeSection, setActiveSection] = useState<"identity" | "appearance" | "content" | "visibility">("identity");

  const [form, setForm] = useState({
    title: "", description: "", courseCode: "", university: "",
    department: "", semester: "", language: "PDF",
    isPublic: true, isPaid: false, price: "",
    readme: "", tags: "", banner: "",
  });

  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/stacks/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setStack(d);
        setForm({
          title: d.title ?? "",
          description: d.description ?? "",
          courseCode: d.courseCode ?? "",
          university: d.university ?? "",
          department: d.department ?? "",
          semester: d.semester ?? "",
          language: d.language ?? "PDF",
          isPublic: d.isPublic ?? true,
          isPaid: d.isPaid ?? false,
          price: d.price != null ? String(d.price) : "",
          readme: d.readme ?? "",
          tags: (d.tags ?? []).join(", "),
          banner: d.banner ?? "",
        });
        if (d.banner) setBannerPreview(d.banner);
      })
      .catch(() => setError("Failed to load stack."))
      .finally(() => setLoading(false));
  }, [slug]);

  const isOwner = session?.user?.id === stack?.owner?.id;

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setBannerUploading(true);
    const localUrl = URL.createObjectURL(file);
    setBannerPreview(localUrl);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "banner");
      const res = await fetch(`/api/stacks/${slug}/banner`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(f => ({ ...f, banner: data.url }));
        setBannerPreview(data.url);
      } else {
        setBannerPreview(form.banner || null);
        setSavedMsg("Banner upload failed.");
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch {
      setBannerPreview(form.banner || null);
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!stack) return;
    setSaving(true);
    try {
      const tagsArr = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const body: Record<string, any> = {
        title: form.title,
        description: form.description,
        courseCode: form.courseCode,
        university: form.university,
        department: form.department,
        semester: form.semester,
        language: form.language,
        isPublic: form.isPublic,
        readme: form.readme,
        tags: tagsArr,
        banner: form.banner,
      };
      if (form.isPaid) {
        body.isPaid = true;
        body.price = parseFloat(form.price) || 0;
      } else {
        body.isPaid = false;
        body.price = null;
      }

      const res = await fetch(`/api/stacks/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedMsg("Changes saved!");
        setTimeout(() => setSavedMsg(""), 3000);
        if (data.slug && data.slug !== slug) {
          router.push(`/stacks/${data.slug}/studio`);
        }
      } else {
        setSavedMsg(data.error ?? "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const SECTIONS = [
    { id: "identity", label: "Identity", icon: BookOpen },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "content", label: "Content", icon: FileText },
    { id: "visibility", label: "Visibility", icon: Eye },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-secondary animate-spin" />
      </div>
    );
  }

  if (error || !stack) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-error" />
        <p className="font-manrope font-bold text-xl text-primary">{error || "Stack not found"}</p>
        <Link href="/dashboard" className="btn-primary px-5 py-2.5 rounded-xl text-sm">Back to dashboard</Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Lock className="w-10 h-10 text-error" />
        <p className="font-manrope font-bold text-xl text-primary">Not authorized</p>
        <p className="text-on-surface-variant">Only the stack owner can access Studio.</p>
        <Link href={`/stacks/${slug}`} className="btn-primary px-5 py-2.5 rounded-xl text-sm">View stack</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-outline-variant/15">
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/stacks/${slug}`}
              className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to stack</span>
            </Link>
            <span className="text-outline-variant/40">/</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-secondary-container rounded flex items-center justify-center">
                <Palette className="w-3.5 h-3.5 text-on-secondary-container" />
              </div>
              <span className="font-manrope font-semibold text-sm text-primary truncate max-w-[160px]">
                Stack Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedMsg && (
              <span className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium",
                savedMsg.includes("saved") || savedMsg.includes("!")
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-error-container/30 text-error"
              )}>
                {savedMsg.includes("saved") || savedMsg.includes("!") ? <Check className="w-3 h-3 inline mr-1" /> : null}
                {savedMsg}
              </span>
            )}
            <Link
              href={`/stacks/${slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container border border-outline-variant/20 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />Preview
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold font-manrope bg-primary text-on-primary hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar nav */}
          <aside className="lg:w-52 shrink-0">
            <nav className="space-y-1 sticky top-24">
              {SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                    activeSection === section.id
                      ? "bg-secondary-container text-on-secondary-container"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                  )}
                >
                  <section.icon className="w-4 h-4 shrink-0" />
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── IDENTITY ── */}
            {activeSection === "identity" && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-manrope font-bold text-xl text-primary mb-1">Stack Identity</h2>
                  <p className="text-sm text-on-surface-variant">Core details that define and identify your stack.</p>
                </div>

                <div className="card p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Title</label>
                    <input
                      value={form.title}
                      onChange={e => set("title", e.target.value)}
                      className="input-field"
                      placeholder="e.g. Introduction to Machine Learning"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => set("description", e.target.value)}
                      rows={3}
                      className="input-field resize-none"
                      placeholder="What will learners get from this stack?"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        <GraduationCap className="w-3.5 h-3.5 inline mr-1" />Course Code
                      </label>
                      <input
                        value={form.courseCode}
                        onChange={e => set("courseCode", e.target.value)}
                        className="input-field"
                        placeholder="e.g. CS301"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        <Building className="w-3.5 h-3.5 inline mr-1" />University
                      </label>
                      <input
                        value={form.university}
                        onChange={e => set("university", e.target.value)}
                        className="input-field"
                        placeholder="e.g. MIT"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Department</label>
                      <select value={form.department} onChange={e => set("department", e.target.value)} className="input-field">
                        <option value="">Select department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />Semester
                      </label>
                      <select value={form.semester} onChange={e => set("semester", e.target.value)} className="input-field">
                        <option value="">Select semester</option>
                        {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">
                        <Languages className="w-3.5 h-3.5 inline mr-1" />Format
                      </label>
                      <select value={form.language} onChange={e => set("language", e.target.value)} className="input-field">
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      <Tag className="w-3.5 h-3.5 inline mr-1" />Tags
                    </label>
                    <input
                      value={form.tags}
                      onChange={e => set("tags", e.target.value)}
                      className="input-field"
                      placeholder="machine-learning, python, deep-learning (comma-separated)"
                    />
                    <p className="text-xs text-on-surface-variant mt-1">Separate tags with commas. Used for discovery.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── APPEARANCE ── */}
            {activeSection === "appearance" && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-manrope font-bold text-xl text-primary mb-1">Appearance</h2>
                  <p className="text-sm text-on-surface-variant">Customize how your stack looks to others.</p>
                </div>

                {/* Banner */}
                <div className="card p-6 space-y-4">
                  <div>
                    <h3 className="font-manrope font-semibold text-base text-primary mb-1">Banner / Thumbnail</h3>
                    <p className="text-xs text-on-surface-variant">Shown at the top of your stack and in cards. Recommended: 1200×400px.</p>
                  </div>

                  <div
                    className={cn(
                      "relative w-full h-48 rounded-xl border-2 border-dashed overflow-hidden transition-all cursor-pointer group",
                      bannerPreview ? "border-outline-variant/30" : "border-outline-variant/40 hover:border-secondary/40"
                    )}
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {bannerPreview ? (
                      <>
                        <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-2 bg-white/90 text-gray-900 px-4 py-2 rounded-xl text-sm font-medium">
                            <Upload className="w-4 h-4" />
                            Change banner
                          </div>
                        </div>
                        {bannerUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-7 h-7 text-white animate-spin" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                        <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Click to upload banner</p>
                          <p className="text-xs mt-0.5">PNG, JPG, WebP up to 5MB</p>
                        </div>
                        {bannerUploading && (
                          <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerSelect}
                  />
                  {bannerPreview && (
                    <button
                      onClick={() => { setBannerPreview(null); setForm(f => ({ ...f, banner: "" })); }}
                      className="flex items-center gap-1.5 text-xs text-error hover:text-error/80 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove banner
                    </button>
                  )}
                </div>

                {/* README */}
                <div className="card p-6 space-y-3">
                  <div>
                    <h3 className="font-manrope font-semibold text-base text-primary mb-1">README</h3>
                    <p className="text-xs text-on-surface-variant">Shown on the Overview tab. Supports Markdown-style formatting.</p>
                  </div>
                  <textarea
                    value={form.readme}
                    onChange={e => set("readme", e.target.value)}
                    rows={10}
                    className="input-field font-mono text-xs resize-y"
                    placeholder="## Welcome to this stack&#10;&#10;Describe what's inside, how it's organized, and how learners should use it..."
                  />
                </div>
              </div>
            )}

            {/* ── CONTENT ── */}
            {activeSection === "content" && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-manrope font-bold text-xl text-primary mb-1">Content</h2>
                  <p className="text-sm text-on-surface-variant">Manage your README and documentation.</p>
                </div>

                <div className="card p-6 space-y-4">
                  <div>
                    <h3 className="font-manrope font-semibold text-base text-primary mb-1">Stack README</h3>
                    <p className="text-xs text-on-surface-variant mb-3">This content appears on your stack's Overview tab. Use it to describe what learners will find, prerequisites, and how to navigate your stack.</p>
                    <textarea
                      value={form.readme}
                      onChange={e => set("readme", e.target.value)}
                      rows={16}
                      className="input-field font-mono text-xs resize-y"
                      placeholder={`## Overview\n\nThis stack covers...\n\n## Prerequisites\n\n- Basic knowledge of...\n\n## How to use\n\n1. Start with Module 01...\n\n## License\n\nFeel free to fork and improve!`}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    To manage uploaded files and modules, visit the{" "}
                    <Link href={`/stacks/${slug}?tab=Modules`} className="text-secondary hover:underline">Modules tab</Link>{" "}
                    on your stack page.
                  </p>
                </div>
              </div>
            )}

            {/* ── VISIBILITY ── */}
            {activeSection === "visibility" && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-manrope font-bold text-xl text-primary mb-1">Visibility & Access</h2>
                  <p className="text-sm text-on-surface-variant">Control who can see and access your stack.</p>
                </div>

                <div className="card p-6 space-y-5">
                  <div>
                    <h3 className="font-manrope font-semibold text-base text-primary mb-3">Stack Visibility</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => set("isPublic", true)}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                          form.isPublic
                            ? "border-secondary bg-secondary-container/20"
                            : "border-outline-variant/20 hover:border-outline-variant/50"
                        )}
                      >
                        <Globe className={cn("w-5 h-5 mt-0.5 shrink-0", form.isPublic ? "text-secondary" : "text-on-surface-variant")} />
                        <div>
                          <p className={cn("font-semibold text-sm", form.isPublic ? "text-secondary" : "text-primary")}>Public</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">Anyone can discover and view this stack.</p>
                        </div>
                      </button>
                      <button
                        onClick={() => set("isPublic", false)}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                          !form.isPublic
                            ? "border-secondary bg-secondary-container/20"
                            : "border-outline-variant/20 hover:border-outline-variant/50"
                        )}
                      >
                        <Lock className={cn("w-5 h-5 mt-0.5 shrink-0", !form.isPublic ? "text-secondary" : "text-on-surface-variant")} />
                        <div>
                          <p className={cn("font-semibold text-sm", !form.isPublic ? "text-secondary" : "text-primary")}>Private</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">Only you can access this stack.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/10 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-manrope font-semibold text-base text-primary">Paid Stack</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">Charge learners to access this stack's content.</p>
                      </div>
                      <button
                        onClick={() => set("isPaid", !form.isPaid)}
                        className={cn(
                          "w-11 h-6 rounded-full transition-all relative",
                          form.isPaid ? "bg-secondary" : "bg-surface-container-high"
                        )}
                      >
                        <span className={cn(
                          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                          form.isPaid && "translate-x-5"
                        )} />
                      </button>
                    </div>
                    {form.isPaid && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-on-surface-variant font-medium">₦</span>
                        <input
                          type="number"
                          min="0"
                          value={form.price}
                          onChange={e => set("price", e.target.value)}
                          className="input-field max-w-[160px]"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="card p-5 border-error/20 bg-error-container/5 space-y-3">
                  <h3 className="font-manrope font-semibold text-base text-error">Danger Zone</h3>
                  <p className="text-sm text-on-surface-variant">
                    These actions are irreversible. Deleting a stack removes all files, modules, and discussions.
                  </p>
                  <Link
                    href={`/stacks/${slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-error/30 text-error hover:bg-error-container/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete stack (from stack page)
                  </Link>
                </div>
              </div>
            )}

            {/* Save button (bottom) */}
            <div className="flex justify-end pt-4 border-t border-outline-variant/10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold font-manrope bg-primary text-on-primary hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
