"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft, Save, Trash2, Loader2, Globe, Lock,
  Camera, Check, Brain, AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LEVELS = ["Primary", "Secondary", "Undergraduate", "Postgraduate", "Professional"];
const TONES = [
  { value: "patient", label: "Patient & thorough" },
  { value: "concise", label: "Brief & direct" },
  { value: "socratic", label: "Socratic (asks back)" },
  { value: "encouraging", label: "Encouraging" },
  { value: "formal", label: "Formal & academic" },
  { value: "casual", label: "Casual & friendly" },
];
const DOMAINS = [
  { value: "education", label: "Education" },
  { value: "research", label: "Research" },
  { value: "business", label: "Business" },
  { value: "general", label: "General" },
];

interface Agent {
  id: string;
  name: string;
  subject: string;
  level: string;
  domain: string;
  tone: string;
  personality: string | null;
  description: string | null;
  avatarUrl: string | null;
  isPublished: boolean;
  price: number;
}

export default function AgentSettingsPage() {
  const { data: session, status } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("Undergraduate");
  const [domain, setDomain] = useState("education");
  const [tone, setTone] = useState("patient");
  const [personality, setPersonality] = useState("");
  const [description, setDescription] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!id || status !== "authenticated") return;
    fetch(`/api/custom-agents/${id}`)
      .then(r => r.json())
      .then((data: Agent) => {
        setAgent(data);
        setName(data.name);
        setSubject(data.subject);
        setLevel(data.level);
        setDomain(data.domain);
        setTone(data.tone);
        setPersonality(data.personality || "");
        setDescription(data.description || "");
        setLoading(false);
      });
  }, [id, status]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/custom-agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, level, domain, tone, personality: personality || null, description: description || null }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      const updated = await fetch(`/api/custom-agents/${id}`).then(r => r.json());
      setAgent(updated);
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("agentId", id);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      await fetch(`/api/custom-agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      const updated = await fetch(`/api/custom-agents/${id}`).then(r => r.json());
      setAgent(updated);
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/custom-agents/${id}`, { method: "DELETE" });
    router.push("/agents");
  };

  const handleTogglePublish = async () => {
    if (!agent) return;
    const newValue = !agent.isPublished;
    await fetch(`/api/custom-agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: newValue }),
    });
    setAgent(prev => prev ? { ...prev, isPublished: newValue } : prev);
  };

  if (loading) return (
    <div className="min-h-screen app-ambient-bg flex items-center justify-center">
      <Navbar />
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
    </div>
  );

  if (!agent) return (
    <div className="min-h-screen app-ambient-bg flex items-center justify-center">
      <Navbar />
      <p className="text-on-surface-variant">Agent not found</p>
    </div>
  );

  return (
    <div className="min-h-screen app-ambient-bg">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-20">
        <Link href="/agents" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-6 text-sm">
          <ChevronLeft className="h-4 w-4" /> Back to Agents
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer group relative">
              {agent.avatarUrl ? (
                <img src={agent.avatarUrl} alt={agent.name}
                  className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center">
                  <span className="text-2xl font-bold text-secondary font-manrope">{agent.name[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                {uploadingAvatar
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Camera className="h-5 w-5 text-white" />}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-manrope text-on-surface">{agent.name}</h1>
            <p className="text-sm text-on-surface-variant">{agent.subject}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="elevated-surface rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold font-manrope text-on-surface text-sm">Basic Info</h2>
            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1.5">Agent name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="input-field w-full" placeholder="e.g. Professor Ada" />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1.5">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="input-field w-full" placeholder="e.g. Biology" />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant block mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} className="input-field w-full resize-none"
                placeholder="What does this agent specialise in?" />
            </div>
          </div>

          {/* Level */}
          <div className="elevated-surface rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold font-manrope text-on-surface text-sm">Academic Level</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left", level === l
                    ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container"
                    : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high")}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="elevated-surface rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold font-manrope text-on-surface text-sm">Communication Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(t => (
                <button key={t.value} onClick={() => setTone(t.value)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left", tone === t.value
                    ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container"
                    : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Domain */}
          <div className="elevated-surface rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold font-manrope text-on-surface text-sm">Domain</h2>
            <div className="grid grid-cols-2 gap-2">
              {DOMAINS.map(d => (
                <button key={d.value} onClick={() => setDomain(d.value)}
                  className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left", domain === d.value
                    ? "bg-secondary-container/60 border-secondary/40 text-on-secondary-container"
                    : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high")}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div className="elevated-surface rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold font-manrope text-on-surface text-sm">Custom Personality (optional)</h2>
            <textarea value={personality} onChange={e => setPersonality(e.target.value)}
              rows={3} className="input-field w-full resize-none"
              placeholder="Additional personality traits or instructions…" />
          </div>

          {/* Publish */}
          <div className="elevated-surface rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold font-manrope text-on-surface text-sm">Marketplace</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {agent.isPublished ? "Your agent is publicly listed" : "Your agent is private"}
                </p>
              </div>
              <button onClick={handleTogglePublish}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all", agent.isPublished
                  ? "bg-secondary-container/60 text-on-secondary-container"
                  : "elevated-surface border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high")}>
                {agent.isPublished ? <><Globe className="h-3.5 w-3.5" /> Published</> : <><Lock className="h-3.5 w-3.5" /> Private</>}
              </button>
            </div>
          </div>

          {/* Save button */}
          <motion.button onClick={handleSave} disabled={saving}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="btn-primary w-full py-3">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </motion.button>

          {/* Danger zone */}
          <div className="elevated-surface rounded-2xl p-6 border border-error/20">
            <h2 className="font-semibold font-manrope text-error text-sm mb-2">Danger Zone</h2>
            <p className="text-xs text-on-surface-variant mb-4">Permanently delete this agent and all its conversations. This cannot be undone.</p>
            {confirmDelete ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2 rounded-xl elevated-surface border border-outline-variant/20 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-xl bg-error text-on-error text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Yes, delete it"}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error text-xs font-medium hover:bg-error/20 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
