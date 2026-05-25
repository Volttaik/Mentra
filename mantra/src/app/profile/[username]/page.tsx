"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  MapPin, GraduationCap, Calendar, Star, Users, BookOpen,
  GitFork, UserPlus, Share2, Activity, ChevronRight, Loader2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RepositoryCard from "@/components/ui/RepositoryCard";
import ContributionGraph from "@/components/ui/ContributionGraph";
import { formatNumber, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS = ["Stacks", "Starred", "Contributions"];

interface ProfileUser {
  id: string; name: string; username: string; image: string | null;
  bio: string | null; university: string | null; department: string | null;
  level: string | null; isVerified: boolean; role: string;
  createdAt: string; followers: number; following: number;
  repositoryCount: number; starsReceived: number;
}
interface Stack {
  id: string; title: string; slug: string; description: string; courseCode: string;
  university: string; department: string; semester: string; language: string;
  isVerified: boolean; views: number; stars: number; forks: number; discussions: number;
  tags: string[]; owner: { name: string; username: string; image: string | null };
  modules: { id: string }[]; updatedDaysAgo: number; lastUpdated: string;
  isStarred: boolean; isBookmarked: boolean;
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("Stacks");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [starredStacks, setStarredStacks] = useState<Stack[]>([]);
  const [contributedStacks, setContributedStacks] = useState<Stack[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/profile/${username}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setUser(d.user);
        setStacks(d.stacks ?? []);
        setStarredStacks(d.starredStacks ?? []);
        setContributedStacks(d.contributedStacks ?? []);
        setIsFollowing(d.isFollowing ?? false);
        setIsOwnProfile(d.isOwnProfile ?? false);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!session?.user) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}/follow`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return;
      setIsFollowing(data.following);
      setUser(prev => prev ? { ...prev, followers: data.followerCount } : prev);
    } finally {
      setFollowLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : username.slice(0, 2).toUpperCase();

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

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h2 className="font-manrope font-bold text-2xl text-primary">Profile not found</h2>
          <p className="text-on-surface-variant">{error || `@${username} doesn't exist on Mentra.`}</p>
          <Link href="/explore" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">Explore stacks</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const tabContent: Record<string, Stack[]> = {
    Stacks: stacks,
    Starred: starredStacks,
    Contributions: contributedStacks,
  };

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
              className="w-28 h-28 md:w-36 md:h-36 bg-secondary-container rounded-3xl border-4 border-background shadow-modal flex items-center justify-center font-bold font-manrope text-4xl text-on-secondary-container shrink-0 overflow-hidden"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : initials}
            </motion.div>

            {/* Name + actions */}
            <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary leading-tight">{user.name}</h1>
                <p className="text-on-surface-variant text-sm mt-1">@{user.username}</p>
              </motion.div>

              <div className="flex items-center gap-3">
                {!isOwnProfile && session?.user && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-all",
                      isFollowing
                        ? "bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high"
                        : "bg-primary text-on-primary hover:opacity-90"
                    )}
                  >
                    {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
                {isOwnProfile && (
                  <Link href="/settings" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-manrope bg-surface-container border border-outline-variant/30 text-primary hover:bg-surface-container-high transition-all">
                    Edit profile
                  </Link>
                )}
                <button
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-all"
                  title="Copy profile link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bio + meta */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
            {user.bio && <p className="text-on-surface-variant leading-relaxed max-w-2xl mb-4">{user.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
              {user.university && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />{user.university}
                </span>
              )}
              {user.department && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />{user.department}
                </span>
              )}
              {user.level && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />{user.level}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-outline-variant/10">
              {[
                { label: "followers", value: formatNumber(user.followers) },
                { label: "following", value: formatNumber(user.following) },
                { label: "stacks", value: user.repositoryCount },
                { label: "stars earned", value: formatNumber(user.starsReceived) },
              ].map(stat => (
                <div key={stat.label} className="flex items-baseline gap-1.5">
                  <span className="font-manrope font-bold text-base text-primary">{stat.value}</span>
                  <span className="text-sm text-on-surface-variant">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-8 w-fit overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
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
              <span className="ml-1.5 text-xs text-on-surface-variant/60">
                {tab === "Stacks" ? stacks.length : tab === "Starred" ? starredStacks.length : contributedStacks.length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          <div className="lg:col-span-2 space-y-6">
            {(tabContent[activeTab] ?? []).length === 0 ? (
              <div className="card p-12 text-center">
                <BookOpen className="w-10 h-10 text-outline-variant mx-auto mb-3" />
                <p className="font-manrope font-semibold text-primary mb-1">
                  {activeTab === "Stacks" ? "No public stacks yet" :
                   activeTab === "Starred" ? "No starred stacks yet" : "No contributions yet"}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {isOwnProfile
                    ? activeTab === "Stacks" ? "Create your first stack to share your knowledge." : "Explore stacks to star and contribute to."
                    : `${user.name} hasn't ${activeTab === "Stacks" ? "published any stacks" : activeTab === "Starred" ? "starred anything" : "contributed"} yet.`
                  }
                </p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {(tabContent[activeTab] ?? []).map((stack, i) => (
                  <motion.div key={stack.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <RepositoryCard repo={stack} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Profile sidebar */}
          <aside className="space-y-5">
            <div className="card p-5 space-y-4">
              <h3 className="font-manrope font-semibold text-sm text-primary">Profile stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Stacks published", value: user.repositoryCount },
                  { label: "Stars received", value: formatNumber(user.starsReceived) },
                  { label: "Followers", value: formatNumber(user.followers) },
                  { label: "Following", value: formatNumber(user.following) },
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">{stat.label}</span>
                    <span className="font-manrope font-semibold text-sm text-primary">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {isOwnProfile && (
              <div className="card p-5 space-y-3">
                <h3 className="font-manrope font-semibold text-sm text-primary">Quick actions</h3>
                <Link href="/upload" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors">
                  <Activity className="w-4 h-4" /> Create a stack
                </Link>
                <Link href="/settings" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors">
                  <ChevronRight className="w-4 h-4" /> Edit profile
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
