"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainIcon, LayersIcon, InfoIcon, ChartIcon } from "./Icons";

const LINKS = [
  { href: "/", label: "Dashboard", icon: ChartIcon },
  { href: "/compare", label: "Compare", icon: LayersIcon },
  { href: "/about", label: "About", icon: InfoIcon },
];

/**
 * Floating glassmorphism navigation bar. Sits below the disclaimer with edge
 * spacing (not flush) per the design guidelines.
 */
export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-[42px] z-40 px-4 pt-4 sm:px-6">
      <nav className="glass mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="NeuroScan home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-cyan text-base shadow-glow-teal">
            <BrainIcon className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-[15px] font-bold tracking-tight text-ink-primary">
              NeuroScan
            </span>
            <span className="text-[11px] text-ink-tertiary">
              MRI Classification
            </span>
          </span>
        </Link>

        <ul className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-cyan/15 text-cyan"
                      : "text-ink-secondary hover:bg-surface-2/60 hover:text-ink-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
