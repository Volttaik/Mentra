"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, ArrowLeft, Download, BookOpen } from "lucide-react";
import Link from "next/link";

export default function PdfViewPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const searchParams = useSearchParams();
  const slug = searchParams.get("stack") ?? "";
  const fileName = searchParams.get("name") ?? "Document";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const viewUrl = `/api/stacks/${slug}/files/${fileId}/view`;
  const downloadUrl = `/api/stacks/${slug}/files/${fileId}/download`;

  useEffect(() => {
    if (!slug || !fileId) {
      setError("Missing document reference.");
      setLoading(false);
    }
  }, [slug, fileId]);

  return (
    <div className="min-h-screen bg-[#1a1612] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#231e18] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={slug ? `/stacks/${slug}` : "/"}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to stack
          </Link>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500/20 rounded-md flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-white/80 truncate max-w-xs">{decodeURIComponent(fileName)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-md border border-white/10">
            Protected — download blocked
          </span>
          <a
            href={downloadUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </a>
        </div>
      </div>

      {/* PDF embed area */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <AlertTriangle className="w-12 h-12 text-amber-400 opacity-60" />
            <div>
              <p className="text-white font-medium mb-1">Could not load document</p>
              <p className="text-white/50 text-sm">{error}</p>
            </div>
            <Link href={slug ? `/stacks/${slug}` : "/"} className="text-sm text-amber-400 hover:underline">
              Return to stack
            </Link>
          </div>
        ) : (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-white/50 text-sm">Loading document…</p>
                </div>
              </div>
            )}
            <iframe
              src={viewUrl}
              className="w-full h-full min-h-screen"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("Failed to load the PDF. The file may be unavailable.");
              }}
              title={decodeURIComponent(fileName)}
              style={{ border: "none", display: loading ? "none" : "block" }}
            />
          </>
        )}
      </div>
    </div>
  );
}
