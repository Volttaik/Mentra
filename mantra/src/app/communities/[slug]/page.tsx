"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BookOpen, Shield, Loader2, Trash2,
  LogOut, Settings, Search, X, UserPlus, Crown, AlertCircle,
  MessageCircle, Send, MoreVertical, Image as ImageIcon, Check,
  UserMinus, Star, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

interface Member { id: string; userId: string; role: "ADMIN" | "MEMBER"; joinedAt: string; user: { id: string; name: string; username: string; image: string | null }; }
interface ContribStack {
  id: string; stackId: string; addedAt: string;
  stack: { id: string; title: string; slug: string; description: string; banner: string | null; profile?: string | null; isPaid: boolean; _count: { stars: number }; owner: { name: string; username: string; image: string | null }; };
  contributor: { name: string; username: string; image: string | null };
}
interface CommunityData {
  id: string; slug: string; name: string; description: string | null; banner: string | null; profile: string | null;
  rules: string | null; adminId: string; createdAt: string;
  admin: { id: string; name: string; username: string; image: string | null };
  members: Member[]; stacks: ContribStack[];
  _count: { members: number; stacks: number };
  myRole: "ADMIN" | "MEMBER" | null;
}
interface ChatMessage {
  id: string; content: string; createdAt: string;
  user: { id: string; name: string; username: string; image: string | null };
}
interface InviteUser { id: string; name: string; username: string; image: string | null; isFollower: boolean; }

