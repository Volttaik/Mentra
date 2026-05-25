"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, Star, GitFork, Plus, Bell, TrendingUp,
  MessageSquare, Upload, Eye, Users, Activity, ChevronRight,
  Bookmark, Clock, CheckCircle
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import RepositoryCard from "@/components/ui/RepositoryCard";
import ContributionGraph from "@/components/ui/ContributionGraph";
import { MOCK_REPOSITORIES, MOCK_USERS, formatNumber } from "@/lib/data";
import { cn } from "@/lib/utils";

const NOTIFICATIONS = [
  { id: "n1", type: "star", text: "Marcus Chen starred your stack", repo: "Data Structures & Algorithms", time: "2h ago", read: false },
  { id: "n2", type: "fork", text: "Sofia Reyes forked Advanced Quantum Mechanics", repo: "Advanced Quantum Mechanics", time: "5h ago", read: false },
  { id: "n3", type: "comment", text: "New discussion: 'Chapter 3 needs clarification'", repo: "Data Structures & Algorithms", time: "1d ago", read: true },
  { id: "n4", type: "contribution", text: "James Okafor contributed to your stack", repo: "Organic Chemistry I & II", time: "2d ago", read: true },
];

const RECENT_ACTIVITY = [
  { text: "You uploaded 3 files to", repo: "Data Structures & Algorithms", time: "Today" },
  { text: "You forked", repo: "Machine Learning Foundations", time: "Yesterday" },
  { text: "You starred", repo: "Abstract Algebra: Groups & Rings", time: "3 days ago" },
  { text: "You opened a discussion in", repo: "Advanced Quantum Mechanics", time: "5 days ago" },
];

const SAVED_REPOS = MOCK_REPOSITORIES.slice(2, 4);
const IN_PROGRESS = MOCK_REPOSITORIES.slice(4, 6);

const QUICK_STATS = [
  { label: "Stacks", value: "18", icon: BookOpen, change: "+2 this month" },
  { label: "Stars earned", value: "891", icon: Star, change: "+124 this week" },
  { label: "Contributions", value: "4,723", icon: Activity, change: "+89 this week" },
  { label: "Followers", value: "2.8k", icon: Users, change: "+203 this month" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-10 w-full">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-start justify-between"
        >
          <div>
            <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-1">
              Good morning, Amara ✨
            </h1>
            <p className="text-on-surface-variant text-sm">
              You have 2 unread notifications and 1 pending collaboration request.
            </p>
          </div>
          <Link
            href="/upload"
            className="hidden md:flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 transition-all shadow-card"
          >
            <Plus className="w-4 h-4" />
            New Stack
          </Link>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {QUICK_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-secondary-container rounded-xl flex items-center justify-center">
                  <stat.icon className="w-4.5 h-4.5 text-on-secondary-container" size={18} />
                </div>
                <span className="text-xs text-secondary bg-secondary-container/40 px-2 py-0.5 rounded-full">{stat.change}</span>
              </div>
              <p className="font-manrope font-bold text-2xl text-primary">{stat.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contribution graph */}
            <ContributionGraph totalContributions={4723} />

            {/* Recent Repositories */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-manrope font-semibold text-lg text-primary">Your stacks</h2>
                <Link href="/explore" className="text-sm text-secondary font-medium flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {MOCK_REPOSITORIES.slice(0, 3).map((repo, i) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <Link href={`/stacks/${repo.slug}`}>
                      <div className="card-sm p-4 flex items-center gap-4 cursor-pointer group hover:-translate-y-0.5 transition-all">
                        <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-on-secondary-container" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors truncate">
                            {repo.title}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">{repo.courseCode} · {repo.university}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
                          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{formatNumber(repo.stars)}</span>
                          <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" />{formatNumber(repo.forks)}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Continue Learning */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-manrope font-semibold text-lg text-primary">Continue learning</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {IN_PROGRESS.map((repo, i) => (
                  <Link key={repo.id} href={`/stacks/${repo.slug}`}>
                    <div className="card-sm p-5 cursor-pointer group hover:-translate-y-1 transition-all">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-9 h-9 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors leading-snug truncate">
                            {repo.title}
                          </p>
                          <p className="text-xs text-on-surface-variant">{repo.modules.length} modules</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-on-surface-variant">
                          <span>Progress</span>
                          <span>{Math.floor(Math.random() * 60 + 20)}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: `${Math.floor(Math.random() * 60 + 20)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope font-semibold text-base text-primary">Notifications</h3>
                <span className="w-5 h-5 bg-secondary text-on-secondary text-xs rounded-full flex items-center justify-center font-bold">2</span>
              </div>
              <div className="space-y-3">
                {NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl transition-all",
                      !notif.read ? "bg-secondary-container/30" : "hover:bg-surface-container"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      notif.type === "star" ? "bg-amber-100 text-amber-600" :
                      notif.type === "fork" ? "bg-blue-100 text-blue-600" :
                      notif.type === "comment" ? "bg-purple-100 text-purple-600" :
                      "bg-green-100 text-green-600"
                    )}>
                      {notif.type === "star" && <Star className="w-3.5 h-3.5" />}
                      {notif.type === "fork" && <GitFork className="w-3.5 h-3.5" />}
                      {notif.type === "comment" && <MessageSquare className="w-3.5 h-3.5" />}
                      {notif.type === "contribution" && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-on-surface leading-relaxed">{notif.text}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{notif.time}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-secondary rounded-full mt-1 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Saved repos */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bookmark className="w-4 h-4 text-secondary" />
                <h3 className="font-manrope font-semibold text-base text-primary">Saved</h3>
              </div>
              <div className="space-y-3">
                {SAVED_REPOS.map((repo) => (
                  <Link key={repo.id} href={`/stacks/${repo.slug}`}>
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container transition-colors cursor-pointer group">
                      <div className="w-8 h-8 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-on-surface-variant" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary group-hover:text-secondary transition-colors truncate">{repo.title}</p>
                        <p className="text-xs text-on-surface-variant">{repo.courseCode}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-secondary" />
                <h3 className="font-manrope font-semibold text-base text-primary">Recent activity</h3>
              </div>
              <div className="space-y-3">
                {RECENT_ACTIVITY.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {act.text}{" "}
                        <span className="text-primary font-medium">{act.repo}</span>
                      </p>
                      <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
