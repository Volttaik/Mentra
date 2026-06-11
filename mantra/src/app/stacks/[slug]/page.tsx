"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, GitFork, Eye, Shield, Clock, MessageSquare,
  Share2, Bookmark, BookOpen, FileText, Video,
  Music, HelpCircle, ChevronRight, Tag, Plus,
  Code2, ArrowLeft, Loader2, X, Edit2, Trash2,
  AlertTriangle, Send, Upload, File as FileIcon, Check,
  BookOpenCheck, Lock, Maximize2, Bot, BrainCircuit, Info, Coins,
  Zap, MoreHorizontal, Building2, Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatNumber, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import MtViewer from "@/components/MtViewer";
import AiChatModal from "@/components/AiChatModal";
import BuyCreditsModal from "@/components/BuyCreditsModal";
import QuizSection from "@/components/QuizSection";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  lecture: <BookOpen className="w-4 h-4" />,
  assignment: <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  flashcard: <HelpCircle className="w-4 h-4" />,
};

const TABS = ["Overview", "Content", "Modules", "Discussions", "Contributors", "Quiz"];

interface StackData {
  id: string; title: string; slug: string; description: string; courseCode: string;
  university: string; department: string; semester: string; language: string;
  isVerified: boolean; isPublic: boolean; isPaid: boolean; price: number | null;
  views: number; readme: string | null;
  stars: number; forks: number; discussions: number;
  tags: string[];
  owner: { id: string; name: string; username: string; image: string | null; university: string | null; department: string | null };
  modules: { id: string; title: string; type: string; files: number; duration: string | null; order: number }[];
  discussionsList: { id: string; title: string; body: string; resolved: boolean; createdAt: string; author: { name: string; username: string; image: string | null }; replies: number }[];
  contributors: { name: string; username: string; image: string | null }[];
  updatedDaysAgo: number; lastUpdated: string; createdAt: string;
  isStarred: boolean; isBookmarked: boolean; hasPurchased?: boolean;
  banner?: string | null;
  latestMt: { id: string; summary: string; concepts: any; fileName: string; fileType: string } | null;
}

interface DiscComment {
  id: string; body: string; createdAt: string;
  author: { name: string; username: string; image: string | null };
}

