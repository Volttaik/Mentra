"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, Palette, Key, Trash2,
  Save, ChevronRight, ArrowLeft, Eye, EyeOff
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "api", label: "API Keys", icon: Key },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

const NOTIFICATION_SETTINGS = [
  { id: "stars", label: "Stars on stacks", description: "When someone stars your stack", defaultOn: true },
  { id: "forks", label: "Stack forks", description: "When someone forks your stack", defaultOn: true },
  { id: "comments", label: "Discussion replies", description: "When someone replies to a discussion", defaultOn: true },
  { id: "contributions", label: "Contribution requests", description: "When someone contributes to your repo", defaultOn: true },
  { id: "follows", label: "New followers", description: "When someone starts following you", defaultOn: false },
  { id: "weekly", label: "Weekly digest", description: "Summary of activity across your repos", defaultOn: true },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_SETTINGS.map(n => [n.id, n.defaultOn]))
  );
  const [profile, setProfile] = useState({
    name: "Dr. Amara Osei",
    username: "amara.osei",
    email: "amara.osei@unilag.edu.ng",
    bio: "Researching distributed systems and collaborative learning platforms. Building the future of academic knowledge sharing.",
    university: "University of Lagos",
    department: "Computer Science",
    level: "PhD Candidate",
    website: "",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-[1100px] mx-auto px-4 md:px-6 py-10 w-full">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary">Account Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar nav */}
          <aside className="w-full md:w-52 shrink-0">
            <nav className="space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeSection === item.id
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : item.id === "danger"
                      ? "text-error hover:bg-error-container/30"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {activeSection === "profile" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-6">
                <div>
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Profile information</h2>
                  <p className="text-sm text-on-surface-variant">Update your public profile details.</p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center font-bold text-xl font-manrope text-on-secondary-container">
                    AO
                  </div>
                  <div>
                    <button className="btn-secondary text-sm px-4 py-2 rounded-xl">Change avatar</button>
                    <p className="text-xs text-on-surface-variant mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
                    <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Username</label>
                    <input value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-primary mb-1.5">Email</label>
                    <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-primary mb-1.5">Bio</label>
                    <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">University</label>
                    <input value={profile.university} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Department</label>
                    <input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Academic level</label>
                    <input value={profile.level} onChange={e => setProfile(p => ({ ...p, level: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Website (optional)</label>
                    <input value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="https://yoursite.com" className="input-field" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSave} className="flex items-center gap-2 btn-primary">
                    <Save className="w-4 h-4" />
                    {saved ? "Saved!" : "Save changes"}
                  </button>
                  {saved && <span className="text-sm text-green-600 font-medium">✓ Profile updated</span>}
                </div>
              </motion.div>
            )}

            {activeSection === "notifications" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-6">
                <div>
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Notification preferences</h2>
                  <p className="text-sm text-on-surface-variant">Choose what you&apos;d like to be notified about.</p>
                </div>
                <div className="space-y-4">
                  {NOTIFICATION_SETTINGS.map(setting => (
                    <div key={setting.id} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-primary">{setting.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [setting.id]: !prev[setting.id] }))}
                        className={cn(
                          "w-11 h-6 rounded-full transition-all relative shrink-0",
                          notifications[setting.id] ? "bg-secondary" : "bg-outline-variant/40"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                          notifications[setting.id] ? "left-6" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saved ? "Saved!" : "Save preferences"}
                </button>
              </motion.div>
            )}

            {activeSection === "security" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="card p-8 space-y-5">
                  <div>
                    <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Change password</h2>
                    <p className="text-sm text-on-surface-variant">Keep your account secure with a strong password.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Current password</label>
                    <div className="relative">
                      <input type={showCurrentPw ? "text" : "password"} placeholder="Enter current password" className="input-field pr-12" />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant p-1">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">New password</label>
                    <div className="relative">
                      <input type={showNewPw ? "text" : "password"} placeholder="Enter new password" className="input-field pr-12" />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant p-1">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button className="btn-primary flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Update password
                  </button>
                </div>

                <div className="card p-6">
                  <h3 className="font-manrope font-semibold text-base text-primary mb-4">Two-factor authentication</h3>
                  <p className="text-sm text-on-surface-variant mb-4">Add an extra layer of security to your account.</p>
                  <button className="btn-secondary text-sm px-5 py-2.5 rounded-xl">Enable 2FA</button>
                </div>
              </motion.div>
            )}

            {activeSection === "appearance" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-6">
                <div>
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Appearance</h2>
                  <p className="text-sm text-on-surface-variant">Customize how Mantra looks for you.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Light", "Dark", "System"].map(theme => (
                      <button key={theme} className={cn(
                        "p-4 rounded-2xl border-2 text-sm font-medium transition-all",
                        theme === "Light" ? "border-secondary bg-secondary-container/30 text-on-secondary-container" : "border-outline-variant/30 text-on-surface-variant hover:border-secondary/30"
                      )}>
                        {theme === "Light" && "☀️ "}
                        {theme === "Dark" && "🌙 "}
                        {theme === "System" && "💻 "}
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">Font size</label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-on-surface-variant">A</span>
                    <input type="range" min="12" max="20" defaultValue="16" className="flex-1 accent-secondary" />
                    <span className="text-lg text-on-surface-variant">A</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "api" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-6">
                <div>
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-1">API Keys</h2>
                  <p className="text-sm text-on-surface-variant">Manage API keys for third-party integrations.</p>
                </div>
                <div className="bg-surface-container rounded-xl p-4 font-mono text-sm text-on-surface-variant flex items-center justify-between gap-4">
                  <span>mtr_live_•••••••••••••••••••••••••••••••</span>
                  <button className="text-secondary text-xs hover:underline shrink-0">Reveal</button>
                </div>
                <button className="btn-primary flex items-center gap-2 text-sm">
                  <Key className="w-4 h-4" />
                  Generate new key
                </button>
              </motion.div>
            )}

            {activeSection === "danger" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="border border-error/30 rounded-2xl p-6 bg-error-container/10 space-y-4">
                  <h2 className="font-manrope font-semibold text-base text-error">Danger Zone</h2>
                  <div className="space-y-4">
                    {[
                      { label: "Export your data", desc: "Download all your repositories and profile data.", action: "Export" },
                      { label: "Deactivate account", desc: "Temporarily disable your account. You can reactivate at any time.", action: "Deactivate" },
                      { label: "Delete account", desc: "Permanently delete your account and all data. This cannot be undone.", action: "Delete account", destructive: true },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between gap-4 py-4 border-b border-error/10 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-primary">{item.label}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                        </div>
                        <button className={cn(
                          "text-sm px-4 py-2 rounded-xl font-semibold shrink-0 transition-all",
                          item.destructive
                            ? "bg-error text-on-error hover:opacity-90"
                            : "border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                        )}>
                          {item.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
