"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import styles from "./CapsuleNav.module.css";

export type NavItem = { href: string; label: string };

type Props = {
  /** Logo or wordmark. Use the approved brand-kit logo file, never a re-typed version. */
  brand: ReactNode;
  items: NavItem[];
  /** Right side: avatar, account menu, cart. */
  end?: ReactNode;
  /** Usually <SequenceRail />. Sits under the capsule and stays put with it. */
  rail?: ReactNode;
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Floating capsule nav. Paper, 32px radius, light blur, sticky over the hero. */
export function CapsuleNav({ brand, items, end, rail }: Props) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  const links = items.map((item) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={active ? `${styles.link} ${styles.on}` : styles.link}
        onClick={() => setOpen(false)}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <div className={styles.shell}>
      <header className={styles.capsule}>
        <div className={styles.brand}>{brand}</div>
        <nav aria-label="Main" className={styles.links}>
          {links}
        </nav>
        {end ? <div className={styles.end}>{end}</div> : null}
        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="capsule-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          <span className={styles.srOnly}>Menu</span>
        </button>
      </header>
      {open ? (
        <nav id="capsule-menu" aria-label="Main" className={styles.sheet}>
          {links}
        </nav>
      ) : null}
      {rail}
    </div>
  );
}
