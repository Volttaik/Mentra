"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BookOpen, Bell, Search, Menu, X, ChevronDown,
  Upload, Settings, LogOut, User, LayoutDashboard, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, toggle } = useTheme();
  const isAuth = status === "authenticated";
  const isLoading = status === "loading";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuth) return;
    fetch("/api/notifications?unreadOnly=true")
      .then(r => r.json())
      .then(d => setNotifCount(d.count ?? 0))
      .catch(() => {});
  }, [isAuth]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 parchment-blur border-b border-outline-variant/20">
      <nav className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/icons/icon-192.png" alt="Mentra" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-manrope font-bold text-lg text-primary tracking-tight">Mentra</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 flex-1 ml-8">
          <Link href="/explore" className={cn("text-sm font-medium transition-colors", pathname === "/explore" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary")}>
            Explore
          </Link>
          {!isAuth && !isLoading && (
            <>
              <Link href="/#about" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">About</Link>
              <Link href="/privacy" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Privacy</Link>
            </>
          )}
          {isAuth && (
            <Link href="/dashboard" className={cn("text-sm font-medium transition-colors", pathname === "/dashboard" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary")}>
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/search"
            className="flex items-center gap-2 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-on-surface-variant hover:border-outline/50 transition-all w-52"
          >
            <Search className="w-4 h-4" />
            <span>Search stacks...</span>
            <span className="ml-auto text-xs bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant/60">⌘K</span>
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isLoading ? (
            <div className="w-8 h-8 bg-surface-container rounded-full animate-pulse" />
          ) : isAuth ? (
            <>
              <Link href="/dashboard" className="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-on-secondary text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-2 border-outline-variant/30">
                    {session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-on-secondary-container font-manrope">{initials}</span>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant/20 py-2 z-50">
                    <div className="px-4 py-3 border-b border-outline-variant/10">
                      <p className="font-semibold text-sm text-primary font-manrope truncate">{session?.user?.name}</p>
                      <p className="text-xs text-on-surface-variant">@{(session?.user as any)?.username}</p>
                    </div>
                    {[
                      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                      { href: (session?.user as any)?.username ? `/profile/${(session?.user as any).username}` : "/dashboard", label: "Profile", icon: User },
                      { href: "/upload", label: "New Stack", icon: Upload },
                      { href: "/settings", label: "Settings", icon: Settings },
                    ].map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-outline-variant/10 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-4 py-2">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-2 rounded-xl">
                Get started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right: theme toggle + menu */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={toggle}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            className="p-2 text-on-surface-variant"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface py-4 px-4 space-y-1">
          <Link href="/explore" onClick={() => setMobileOpen(false)} className={cn("flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors", pathname === "/explore" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container")}>
            Explore
          </Link>
          {isAuth && (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={cn("flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors", pathname === "/dashboard" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container")}>
              Dashboard
            </Link>
          )}
          <div className="border-t border-outline-variant/10 mt-2 pt-2 space-y-1">
            {isAuth ? (
              <>
                <div className="px-4 py-2">
                  <p className="font-semibold text-sm text-primary">{session?.user?.name}</p>
                  <p className="text-xs text-on-surface-variant">@{(session?.user as any)?.username}</p>
                </div>
                <Link href={`/profile/${(session?.user as any)?.username}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <Link href="/upload" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                  <Upload className="w-4 h-4" /> New Stack
                </Link>
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-error hover:bg-error-container/30 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Sign in</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex px-4 py-3 text-sm font-semibold text-primary hover:bg-surface-container rounded-xl transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
