"use client";

import Link from "next/link";
import { Star, GitFork, MessageSquare, Eye, Shield, Clock } from "lucide-react";
import { cn, formatNumber, truncate } from "@/lib/utils";

interface RepositoryCardProps {
  repo: {
    id: string;
    title: string;
    slug: string;
    description: string;
    courseCode: string;
    university: string;
    department: string;
    owner: { name: string; username: string };
    contributors?: Array<{ name: string }>;
    tags: string[];
    stars: number;
    forks: number;
    discussions: number;
    views: number;
    lastUpdated: string;
    isVerified?: boolean;
    updatedDaysAgo: number;
    language: string;
  };
  className?: string;
  compact?: boolean;
}

const LANG_COLORS: Record<string, string> = {
  Python: "bg-blue-400",
  PDF: "bg-red-400",
  Markdown: "bg-purple-400",
  Jupyter: "bg-orange-400",
  default: "bg-secondary",
};

export default function RepositoryCard({ repo, className, compact }: RepositoryCardProps) {
  const timeStr = repo.updatedDaysAgo === 0
    ? "Updated today"
    : repo.updatedDaysAgo === 1
    ? "Updated yesterday"
    : `Updated ${repo.updatedDaysAgo} days ago`;

  return (
    <Link href={`/repository/${repo.slug}`}>
      <article
        className={cn(
          "card p-6 cursor-pointer group flex flex-col gap-4 h-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {repo.courseCode}
              </span>
              {repo.isVerified && (
                <span className="flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-container px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <h3 className="font-manrope font-semibold text-base text-primary group-hover:text-secondary transition-colors leading-snug">
              {repo.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        {!compact && (
          <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
            {truncate(repo.description, 120)}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {repo.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag text-xs">{tag}</span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full", LANG_COLORS[repo.language] || LANG_COLORS.default)} />
              {repo.language}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {formatNumber(repo.stars)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {formatNumber(repo.forks)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-on-surface-variant/60">
            <Clock className="w-3 h-3" />
            {timeStr}
          </span>
        </div>
      </article>
    </Link>
  );
}
