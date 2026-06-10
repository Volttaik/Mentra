"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  ArrowLeft, BookOpen, Loader2, AlertTriangle,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Search, X,
  Maximize2, Minimize2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* PDF.js v3 (UMD) — works as a plain <script> tag, exposes window.pdfjsLib */
const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

declare global {
  interface Window { pdfjsLib: any; }
}

/* Pages within this many pixels of the viewport get rendered */
const RENDER_MARGIN = 800;

export default function PdfViewPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const searchParams = useSearchParams();
  const slug      = searchParams.get("stack") ?? "";
  const fileName  = searchParams.get("name")  ?? "Document";

  const [scriptReady, setScriptReady]   = useState(false);
  const [loading,     setLoading]       = useState(true);
  const [error,       setError]         = useState("");
  const [numPages,    setNumPages]      = useState(0);
  const [currentPage, setCurrentPage]  = useState(1);
  const [scale,       setScale]         = useState(0.8);
  const [showSearch,  setShowSearch]    = useState(false);
  const [pageInput,   setPageInput]     = useState("1");
  const [fullscreen,  setFullscreen]    = useState(false);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  const containerRef  = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pdfDocRef     = useRef<any>(null);
  const canvasRefs    = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageRefs      = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageSizes     = useRef<Map<number, { w: number; h: number }>>(new Map());
  const renderQueue   = useRef<Set<number>>(new Set());

  const viewUrl = `/api/stacks/${slug}/files/${fileId}/view`;

  /* ── Render a single page to its canvas ── */
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current || renderQueue.current.has(pageNum)) return;
    const canvas = canvasRefs.current.get(pageNum);
    if (!canvas) return;

    renderQueue.current.add(pageNum);
    try {
      const page     = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const dpr      = window.devicePixelRatio || 1;
      const ctx      = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width  = Math.floor(viewport.width  * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width  = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);

      await page.render({ canvasContext: ctx, viewport }).promise;
      setRenderedPages(prev => new Set([...prev, pageNum]));
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") console.error("Render error", e);
    } finally {
      renderQueue.current.delete(pageNum);
    }
  }, [scale]);

  /* ── Which pages are near the scroll viewport? ── */
  const checkVisiblePages = useCallback(() => {
    const scroll = scrollAreaRef.current;
    if (!scroll || numPages === 0) return;
    const top    = scroll.scrollTop - RENDER_MARGIN;
    const bottom = scroll.scrollTop + scroll.clientHeight + RENDER_MARGIN;

    pageRefs.current.forEach((el, pageNum) => {
      const rect = el.offsetTop;
      const h    = el.offsetHeight;
      if (rect + h >= top && rect <= bottom) {
        if (!renderQueue.current.has(pageNum) && !renderedPages.has(pageNum)) {
          renderPage(pageNum);
        }
      }
    });
  }, [numPages, renderedPages, renderPage]);

  /* ── Load PDF ── */
  const loadPdf = useCallback(async () => {
    if (!window.pdfjsLib || !slug || !fileId) return;
    setLoading(true);
    setError("");

    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;

      const res = await fetch(viewUrl, { credentials: "include" });
      if (!res.ok) {
        setError(res.status === 403
          ? "You don't have permission to view this document."
          : "Failed to load document.");
        setLoading(false);
        return;
      }

      const buffer = await res.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      pdfDocRef.current = pdf;

      /* Pre-compute page sizes for placeholder divs */
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp   = page.getViewport({ scale });
        pageSizes.current.set(i, { w: vp.width, h: vp.height });
      }

      setNumPages(pdf.numPages);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Could not load the document. Please try again.");
      setLoading(false);
    }
  }, [slug, fileId, viewUrl, scale]);

  useEffect(() => { if (scriptReady) loadPdf(); }, [scriptReady, loadPdf]);

  /* ── When numPages set, render first visible pages ── */
  useEffect(() => {
    if (numPages === 0) return;
    /* slight delay to let DOM settle */
    const t = setTimeout(() => checkVisiblePages(), 100);
    return () => clearTimeout(t);
  }, [numPages, checkVisiblePages]);

  /* ── Re-render all already-rendered pages on scale change ── */
  useEffect(() => {
    if (numPages === 0) return;
    renderQueue.current.clear();
    setRenderedPages(new Set());
    /* re-precompute sizes then re-render visible */
    (async () => {
      if (!pdfDocRef.current) return;
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocRef.current.getPage(i);
        const vp   = page.getViewport({ scale });
        pageSizes.current.set(i, { w: vp.width, h: vp.height });
      }
      setTimeout(() => checkVisiblePages(), 100);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  /* ── Scroll listener for lazy rendering ── */
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => checkVisiblePages();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [checkVisiblePages]);

  /* ── Track current page via intersection ── */
  useEffect(() => {
    if (numPages === 0) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const p = parseInt(e.target.getAttribute("data-page") ?? "1", 10);
          setCurrentPage(p);
          setPageInput(String(p));
        }
      });
    }, { root: scrollAreaRef.current, threshold: 0.3 });
    pageRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages]);

  /* ── Fullscreen ── */
  useEffect(() => {
    const onFsc = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsc);
    return () => document.removeEventListener("fullscreenchange", onFsc);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const scrollToPage = (page: number) => {
    const el = pageRefs.current.get(page);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(page);
      setPageInput(String(page));
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(pageInput, 10);
    if (n >= 1 && n <= numPages) scrollToPage(n);
    else setPageInput(String(currentPage));
  };

  return (
    <>
      {/* PDF.js v3 UMD — exposes window.pdfjsLib reliably */}
      <Script
        src={`${PDFJS_CDN}/pdf.min.js`}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setError("Failed to initialize PDF renderer.")}
      />

      <div ref={containerRef} className="h-screen bg-[#111] flex flex-col select-none overflow-hidden">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-white/10 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={slug ? `/stacks/${slug}` : "/"}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-amber-500/20 rounded flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-white/80 truncate max-w-[150px] md:max-w-xs">
                {decodeURIComponent(fileName)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Page navigation */}
            {numPages > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
                  <input
                    value={pageInput}
                    onChange={e => setPageInput(e.target.value)}
                    className="w-9 text-center bg-white/10 border border-white/20 rounded text-xs text-white py-1 focus:outline-none focus:border-amber-400/60"
                  />
                </form>
                <span className="text-xs text-white/40">/ {numPages}</span>
                <button
                  onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage >= numPages}
                  className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="w-px h-5 bg-white/10 hidden sm:block" />

            {/* Zoom */}
            <button onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-white/40 w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s + 0.25, 3.0))} className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all">
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/10" />

            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(s => !s)}
              className={cn("p-1.5 rounded transition-all", showSearch ? "bg-amber-500/20 text-amber-400" : "text-white/50 hover:text-white hover:bg-white/10")}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all">
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 bg-white/10" />

          </div>
        </div>

        {/* ── Search bar ── */}
        {showSearch && (
          <div className="bg-[#1f1f1f] border-b border-white/10 px-4 py-2 flex items-center gap-3 shrink-0">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              autoFocus
              placeholder="Use Ctrl+F to search within rendered pages…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <button onClick={() => setShowSearch(false)} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Canvas scroll area ── */}
        <div ref={scrollAreaRef} className="flex-1 bg-[#1c1c1c]" style={{ overflow: "auto", overflowX: "auto" }}>
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Could not load document</p>
                <p className="text-white/50 text-sm">{error}</p>
              </div>
              <Link href={slug ? `/stacks/${slug}` : "/"} className="text-sm text-amber-400 hover:underline">
                Return to stack
              </Link>
            </div>
          )}

          {!loading && !error && numPages > 0 && (
            <div className="flex flex-col items-center py-8 gap-6" style={{ minWidth: "min-content" }}>
              {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => {
                const size = pageSizes.current.get(pageNum);
                return (
                  <div key={pageNum} className="relative">
                    <div className="absolute -top-5 left-0 text-[10px] text-white/25 font-medium tabular-nums">
                      {pageNum} / {numPages}
                    </div>
                    <div
                      data-page={pageNum}
                      ref={el => { if (el) pageRefs.current.set(pageNum, el); else pageRefs.current.delete(pageNum); }}
                      style={size ? { width: size.w, height: size.h } : { minHeight: 900, minWidth: 640 }}
                      className="relative shadow-2xl bg-white"
                    >
                      {/* Placeholder shimmer while not yet rendered */}
                      {!renderedPages.has(pageNum) && (
                        <div className="absolute inset-0 bg-[#2a2a2a] flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                        </div>
                      )}
                      <canvas
                        ref={el => {
                          if (el) canvasRefs.current.set(pageNum, el);
                          else canvasRefs.current.delete(pageNum);
                        }}
                        className="block"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Status bar ── */}
        {numPages > 0 && (
          <div className="flex items-center px-4 py-1.5 bg-[#161616] border-t border-white/10 text-[11px] text-white/25 shrink-0">
            <span>Page {currentPage} of {numPages}</span>
          </div>
        )}
      </div>
    </>
  );
}
