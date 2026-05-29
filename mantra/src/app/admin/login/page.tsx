"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Shield, Loader2, AlertTriangle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid credentials or insufficient privileges.");
        return;
      }
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session?.user?.role === "ADMIN") {
        router.push("/admin");
        router.refresh();
      } else {
        setError("This account does not have admin privileges.");
        await fetch("/api/auth/signout", { method: "POST" });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-on-primary" />
          </div>
          <div>
            <p className="font-manrope font-bold text-lg text-primary leading-none">Mentra</p>
            <p className="text-xs text-on-surface-variant">Admin Portal</p>
          </div>
        </div>

        <div className="card p-8 shadow-modal">
          <h1 className="font-manrope font-bold text-xl text-primary mb-1">Admin sign in</h1>
          <p className="text-sm text-on-surface-variant mb-6">Restricted to authorised administrators only.</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-error-container/20 border border-error/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@mentra.app"
                className="input-field"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="input-field pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Shield className="w-4 h-4" />Sign in to Admin</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          This page is restricted. All access attempts are logged.
        </p>
      </motion.div>
    </div>
  );
}
