"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, Github, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-container relative overflow-hidden flex-col justify-between p-12">
        <div className="organic-blob w-[500px] h-[500px] bg-secondary top-[-100px] right-[-100px]" />
        <div className="organic-blob w-[300px] h-[300px] bg-primary-fixed bottom-[-50px] left-[-50px]" />

        {/* Logo */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-on-primary" />
          </div>
          <span className="font-manrope font-bold text-xl text-primary">Mantra</span>
        </div>

        {/* Quote */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-manrope font-semibold text-primary leading-relaxed">
            "Knowledge compounds when it's shared. Every commit is a gift to future students."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center font-bold font-manrope text-on-secondary-container text-sm">
              MC
            </div>
            <div>
              <p className="font-semibold text-sm text-primary">Marcus Chen</p>
              <p className="text-xs text-on-surface-variant">Professor of Physics, MIT</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
          {[
            { value: "48k+", label: "Repositories" },
            { value: "312k+", label: "Contributors" },
            { value: "1,200+", label: "Universities" },
          ].map(s => (
            <div key={s.label} className="card p-3">
              <p className="font-manrope font-bold text-xl text-primary">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-on-primary" />
            </div>
            <span className="font-manrope font-bold text-lg text-primary">Mantra</span>
          </Link>

          <h1 className="font-manrope font-bold text-2xl md:text-3xl text-primary mb-2">
            Welcome back
          </h1>
          <p className="text-on-surface-variant mb-8">
            Sign in to your account to continue learning.
          </p>

          {/* Social login */}
          <button className="w-full flex items-center justify-center gap-3 border border-outline-variant/40 bg-surface-container-lowest py-3 rounded-xl text-sm font-medium text-primary hover:bg-surface-container transition-all mb-6 shadow-card">
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs text-on-surface-variant">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="amara@university.edu"
                className="input-field"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-medium text-primary">Password</label>
                <Link href="#" className="text-xs text-secondary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-xl font-semibold font-manrope text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-card active:scale-[0.99] mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-secondary font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
