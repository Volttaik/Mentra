"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, TrendingUp, Star, Clock, BookOpen, Loader2,
  Shield, GitFork, Eye, ChevronRight, Filter,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn, formatNumber } from "@/lib/utils";

const DEPARTMENTS = ["All", "Computer Science", "Mathematics", "Physics", "Biology", "Chemistry", "Economics", "Engineering"];
const SORT_OPTIONS = [
  { label: "Newest", value: "recent", icon: Clock },
  { label: "Most Stars", value: "stars", icon: Star },
  { label: "Most Views", value: "views", icon: TrendingUp },
];

const LANG_COLORS: Record<string, string> = {
  Python: "bg-blue-400",
  Document: "bg-red-400",
  Markdown: "bg-purple-400",
  Jupyter: "bg-orange-400",
  PDF: "bg-rose-400",
  default: "bg-secondary",
};

interface Stack {
  id: string; title: string; slug: string; description: string; courseCode: string;
  university: string; department: string; semester: string; language: string;
  isVerified: boolean; views: number; stars: number; forks: number; discussions: number;
  tags: string[]; owner: { name: string; username: string; image: string | null };
  modules: { id: string }[]; updatedDaysAgo: number; lastUpdated: string;
  isStarred: boolean; isBookmarked: boolean; banner?: string | null;
}

function FeedCard({ stack, index }: { stack: Stack; index: number }) {
  const timeStr = stack.updatedDaysAgo === 0 ? "Today"
    : stack.updatedDaysAgo === 1 ? "Yesterday"
    : `${stack.updatedDaysAgo}d ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.35 }}
    >
      <Link href={`/stacks/${stack.slug}`} className="block group">
        <article className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden hover:border-outline-variant/40 hover:-translate-y-0.5 transition-all duration-200 shadow-card">
          {/* Banner */}
          {stack.banner ? (
            <div className="h-32 relative overflow-hidden">
              <img src={stack.banner} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              {stack.isVerified && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-secondary bg-secondary-container/90 px-2 py-0.5 rounded-full border border-secondary/20">
                  <Shield className="w-2.5 h-2.5" />Verified
                </span>
              )}
            </div>
          ) : null}

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              {/* Owner avatar */}
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container shrink-0 overflow-hidden">
                {stack.owner.image
                  ? <img src={stack.owner.image} alt="" className="w-full h-full object-cover" />
                  : stack.owner.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-xs text-on-surface-variant">@{stack.owner.username}</span>
                  {stack.courseCode && (
                    <span className="text-xs font-medium text-on-secondary-container bg-secondary-container/60 px-2 py-0.5 rounded-full">{stack.courseCode}</span>
                  )}
                  {!stack.banner && stack.isVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full border border-secondary/20">
                      <Shield className="w-2.5 h-2.5" />Verified
                    </span>
                  )}
                </div>
                <h3 className="font-manrope font-bold text-sm text-primary group-hover:text-secondary transition-colors leading-snug line-clamp-2">
                  {stack.title}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
              {stack.description || "No description provided."}
            </p>

            {/* Tags */}
            {stack.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {stack.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/20">
                    {tag}
                  </span>
                ))}
                {stack.tags.length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-on-surface-variant/60">+{stack.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Footer stats */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", LANG_COLORS[stack.language] ?? LANG_COLORS.default)} />
                  {stack.language}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />{formatNumber(stack.stars)}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="w-3 h-3" />{formatNumber(stack.forks)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />{formatNumber(stack.views)}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant/50 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />{timeStr}
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-container shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 bg-surface-container rounded w-1/3" />
          <div className="h-4 bg-surface-container rounded w-4/5" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-surface-container rounded" />
        <div className="h-2.5 bg-surface-container rounded w-5/6" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-4 bg-surface-container rounded-full w-14" />
        <div className="h-4 bg-surface-container rounded-full w-16" />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [_total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchStacks = useCallback(async (resetPage = true, pageOverride?: number) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : (pageOverride ?? page);
    const params = new URLSearchParams({
      ...(query && { q: query }),
      ...(selectedDept !== "All" && { department: selectedDept }),
      sort: sortBy,
      page: String(currentPage),
    });
    try {
      const res = await fetch(`/api/stacks?${params}`);
      const data = await res.json();
      if (resetPage) {
        setStacks(data.stacks ?? []);
        setPage(1);
      } else {
        setStacks(prev => [...prev, ...(data.stacks ?? [])]);
        setPage(currentPage);
      }
      setTotal(data.total ?? 0);
      setHasMore((data.page ?? 1) < (data.pages ?? 1));
    } catch {}
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedDept, sortBy]);

  useEffect(() => {
    const t = setTimeout(() => fetchStacks(true), query ? 350 : 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedDept, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Hero search bar */}
      <section className="border-b border-outline-variant/10 py-10">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-7">
            <h1 className="font-manrope font-bold text-xl md:text-2xl text-primary mb-2">
              Explore Stacks
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base">
              Discover academic materials from students and professors worldwide.
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by course, topic, university or lecturer…"
              className="w-full pl-12 pr-12 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 text-sm transition-all shadow-card"
            />
            {loading && query && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary animate-spin" />
            )}
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-8 w-full">
        {/* Sort + Filter row */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div />

          <div className="flex items-center gap-2">
            {/* Sort pills */}
            <div className="hidden sm:flex items-center gap-1 bg-surface-container rounded-xl p-1">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    sortBy === opt.value
                      ? "bg-surface-container-lowest text-primary shadow-card"
                      : "text-on-surface-variant hover:text-primary"
                  )}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(s => !s)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                showFilters || selectedDept !== "All"
                  ? "bg-secondary-container text-on-secondary-container border-secondary/20"
                  : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              {selectedDept !== "All" ? selectedDept : "Filter"}
            </button>
          </div>
        </div>

        {/* Department filter strip */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Department</p>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                      selectedDept === dept
                        ? "bg-secondary-container text-on-secondary-container border-secondary/30"
                        : "border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50 hover:text-primary"
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Mobile sort */}
              <div className="mt-3 pt-3 border-t border-outline-variant/10 flex gap-2 sm:hidden">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider self-center mr-1">Sort</p>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                      sortBy === opt.value
                        ? "bg-secondary-container text-on-secondary-container border-secondary/30"
                        : "border-outline-variant/20 text-on-surface-variant hover:text-primary"
                    )}
                  >
                    <opt.icon className="w-3 h-3" />{opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Feed grid */}
        {loading && stacks.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : stacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-outline-variant" />
            </div>
            <div>
              <h3 className="font-manrope font-semibold text-lg text-primary mb-1">No stacks found</h3>
              <p className="text-sm text-on-surface-variant max-w-sm">
                {query ? "Try different keywords or remove the department filter." : "Be the first to publish a stack!"}
              </p>
            </div>
            {!query && (
              <Link href="/upload" className="btn-primary mt-2">
                Publish your stack
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stacks.map((stack, i) => (
                <FeedCard key={stack.id} stack={stack} index={i} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => fetchStacks(false, page + 1)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant/30 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
