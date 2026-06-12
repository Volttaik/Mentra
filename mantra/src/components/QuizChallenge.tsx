"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit, Trophy, RotateCcw, ChevronRight, CheckCircle2,
  XCircle, Loader2, TrendingUp, TrendingDown, Medal, ArrowLeft,
  MessageSquare, X, ArrowUp, Sparkles, Clock, Share2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string; question: string; options: string[];
  correctIndex: number; explanation: string | null; topic: string | null; order: number;
}
interface LeaderboardEntry {
  rank: number; userId: string; name: string; username: string;
  image: string | null; score: number; total: number; pct: number;
}
interface QuizData {
  id: string; title: string; description: string | null;
  durationMinutes: number; expiresAt: string | null;
  questions: QuizQuestion[];
  stack: { id: string; slug: string; title: string; isPublic: boolean; ownerId: string };
  _count: { attempts: number };
}
interface ResultData {
  score: number; total: number; pct: number; grade: string;
  correct: number[]; explanations: (string | null)[]; topics: (string | null)[];
  topicResults: Record<string, { correct: number; total: number }>;
  strongAreas: string[]; weakAreas: string[];
}
interface ChatMsg { role: "user" | "agent"; content: string; }

interface Props {
  quiz: QuizData;
  leaderboard: LeaderboardEntry[];
  currentUserId: string | null;
  isAuthenticated: boolean;
  expired: boolean;
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm font-bold text-on-surface-variant w-5 text-center">#{rank}</span>;
}

