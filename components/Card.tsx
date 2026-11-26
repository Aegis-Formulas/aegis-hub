import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Card.module.css";

type CardProps = {
  label?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Bottom row: metadata, status, a small button. */
  footer?: ReactNode;
  href?: string;
};

function Inner({ label, title, children, footer }: Omit<CardProps, "href">) {
  return (
    <>
      {label ? <div className={styles.label}>{label}</div> : null}
      <h3 className={styles.title}>{title}</h3>
      {children ? <div className={styles.body}>{children}</div> : null}
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </>
  );
}

/** Feature and bento card. Mist surface, 24px radius, no border, no shadow. */
export function FeatureCard({ href, className, ...rest }: CardProps & { className?: string }) {
  const cls = [styles.card, styles.feature, className].filter(Boolean).join(" ");
  return href ? (
    <Link href={href} className={`${cls} ${styles.link}`}>
      <Inner {...rest} />
    </Link>
  ) : (
    <div className={cls}>
      <Inner {...rest} />
    </div>
  );
}

/** Resource card on Paper. 20px radius, hairline border, no shadow. */
export function ResourceCard({ href, ...rest }: CardProps) {
  const cls = `${styles.card} ${styles.resource}`;
  return href ? (
    <Link href={href} className={`${cls} ${styles.link}`}>
      <Inner {...rest} />
    </Link>
  ) : (
    <div className={cls}>
      <Inner {...rest} />
    </div>
  );
}

/** Responsive grid: 3 columns, 2 on tablet, 1 on phone. */
export function CardGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
