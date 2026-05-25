"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star, GitFork, Eye, Shield, Clock, MessageSquare,
  Download, Share2, Bookmark, BookOpen, FileText, Video,
  Music, HelpCircle, ChevronRight, Users, Tag, Plus,
  GitCommit, History, Code2, ArrowLeft
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MOCK_REPOSITORIES, formatNumber } from "@/lib/data";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  lecture: <BookOpen className="w-4 h-4" />,
  assignment: <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  flashcard: <HelpCircle className="w-4 h-4" />,
};

const TABS = ["Overview", "Modules", "Discussions", "Contributors", "History"];

const RECENT_COMMITS = [
  { hash: "a3f2b1", message: "Add Chapter 5: Time Complexity Analysis", author: "amara.osei", time: "2 days ago" },
  { hash: "e9d4c2", message: "Fix typos in sorting algorithms section", author: "james.okafor", time: "4 days ago" },
  { hash: "b7f8a3", message: "Add visual diagrams for tree traversal", author: "sofia.reyes", time: "1 week ago" },
  { hash: "c1d5e6", message: "Upload solved midterm problem set", author: "amara.osei", time: "2 weeks ago" },
];

const DISCUSSIONS = [
  { id: "d1", title: "Chapter 3: Dynamic Programming — confused on memoization", author: "Student A", replies: 12, time: "3h ago", resolved: false },
  { id: "d2", title: "Are the Big-O proofs in Chapter 2 correct?", author: "Student B", replies: 5, time: "1d ago", resolved: true },
  { id: "d3", title: "Request: Add more examples for graph algorithms", author: "Student C", replies: 8, time: "3d ago", resolved: false },
];

