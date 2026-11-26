"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { startWholesaleOrder, type OrderState } from "./actions";
import styles from "./shop.module.css";

export type ShopRow = {
  variantId: string;
  name: string;
  retail: number;
  wholesale: number | null;
};

const IDLE: OrderState = { status: "idle" };
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function OrderForm({ rows }: { rows: ShopRow[] }) {
  const [state, action, pending] = useActionState(startWholesaleOrder, IDLE);
  const [qty, setQty] = useState<Record<string, number>>({});

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (r.wholesale ?? 0) * (qty[r.variantId] ?? 0), 0),
    [rows, qty],
  );

  return (
    <form action={action}>
      <div className={styles.scroll} role="region" aria-label="Wholesale products" tabIndex={0}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className={styles.num}>Retail</th>
              <th scope="col" className={styles.num}>Your price</th>
              <th scope="col" className={styles.num}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.variantId}>
                <td>{r.name}</td>
                <td className={`${styles.num} ${styles.muted}`}>{money(r.retail)}</td>
                <td className={styles.num}>
                  <strong>{r.wholesale === null ? "Not available" : money(r.wholesale)}</strong>
                </td>
                <td className={styles.num}>
                  <input
                    type="number"
                    name={`qty:${r.variantId}`}
                    min={0}
                    max={99}
                    step={1}
                    inputMode="numeric"
                    defaultValue={0}
                    disabled={r.wholesale === null}
                    aria-label={`Quantity of ${r.name}`}
                    className={styles.qty}
                    onChange={(e) => setQty((q) => ({ ...q, [r.variantId]: Number(e.target.value) || 0 }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <p className={styles.total}>
          Estimated total <strong>{money(total)}</strong>
          <span className={styles.muted}> before shipping and tax</span>
        </p>
        <Button type="submit" variant="accent" disabled={pending || total === 0}>
          {pending ? "Opening checkout" : "Continue to checkout"}
        </Button>
      </div>
      <p role={state.status === "error" ? "alert" : "status"} className={styles.message}>
        {state.message ?? ""}
      </p>
    </form>
  );
}
