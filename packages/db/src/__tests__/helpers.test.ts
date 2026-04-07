import { describe, it, expect } from "vitest";
import {
    generatePortalToken,
    hashPortalToken,
    constantTimeCompare,
    generateUlid,
} from "../helpers.js";
import { createHash } from "node:crypto";

describe("generatePortalToken", () => {
    it("should return an object with raw and hash properties", () => {
        const result = generatePortalToken();

        expect(result).toHaveProperty("raw");
        expect(result).toHaveProperty("hash");
    });

    it("should return a 64-character hex raw token (32 bytes)", () => {
        const result = generatePortalToken();

        expect(result.raw).toHaveLength(64);
        expect(/^[0-9a-f]{64}$/.test(result.raw)).toBe(true);
    });

    it("should return a SHA-256 hash of the raw token", () => {
        const result = generatePortalToken();
        const expectedHash = createHash("sha256").update(result.raw).digest("hex");

        expect(result.hash).toBe(expectedHash);
        expect(result.hash).toHaveLength(64);
    });

    it("should produce different raw tokens on each call", () => {
        const result1 = generatePortalToken();
        const result2 = generatePortalToken();

        expect(result1.raw).not.toBe(result2.raw);
        expect(result1.hash).not.toBe(result2.hash);
    });
});

describe("hashPortalToken", () => {
    it("should produce a deterministic SHA-256 hash", () => {
        const token = "test-token-value";
        const expected = createHash("sha256").update(token).digest("hex");
        const result = hashPortalToken(token);

        expect(result).toBe(expected);
    });

    it("should produce the same hash for the same input across multiple calls", () => {
        const token = "consistent-token";
        const hash1 = hashPortalToken(token);
        const hash2 = hashPortalToken(token);

        expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
        const hash1 = hashPortalToken("token-a");
        const hash2 = hashPortalToken("token-b");

        expect(hash1).not.toBe(hash2);
    });

    it("should return a 64-character hex string", () => {
        const result = hashPortalToken("any-token-value");

        expect(result).toHaveLength(64);
        expect(/^[0-9a-f]{64}$/.test(result)).toBe(true);
    });

    it("should be case-sensitive", () => {
        const hashUpper = hashPortalToken("TOKEN");
        const hashLower = hashPortalToken("token");

        expect(hashUpper).not.toBe(hashLower);
    });
});

describe("constantTimeCompare", () => {
    it("should return true when strings are equal", () => {
        expect(constantTimeCompare("abc", "abc")).toBe(true);
    });

    it("should return false when strings are different", () => {
        expect(constantTimeCompare("abc", "def")).toBe(false);
    });

    it("should return false when strings have different lengths", () => {
        expect(constantTimeCompare("short", "much-longer-string")).toBe(false);
    });

    it("should return true for empty strings", () => {
        expect(constantTimeCompare("", "")).toBe(true);
    });

    it("should return false for one empty and one non-empty string", () => {
        expect(constantTimeCompare("", "non-empty")).toBe(false);
    });

    it("should handle long strings correctly", () => {
        const longA = "a".repeat(1000);
        const longB = "a".repeat(1000);
        const longC = "a".repeat(999) + "b";

        expect(constantTimeCompare(longA, longB)).toBe(true);
        expect(constantTimeCompare(longA, longC)).toBe(false);
    });

    it("should handle special characters", () => {
        expect(constantTimeCompare("hello!@#$%", "hello!@#$%")).toBe(true);
        expect(constantTimeCompare("hello!@#$%", "hello!@#$^")).toBe(false);
    });

    it("should handle unicode characters", () => {
        expect(constantTimeCompare("caf\u00e9", "caf\u00e9")).toBe(true);
        expect(constantTimeCompare("caf\u00e9", "cafe")).toBe(false);
    });

    it("should work with hex strings (common token comparison scenario)", () => {
        const hexA = "a1b2c3d4e5f6";
        const hexB = "a1b2c3d4e5f6";
        const hexC = "a1b2c3d4e5f7";

        expect(constantTimeCompare(hexA, hexB)).toBe(true);
        expect(constantTimeCompare(hexA, hexC)).toBe(false);
    });
});

describe("generateUlid", () => {
    it("should return a non-empty string", () => {
        const result = generateUlid();

        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
    });

    it("should return unique values on each call", () => {
        const ulids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ulids.add(generateUlid());
        }

        expect(ulids.size).toBe(100);
    });

    it("should produce values with consistent length", () => {
        const results = Array.from({ length: 10 }, () => generateUlid());
        const lengths = new Set(results.map((r) => r.length));

        expect(lengths.size).toBe(1);
    });

    it("should contain a base-36 timestamp prefix", () => {
        const result = generateUlid();
        const timestampPart = result.slice(0, 10);

        // Should be valid base-36 (0-9, a-z)
        expect(/^[0-9a-z]{10}$/.test(timestampPart)).toBe(true);
    });

    it("should produce values that increase over time", async () => {
        const first = generateUlid();
        await new Promise((resolve) => setTimeout(resolve, 10));
        const second = generateUlid();

        // Timestamp portion should be non-decreasing
        expect(second.slice(0, 10) >= first.slice(0, 10)).toBe(true);
    });
});
