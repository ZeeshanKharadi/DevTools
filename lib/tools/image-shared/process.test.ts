import { describe, expect, it } from "vitest";
import {
  computeAspectSize,
  extensionForMime,
  percentSaved,
  safeBaseName,
  sizeFromPercent,
} from "./index";

describe("image sizing helpers", () => {
  it("locks aspect ratio from width or height", () => {
    expect(computeAspectSize(200, 100, 100, null, true)).toEqual({
      width: 100,
      height: 50,
    });
    expect(computeAspectSize(200, 100, null, 50, true)).toEqual({
      width: 100,
      height: 50,
    });
  });

  it("supports percentage scaling", () => {
    expect(sizeFromPercent(800, 600, 50)).toEqual({ width: 400, height: 300 });
  });

  it("reports savings accurately", () => {
    expect(percentSaved(1000, 750)).toBeCloseTo(25);
    expect(percentSaved(1000, 1200)).toBeCloseTo(-20);
  });

  it("builds safe filenames and extensions", () => {
    expect(safeBaseName("My Photo!!.png")).toMatch(/My-Photo/i);
    expect(extensionForMime("image/webp")).toBe("webp");
    expect(extensionForMime("image/png")).toBe("png");
  });
});
