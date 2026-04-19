import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "node:crypto";

export interface CoPdfSigner {
  name: string;
  ip: string;
  signedAt: Date;
}

export interface CoPdfProject {
  id: string;
  title?: string | null;
}

export interface CoPdfChangeOrder {
  id: string;
  title: string;
  workDescription?: string | null;
  revisedTimeline?: string | null;
  estimatedHours?: number | null;
  pricing?: Record<string, unknown> | null;
}

export interface GeneratedCoPdf {
  bytes: Uint8Array;
  hash: string;
}

/**
 * Pure function — no side effects, no I/O.
 * Generates a signed change-order PDF and returns the raw bytes plus
 * a SHA-256 hex digest that can be stored as a tamper-evident artifact.
 */
export async function generateSignedCoPdf(
  co: CoPdfChangeOrder,
  signer: CoPdfSigner,
  project: CoPdfProject,
): Promise<GeneratedCoPdf> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 portrait

  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 50;
  const lineHeight = 18;
  let y = height - margin;

  const drawText = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> },
  ): void => {
    page.drawText(text, {
      x: margin,
      y,
      size: opts.size ?? 11,
      font: opts.bold ? boldFont : regularFont,
      color: opts.color ?? rgb(0, 0, 0),
    });
    y -= lineHeight;
  };

  const drawSectionGap = (): void => {
    y -= lineHeight * 0.5;
  };

  // ── Header ───────────────────────────────────────────────────────────────
  drawText("CHANGE ORDER — SIGNED ARTIFACT", { size: 16, bold: true });
  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= lineHeight;

  // ── Metadata ─────────────────────────────────────────────────────────────
  drawText(`Change Order ID: ${co.id}`, { bold: true });
  drawText(`Title:           ${co.title}`, {});
  drawText(`Project ID:      ${project.id}`, {});
  if (project.title) {
    drawText(`Project:         ${project.title}`, {});
  }
  drawSectionGap();

  // ── Work Description ─────────────────────────────────────────────────────
  if (co.workDescription) {
    drawText("Work Description", { bold: true, size: 12 });
    // Wrap long descriptions naively at ~90 chars
    const words = co.workDescription.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > 90) {
        drawText(line, { size: 10 });
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) drawText(line, { size: 10 });
    drawSectionGap();
  }

  // ── Financials ────────────────────────────────────────────────────────────
  if (co.estimatedHours != null || co.pricing != null) {
    drawText("Financials", { bold: true, size: 12 });
    if (co.estimatedHours != null) {
      drawText(`Estimated Hours: ${co.estimatedHours}`, {});
    }
    if (typeof co.pricing?.amount === "number") {
      drawText(`Total Amount:    $${co.pricing.amount.toFixed(2)}`, {});
    }
    drawSectionGap();
  }

  if (co.revisedTimeline) {
    drawText("Revised Timeline", { bold: true, size: 12 });
    drawText(co.revisedTimeline, { size: 10 });
    drawSectionGap();
  }

  // ── Signature Block ───────────────────────────────────────────────────────
  y -= lineHeight;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });
  y -= lineHeight;

  drawText("Electronic Signature", { bold: true, size: 12 });
  drawText(`Signed by:   ${signer.name}`, {});
  drawText(`IP Address:  ${signer.ip}`, {});
  drawText(`Signed at:   ${signer.signedAt.toISOString()}`, {});
  drawSectionGap();

  drawText(
    "By accepting this change order the signer agrees to all terms described above.",
    { size: 9, color: rgb(0.4, 0.4, 0.4) },
  );

  // ── Footer with doc hash placeholder ─────────────────────────────────────
  page.drawText(`Document generated: ${new Date().toISOString()}`, {
    x: margin,
    y: 30,
    size: 8,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6),
  });

  const pdfBytes = await doc.save();
  const bytes = new Uint8Array(pdfBytes);

  const hash = createHash("sha256").update(bytes).digest("hex");

  return { bytes, hash };
}
