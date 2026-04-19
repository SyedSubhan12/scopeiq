import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface ChangeOrderDiffInput {
  projectName: string;
  before: {
    label: string;
    scopeItems: Array<{ name: string; quantity?: number | null; unitPrice?: number | null }>;
    total: number;
  };
  after: {
    label: string;
    scopeItems: Array<{ name: string; quantity?: number | null; unitPrice?: number | null }>;
    total: number;
  };
}

export async function generateChangeOrderDiffPdf(
  input: ChangeOrderDiffInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const red = rgb(0.7, 0.15, 0.15);
  const green = rgb(0.1, 0.5, 0.25);

  let y = 760;
  page.drawText("Change Order — Diff", { x: 40, y, font: bold, size: 18, color: black });
  y -= 24;
  page.drawText(`Project: ${input.projectName}`, { x: 40, y, font, size: 11, color: black });
  y -= 24;

  const beforeNames = new Set(input.before.scopeItems.map((i) => i.name));
  const afterNames = new Set(input.after.scopeItems.map((i) => i.name));
  const removed = input.before.scopeItems.filter((i) => !afterNames.has(i.name));
  const added = input.after.scopeItems.filter((i) => !beforeNames.has(i.name));

  page.drawText(`${input.before.label}  →  ${input.after.label}`, {
    x: 40,
    y,
    font: bold,
    size: 12,
    color: black,
  });
  y -= 20;

  page.drawText("Removed", { x: 40, y, font: bold, size: 11, color: red });
  y -= 16;
  if (removed.length === 0) {
    page.drawText("  (none)", { x: 40, y, font, size: 10, color: black });
    y -= 14;
  } else {
    for (const item of removed) {
      const price = item.unitPrice ?? 0;
      const qty = item.quantity ?? 1;
      page.drawText(`  − ${item.name}  (${qty} × $${price.toFixed(2)})`, {
        x: 40,
        y,
        font,
        size: 10,
        color: red,
      });
      y -= 14;
    }
  }
  y -= 6;

  page.drawText("Added", { x: 40, y, font: bold, size: 11, color: green });
  y -= 16;
  if (added.length === 0) {
    page.drawText("  (none)", { x: 40, y, font, size: 10, color: black });
    y -= 14;
  } else {
    for (const item of added) {
      const price = item.unitPrice ?? 0;
      const qty = item.quantity ?? 1;
      page.drawText(`  + ${item.name}  (${qty} × $${price.toFixed(2)})`, {
        x: 40,
        y,
        font,
        size: 10,
        color: green,
      });
      y -= 14;
    }
  }

  y -= 16;
  const delta = input.after.total - input.before.total;
  const deltaLabel = delta >= 0 ? `+$${delta.toFixed(2)}` : `−$${Math.abs(delta).toFixed(2)}`;
  page.drawText(
    `Before: $${input.before.total.toFixed(2)}    After: $${input.after.total.toFixed(2)}    Δ ${deltaLabel}`,
    { x: 40, y, font: bold, size: 11, color: black },
  );

  return pdf.save();
}
