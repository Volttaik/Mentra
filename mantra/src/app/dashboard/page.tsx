"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BookOpen, Star, GitFork, Plus, Bell, Activity,
  ChevronRight, Bookmark, CheckCircle, MessageSquare,
  Users, Eye, Loader2, BookMarked, FolderOpen, Trash2, Camera,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ContributionGraph from "@/components/ui/ContributionGraph";
import { formatNumber, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stack {
  id: string; title: string; slug: string; courseCode: string;
  university: string; stars: number; forks: number; modules: { id: string }[];
  updatedDaysAgo: number; tags: string[]; banner?: string | null; profile?: string | null;
  forkedFromId?: string | null;
}
interface ForkedStack {
  id: string; title: string; slug: string; banner: string | null; profile: string | null;
  forkedFromId: string | null; createdAt: string; stars: number;
  forkedFrom: { id: string; title: string; slug: string; ownerName: string; ownerUsername: string } | null;
}
interface Notification {
  id: string; type: string; title: string; body: string; read: boolean; createdAt: string; link?: string;
}
interface Stats {
  stackCount: number; starsReceived: number; followerCount: number; totalViews: number;
}
interface Flow {
  id: string; name: string; emoji: string; description: string | null;
  items: { stack: { id: string; title: string; banner: string | null } }[];
  _count: { items: number };
}
interface Community {
  id: string; slug: string; name: string; myRole: string;
  _count: { members: number; stacks: number }; profile?: string | null;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  STAR:             <Star className="w-3.5 h-3.5" />,
  FORK:             <GitFork className="w-3.5 h-3.5" />,
  COMMENT:          <MessageSquare className="w-3.5 h-3.5" />,
  CONTRIBUTION:     <CheckCircle className="w-3.5 h-3.5" />,
  FOLLOW:           <Users className="w-3.5 h-3.5" />,
  SYSTEM:           <Bell className="w-3.5 h-3.5" />,
  COMMUNITY_INVITE: <Users className="w-3.5 h-3.5" />,
  COMMUNITY_JOIN:   <Users className="w-3.5 h-3.5" />,
};
const NOTIF_COLORS: Record<string, string> = {
  STAR:             "bg-amber-100 text-amber-600",
  FORK:             "bg-blue-100 text-blue-600",
  COMMENT:          "bg-purple-100 text-purple-600",
  CONTRIBUTION:     "bg-green-100 text-green-600",
  FOLLOW:           "bg-pink-100 text-pink-600",
  SYSTEM:           "bg-surface-container text-on-surface-variant",
  COMMUNITY_INVITE: "bg-indigo-100 text-indigo-600",
  COMMUNITY_JOIN:   "bg-teal-100 text-teal-600",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading]             = useState(true);
  const [myStacks, setMyStacks]           = useState<Stack[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookmarks, setBookmarks]         = useState<Stack[]>([]);
  const [stats, setStats]                 = useState<Stats>({ stackCount: 0, starsReceived: 0, followerCount: 0, totalViews: 0 });
  const [flows, setFlows]                 = useState<Flow[]>([]);
  const [communities, setCommunities]     = useState<Community[]>([]);
  const [forkedStacks, setForkedStacks]   = useState<ForkedStack[]>([]);
  const [showCreateFlow, setShowCreateFlow]   = useState(false);
  const [showCreateComm, setShowCreateComm]   = useState(false);
  const [flowName, setFlowName]           = useState("");
  const [commName, setCommName]           = useState("");
  const [creating, setCreating]           = useState(false);
  const [dashLayout, setDashLayout]       = useState("default");
  const [hideStats, setHideStats]         = useState(false);
  const [hideGraph, setHideGraph]         = useState(false);
  const [hideNotifs, setHideNotifs]       = useState(false);
  const [deletingFork, setDeletingFork]   = useState<string | null>(null);
  const [confirmDeleteFork, setConfirmDeleteFork] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mentra-studio-config");
      if (stored) {
        const cfg = JSON.parse(stored);
        if (cfg.layout) setDashLayout(cfg.layout);
        if (cfg.hideStats) setHideStats(!!cfg.hideStats);
        if (cfg.hideGraph) setHideGraph(!!cfg.hideGraph);
        if (cfg.hideNotifs) setHideNotifs(!!cfg.hideNotifs);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setMyStacks(d.myStacks ?? []);
        setNotifications(d.notifications ?? []);
        setBookmarks(d.bookmarks ?? []);
        setForkedStacks(d.forkedStacks ?? []);
        setStats(d.stats ?? { stackCount: 0, starsReceived: 0, followerCount: 0, totalViews: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/flows").then(r => r.json()).then(d => !d.error && setFlows(d)).catch(() => {});
    fetch("/api/communities").then(r => r.json()).then(d => !d.error && setCommunities(d)).catch(() => {});
  }, []);

  const deleteFork = async (slug: string) => {
    setDeletingFork(slug);
    await fetch(`/api/stacks/${slug}`, { method: "DELETE" });
    setForkedStacks(prev => prev.filter(s => s.slug !== slug));
    setConfirmDeleteFork(null);
    setDeletingFork(null);
  };

  const uploadForkProfile = async (slug: string, file: File) => {
    setUploadingProfile(slug);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/stacks/${slug}/profile`, { method: "POST", body: form });
    const data = await res.json();
    if (data.url) {
      setForkedStacks(prev => prev.map(s => s.slug === slug ? { ...s, profile: data.url } : s));
    }
    setUploadingProfile(null);
  };

  const createFlow = async () => {
    if (!flowName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: flowName.trim(), emoji: "flow" }),
    });
    const data = await res.json();
    if (!data.error) { setFlows(prev => [{ ...data, _count: { items: 0 }, items: [] }, ...prev]); setShowCreateFlow(false); setFlowName(""); }
    setCreating(false);
  };

  const createCommunity = async () => {
    if (!commName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: commName.trim() }),
    });
    const data = await res.json();
    if (!data.error) { setCommunities(prev => [{ ...data, myRole: "ADMIN", _count: { members: 1, stacks: 0 } }, ...prev]); setShowCreateComm(false); setCommName(""); }
    setCreating(false);
  };

  const markRead = async (ids?: string[]) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    });
    setNotifications(prev => prev.map(n => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
  };

  const unreadCount  = notifications.filter(n => !n.read).length;
  const displayName  = session?.user?.name?.split(" ")[0] ?? "there";
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const STAT_CARDS = [
    { label: "Stacks",         value: stats.stackCount,    icon: BookOpen, sub: "your repositories" },
    { label: "Stars received", value: stats.starsReceived, icon: Star,     sub: "from the community" },
    { label: "Total views",    value: stats.totalViews,    icon: Eye,      sub: "across all stacks" },
    { label: "Followers",      value: stats.followerCount, icon: Users,    sub: "people following you" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-10 w-full">

        {/* Welcome */}
        <div className="mb-10 flex items-start justify-between animate-fade-in">
          <div>
            <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-1">
              {greeting}, {displayName}
            </h1>
            <p className="text-on-surface-variant text-sm">
              {loading ? "Loading your dashboard…" :
                unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                  : "You're all caught up!"}
            </p>
          </div>
          <Link
            href="/upload"
            className="hidden md:flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 transition-all shadow-card"
          >
            <Plus className="w-4 h-4" />
            New Stack
          </Link>
        </div>

        {/* Stats */}
        {!hideStats && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STAT_CARDS.map((stat, i) => (
            <div
              key={stat.label}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center">
                  <stat.icon className="w-[18px] h-[18px] text-on-secondary-container" />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-16 bg-surface-container rounded animate-pulse mb-1" />
              ) : (
                <p className="font-manrope font-bold text-2xl text-primary">{formatNumber(stat.value)}</p>
              )}
              <p className="text-xs text-on-surface-variant mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>}

        <div className={cn(
          "grid grid-cols-1 gap-8",
          dashLayout === "default" && "lg:grid-cols-3",
          dashLayout === "compact" && "gap-5"
        )}>
          {/* Main column */}
          <div className={cn(
            "space-y-8",
            dashLayout === "default" && "lg:col-span-2",
            dashLayout === "compact" && "space-y-5"
          )}>
            {!hideGraph && <ContributionGraph totalContributions={stats.totalViews} />}

            {/* Fork Management */}
            {forkedStacks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-manrope font-semibold text-lg text-primary flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-secondary" />Fork Management
                  </h2>
                  <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">{forkedStacks.length} fork{forkedStacks.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {forkedStacks.map(fork => (
                    <div key={fork.id} className="card-sm p-4 flex items-center gap-4">
                      <label className="relative group cursor-pointer shrink-0" title="Upload profile picture">
                        {(fork.profile || fork.banner) ? (
                          <img src={fork.profile ?? fork.banner ?? ""} alt="" className="w-10 h-10 rounded-xl object-cover border border-outline-variant/20" />
                        ) : (
                          <div className="w-10 h-10 bg-secondary-container/50 rounded-xl flex items-center justify-center">
                            <GitFork className="w-5 h-5 text-on-secondary-container" />
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {uploadingProfile === fork.slug
                            ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                            : <Camera className="w-4 h-4 text-white" />}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingProfile === fork.slug}
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadForkProfile(fork.slug, f); e.target.value = ""; }}
                        />
                      </label>
                      <div className="flex-1 min-w-0">
                        <Link href={`/stacks/${fork.slug}`} className="font-manrope font-semibold text-sm text-primary hover:text-secondary transition-colors truncate block">{fork.title}</Link>
                        {fork.forkedFrom && (
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Forked from{" "}
                            <Link href={`/stacks/${fork.forkedFrom.slug}`} className="hover:text-secondary transition-colors">{fork.forkedFrom.title}</Link>
                            {" "}by{" "}
                            <Link href={`/profile/${fork.forkedFrom.ownerUsername}`} className="hover:text-secondary transition-colors">{fork.forkedFrom.ownerName}</Link>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/stacks/${fork.slug}/studio`} className="text-xs text-secondary font-medium hover:underline">Edit</Link>
                        {confirmDeleteFork === fork.slug ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteFork(fork.slug)}
                              disabled={deletingFork === fork.slug}
                              className="px-2.5 py-1 bg-error text-on-error rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                            >
                              {deletingFork === fork.slug ? "Deleting…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmDeleteFork(null)} className="px-2.5 py-1 text-xs text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteFork(fork.slug)}
                            className="p-2 text-on-surface-variant hover:text-error rounded-xl hover:bg-error-container/20 transition-colors"
                            title="Delete this fork"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stack Flows */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-manrope font-semibold text-lg text-primary flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-secondary" />Stack Flows
                </h2>
                <button
                  onClick={() => setShowCreateFlow(true)}
                  className="flex items-center gap-1.5 text-sm text-secondary font-medium hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />New Flow
                </button>
              </div>
              {showCreateFlow && (
                <div className="card-sm p-4 mb-4 flex items-center gap-2">
                  <input
                    value={flowName}
                    onChange={e => setFlowName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && createFlow()}
                    placeholder="Flow name..."
                    className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
                    autoFocus
                  />
                  <button onClick={createFlow} disabled={creating || !flowName.trim()} className="px-3 py-1.5 bg-secondary text-on-secondary rounded-lg text-xs font-semibold disabled:opacity-60">
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
                  </button>
                  <button onClick={() => { setShowCreateFlow(false); setFlowName(""); }} className="text-on-surface-variant hover:text-primary text-xs px-2">Cancel</button>
                </div>
              )}
              {loading ? (
                <div className="flex gap-3">
                  {[1, 2, 3].map(i => <div key={i} className="w-36 h-20 bg-surface-container rounded-2xl animate-pulse shrink-0" />)}
                </div>
              ) : flows.length === 0 ? (
                <div className="card-sm p-5 text-center">
                  <FolderOpen className="w-8 h-8 text-outline-variant mx-auto mb-2" />
                  <p className="text-sm text-on-surface-variant">No Stack Flows yet. Create one to organise your stacks.</p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {flows.map(flow => (
                    <Link key={flow.id} href={`/flows/${flow.id}`} className="shrink-0">
                      <div className="w-44 bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 hover:border-secondary/30 hover:shadow-md transition-all cursor-pointer">
                        <BookMarked className="w-5 h-5 text-secondary mb-2" />
                        <p className="font-manrope font-semibold text-sm text-primary truncate">{flow.name}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{flow._count.items} stack{flow._count.items !== 1 ? "s" : ""}</p>
                        {flow.items.length > 0 && (
                          <div className="flex -space-x-1 mt-2">
                            {flow.items.slice(0, 3).map(item => (
                              item.stack.banner
                                ? <img key={item.stack.id} src={item.stack.banner} alt="" className="w-5 h-5 rounded border border-background object-cover" />
                                : <div key={item.stack.id} className="w-5 h-5 rounded bg-secondary-container border border-background flex items-center justify-center text-[7px] font-bold text-on-secondary-container">{item.stack.title[0]}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Communities */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-manrope font-semibold text-lg text-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />Communities
                </h2>
                <button
                  onClick={() => setShowCreateComm(true)}
                  className="flex items-center gap-1.5 text-sm text-secondary font-medium hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />New Community
                </button>
              </div>
              {showCreateComm && (
                <div className="card-sm p-4 mb-4 flex items-center gap-2">
                  <input
                    value={commName}
                    onChange={e => setCommName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && createCommunity()}
                    placeholder="Community name..."
                    className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/50"
                    autoFocus
                  />
                  <button onClick={createCommunity} disabled={creating || !commName.trim()} className="px-3 py-1.5 bg-secondary text-on-secondary rounded-lg text-xs font-semibold disabled:opacity-60">
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
                  </button>
                  <button onClick={() => { setShowCreateComm(false); setCommName(""); }} className="text-on-surface-variant hover:text-primary text-xs px-2">Cancel</button>
                </div>
              )}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-16 bg-surface-container rounded-2xl animate-pulse" />)}
                </div>
              ) : communities.length === 0 ? (
                <div className="card-sm p-5 text-center">
                  <Users className="w-8 h-8 text-outline-variant mx-auto mb-2" />
                  <p className="text-sm text-on-surface-variant">No communities yet. Create one or get invited by peers.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {communities.slice(0, 5).map(comm => (
                    <Link key={comm.id} href={`/communities/${comm.slug}`}>
                      <div className="card-sm p-4 flex items-center gap-3 cursor-pointer hover:-translate-y-0.5 transition-transform duration-150">
                        {comm.profile ? (
                          <img src={comm.profile} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0 border border-outline-variant/20" />
                        ) : (
                          <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-on-secondary-container" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope font-semibold text-sm text-primary truncate">{comm.name}</p>
                          <p className="text-xs text-on-surface-variant">{comm._count.members} members · {comm._count.stacks} stacks</p>
                        </div>
                        {comm.myRole === "ADMIN" && (
                          <span className="text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full shrink-0">Admin</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Your stacks */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-manrope font-semibold text-lg text-primary">Your stacks</h2>
                <Link href="/explore" className="text-sm text-secondary font-medium flex items-center gap-1">
                  Explore all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="card-sm p-4 flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 bg-surface-container rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-surface-container rounded w-3/4" />
                        <div className="h-3 bg-surface-container rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myStacks.length === 0 ? (
                <div className="card p-12 text-center">
                  <BookOpen className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                  <h3 className="font-manrope font-semibold text-primary mb-2">No stacks yet</h3>
                  <p className="text-sm text-on-surface-variant mb-5">
                    Create your first stack to share your knowledge with the world.
                  </p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Create first stack
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myStacks.slice(0, 5).map((stack, i) => (
                    <Link
                      key={stack.id}
                      href={`/stacks/${stack.slug}`}
                      className="block animate-slide-up"
                      style={{ animationDelay: `${200 + i * 50}ms`, animationFillMode: "both" }}
                    >
                      <div className="card-sm p-4 flex items-center gap-4 cursor-pointer group hover:-translate-y-0.5 transition-transform duration-150">
                        {(stack.profile || stack.banner) ? (
                          <img src={stack.profile ?? stack.banner ?? ""} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-outline-variant/20" />
                        ) : (
                          <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-on-secondary-container" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors truncate">
                            {stack.title}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {stack.courseCode && `${stack.courseCode} · `}{stack.university || "No university"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
                          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{formatNumber(stack.stars)}</span>
                          <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" />{formatNumber(stack.forks)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Bookmarked stacks */}
            {!loading && bookmarks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-manrope font-semibold text-lg text-primary">Saved stacks</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookmarks.slice(0, 4).map(stack => (
                    <Link key={stack.id} href={`/stacks/${stack.slug}`}>
                      <div className="card-sm p-5 cursor-pointer group hover:-translate-y-1 transition-transform duration-150">
                        <div className="flex items-start gap-3 mb-3">
                          {(stack.profile || stack.banner) ? (
                            <img src={stack.profile ?? stack.banner ?? ""} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0 border border-outline-variant/20" />
                          ) : (
                            <div className="w-9 h-9 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors leading-snug truncate">
                              {stack.title}
                            </p>
                            <p className="text-xs text-on-surface-variant">{stack.modules.length} module{stack.modules.length !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Star className="w-3.5 h-3.5" />{formatNumber(stack.stars)}
                          <span className="ml-auto">{stack.updatedDaysAgo === 0 ? "today" : `${stack.updatedDaysAgo}d ago`}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar — hidden in focus layout */}
          <div className={cn("space-y-6", dashLayout === "focus" && "hidden")}>
            {/* Notifications */}
            {!hideNotifs && <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope font-semibold text-base text-primary">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-secondary text-on-secondary text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <button onClick={() => markRead()} className="text-xs text-secondary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                      <div className="w-7 h-7 bg-surface-container rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-surface-container rounded w-full" />
                        <div className="h-2.5 bg-surface-container rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="w-8 h-8 text-outline-variant mx-auto mb-2" />
                  <p className="text-sm text-on-surface-variant">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {notifications.slice(0, 6).map(notif => {
                    const inner = (
                      <>
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", NOTIF_COLORS[notif.type] ?? NOTIF_COLORS.SYSTEM)}>
                          {NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.SYSTEM}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-on-surface leading-relaxed line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{timeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 bg-secondary rounded-full mt-1 shrink-0" />}
                      </>
                    );
                    const cls = cn(
                      "flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                      !notif.read ? "bg-secondary-container/30 hover:bg-secondary-container/50" : "hover:bg-surface-container"
                    );
                    return notif.link ? (
                      <Link key={notif.id} href={notif.link} onClick={() => !notif.read && markRead([notif.id])} className={cls}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={notif.id} onClick={() => !notif.read && markRead([notif.id])} className={cls}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>}

            {/* Quick actions */}
            <div className="card p-5">
              <h3 className="font-manrope font-semibold text-base text-primary mb-4">Quick actions</h3>
              <div className="space-y-1.5">
                {[
                  { href: "/upload",   icon: Plus,     color: "bg-secondary-container", iconColor: "text-on-secondary-container", label: "Create a stack",   sub: "Share your academic knowledge" },
                  { href: "/explore",  icon: Activity, color: "bg-surface-container-high", iconColor: "text-on-surface-variant",   label: "Explore stacks",  sub: "Discover community content" },
                  { href: session?.user ? `/profile/${(session.user as any)?.username ?? ""}` : "/dashboard", icon: Bookmark, color: "bg-surface-container-high", iconColor: "text-on-surface-variant", label: "View profile", sub: "See your public profile" },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors group cursor-pointer"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.color)}>
                      <item.icon className={cn("w-4 h-4", item.iconColor)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
