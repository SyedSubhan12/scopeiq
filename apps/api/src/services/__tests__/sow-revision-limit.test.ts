import { describe, it, expect } from "vitest";
import { parseRevisionLimitFromText } from "../sow.service.js";

describe("parseRevisionLimitFromText - happy path", () => {
  it("parses '2 rounds of revisions'", () => {
    expect(parseRevisionLimitFromText("Client is entitled to 2 rounds of revisions.")).toBe(2);
  });

  it("parses '5 revisions'", () => {
    expect(parseRevisionLimitFromText("Up to 5 revisions included.")).toBe(5);
  });

  it("parses singular '1 round'", () => {
    expect(parseRevisionLimitFromText("1 round of revision permitted.")).toBe(1);
  });
});

describe("parseRevisionLimitFromText - validation", () => {
  it("returns null for no match", () => {
    expect(parseRevisionLimitFromText("No revision clause here.")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseRevisionLimitFromText("")).toBeNull();
  });

  it("returns null for zero rounds", () => {
    expect(parseRevisionLimitFromText("0 rounds of revisions")).toBeNull();
  });

  it("returns null for absurdly large values", () => {
    expect(parseRevisionLimitFromText("1000 rounds")).toBeNull();
  });
});

describe("parseRevisionLimitFromText - case insensitivity", () => {
  it("matches uppercase ROUNDS", () => {
    expect(parseRevisionLimitFromText("3 ROUNDS of REVISIONS")).toBe(3);
  });

  it("picks first match when multiple", () => {
    expect(parseRevisionLimitFromText("2 rounds, optionally 4 revisions")).toBe(2);
  });
});
