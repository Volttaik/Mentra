"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Star, Clock, BookOpen, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RepositoryCard from "@/components/ui/RepositoryCard";
import { cn } from "@/lib/utils";

const DEPARTMENTS = ["All", "Computer Science", "Mathematics", "Physics", "Biology", "Chemistry", "Economics", "Engineering"];
const SORT_OPTIONS = [
  { label: "Newest", value: "recent", icon: Clock },
  { label: "Most Stars", value: "stars", icon: Star },
  { label: "Most Views", value: "views", icon: TrendingUp },
];
const VIEW_TABS = ["Stacks", "Contributors", "Universities"];

interface Stack {
  id: string; title: string; slug: string; description: string; courseCode: string;
  university: string; department: string; semester: string; language: string;
  isVerified: boolean; views: number; stars: number; forks: number; discussions: number;
  tags: string[]; owner: { name: string; username: string; image: string | null };
  modules: { id: string }[]; updatedDaysAgo: number; lastUpdated: string;
  isStarred: boolean; isBookmarked: boolean;
}
interface Contributor {
  id: string; name: string; username: string; image: string | null;
  university: string | null; department: string | null;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [viewTab, setViewTab] = useState("Stacks");
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchStacks = useCallback(async (resetPage = true) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
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
      }
      setTotal(data.total ?? 0);
      setHasMore((data.page ?? 1) < (data.pages ?? 1));
    } catch {}
    setLoading(false);
  }, [query, selectedDept, sortBy, page]);

  useEffect(() => {
    const t = setTimeout(() => fetchStacks(true), query ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedDept, sortBy]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchStacks(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero search */}
      <section className="relative py-16 overflow-hidden border-b border-outline-variant/10">
        <div className="organic-blob w-96 h-96 bg-secondary-container top-0 right-0" />
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <h1 className="font-manrope font-bold text-3xl md:text-4xl text-primary mb-3 text-center">
              Explore Academic Stacks
            </h1>
            <p className="text-on-surface-variant text-center mb-8">
              Discover stacks from universities worldwide. All subjects, all levels.
            </p>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by course, topic, university, or lecturer..."
                className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary shadow-card text-base transition-all"
              />
              {loading && query && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary animate-spin" />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-12 w-full">
        {/* View tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-8 w-fit">
          {VIEW_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                viewTab === tab
                  ? "bg-surface-container-lowest text-primary shadow-card font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {viewTab === "Stacks" && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <aside className="w-full lg:w-56 shrink-0 space-y-6">
              <div>
                <h3 className="font-manrope font-semibold text-sm text-primary mb-3">Department</h3>
                <div className="space-y-1">
                  {DEPARTMENTS.map(dept => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDept(dept)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm transition-all",
                        selectedDept === dept
                          ? "bg-secondary-container text-on-secondary-container font-medium"
                          : "text-on-surface-variant hover:bg-surface-container"
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-manrope font-semibold text-sm text-primary mb-3">Sort by</h3>
                <div className="space-y-1">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition-all",
                        sortBy === opt.value
                          ? "bg-secondary-container text-on-secondary-container font-medium"
                          : "text-on-surface-variant hover:bg-surface-container"
                      )}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Stack grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-on-surface-variant">
                  {loading && stacks.length === 0 ? (
                    <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…</span>
                  ) : (
                    <><span className="font-semibold text-primary">{total}</span> stack{total !== 1 ? "s" : ""} found</>
                  )}
                </p>
              </div>

              {loading && stacks.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-6 animate-pulse space-y-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-surface-container rounded w-1/3" />
                        <div className="h-5 bg-surface-container rounded w-3/4" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 bg-surface-container rounded" />
                        <div className="h-3 bg-surface-container rounded w-5/6" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-5 bg-surface-container rounded-full w-16" />
                        <div className="h-5 bg-surface-container rounded-full w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stacks.length === 0 ? (
                <div className="card p-16 text-center">
                  <BookOpen className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                  <h3 className="font-manrope font-semibold text-primary mb-2">No stacks found</h3>
                  <p className="text-sm text-on-surface-variant">
                    {query ? "Try a different search term or filter." : "Be the first to publish a stack!"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {stacks.map((stack, i) => (
                      <motion.div
                        key={stack.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 10) * 0.05 }}
                      >
                        <RepositoryCard repo={stack} className="h-full" />
                      </motion.div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {viewTab === "Contributors" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-on-secondary-container" />
            </div>
            <h3 className="font-manrope font-semibold text-xl text-primary mb-2">Contributors directory</h3>
            <p className="text-on-surface-variant max-w-md mx-auto">
              The contributors directory will populate as users join and publish stacks. Register and create your first stack to appear here.
            </p>
          </div>
        )}

        {viewTab === "Universities" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-on-secondary-container" />
            </div>
            <h3 className="font-manrope font-semibold text-xl text-primary mb-2">University rankings</h3>
            <p className="text-on-surface-variant max-w-md mx-auto">
              University rankings are computed from real stack data. Rankings will appear as stacks are published across different universities.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
