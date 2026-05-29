"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Users, BookOpen, Shield, TrendingUp,
  CheckCircle, XCircle, Loader2, Search, Star, GitFork,
  AlertTriangle, RefreshCw, UserCheck, UserX, Archive,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

const TABS = ["Overview", "Stacks", "Users"];

interface Stats {
  totalUsers: number;
  totalStacks: number;
  totalStars: number;
  totalDiscussions: number;
  newUsersThisWeek: number;
  newStacksThisWeek: number;
}
interface AdminStack {
  id: string; title: string; slug: string; courseCode: string | null;
  university: string | null; isVerified: boolean; isArchived: boolean;
  views: number; createdAt: string;
  owner: { name: string; username: string };
  _count: { stars: number; forks: number; discussions: number };
}
interface AdminUser {
  id: string; name: string; username: string; email: string;
  role: string; isVerified: boolean; bannedAt: string | null;
  createdAt: string; university: string | null;
  _count: { stacks: number; stars: number; followers: number };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [stacks, setStacks] = useState<AdminStack[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stackTotal, setStackTotal] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [stackQuery, setStackQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const loadStacks = useCallback(async (q = stackQuery) => {
    const res = await fetch(`/api/admin/stacks?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setStacks(data.stacks ?? []);
      setStackTotal(data.total ?? 0);
    }
  }, [stackQuery]);

  const loadUsers = useCallback(async (q = userQuery) => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
      setUserTotal(data.total ?? 0);
    }
  }, [userQuery]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadStacks(""), loadUsers("")]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadStacks(), 400);
    return () => clearTimeout(t);
  }, [stackQuery]);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 400);
    return () => clearTimeout(t);
  }, [userQuery]);

  const stackAction = async (stackId: string, action: string) => {
    setActionLoading(`${action}-${stackId}`);
    try {
      const res = await fetch("/api/admin/stacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stackId, action }),
      });
      if (res.ok) {
        showToast(`Stack ${action}d successfully`);
        await loadStacks();
      } else {
        const d = await res.json();
        showToast(d.error ?? "Action failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const userAction = async (userId: string, action: string, reason?: string) => {
    setActionLoading(`${action}-${userId}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason }),
      });
      if (res.ok) {
        showToast(`User ${action}ed successfully`);
        await Promise.all([loadUsers(), loadStats()]);
      } else {
        const d = await res.json();
        showToast(d.error ?? "Action failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadge = (role: string) => {
    if (role === "ADMIN") return "bg-error-container text-error";
    if (role === "PROFESSOR") return "bg-secondary-container text-on-secondary-container";
    return "bg-surface-container-high text-on-surface-variant";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-on-primary px-4 py-3 rounded-xl shadow-modal text-sm font-medium">
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-outline-variant/10 px-4 md:px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-error rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-on-error" />
            </div>
            <div>
              <p className="font-manrope font-bold text-sm text-primary leading-none">Mentra Admin</p>
              <p className="text-[10px] text-on-surface-variant">Platform Management</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
            Back to app
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary">Platform Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Real-time data from the production database.</p>
        </div>

        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-8 w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-surface-container-lowest text-primary shadow-card font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total users", value: stats.totalUsers, sub: `+${stats.newUsersThisWeek} this week`, icon: Users },
                { label: "Total stacks", value: stats.totalStacks, sub: `+${stats.newStacksThisWeek} this week`, icon: BookOpen },
                { label: "Total stars", value: stats.totalStars, sub: "All time", icon: Star },
                { label: "Discussions", value: stats.totalDiscussions, sub: "Across all stacks", icon: BarChart3 },
                { label: "New users (7d)", value: stats.newUsersThisWeek, sub: "Last 7 days", icon: TrendingUp },
                { label: "New stacks (7d)", value: stats.newStacksThisWeek, sub: "Last 7 days", icon: GitFork },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="card p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center">
                      <stat.icon className="w-4.5 h-4.5 text-on-secondary-container" size={18} />
                    </div>
                  </div>
                  <p className="font-manrope font-bold text-2xl text-primary">{formatNumber(stat.value)}</p>
                  <p className="text-xs font-medium text-primary mt-0.5">{stat.label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="card p-6 cursor-pointer hover:-translate-y-0.5 transition-all"
                onClick={() => setActiveTab("Stacks")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  <h3 className="font-manrope font-semibold text-base text-primary">Manage Stacks</h3>
                </div>
                <p className="text-sm text-on-surface-variant">Verify, archive, or delete stacks. {stackTotal} total stacks.</p>
              </div>
              <div
                className="card p-6 cursor-pointer hover:-translate-y-0.5 transition-all"
                onClick={() => setActiveTab("Users")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-secondary" />
                  <h3 className="font-manrope font-semibold text-base text-primary">Manage Users</h3>
                </div>
                <p className="text-sm text-on-surface-variant">Verify, promote, or ban users. {userTotal} total users.</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Stacks" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input
                  value={stackQuery}
                  onChange={e => setStackQuery(e.target.value)}
                  placeholder="Search stacks…"
                  className="input-field pl-9"
                />
              </div>
              <p className="text-sm text-on-surface-variant shrink-0">{stackTotal} stacks</p>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/10 bg-surface-container">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Stack</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Owner</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Stars</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stacks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-on-surface-variant">
                          No stacks found.
                        </td>
                      </tr>
                    ) : stacks.map(stack => (
                      <tr key={stack.id} className="border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-primary truncate max-w-[200px]">{stack.title}</p>
                          <p className="text-xs text-on-surface-variant">{stack.courseCode ?? "—"} · {stack.university ?? "—"}</p>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <Link href={`/profile/${stack.owner.username}`} className="text-sm text-secondary hover:underline">
                            @{stack.owner.username}
                          </Link>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <p className="text-sm text-primary font-medium">{formatNumber(stack._count.stars)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit",
                              stack.isVerified ? "bg-green-100 text-green-700" : "bg-surface-container-high text-on-surface-variant"
                            )}>
                              {stack.isVerified ? "Verified" : "Unverified"}
                            </span>
                            {stack.isArchived && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit bg-amber-100 text-amber-700">
                                Archived
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Link href={`/stacks/${stack.slug}`} className="text-xs text-secondary hover:underline px-2 py-1">
                              View
                            </Link>
                            <button
                              onClick={() => stackAction(stack.id, "verify")}
                              disabled={actionLoading === `verify-${stack.id}`}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary"
                              title={stack.isVerified ? "Remove verification" : "Verify"}
                            >
                              {actionLoading === `verify-${stack.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : stack.isVerified ? (
                                <><XCircle className="w-3.5 h-3.5" />Unverify</>
                              ) : (
                                <><CheckCircle className="w-3.5 h-3.5" />Verify</>
                              )}
                            </button>
                            <button
                              onClick={() => stackAction(stack.id, "archive")}
                              disabled={actionLoading === `archive-${stack.id}`}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary"
                              title={stack.isArchived ? "Restore" : "Archive"}
                            >
                              {actionLoading === `archive-${stack.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <><Archive className="w-3.5 h-3.5" />{stack.isArchived ? "Restore" : "Archive"}</>
                              )}
                            </button>
                            <button
                              onClick={() => { if (confirm("Delete this stack permanently?")) stackAction(stack.id, "delete"); }}
                              disabled={actionLoading === `delete-${stack.id}`}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-error-container/20 transition-colors text-error"
                            >
                              {actionLoading === `delete-${stack.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
                <input
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  placeholder="Search users…"
                  className="input-field pl-9"
                />
              </div>
              <p className="text-sm text-on-surface-variant shrink-0">{userTotal} users</p>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/10 bg-surface-container">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">User</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">Stacks</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-on-surface-variant">
                          No users found.
                        </td>
                      </tr>
                    ) : users.map(user => (
                      <tr key={user.id} className={cn(
                        "border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors",
                        user.bannedAt ? "opacity-60" : ""
                      )}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container shrink-0">
                              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-primary">{user.name}</p>
                                {user.bannedAt && <span className="text-[10px] bg-error-container text-error px-1.5 py-0.5 rounded-full font-bold">Banned</span>}
                                {user.isVerified && <UserCheck className="w-3 h-3 text-secondary" />}
                              </div>
                              <p className="text-xs text-on-surface-variant">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <p className="text-sm text-on-surface-variant truncate max-w-[180px]">{user.email}</p>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-full", roleBadge(user.role))}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <p className="text-sm text-primary font-medium">{user._count.stacks}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Link href={`/profile/${user.username}`} className="text-xs text-secondary hover:underline px-2 py-1">
                              View
                            </Link>
                            <button
                              onClick={() => userAction(user.id, "verify")}
                              disabled={actionLoading === `verify-${user.id}`}
                              className="text-xs px-2 py-1 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary"
                            >
                              {user.isVerified ? "Unverify" : "Verify"}
                            </button>
                            <button
                              onClick={() => userAction(user.id, "promote")}
                              disabled={actionLoading === `promote-${user.id}` || user.role === "ADMIN"}
                              className="text-xs px-2 py-1 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary disabled:opacity-40"
                            >
                              Promote
                            </button>
                            {user.bannedAt ? (
                              <button
                                onClick={() => userAction(user.id, "unban")}
                                disabled={actionLoading === `unban-${user.id}`}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-surface-container transition-colors text-secondary"
                              >
                                {actionLoading === `unban-${user.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserX className="w-3.5 h-3.5" />Unban</>}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const reason = prompt("Reason for ban (optional):");
                                  if (reason !== null) userAction(user.id, "ban", reason || "Violation of terms");
                                }}
                                disabled={actionLoading === `ban-${user.id}` || user.role === "ADMIN"}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-error-container/20 transition-colors text-error disabled:opacity-40"
                              >
                                {actionLoading === `ban-${user.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <><AlertTriangle className="w-3.5 h-3.5" />Ban</>}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
