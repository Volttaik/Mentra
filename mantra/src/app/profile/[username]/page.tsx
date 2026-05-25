"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, GraduationCap, Calendar, Star, Users, BookOpen,
  GitFork, UserPlus, Bell, Share2, Shield, Activity,
  ChevronRight, ExternalLink
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RepositoryCard from "@/components/ui/RepositoryCard";
import ContributionGraph from "@/components/ui/ContributionGraph";
import { MOCK_USERS, MOCK_REPOSITORIES, formatNumber } from "@/lib/data";
import { cn } from "@/lib/utils";

const TABS = ["Repositories", "Contributions", "Stars", "Followers"];

const ACHIEVEMENT_DISPLAY: Record<string, { label: string; color: string; desc: string }> = {
  "top-contributor": { label: "🏆 Top Contributor", color: "bg-amber-100 text-amber-800", desc: "Top 1% of contributors" },
  "verified-educator": { label: "✅ Verified Educator", color: "bg-green-100 text-green-800", desc: "Academic credentials verified" },
  "hall-of-fame": { label: "⭐ Hall of Fame", color: "bg-purple-100 text-purple-800", desc: "Featured in Mantra Hall of Fame" },
  "rising-star": { label: "🌟 Rising Star", color: "bg-blue-100 text-blue-800", desc: "Fast-growing contributor" },
  "100-commits": { label: "💫 100 Commits", color: "bg-secondary-container text-on-secondary-container", desc: "Made 100+ commits" },
  "top-professor": { label: "🎓 Top Professor", color: "bg-rose-100 text-rose-800", desc: "Highly rated educator" },
};

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [activeTab, setActiveTab] = useState("Repositories");
  const [isFollowing, setIsFollowing] = useState(false);

  const user = MOCK_USERS.find(u => u.username === username) || MOCK_USERS[0];
  const userRepos = MOCK_REPOSITORIES.filter(r => r.owner.username === user.username);
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Banner */}
      <div className="h-40 md:h-52 bg-gradient-to-r from-primary-container via-secondary-container to-primary-fixed relative overflow-hidden">
        <div className="organic-blob w-96 h-96 bg-secondary -top-20 -right-20" />
        <div className="organic-blob w-64 h-64 bg-primary-fixed top-0 left-1/4" />
      </div>

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 w-full">
        {/* Profile header */}
        <div className="relative -mt-16 md:-mt-20 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-28 h-28 md:w-36 md:h-36 bg-secondary-container rounded-3xl border-4 border-background shadow-modal flex items-center justify-center font-bold font-manrope text-4xl text-on-secondary-container shrink-0"
            >
              {initials}
            </motion.div>

            {/* Name + actions */}
            <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary leading-tight">{user.name}</h1>
                <p className="text-on-surface-variant text-sm mt-1">@{user.username}</p>
              </motion.div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-all",
                    isFollowing
                      ? "bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high"
                      : "bg-primary text-on-primary hover:opacity-90"
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all">
                  <Bell className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bio + meta */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            {user.bio && (
              <p className="text-on-surface-variant leading-relaxed max-w-2xl mb-4">{user.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                {user.university}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {user.department}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {user.level}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-outline-variant/10">
              {[
                { label: "followers", value: formatNumber(user.followers + (isFollowing ? 1 : 0)) },
                { label: "following", value: formatNumber(user.following) },
                { label: "repositories", value: user.repositories },
                { label: "contributions", value: formatNumber(user.contributions) },
                { label: "stars earned", value: formatNumber(user.stars) },
              ].map(stat => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="font-manrope font-bold text-base text-primary">{stat.value}</span>
                  <span className="text-sm text-on-surface-variant">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Achievements */}
            {user.achievements && user.achievements.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {user.achievements.map(a => {
                  const ach = ACHIEVEMENT_DISPLAY[a];
                  if (!ach) return null;
                  return (
                    <span key={a} className={cn("text-xs font-medium px-3 py-1 rounded-full", ach.color)} title={ach.desc}>
                      {ach.label}
                    </span>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-8 w-fit overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab
                  ? "bg-surface-container-lowest text-primary shadow-card font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "Repositories" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {(userRepos.length > 0 ? userRepos : MOCK_REPOSITORIES.slice(0, 3)).map((repo, i) => (
                  <motion.div key={repo.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <RepositoryCard repo={repo} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "Contributions" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <ContributionGraph totalContributions={user.contributions} />
                <div className="card p-6">
                  <h3 className="font-manrope font-semibold text-base text-primary mb-4">Recent contributions</h3>
                  <div className="space-y-3">
                    {MOCK_REPOSITORIES.slice(0, 4).map((repo, i) => (
                      <Link key={i} href={`/stacks/${repo.slug}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer group">
                          <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                            <GitFork className="w-4 h-4 text-on-secondary-container" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary group-hover:text-secondary transition-colors truncate">{repo.title}</p>
                            <p className="text-xs text-on-surface-variant">{repo.courseCode}</p>
                          </div>
                          <span className="text-xs text-on-surface-variant shrink-0">{repo.updatedDaysAgo}d ago</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Stars" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {MOCK_REPOSITORIES.slice(1, 5).map((repo, i) => (
                  <motion.div key={repo.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <RepositoryCard repo={repo} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === "Followers" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_USERS.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Link href={`/profile/${u.username}`}>
                      <div className="card-sm p-4 flex items-center gap-3 cursor-pointer group hover:-translate-y-0.5 transition-all">
                        <div className="w-11 h-11 bg-secondary-container rounded-2xl flex items-center justify-center font-bold text-sm font-manrope text-on-secondary-container shrink-0">
                          {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors truncate">{u.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{u.department} · {u.university}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Profile sidebar */}
          <aside className="space-y-5">
            <div className="card p-5 space-y-4">
              <h3 className="font-manrope font-semibold text-sm text-primary">Contribution stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Total commits", value: formatNumber(user.contributions) },
                  { label: "Repositories created", value: user.repositories },
                  { label: "Forks made", value: Math.floor(user.contributions / 8) },
                  { label: "Discussions opened", value: Math.floor(user.contributions / 20) },
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">{stat.label}</span>
                    <span className="font-manrope font-semibold text-sm text-primary">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="font-manrope font-semibold text-sm text-primary">Achievements</h3>
              {user.achievements?.map(a => {
                const ach = ACHIEVEMENT_DISPLAY[a];
                if (!ach) return null;
                return (
                  <div key={a} className={cn("p-3 rounded-xl text-xs font-medium", ach.color)}>
                    <p className="font-semibold">{ach.label}</p>
                    <p className="mt-0.5 opacity-70">{ach.desc}</p>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