interface StackFileRecord {
  id: string; name: string; url: string; rawPath: string | null; size: number; mimeType: string; moduleId: string | null; mtContentId: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StackPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("Overview");
  const [stack, setStack] = useState<StackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starCount, setStarCount] = useState(0);
  const [isStarred, setIsStarred] = useState(false);
  const [forkCount, setForkCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "info" | "error"; text: string } | null>(null);

  // Discussions
  const [showDiscModal, setShowDiscModal] = useState(false);
  const [discTitle, setDiscTitle] = useState("");
  const [discContent, setDiscContent] = useState("");
  const [submittingDisc, setSubmittingDisc] = useState(false);
  const [selectedDiscId, setSelectedDiscId] = useState<string | null>(null);
  const [discComments, setDiscComments] = useState<DiscComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "", description: "", courseCode: "", university: "", department: "",
    semester: "", language: "PDF", isPublic: true, readme: "", tags: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingStack, setDeletingStack] = useState(false);

  // Files
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [moduleFiles, setModuleFiles] = useState<Record<string, StackFileRecord[]>>({});
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadModuleId, setCurrentUploadModuleId] = useState<string | null>(null);

  // All-files Content tab
  const [allFiles, setAllFiles] = useState<StackFileRecord[]>([]);
  const [allFilesLoading, setAllFilesLoading] = useState(false);
  const [allFilesFetched, setAllFilesFetched] = useState(false);

  // MT Viewer
  const [viewerContentId, setViewerContentId] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState<string>("");
  const [viewerPreviewMode, setViewerPreviewMode] = useState(false);

  // AI Chat & Credits
  const [showAiChat, setShowAiChat] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);

  // Add to Flow
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [myFlows, setMyFlows] = useState<{ id: string; name: string; emoji: string; _count: { items: number } }[]>([]);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [addingToFlow, setAddingToFlow] = useState<string | null>(null);
  const [addedFlows, setAddedFlows] = useState<Set<string>>(new Set());

  // Options menu + Add to Community
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [myCommunities, setMyCommunities] = useState<{ id: string; slug: string; name: string; profile: string | null }[]>([]);
  const [commModalLoading, setCommModalLoading] = useState(false);
  const [addingToCommunity, setAddingToCommunity] = useState<string | null>(null);
  const [addedCommunities, setAddedCommunities] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/credits")
        .then(r => r.json())
        .then(d => { if (typeof d.credits === "number") setAiCredits(d.credits); })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stacks/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setStack(d);
        setStarCount(d.stars);
        setIsStarred(d.isStarred);
        setForkCount(d.forks);
        setIsBookmarked(d.isBookmarked);
        setEditForm({
          title: d.title,
          description: d.description,
          courseCode: d.courseCode,
          university: d.university,
          department: d.department,
          semester: d.semester,
          language: d.language,
          isPublic: d.isPublic,
          readme: d.readme ?? "",
          tags: d.tags.join(", "),
        });
      })
      .catch(() => setError("Failed to load stack."))
      .finally(() => setLoading(false));
  }, [slug]);

  const isOwner = session?.user?.id === stack?.owner?.id;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCommunityModal = () => {
    setShowOptionsMenu(false);
    setShowCommunityModal(true);
    setCommModalLoading(true);
    fetch("/api/communities")
      .then(r => r.json())
      .then(d => { if (!d.error) setMyCommunities(d ?? []); })
      .catch(() => {})
      .finally(() => setCommModalLoading(false));
  };

  const addToCommunity = async (communitySlug: string) => {
    if (!stack) return;
    setAddingToCommunity(communitySlug);
    try {
      const res = await fetch(`/api/communities/${communitySlug}/stacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stackId: stack.id }),
      });
      if (res.ok || res.status === 409) {
        setAddedCommunities(prev => new Set([...prev, communitySlug]));
      }
    } catch { /* ignore */ }
    finally { setAddingToCommunity(null); }
  };

  const handleStar = async () => {
    if (!session?.user) return;
    setActionLoading("star");
    try {
      const res = await fetch(`/api/stacks/${slug}/star`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setIsStarred(data.starred); setStarCount(data.count); }
    } finally { setActionLoading(null); }
  };

  const showMessage = (text: string, type: "info" | "error" = "info") => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleFork = async () => {
    if (!session?.user) return;
    setActionLoading("fork");
    try {
      const res = await fetch(`/api/stacks/${slug}/fork`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setForkCount(data.count);
        if (data.forkSlug) router.push(`/stacks/${data.forkSlug}`);
      } else if (res.status === 409) {
        showMessage("You have already forked this stack.", "info");
      } else {
        showMessage(data.error ?? "Fork failed. Try again.", "error");
      }
    } finally { setActionLoading(null); }
  };

  const handleBookmark = async () => {
    if (!session?.user) return;
    setActionLoading("bookmark");
    try {
      const res = await fetch(`/api/stacks/${slug}/bookmark`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setIsBookmarked(data.bookmarked);
    } finally { setActionLoading(null); }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Discussions
  const handleCreateDiscussion = async () => {
    if (!discTitle.trim() || !stack) return;
    setSubmittingDisc(true);
    try {
      const res = await fetch(`/api/stacks/${slug}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: discTitle.trim(), body: discContent.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStack(prev => prev ? {
          ...prev,
          discussionsList: [data.discussion ?? {
            id: data.id ?? Date.now().toString(),
            title: discTitle.trim(),
            body: discContent.trim(),
            resolved: false,
            createdAt: new Date().toISOString(),
            author: { name: session?.user?.name ?? "", username: (session?.user as any)?.username ?? "", image: null },
            replies: 0,
          }, ...prev.discussionsList],
        } : prev);
        setDiscTitle("");
        setDiscContent("");
        setShowDiscModal(false);
      }
    } finally { setSubmittingDisc(false); }
  };

  const handleSelectDiscussion = async (discId: string) => {
    if (selectedDiscId === discId) {
      setSelectedDiscId(null);
      return;
    }
    setSelectedDiscId(discId);
    setLoadingComments(true);
    setDiscComments([]);
    try {
      const res = await fetch(`/api/stacks/${slug}/discussions/${discId}/comments`);
      const data = await res.json();
      if (res.ok) setDiscComments(data.comments ?? []);
    } finally { setLoadingComments(false); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedDiscId) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/stacks/${slug}/discussions/${selectedDiscId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setDiscComments(prev => [...prev, data.comment]);
        setNewComment("");
        setStack(prev => prev ? {
          ...prev,
          discussionsList: prev.discussionsList.map(d =>
            d.id === selectedDiscId ? { ...d, replies: d.replies + 1 } : d
          ),
        } : prev);
      }
    } finally { setSubmittingComment(false); }
  };

  // Edit stack
  const handleEditStack = async () => {
    if (!stack) return;
    setSavingEdit(true);
    try {
      const tagsArr = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/stacks/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, tags: tagsArr }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        if (data.slug && data.slug !== slug) {
          router.push(`/stacks/${data.slug}`);
        } else {
          const refreshed = await fetch(`/api/stacks/${slug}`).then(r => r.json());
          if (!refreshed.error) setStack(refreshed);
        }
        showMessage("Stack updated successfully.");
      } else {
        showMessage(data.error ?? "Failed to save changes.", "error");
      }
    } finally { setSavingEdit(false); }
  };

  // Delete stack
  const handleDeleteStack = async () => {
    setDeletingStack(true);
    try {
      const res = await fetch(`/api/stacks/${slug}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setShowDeleteConfirm(false);
        showMessage(data.error ?? "Failed to delete stack.", "error");
      }
    } finally { setDeletingStack(false); }
  };

  const openFlowModal = async () => {
    setShowFlowModal(true);
    if (myFlows.length > 0) return;
    setFlowsLoading(true);
    fetch("/api/flows").then(r => r.json()).then(d => { if (!d.error) setMyFlows(d); }).finally(() => setFlowsLoading(false));
  };

  const addToFlow = async (flowId: string) => {
    if (!stack) return;
    setAddingToFlow(flowId);
    await fetch(`/api/flows/${flowId}/stacks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stackId: stack.id }),
    });
    setAddedFlows(prev => new Set([...prev, flowId]));
    setAddingToFlow(null);
  };

  // Fetch all stack files for Content tab
  const fetchAllFiles = async () => {
    if (allFilesFetched) return;
    setAllFilesLoading(true);
    try {
      const res = await fetch(`/api/stacks/${slug}/files`);
      const data = await res.json();
      if (res.ok) {
        setAllFiles(data.files ?? []);
        setAllFilesFetched(true);
      }
    } catch {}
    setAllFilesLoading(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "Content") fetchAllFiles();
  };

  // File upload
  const handleModuleExpand = async (moduleId: string) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
      return;
    }
    setExpandedModule(moduleId);
    if (moduleFiles[moduleId]) return;
    try {
      const res = await fetch(`/api/stacks/${slug}/files?moduleId=${moduleId}`);
      const data = await res.json();
      if (res.ok) setModuleFiles(prev => ({ ...prev, [moduleId]: data.files ?? [] }));
    } catch {}
  };

  const handleUploadClick = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentUploadModuleId(moduleId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadModuleId) return;
    setUploadingFor(currentUploadModuleId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("moduleId", currentUploadModuleId);
      const res = await fetch(`/api/stacks/${slug}/files`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.file) {
        setModuleFiles(prev => ({
          ...prev,
          [currentUploadModuleId]: [...(prev[currentUploadModuleId] ?? []), data.file],
        }));
        setStack(prev => prev ? {
          ...prev,
          modules: prev.modules.map(m =>
            m.id === currentUploadModuleId ? { ...m, files: m.files + 1 } : m
          ),
        } : prev);
      } else {
        showMessage(data.error ?? "Upload failed.", "error");
      }
    } finally {
      setUploadingFor(null);
      setCurrentUploadModuleId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !stack) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h2 className="font-manrope font-bold text-2xl text-primary">Stack not found</h2>
          <p className="text-on-surface-variant">{error || "This stack doesn't exist."}</p>
          <Link href="/explore" className="btn-primary">Browse stacks</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* Inline action feedback banner */}
      {actionMessage && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-modal text-sm font-medium transition-all ${
          actionMessage.type === "error"
            ? "bg-error text-on-error"
            : "bg-secondary-container text-on-secondary-container border border-secondary/20"
        }`}>
          {actionMessage.text}
        </div>
      )}

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-8 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
          <Link href="/explore" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />Explore
          </Link>
          <span>/</span>
          <Link href={`/profile/${stack.owner.username}`} className="hover:text-primary transition-colors">
            {stack.owner.username}
          </Link>
          <span>/</span>
          <span className="text-primary font-medium">{stack.slug}</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden mb-6">
          {/* Banner */}
          {stack.banner && (
            <div className="h-40 md:h-52 relative overflow-hidden">
              <img src={stack.banner} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className={cn("p-6 md:p-8", stack.banner && "-mt-10 relative z-10")}>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {stack.courseCode && <span className="tag-accent text-xs">{stack.courseCode}</span>}
                {stack.university && <span className="tag text-xs">{stack.university}</span>}
                {stack.semester && <span className="tag text-xs">{stack.semester}</span>}
                {!stack.isPublic && (
                  <span className="flex items-center gap-1 text-xs font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline-variant/20">
                    <Lock className="w-3 h-3" />Private
                  </span>
                )}
                {stack.isPaid && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    ₦{stack.price?.toLocaleString()} · Paid
                  </span>
                )}
                {stack.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-container/60 px-3 py-1 rounded-full border border-secondary/20">
                    <Shield className="w-3 h-3" />Verified
                  </span>
                )}
              </div>
              <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-3 leading-tight">{stack.title}</h1>
              <p className="text-on-surface-variant leading-relaxed mb-4 max-w-2xl">{stack.description}</p>

              <div className="flex flex-wrap gap-2 mb-5">
                {stack.tags.map(tag => <span key={tag} className="tag text-xs">{tag}</span>)}
              </div>

              <Link href={`/profile/${stack.owner.username}`} className="flex items-center gap-3 w-fit group">
                <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container overflow-hidden">
                  {stack.owner.image
                    ? <img src={stack.owner.image} alt="" className="w-full h-full object-cover" />
                    : stack.owner.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <span className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">{stack.owner.name}</span>
                  <span className="text-on-surface-variant text-sm"> · {stack.owner.department ?? stack.owner.university}</span>
                </div>
              </Link>

              {/* Owner actions */}
              {isOwner && (
                <div className="flex items-center gap-2 mt-5 pt-5 border-t border-outline-variant/10 flex-wrap">
                  <Link
                    href={`/stacks/${slug}/studio`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-secondary-container text-on-secondary-container hover:opacity-90 transition-all font-manrope"
                  >
                    <Code2 className="w-3 h-3" />Studio
                  </Link>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-container hover:bg-surface-container-high transition-all text-primary"
                  >
                    <Edit2 className="w-3 h-3" />Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-error/20 text-error hover:bg-error-container/20 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />Delete
                  </button>
                </div>
              )}
            </div>

            {/* Action sidebar */}
            <div className="flex flex-col gap-3 shrink-0 md:w-48">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Stars", value: formatNumber(starCount), icon: Star },
                  { label: "Forks", value: formatNumber(forkCount), icon: GitFork },
                  { label: "Views", value: formatNumber(stack.views), icon: Eye },
                ].map(stat => (
                  <div key={stat.label} className="bg-surface-container rounded-xl p-2">
                    <stat.icon className="w-4 h-4 text-on-surface-variant mx-auto mb-1" />
                    <p className="font-manrope font-bold text-sm text-primary">{stat.value}</p>
                    <p className="text-[10px] text-on-surface-variant">{stat.label}</p>
                  </div>
                ))}
              </div>

              {session?.user ? (
                <>
                  <button
                    onClick={handleStar}
                    disabled={actionLoading === "star"}
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-manrope transition-all",
                      isStarred
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-primary text-on-primary hover:opacity-90"
                    )}
                  >
                    {actionLoading === "star" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={cn("w-3.5 h-3.5", isStarred && "fill-current")} />}
                    {isStarred ? "Starred" : "Star"}
                  </button>
                  <button
                    onClick={handleFork}
                    disabled={actionLoading === "fork"}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-manrope bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high transition-all"
                  >
                    {actionLoading === "fork" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitFork className="w-3.5 h-3.5" />}
                    Fork
                  </button>
                  <button
                    onClick={() => setShowAiChat(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-manrope bg-secondary-container/40 border border-secondary/20 text-secondary hover:bg-secondary-container/60 hover:border-secondary/40 transition-all"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Ask AI
                    <span className="ml-auto flex items-center gap-0.5 text-[10px] text-on-surface-variant font-normal">
                      <Coins className="w-2.5 h-2.5" />{aiCredits}
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBookmark}
                      disabled={actionLoading === "bookmark"}
                      className={cn(
                        "flex-1 flex items-center justify-center py-2 rounded-xl transition-all border",
                        isBookmarked
                          ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
                          : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                      )}
                      title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                    >
                      <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all"
                      title="Copy link"
                    >
                      {copied ? <Check className="w-4 h-4 text-secondary" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={openFlowModal}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-manrope border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:border-secondary/30 hover:text-secondary transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />Add to Flow
                  </button>
                  <button
                    onClick={openCommunityModal}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-manrope border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:border-secondary/30 hover:text-secondary transition-all"
                  >
                    <Building2 className="w-3.5 h-3.5" />Add to Community
                  </button>

                  {/* Options menu */}
                  <div className="relative" ref={optionsMenuRef}>
                    <button
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium font-manrope border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />More options
                    </button>
                    <AnimatePresence>
                      {showOptionsMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute bottom-10 left-0 right-0 bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant/20 py-1.5 z-30"
                        >
                          <button onClick={() => { handleShare(); setShowOptionsMenu(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors">
                            <Share2 className="w-4 h-4 text-on-surface-variant" />{copied ? "Link copied!" : "Copy link"}
                          </button>
                          <button onClick={() => { handleBookmark(); setShowOptionsMenu(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors">
                            <Bookmark className={cn("w-4 h-4 text-on-surface-variant", isBookmarked && "fill-current text-secondary")} />{isBookmarked ? "Remove bookmark" : "Bookmark"}
                          </button>
                          <button onClick={() => { openFlowModal(); setShowOptionsMenu(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors">
                            <Zap className="w-4 h-4 text-on-surface-variant" />Add to Flow
                          </button>
                          <button onClick={openCommunityModal} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors">
                            <Building2 className="w-4 h-4 text-on-surface-variant" />Add to Community
                          </button>
                          {isOwner && (
                            <>
                              <div className="border-t border-outline-variant/10 mx-3 my-1" />
                              <button onClick={() => { setShowEditModal(true); setShowOptionsMenu(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors">
                                <Edit2 className="w-4 h-4 text-on-surface-variant" />Edit stack
                              </button>
                              <button onClick={() => { setShowDeleteConfirm(true); setShowOptionsMenu(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-error hover:bg-error-container/20 transition-colors">
                                <Trash2 className="w-4 h-4" />Delete stack
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Link href={`/login?callbackUrl=/stacks/${slug}`} className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-manrope bg-primary text-on-primary hover:opacity-90 transition-all">
                  Sign in to interact
                </Link>
              )}

              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <Clock className="w-3 h-3" />
                Updated {stack.updatedDaysAgo === 0 ? "today" : `${stack.updatedDaysAgo}d ago`}
              </div>
            </div>
          </div>

          {stack.contributors && stack.contributors.length > 0 && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-outline-variant/10">
              <span className="text-xs text-on-surface-variant">Contributors:</span>
              <div className="flex -space-x-2">
                {[stack.owner, ...stack.contributors].slice(0, 6).map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-secondary-container border-2 border-background flex items-center justify-center text-[10px] font-bold text-on-secondary-container font-manrope" title={c.name}>
                    {c.image ? <img src={c.image} alt="" className="w-full h-full rounded-full object-cover" /> : c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-on-surface-variant">{1 + stack.contributors.length} contributors</span>
            </div>
          )}
          </div>
        </motion.div>

        {/* Tabs — full-width wrapper so overflow-x-auto actually triggers */}
        <div className="w-full overflow-x-auto no-scrollbar mb-8">
          <div className="flex gap-1 bg-surface-container rounded-2xl p-1 w-fit min-w-full sm:min-w-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                  activeTab === tab
                    ? "bg-surface-container-lowest text-primary shadow-card font-semibold"
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {tab}
                {tab === "Discussions" && stack.discussionsList.length > 0 && (
                  <span className="text-xs bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full">
                    {stack.discussionsList.length}
                  </span>
                )}
                {tab === "Content" && allFilesFetched && allFiles.length > 0 && (
                  <span className="text-xs bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full">
                    {allFiles.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "Overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
  
                <div className="card p-8">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-outline-variant/10">
                    <Code2 className="w-5 h-5 text-on-surface-variant" />
                    <h2 className="font-manrope font-semibold text-base text-primary">README.md</h2>
                    {isOwner && (
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="ml-auto text-xs text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />Edit
                      </button>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none space-y-4">
                    {stack.readme ? (
                      <div className="text-on-surface-variant leading-relaxed whitespace-pre-wrap text-sm">{stack.readme}</div>
                    ) : (
                      <>
                        <h2 className="font-manrope font-bold text-xl text-primary">{stack.title}</h2>
                        <p className="text-on-surface-variant leading-relaxed">
                          Welcome to the {stack.title} knowledge stack. This is a community resource{stack.courseCode ? ` for ${stack.courseCode}` : ""}{stack.university ? ` at ${stack.university}` : ""}.
                        </p>
                        {stack.modules.length > 0 && (
                          <>
                            <h3 className="font-manrope font-semibold text-base text-primary mt-4">What&apos;s included</h3>
                            <ul className="space-y-2">
                              {stack.modules.map(m => (
                                <li key={m.id} className="flex items-center gap-2 text-sm text-on-surface-variant">
                                  <Check className="w-4 h-4 text-secondary shrink-0" />
                                  <span>{m.title}</span>
                                  {m.duration && <span className="text-xs text-outline">({m.duration})</span>}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {!stack.latestMt && isOwner && (
                          <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-4 mt-4 flex items-start gap-3">
                            <Upload className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-primary">No content uploaded yet</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">Go to the Modules tab to upload files to your stack modules.</p>
                            </div>
                          </div>
                        )}
                        <div className="bg-secondary-container/30 border border-secondary/10 rounded-xl p-4 mt-4 flex items-start gap-2">
                          <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <p className="text-sm text-on-secondary-container font-medium">
                            This stack follows the Mentra Academic Integrity Guidelines.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Content" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-on-surface-variant">
                    {allFilesLoading ? (
                      <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading files…</span>
                    ) : (
                      <><span className="font-semibold text-primary">{allFiles.length}</span> file{allFiles.length !== 1 ? "s" : ""} in this stack</>
                    )}
                  </p>
                  {isOwner && (
                    <p className="text-xs text-on-surface-variant">Upload files from the Modules tab</p>
                  )}
                </div>

                {allFilesLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="card p-5 animate-pulse flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface-container rounded-xl shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-surface-container rounded w-2/3" />
                          <div className="h-3 bg-surface-container rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!allFilesLoading && allFiles.length === 0 && (
                  <div className="card p-16 text-center">
                    <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileIcon className="w-8 h-8 text-outline-variant" />
                    </div>
                    <h3 className="font-manrope font-semibold text-primary mb-2">No content yet</h3>
                    <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                      {isOwner
                        ? "Upload files to your modules to make them available here. Go to the Modules tab to get started."
                        : "The owner hasn't uploaded any content yet. Check back soon."}
                    </p>
                  </div>
                )}

                {!allFilesLoading && allFiles.length > 0 && (
                  <div className="space-y-3">
                    {allFiles.map((f, i) => {
                      const ext = f.name.split(".").pop()?.toUpperCase() ?? "FILE";
                      return (
                        <motion.div
                          key={f.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="card p-5 flex items-center gap-4 group"
                        >
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-manrope",
                            f.mtContentId
                              ? "bg-secondary-container text-on-secondary-container"
                              : "bg-surface-container text-on-surface-variant"
                          )}>
                            {f.mtContentId ? <BookOpenCheck className="w-4 h-4" /> : ext.slice(0, 3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-primary truncate">{f.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-on-surface-variant">{formatFileSize(f.size)}</span>
                              {f.mtContentId ? (
                                <span className="text-xs text-secondary font-medium">Readable</span>
                              ) : (
                                <span className="text-xs text-on-surface-variant">{ext}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {f.mtContentId ? (
                              stack.isPaid && !isOwner && !stack.hasPurchased ? (
                                <button
                                  onClick={() => { setViewerContentId(f.mtContentId!); setViewerFileName(f.name); setViewerPreviewMode(true); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-surface-container border border-secondary/30 text-secondary rounded-xl text-xs font-semibold font-manrope hover:bg-secondary-container/30 transition-all"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />Preview
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setViewerContentId(f.mtContentId!); setViewerFileName(f.name); setViewerPreviewMode(false); }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-on-secondary rounded-xl text-xs font-semibold font-manrope hover:opacity-90 transition-all"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />Read
                                </button>
                              )
                            ) : f.rawPath !== undefined && f.rawPath !== null ? (
                              <a
                                href={`/pdf-view/${f.id}?stack=${slug}&name=${encodeURIComponent(f.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-on-secondary rounded-xl text-xs font-semibold font-manrope hover:opacity-90 transition-all"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />View
                              </a>
                            ) : f.url ? (
                              <span className="text-xs text-on-surface-variant px-3 py-1.5 bg-surface-container rounded-xl">Available</span>
                            ) : (
                              <span className="text-xs text-on-surface-variant px-3 py-1.5 bg-surface-container rounded-xl">Stored</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "Modules" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {stack.modules.length === 0 ? (
                  <div className="card p-12 text-center">
                    <BookOpen className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                    <p className="font-manrope font-semibold text-primary">No modules yet</p>
                    <p className="text-sm text-on-surface-variant mt-1">Modules will appear here once they&apos;re added.</p>
                  </div>
                ) : (
                  stack.modules.map((module, i) => (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <div
                        className="card-sm p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-all cursor-pointer"
                        onClick={() => handleModuleExpand(module.id)}
                      >
                        <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center text-on-secondary-container shrink-0">
                          {MODULE_ICONS[module.type] ?? <BookOpen className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors">
                            Module {String(i + 1).padStart(2, "0")} — {module.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                            <span>{module.files} files</span>
                            {module.duration && <><span>·</span><span>{module.duration}</span></>}
                            <span className="capitalize">· {module.type}</span>
                          </div>
                        </div>
                        {isOwner && (
                          <button
                            onClick={e => handleUploadClick(module.id, e)}
                            disabled={uploadingFor === module.id}
                            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container"
                          >
                            {uploadingFor === module.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <><Upload className="w-3.5 h-3.5" />Upload</>
                            )}
                          </button>
                        )}
                        <ChevronRight className={cn("w-4 h-4 text-on-surface-variant transition-transform", expandedModule === module.id && "rotate-90")} />
                      </div>

                      {expandedModule === module.id && (
                        <div className="border border-outline-variant/10 rounded-b-2xl bg-surface-container-low px-5 pb-4 pt-3 -mt-2 space-y-2">
                          {moduleFiles[module.id] === undefined ? (
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading files…
                            </div>
                          ) : moduleFiles[module.id].length === 0 ? (
                            <p className="text-xs text-on-surface-variant py-2">No files uploaded yet.{isOwner ? " Click Upload to add files." : ""}</p>
                          ) : (
                            moduleFiles[module.id].map(f => (
                              <div
                                key={f.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-all group/file"
                              >
                                <div className="w-7 h-7 bg-secondary-container/60 rounded-lg flex items-center justify-center shrink-0">
                                  {f.mtContentId ? (
                                    <BookOpenCheck className="w-3.5 h-3.5 text-secondary" />
                                  ) : (
                                    <FileIcon className="w-3.5 h-3.5 text-secondary" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-primary truncate">{f.name}</p>
                                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                                    {formatFileSize(f.size)}
                                  </p>
                                </div>
                                {f.mtContentId ? (
                                  stack.isPaid && !isOwner && !stack.hasPurchased ? (
                                    <button
                                      onClick={() => { setViewerContentId(f.mtContentId!); setViewerFileName(f.name); setViewerPreviewMode(true); }}
                                      className="flex items-center gap-1.5 text-xs font-medium text-secondary border border-secondary/30 bg-surface-container hover:bg-secondary-container/30 px-3 py-1.5 rounded-lg transition-all"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      Preview
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => { setViewerContentId(f.mtContentId!); setViewerFileName(f.name); setViewerPreviewMode(false); }}
                                      className="flex items-center gap-1.5 text-xs font-medium text-secondary bg-secondary-container/40 hover:bg-secondary-container px-3 py-1.5 rounded-lg transition-all"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      Read
                                    </button>
                                  )
                                ) : f.rawPath !== undefined && f.rawPath !== null ? (
                                  <a
                                    href={`/pdf-view/${f.id}?stack=${slug}&name=${encodeURIComponent(f.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-medium text-secondary bg-secondary-container/40 hover:bg-secondary-container px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    View
                                  </a>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "Discussions" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-end">
                  {session?.user ? (
                    <button
                      onClick={() => setShowDiscModal(true)}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4" />New Discussion
                    </button>
                  ) : (
                    <Link href={`/login?callbackUrl=/stacks/${slug}`} className="btn-primary">
                      Sign in to discuss
                    </Link>
                  )}
                </div>
                {stack.discussionsList.length === 0 ? (
                  <div className="card p-12 text-center">
                    <MessageSquare className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                    <p className="font-manrope font-semibold text-primary">No discussions yet</p>
                    <p className="text-sm text-on-surface-variant mt-1">Start a discussion to ask questions or share ideas.</p>
                  </div>
                ) : (
                  stack.discussionsList.map((disc, i) => (
                    <div key={disc.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={cn(
                          "card-sm p-5 group transition-all cursor-pointer",
                          selectedDiscId === disc.id ? "border-secondary/30 bg-secondary-container/5" : "hover:-translate-y-0.5"
                        )}
                        onClick={() => handleSelectDiscussion(disc.id)}
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className={cn("w-5 h-5 mt-0.5 shrink-0", disc.resolved ? "text-green-500" : "text-secondary")} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium text-sm text-primary group-hover:text-secondary transition-colors">{disc.title}</p>
                              {disc.resolved && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Resolved</span>}
                            </div>
                            {disc.body && (
                              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{disc.body}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                              <span>by @{disc.author.username}</span>
                              <span>·</span><span>{disc.replies} replies</span>
                              <span>·</span><span>{timeAgo(disc.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {selectedDiscId === disc.id && (
                        <div className="border border-outline-variant/10 border-t-0 rounded-b-2xl bg-surface-container-low px-5 pb-4 pt-4 space-y-3 -mt-1">
                          {loadingComments ? (
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading replies…
                            </div>
                          ) : discComments.length === 0 ? (
                            <p className="text-xs text-on-surface-variant py-2">No replies yet. Be the first to reply!</p>
                          ) : (
                            discComments.map(comment => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-7 h-7 bg-secondary-container rounded-full flex items-center justify-center text-[10px] font-bold text-on-secondary-container shrink-0 mt-0.5">
                                  {comment.author.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-primary">@{comment.author.username}</span>
                                    <span className="text-xs text-on-surface-variant">{timeAgo(comment.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-on-surface-variant leading-relaxed">{comment.body}</p>
                                </div>
                              </div>
                            ))
                          )}
                          {session?.user && (
                            <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10">
                              <input
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                                placeholder="Write a reply…"
                                className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary/30"
                              />
                              <button
                                onClick={handleAddComment}
                                disabled={submittingComment || !newComment.trim()}
                                className="p-2 bg-primary text-on-primary rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                              >
                                {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "Contributors" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {[stack.owner, ...stack.contributors].map((contributor, i) => (
                  <Link key={`${contributor.username}-${i}`} href={`/profile/${contributor.username}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="card-sm p-4 flex items-center gap-4 cursor-pointer group hover:-translate-y-0.5 transition-all"
                    >
                      <div className="w-11 h-11 bg-secondary-container rounded-2xl flex items-center justify-center font-bold font-manrope text-on-secondary-container overflow-hidden">
                        {contributor.image
                          ? <img src={contributor.image} alt="" className="w-full h-full object-cover" />
                          : contributor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors">{contributor.name}</p>
                        <p className="text-xs text-on-surface-variant">@{contributor.username}</p>
                      </div>
                      {i === 0 && <span className="text-xs bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-medium">Owner</span>}
                      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            )}

            {activeTab === "Quiz" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {session?.user ? (
                  <QuizSection
                    slug={slug}
                    isOwner={isOwner}
                    credits={aiCredits}
                    onBuyCredits={() => setShowBuyCredits(true)}
                    onCreditsUpdate={setAiCredits}
                  />
                ) : (
                  <div className="card p-12 text-center">
                    <BrainCircuit className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                    <p className="font-manrope font-semibold text-primary mb-1">Sign in to access quizzes</p>
                    <p className="text-sm text-on-surface-variant mb-5">Sign in to take quizzes and track your progress.</p>
                    <Link href={`/login?callbackUrl=/stacks/${slug}`} className="btn-primary">
                      Sign in
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {session?.user && (
              <div className="card p-5 space-y-3 bg-gradient-to-br from-secondary-container/20 to-surface-container border border-secondary/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-secondary-container rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-secondary" />
                  </div>
                  <h3 className="font-manrope font-semibold text-sm text-primary">AI Study Assistant</h3>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Ask questions, get explanations, and get study help based on this stack&apos;s content.</p>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{aiCredits} credits left</span>
                  <button onClick={() => setShowBuyCredits(true)} className="text-secondary hover:underline">Buy more</button>
                </div>
                <button
                  onClick={() => setShowAiChat(true)}
                  className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary py-2.5 rounded-xl text-xs font-semibold font-manrope hover:opacity-90 transition-all"
                >
                  <Bot className="w-3.5 h-3.5" />Ask AI
                </button>
              </div>
            )}

            <div className="card p-5 space-y-4">
              <h3 className="font-manrope font-semibold text-sm text-primary">About</h3>
              <div className="space-y-3 text-sm">
                {stack.tags.length > 0 && (
                  <div className="flex items-start gap-3 text-on-surface-variant">
                    <Tag className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">{stack.tags.map(t => <span key={t} className="tag text-xs">{t}</span>)}</div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>{formatNumber(stack.views)} views</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Updated {stack.updatedDaysAgo === 0 ? "today" : `${stack.updatedDaysAgo} days ago`}</span>
                </div>
                {stack.language && (
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Code2 className="w-4 h-4 shrink-0" />
                    <span>{stack.language}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── New Discussion Modal ── */}
      {showDiscModal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest rounded-2xl shadow-modal w-full max-w-lg p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-manrope font-semibold text-lg text-primary">New Discussion</h3>
              <button onClick={() => setShowDiscModal(false)} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title</label>
                <input
                  value={discTitle}
                  onChange={e => setDiscTitle(e.target.value)}
                  placeholder="What do you want to discuss?"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Description <span className="text-on-surface-variant font-normal">(optional)</span></label>
                <textarea
                  value={discContent}
                  onChange={e => setDiscContent(e.target.value)}
                  rows={4}
                  placeholder="Provide more context…"
                  className="input-field resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowDiscModal(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">Cancel</button>
                <button
                  onClick={handleCreateDiscussion}
                  disabled={submittingDisc || !discTitle.trim()}
                  className="btn-primary"
                >
                  {submittingDisc ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post discussion"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Edit Stack Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest rounded-2xl shadow-modal w-full max-w-2xl p-6 my-4"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-manrope font-semibold text-lg text-primary">Edit Stack</h3>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Title</label>
                <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Course Code</label>
                  <input value={editForm.courseCode} onChange={e => setEditForm(p => ({ ...p, courseCode: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">University</label>
                  <input value={editForm.university} onChange={e => setEditForm(p => ({ ...p, university: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Department</label>
                  <input value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Semester</label>
                  <input value={editForm.semester} onChange={e => setEditForm(p => ({ ...p, semester: e.target.value }))} placeholder="e.g. Fall 2026" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Language / Format</label>
                  <select value={editForm.language} onChange={e => setEditForm(p => ({ ...p, language: e.target.value }))} className="input-field">
                    {["Document", "Markdown", "Slides", "Video", "Mixed"].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Visibility</label>
                  <select value={editForm.isPublic ? "public" : "private"} onChange={e => setEditForm(p => ({ ...p, isPublic: e.target.value === "public" }))} className="input-field">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">Tags <span className="text-on-surface-variant font-normal">(comma-separated)</span></label>
                <input value={editForm.tags} onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. machine-learning, python, tutorial" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">README</label>
                <textarea value={editForm.readme} onChange={e => setEditForm(p => ({ ...p, readme: e.target.value }))} rows={5} placeholder="Describe this stack…" className="input-field resize-none font-mono text-xs" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">Cancel</button>
                <button
                  onClick={handleEditStack}
                  disabled={savingEdit}
                  className="btn-primary"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" />Save changes</>}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest rounded-2xl shadow-modal w-full max-w-md p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-error-container rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-manrope font-semibold text-lg text-primary mb-2">Delete this stack?</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  This will permanently delete <strong className="text-primary">{stack.title}</strong> and all its modules, discussions, and files. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">Cancel</button>
              <button
                onClick={handleDeleteStack}
                disabled={deletingStack}
                className="inline-flex items-center gap-1.5 bg-error text-on-error px-3 py-1.5 rounded-lg text-xs font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {deletingStack ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" />Delete permanently</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {viewerContentId && (
          <MtViewer
            contentId={viewerContentId}
            fileName={viewerFileName}
            onClose={() => { setViewerContentId(null); setViewerFileName(""); setViewerPreviewMode(false); }}
            preview={viewerPreviewMode}
            onBuy={viewerPreviewMode ? () => { setViewerContentId(null); router.push(`/stacks/${slug}#buy`); } : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAiChat && stack && (
          <AiChatModal
            stack={{ title: stack.title, slug: stack.slug, courseCode: stack.courseCode, description: stack.description }}
            credits={aiCredits}
            onClose={() => setShowAiChat(false)}
            onBuyCredits={() => { setShowAiChat(false); setShowBuyCredits(true); }}
            onCreditsUpdate={setAiCredits}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBuyCredits && (
          <BuyCreditsModal
            currentCredits={aiCredits}
            onClose={() => setShowBuyCredits(false)}
            onSuccess={setAiCredits}
          />
        )}
      </AnimatePresence>

      {/* Add to Flow modal */}
      <AnimatePresence>
        {showFlowModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowFlowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope font-bold text-primary flex items-center gap-2">
                  <Zap className="w-4 h-4 text-secondary" /> Add to Flow
                </h3>
                <button onClick={() => setShowFlowModal(false)} className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {flowsLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>
              ) : myFlows.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-on-surface-variant mb-3">You don&apos;t have any Stack Flows yet.</p>
                  <a href="/dashboard" className="text-sm text-secondary font-medium hover:underline">Create one in Dashboard →</a>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {myFlows.map(flow => (
                    <button
                      key={flow.id}
                      onClick={() => addToFlow(flow.id)}
                      disabled={addingToFlow === flow.id || addedFlows.has(flow.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-left",
                        addedFlows.has(flow.id)
                          ? "bg-secondary-container/30 text-on-secondary-container cursor-default"
                          : "hover:bg-surface-container text-on-surface"
                      )}
                    >
                      <Zap className="w-4 h-4 text-secondary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{flow.name}</p>
                        <p className="text-xs text-on-surface-variant">{flow._count.items} stack{flow._count.items !== 1 ? "s" : ""}</p>
                      </div>
                      {addingToFlow === flow.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-secondary shrink-0" />
                      ) : addedFlows.has(flow.id) ? (
                        <Check className="w-4 h-4 text-secondary shrink-0" />
                      ) : (
                        <Plus className="w-4 h-4 text-on-surface-variant shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Add to Community Modal */}
        {showCommunityModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCommunityModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-outline-variant/20 rounded-2xl shadow-2xl w-full max-w-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope font-bold text-primary flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-secondary" /> Add to Community
                </h3>
                <button onClick={() => setShowCommunityModal(false)} className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mb-4">Share this stack with one of your communities.</p>
              {commModalLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>
              ) : myCommunities.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-outline-variant mx-auto mb-3" />
                  <p className="text-sm text-on-surface-variant mb-3">You&apos;re not in any communities yet.</p>
                  <a href="/communities" className="text-sm text-secondary font-medium hover:underline">Find communities →</a>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {myCommunities.map(comm => (
                    <button
                      key={comm.id}
                      onClick={() => addToCommunity(comm.slug)}
                      disabled={addingToCommunity === comm.slug || addedCommunities.has(comm.slug)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-left",
                        addedCommunities.has(comm.slug)
                          ? "bg-secondary-container/30 text-on-secondary-container cursor-default"
                          : "hover:bg-surface-container text-on-surface"
                      )}
                    >
                      {comm.profile ? (
                        <img src={comm.profile} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-on-secondary-container" />
                        </div>
                      )}
                      <p className="font-medium truncate flex-1">{comm.name}</p>
                      {addingToCommunity === comm.slug ? (
                        <Loader2 className="w-4 h-4 animate-spin text-secondary shrink-0" />
                      ) : addedCommunities.has(comm.slug) ? (
                        <Check className="w-4 h-4 text-secondary shrink-0" />
                      ) : (
                        <Plus className="w-4 h-4 text-on-surface-variant shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
