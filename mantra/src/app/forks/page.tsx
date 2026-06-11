"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitFork, Trash2, Loader2, ExternalLink, ArrowLeft, Camera,
  BookOpen, Star, Clock,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

interface ForkedStack {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  profile: string | null;
  stars: number;
  createdAt: string;
  forkedFromId: string | null;
  forkedFrom: {
    id: string;
    title: string;
    slug: string;
    ownerName: string;
    ownerUsername: string;
  } | null;
}

export default function ForksPage() {
  const { status } = useSession();
  const router = useRouter();
  const [forks, setForks] = useState<ForkedStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { if (!d.error) setForks(d.forkedStacks ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  const deleteFork = async (slug: string) => {
    setDeleting(slug);
    const res = await fetch(`/api/stacks/${slug}`, { method: "DELETE" });
    if (res.ok) {
      setForks(prev => prev.filter(f => f.slug !== slug));
    }
    setConfirmDelete(null);
    setDeleting(null);
  };

  const uploadProfile = async (slug: string, file: File) => {
    setUploadingProfile(slug);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/stacks/${slug}/profile`, { method: "POST", body: form });
    const data = await res.json();
    if (data.url) {
      setForks(prev => prev.map(f => f.slug === slug ? { ...f, profile: data.url } : f));
    }
    setUploadingProfile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 pt-24">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-manrope font-bold text-2xl text-primary flex items-center gap-2">
              <GitFork className="w-5 h-5 text-secondary" /> Fork Management
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Manage the stacks you have forked from other authors.
            </p>
          </div>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Explore stacks
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-secondary animate-spin" />
          </div>
        ) : forks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 bg-secondary-container/30 rounded-2xl flex items-center justify-center mb-4">
              <GitFork className="w-8 h-8 text-on-secondary-container/50" />
            </div>
            <h2 className="font-manrope font-semibold text-lg text-primary mb-2">No forks yet</h2>
            <p className="text-sm text-on-surface-variant max-w-xs">
              When you fork someone&apos;s stack, it will appear here so you can manage it.
            </p>
            <Link
              href="/explore"
              className="mt-5 px-5 py-2 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Browse stacks to fork
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant/60 mb-5">
              {forks.length} fork{forks.length !== 1 ? "s" : ""} — click the avatar to upload a profile picture, or delete a fork permanently.
            </p>
            <AnimatePresence initial={false}>
              {forks.map((fork, i) => (
                <motion.div
                  key={fork.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "bg-surface-container-low border rounded-2xl p-4 flex items-center gap-4 transition-all",
                    confirmDelete === fork.slug ? "border-error/30 bg-error-container/5" : "border-outline-variant/15"
                  )}
                >
                  {/* Avatar / profile upload */}
                  <label className="relative group cursor-pointer shrink-0" title="Upload profile picture">
                    {fork.profile || fork.banner ? (
                      <img
                        src={fork.profile ?? fork.banner ?? ""}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/20"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-secondary-container/50 rounded-2xl flex items-center justify-center">
                        <GitFork className="w-6 h-6 text-on-secondary-container" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploadingProfile === fork.slug
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <Camera className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingProfile === fork.slug}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadProfile(fork.slug, f); e.target.value = ""; }}
                    />
                  </label>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/stacks/${fork.slug}`}
                      className="font-manrope font-semibold text-base text-primary hover:text-secondary transition-colors truncate block"
                    >
                      {fork.title}
                    </Link>
                    {fork.forkedFrom && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Forked from{" "}
                        <Link href={`/stacks/${fork.forkedFrom.slug}`} className="hover:text-secondary transition-colors font-medium">
                          {fork.forkedFrom.title}
                        </Link>
                        {" "}by{" "}
                        <Link href={`/profile/${fork.forkedFrom.ownerUsername}`} className="hover:text-secondary transition-colors">
                          {fork.forkedFrom.ownerName}
                        </Link>
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-on-surface-variant/60">
                        <Star className="w-3 h-3" />{fork.stars ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-on-surface-variant/60">
                        <Clock className="w-3 h-3" />{timeAgo(fork.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/stacks/${fork.slug}`}
                      className="p-2 text-on-surface-variant hover:text-secondary rounded-xl hover:bg-surface-container transition-colors"
                      title="View fork"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/stacks/${fork.slug}/studio`}
                      className="px-3 py-1.5 text-xs text-secondary font-medium border border-secondary/30 rounded-xl hover:bg-secondary-container/30 transition-colors"
                    >
                      Edit
                    </Link>
                    {confirmDelete === fork.slug ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => deleteFork(fork.slug)}
                          disabled={deleting === fork.slug}
                          className="px-3 py-1.5 bg-error text-on-error rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-1"
                        >
                          {deleting === fork.slug ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          {deleting === fork.slug ? "Deleting…" : "Delete permanently"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 text-xs text-on-surface-variant border border-outline-variant/30 rounded-xl hover:bg-surface-container transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(fork.slug)}
                        className="p-2 text-on-surface-variant hover:text-error rounded-xl hover:bg-error-container/20 transition-colors"
                        title="Delete this fork"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
