"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PwaRuntime } from "@/components/pwa-runtime";

const navigation = [
  { href: "/", label: "Feed" },
  { href: "/deck", label: "Jam" },
  { href: "/compose", label: "Write" },
  { href: "/profile", label: "Profile" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNavigation = pathname === "/welcome";

  return (
    <div className="app-shell">
      <nav className="skip-nav" aria-label="Skip links">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
      </nav>
      <PwaRuntime />
      <main id="main-content" className="main-content">
        {children}
      </main>
      {!hideNavigation && (
        <nav className="bottom-nav" aria-label="Primary navigation">
          {navigation.map(({ href, label }) => {
            const current =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                className="bottom-nav__item"
                data-current={current || undefined}
                href={href}
                key={href}
                aria-current={current ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
