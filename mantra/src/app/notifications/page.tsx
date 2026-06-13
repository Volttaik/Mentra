"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Star, GitFork, MessageSquare, CheckCircle, Users,
  CreditCard, BookOpen, Loader2, CheckCheck, ArrowLeft,
  Check, X, UserPlus, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  STAR:             { icon: Star,          color: "text-amber-600",  bg: "bg-amber-100" },
  FORK:             { icon: GitFork,       color: "text-blue-600",   bg: "bg-blue-100" },
  COMMENT:          { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
  CONTRIBUTION:     { icon: CheckCircle,   color: "text-green-600",  bg: "bg-green-100" },
  FOLLOW:           { icon: UserPlus,      color: "text-pink-600",   bg: "bg-pink-100" },
  SYSTEM:           { icon: Bell,          color: "text-gray-600",   bg: "bg-gray-100" },
  QUIZ:             { icon: BookOpen,      color: "text-teal-600",   bg: "bg-teal-100" },
  CREDIT:           { icon: CreditCard,    color: "text-indigo-600", bg: "bg-indigo-100" },
  COMMUNITY_INVITE: { icon: Users,         color: "text-secondary",  bg: "bg-secondary-container/50" },
  COMMUNITY_JOIN:   { icon: Users,         color: "text-green-600",  bg: "bg-green-100" },
};

function parseInvite(link: string | null): { slug: string; inviteId: string } | null {
  if (!link) return null;
  try {
    const url = new URL(link, "http://x");
    const inviteId = url.searchParams.get("inviteId");
    const slug = url.pathname.split("/").filter(Boolean)[1];
    if (inviteId && slug) return { slug, inviteId };
  } catch { /* ignore */ }
  return null;
}

type FilterTab = "all" | "unread" | "invites";

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [responded, setResponded] = useState<Record<string, "accepted" | "declined">>({});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  const markRead = async (ids: string[]) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarkingAll(false);
  };

  const respondInvite = async (notifId: string, slug: string, inviteId: string, action: "accept" | "decline") => {
    setResponding(notifId);
    try {
      const res = await fetch(`/api/communities/${slug}/invite/${inviteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setResponded(prev => ({ ...prev, [notifId]: action === "accept" ? "accepted" : "declined" }));
        await markRead([notifId]);
      }
    } catch { /* ignore */ }
    setResponding(null);
  };

  const filtered = notifications.filter(n => {
    if (tab === "unread") return !n.read;
    if (tab === "invites") return n.type === "COMMUNITY_INVITE";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const inviteCount = notifications.filter(n => n.type === "COMMUNITY_INVITE" && !responded[n.id]).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 pt-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-manrope font-bold text-lg text-primary flex items-center gap-2">
              <Bell className="w-5 h-5 text-secondary" /> Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-on-surface-variant mt-0.5">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-secondary font-medium border border-secondary/30 rounded-xl hover:bg-secondary-container/30 transition-colors disabled:opacity-50"
            >
              {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-surface-container rounded-2xl p-1">
          {([
            { id: "all",     label: "All",     count: notifications.length },
            { id: "unread",  label: "Unread",  count: unreadCount },
            { id: "invites", label: "Invites", count: inviteCount },
          ] as { id: FilterTab; label: string; count: number }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-background text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  tab === t.id ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface-variant"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-secondary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-on-surface-variant/30" />
            </div>
            <h2 className="font-manrope font-semibold text-lg text-primary mb-1">
              {tab === "unread" ? "All caught up!" : tab === "invites" ? "No pending invites" : "No notifications yet"}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {tab === "unread" ? "You have no unread notifications." : tab === "invites" ? "Community invites will show up here." : "Activity on your stacks and communities will appear here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((notif, i) => {
                const meta = TYPE_META[notif.type] ?? TYPE_META.SYSTEM;
                const Icon = meta.icon;
                const invite = notif.type === "COMMUNITY_INVITE" ? parseInvite(notif.link) : null;
                const inviteResult = responded[notif.id];

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      !notif.read && !inviteResult
                        ? "bg-secondary-container/10 border-secondary/20"
                        : "bg-surface-container-low border-outline-variant/15"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", meta.bg)}>
                        <Icon className={cn("w-4 h-4", meta.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-primary font-manrope leading-snug">{notif.title}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-on-surface-variant/50 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                            {!notif.read && !inviteResult && (
                              <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{notif.body}</p>

                        {/* Community invite actions */}
                        {notif.type === "COMMUNITY_INVITE" && invite && !inviteResult && (
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <button
                              onClick={() => respondInvite(notif.id, invite.slug, invite.inviteId, "accept")}
                              disabled={responding === notif.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
                            >
                              {responding === notif.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Check className="w-3 h-3" />}
                              Accept
                            </button>
                            <button
                              onClick={() => respondInvite(notif.id, invite.slug, invite.inviteId, "decline")}
                              disabled={responding === notif.id}
                              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant/30 text-on-surface-variant rounded-xl text-xs hover:bg-surface-container transition-colors disabled:opacity-60 shrink-0"
                            >
                              <X className="w-3 h-3" />
                              Decline
                            </button>
                            {invite.slug && (
                              <Link
                                href={`/communities/${invite.slug}`}
                                className="flex items-center gap-1 text-xs text-secondary hover:underline"
                              >
                                View community <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Invite result badge */}
                        {inviteResult && (
                          <div className={cn(
                            "inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                            inviteResult === "accepted"
                              ? "bg-green-100 text-green-700"
                              : "bg-surface-container text-on-surface-variant"
                          )}>
                            {inviteResult === "accepted" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {inviteResult === "accepted" ? "Joined community" : "Invite declined"}
                          </div>
                        )}

                        {/* Generic link */}
                        {notif.link && notif.type !== "COMMUNITY_INVITE" && (
                          <Link
                            href={notif.link}
                            onClick={() => !notif.read && markRead([notif.id])}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-secondary hover:underline"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      {/* Mark read button */}
                      {!notif.read && !inviteResult && (
                        <button
                          onClick={() => markRead([notif.id])}
                          className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-secondary hover:bg-secondary-container/30 transition-colors shrink-0 mt-0.5"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
