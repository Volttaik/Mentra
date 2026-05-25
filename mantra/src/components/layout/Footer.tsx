import Link from "next/link";
import { BookOpen, Twitter, Mail } from "lucide-react";

const LINKS = {
  Platform: [
    { label: "Explore Stacks", href: "/explore" },
    { label: "Search", href: "/search" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "New Stack", href: "/upload" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Status", href: "#" },
  ],
  Community: [
    { label: "Contributors", href: "#" },
    { label: "Universities", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Licenses", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary text-on-primary mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-on-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-on-primary" />
              </div>
              <span className="font-manrope font-bold text-lg text-on-primary">Mentra</span>
            </div>
            <p className="text-sm text-on-primary/60 leading-relaxed">
              The collaborative academic OS. Knowledge compounds when it&apos;s shared.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 bg-on-primary/10 rounded-lg flex items-center justify-center hover:bg-on-primary/20 transition-colors">
                <Twitter className="w-4 h-4 text-on-primary" />
              </a>
              <a href="mailto:hello@mentra.app" className="w-8 h-8 bg-on-primary/10 rounded-lg flex items-center justify-center hover:bg-on-primary/20 transition-colors">
                <Mail className="w-4 h-4 text-on-primary" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="font-manrope font-semibold text-sm text-on-primary">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-on-primary/50 hover:text-on-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-on-primary/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-on-primary/40">
            © 2025 Mentra. Built for the global academic community.
          </p>
          <p className="text-sm text-on-primary/40">
            Open source · Knowledge for everyone
          </p>
        </div>
      </div>
    </footer>
  );
}
