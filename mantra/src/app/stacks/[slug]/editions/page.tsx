"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowLeft, GitBranch, Clock, FileText, Plus, Loader2, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

interface Edition {
  id: string;
  version: string;
  changelog: string | null;
  editorId: string;
  contentCount: number;
  createdAt: string;
}

export default function EditionsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { data: session } = useSession();
  const [editions, setEditions] = useState<Edition[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [changelog, setChangelog] = useState("");
  const [versionType, setVersionType] = useState("minor");

  useEffect(() => {
    fetch(`/api/stacks/${slug}/editions`)
      .then(r => r.json())
      .then(d => {
        setEditions(d.editions ?? []);
        setOwnerId(d.ownerId ?? null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/stacks/${slug}/editions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changelog, versionType }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditions(prev => [data.edition, ...prev]);
        setShowForm(false);
        setChangelog("");
      }
    } finally {
      setCreating(false);
    }
  };

  const isOwner = session?.user?.id === ownerId;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-[900px] mx-auto px-4 md:px-6 py-8 w-full">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
          <Link href={`/stacks/${slug}`} className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />Back to stack
          </Link>
          <span>/</span>
          <span className="text-primary font-medium">Editions</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-manrope font-bold text-2xl text-primary">Edition History</h1>
            <p className="text-sm text-on-surface-variant mt-1">Version control for this stack's knowledge evolution.</p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />New Edition
            </button>
          )}
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-6 space-y-4"
          >
            <h3 className="font-manrope font-semibold text-base text-primary">Create new edition</h3>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Version type</label>
              <div className="flex gap-2">
                {[
                  { value: "minor", label: "Minor (x.+1)" },
                  { value: "major", label: "Major (+1.0)" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setVersionType(opt.value)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border",
                      versionType === opt.value
                        ? "bg-secondary-container border-secondary/30 text-on-secondary-container font-semibold"
                        : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Changelog</label>
              <textarea
                value={changelog}
                onChange={e => setChangelog(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Describe what changed in this edition..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2.5 text-sm">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-primary px-5 py-2.5 text-sm flex-1"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create edition"}
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-surface-container rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container rounded w-1/4" />
                  <div className="h-3 bg-surface-container rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : editions.length === 0 ? (
          <div className="card p-16 text-center">
            <GitBranch className="w-12 h-12 text-outline-variant mx-auto mb-4" />
            <h3 className="font-manrope font-semibold text-primary mb-2">No editions yet</h3>
            <p className="text-sm text-on-surface-variant">
              {isOwner ? "Create the first edition to start tracking version history." : "This stack has no edition history yet."}
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-outline-variant/20" />
            <div className="space-y-4">
              {editions.map((edition, i) => (
                <motion.div
                  key={edition.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative pl-14"
                >
                  <div className="absolute left-2.5 top-5 w-5 h-5 bg-secondary-container border-2 border-background rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                  </div>

                  <div className="card p-5 hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-manrope font-bold text-sm text-secondary bg-secondary-container/50 px-2.5 py-1 rounded-lg">
                            v{edition.version}
                          </span>
                          {i === 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Latest</span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface-variant">
                          {edition.changelog || "No changelog provided"}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(edition.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </span>
                          {edition.contentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {edition.contentCount} content file{edition.contentCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
