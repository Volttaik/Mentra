"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, SlidersHorizontal, TrendingUp, Star, Clock, BookOpen } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RepositoryCard from "@/components/ui/RepositoryCard";
import UserCard from "@/components/ui/UserCard";
import { MOCK_REPOSITORIES, MOCK_USERS, TRENDING_TAGS, UNIVERSITIES } from "@/lib/data";
import { cn } from "@/lib/utils";

const DEPARTMENTS = ["All", "Computer Science", "Mathematics", "Physics", "Biology", "Chemistry", "Economics"];
const SORT_OPTIONS = [
  { label: "Trending", icon: TrendingUp },
  { label: "Most Stars", icon: Star },
  { label: "Recently Updated", icon: Clock },
];
const VIEW_TABS = ["Repositories", "Contributors", "Universities"];

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [sortBy, setSortBy] = useState("Trending");
  const [viewTab, setViewTab] = useState("Repositories");

  const filtered = useMemo(() => {
    let repos = [...MOCK_REPOSITORIES];
    if (query) {
      const q = query.toLowerCase();
      repos = repos.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.includes(q)) ||
        r.courseCode.toLowerCase().includes(q) ||
        r.university.toLowerCase().includes(q)
      );
    }
    if (selectedDept !== "All") {
      repos = repos.filter(r => r.department === selectedDept);
    }
    if (sortBy === "Most Stars") repos.sort((a, b) => b.stars - a.stars);
    else if (sortBy === "Recently Updated") repos.sort((a, b) => a.updatedDaysAgo - b.updatedDaysAgo);
    return repos;
  }, [query, selectedDept, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero search */}
      <section className="relative py-16 overflow-hidden border-b border-outline-variant/10">
        <div className="organic-blob w-96 h-96 bg-secondary-container top-0 right-0" />
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="font-manrope font-bold text-3xl md:text-4xl text-primary mb-3 text-center">
              Explore Academic Knowledge
            </h1>
            <p className="text-on-surface-variant text-center mb-8">
              Discover repositories from universities worldwide. All subjects, all levels.
            </p>

            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by course, topic, university, or lecturer..."
                className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary shadow-card text-base transition-all"
              />
            </div>

            {/* Trending tags */}
            <div className="flex flex-wrap gap-2 justify-center">
              {TRENDING_TAGS.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="tag hover:bg-secondary-container hover:text-on-secondary-container transition-all text-xs cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-12 w-full">
        {/* View tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-8 w-fit">
          {VIEW_TABS.map((tab) => (
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

        {viewTab === "Repositories" && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <aside className="w-full lg:w-56 shrink-0 space-y-6">
              <div>
                <h3 className="font-manrope font-semibold text-sm text-primary mb-3">Department</h3>
                <div className="space-y-1">
                  {DEPARTMENTS.map((dept) => (
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
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSortBy(opt.label)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition-all",
                        sortBy === opt.label
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

              <div>
                <h3 className="font-manrope font-semibold text-sm text-primary mb-3">Trending tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING_TAGS.slice(0, 12).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="tag text-xs hover:bg-secondary-container hover:text-on-secondary-container transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Repo grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-on-surface-variant">
                  <span className="font-semibold text-primary">{filtered.length}</span> repositories found
                </p>
              </div>

              {filtered.length === 0 ? (
                <div className="card p-16 text-center">
                  <BookOpen className="w-12 h-12 text-outline-variant mx-auto mb-4" />
                  <h3 className="font-manrope font-semibold text-primary mb-2">No repositories found</h3>
                  <p className="text-sm text-on-surface-variant">Try a different search term or filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filtered.map((repo, i) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <RepositoryCard repo={repo} className="h-full" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {viewTab === "Contributors" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...MOCK_USERS, ...MOCK_USERS].map((user, i) => (
                <motion.div
                  key={`${user.id}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <UserCard user={user} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {viewTab === "Universities" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {UNIVERSITIES.map((uni, i) => (
              <motion.div
                key={uni.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card p-6 cursor-pointer group hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center font-bold font-manrope text-on-secondary-container mb-4">
                  {uni.name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="font-manrope font-semibold text-primary group-hover:text-secondary transition-colors">{uni.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{uni.country}</p>
                <p className="text-sm font-medium text-secondary mt-3">{uni.count} repositories</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
