import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { describe, expect, it } from "vitest";

// DESIGN.md color table. Add a value here only when DESIGN.md adds it.
const ALLOWED = new Set([
  "#1c3140", // Yankees Blue
  "#7a6243", // Deep Bronze
  "#a7895f", // Bronze
  "#ffffff", // Paper
  "#fff",
  "#eef1f4", // Mist
  "#5b6872", // Slate
  "#e4e8ec", // hairline border
]);

const ROOTS = ["app", "components", "lib"];
const EXTENSIONS = new Set([".css", ".ts", ".tsx"]);

function files(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out = out.concat(files(path));
    else if (EXTENSIONS.has(extname(name))) out.push(path);
  }
  return out;
}

describe("brand colors", () => {
  it("uses only DESIGN.md colors in app code", () => {
    const offenders: string[] = [];
    for (const file of ROOTS.flatMap(files)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
        if (!ALLOWED.has(match[0].toLowerCase())) offenders.push(`${file}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
