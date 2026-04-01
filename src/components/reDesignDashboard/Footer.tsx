import React from "react";
import { Instagram, Linkedin, Mail } from "lucide-react";

// ── Social links — update these URLs when ready ──────────────────────────────
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/trevoros.hq?igsh=MWZsMWZsdzRlazB6Mw==",
  x:         "https://x.com/TrevorosHQ",
  linkedin:  "https://www.linkedin.com/company/trevoros/",
};

// X (Twitter) SVG icon — lucide-react does not include the new X logo
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

const Footer: React.FC = () => {
  return (
    <footer className="pt-12 pb-8 border-t bg-brand-50 border-brand-100">
        <div className="px-4 mx-auto text-center max-w-6xl sm:px-6 lg:px-8">

        {/* Brand Name */}
        <div className="mb-8">
          <span className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            TREVOROS
          </span>
        </div>

        {/* Social Icons */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Instagram */}
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-400 hover:bg-brand-50 transition-all duration-300 hover:scale-105 shadow-sm"
          >
            <Instagram className="w-5 h-5" />
          </a>

          {/* X (Twitter) */}
          <a
            href={SOCIAL_LINKS.x}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on X"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 hover:scale-110 shadow-sm"
          >
            <XIcon className="w-5 h-5" />
          </a>

          {/* LinkedIn */}
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on LinkedIn"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-brand-700 hover:border-brand-400 hover:bg-brand-50 transition-all duration-300 hover:scale-110 shadow-sm"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        </div>

        {/* Email */}
        <div className="mb-10">
          <a
            href="mailto:hello@trevoros.com"
            className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-brand-600 transition-colors duration-200 lg:text-lg"
          >
            <Mail className="w-5 h-5" />
            hello@trevoros.com
          </a>
        </div>

        {/* Disclaimer */}
        <div className="max-w-4xl mx-auto space-y-4 text-base leading-relaxed text-slate-500 lg:text-lg">
          <p>
            TREVOROS does not provide investment advice, trading signals, or
            guaranteed returns. All funded accounts are subject to evaluation,
            rules, and performance-based agreements.
          </p>
          <p className="text-base lg:text-lg font-medium text-slate-600">
            Trading involves risk. Discipline is mandatory.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-12 text-sm border-t border-brand-200/50 text-slate-400 lg:text-base">
          &copy; {new Date().getFullYear()} TREVOROS. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
