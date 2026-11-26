"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Tabs.module.css";

export type Tab = { href: string; label: string };

/** Left-aligned tab bar for section pages (Learn, Practice). Each tab is its own URL. */
export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const pathname = usePathname() ?? "";
  return (
    <div className={styles.bar}>
      <nav aria-label={label} className={styles.tabs}>
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={active ? `${styles.tab} ${styles.on}` : styles.tab}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
