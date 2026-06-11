"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, ArrowLeft, Loader2, AlertCircle, CheckCircle2,
  Globe, Lock, BookOpen,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const COMMUNITY_TYPES = [
  {
    id: "open",
    icon: Globe,
    label: "Open",
    desc: "Anyone can join and participate",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "study",
    icon: BookOpen,
    label: "Study Group",
    desc: "Focused learning around a topic or course",
    color: "bg-tertiary-fixed/30 text-on-tertiary-fixed",
  },
  {
    id: "private",
    icon: Lock,
    label: "Private",
    desc: "Invite-only membership",
    color: "bg-surface-container text-on-surface-variant",
  },
];

export default function NewCommunityPage() {
  const { status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("open");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleCreate = async () => {
    if (!name.trim()) { setError("Community name is required."); return; }
    if (name.trim().length < 3) { setError("Name must be at least 3 characters."); return; }
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), type }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setCreating(false);
        return;
      }
      router.push(`/communities/${data.slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 pt-24">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-manrope font-bold text-2xl text-primary">Create a Community</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Bring learners together around a subject, course, or topic.
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Type selector */}
          <div className="card p-5">
            <h2 className="font-manrope font-semibold text-base text-primary mb-1">Community type</h2>
            <p className="text-xs text-on-surface-variant mb-4">Choose who can join your community.</p>
            <div className="grid grid-cols-3 gap-3">
              {COMMUNITY_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      "rounded-2xl p-4 border-2 text-left transition-all hover:scale-[1.02]",
                      type === t.id
                        ? "border-secondary shadow-md"
                        : "border-outline-variant/20 hover:border-outline/40"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", t.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="font-manrope font-semibold text-sm text-primary">{t.label}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">{t.desc}</p>
                    {type === t.id && (
                      <div className="flex items-center gap-1 mt-2 text-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & description */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Community name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                placeholder="e.g. MIT 6.006 Study Group"
                maxLength={60}
                className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/60 transition-colors"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-on-surface-variant/50">3–60 characters</p>
                <p className="text-[11px] text-on-surface-variant/50">{name.length}/60</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this community about? What will members learn or share here?"
                maxLength={300}
                rows={3}
                className="w-full px-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/60 transition-colors resize-none"
              />
              <p className="text-[11px] text-on-surface-variant/50 mt-1 text-right">{description.length}/300</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 bg-error-container/20 border border-error/20 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-error shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Link
              href="/communities"
              className="px-5 py-2.5 border border-outline-variant/30 text-on-surface-variant rounded-xl text-sm hover:bg-surface-container transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {creating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              ) : (
                <><Users className="w-4 h-4" /> Create community</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
