"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight, BookOpen, GitFork, Star, Users, Zap,
  Search, Shield, TrendingUp, Upload, Globe, MessageSquare,
  ChevronDown, Layers
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const ROTATING_WORDS = ["Knowledge", "Research", "Courses", "Notes", "Science"];

const STATS = [
  { value: "48k+", label: "Stacks published" },
  { value: "312k+", label: "Active learners" },
  { value: "1,200+", label: "Universities" },
  { value: "4.2M+", label: "Study hours saved" },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Stacks, not files",
    description: "Organize your knowledge in layered stacks — lectures, modules, problem sets — that evolve every semester.",
  },
  {
    icon: GitFork,
    title: "Version-controlled learning",
    description: "Fork, improve, and merge academic content just like code. Every commit makes the stack smarter.",
  },
  {
    icon: Shield,
    title: "Verified by professors",
    description: "Stacks reviewed by faculty are marked verified. Quality content you can trust when it matters.",
  },
  {
    icon: Users,
    title: "Collaborative by default",
    description: "Students and lecturers build on each other's work. Knowledge compounds across semesters.",
  },
  {
    icon: Zap,
    title: "AI-powered summaries",
    description: "Auto-generated flashcards, summaries, and concept maps built into every stack.",
  },
  {
    icon: Globe,
    title: "Global academic graph",
    description: "Connect with 1,200+ universities. Find the best materials wherever they originate.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create your stack",
    description: "Upload lecture notes, PDFs, slides, or videos. Organize by module and semester in minutes.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Others build on it",
    description: "Students fork your stack, add solved problems, fix errors, improve diagrams — like pull requests for knowledge.",
    icon: Users,
  },
  {
    step: "03",
    title: "Knowledge compounds",
    description: "After five semesters your stack holds the collective understanding of hundreds of learners.",
    icon: TrendingUp,
  },
];

const HERO_IMAGES = [
  { src: "/home/study-desk.png", alt: "Student at study desk", className: "col-span-2 row-span-2" },
  { src: "/home/books-stack.png", alt: "Stack of books", className: "col-span-1 row-span-1" },
  { src: "/home/online-study.png", alt: "Online studying", className: "col-span-1 row-span-1" },
  { src: "/home/open-book-notes.png", alt: "Open book with notes", className: "col-span-1 row-span-1" },
  { src: "/home/students-collaborating.png", alt: "Students collaborating", className: "col-span-1 row-span-1" },
];

function MentraDotGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="#140b05" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  );
}

function AcademicLinesDecor() {
  return (
    <svg className="absolute right-0 top-0 h-full w-1/2 opacity-[0.03] pointer-events-none" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
      <circle cx="500" cy="150" r="280" stroke="#735b25" strokeWidth="1" fill="none" />
      <circle cx="500" cy="150" r="200" stroke="#735b25" strokeWidth="0.5" fill="none" />
      <circle cx="500" cy="150" r="130" stroke="#735b25" strokeWidth="0.5" fill="none" />
      <line x1="220" y1="150" x2="780" y2="150" stroke="#735b25" strokeWidth="0.5" />
      <line x1="500" y1="-130" x2="500" y2="430" stroke="#735b25" strokeWidth="0.5" />
      <line x1="302" y1="-48" x2="698" y2="348" stroke="#735b25" strokeWidth="0.3" />
      <line x1="698" y1="-48" x2="302" y2="348" stroke="#735b25" strokeWidth="0.3" />
    </svg>
  );
}

