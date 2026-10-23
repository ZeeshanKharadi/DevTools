import {
  ImageToolError,
  MAX_IMAGE_BYTES,
  MAX_OUTPUT_DIMENSION,
  createImageId,
  extensionForMime,
  isSupportedImageMime,
  mimeFromFile,
  safeBaseName,
  type ImageOutputFormat,
  type LoadedImage,
} from "./utils";

export type FitMode = "contain" | "cover" | "stretch";

export type EncodeOptions = {
  format: ImageOutputFormat;
  quality: number;
  background?: string;
};

export type ResizeOptions = EncodeOptions & {
  width: number;
  height: number;
  fit: FitMode;
};

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageToolError("Could not decode this image."));
    image.src = url;
  });
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!isSupportedImageMime(file)) {
    throw new ImageToolError(
      `"${file.name}" is not a supported image. Use JPG, PNG, or WebP.`,
    );
  }
  if (file.size === 0) {
    throw new ImageToolError(`"${file.name}" is empty.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageToolError(`"${file.name}" is larger than 25 MB.`);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    let bitmap: ImageBitmap | HTMLImageElement;
    let width: number;
    let height: number;
    try {
      if (typeof createImageBitmap === "function") {
        bitmap = await createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
      } else {
        throw new Error("createImageBitmap unavailable");
      }
    } catch {
      bitmap = await loadHtmlImage(objectUrl);
      width = bitmap.naturalWidth;
      height = bitmap.naturalHeight;
    }
    if (width < 1 || height < 1) {
      throw new ImageToolError(`"${file.name}" has invalid dimensions.`);
    }
    return {
      id: createImageId(),
      file,
      name: file.name,
      size: file.size,
      width,
      height,
      mime: mimeFromFile(file) ?? "image/jpeg",
      objectUrl,
      bitmap,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    if (error instanceof ImageToolError) {
      throw error;
    }
    throw new ImageToolError(`Could not read "${file.name}".`);
  }
}

export function releaseLoadedImage(image: LoadedImage): void {
  if (image.objectUrl.startsWith("blob:")) {
    URL.revokeObjectURL(image.objectUrl);
  }
  if (typeof ImageBitmap !== "undefined" && image.bitmap instanceof ImageBitmap) {
    image.bitmap.close();
  }
}

function assertOutputSize(width: number, height: number): void {
  if (
    width < 1 ||
    height < 1 ||
    width > MAX_OUTPUT_DIMENSION ||
    height > MAX_OUTPUT_DIMENSION
  ) {
    throw new ImageToolError(
      `Output dimensions must be between 1 and ${MAX_OUTPUT_DIMENSION} pixels.`,
    );
  }
}

function drawFitted(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number,
  fit: FitMode,
  background: string,
): void {
  context.fillStyle = background;
  context.fillRect(0, 0, destWidth, destHeight);

  if (fit === "stretch") {
    context.drawImage(source, 0, 0, destWidth, destHeight);
    return;
  }

  const scale =
    fit === "cover"
      ? Math.max(destWidth / sourceWidth, destHeight / sourceHeight)
      : Math.min(destWidth / sourceWidth, destHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const dx = (destWidth - drawWidth) / 2;
  const dy = (destHeight - drawHeight) / 2;

  if (fit === "cover") {
    const sx = Math.max(0, (sourceWidth - destWidth / scale) / 2);
    const sy = Math.max(0, (sourceHeight - destHeight / scale) / 2);
    const sw = Math.min(sourceWidth, destWidth / scale);
    const sh = Math.min(sourceHeight, destHeight / scale);
    context.drawImage(source, sx, sy, sw, sh, 0, 0, destWidth, destHeight);
    return;
  }

  context.drawImage(source, dx, dy, drawWidth, drawHeight);
}

export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  options: EncodeOptions,
): Promise<{ blob: Blob; mime: ImageOutputFormat }> {
  const quality = Math.min(1, Math.max(0.05, options.quality));
  const mime = options.format;

  if (mime === "image/webp") {
    const supported =
      typeof HTMLCanvasElement !== "undefined" &&
      canvas.toDataURL("image/webp").startsWith("data:image/webp");
    if (!supported) {
      throw new ImageToolError(
        "This browser does not support WebP encoding. Choose JPG or PNG.",
      );
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new ImageToolError("Could not encode the image."));
          return;
        }
        resolve(result);
      },
      mime,
      mime === "image/png" ? undefined : quality,
    );
  });

  if (mime === "image/webp" && blob.type && blob.type !== "image/webp") {
    throw new ImageToolError("WebP encoding produced an unexpected format.");
  }

  return { blob, mime };
}

export async function resizeImage(
  image: LoadedImage,
  options: ResizeOptions,
): Promise<{ blob: Blob; width: number; height: number; mime: ImageOutputFormat; filename: string }> {
  assertOutputSize(options.width, options.height);
  const canvas = document.createElement("canvas");
  canvas.width = options.width;
  canvas.height = options.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new ImageToolError("Could not create a canvas for resizing.");
  }

  const background =
    options.format === "image/jpeg"
      ? options.background ?? "#ffffff"
      : options.background ?? "rgba(0,0,0,0)";

  if (options.format !== "image/jpeg") {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  drawFitted(
    context,
    image.bitmap,
    image.width,
    image.height,
    options.width,
    options.height,
    options.fit,
    options.format === "image/jpeg" ? background : "rgba(0,0,0,0)",
  );

  if (options.format === "image/jpeg" && background) {
    // Ensure opaque JPEG background behind transparent sources
    const temp = document.createElement("canvas");
    temp.width = options.width;
    temp.height = options.height;
    const tempContext = temp.getContext("2d");
    if (!tempContext) {
      throw new ImageToolError("Could not prepare JPEG background.");
    }
    tempContext.fillStyle = background;
    tempContext.fillRect(0, 0, temp.width, temp.height);
    tempContext.drawImage(canvas, 0, 0);
    const encoded = await encodeCanvas(temp, options);
    return {
      blob: encoded.blob,
      width: options.width,
      height: options.height,
      mime: encoded.mime,
      filename: `${safeBaseName(image.name)}-${options.width}x${options.height}.${extensionForMime(encoded.mime)}`,
    };
  }

  const encoded = await encodeCanvas(canvas, options);
  canvas.width = 0;
  canvas.height = 0;
  return {
    blob: encoded.blob,
    width: options.width,
    height: options.height,
    mime: encoded.mime,
    filename: `${safeBaseName(image.name)}-${options.width}x${options.height}.${extensionForMime(encoded.mime)}`,
  };
}

export async function compressImage(
  image: LoadedImage,
  options: EncodeOptions & {
    maxWidth?: number | null;
    maxHeight?: number | null;
  },
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  mime: ImageOutputFormat;
  filename: string;
}> {
  let width = image.width;
  let height = image.height;
  const maxWidth = options.maxWidth ?? null;
  const maxHeight = options.maxHeight ?? null;
  if (maxWidth || maxHeight) {
    const widthScale = maxWidth ? maxWidth / width : Number.POSITIVE_INFINITY;
    const heightScale = maxHeight ? maxHeight / height : Number.POSITIVE_INFINITY;
    const scale = Math.min(1, widthScale, heightScale);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const result = await resizeImage(image, {
    width,
    height,
    fit: "stretch",
    format: options.format,
    quality: options.quality,
    background: options.background ?? "#ffffff",
  });

  return {
    ...result,
    filename: `${safeBaseName(image.name)}-compressed.${extensionForMime(result.mime)}`,
  };
}

export async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      await worker(items[current]!, current);
    }
  });
  await Promise.all(runners);
}
