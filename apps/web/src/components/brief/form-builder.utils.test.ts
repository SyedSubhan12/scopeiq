import { afterEach, describe, expect, it, vi } from "vitest";
import {
  insertField,
  moveField,
  normalizeFieldOrder,
  removeField,
  updateField,
} from "./form-builder.utils";
import type { BriefTemplateField } from "@/lib/briefs";

function makeField(overrides: Partial<BriefTemplateField>): BriefTemplateField {
  return {
    key: overrides.key ?? crypto.randomUUID(),
    type: overrides.type ?? "text",
    label: overrides.label ?? "Field",
    required: overrides.required ?? false,
    order: overrides.order ?? 0,
    conditions: overrides.conditions ?? [],
    options: overrides.options,
    placeholder: overrides.placeholder,
    helpText: overrides.helpText,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("form-builder ordering helpers", () => {
  it("inserts a new field at the requested position and rewrites order indexes", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    vi.spyOn(Math, "random").mockReturnValue(0.1234);

    const fields = normalizeFieldOrder([
      makeField({ key: "first", label: "First", order: 4 }),
      makeField({ key: "second", label: "Second", order: 9 }),
    ]);

    const result = insertField(fields, "textarea", 1);

    expect(result.map((field) => field.order)).toEqual([0, 1, 2]);
    expect(result[1]).toMatchObject({
      type: "textarea",
      label: "Long Text",
      required: false,
    });
  });

  it("moves a field up and keeps a contiguous order sequence", () => {
    const result = moveField(
      normalizeFieldOrder([
        makeField({ key: "one", label: "One" }),
        makeField({ key: "two", label: "Two" }),
        makeField({ key: "three", label: "Three" }),
      ]),
      "three",
      "up",
    );

    expect(result.map((field) => field.key)).toEqual(["one", "three", "two"]);
    expect(result.map((field) => field.order)).toEqual([0, 1, 2]);
  });

  it("updates one field without disturbing the saved order", () => {
    const fields = normalizeFieldOrder([
      makeField({ key: "name", label: "Name" }),
      makeField({ key: "deadline", label: "Deadline", type: "date" }),
    ]);

    const result = updateField(fields, {
      ...fields[1]!,
      label: "Launch deadline",
      required: true,
    });

    expect(result[1]).toMatchObject({
      key: "deadline",
      label: "Launch deadline",
      required: true,
      order: 1,
    });
  });

  it("removes a field and compacts the remaining order values", () => {
    const result = removeField(
      normalizeFieldOrder([
        makeField({ key: "one" }),
        makeField({ key: "two" }),
        makeField({ key: "three" }),
      ]),
      "two",
    );

    expect(result.map((field) => field.key)).toEqual(["one", "three"]);
    expect(result.map((field) => field.order)).toEqual([0, 1]);
  });
});
