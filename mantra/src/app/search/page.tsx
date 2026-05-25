"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen, Users, Tag, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RepositoryCard from "@/components/ui/RepositoryCard";
import UserCard from "@/components/ui/UserCard";
import { MOCK_REPOSITORIES, MOCK_USERS, TRENDING_TAGS } from "@/lib/data";
import { cn } from "@/lib/utils";

const FILTER_TYPES = ["All", "Repositories", "Users", "Tags"];
const FILE_TYPES = ["All types", "PDF", "Video", "Markdown", "Jupyter", "Audio"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [fileType, setFileType] = useState("All types");
  const [recentSearches] = useState(["quantum mechanics", "data structures", "organic chemistry"]);

  const repoResults = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return MOCK_REPOSITORIES.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some(t => t.includes(q)) ||
      r.courseCode.toLowerCase().includes(q) ||
      r.university.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  }, [query]);

  const userResults = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return MOCK_USERS.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.university.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  }, [query]);

  const tagResults = useMemo(() => {
    if (!query) return [];
    return TRENDING_TAGS.filter(t => t.includes(query.toLowerCase()));
  }, [query]);

  const hasResults = repoResults.length > 0 || userResults.length > 0 || tagResults.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-10 w-full">
        {/* Search bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Search repositories, users, topics, course codes..."
              className="w-full pl-12 pr-12 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary shadow-card text-base transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type filters */}
          {query && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {FILTER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    activeType === type
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  {type === "Repositories" && <BookOpen className="w-3.5 h-3.5" />}
                  {type === "Users" && <Users className="w-3.5 h-3.5" />}
                  {type === "Tags" && <Tag className="w-3.5 h-3.5" />}
                  {type}
                  {type === "Repositories" && repoResults.length > 0 && (
                    <span className="bg-outline-variant/20 text-on-surface-variant text-xs px-1.5 py-0.5 rounded-full">
                      {repoResults.length}
                    </span>
                  )}
                  {type === "Users" && userResults.length > 0 && (
                    <span className="bg-outline-variant/20 text-on-surface-variant text-xs px-1.5 py-0.5 rounded-full">
                      {userResults.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* No query state */}
        {!query && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h3 className="font-manrope font-semibold text-sm text-primary mb-3">Recent searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-2 tag hover:bg-secondary-container hover:text-on-secondary-container transition-all"
                  >
                    <Search className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-manrope font-semibold text-sm text-primary mb-3">Trending topics</h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="tag hover:bg-secondary-container hover:text-on-secondary-container transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <div className="space-y-10">
            {!hasResults && (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                <h3 className="font-manrope font-semibold text-lg text-primary mb-2">No results found</h3>
                <p className="text-on-surface-variant text-sm">
                  Try searching for a course code, university name, or topic.
                </p>
              </div>
            )}

            {/* Repo results */}
            {(activeType === "All" || activeType === "Repositories") && repoResults.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-5 h-5 text-on-surface-variant" />
                  <h2 className="font-manrope font-semibold text-base text-primary">
                    Repositories
                  </h2>
                  <span className="tag text-xs">{repoResults.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {repoResults.map((repo, i) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <RepositoryCard repo={repo} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* User results */}
            {(activeType === "All" || activeType === "Users") && userResults.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-5 h-5 text-on-surface-variant" />
                  <h2 className="font-manrope font-semibold text-base text-primary">Contributors</h2>
                  <span className="tag text-xs">{userResults.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {userResults.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <UserCard user={user} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Tag results */}
            {(activeType === "All" || activeType === "Tags") && tagResults.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Tag className="w-5 h-5 text-on-surface-variant" />
                  <h2 className="font-manrope font-semibold text-base text-primary">Topics</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {tagResults.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="tag-accent text-sm px-4 py-2 hover:shadow-glow transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