function LeaderboardPanel({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId: string | null }) {
  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <div className="card p-8 text-center">
          <Trophy className="w-8 h-8 text-outline-variant mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">No attempts yet. Be the first!</p>
        </div>
      ) : (
        entries.map(e => {
          const isMe = e.userId === currentUserId;
          return (
            <div key={e.userId} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
              isMe ? "border-secondary/40 bg-secondary-container/20" : "border-outline-variant/15 bg-surface-container/50"
            )}>
              <div className="w-6 flex items-center justify-center shrink-0">
                <RankMedal rank={e.rank} />
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0 overflow-hidden flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                {e.image
                  ? <img src={e.image} alt="" className="w-full h-full object-cover" />
                  : e.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isMe ? "text-secondary" : "text-primary")}>
                  {e.name}{isMe && " (you)"}
                </p>
                <p className="text-[11px] text-on-surface-variant">@{e.username}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-sm font-bold font-manrope",
                  e.pct >= 75 ? "text-green-600" : e.pct >= 50 ? "text-amber-600" : "text-red-500")}>
                  {e.score}/{e.total}
                </p>
                <p className="text-[10px] text-on-surface-variant">{e.pct}%</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function StackChatPanel({ stackSlug, stackTitle }: { stackSlug: string; stackTitle: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/stacks/${stackSlug}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "agent", content: data.reply ?? "Sorry, I couldn't help with that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "Something went wrong. Please try again." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-outline-variant/10 shrink-0">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Study Assistant</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5">Reading content from <span className="text-secondary font-medium">{stackTitle}</span></p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-2">
            <Sparkles className="w-6 h-6 text-secondary mx-auto" />
            <p className="text-xs text-on-surface-variant">Ask me anything about this stack&apos;s content. I&apos;ve read all the study materials.</p>
            <div className="space-y-1.5 mt-3">
              {["Explain a key concept", "What topics does this cover?", "Help me understand this quiz"].map(q => (
                <button key={q} onClick={() => send(q)}
                  className="w-full text-left text-xs text-on-surface-variant hover:text-secondary bg-surface-container hover:bg-surface-container-high px-3 py-2 rounded-xl transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2 items-start", m.role === "agent" ? "flex-row" : "flex-row-reverse")}>
            {m.role === "agent" && (
              <div className="w-5 h-5 rounded-full bg-secondary-container/60 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-secondary" />
              </div>
            )}
            <p className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed",
              m.role === "agent" ? "bg-surface-container text-on-surface rounded-tl-sm" : "bg-secondary text-on-secondary rounded-br-sm"
            )}>{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-5 h-5 rounded-full bg-secondary-container/60 flex items-center justify-center shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-secondary" />
            </div>
            <div className="flex gap-1 px-3 py-2 bg-surface-container rounded-2xl rounded-tl-sm">
              {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2.5 border-t border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2 border border-outline-variant/15">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about the content…"
            className="flex-1 bg-transparent text-[12px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none" />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all",
              input.trim() && !loading ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant/30")}>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizChallenge({ quiz, leaderboard, currentUserId, isAuthenticated, expired }: Props) {
  const [mode, setMode] = useState<"start" | "taking" | "results">("start");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ResultData | null>(null);
  const [board, setBoard] = useState(leaderboard);
  const [activeTab, setActiveTab] = useState<"quiz" | "leaderboard">("quiz");
  const [chatOpen, setChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const startQuiz = () => {
    setCurrentQ(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setResults(null);
    setMode("taking");
    setActiveTab("quiz");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/stacks/${quiz.stack.slug}/quiz/${quiz.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: selectedAnswers }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setResults(data);
      setMode("results");

      const res2 = await fetch(`/api/quiz/${quiz.id}`);
      const d2 = await res2.json();
      if (d2.leaderboard) setBoard(d2.leaderboard);
    } catch { } finally { setSubmitting(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myEntry = board.find(e => e.userId === currentUserId);

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-outline-variant/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/stacks/${quiz.stack.slug}?tab=Quiz`}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{quiz.stack.title}</span>
          </Link>
          <span className="text-outline-variant/40">/</span>
          <p className="font-manrope font-semibold text-sm text-primary flex-1 truncate">{quiz.title}</p>
          <button onClick={copyLink}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-surface-container border border-outline-variant/15">
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Main area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Mobile tabs */}
          <div className="flex sm:hidden gap-1 bg-surface-container p-1 rounded-xl">
            {(["quiz", "leaderboard"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all",
                  activeTab === tab ? "bg-background text-primary shadow-sm" : "text-on-surface-variant")}>
                {tab}
              </button>
            ))}
          </div>

          {/* Expired state */}
          {expired && (
            <div className="card p-12 text-center space-y-3">
              <Clock className="w-10 h-10 text-outline-variant mx-auto" />
              <p className="font-manrope font-semibold text-primary">This quiz has expired</p>
              <p className="text-sm text-on-surface-variant">The owner set a time limit on this quiz. Ask them to generate a new one.</p>
              <Link href={`/stacks/${quiz.stack.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                <ArrowLeft className="w-4 h-4" />Back to stack
              </Link>
            </div>
          )}

          {/* Quiz panel */}
          {!expired && (activeTab === "quiz" || window !== undefined) && (
            <div className={cn(activeTab !== "quiz" && "hidden sm:block")}>
              <AnimatePresence mode="wait">
                {/* START */}
                {mode === "start" && (
                  <motion.div key="start" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="card p-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-secondary-container/40 rounded-xl flex items-center justify-center shrink-0">
                          <BrainCircuit className="w-6 h-6 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h1 className="font-manrope font-bold text-xl text-primary leading-tight">{quiz.title}</h1>
                          {quiz.description && <p className="text-sm text-on-surface-variant mt-1">{quiz.description}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Questions", value: quiz.questions.length },
                          { label: "Attempts", value: quiz._count.attempts },
                          { label: "Your best", value: myEntry ? `${myEntry.pct}%` : "—" },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-surface-container rounded-xl p-3 text-center">
                            <p className="font-manrope font-bold text-lg text-primary">{value}</p>
                            <p className="text-[11px] text-on-surface-variant">{label}</p>
                          </div>
                        ))}
                      </div>
                      {isAuthenticated ? (
                        <button onClick={startQuiz}
                          className="w-full py-3 bg-primary text-on-primary rounded-xl font-manrope font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4" />Start Quiz
                        </button>
                      ) : (
                        <Link href={`/login?callbackUrl=/quiz/${quiz.id}`}
                          className="w-full py-3 bg-primary text-on-primary rounded-xl font-manrope font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                          Sign in to take this quiz
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TAKING */}
                {mode === "taking" && (
                  <motion.div key="taking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-on-surface-variant">Question {currentQ + 1} of {quiz.questions.length}</p>
                      <button onClick={() => setMode("start")} className="text-xs text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-surface-container">
                        Exit
                      </button>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <motion.div className="h-full bg-secondary rounded-full"
                        animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
                        transition={{ duration: 0.3 }} />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="card p-6 space-y-5">
                        {quiz.questions[currentQ].topic && (
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary-container/40 text-secondary">
                            {quiz.questions[currentQ].topic}
                          </span>
                        )}
                        <p className="font-manrope font-semibold text-base text-primary leading-snug">
                          {quiz.questions[currentQ].question}
                        </p>
                        <div className="space-y-2.5">
                          {(quiz.questions[currentQ].options as string[]).map((opt, i) => (
                            <motion.button key={i} whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                setSelectedAnswers(prev => { const n = [...prev]; n[currentQ] = i; return n; });
                              }}
                              className={cn(
                                "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm",
                                selectedAnswers[currentQ] === i
                                  ? "border-secondary/50 bg-secondary-container/30 text-primary"
                                  : "border-outline-variant/20 bg-surface-container hover:bg-surface-container-high hover:border-secondary/30 text-on-surface-variant"
                              )}>
                              <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-semibold shrink-0",
                                selectedAnswers[currentQ] === i ? "border-secondary bg-secondary text-on-secondary" : "border-outline-variant/40")}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              {opt}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setCurrentQ(q => q - 1)} disabled={currentQ === 0}
                        className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors">
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {quiz.questions.map((_, i) => (
                          <button key={i} onClick={() => setCurrentQ(i)} className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            i === currentQ ? "bg-secondary w-4" : selectedAnswers[i] !== null ? "bg-secondary/40" : "bg-surface-container-high"
                          )} />
                        ))}
                      </div>
                      {currentQ < quiz.questions.length - 1 ? (
                        <button onClick={() => setCurrentQ(q => q + 1)} disabled={selectedAnswers[currentQ] === null}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-40 transition-all">
                          Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={handleSubmit} disabled={selectedAnswers.some(a => a === null) || submitting}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-secondary text-on-secondary hover:opacity-90 disabled:opacity-40 transition-all font-manrope">
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trophy className="w-4 h-4" />Submit</>}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* RESULTS */}
                {mode === "results" && results && (
                  <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="card p-8 text-center space-y-4">
                      <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mx-auto",
                        results.pct >= 75 ? "bg-green-100" : results.pct >= 50 ? "bg-amber-100" : "bg-red-100")}>
                        <Trophy className={cn("w-10 h-10", results.pct >= 75 ? "text-green-600" : results.pct >= 50 ? "text-amber-600" : "text-red-600")} />
                      </div>
                      <div>
                        <p className="font-manrope font-bold text-3xl text-primary">{results.score}/{results.total}</p>
                        <p className={cn("font-semibold mt-1", results.pct >= 75 ? "text-green-600" : results.pct >= 50 ? "text-amber-600" : "text-red-500")}>
                          {results.pct}% · {results.grade}
                        </p>
                      </div>

                      {Object.keys(results.topicResults).length > 1 && (
                        <div className="grid grid-cols-2 gap-2 text-left max-w-xs mx-auto">
                          {Object.entries(results.topicResults).map(([topic, v]) => {
                            const tp = Math.round((v.correct / v.total) * 100);
                            return (
                              <div key={topic} className="bg-surface-container rounded-xl px-3 py-2">
                                <p className="text-[10px] text-on-surface-variant truncate">{topic}</p>
                                <p className={cn("text-sm font-semibold font-manrope",
                                  tp >= 70 ? "text-green-600" : tp >= 50 ? "text-amber-600" : "text-red-500")}>
                                  {v.correct}/{v.total}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(results.strongAreas.length > 0 || results.weakAreas.length > 0) && (
                        <div className="grid grid-cols-2 gap-3 text-left max-w-xs mx-auto">
                          {results.strongAreas.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                              <div className="flex items-center gap-1.5 text-green-700 mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide">Strong</span>
                              </div>
                              {results.strongAreas.map(t => <p key={t} className="text-xs text-green-700 font-medium">{t}</p>)}
                            </div>
                          )}
                          {results.weakAreas.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                              <div className="flex items-center gap-1.5 text-red-600 mb-1">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide">Needs work</span>
                              </div>
                              {results.weakAreas.map(t => <p key={t} className="text-xs text-red-600 font-medium">{t}</p>)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3 justify-center pt-1">
                        <button onClick={() => setMode("start")}
                          className="px-4 py-2 rounded-xl text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all">
                          Back
                        </button>
                        <button onClick={startQuiz}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all font-manrope">
                          <RotateCcw className="w-3.5 h-3.5" />Try again
                        </button>
                      </div>
                    </div>

                    {/* Review */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Review</p>
                      {quiz.questions.map((q, i) => {
                        const userAns = selectedAnswers[i];
                        const correct = results.correct[i];
                        const isRight = userAns === correct;
                        return (
                          <div key={q.id} className={cn("card-sm p-4 space-y-2 border-l-4", isRight ? "border-l-green-500/50" : "border-l-red-400/50")}>
                            <div className="flex items-start gap-2">
                              {isRight ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                              <div>
                                {q.topic && <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary mr-2">{q.topic}</span>}
                                <p className="text-sm font-medium text-primary">{q.question}</p>
                              </div>
                            </div>
                            <div className="pl-6 space-y-0.5">
                              {(q.options as string[]).map((opt, j) => (
                                <p key={j} className={cn("text-xs py-0.5",
                                  j === correct ? "text-green-600 font-semibold" :
                                  j === userAns && !isRight ? "text-red-500 line-through" : "text-on-surface-variant")}>
                                  {String.fromCharCode(65 + j)}. {opt}
                                </p>
                              ))}
                              {q.explanation && <p className="text-xs text-on-surface-variant bg-surface-container px-3 py-2 rounded-xl mt-1">{q.explanation}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile leaderboard tab */}
          {activeTab === "leaderboard" && (
            <div className="sm:hidden space-y-3">
              <p className="text-sm font-semibold text-primary font-manrope flex items-center gap-2">
                <Medal className="w-4 h-4 text-secondary" />Leaderboard
              </p>
              <LeaderboardPanel entries={board} currentUserId={currentUserId} />
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden sm:flex flex-col gap-4 w-72 shrink-0">
          {/* Leaderboard */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-primary font-manrope flex items-center gap-2">
              <Medal className="w-4 h-4 text-secondary" />Leaderboard
            </p>
            <LeaderboardPanel entries={board} currentUserId={currentUserId} />
          </div>

          {/* Stack-aware AI chat */}
          {isAuthenticated && (
            <div className="card overflow-hidden flex flex-col" style={{ height: "380px" }}>
              <StackChatPanel stackSlug={quiz.stack.slug} stackTitle={quiz.stack.title} />
            </div>
          )}
        </aside>
      </div>

      {/* Mobile: floating chat button */}
      {isAuthenticated && (
        <>
          <button onClick={() => setChatOpen(true)}
            className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-secondary text-on-secondary shadow-lg flex items-center justify-center hover:scale-105 transition-all">
            <MessageSquare className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {chatOpen && (
              <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25 }}
                className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-background border-t border-outline-variant/20 rounded-t-2xl shadow-2xl flex flex-col"
                style={{ height: "60vh" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                  <p className="text-sm font-semibold text-primary">Study Assistant</p>
                  <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <StackChatPanel stackSlug={quiz.stack.slug} stackTitle={quiz.stack.title} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {chatOpen && <div className="sm:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setChatOpen(false)} />}
        </>
      )}
    </div>
  );
}
