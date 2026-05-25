"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, GitFork, Star, Users, Zap,
  Search, Shield, TrendingUp, ChevronRight, Sparkles,
  Globe, MessageSquare, Upload
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RepositoryCard from "@/components/ui/RepositoryCard";
import UserCard from "@/components/ui/UserCard";
import { MOCK_REPOSITORIES, MOCK_USERS, STATS, TESTIMONIALS } from "@/lib/data";

const FEATURES = [
  {
    icon: GitFork,
    title: "Version-Controlled Knowledge",
    description: "Track how academic content evolves semester after semester. Fork, improve, and contribute like a developer would.",
  },
  {
    icon: Users,
    title: "Collaborative Intelligence",
    description: "Students and professors build on each other's work. Every contribution makes the repository smarter.",
  },
  {
    icon: Search,
    title: "Advanced Academic Search",
    description: "Search by course code, university, topic, lecturer, or file type. Find exactly what you need, fast.",
  },
  {
    icon: Shield,
    title: "Verified Content",
    description: "Professor-verified repositories are marked trusted. Quality assurance at the source.",
  },
  {
    icon: Zap,
    title: "AI-Powered Learning",
    description: "Auto-generated summaries, quiz flashcards, and smart recommendations. Learning that adapts to you.",
  },
  {
    icon: Globe,
    title: "Global Academic Network",
    description: "Connect with students and professors across 1,200+ universities worldwide.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create a Repository",
    description: "Upload your lecture notes, PDFs, videos, or markdown content. Organize by module and semester.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Collaborate & Improve",
    description: "Other students fork your repo, fix errors, add examples, and submit improvements. Like pull requests for knowledge.",
    icon: Users,
  },
  {
    step: "03",
    title: "Knowledge Compounds",
    description: "After 5 semesters, your repository contains the collective intelligence of hundreds of learners.",
    icon: TrendingUp,
  },
];

const HERO_TAGS = [
  "Quantum Mechanics", "Data Structures", "Organic Chemistry",
  "Linear Algebra", "Machine Learning", "Molecular Biology",
];

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  return (
    <span className="font-manrope font-bold text-3xl md:text-4xl text-primary">
      {target}<span className="text-secondary">{suffix}</span>
    </span>
  );
}

