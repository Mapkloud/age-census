import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./safe-callback-url";

describe("safeCallbackUrl", () => {
  it("allows relative app paths", () => {
    expect(safeCallbackUrl("/open/abc")).toBe("/open/abc");
    expect(safeCallbackUrl("/map")).toBe("/map");
  });

  it("rejects open redirects", () => {
    expect(safeCallbackUrl("https://evil.example")).toBe("/map");
    expect(safeCallbackUrl("//evil.example")).toBe("/map");
    expect(safeCallbackUrl("")).toBe("/map");
    expect(safeCallbackUrl(null)).toBe("/map");
  });
});
