import { describe, expect, it } from "vitest";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import {
  applyWatermark,
  createOrganizedPages,
  deleteOrganizedPages,
  duplicateOrganizedPage,
  exportOrganizedPdf,
  mapPreviewRectToPdf,
  moveOrganizedPage,
  resolveWatermarkPages,
  watermarkPlacement,
} from "./index";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function makePdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i += 1) {
    doc.addPage([200 + i, 300]);
  }
  return doc.save();
}

describe("organize pdf", () => {
  it("reorders, duplicates, deletes, and rotates on export", async () => {
    const source = await makePdf(3);
    let pages = createOrganizedPages(3);
    pages = moveOrganizedPage(pages, pages[2]!.id, 0);
    pages = duplicateOrganizedPage(pages, pages[0]!.id);
    pages[0] = { ...pages[0]!, rotation: 90 };
    pages = deleteOrganizedPages(pages, [pages[pages.length - 1]!.id]);

    const exported = await exportOrganizedPdf(toArrayBuffer(source), pages);
    const doc = await PDFDocument.load(exported);
    expect(doc.getPageCount()).toBe(pages.length);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(0).getSize().width).toBe(202);
  });

  it("rejects empty exports", async () => {
    const source = await makePdf(1);
    await expect(
      exportOrganizedPdf(toArrayBuffer(source), []),
    ).rejects.toThrow(/at least one page/i);
  });
});

describe("watermark", () => {
  it("places text on selected pages", async () => {
    const source = await makePdf(3);
    const output = await applyWatermark(
      toArrayBuffer(source),
      { mode: "range", expression: "1,3" },
      {
        kind: "text",
        text: "DRAFT",
        fontSize: 24,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.4,
        rotation: -20,
        position: "center",
        offsetX: 0,
        offsetY: 0,
      },
    );
    const doc = await PDFDocument.load(output);
    expect(doc.getPageCount()).toBe(3);
  });

  it("resolves page targets and shared geometry", () => {
    expect(resolveWatermarkPages(5, { mode: "first" })).toEqual([1]);
    expect(resolveWatermarkPages(5, { mode: "last" })).toEqual([5]);
    const place = watermarkPlacement(600, 800, 100, 40, "bottom-right", 0, 0);
    expect(place.x).toBeGreaterThan(400);
    expect(place.y).toBeLessThan(100);
  });
});

describe("signature coordinates", () => {
  it("maps preview top-left rects into PDF bottom-left space", () => {
    const box = mapPreviewRectToPdf(
      {
        left: 50,
        top: 50,
        width: 100,
        height: 40,
        previewWidth: 500,
        previewHeight: 500,
      },
      500,
      500,
      0,
    );
    expect(box.x).toBeCloseTo(50);
    expect(box.y).toBeCloseTo(410);
    expect(box.width).toBeCloseTo(100);
    expect(box.height).toBeCloseTo(40);
    expect(box.rotate).toBe(0);
  });

  it("handles 180° page rotation with counter-rotation", () => {
    const box = mapPreviewRectToPdf(
      {
        left: 0,
        top: 0,
        width: 100,
        height: 50,
        previewWidth: 200,
        previewHeight: 200,
      },
      200,
      200,
      180,
    );
    expect(box.rotate).toBe(-180);
    // Bounding box of the visual rect in PDF space.
    expect(box.width).toBeCloseTo(100);
    expect(box.height).toBeCloseTo(50);
  });

  it("maps 90° pages using swapped visual dimensions", () => {
    // Media 400×560 with Rotate 90 → visual 560×400
    const box = mapPreviewRectToPdf(
      {
        left: 0,
        top: 0,
        width: 112,
        height: 40,
        previewWidth: 560,
        previewHeight: 400,
      },
      400,
      560,
      90,
    );
    expect(box.rotate).toBe(-90);
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });
});

describe("existing rotation stacking for organize", () => {
  it("adds delta on top of source rotation", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 300]);
    page.setRotation(degrees(90));
    const bytes = await doc.save();
    const pages = createOrganizedPages(1);
    pages[0] = { ...pages[0]!, rotation: 90 };
    const exported = await exportOrganizedPdf(toArrayBuffer(bytes), pages);
    const out = await PDFDocument.load(exported);
    expect(out.getPage(0).getRotation().angle).toBe(180);
  });
});
