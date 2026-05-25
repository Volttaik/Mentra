import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    university: string;
    department: string;
    bio?: string;
    followers: number;
    repositories: number;
    contributions: number;
    achievements?: string[];
  };
  className?: string;
}

const ACHIEVEMENT_LABELS: Record<string, string> = {
  "top-contributor": "🏆 Top Contributor",
  "verified-educator": "✅ Educator",
  "hall-of-fame": "⭐ Hall of Fame",
  "rising-star": "🌟 Rising Star",
  "100-commits": "💫 100 Commits",
  "top-professor": "🎓 Professor",
};

export default function UserCard({ user, className }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const bgColors = ["bg-secondary-container", "bg-primary-fixed", "bg-tertiary-fixed", "bg-surface-container-high"];
  const bgColor = bgColors[user.id.charCodeAt(1) % bgColors.length];

  return (
    <Link href={`/profile/${user.username}`}>
      <article className={cn("card p-5 cursor-pointer group flex flex-col gap-3", className)}>
        <div className="flex items-start gap-3">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold font-manrope text-sm text-primary shrink-0", bgColor)}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-manrope font-semibold text-sm text-primary group-hover:text-secondary transition-colors truncate">
              {user.name}
            </p>
            <p className="text-xs text-on-surface-variant truncate">{user.department}</p>
            <p className="text-xs text-on-surface-variant/60 truncate">{user.university}</p>
          </div>
        </div>

        {user.bio && (
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{user.bio}</p>
        )}

        {user.achievements && user.achievements.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.achievements.slice(0, 2).map((a) => (
              <span key={a} className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-medium">
                {ACHIEVEMENT_LABELS[a] || a}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-on-surface-variant pt-1 border-t border-outline-variant/10">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {formatNumber(user.followers)} followers
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {user.repositories} repos
          </span>
        </div>
      </article>
    </Link>
  );
}
