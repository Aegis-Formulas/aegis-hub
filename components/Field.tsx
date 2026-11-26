import { useId, type ComponentProps, type ReactNode } from "react";
import styles from "./Field.module.css";

type FieldShell = { label: string; hint?: ReactNode };

function Shell({ id, label, hint, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ label, hint, id, className, ...rest }: FieldShell & ComponentProps<"input">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Shell id={fid} label={label} hint={hint}>
      <input
        id={fid}
        type="text"
        aria-describedby={hint ? `${fid}-hint` : undefined}
        className={[styles.control, className].filter(Boolean).join(" ")}
        {...rest}
      />
    </Shell>
  );
}

export function TextArea({ label, hint, id, className, ...rest }: FieldShell & ComponentProps<"textarea">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Shell id={fid} label={label} hint={hint}>
      <textarea
        id={fid}
        aria-describedby={hint ? `${fid}-hint` : undefined}
        className={[styles.control, styles.area, className].filter(Boolean).join(" ")}
        {...rest}
      />
    </Shell>
  );
}

export function SelectField({ label, hint, id, className, children, ...rest }: FieldShell & ComponentProps<"select">) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Shell id={fid} label={label} hint={hint}>
      <select
        id={fid}
        aria-describedby={hint ? `${fid}-hint` : undefined}
        className={[styles.control, className].filter(Boolean).join(" ")}
        {...rest}
      >
        {children}
      </select>
    </Shell>
  );
}
