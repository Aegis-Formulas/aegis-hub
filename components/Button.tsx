import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./Button.module.css";

/**
 * Full capsule button.
 * - primary: Yankees Blue. One per screen.
 * - accent: Deep Bronze. Only the single most important action on a screen.
 * - ghost: outline, for everything else.
 */
export type ButtonVariant = "primary" | "accent" | "ghost";

type Common = {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  children: ReactNode;
  className?: string;
};

type AsButton = Common & Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, "className" | "children"> & { href: string };

export function Button(props: AsButton | AsLink) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const cls = [styles.btn, styles[variant], size === "sm" && styles.sm, className].filter(Boolean).join(" ");

  if (rest.href !== undefined) {
    return (
      <Link className={cls} {...(rest as Omit<AsLink, keyof Common>)}>
        {children}
      </Link>
    );
  }
  const buttonProps = rest as Omit<AsButton, keyof Common>;
  return (
    <button type="button" className={cls} {...buttonProps}>
      {children}
    </button>
  );
}
