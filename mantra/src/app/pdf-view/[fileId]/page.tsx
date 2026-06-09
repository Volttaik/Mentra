"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  ArrowLeft, Download, BookOpen, Loader2, AlertTriangle,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Search, X,
  Maximize2, Minimize2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PDFJS_VERSION = "4.4.168";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function PdfViewPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const searchParams = useSearchParams();
  const slug = searchParams.get("stack") ?? "";
  const fileName = searchParams.get("name") ?? "Document";

  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.3);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [pageInput, setPageInput] = useState("1");
  const [pdfReady, setPdfReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());

  const viewUrl = `/api/stacks/${slug}/files/${fileId}/view`;
  const downloadUrl = `/api/stacks/${slug}/files/${fileId}/download`;

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current) return;
    if (renderingRef.current.has(pageNum)) return;
    const canvas = canvasRefs.current.get(pageNum);
    if (!canvas) return;

    renderingRef.current.add(pageNum);
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") console.error("Render error", e);
    } finally {
      renderingRef.current.delete(pageNum);
    }
  }, [scale]);

  const loadPdf = useCallback(async () => {
    if (!window.pdfjsLib || !slug || !fileId) return;
    setLoading(true);
    setError("");

    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;

      const res = await fetch(viewUrl, { credentials: "include" });
      if (!res.ok) {
        setError(res.status === 403 ? "You don't have permission to view this document." : "Failed to load document.");
        setLoading(false);
        return;
      }

      const buffer = await res.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setPdfReady(true);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Could not load the document. Please try again.");
      setLoading(false);
    }
  }, [slug, fileId, viewUrl]);

  // Trigger load once script is ready
  useEffect(() => {
    if (scriptReady) loadPdf();
  }, [scriptReady, loadPdf]);

  // Render pages once PDF is ready or scale changes
  useEffect(() => {
    if (!pdfReady) return;
    renderingRef.current.clear();
    for (let i = 1; i <= numPages; i++) renderPage(i);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfReady, scale, numPages]);

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

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsc = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsc);
    return () => document.removeEventListener("fullscreenchange", onFsc);
  }, []);

  // Track visible page
  useEffect(() => {
    if (numPages === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const p = parseInt(e.target.getAttribute("data-page") ?? "1", 10);
            setCurrentPage(p);
            setPageInput(String(p));
          }
        });
      },
      { threshold: 0.4 }
    );
    pageRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [numPages]);

  return (
    <>
      {/* PDF.js v4 from CDN — compatible with Babel */}
      <Script
        src={`${PDFJS_CDN}/pdf.min.js`}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setError("Failed to initialize PDF renderer.")}
      />

      <div ref={containerRef} className="min-h-screen bg-[#111] flex flex-col select-none">
        {/* Top bar */}
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
            {/* Page nav */}
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
            <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all" title="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-white/40 w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s + 0.2, 3.0))} className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all" title="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/10" />

            {/* Search */}
            <button
              onClick={() => setShowSearch(s => !s)}
              className={cn("p-1.5 rounded transition-all", showSearch ? "bg-amber-500/20 text-amber-400" : "text-white/50 hover:text-white hover:bg-white/10")}
              title="Search in document"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 bg-white/10" />

            <span className="text-xs text-white/30 hidden md:inline px-2 py-1 rounded bg-white/5 border border-white/10">Protected</span>
            <a
              href={downloadUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
            >
              <Download className="w-3.5 h-3.5" />Export
            </a>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="bg-[#1f1f1f] border-b border-white/10 px-4 py-2 flex items-center gap-3">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search text in document…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="text-xs text-white/30 shrink-0">Ctrl+F to use browser search on rendered pages</span>
          </div>
        )}

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-[#222]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white/70 font-medium">Loading document…</p>
                <p className="text-white/30 text-sm mt-1">Rendering securely via Mentra</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1">Could not load document</p>
                <p className="text-white/50 text-sm">{error}</p>
              </div>
              <Link href={slug ? `/stacks/${slug}` : "/"} className="text-sm text-amber-400 hover:underline">
                Return to stack
              </Link>
            </div>
          )}

          {!loading && !error && numPages > 0 && (
            <div className="flex flex-col items-center py-8 gap-6 px-4">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <div
                  key={pageNum}
                  data-page={pageNum}
                  ref={el => { if (el) pageRefs.current.set(pageNum, el); else pageRefs.current.delete(pageNum); }}
                  className="relative shadow-2xl"
                >
                  <div className="absolute -top-6 left-0 text-xs text-white/30 font-medium">Page {pageNum}</div>
                  <canvas
                    ref={el => {
                      if (el) canvasRefs.current.set(pageNum, el);
                      else canvasRefs.current.delete(pageNum);
                    }}
                    className="block bg-white"
                    style={{ maxWidth: "100%", display: "block" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        {numPages > 0 && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a1a] border-t border-white/10 text-xs text-white/30">
            <span>Page {currentPage} of {numPages}</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Rendered securely via Mentra — PDF not directly accessible
            </span>
          </div>
        )}
      </div>
    </>
  );
}
