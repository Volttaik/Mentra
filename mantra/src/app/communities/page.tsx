"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Users, Search, Plus, Loader2, BookOpen, Crown } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

interface Community {
  id: string; slug: string; name: string; description: string | null;
  profile: string | null; banner: string | null;
  _count: { members: number; stacks: number };
  myRole?: "ADMIN" | "MEMBER" | null;
}

export default function CommunitiesPage() {
  const { data: session, status } = useSession();
  const [my, setMy] = useState<Community[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    setLoading(true);
    fetch("/api/communities")
      .then(r => r.json())
      .then(d => { if (!d.error) setMy(d ?? []); })
      .finally(() => setLoading(false));
  }, [status]);

  const createCommunity = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!data.error) {
      setMy(prev => [{ ...data, myRole: "ADMIN", _count: { members: 1, stacks: 0 } }, ...prev]);
      setShowCreate(false);
      setNewName("");
    }
    setCreating(false);
  };

  const filtered = my.filter(c =>
    query ? c.name.toLowerCase().includes(query.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-[900px] mx-auto px-4 md:px-6 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-manrope font-bold text-xl md:text-2xl text-primary">Communities</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Learn and collaborate with your peers</p>
          </div>
          {session?.user && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />New
            </button>
          )}
        </div>

        {/* Create community */}
        {showCreate && (
          <div className="card p-5 mb-6 flex items-center gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createCommunity()}
              placeholder="Community name..."
              className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
              autoFocus
            />
            <button onClick={createCommunity} disabled={creating || !newName.trim()} className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-semibold disabled:opacity-60">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
            </button>
            <button onClick={() => { setShowCreate(false); setNewName(""); }} className="text-on-surface-variant hover:text-primary text-xs px-2">Cancel</button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-11 pr-4 py-3 bg-surface-container border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30 placeholder:text-on-surface-variant/50"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-container rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-outline-variant mx-auto mb-4" />
            <p className="font-manrope font-semibold text-primary mb-2">
              {query ? "No matching communities" : "No communities yet"}
            </p>
            <p className="text-sm text-on-surface-variant mb-5">
              {session?.user ? "Create a community or get invited by peers." : "Sign in to create or join communities."}
            </p>
            {!session?.user && (
              <Link href="/login" className="btn-primary">
                Sign in
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(comm => (
              <Link key={comm.id} href={`/communities/${comm.slug}`}>
                <div className="card-sm p-5 cursor-pointer hover:-translate-y-1 transition-transform duration-150 group">
                  <div className="flex items-start gap-4">
                    {comm.profile ? (
                      <img src={comm.profile} alt={comm.name} className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-outline-variant/20" />
                    ) : (
                      <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-on-secondary-container" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors">{comm.name}</p>
                        {comm.myRole === "ADMIN" && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full">
                            <Crown className="w-2.5 h-2.5" />Admin
                          </span>
                        )}
                        {comm.myRole === "MEMBER" && (
                          <span className="text-[9px] font-bold bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded-full">Member</span>
                        )}
                      </div>
                      {comm.description && <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{comm.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Users className="w-3 h-3" />{comm._count.members}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <BookOpen className="w-3 h-3" />{comm._count.stacks}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
