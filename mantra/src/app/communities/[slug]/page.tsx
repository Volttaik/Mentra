"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BookOpen, Shield, Loader2, Trash2,
  LogOut, Settings, Search, X, UserPlus, Crown, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

interface Member { id: string; userId: string; role: "ADMIN" | "MEMBER"; joinedAt: string; user: { id: string; name: string; username: string; image: string | null }; }
interface ContribStack {
  id: string; stackId: string; addedAt: string;
  stack: { id: string; title: string; slug: string; description: string; banner: string | null; isPaid: boolean; _count: { stars: number }; owner: { name: string; username: string; image: string | null }; };
  contributor: { name: string; username: string; image: string | null };
}
interface CommunityData {
  id: string; slug: string; name: string; description: string | null; banner: string | null;
  rules: string | null; adminId: string; createdAt: string;
  admin: { id: string; name: string; username: string; image: string | null };
  members: Member[]; stacks: ContribStack[];
  _count: { members: number; stacks: number };
  myRole: "ADMIN" | "MEMBER" | null;
}

interface InviteUser { id: string; name: string; username: string; image: string | null; isFollower: boolean; }

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const inviteId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("inviteId") : null;

  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondingInvite, setRespondingInvite] = useState(false);
  const [inviteHandled, setInviteHandled] = useState(false);
  const [activePanel, setActivePanel] = useState<"feed" | "members" | "rules" | "settings">("feed");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<InviteUser[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [removingStack, setRemovingStack] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({ name: "", description: "", rules: "" });
  const [saving, setSaving] = useState(false);
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/communities/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setCommunity(d);
          setSettingsForm({ name: d.name, description: d.description ?? "", rules: d.rules ?? "" });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  useEffect(() => {
    if (!showInvite) return;
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetch(`/api/communities/${slug}/invite?q=${encodeURIComponent(inviteQuery)}`)
        .then(r => r.json())
        .then(d => !d.error && setInviteResults(d));
    }, 300);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [inviteQuery, showInvite, slug]);

  const sendInvite = async (userId: string) => {
    setInviting(userId);
    await fetch(`/api/communities/${slug}/invite`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setInvitedIds(prev => new Set([...prev, userId]));
    setInviting(null);
  };

  const removeStack = async (stackId: string) => {
    setRemovingStack(stackId);
    await fetch(`/api/communities/${slug}/stacks`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stackId }),
    });
    setCommunity(prev => prev ? { ...prev, stacks: prev.stacks.filter(s => s.stack.id !== stackId) } : null);
    setRemovingStack(null);
  };

  const removeMember = async (userId: string) => {
    setRemovingMember(userId);
    await fetch(`/api/communities/${slug}/members/${userId}`, { method: "DELETE" });
    if (userId === session?.user?.id) { router.push("/dashboard"); return; }
    setCommunity(prev => prev ? { ...prev, members: prev.members.filter(m => m.userId !== userId) } : null);
    setRemovingMember(null);
  };

  const saveSettings = async () => {
    setSaving(true);
    await fetch(`/api/communities/${slug}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsForm),
    });
    setSaving(false);
    load();
  };

  const respondInvite = async (action: "accept" | "decline") => {
    if (!inviteId) return;
    setRespondingInvite(true);
    await fetch(`/api/communities/${slug}/invite/${inviteId}/respond`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setRespondingInvite(false);
    setInviteHandled(true);
    if (action === "accept") load();
    else router.push("/dashboard");
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 text-secondary animate-spin" /></div>
    </div>
  );

  if (!community) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-10 h-10 text-outline-variant" />
        <p className="text-on-surface-variant">Community not found.</p>
      </div>
    </div>
  );

  const isAdmin = community.myRole === "ADMIN";
  const isMember = !!community.myRole;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Banner */}
      {community.banner ? (
        <div className="h-40 md:h-52 overflow-hidden relative">
          <img src={community.banner} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-secondary-container/60 to-primary-container/30" />
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 w-full flex-1 -mt-6">
        {/* Invite banner */}
        {inviteId && !inviteHandled && !community?.myRole && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700/40 rounded-2xl p-4 mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-manrope font-semibold text-indigo-900 dark:text-indigo-200 text-sm">You&apos;ve been invited to join this community</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Accept to become a member and contribute stacks.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => respondInvite("accept")}
                disabled={respondingInvite}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60"
              >
                {respondingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Accept"}
              </button>
              <button
                onClick={() => respondInvite("decline")}
                disabled={respondingInvite}
                className="px-4 py-2 border border-indigo-200 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-50 transition-all disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-on-secondary-container" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-manrope font-bold text-xl text-primary">{community.name}</h1>
                {isAdmin && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              {community.description && <p className="text-sm text-on-surface-variant mt-1">{community.description}</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-on-surface-variant">{community._count.members} members</span>
                <span className="text-xs text-on-surface-variant">{community._count.stacks} stacks</span>
                <span className="text-xs text-on-surface-variant">Admin: {community.admin.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isMember && !isAdmin && (
                <button
                  onClick={() => session?.user?.id && removeMember(session.user.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:border-error/40 hover:text-error text-xs font-medium transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" /> Leave
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Left sidebar */}
          <div className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
            {[
              { key: "feed", icon: BookOpen, label: "Stacks" },
              { key: "members", icon: Users, label: "Members" },
              { key: "rules", icon: Shield, label: "Rules" },
              ...(isAdmin ? [{ key: "settings", icon: Settings, label: "Settings" }] : []),
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActivePanel(key as any)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                  activePanel === key
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 pb-8">
            {/* Feed */}
            {activePanel === "feed" && (
              <div className="space-y-3">
                {community.stacks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-surface-container-low border border-outline-variant/15 rounded-2xl">
                    <BookOpen className="w-10 h-10 text-outline-variant" />
                    <p className="font-manrope font-semibold text-primary">No stacks yet</p>
                    <p className="text-sm text-on-surface-variant">Members can contribute their stacks to this community.</p>
                  </div>
                ) : (
                  community.stacks.map(({ stack, contributor, addedAt, stackId }, i) => (
                    <motion.div
                      key={stackId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-4 bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 hover:border-secondary/20 transition-all"
                    >
                      {stack.banner ? (
                        <img src={stack.banner} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-secondary-container/30 flex items-center justify-center shrink-0">
                          <BookOpen className="w-6 h-6 text-secondary/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link href={`/stacks/${stack.slug}`} className="font-manrope font-semibold text-primary hover:text-secondary transition-colors line-clamp-1">
                          {stack.title}
                        </Link>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{stack.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5">
                            {contributor.image ? (
                              <img src={contributor.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-[9px] font-bold text-on-secondary-container">
                                {contributor.name[0]}
                              </div>
                            )}
                            <span className="text-xs text-on-surface-variant">{contributor.name}</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant">{new Date(addedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {(isAdmin || contributor.username === session?.user?.name) && (
                        <button
                          onClick={() => removeStack(stack.id)}
                          disabled={removingStack === stack.id}
                          className="p-2 rounded-lg hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors shrink-0 self-start"
                        >
                          {removingStack === stack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Members */}
            {activePanel === "members" && (
              <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl divide-y divide-outline-variant/10">
                {community.members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    {m.user.image ? (
                      <img src={m.user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-sm font-bold text-on-secondary-container">
                        {m.user.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{m.user.name}</p>
                      <p className="text-xs text-on-surface-variant">@{m.user.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.role === "ADMIN" && (
                        <span className="text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}
                      {isAdmin && m.role !== "ADMIN" && (
                        <button
                          onClick={() => removeMember(m.userId)}
                          disabled={removingMember === m.userId}
                          className="p-1.5 rounded-lg hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors"
                        >
                          {removingMember === m.userId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rules */}
            {activePanel === "rules" && (
              <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-secondary" />
                  <h2 className="font-manrope font-bold text-primary">Community Rules</h2>
                </div>
                {community.rules ? (
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{community.rules}</p>
                ) : (
                  <p className="text-sm text-on-surface-variant italic">No rules set for this community yet.</p>
                )}
              </div>
            )}

            {/* Settings (admin only) */}
            {activePanel === "settings" && isAdmin && (
              <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-6 space-y-5">
                <h2 className="font-manrope font-bold text-primary">Community Settings</h2>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Name</label>
                  <input
                    value={settingsForm.name}
                    onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-background border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                  <textarea
                    value={settingsForm.description}
                    onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-background border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Rules & Specifications</label>
                  <p className="text-xs text-on-surface-variant mb-2">E.g. &quot;Stacks must be at least 1,000 words. No duplicate topics.&quot;</p>
                  <textarea
                    value={settingsForm.rules}
                    onChange={e => setSettingsForm(f => ({ ...f, rules: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2.5 bg-background border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
                    placeholder="Enter community rules..."
                  />
                </div>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowInvite(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-md p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope font-bold text-primary">Invite Members</h3>
                <button onClick={() => setShowInvite(false)} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  value={inviteQuery}
                  onChange={e => setInviteQuery(e.target.value)}
                  placeholder="Search users… (followers shown first)"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  autoFocus
                />
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {inviteResults.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-8">
                    {inviteQuery ? "No users found" : "Search to find users to invite"}
                  </p>
                ) : (
                  inviteResults.map(user => (
                    <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-on-secondary-container">
                          {user.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{user.name}</p>
                        <p className="text-xs text-on-surface-variant">@{user.username} {user.isFollower && "· follows you"}</p>
                      </div>
                      <button
                        onClick={() => sendInvite(user.id)}
                        disabled={inviting === user.id || invitedIds.has(user.id)}
                        className={cn(
                          "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                          invitedIds.has(user.id)
                            ? "bg-surface-container text-on-surface-variant cursor-default"
                            : "bg-secondary text-on-secondary hover:opacity-90"
                        )}
                      >
                        {inviting === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : invitedIds.has(user.id) ? "Invited" : "Invite"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
