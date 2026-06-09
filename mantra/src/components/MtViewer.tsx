"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, BookOpen, ChevronRight, ChevronDown,
  List, FileText, AlertCircle, Lock, Maximize2,
  Minimize2, Search, XCircle, ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MtSection {
  title: string;
  level: number;
  content: string;
  subsections: MtSection[];
}

interface MtContentData {
  sections: MtSection[];
  concepts: string[];
  summary: string;
  references: string[];
  fileName?: string;
  fileType?: string;
  isPreview?: boolean;
}

interface MtViewerProps {
  contentId: string;
  fileName: string;
  onClose: () => void;
  preview?: boolean;
  onBuy?: () => void;
}

function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<mark class="bg-yellow-200/80 text-primary rounded px-0.5 mentra-search-match">$1</mark>'
  );
}

function renderContent(text: string, searchQuery = ""): string {
  let processed = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code class="bg-surface-container px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, "</p><p class='mt-3'>")
    .replace(/\n/g, "<br/>");
  if (searchQuery) processed = highlight(processed, searchQuery);
  return processed;
}

function sectionMatchesSearch(section: MtSection, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  if (section.title.toLowerCase().includes(q)) return true;
  if (section.content.toLowerCase().includes(q)) return true;
  return section.subsections.some(s => sectionMatchesSearch(s, query));
}

