import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import {
  extractPages,
  formatBytes,
  imagesToPdf,
  mergePdfs,
  parsePageRanges,
  rotatePdfPages,
  splitPagesToBuffers,
  type LoadedPdf,
} from "./index";
import JSZip from "jszip";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function makePdfBytes(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i += 1) {
    doc.addPage([200 + i, 300]);
  }
  return doc.save();
}

async function asLoaded(
  bytes: Uint8Array,
  name: string,
): Promise<LoadedPdf> {
  const buffer = toArrayBuffer(bytes);
  return {
    id: name,
    file: new File([buffer], name, { type: "application/pdf" }),
    name,
    size: buffer.byteLength,
    pageCount: (await PDFDocument.load(buffer)).getPageCount(),
    bytes: buffer,
  };
}

function tinyPng(): Uint8Array {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

describe("parsePageRanges", () => {
  it("parses mixed ranges and unique pages", () => {
    expect(parsePageRanges("1-3,5,8-10", 12)).toEqual({
      pages: [1, 2, 3, 5, 8, 9, 10],
      error: null,
    });
  });

  it("rejects invalid and out-of-range values", () => {
    expect(parsePageRanges("3-1", 5).error).toMatch(/reversed/i);
    expect(parsePageRanges("1,99", 5).error).toMatch(/beyond/i);
    expect(parsePageRanges("abc", 5).error).toBeTruthy();
    expect(parsePageRanges("", 5).error).toBeTruthy();
  });
});

describe("mergePdfs", () => {
  it("merges PDFs in list order", async () => {
    const a = await asLoaded(await makePdfBytes(2), "a.pdf");
    const b = await asLoaded(await makePdfBytes(3), "b.pdf");
    const merged = await mergePdfs([a, b]);
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(5);
    expect(doc.getPage(0).getSize().width).toBe(200);
    expect(doc.getPage(2).getSize().width).toBe(200);
  });

  it("requires at least two files", async () => {
    const a = await asLoaded(await makePdfBytes(1), "a.pdf");
    await expect(mergePdfs([a])).rejects.toThrow(/two/i);
  });
});

describe("extractPages / split", () => {
  it("extracts selected pages into one PDF", async () => {
    const source = await makePdfBytes(4);
    const extracted = await extractPages(toArrayBuffer(source), [2, 4]);
    const doc = await PDFDocument.load(extracted);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(0).getSize().width).toBe(201);
    expect(doc.getPage(1).getSize().width).toBe(203);
  });

  it("builds separate page buffers suitable for ZIP export", async () => {
    const source = await makePdfBytes(3);
    const parts = await splitPagesToBuffers(toArrayBuffer(source), [1, 3]);
    expect(parts).toHaveLength(2);
    expect(parts[0]?.name).toMatch(/page-1/i);
    const zip = new JSZip();
    for (const part of parts) {
      zip.file(part.name, part.data);
    }
    const archive = await zip.generateAsync({ type: "uint8array" });
    const loaded = await JSZip.loadAsync(archive);
    expect(Object.keys(loaded.files).sort()).toEqual([
      parts[0]!.name,
      parts[1]!.name,
    ].sort());
    const first = await PDFDocument.load(parts[0]!.data);
    expect(first.getPageCount()).toBe(1);
    expect(first.getPage(0).getSize().width).toBe(200);
  });
});

describe("rotatePdfPages", () => {
  it("applies relative rotation on selected pages", async () => {
    const source = await makePdfBytes(2);
    const rotated = await rotatePdfPages(toArrayBuffer(source), {
      1: 90,
      2: 180,
    });
    const doc = await PDFDocument.load(rotated);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(180);
  });

  it("stacks on existing page rotation", async () => {
    const sourceDoc = await PDFDocument.create();
    const page = sourceDoc.addPage([200, 300]);
    page.setRotation(degrees(90));
    const source = await sourceDoc.save();
    const rotated = await rotatePdfPages(toArrayBuffer(source), { 1: 90 });
    const doc = await PDFDocument.load(rotated);
    expect(doc.getPage(0).getRotation().angle).toBe(180);
  });
});

describe("imagesToPdf", () => {
  it("creates one page per image", async () => {
    const png = tinyPng();
    const pdf = await imagesToPdf(
      [
        { bytes: toArrayBuffer(png), mime: "image/png", name: "a.png" },
        { bytes: toArrayBuffer(png), mime: "image/png", name: "b.png" },
      ],
      { pageSize: "fit", orientation: "portrait", margin: "none" },
    );
    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(2);
  });

  it("uses A4 page dimensions when requested", async () => {
    const png = tinyPng();
    const pdf = await imagesToPdf(
      [{ bytes: toArrayBuffer(png), mime: "image/png", name: "a.png" }],
      { pageSize: "a4", orientation: "portrait", margin: "none" },
    );
    const doc = await PDFDocument.load(pdf);
    const size = doc.getPage(0).getSize();
    expect(Math.round(size.width)).toBe(595);
    expect(Math.round(size.height)).toBe(842);
  });
});

describe("formatBytes", () => {
  it("labels units correctly", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1072)).toBe("1.0 KB");
    expect(formatBytes(1048576)).toBe("1.0 MB");
  });
});
