import JSZip from "jszip";
import sharp from "sharp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Disable sharp cache to prevent memory hoarding in serverless environments
sharp.cache(false);

const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const CONCURRENCY_LIMIT = 5;

const supportedFormats = new Set(["jpg", "jpeg", "png", "webp", "avif", "original"]);

const sanitizeBaseName = (name: string) => {
  const base = name.replace(/\.[^/.]+$/, "") || "image";
  const cleaned = base
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "image";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

async function processFile(file: File, index: number, format: string, quality: number) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop()?.toLowerCase() || "";
  let actualFormat = format;

  if (format === "original") {
    actualFormat = (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "avif") ? ext : "jpg";
  }

  // Base sharp instance. Metadata is stripped automatically unless .withMetadata() is called.
  let pipeline = sharp(buffer);
  let outputBuffer: Buffer;

  switch (actualFormat) {
    case "jpg":
    case "jpeg":
      pipeline = pipeline.jpeg({ quality, mozjpeg: true, progressive: true });
      break;
    case "png":
      pipeline = pipeline.png({ compressionLevel: 8, adaptiveFiltering: true, effort: 7 });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality, effort: 4 });
      break;
    case "avif":
      // Lower effort for avif to drastically speed up processing time on Vercel
      pipeline = pipeline.avif({ quality, effort: 3 }); 
      break;
    default:
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
  }

  try {
    outputBuffer = await pipeline.toBuffer();
  } catch (err) {
    console.error("Sharp processing failed for file", file.name, err);
    outputBuffer = buffer; // Fallback to original buffer
  }

  // Guardrail: Ensure output is never larger than input if we are optimizing or keeping same format
  let finalBuffer = outputBuffer;
  let finalExtension = actualFormat === "jpeg" ? "jpg" : actualFormat;

  // The fix: only revert if we are optimizing ("original") or converting to the EXACT same format as input
  if (outputBuffer.length >= buffer.length && (format === "original" || ext === actualFormat)) {
    finalBuffer = buffer;
    finalExtension = ext === "jpeg" ? "jpg" : (ext || "jpg");
  }

  const baseName = sanitizeBaseName(file.name);
  const outputName = `${baseName}-${index + 1}.${finalExtension}`;

  return { outputName, finalBuffer };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const formatRaw = (formData.get("format") ?? "jpg").toString().toLowerCase();
    const format = supportedFormats.has(formatRaw) ? formatRaw : "jpg";
    const qualityValue = Number(formData.get("quality") ?? 90);
    const quality = clamp(Number.isFinite(qualityValue) ? qualityValue : 90, 60, 100);

    const files = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No image files provided." },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: "Too many files. Max 50 images allowed." },
        { status: 400 }
      );
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Total upload size exceeds 50 MB." },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const results = [];

    // Process files concurrently in chunks to prevent memory explosion
    let i = 0;
    while (i < files.length) {
      const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
      const chunkPromises = chunk.map((file, idx) => processFile(file, i + idx, format, quality));
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      i += CONCURRENCY_LIMIT;
    }

    for (const res of results) {
      zip.file(res.outputName, res.finalBuffer);
    }

    const zipBuffer = await zip.generateAsync({
      type: "uint8array",
      compression: "STORE", // MASSIVE SPEEDUP: Do not double-compress already compressed images
    });

    const safeBuffer = Uint8Array.from(zipBuffer);
    const zipBlob = new Blob([safeBuffer], { type: "application/zip" });

    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=converted-images.zip",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Conversion failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
