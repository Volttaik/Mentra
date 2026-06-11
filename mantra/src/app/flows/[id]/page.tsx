"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2, Trash2, Plus, PackageOpen, BookMarked } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

interface FlowStack {
  id: string;
  addedAt: string;
  stack: {
    id: string; title: string; slug: string; description: string;
    banner: string | null; language: string; isPaid: boolean;
    owner: { name: string; username: string; image: string | null };
    _count: { stars: number; files: number };
  };
}

interface FlowData {
  id: string; name: string; description: string | null; emoji: string;
  createdAt: string; items: FlowStack[]; _count: { items: number };
}

export default function FlowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/flows/${id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setFlow(d); })
      .finally(() => setLoading(false));
  }, [id]);

  const removeStack = async (stackId: string) => {
    setRemoving(stackId);
    await fetch(`/api/flows/${id}/stacks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stackId }),
    });
    setFlow(prev => prev ? { ...prev, items: prev.items.filter(i => i.stack.id !== stackId), _count: { items: prev._count.items - 1 } } : null);
    setRemoving(null);
  };

  const deleteFlow = async () => {
    await fetch(`/api/flows/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 text-secondary animate-spin" /></div>
    </div>
  );

  if (!flow) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <PackageOpen className="w-10 h-10 text-outline-variant" />
        <p className="text-on-surface-variant">Flow not found.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                <BookMarked className="w-5 h-5 text-on-secondary-container" />
              </div>
              <h1 className="font-manrope font-bold text-2xl text-primary truncate">{flow.name}</h1>
            </div>
            {flow.description && <p className="text-sm text-on-surface-variant mt-1">{flow.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
              {flow._count.items} stack{flow._count.items !== 1 ? "s" : ""}
            </span>
            {deleteConfirm ? (
              <div className="flex items-center gap-1">
                <button onClick={deleteFlow} className="text-xs px-3 py-1.5 bg-error text-on-error rounded-xl font-medium">Confirm delete</button>
                <button onClick={() => setDeleteConfirm(false)} className="text-xs px-3 py-1.5 bg-surface-container rounded-xl">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setDeleteConfirm(true)} className="p-2 rounded-xl hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {flow.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-outline-variant" />
            </div>
            <p className="font-manrope font-semibold text-primary">No stacks yet</p>
            <p className="text-sm text-on-surface-variant max-w-xs">Browse stacks and click &quot;Add to Flow&quot; to add them here.</p>
            <Link href="/explore" className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> Explore stacks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flow.items.map(({ stack, id: itemId, addedAt }, i) => (
              <motion.div
                key={itemId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-surface-container-low border border-outline-variant/15 rounded-2xl overflow-hidden hover:border-secondary/30 hover:shadow-lg transition-all"
              >
                {stack.banner ? (
                  <div className="h-32 overflow-hidden">
                    <img src={stack.banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-secondary-container/40 to-surface-container flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-secondary/40" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link href={`/stacks/${stack.slug}`} className="font-manrope font-semibold text-sm text-primary hover:text-secondary transition-colors line-clamp-2">
                        {stack.title}
                      </Link>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{stack.description}</p>
                    </div>
                    <button
                      onClick={() => removeStack(stack.id)}
                      disabled={removing === stack.id}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors"
                    >
                      {removing === stack.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/10">
                    <div className="flex items-center gap-1.5">
                      {stack.owner.image ? (
                        <img src={stack.owner.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-[9px] font-bold text-on-secondary-container">
                          {stack.owner.name[0]}
                        </div>
                      )}
                      <span className="text-xs text-on-surface-variant truncate">{stack.owner.name}</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">Added {new Date(addedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
