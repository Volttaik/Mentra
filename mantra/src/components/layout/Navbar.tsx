"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, Bell, Search, Menu, X, ChevronDown,
  Star, Upload, Settings, LogOut, User, LayoutDashboard, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/search", label: "Search" },
];

const USER_MENU = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile/amara.osei", label: "Profile", icon: User },
  { href: "/upload", label: "New Stack", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggedIn] = useState(true);

  return (
    <header className="sticky top-0 z-50 parchment-blur border-b border-outline-variant/20">
      <nav className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-on-primary" />
          </div>
          <span className="font-manrope font-bold text-lg text-primary tracking-tight">Mentra</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 flex-1 ml-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
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

          {isLoggedIn ? (
            <>
              <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border-2 border-outline-variant/30">
                    <span className="text-xs font-bold text-on-secondary-container font-manrope">AO</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-surface-container-lowest rounded-2xl shadow-modal border border-outline-variant/20 py-2 z-50">
                    <div className="px-4 py-3 border-b border-outline-variant/10">
                      <p className="font-semibold text-sm text-primary font-manrope">Dr. Amara Osei</p>
                      <p className="text-xs text-on-surface-variant">amara.osei</p>
                    </div>
                    {USER_MENU.map((item) => (
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
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </Link>
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

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-on-surface-variant"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface py-4 px-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-outline-variant/10 mt-2 pt-2 space-y-1">
            {isLoggedIn ? (
              USER_MENU.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))
            ) : (
              <>
                <Link href="/login" className="flex px-4 py-3 text-sm font-medium text-on-surface-variant">Sign in</Link>
                <Link href="/register" className="flex px-4 py-3 text-sm font-semibold text-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