function SectionRenderer({
  section,
  depth = 0,
  forceOpen = false,
  searchQuery = "",
}: {
  section: MtSection;
  depth?: number;
  forceOpen?: boolean;
  searchQuery?: string;
}) {
  const [open, setOpen] = useState(forceOpen || depth === 0);
  const hasContent = section.content.trim().length > 0;
  const hasSubs = section.subsections.length > 0;

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const headingClass = cn(
    "font-manrope font-bold text-primary",
    depth === 0 && "text-xl mt-8 mb-3",
    depth === 1 && "text-lg mt-6 mb-2",
    depth === 2 && "text-base mt-4 mb-1.5",
    depth >= 3 && "text-sm mt-3 mb-1"
  );

  const titleHtml = searchQuery
    ? highlight(section.title, searchQuery)
    : section.title;

  return (
    <div className={cn(depth > 0 && "ml-4 border-l-2 border-outline-variant/20 pl-4")}>
      {section.title && (
        <button
          onClick={() => !forceOpen && setOpen(o => !o)}
          className={cn("flex items-center gap-2 w-full text-left group", forceOpen && "cursor-default")}
        >
          <span
            className={headingClass}
            dangerouslySetInnerHTML={{ __html: titleHtml }}
          />
          {!forceOpen && (hasContent || hasSubs) && (
            open ? (
              <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
            )
          )}
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={forceOpen ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {hasContent && (
              <p
                className="text-sm text-on-surface leading-relaxed mt-2"
                dangerouslySetInnerHTML={{
                  __html: `<p class='mt-0'>${renderContent(section.content.trim(), searchQuery)}</p>`,
                }}
              />
            )}
            {hasSubs &&
              section.subsections.map((sub, i) => (
                <SectionRenderer
                  key={i}
                  section={sub}
                  depth={depth + 1}
                  forceOpen={forceOpen}
                  searchQuery={searchQuery}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}

export default function MtViewer({ contentId, fileName, onClose, preview = false, onBuy }: MtViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<MtContentData | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "concepts" | "references">("content");
  const [showToc, setShowToc] = useState(false);
  const [fullRead, setFullRead] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    const url = preview ? `/api/mt/${contentId}?preview=true` : `/api/mt/${contentId}`;
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
        }
      })
      .catch(() => setError("Failed to load content."))
      .finally(() => setLoading(false));
  }, [contentId, preview]);

  useEffect(() => {
    if (!searchQuery.trim() || !scrollContainerRef.current) return;
    const timeout = setTimeout(() => {
      const firstMatch = scrollContainerRef.current?.querySelector(".mentra-search-match");
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const toggleFullRead = useCallback(() => {
    setFullRead(v => {
      if (!v) {
        setShowToc(false);
        setTimeout(() => searchRef.current?.focus(), 200);
      }
      return !v;
    });
  }, []);

  const displayName = stripExtension(fileName);

  const visibleSections = data?.sections.filter(s =>
    sectionMatchesSearch(s, searchQuery)
  ) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "bg-background border border-outline-variant/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
          fullRead
            ? "w-full h-full max-w-none max-h-none rounded-none"
            : "w-full max-w-3xl max-h-[88vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/15 bg-surface-container-low shrink-0">
          <div className="w-8 h-8 bg-secondary-container rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-on-secondary-container" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-manrope font-semibold text-sm text-primary truncate">{displayName}</p>
            {preview && (
              <p className="text-[11px] text-amber-600 font-medium">Preview mode</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!fullRead && (
              <button
                onClick={() => setShowToc(s => !s)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  showToc
                    ? "bg-secondary-container text-on-secondary-container"
                    : "hover:bg-surface-container text-on-surface-variant"
                )}
                title="Table of contents"
              >
                <List className="w-4 h-4" />
              </button>
            )}
            {data && !preview && (
              <button
                onClick={toggleFullRead}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  fullRead
                    ? "bg-secondary-container text-on-secondary-container"
                    : "hover:bg-surface-container text-on-surface-variant"
                )}
                title={fullRead ? "Exit full read" : "Read in full"}
              >
                {fullRead ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="w-7 h-7 text-secondary animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            {error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("unauthorized") ? (
              <>
                <div className="w-12 h-12 bg-error-container/20 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-error" />
                </div>
                <p className="font-manrope font-semibold text-primary">Access Restricted</p>
                <p className="text-sm text-on-surface-variant max-w-xs">
                  You need to purchase this stack to view its content.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-error" />
                <p className="text-sm text-on-surface-variant">{error}</p>
              </>
            )}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Full Read Mode */}
            {fullRead ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search bar */}
                <div className="px-6 py-3 border-b border-outline-variant/10 bg-surface-container-low shrink-0">
                  <div className="relative max-w-xl mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search within this content…"
                      className="w-full pl-9 pr-9 py-2 bg-background border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-center text-xs text-on-surface-variant mt-2">
                      {visibleSections.length === 0
                        ? "No sections match your search"
                        : `${visibleSections.length} section${visibleSections.length !== 1 ? "s" : ""} found`}
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
                  <div className="max-w-3xl mx-auto px-6 py-6">
                    {data.summary && !searchQuery && (
                      <div className="mb-8 p-4 bg-secondary-container/20 border border-secondary/10 rounded-2xl">
                        <p className="text-sm text-on-surface-variant leading-relaxed">{data.summary}</p>
                      </div>
                    )}
                    {visibleSections.length === 0 && searchQuery ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <Search className="w-8 h-8 text-outline-variant" />
                        <p className="text-sm text-on-surface-variant">No content matches &ldquo;{searchQuery}&rdquo;</p>
                      </div>
                    ) : visibleSections.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <BookOpen className="w-8 h-8 text-outline-variant" />
                        <p className="text-sm text-on-surface-variant">No structured sections found in this content.</p>
                      </div>
                    ) : (
                      visibleSections.map((section, i) => (
                        <SectionRenderer
                          key={i}
                          section={section}
                          depth={0}
                          forceOpen
                          searchQuery={searchQuery}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Normal modal mode */
              <div className="flex flex-1 overflow-hidden">
                <AnimatePresence>
                  {showToc && data.sections.length > 0 && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-r border-outline-variant/15 bg-surface-container-low overflow-y-auto shrink-0"
                    >
                      <div className="p-3">
                        <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2 px-1">Contents</p>
                        {data.sections.map((s, i) => (
                          <div key={i} className="space-y-0.5">
                            <button className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-container text-xs text-primary truncate transition-colors">
                              {s.title}
                            </button>
                            {s.subsections.map((sub, j) => (
                              <button key={j} className="w-full text-left px-4 py-1 rounded-lg hover:bg-surface-container text-xs text-on-surface-variant truncate transition-colors">
                                {sub.title}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col overflow-hidden">
                  {data.summary && (
                    <div className="px-6 py-3 bg-secondary-container/10 border-b border-outline-variant/10 shrink-0">
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{data.summary}</p>
                    </div>
                  )}

                  <div className="flex gap-1 px-6 pt-4 shrink-0">
                    {(["content", "concepts", "references"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                          activeTab === tab
                            ? "bg-secondary-container text-on-secondary-container"
                            : "text-on-surface-variant hover:bg-surface-container"
                        )}
                      >
                        {tab}
                        {tab === "concepts" && data.concepts.length > 0 && (
                          <span className="ml-1 text-[10px] opacity-70">({data.concepts.length})</span>
                        )}
                        {tab === "references" && data.references.length > 0 && (
                          <span className="ml-1 text-[10px] opacity-70">({data.references.length})</span>
                        )}
                      </button>
                    ))}

                    {data.sections.length > 0 && !preview && (
                      <button
                        onClick={toggleFullRead}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:bg-secondary-container/30 transition-all"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        Read in full
                      </button>
                    )}
                  </div>

                  {/* Search bar — normal mode */}
                  {activeTab === "content" && data.sections.length > 0 && (
                    <div className="px-6 pt-2 pb-1 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
                        <input
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search within content…"
                          className="w-full pl-8 pr-8 py-1.5 bg-surface-container border border-outline-variant/20 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary/30"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-6 py-4 relative" ref={scrollContainerRef}>
                    {activeTab === "content" && (
                      <div>
                        {data.sections.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                            <BookOpen className="w-8 h-8 text-outline-variant" />
                            <p className="text-sm text-on-surface-variant">No structured sections found in this content.</p>
                          </div>
                        ) : (
                          data.sections.map((section, i) => (
                            <SectionRenderer key={i} section={section} depth={0} searchQuery={searchQuery} />
                          ))
                        )}

                        {/* Preview paywall overlay */}
                        {preview && data.isPreview && (
                          <div className="sticky bottom-0 left-0 right-0 mt-4">
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                            <div className="relative z-10 flex flex-col items-center gap-3 py-6 text-center">
                              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <Lock className="w-5 h-5 text-amber-600" />
                              </div>
                              <p className="font-manrope font-semibold text-primary text-sm">That&apos;s the preview</p>
                              <p className="text-xs text-on-surface-variant max-w-xs">Purchase this stack to access the full content.</p>
                              {onBuy && (
                                <button
                                  onClick={onBuy}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold font-manrope hover:opacity-90 transition-all"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  Buy to read more
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "concepts" && (
                      <div>
                        {data.concepts.length === 0 ? (
                          <p className="text-sm text-on-surface-variant py-4">No key concepts extracted.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {data.concepts.map((c, i) => (
                              <span
                                key={i}
                                className="px-3 py-1.5 bg-secondary-container/50 text-on-secondary-container rounded-full text-xs font-medium"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "references" && (
                      <div className="space-y-2 pt-2">
                        {data.references.length === 0 ? (
                          <p className="text-sm text-on-surface-variant py-4">No references found.</p>
                        ) : (
                          data.references.map((ref, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-surface-container rounded-xl">
                              <span className="text-xs text-secondary font-medium shrink-0 mt-0.5">[{i + 1}]</span>
                              <p className="text-xs text-on-surface-variant break-all leading-relaxed">{ref}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