export default function RepositoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isStarred, setIsStarred] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [starCount, setStarCount] = useState(0);

  const repo = MOCK_REPOSITORIES.find(r => r.slug === slug) || MOCK_REPOSITORIES[1];

  const handleStar = () => {
    setIsStarred(!isStarred);
    setStarCount(prev => isStarred ? prev - 1 : prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-8 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
          <Link href="/explore" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Explore
          </Link>
          <span>/</span>
          <Link href={`/profile/${repo.owner.username}`} className="hover:text-primary transition-colors">
            {repo.owner.username}
          </Link>
          <span>/</span>
          <span className="text-primary font-medium">{repo.slug}</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="tag-accent text-xs">{repo.courseCode}</span>
                <span className="tag text-xs">{repo.university}</span>
                <span className="tag text-xs">{repo.semester}</span>
                {repo.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-container/60 px-3 py-1 rounded-full border border-secondary/20">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-3 leading-tight">
                {repo.title}
              </h1>
              <p className="text-on-surface-variant leading-relaxed mb-4 max-w-2xl">
                {repo.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {repo.tags.map(tag => (
                  <span key={tag} className="tag text-xs">{tag}</span>
                ))}
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container">
                  {repo.owner.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <Link href={`/profile/${repo.owner.username}`} className="text-sm font-medium text-primary hover:text-secondary transition-colors">
                    {repo.owner.name}
                  </Link>
                  <span className="text-on-surface-variant text-sm"> · {repo.department}</span>
                </div>
              </div>
            </div>

            {/* Stats & actions */}
            <div className="flex flex-col gap-3 shrink-0 md:w-48">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Stars", value: formatNumber(repo.stars + starCount), icon: Star },
                  { label: "Forks", value: formatNumber(repo.forks), icon: GitFork },
                  { label: "Views", value: formatNumber(repo.views), icon: Eye },
                ].map(stat => (
                  <div key={stat.label} className="bg-surface-container rounded-xl p-2">
                    <stat.icon className="w-4 h-4 text-on-surface-variant mx-auto mb-1" />
                    <p className="font-manrope font-bold text-sm text-primary">{stat.value}</p>
                    <p className="text-[10px] text-on-surface-variant">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <button
                onClick={handleStar}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-all",
                  isStarred
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-primary text-on-primary hover:opacity-90"
                )}
              >
                <Star className={cn("w-4 h-4", isStarred && "fill-current")} />
                {isStarred ? "Starred" : "Star"}
              </button>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high transition-all">
                <GitFork className="w-4 h-4" />
                Fork
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={cn(
                    "flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all border",
                    isBookmarked
                      ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
                      : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                </button>
                <button className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <Clock className="w-3 h-3" />
                Updated {repo.updatedDaysAgo === 0 ? "today" : `${repo.updatedDaysAgo}d ago`}
              </div>
            </div>
          </div>

          {/* Contributors */}
          {repo.contributors && repo.contributors.length > 0 && (
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-outline-variant/10">
              <span className="text-xs text-on-surface-variant">Contributors:</span>
              <div className="flex -space-x-2">
                {[repo.owner, ...repo.contributors].slice(0, 5).map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-secondary-container border-2 border-background flex items-center justify-center text-[10px] font-bold text-on-secondary-container font-manrope"
                    title={c.name}
                  >
                    {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-on-surface-variant">{1 + repo.contributors.length} contributors</span>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-8 w-fit overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
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

        {/* Tab content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "Overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* README */}
                <div className="card p-8">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-outline-variant/10">
                    <Code2 className="w-5 h-5 text-on-surface-variant" />
                    <h2 className="font-manrope font-semibold text-base text-primary">README.md</h2>
                  </div>
                  <div className="prose prose-sm max-w-none space-y-4">
                    <h2 className="font-manrope font-bold text-xl text-primary">{repo.title}</h2>
                    <p className="text-on-surface-variant leading-relaxed">
                      Welcome to the {repo.title} knowledge stack. This is a community-maintained resource for {repo.courseCode} at {repo.university}.
                    </p>
                    <h3 className="font-manrope font-semibold text-base text-primary mt-4">What's included</h3>
                    <ul className="space-y-2">
                      {repo.modules.map(m => (
                        <li key={m.id} className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="w-4 h-4 text-secondary">✓</span>
                          <span>{m.title}</span>
                          {m.duration && <span className="text-xs text-outline">({m.duration})</span>}
                        </li>
                      ))}
                    </ul>
                    <h3 className="font-manrope font-semibold text-base text-primary mt-4">How to contribute</h3>
                    <p className="text-on-surface-variant leading-relaxed text-sm">
                      Fork this stack, make your improvements, and submit a contribution request. All improvements are reviewed before merging. We especially welcome solved problems, additional examples, and error corrections.
                    </p>
                    <div className="bg-secondary-container/30 border border-secondary/10 rounded-xl p-4 mt-4">
                      <p className="text-sm text-on-secondary-container font-medium">
                        ⚠️ This stack follows the Mentra Academic Integrity Guidelines. Do not upload copyrighted materials without permission.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent commits */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <GitCommit className="w-4 h-4 text-on-surface-variant" />
                      <h3 className="font-manrope font-semibold text-base text-primary">Recent updates</h3>
                    </div>
                    <button className="text-xs text-secondary hover:underline flex items-center gap-1">
                      <History className="w-3 h-3" /> Full history
                    </button>
                  </div>
                  <div className="space-y-3">
                    {RECENT_COMMITS.map((commit) => (
                      <div key={commit.hash} className="flex items-center gap-3 py-2 border-b border-outline-variant/10 last:border-0">
                        <code className="text-xs bg-surface-container px-2 py-0.5 rounded font-mono text-on-surface-variant">{commit.hash}</code>
                        <p className="flex-1 text-sm text-on-surface truncate">{commit.message}</p>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-secondary">@{commit.author}</p>
                          <p className="text-[10px] text-on-surface-variant">{commit.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Modules" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {repo.modules.map((module, i) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="card-sm p-5 flex items-center gap-4 cursor-pointer group hover:-translate-y-0.5 transition-all"
                  >
                    <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center text-on-secondary-container shrink-0">
                      {MODULE_ICONS[module.type] || <BookOpen className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors">
                        Module {String(i + 1).padStart(2, "0")} — {module.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                        <span>{module.files} files</span>
                        {module.duration && <span>·</span>}
                        {module.duration && <span>{module.duration}</span>}
                        <span className="capitalize">·</span>
                        <span className="capitalize">{module.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-secondary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "Discussions" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-end">
                  <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all">
                    <Plus className="w-4 h-4" />
                    New Discussion
                  </button>
                </div>
                {DISCUSSIONS.map((disc, i) => (
                  <motion.div
                    key={disc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="card-sm p-5 cursor-pointer group hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className={cn("w-5 h-5 mt-0.5 shrink-0", disc.resolved ? "text-green-500" : "text-secondary")} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-sm text-primary group-hover:text-secondary transition-colors">{disc.title}</p>
                          {disc.resolved && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Resolved</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                          <span>by {disc.author}</span>
                          <span>·</span>
                          <span>{disc.replies} replies</span>
                          <span>·</span>
                          <span>{disc.time}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "Contributors" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {[repo.owner, ...(repo.contributors || [])].map((contributor, i) => (
                  <Link key={i} href={`/profile/${contributor.username}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="card-sm p-4 flex items-center gap-4 cursor-pointer group hover:-translate-y-0.5 transition-all"
                    >
                      <div className="w-11 h-11 bg-secondary-container rounded-2xl flex items-center justify-center font-bold font-manrope text-on-secondary-container">
                        {contributor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors">{contributor.name}</p>
                        <p className="text-xs text-on-surface-variant">{contributor.username}</p>
                      </div>
                      {i === 0 && (
                        <span className="text-xs bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-medium">Owner</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            )}

            {activeTab === "History" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {[...RECENT_COMMITS, ...RECENT_COMMITS].map((commit, i) => (
                  <motion.div
                    key={`${commit.hash}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-sm p-4 flex items-center gap-4"
                  >
                    <div className="w-8 h-8 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                      <GitCommit className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{commit.message}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-on-surface-variant">
                        <code className="bg-surface-container px-1.5 py-0.5 rounded text-[10px] font-mono">{commit.hash}</code>
                        <span>by @{commit.author}</span>
                        <span>·</span>
                        <span>{commit.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* AI tools */}
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

            {/* Repository info */}
            <div className="card p-5 space-y-4">
              <h3 className="font-manrope font-semibold text-sm text-primary">About</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-on-surface-variant">
                  <Tag className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {repo.tags.map(t => <span key={t} className="tag text-xs">{t}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{1 + (repo.contributors?.length || 0)} contributors</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>{repo.discussions} discussions</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>{formatNumber(repo.views)} views</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