export default function HomePage() {
  const [wordIdx, setWordIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        <MentraDotGrid />
        <AcademicLinesDecor />

        {/* warm gradient radial glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-20 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-secondary-container/60 text-on-secondary-container px-4 py-2 rounded-full text-xs font-medium mb-8 border border-secondary/20">
              <BookOpen className="w-3.5 h-3.5" />
              The collaborative academic OS
            </div>

            <h1 className="font-manrope font-bold text-5xl md:text-6xl text-primary leading-[1.08] tracking-tight mb-6">
              Where Academic{" "}
              <span className="relative inline-block">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-secondary block"
                  >
                    {ROTATING_WORDS[wordIdx]}
                  </motion.span>
                </AnimatePresence>
                <svg className="absolute -bottom-1 left-0 w-full" height="5" viewBox="0 0 200 5" preserveAspectRatio="none">
                  <path d="M0 4 Q50 1 100 4 Q150 7 200 4" stroke="#735b25" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              Lives and Grows
            </h1>

            <p className="text-on-surface-variant text-lg leading-relaxed mb-10 max-w-lg">
              Mentra is the platform where students and professors publish, evolve, and collaborate on academic content — lecture notes, courses, and study stacks that improve with every semester.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-7 py-4 rounded-2xl font-semibold font-manrope hover:opacity-90 transition-all shadow-card hover:shadow-card-hover active:scale-[0.98]"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant/40 text-primary px-7 py-4 rounded-2xl font-semibold font-manrope hover:shadow-card transition-all active:scale-[0.98]"
              >
                <Layers className="w-4 h-4" />
                Explore stacks
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex items-center gap-6">
              {STATS.slice(0, 3).map((s, i) => (
                <div key={s.label} className={i > 0 ? "pl-6 border-l border-outline-variant/20" : ""}>
                  <p className="font-manrope font-bold text-lg text-primary">{s.value}</p>
                  <p className="text-xs text-on-surface-variant">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — image mosaic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:grid grid-cols-2 grid-rows-3 gap-3 h-[520px]"
          >
            {/* Large top-left image */}
            <div className="col-span-1 row-span-2 relative rounded-2xl overflow-hidden shadow-card">
              <Image src="/home/study-desk.png" alt="Student studying" fill sizes="300px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>

            {/* Top-right */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden shadow-card">
              <Image src="/home/books-stack.png" alt="Stack of books" fill sizes="250px" className="object-cover" />
            </div>

            {/* Middle-right */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden shadow-card">
              <Image src="/home/online-study.png" alt="Online study" fill sizes="250px" className="object-cover" />
            </div>

            {/* Bottom-left */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden shadow-card">
              <Image src="/home/open-book-notes.png" alt="Open book" fill sizes="250px" className="object-cover" />
            </div>

            {/* Bottom-right */}
            <div className="col-span-1 row-span-1 relative rounded-2xl overflow-hidden shadow-card">
              <Image src="/home/students-collaborating.png" alt="Students collaborating" fill sizes="250px" className="object-cover" />
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-4 py-3 shadow-modal"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center">
                  <Star className="w-4 h-4 text-on-secondary-container" />
                </div>
                <div>
                  <p className="font-manrope font-semibold text-xs text-primary">+1,204 forks this week</p>
                  <p className="text-[10px] text-on-surface-variant">Machine Learning Foundations</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -top-4 -right-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-4 py-3 shadow-modal"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="font-manrope font-semibold text-xs text-primary">312k+ learners online</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: scrolled ? 0 : 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-on-surface-variant/50"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ── WHAT IS MENTRA ─────────────────────────────── */}
      <section className="py-20 bg-primary">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-manrope font-bold text-3xl md:text-4xl text-on-primary leading-tight mb-6">
                GitHub taught the world to collaborate on code. Mentra does the same for knowledge.
              </h2>
              <p className="text-on-primary/70 leading-relaxed mb-6">
                Every semester, millions of students rewrite the same lecture notes from scratch. A brilliant student makes a perfect summary — then it&apos;s lost. Mentra ends that cycle.
              </p>
              <p className="text-on-primary/70 leading-relaxed">
                With Mentra, every study stack is versioned, forkable, and collaborative. Last year&apos;s notes become this year&apos;s foundation. Knowledge compounds instead of disappearing.
              </p>
            </div>
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-card">
              <Image src="/home/library-grand.png" alt="Grand library" fill className="object-cover" />
              <div className="absolute inset-0 bg-primary/20" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FULL-WIDTH IMAGE STRIP ──────────────────────── */}
      <section className="py-0 overflow-hidden">
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 md:px-6 py-6">
          {["/home/study-desk.png", "/home/online-study.png", "/home/students-collaborating.png", "/home/library-grand.png", "/home/open-book-notes.png"].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative flex-shrink-0 w-64 h-48 rounded-2xl overflow-hidden shadow-card"
            >
              <Image src={src} alt="Academic life" fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-secondary mb-4 bg-secondary-container/50 px-3 py-1 rounded-full">How it works</span>
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary mt-2 mb-4">
              Knowledge that compounds over time
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Unlike static PDFs, Mentra stacks grow richer every semester through collective contribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px border-t border-dashed border-outline-variant/40" />
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card p-8 flex flex-col items-center text-center relative bg-surface-container-lowest"
              >
                <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mb-5">
                  <step.icon className="w-7 h-7 text-on-secondary-container" />
                </div>
                <span className="font-manrope font-bold text-5xl text-outline-variant/20 mb-2 leading-none tabular-nums">{step.step}</span>
                <h3 className="font-manrope font-semibold text-base text-primary mb-3">{step.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6 bg-surface-container-low relative overflow-hidden">
        <MentraDotGrid />
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-secondary mb-4 bg-secondary-container/50 px-3 py-1 rounded-full">Platform</span>
            <h2 className="font-manrope font-bold text-3xl md:text-4xl text-primary mt-2 mb-4">
              Built for serious learners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="card p-6 group hover:-translate-y-1 transition-all duration-300 bg-surface-container-lowest"
              >
                <div className="w-11 h-11 bg-secondary-container rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary transition-all">
                  <feature.icon className="w-5 h-5 text-on-secondary-container group-hover:text-on-secondary transition-colors" />
                </div>
                <h3 className="font-manrope font-semibold text-sm text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ─────────────────────────────────── */}
      <section className="py-16 border-y border-outline-variant/10">
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
                <p className="font-manrope font-bold text-4xl text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-on-surface-variant">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────── */}
      <section className="py-28 px-4 md:px-6 relative overflow-hidden">
        <MentraDotGrid />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-container/30 via-transparent to-primary-container/20 pointer-events-none" />
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="font-manrope font-bold text-4xl md:text-5xl text-primary leading-tight mb-6">
              Stop rewriting.<br />Start building on what came before.
            </h2>
            <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">
              Join 312,000+ students and professors already turning their knowledge into living, evolving stacks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-semibold font-manrope text-base hover:opacity-90 transition-all shadow-card hover:shadow-card-hover active:scale-[0.98]"
              >
                Create your first stack
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-secondary font-semibold hover:underline underline-offset-4 transition-all"
              >
                Browse stacks for free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
