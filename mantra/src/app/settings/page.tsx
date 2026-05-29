"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Key, Bell, Shield, Save, Plus, Trash2,
  Copy, Check, Loader2, ArrowLeft, AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NOTIFICATION_PREFS = [
  { key: "stars", label: "Someone stars your stack" },
  { key: "forks", label: "Someone forks your stack" },
  { key: "comments", label: "New comment on your discussion" },
  { key: "follows", label: "Someone follows you" },
  { key: "announcements", label: "Platform announcements" },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map(p => [p.key, true]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const handleToggle = async (key: string) => {
    const newVal = !prefs[key];
    setPrefs(p => ({ ...p, [key]: newVal }));
    setSaving(key);
    await new Promise(r => setTimeout(r, 400));
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Notification preferences</h2>
      <p className="text-sm text-on-surface-variant mb-5">Choose what activity you want to be notified about.</p>
      <div className="space-y-1">
        {NOTIFICATION_PREFS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
            <span className="text-sm text-on-surface">{label}</span>
            <div className="flex items-center gap-2">
              {saved === key && <span className="text-xs text-secondary">Saved</span>}
              <button
                onClick={() => handleToggle(key)}
                disabled={saving === key}
                className="relative inline-flex items-center cursor-pointer disabled:opacity-70"
                aria-label={prefs[key] ? "Disable" : "Enable"}
              >
                <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${prefs[key] ? "bg-secondary" : "bg-outline-variant/40"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform duration-200 ${prefs[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  lastUsed: string | null;
  requests: number;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("Profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", bio: "", university: "", department: "", level: "", website: "", location: "",
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [keysLoading, setKeysLoading] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      if (d.user) {
        setForm({
          name: d.user.name ?? "",
          bio: d.user.bio ?? "",
          university: d.user.university ?? "",
          department: d.user.department ?? "",
          level: d.user.level ?? "",
          website: d.user.website ?? "",
          location: d.user.location ?? "",
        });
      }
    });
  }, [session]);

  useEffect(() => {
    if (tab !== "API Keys") return;
    setKeysLoading(true);
    fetch("/api/keys").then(r => r.json()).then(d => {
      setApiKeys(d.keys ?? []);
    }).finally(() => setKeysLoading(false));
  }, [tab]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await updateSession();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    setError("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create key"); return; }
      setNewKeyValue(data.key);
      setNewKeyName("");
      const keysRes = await fetch("/api/keys");
      const keysData = await keysRes.json();
      setApiKeys(keysData.keys ?? []);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to update password.");
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordError("Something went wrong.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Failed to delete account.");
        setDeletingAccount(false);
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
    } catch {
      setDeleteError("Something went wrong.");
      setDeletingAccount(false);
    }
  };

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-[900px] mx-auto px-4 md:px-6 py-10 w-full">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />Back to dashboard
          </Link>
          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary">Settings</h1>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          <aside className="md:w-48 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
              {[
                { label: "Profile", icon: User },
                { label: "API Keys", icon: Key },
                { label: "Notifications", icon: Bell },
                { label: "Security", icon: Shield },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setTab(label)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                    tab === label
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            {error && (
              <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                {error}
              </div>
            )}

            {tab === "Profile" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-5">
                <h2 className="font-manrope font-semibold text-lg text-primary">Profile information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Full name</label>
                    <input value={form.name} onChange={e => update("name", e.target.value)} className="input-field" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Location</label>
                    <input value={form.location} onChange={e => update("location", e.target.value)} className="input-field" placeholder="City, Country" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">Bio</label>
                  <textarea value={form.bio} onChange={e => update("bio", e.target.value)} rows={3} className="input-field resize-none" placeholder="Tell the community about yourself..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">University</label>
                    <input value={form.university} onChange={e => update("university", e.target.value)} className="input-field" placeholder="Your university" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Department</label>
                    <input value={form.department} onChange={e => update("department", e.target.value)} className="input-field" placeholder="Your department" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Academic level</label>
                    <select value={form.level} onChange={e => update("level", e.target.value)} className="input-field">
                      <option value="">Select level</option>
                      {["Undergraduate", "Masters", "PhD", "Professor", "Lecturer", "Other"].map(l => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">Website</label>
                    <input value={form.website} onChange={e => update("website", e.target.value)} className="input-field" placeholder="https://yoursite.com" />
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? "Saved!" : "Save changes"}
                  </button>
                  {saved && <span className="text-sm text-secondary">Profile updated successfully.</span>}
                </div>
              </motion.div>
            )}

            {tab === "API Keys" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="card p-6">
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-2">API Keys</h2>
                  <p className="text-sm text-on-surface-variant mb-5">
                    Use API keys to access Mentra programmatically. Keys are shown once — store them securely.
                  </p>

                  {newKeyValue && (
                    <div className="mb-5 p-4 bg-secondary-container/30 border border-secondary/20 rounded-xl">
                      <p className="text-xs font-semibold text-secondary mb-2">New API Key — copy it now, it won&apos;t be shown again</p>
                      <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2">
                        <code className="flex-1 text-xs text-primary font-mono break-all">{newKeyValue}</code>
                        <button onClick={() => copyToClipboard(newKeyValue, "new")} className="shrink-0 text-on-surface-variant hover:text-primary transition-colors">
                          {copied === "new" ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <input
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateKey()}
                      placeholder="Key name (e.g. My App)"
                      className="input-field flex-1"
                    />
                    <button
                      onClick={handleCreateKey}
                      disabled={creatingKey || !newKeyName.trim()}
                      className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all shrink-0"
                    >
                      {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Generate
                    </button>
                  </div>

                  {keysLoading ? (
                    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />)}</div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-sm text-on-surface-variant">No API keys yet. Generate one above to get started.</div>
                  ) : (
                    <div className="space-y-3">
                      {apiKeys.map(key => (
                        <div key={key.id} className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm text-primary truncate">{key.name}</p>
                              {!key.isActive && <span className="text-xs bg-error-container text-error px-2 py-0.5 rounded-full">Inactive</span>}
                            </div>
                            <p className="text-xs text-on-surface-variant font-mono">{key.keyPreview}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {key.requests} requests · {key.lastUsed ? `Last used ${new Date(key.lastUsed).toLocaleDateString()}` : "Never used"}
                            </p>
                          </div>
                          <button onClick={() => handleDeleteKey(key.id)} className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-lg hover:bg-error-container/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "Notifications" && (
              <NotificationsTab />
            )}

            {tab === "Security" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Change password */}
                <div className="card p-6">
                  <h2 className="font-manrope font-semibold text-lg text-primary mb-5">Change password</h2>
                  {passwordSuccess && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-secondary-container/30 border border-secondary/20 rounded-xl text-sm text-secondary">
                      <Check className="w-4 h-4" />Password updated successfully.
                    </div>
                  )}
                  {passwordError && (
                    <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                      {passwordError}
                    </div>
                  )}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Current password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="input-field pr-12"
                          placeholder="Enter current password"
                          required
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">New password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="input-field pr-12"
                          placeholder="At least 8 characters"
                          required
                          minLength={8}
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1.5">Confirm new password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="input-field"
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
                    >
                      {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      Update password
                    </button>
                  </form>
                </div>

                {/* Delete account */}
                <div className="card p-6 border border-error/20">
                  <h3 className="font-manrope font-semibold text-base text-error mb-2">Danger zone</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Permanently delete your account and all your stacks. This cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 border border-error/30 text-error px-4 py-2.5 rounded-xl text-sm font-semibold font-manrope hover:bg-error-container/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />Delete account
                    </button>
                  ) : (
                    <div className="space-y-4 p-4 bg-error-container/10 border border-error/20 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                        <p className="text-sm text-error font-medium">
                          Enter your password to confirm account deletion.
                        </p>
                      </div>
                      {deleteError && (
                        <p className="text-sm text-error">{deleteError}</p>
                      )}
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={e => setDeletePassword(e.target.value)}
                        placeholder="Your current password"
                        className="input-field border-error/30"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                          className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount || !deletePassword}
                          className="flex items-center gap-2 bg-error text-on-error px-5 py-2 rounded-xl text-sm font-semibold font-manrope hover:opacity-90 disabled:opacity-60 transition-all"
                        >
                          {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete my account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
