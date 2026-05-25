"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Star, GitFork, Eye, Shield, Clock, MessageSquare,
  Download, Share2, Bookmark, BookOpen, FileText, Video,
  Music, HelpCircle, ChevronRight, Tag, Plus,
  Code2, ArrowLeft, Loader2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatNumber, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  lecture: <BookOpen className="w-4 h-4" />,
  assignment: <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  flashcard: <HelpCircle className="w-4 h-4" />,
};

const TABS = ["Overview", "Modules", "Discussions", "Contributors"];

interface StackData {
  id: string; title: string; slug: string; description: string; courseCode: string;
  university: string; department: string; semester: string; language: string;
  isVerified: boolean; views: number; readme: string | null;
  stars: number; forks: number; discussions: number;
  tags: string[]; owner: { id: string; name: string; username: string; image: string | null; university: string | null; department: string | null };
  modules: { id: string; title: string; type: string; files: number; duration: string | null; order: number }[];
  discussionsList: { id: string; title: string; body: string; resolved: boolean; createdAt: string; author: { name: string; username: string }; replies: number }[];
  contributors: { name: string; username: string; image: string | null }[];
  updatedDaysAgo: number; lastUpdated: string; createdAt: string;
  isStarred: boolean; isBookmarked: boolean;
}

export default function StackPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
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
      })
      .catch(() => setError("Failed to load stack."))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleStar = async () => {
    if (!session?.user) return;
    setActionLoading("star");
    try {
      const res = await fetch(`/api/stacks/${slug}/star`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setIsStarred(data.starred); setStarCount(data.count); }
    } finally { setActionLoading(null); }
  };

  const handleFork = async () => {
    if (!session?.user) return;
    setActionLoading("fork");
    try {
      const res = await fetch(`/api/stacks/${slug}/fork`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setForkCount(data.count);
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
          <Link href="/explore" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">Browse stacks</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {stack.courseCode && <span className="tag-accent text-xs">{stack.courseCode}</span>}
                {stack.university && <span className="tag text-xs">{stack.university}</span>}
                {stack.semester && <span className="tag text-xs">{stack.semester}</span>}
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
                  <span className="text-on-surface-variant text-sm"> · {stack.owner.department ?? stack.university}</span>
                </div>
              </Link>
            </div>

            {/* Actions */}
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
                      "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-all",
                      isStarred
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-primary text-on-primary hover:opacity-90"
                    )}
                  >
                    {actionLoading === "star" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={cn("w-4 h-4", isStarred && "fill-current")} />}
                    {isStarred ? "Starred" : "Star"}
                  </button>
                  <button
                    onClick={handleFork}
                    disabled={actionLoading === "fork"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high transition-all"
                  >
                    {actionLoading === "fork" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitFork className="w-4 h-4" />}
                    Fork
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBookmark}
                      disabled={actionLoading === "bookmark"}
                      className={cn(
                        "flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all border",
                        isBookmarked
                          ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
                          : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                      )}
                      title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                    >
                      <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </button>
                    <button
                      onClick={() => navigator.clipboard?.writeText(window.location.href)}
                      className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all"
                      title="Copy link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <Link href={`/login?callbackUrl=/stacks/${slug}`} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope bg-primary text-on-primary hover:opacity-90 transition-all">
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
                    {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-on-surface-variant">{1 + stack.contributors.length} contributors</span>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-8 w-fit overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab
                  ? "bg-surface-container-lowest text-primary shadow-card font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "Overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="card p-8">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-outline-variant/10">
                    <Code2 className="w-5 h-5 text-on-surface-variant" />
                    <h2 className="font-manrope font-semibold text-base text-primary">README.md</h2>
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
                            <h3 className="font-manrope font-semibold text-base text-primary mt-4">What's included</h3>
                            <ul className="space-y-2">
                              {stack.modules.map(m => (
                                <li key={m.id} className="flex items-center gap-2 text-sm text-on-surface-variant">
                                  <span className="w-4 h-4 text-secondary">✓</span>
                                  <span>{m.title}</span>
                                  {m.duration && <span className="text-xs text-outline">({m.duration})</span>}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        <div className="bg-secondary-container/30 border border-secondary/10 rounded-xl p-4 mt-4">
                          <p className="text-sm text-on-secondary-container font-medium">
                            ⚠️ This stack follows the Mentra Academic Integrity Guidelines. Do not upload copyrighted materials without permission.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Modules" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {stack.modules.length === 0 ? (
                  <div className="card p-12 text-center">
                    <BookOpen className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                    <p className="font-manrope font-semibold text-primary">No modules yet</p>
                    <p className="text-sm text-on-surface-variant mt-1">Modules will appear here once they're added.</p>
                  </div>
                ) : (
                  stack.modules.map((module, i) => (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="card-sm p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-all"
                    >
                      <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center text-on-secondary-container shrink-0">
                        {MODULE_ICONS[module.type] ?? <BookOpen className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors">
                          Module {String(i + 1).padStart(2, "0")} — {module.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                          {module.files > 0 && <span>{module.files} files</span>}
                          {module.duration && <><span>·</span><span>{module.duration}</span></>}
                          <span className="capitalize">· {module.type}</span>
                        </div>
                      </div>
                      <button className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container">
                        <Download className="w-3.5 h-3.5" />Download
                      </button>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-secondary transition-colors" />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "Discussions" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-end">
                  {session?.user ? (
                    <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all">
                      <Plus className="w-4 h-4" />New Discussion
                    </button>
                  ) : (
                    <Link href={`/login?callbackUrl=/stacks/${slug}`} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all">
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
                    <motion.div
                      key={disc.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="card-sm p-5 group hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare className={cn("w-5 h-5 mt-0.5 shrink-0", disc.resolved ? "text-green-500" : "text-secondary")} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-sm text-primary group-hover:text-secondary transition-colors">{disc.title}</p>
                            {disc.resolved && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Resolved</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                            <span>by @{disc.author.username}</span>
                            <span>·</span><span>{disc.replies} replies</span>
                            <span>·</span><span>{timeAgo(disc.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="card p-5 bg-gradient-to-br from-secondary-container/30 to-surface-container border border-secondary/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-secondary rounded-xl flex items-center justify-center">
                  <span className="text-on-secondary text-xs font-bold">AI</span>
                </div>
                <h3 className="font-manrope font-semibold text-sm text-primary">AI Tools</h3>
                <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">Coming soon</span>
              </div>
              <div className="space-y-2">
                {["Generate Summary", "Create Flashcards", "Build Quiz", "Explain Concept"].map(action => (
                  <button key={action} className="w-full text-left px-3 py-2.5 text-sm text-on-surface-variant rounded-xl bg-surface-container hover:bg-surface-container-high transition-all opacity-60 cursor-not-allowed">
                    {action}
                  </button>
                ))}
              </div>
            </div>

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
      <Footer />
    </div>
  );
}
