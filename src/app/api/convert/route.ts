import JSZip from "jszip";
import sharp from "sharp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

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

    for (const [index, file] of files.entries()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      let pipeline = sharp(buffer);

      let actualFormat = format;
      if (format === "original") {
        const ext = file.name.split('.').pop()?.toLowerCase() || "";
        actualFormat = (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "avif") ? ext : "jpg";
      }

      let outputBuffer: Buffer;

      if (format === "original" && actualFormat === "png") {
        outputBuffer = buffer;
      } else {
        switch (actualFormat) {
          case "jpg":
          case "jpeg":
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
            break;
          case "png":
            pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
            break;
          case "webp":
            pipeline = pipeline.webp({ quality });
            break;
          case "avif":
            pipeline = pipeline.avif({ quality });
            break;
          default:
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
            break;
        }
        outputBuffer = await pipeline.toBuffer();
      }

      const baseName = sanitizeBaseName(file.name);
      const extension = actualFormat === "jpeg" ? "jpg" : actualFormat;
      const outputName = `${baseName}-${index + 1}.${extension}`;

      zip.file(outputName, outputBuffer);
    }

    const zipBuffer = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
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
