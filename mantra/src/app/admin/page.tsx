"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Users, BookOpen, Flag, Shield, AlertTriangle,
  CheckCircle, XCircle, Eye, TrendingUp, Activity
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { MOCK_REPOSITORIES, MOCK_USERS, formatNumber } from "@/lib/data";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Repositories", "Users", "Reports", "Analytics"];

const REPORTED_CONTENT = [
  { id: "r1", type: "repository", title: "Calculus II Notes", reason: "Possible copyright infringement", reporter: "student_x", status: "pending", time: "2h ago" },
  { id: "r2", type: "discussion", title: "Off-topic discussion in ML Foundations", reason: "Spam / off-topic content", reporter: "user_y", status: "reviewing", time: "5h ago" },
  { id: "r3", type: "user", title: "User: anonymous_99", reason: "Inappropriate username", reporter: "admin", status: "resolved", time: "1d ago" },
];

const PLATFORM_STATS = [
  { label: "Total repositories", value: "48,291", icon: BookOpen, trend: "+2.3%" },
  { label: "Active users", value: "89,120", icon: Users, trend: "+5.1%" },
  { label: "This week uploads", value: "3,847", icon: TrendingUp, trend: "+12%" },
  { label: "Pending reports", value: "14", icon: Flag, trend: "-3" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto px-4 md:px-6 py-10 w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-error rounded-lg flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-on-error" />
              </div>
              <span className="text-xs font-bold text-error uppercase tracking-widest">Admin Panel</span>
            </div>
            <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary">Platform Management</h1>
          </div>
        </div>

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

        {activeTab === "Overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {PLATFORM_STATS.map((stat, i) => (
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
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                      stat.trend.startsWith("+") ? "bg-green-100 text-green-700" : "bg-error-container text-on-error-container"
                    )}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="font-manrope font-bold text-2xl text-primary">{stat.value}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Recent reports */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Flag className="w-5 h-5 text-error" />
                <h3 className="font-manrope font-semibold text-base text-primary">Recent reports</h3>
                <span className="text-xs bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-medium">
                  {REPORTED_CONTENT.filter(r => r.status === "pending").length} pending
                </span>
              </div>
              <div className="space-y-3">
                {REPORTED_CONTENT.map(report => (
                  <div key={report.id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      report.type === "repository" ? "bg-secondary-container" :
                      report.type === "discussion" ? "bg-primary-fixed" : "bg-error-container/40"
                    )}>
                      {report.type === "repository" && <BookOpen className="w-4 h-4 text-on-secondary-container" />}
                      {report.type === "discussion" && <Activity className="w-4 h-4 text-primary" />}
                      {report.type === "user" && <Users className="w-4 h-4 text-error" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{report.title}</p>
                      <p className="text-xs text-on-surface-variant">{report.reason} · {report.time}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                        report.status === "pending" ? "bg-amber-100 text-amber-700" :
                        report.status === "reviewing" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {report.status}
                      </span>
                      <button className="text-on-surface-variant hover:text-primary transition-colors p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      {report.status !== "resolved" && (
                        <>
                          <button className="text-green-600 hover:text-green-700 transition-colors p-1">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="text-error hover:opacity-80 transition-colors p-1">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "Repositories" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-manrope font-semibold text-base text-primary">All repositories</h2>
              <div className="flex gap-2">
                <select className="input-field text-sm py-2 px-3 w-auto">
                  <option>All statuses</option>
                  <option>Verified</option>
                  <option>Unverified</option>
                  <option>Reported</option>
                </select>
              </div>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Repository</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Owner</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Stars</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_REPOSITORIES.map((repo, i) => (
                    <tr key={repo.id} className="border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-primary">{repo.title}</p>
                        <p className="text-xs text-on-surface-variant">{repo.courseCode} · {repo.university}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-sm text-on-surface-variant">{repo.owner.username}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-sm text-primary font-medium">{formatNumber(repo.stars)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                          repo.isVerified ? "bg-green-100 text-green-700" : "bg-surface-container-high text-on-surface-variant"
                        )}>
                          {repo.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-xs text-secondary hover:underline">View</button>
                          <button className="text-xs text-on-surface-variant hover:text-primary transition-colors">{repo.isVerified ? "Unverify" : "Verify"}</button>
                          <button className="text-xs text-error hover:underline">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "Users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Institution</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Contributions</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...MOCK_USERS, ...MOCK_USERS].map((user, i) => (
                    <tr key={`${user.id}-${i}`} className="border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center text-xs font-bold font-manrope text-on-secondary-container shrink-0">
                            {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">{user.name}</p>
                            <p className="text-xs text-on-surface-variant">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-sm text-on-surface-variant">{user.university}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-sm text-primary font-medium">{formatNumber(user.contributions)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-xs text-secondary hover:underline">View</button>
                          <button className="text-xs text-error hover:underline">Suspend</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {(activeTab === "Reports" || activeTab === "Analytics") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
            <BarChart3 className="w-12 h-12 text-outline-variant mx-auto mb-4" />
            <h3 className="font-manrope font-semibold text-lg text-primary mb-2">
              {activeTab === "Analytics" ? "Advanced Analytics" : "Content Reports"}
            </h3>
            <p className="text-on-surface-variant text-sm">Full {activeTab.toLowerCase()} dashboard coming soon.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
