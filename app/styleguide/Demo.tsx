"use client";

// Sample text on this page is placeholder only. It is never shown to members.
import { useState } from "react";
import { Button } from "@/components/Button";
import { CapsuleNav } from "@/components/CapsuleNav";
import { CardGrid, FeatureCard, ResourceCard } from "@/components/Card";
import { Chip, ChipGroup } from "@/components/Chip";
import { Drawer } from "@/components/Drawer";
import { SelectField, TextArea, TextField } from "@/components/Field";
import { Label, Status } from "@/components/Label";
import { SequenceRail } from "@/components/SequenceRail";
import { Table, type Column } from "@/components/Table";
import { Tabs } from "@/components/Tabs";
import { ToastProvider, useToast } from "@/components/Toast";
import styles from "./styleguide.module.css";

type SampleRow = { id: string; name: string; status: "Draft" | "Sent" | "Paid"; total: string };

const ROWS: SampleRow[] = [
  { id: "1", name: "Sample patient A", status: "Draft", total: "$0.00" },
  { id: "2", name: "Sample patient B", status: "Sent", total: "$148.00" },
  { id: "3", name: "Sample patient C", status: "Paid", total: "$212.00" },
];

const COLUMNS: Column<SampleRow>[] = [
  { key: "name", header: "Patient", cell: (r) => r.name },
  {
    key: "status",
    header: "Status",
    cell: (r) => <Status tone={r.status === "Draft" ? "bronze" : "navy"}>{r.status}</Status>,
  },
  { key: "total", header: "Total", cell: (r) => r.total, align: "right" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <Label as="p">{title}</Label>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Body() {
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);
  const [chips, setChips] = useState<string[]>(["All"]);
  const toggle = (c: string) => setChips((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <>
      <CapsuleNav
        brand={<span className={styles.wordmark}>Aegis</span>}
        items={[
          { href: "/", label: "Home" },
          { href: "/styleguide", label: "Styleguide" },
        ]}
        end={<span className={styles.avatar} aria-label="Signed in as sample user">SU</span>}
        rail={<SequenceRail progress={0.42} lit="P2" />}
      />

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1>
            Design <em>system</em>
          </h1>
          <p className={styles.lead}>Components built from DESIGN.md tokens. Placeholder text only.</p>
        </div>

        <Section title="Buttons">
          <div className={styles.row}>
            <Button>Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button variant="ghost" size="sm">
              Small ghost
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Labels and status">
          <div className={styles.row}>
            <Label>Bronze label</Label>
            <Status>Sent</Status>
            <Status tone="bronze">Draft</Status>
            <Status tone="quiet">Archived</Status>
          </div>
        </Section>

        <Section title="Chips">
          <ChipGroup label="Sample filters">
            {["All", "Phase one", "Phase two", "Phase three"].map((c) => (
              <Chip key={c} pressed={chips.includes(c)} onClick={() => toggle(c)}>
                {c}
              </Chip>
            ))}
          </ChipGroup>
        </Section>

        <Section title="Fields">
          <div className={styles.fields}>
            <TextField label="Text field" placeholder="Placeholder" hint="Hint text sits under the field." />
            <SelectField label="Select" defaultValue="b">
              <option value="a">Option A</option>
              <option value="b">Option B</option>
            </SelectField>
            <TextArea label="Text area" placeholder="Placeholder" />
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs
            label="Sample tabs"
            tabs={[
              { href: "/styleguide", label: "Current tab" },
              { href: "/", label: "Other tab" },
            ]}
          />
        </Section>

        <Section title="Cards">
          <CardGrid>
            <FeatureCard label="Feature card" title="Mist surface, no border" footer={<Status>Sample</Status>}>
              Large feature and bento surfaces.
            </FeatureCard>
            <ResourceCard
              href="/styleguide"
              label="Resource card"
              title="Paper with a hairline"
              footer={<span>12 min</span>}
            >
              Linked cards underline the title on hover.
            </ResourceCard>
            <ResourceCard label="Resource card" title="Without a link">
              Body copy in Slate.
            </ResourceCard>
          </CardGrid>
        </Section>

        <Section title="Table">
          <Table caption="Sample plans" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />
        </Section>

        <Section title="Drawer and toast">
          <div className={styles.row}>
            <Button variant="ghost" onClick={() => setDrawer(true)}>
              Open drawer
            </Button>
            <Button variant="ghost" onClick={() => toast("Saved")}>
              Show toast
            </Button>
          </div>
        </Section>

        <div className={styles.spacer} aria-hidden="true" />
      </main>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Drawer title"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDrawer(false);
                toast("Saved");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className={styles.fields}>
          <TextField label="Field inside a drawer" />
          <p>Escape or the backdrop closes it.</p>
        </div>
      </Drawer>
    </>
  );
}

export function Demo() {
  return (
    <ToastProvider>
      <Body />
    </ToastProvider>
  );
}
