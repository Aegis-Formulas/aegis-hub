import { describe, expect, it } from "vitest";
import { isPublicPath, safeNextPath } from "../lib/auth/paths";

describe("safeNextPath", () => {
  it("keeps paths inside the app", () => {
    expect(safeNextPath("/home")).toBe("/home");
    expect(safeNextPath("/account?tab=password")).toBe("/account?tab=password");
  });

  it("refuses redirects to other sites", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "evil", "", null, undefined]) {
      expect(safeNextPath(bad)).toBe("/home");
    }
  });
});

describe("isPublicPath", () => {
  it("lets sign-in and auth callbacks through", () => {
    for (const p of ["/sign-in", "/auth/confirm", "/auth/sign-out", "/styleguide"]) expect(isPublicPath(p)).toBe(true);
  });

  it("protects everything else", () => {
    for (const p of ["/", "/home", "/account", "/sign-inx", "/authx", "/styleguides"]) expect(isPublicPath(p)).toBe(false);
  });
});
