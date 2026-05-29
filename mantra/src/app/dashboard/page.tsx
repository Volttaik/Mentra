"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  BookOpen, Star, GitFork, Plus, Bell, Activity,
  ChevronRight, Bookmark, CheckCircle, MessageSquare,
  Users, Eye, Loader2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ContributionGraph from "@/components/ui/ContributionGraph";
import { formatNumber, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stack {
  id: string; title: string; slug: string; courseCode: string;
  university: string; stars: number; forks: number; modules: { id: string }[];
  updatedDaysAgo: number; tags: string[];
}
interface Notification {
  id: string; type: string; title: string; body: string; read: boolean; createdAt: string; link?: string;
}
interface Stats {
  stackCount: number; starsReceived: number; followerCount: number; totalViews: number;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  STAR: <Star className="w-3.5 h-3.5" />,
  FORK: <GitFork className="w-3.5 h-3.5" />,
  COMMENT: <MessageSquare className="w-3.5 h-3.5" />,
  CONTRIBUTION: <CheckCircle className="w-3.5 h-3.5" />,
  FOLLOW: <Users className="w-3.5 h-3.5" />,
  SYSTEM: <Bell className="w-3.5 h-3.5" />,
};
const NOTIF_COLORS: Record<string, string> = {
  STAR: "bg-amber-100 text-amber-600",
  FORK: "bg-blue-100 text-blue-600",
  COMMENT: "bg-purple-100 text-purple-600",
  CONTRIBUTION: "bg-green-100 text-green-600",
  FOLLOW: "bg-pink-100 text-pink-600",
  SYSTEM: "bg-surface-container text-on-surface-variant",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [myStacks, setMyStacks] = useState<Stack[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookmarks, setBookmarks] = useState<Stack[]>([]);
  const [stats, setStats] = useState<Stats>({ stackCount: 0, starsReceived: 0, followerCount: 0, totalViews: 0 });

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setMyStacks(d.myStacks ?? []);
        setNotifications(d.notifications ?? []);
        setBookmarks(d.bookmarks ?? []);
        setStats(d.stats ?? { stackCount: 0, starsReceived: 0, followerCount: 0, totalViews: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (ids?: string[]) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    });
    setNotifications(prev => prev.map(n => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayName = session?.user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const STAT_CARDS = [
    { label: "Stacks", value: stats.stackCount, icon: BookOpen, change: "your repositories" },
    { label: "Stars received", value: stats.starsReceived, icon: Star, change: "from the community" },
    { label: "Total views", value: stats.totalViews, icon: Eye, change: "across all stacks" },
    { label: "Followers", value: stats.followerCount, icon: Users, change: "people following you" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-10 w-full">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-1">
              {greeting}, {displayName} ✨
            </h1>
            <p className="text-on-surface-variant text-sm">
              {loading ? "Loading your dashboard…" :
                unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                  : "You're all caught up!"}
            </p>
          </div>
          <Link href="/upload" className="hidden md:flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 transition-all shadow-card">
            <Plus className="w-4 h-4" />
            New Stack
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STAT_CARDS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center">
                  <stat.icon className="w-4.5 h-4.5 text-on-secondary-container" size={18} />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-16 bg-surface-container rounded animate-pulse mb-1" />
              ) : (
                <p className="font-manrope font-bold text-2xl text-primary">{formatNumber(stat.value)}</p>
              )}
              <p className="text-xs text-on-surface-variant mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <ContributionGraph totalContributions={stats.totalViews} />

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
                  <p className="text-sm text-on-surface-variant mb-5">Create your first stack to share your knowledge with the world.</p>
                  <Link href="/upload" className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all">
                    <Plus className="w-4 h-4" /> Create first stack
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myStacks.slice(0, 5).map((stack, i) => (
                    <motion.div
                      key={stack.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                    >
                      <Link href={`/stacks/${stack.slug}`}>
                        <div className="card-sm p-4 flex items-center gap-4 cursor-pointer group hover:-translate-y-0.5 transition-all">
                          <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-on-secondary-container" />
                          </div>
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
                    </motion.div>
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
                      <div className="card-sm p-5 cursor-pointer group hover:-translate-y-1 transition-all">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
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

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="card p-5">
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
                <div className="space-y-2">
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
                      "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer",
                      !notif.read ? "bg-secondary-container/30 hover:bg-secondary-container/50" : "hover:bg-surface-container"
                    );
                    return notif.link ? (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => !notif.read && markRead([notif.id])}
                        className={cls}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && markRead([notif.id])}
                        className={cls}
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="card p-5">
              <h3 className="font-manrope font-semibold text-base text-primary mb-4">Quick actions</h3>
              <div className="space-y-2">
                <Link href="/upload" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors group cursor-pointer">
                  <div className="w-8 h-8 bg-secondary-container rounded-lg flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-on-secondary-container" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">Create a stack</p>
                    <p className="text-xs text-on-surface-variant">Share your academic knowledge</p>
                  </div>
                </Link>
                <Link href="/explore" className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors group cursor-pointer">
                  <div className="w-8 h-8 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">Explore stacks</p>
                    <p className="text-xs text-on-surface-variant">Discover community content</p>
                  </div>
                </Link>
                <Link href={session?.user?.username ? `/profile/${session.user.username}` : "/dashboard"} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors group cursor-pointer">
                  <div className="w-8 h-8 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0">
                    <Bookmark className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">View profile</p>
                    <p className="text-xs text-on-surface-variant">See your public profile</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
