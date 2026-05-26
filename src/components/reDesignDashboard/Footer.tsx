import React from "react";
import { Instagram, Linkedin, Mail, ArrowUpRight } from "lucide-react";

// ── Social links ──────────────────────────────────────────────────────────────
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/trevoros.hq?igsh=MWZsMWZsdzRlazB6Mw==",
  x:         "https://x.com/TrevorosHQ",
  linkedin:  "https://www.linkedin.com/company/trevoros/",
};

// X (Twitter) SVG icon
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.262 5.636 5.902-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface NavLink {
  label: string;
  href: string;
}

const PLATFORM_LINKS: NavLink[] = [
  { label: "How It Works",  href: "#how-it-works"  },
  { label: "Platform",      href: "#platform"      },
  { label: "Who It's For",  href: "#who-this-is-for"},
  { label: "Education",     href: "#education"     },
  { label: "Early Access",  href: "#early-access"  },
  { label: "FAQ",           href: "#faq"           },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400">
      {/* ── Top accent line ──────────────────────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-16 pb-10">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">

          {/* ── Col 1 — Brand ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6 sm:col-span-2 lg:col-span-1">
            {/* Brand identity */}
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">
                TREVOROS
              </p>
              <p className="mt-0.5 text-xs tracking-[0.3em] uppercase text-brand-400 font-medium">
                Fintech
              </p>
            </div>

            {/* Short description */}
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              Evaluating traders through data, behaviour, and performance.
              Discipline is the edge.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-brand-600 hover:border-brand-500 transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on X"
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 hover:border-slate-500 transition-all duration-300"
              >
                <XIcon className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on LinkedIn"
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-brand-700 hover:border-brand-500 transition-all duration-300"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* ── Col 2 — Platform links ──────────────────────────────────────── */}
          <div>
            <p className="mb-6 text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
              Platform
            </p>
            <ul className="space-y-3.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Col 3 — Contact ─────────────────────────────────────────────── */}
          <div>
            <p className="mb-6 text-xs font-semibold tracking-[0.2em] uppercase text-slate-500">
              Connect
            </p>

            <a
              href="mailto:hello@trevoros.com"
              className="group inline-flex items-center gap-2.5 mb-8 text-sm text-slate-400 hover:text-white transition-colors duration-200"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-brand-500 transition-colors duration-200">
                <Mail className="w-4 h-4" />
              </span>
              <span>hello@trevoros.com</span>
            </a>

            {/* ── Live badge ──────────────────────────────────────────────── */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">
                MVP Live Now
              </span>
            </div>
          </div>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-slate-800">
          <div className="max-w-4xl space-y-2 text-xs leading-relaxed text-slate-500">
            <p>
              TREVOROS does not provide investment advice, trading signals, or
              guaranteed returns. All funded accounts are subject to evaluation,
              rules, and performance-based agreements.
            </p>
            <p className="font-medium text-slate-400">
              Trading involves risk. Discipline is mandatory.
            </p>
          </div>
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            &copy; {currentYear} TREVOROS. All rights reserved.
          </p>
          <p className="text-xs text-slate-700">
            Built for disciplined traders.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;