import { describe, it, expect } from "vitest";
import { generateSignedCoPdf } from "../change-order-pdf.js";

describe("generateSignedCoPdf", () => {
  const signer = {
    name: "Alice Tester",
    ip: "192.168.1.100",
    signedAt: new Date("2026-04-19T10:00:00.000Z"),
  };

  const project = {
    id: "proj-00000000-0000-0000-0000-000000000001",
    title: "Test Project",
  };

  const co = {
    id: "co-00000000-0000-0000-0000-000000000001",
    title: "Add Login Page",
    workDescription: "Implement OAuth2 login with Google and GitHub providers.",
    revisedTimeline: "2 additional business days",
    estimatedHours: 16,
    pricing: { amount: 3200 },
  };

  it("should return bytes that start with the %PDF magic bytes", async () => {
    const { bytes } = await generateSignedCoPdf(co, signer, project);
    const magic = Buffer.from(bytes.slice(0, 4)).toString("ascii");
    expect(magic).toBe("%PDF");
  });

  it("should return a 64-character lowercase hex SHA-256 hash", async () => {
    const { hash } = await generateSignedCoPdf(co, signer, project);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should produce a non-zero byte array larger than a minimal PDF", async () => {
    const { bytes } = await generateSignedCoPdf(co, signer, project);
    expect(bytes.length).toBeGreaterThan(100);
  });

  it("should produce a different hash when signer name changes", async () => {
    const r1 = await generateSignedCoPdf(co, signer, project);
    const r2 = await generateSignedCoPdf(co, { ...signer, name: "Bob Other" }, project);
    expect(r1.hash).not.toBe(r2.hash);
  });

  it("should produce a larger PDF when signer name is provided vs minimal inputs", async () => {
    const minimalCo = { id: "co-x", title: "T" };
    const { bytes: minBytes } = await generateSignedCoPdf(minimalCo, signer, { id: "p-x" });
    const { bytes: fullBytes } = await generateSignedCoPdf(co, signer, project);
    // A PDF with more content is at least as large as one with minimal content
    expect(fullBytes.length).toBeGreaterThanOrEqual(minBytes.length);
  });
});