type Panel = "feed" | "members" | "chat" | "rules" | "settings";

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const inviteId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("inviteId") : null;

  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondingInvite, setRespondingInvite] = useState(false);
  const [inviteHandled, setInviteHandled] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>("feed");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<InviteUser[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [removingStack, setRemovingStack] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({ name: "", description: "", rules: "" });
  const [saving, setSaving] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<NodeJS.Timeout | null>(null);

  // Profile pic state
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/communities/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setCommunity(d);
          setSettingsForm({ name: d.name, description: d.description ?? "", rules: d.rules ?? "" });
          setProfilePreview(d.profile ?? null);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const loadChat = () => {
    fetch(`/api/communities/${slug}/chat`)
      .then(r => r.json())
      .then(d => { if (!d.error) setMessages(d.messages ?? []); })
      .catch(() => {});
  };

  useEffect(() => {
    if (activePanel === "chat" && community?.myRole) {
      setChatLoading(true);
      fetch(`/api/communities/${slug}/chat`)
        .then(r => r.json())
        .then(d => { if (!d.error) setMessages(d.messages ?? []); })
        .finally(() => setChatLoading(false));
      chatPollRef.current = setInterval(loadChat, 10000);
    }
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [activePanel, slug, community?.myRole]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || sendingMsg) return;
    setSendingMsg(true);
    const content = chatInput.trim();
    setChatInput("");
    try {
      const res = await fetch(`/api/communities/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = await res.json();
      if (!d.error) setMessages(prev => [...prev, d.message]);
    } catch { /* ignore */ }
    finally { setSendingMsg(false); }
  };

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
      body: JSON.stringify({ ...settingsForm }),
    });
    setSaving(false);
    load();
  };

  const handleProfileUpload = async (file: File) => {
    setUploadingProfile(true);
    const reader = new FileReader();
    reader.onload = ev => setProfilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");
      const res = await fetch(`/api/communities/${slug}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!data.error) {
        setCommunity(prev => prev ? { ...prev, profile: data.profile } : null);
        setProfilePreview(data.profile);
        setProfileSavedMsg(true);
        setTimeout(() => setProfileSavedMsg(false), 2500);
      }
    } catch { /* ignore */ }
    finally { setUploadingProfile(false); }
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

  const PANELS: { id: Panel; label: string; icon: any; memberOnly?: boolean; adminOnly?: boolean }[] = [
    { id: "feed", label: "Stacks", icon: BookOpen },
    { id: "members", label: "Members", icon: Users },
    ...(isMember ? [{ id: "chat" as Panel, label: "Chat", icon: MessageCircle, memberOnly: true }] : []),
    ...(community.rules ? [{ id: "rules" as Panel, label: "Rules", icon: Shield }] : []),
    ...(isAdmin ? [{ id: "settings" as Panel, label: "Settings", icon: Settings, adminOnly: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
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
              <button onClick={() => respondInvite("accept")} disabled={respondingInvite} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60">
                {respondingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Accept"}
              </button>
              <button onClick={() => respondInvite("decline")} disabled={respondingInvite} className="px-4 py-2 border border-indigo-200 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-50 transition-all disabled:opacity-60">
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Community profile pic */}
            {(profilePreview || community.profile) ? (
              <img
                src={profilePreview ?? community.profile ?? ""}
                alt={community.name}
                className="w-14 h-14 rounded-2xl object-cover shrink-0 border-2 border-outline-variant/20 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-on-secondary-container" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-manrope font-bold text-xl text-primary">{community.name}</h1>
                {isAdmin && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              {community.description && <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{community.description}</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-on-surface-variant">{community._count.members} members</span>
                <span className="text-xs text-on-surface-variant">{community._count.stacks} stacks</span>
                <Link href={`/profile/${community.admin.username}`} className="text-xs text-on-surface-variant hover:text-secondary transition-colors">
                  Admin: {community.admin.name}
                </Link>
              </div>
            </div>

            {/* Right actions */}
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
                  onClick={() => { setShowInvite(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </button>
              )}

              {/* Options menu */}
              {isMember && (
                <div className="relative" ref={optionsRef}>
                  <button
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    className="p-2 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:border-outline/50 transition-all"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showOptionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-10 w-52 bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant/20 py-1.5 z-30"
                      >
                        {isMember && (
                          <button
                            onClick={() => { router.push(`/communities/${slug}/chat`); setShowOptionsMenu(false); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 text-on-surface-variant" />Community Chat
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => { setShowInvite(true); setShowOptionsMenu(false); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                            >
                              <UserPlus className="w-4 h-4 text-on-surface-variant" />Invite Members
                            </button>
                            <button
                              onClick={() => { setActivePanel("settings"); setShowOptionsMenu(false); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                            >
                              <Settings className="w-4 h-4 text-on-surface-variant" />Settings
                            </button>
                          </>
                        )}
                        {isMember && !isAdmin && (
                          <>
                            <div className="border-t border-outline-variant/10 mx-3 my-1" />
                            <button
                              onClick={() => { if (session?.user?.id) { removeMember(session.user.id); } setShowOptionsMenu(false); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-error hover:bg-error-container/20 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />Leave Community
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Mobile tab bar */}
          <div className="flex gap-1 mt-4 pt-4 border-t border-outline-variant/10 overflow-x-auto no-scrollbar">
            {PANELS.map(panel => (
              <button
                key={panel.id}
                onClick={() => panel.id === "chat" ? router.push(`/communities/${slug}/chat`) : setActivePanel(panel.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                  activePanel === panel.id
                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                <panel.icon className="w-3.5 h-3.5" />{panel.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invite panel */}
        <AnimatePresence>
          {showInvite && isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-5 mb-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope font-semibold text-base text-primary">Invite members</h3>
                <button onClick={() => setShowInvite(false)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                  value={inviteQuery}
                  onChange={e => setInviteQuery(e.target.value)}
                  placeholder="Search by name or username…"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30"
                  autoFocus
                />
              </div>
              {inviteResults.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {inviteResults.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container/50 hover:bg-surface-container transition-colors">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden text-xs font-bold font-manrope text-on-secondary-container shrink-0">
                        {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{u.name}</p>
                        <p className="text-xs text-on-surface-variant">@{u.username}</p>
                      </div>
                      {invitedIds.has(u.id) ? (
                        <span className="text-xs text-secondary flex items-center gap-1"><Check className="w-3.5 h-3.5" />Invited</span>
                      ) : (
                        <button
                          onClick={() => sendInvite(u.id)}
                          disabled={!!inviting}
                          className="px-3 py-1.5 bg-secondary text-on-secondary rounded-xl text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                        >
                          {inviting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Invite"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : inviteQuery.length > 1 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">No users found.</p>
              ) : (
                <p className="text-xs text-on-surface-variant/60 text-center py-2">Start typing to search for users to invite.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content — full-width chat layout when chat is active */}
        {activePanel === "chat" && isMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col bg-surface-container-low border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden"
            style={{ height: "calc(100vh - 13rem)", minHeight: "520px" }}
          >
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-outline-variant/10 flex items-center gap-3 bg-surface-container-low shrink-0">
              <button
                onClick={() => setActivePanel("feed")}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-on-secondary-container" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-manrope font-semibold text-sm text-primary">Community Chat</p>
                <p className="text-[11px] text-on-surface-variant">{community._count.members} members</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <MessageCircle className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                  <p className="text-on-surface-variant text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">Be the first to say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.user.id === session?.user?.id;
                  const showAvatar = i === 0 || messages[i - 1].user.id !== msg.user.id;
                  return (
                    <div key={msg.id} className={cn("flex items-end gap-2.5", isMe && "flex-row-reverse")}>
                      {showAvatar ? (
                        <Link href={`/profile/${msg.user.username}`}>
                          <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden text-[10px] font-bold font-manrope text-on-secondary-container shrink-0">
                            {msg.user.image ? <img src={msg.user.image} alt="" className="w-full h-full object-cover" /> : msg.user.name.slice(0, 2).toUpperCase()}
                          </div>
                        </Link>
                      ) : (
                        <div className="w-7 shrink-0" />
                      )}
                      <div className={cn("max-w-xs md:max-w-md lg:max-w-lg", isMe && "items-end flex flex-col")}>
                        {showAvatar && (
                          <p className={cn("text-[11px] text-on-surface-variant mb-1 font-medium", isMe && "text-right")}>
                            {isMe ? "You" : msg.user.name}
                          </p>
                        )}
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          isMe
                            ? "bg-secondary text-on-secondary rounded-br-sm"
                            : "bg-surface-container text-on-surface rounded-bl-sm"
                        )}>
                          {msg.content}
                        </div>
                        <p className="text-[10px] text-on-surface-variant/50 mt-1 px-1">{timeAgo(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-outline-variant/10 shrink-0">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Say something…"
                  className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30 placeholder:text-on-surface-variant/50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingMsg}
                  className="p-2.5 bg-secondary text-on-secondary rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                >
                  {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar nav (desktop) */}
          <div className="hidden lg:block space-y-1">
            <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-3 shadow-sm">
              {PANELS.map(panel => (
                <button
                  key={panel.id}
                  onClick={() => panel.id === "chat" ? router.push(`/communities/${slug}/chat`) : setActivePanel(panel.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activePanel === panel.id
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  <panel.icon className="w-4 h-4 shrink-0" />{panel.label}
                </button>
              ))}
            </div>

            {/* Admin info card */}
            <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 shadow-sm mt-3">
              <p className="text-[11px] text-on-surface-variant/60 uppercase font-bold tracking-wider mb-3">Created by</p>
              <Link href={`/profile/${community.admin.username}`} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container shrink-0">
                  {community.admin.image ? <img src={community.admin.image} alt="" className="w-full h-full object-cover" /> : community.admin.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">{community.admin.name}</p>
                  <p className="text-xs text-on-surface-variant">@{community.admin.username}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Panel content */}
          <div className="lg:col-span-3">

            {/* STACKS FEED */}
            {activePanel === "feed" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {community.stacks.length === 0 ? (
                  <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-12 text-center shadow-sm">
                    <BookOpen className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                    <p className="font-manrope font-semibold text-primary mb-2">No stacks yet</p>
                    <p className="text-sm text-on-surface-variant">Members can add stacks from the stack page.</p>
                  </div>
                ) : (
                  community.stacks.map(cs => (
                    <Link key={cs.id} href={`/stacks/${cs.stack.slug}`} className="block bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 hover:border-secondary/25 hover:shadow-sm transition-all shadow-sm cursor-pointer">
                      <div className="flex items-center gap-3">
                        {(cs.stack.profile || cs.stack.banner) ? (
                          <img src={cs.stack.profile ?? cs.stack.banner ?? ""} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-outline-variant/20" />
                        ) : (
                          <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-on-secondary-container" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope font-semibold text-sm text-primary truncate">{cs.stack.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{cs.stack.description}</p>
                          <div className="flex items-center gap-2.5 mt-1">
                            <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                              <Star className="w-3 h-3" />{cs.stack._count.stars}
                            </span>
                            <span className="text-[11px] text-on-surface-variant/70">by {cs.stack.owner.name}</span>
                          </div>
                        </div>
                        {(isAdmin || cs.contributor.username === (session?.user as any)?.username) && (
                          <button
                            onClick={e => { e.preventDefault(); removeStack(cs.stack.id); }}
                            disabled={removingStack === cs.stack.id}
                            className="p-1.5 text-on-surface-variant hover:text-error rounded-lg transition-colors shrink-0"
                            title="Remove from community"
                          >
                            {removingStack === cs.stack.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </motion.div>
            )}

            {/* MEMBERS */}
            {activePanel === "members" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {community.members.map(m => (
                  <div key={m.id} className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center text-sm font-bold font-manrope text-on-secondary-container shrink-0">
                      {m.user.image ? <img src={m.user.image} alt="" className="w-full h-full object-cover" /> : m.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${m.user.username}`} className="font-medium text-sm text-primary hover:text-secondary transition-colors">{m.user.name}</Link>
                      <p className="text-xs text-on-surface-variant">@{m.user.username}</p>
                    </div>
                    {m.role === "ADMIN" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full">
                        <Crown className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-[10px] text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">Member</span>
                    )}
                    {isAdmin && m.userId !== session?.user?.id && m.role !== "ADMIN" && (
                      <button
                        onClick={() => removeMember(m.userId)}
                        disabled={removingMember === m.userId}
                        className="p-2 text-on-surface-variant hover:text-error rounded-lg transition-colors"
                        title="Remove member"
                      >
                        {removingMember === m.userId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}


            {/* RULES */}
            {activePanel === "rules" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-secondary" />
                    <h3 className="font-manrope font-semibold text-base text-primary">Community Rules</h3>
                  </div>
                  {community.rules ? (
                    <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{community.rules}</div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">No rules set yet.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* SETTINGS (admin only) */}
            {activePanel === "settings" && isAdmin && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                {/* Profile picture */}
                <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-manrope font-semibold text-base text-primary mb-4">Community Picture</h3>
                  <div className="flex items-center gap-5">
                    <div className="relative group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                      {profilePreview ? (
                        <img src={profilePreview} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-outline-variant/20" />
                      ) : (
                        <div className="w-20 h-20 bg-secondary-container rounded-2xl flex items-center justify-center">
                          <Users className="w-9 h-9 text-on-secondary-container" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {uploadingProfile ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <ImageIcon className="w-5 h-5 text-white" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary mb-1">Community profile image</p>
                      <p className="text-xs text-on-surface-variant mb-2">Shown in search results, community header, and dashboards.</p>
                      {profileSavedMsg && (
                        <p className="text-xs text-secondary flex items-center gap-1"><Check className="w-3.5 h-3.5" />Saved!</p>
                      )}
                      <button
                        onClick={() => profileInputRef.current?.click()}
                        disabled={uploadingProfile}
                        className="text-xs font-medium text-secondary hover:underline transition-all disabled:opacity-60"
                      >
                        {uploadingProfile ? "Uploading…" : "Change picture"}
                      </button>
                    </div>
                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleProfileUpload(f); }} />
                  </div>
                </div>

                {/* Name / description / rules */}
                <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="font-manrope font-semibold text-base text-primary">Community Info</h3>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Name</label>
                    <input
                      value={settingsForm.name}
                      onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Description</label>
                    <textarea
                      value={settingsForm.description}
                      onChange={e => setSettingsForm(p => ({ ...p, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Rules</label>
                    <textarea
                      value={settingsForm.rules}
                      onChange={e => setSettingsForm(p => ({ ...p, rules: e.target.value }))}
                      rows={4}
                      placeholder="Add community rules…"
                      className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30 resize-none placeholder:text-on-surface-variant/50"
                    />
                  </div>
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full py-3 bg-secondary text-on-secondary rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        )} {/* end chat ternary */}
      </div>
    </div>
  );
}
