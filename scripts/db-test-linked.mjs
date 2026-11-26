// Runs the pgTAP files in supabase/tests/database against the LINKED project (staging),
// without Docker. Usage: pnpm db:test:staging
//
// `supabase db query --linked` returns only the last result of a script, so each test
// file is rewritten to collect results in a temp table and finish by raising an error
// that carries the summary. The error also rolls everything back: no test data is kept.
// Never link this folder to production.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TEST_DIR = "supabase/tests/database";
const TAP_CALL = /^select (plan|is|isnt|ok|throws_ok|lives_ok|results_eq|is_empty|isnt_empty|table_privs_are)\(|^select \* from finish\(\);/;

function wrap(sql) {
  return sql
    .split(/\r?\n/)
    .map((line) => {
      if (/^select plan\(/.test(line)) {
        return [
          "create temp table tap (id serial primary key, line text);",
          "grant all on tap to authenticated; grant usage on sequence tap_id_seq to authenticated;",
          `insert into tap(line) ${line}`,
        ].join("\n");
      }
      if (/^rollback;/.test(line)) {
        return (
          "do $x$ begin raise exception E'TAP OUTPUT\\n%', (select 'passed: ' || count(*) filter (where line like 'ok %') || " +
          "E'\\n' || coalesce(string_agg(line, E'\\n' order by id) filter (where line not like 'ok %'), '') from tap); end $x$;"
        );
      }
      return TAP_CALL.test(line) ? `insert into tap(line) ${line}` : line;
    })
    .join("\n");
}

const bin = process.platform === "win32" ? "node_modules\\.bin\\supabase.cmd" : "node_modules/.bin/supabase";
const work = mkdtempSync(join(tmpdir(), "aegis-dbtest-"));
let failed = false;

for (const file of readdirSync(TEST_DIR).filter((f) => f.endsWith(".test.sql"))) {
  const wrapped = join(work, file);
  writeFileSync(wrapped, wrap(readFileSync(join(TEST_DIR, file), "utf8")));
  let output = "";
  try {
    output = execFileSync(bin, ["db", "query", "--linked", "-f", wrapped], {
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  }
  // CLI prints {"error":{"message":"unexpected status 400: {\"message\":\"... TAP OUTPUT\n...\"}"}}
  let report = "";
  try {
    const outer = JSON.parse(output.split(/\r?\n/).find((l) => l.startsWith("{")) ?? "");
    const msg = String(outer.error?.message ?? "");
    const inner = JSON.parse(msg.slice(msg.indexOf("{")));
    report = String(inner.message).split("TAP OUTPUT\n")[1]?.split("\nCONTEXT")[0] ?? "";
  } catch {
    report = "";
  }
  if (!report) {
    failed = true;
    console.error(`${file}: could not read test output\n${output}`);
    continue;
  }
  const planned = Number(report.match(/1\.\.(\d+)/)?.[1] ?? NaN);
  const passed = Number(report.match(/passed: (\d+)/)?.[1] ?? 0);
  const ok = planned === passed;
  failed ||= !ok;
  console.log(`${ok ? "PASS" : "FAIL"} ${file}: ${passed}/${planned}`);
  if (!ok) console.log(report);
}

process.exit(failed ? 1 : 0);