export default function HomePage() {
  const [activeTag, setActiveTag] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTag((prev) => (prev + 1) % HERO_TAGS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Organic blobs */}
        <div className="organic-blob w-[600px] h-[600px] bg-secondary-container top-[-100px] right-[-200px]" />
        <div className="organic-blob w-[400px] h-[400px] bg-primary-fixed bottom-0 left-[-100px]" />

        <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              The Future of Academic Collaboration
              <span className="bg-secondary text-on-secondary text-xs px-2 py-0.5 rounded-full">Beta</span>
            </div>

            {/* Headline */}
            <h1 className="font-manrope font-bold text-4xl md:text-6xl text-primary leading-tight tracking-tight mb-6 text-balance">
              GitHub for{" "}
              <span className="relative">
                <span className="text-secondary">Academic</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 100 6" preserveAspectRatio="none">
                  <path d="M0 5 Q25 1 50 5 Q75 9 100 5" stroke="#735b25" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </span>{" "}
              Knowledge
            </h1>

            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-2xl mx-auto mb-4">
              Host, evolve, and collaborate on educational content — lecture notes, courses, and study materials that improve every semester.
            </p>

            {/* Rotating tags */}
            <div className="flex items-center justify-center gap-2 mb-10 h-8">
              <span className="text-sm text-on-surface-variant">Trending now:</span>
              <motion.span
                key={activeTag}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="tag-accent text-sm font-medium"
              >
                {HERO_TAGS[activeTag]}
              </motion.span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-semibold font-manrope text-base hover:opacity-90 transition-all shadow-card hover:shadow-card-hover active:scale-95">
                Start for free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/explore" className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 text-primary px-8 py-4 rounded-2xl font-semibold font-manrope text-base hover:shadow-card transition-all">
                <BookOpen className="w-5 h-5" />
                Explore repositories
              </Link>
            </div>
          </motion.div>

          {/* Hero visual — floating repo cards */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10 pointer-events-none" style={{ top: "60%" }} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {MOCK_REPOSITORIES.slice(0, 3).map((repo, i) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  style={{ animationDelay: `${i * 0.5}s` }}
                  className={i === 1 ? "md:translate-y-6" : ""}
                >
                  <RepositoryCard repo={repo} compact />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary-container">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                <p className="text-sm text-on-primary-container mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="tag-accent text-xs uppercase tracking-widest mb-4 inline-block">How it works</span>
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary mt-3 mb-4">
              Knowledge that compounds over time
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Unlike static PDFs or one-off uploads, Mantra repositories evolve. Every fork and commit adds to the collective intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-outline-variant/30" />
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card p-8 flex flex-col items-center text-center relative"
              >
                <div className="w-16 h-16 bg-secondary-container rounded-2xl flex items-center justify-center mb-6 relative z-10">
                  <step.icon className="w-8 h-8 text-on-secondary-container" />
                </div>
                <span className="font-manrope font-bold text-5xl text-outline-variant/30 mb-3 leading-none">{step.step}</span>
                <h3 className="font-manrope font-semibold text-lg text-primary mb-3">{step.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 md:px-6 bg-surface-container-low">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="tag-accent text-xs uppercase tracking-widest mb-4 inline-block">Platform capabilities</span>
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary mt-3 mb-4">
              Built for academic excellence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-on-secondary transition-all">
                  <feature.icon className="w-6 h-6 text-on-secondary-container group-hover:text-on-secondary transition-colors" />
                </div>
                <h3 className="font-manrope font-semibold text-base text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Repositories */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="tag-accent text-xs uppercase tracking-widest mb-3 inline-block">Trending repositories</span>
              <h2 className="font-manrope font-bold text-3xl text-primary mt-2">Top repositories this week</h2>
            </div>
            <Link href="/explore" className="hidden md:flex items-center gap-1 text-secondary font-medium text-sm hover:gap-2 transition-all">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_REPOSITORIES.slice(0, 6).map((repo, i) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <RepositoryCard repo={repo} />
              </motion.div>
            ))}
          </div>

          <div className="md:hidden flex justify-center mt-8">
            <Link href="/explore" className="btn-secondary">
              View all repositories
            </Link>
          </div>
        </div>
      </section>

      {/* Top Contributors */}
      <section className="py-24 px-4 md:px-6 bg-surface-container-low">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="tag-accent text-xs uppercase tracking-widest mb-3 inline-block">Community</span>
              <h2 className="font-manrope font-bold text-3xl text-primary mt-2">Top contributors</h2>
            </div>
            <Link href="/explore" className="hidden md:flex items-center gap-1 text-secondary font-medium text-sm">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {MOCK_USERS.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <UserCard user={user} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <span className="tag-accent text-xs uppercase tracking-widest mb-4 inline-block">Testimonials</span>
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary mt-3">
              Trusted by the academic community
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 flex flex-col gap-6"
              >
                <MessageSquare className="w-8 h-8 text-secondary/40" />
                <p className="text-on-surface-variant leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/10">
                  <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-sm font-bold font-manrope text-on-secondary-container">
                    {t.author.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary font-manrope">{t.author}</p>
                    <p className="text-xs text-on-surface-variant">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 md:px-6 bg-primary-container">
        <div className="max-w-[1200px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-on-primary-fixed mb-4">
              Ready to build living knowledge?
            </h2>
            <p className="text-on-primary-container mb-10 leading-relaxed">
              Join 312,000+ students and professors already collaborating on the future of education.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-2xl font-semibold font-manrope hover:shadow-glow transition-all">
                Get started free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/explore" className="text-on-primary-container font-medium text-sm underline underline-offset-4 hover:text-on-primary-fixed transition-colors">
                Browse without signing up
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
