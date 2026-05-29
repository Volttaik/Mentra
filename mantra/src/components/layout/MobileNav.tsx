"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Compass, Plus, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status !== "authenticated") return null;

  const username = session?.user?.username;

  const items = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/upload", icon: Plus, label: "Create", special: true },
    { href: "/dashboard", icon: Bell, label: "Alerts" },
    { href: username ? `/profile/${username}` : "/dashboard", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ href, icon: Icon, label, special }) => {
          const isActive = pathname === href || (href !== "/dashboard#notifications" && pathname.startsWith(href) && href !== "/dashboard");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                special
                  ? "bg-primary text-on-primary shadow-card px-4 py-2 -mt-4 rounded-2xl"
                  : isActive
                  ? "text-primary"
                  : "text-on-surface-variant"
              )}
            >
              <Icon className={cn("w-5 h-5", special && "w-5 h-5")} />
              {!special && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
