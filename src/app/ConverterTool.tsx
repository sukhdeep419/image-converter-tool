"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import ImageCompareSlider from "@/components/ImageCompareSlider";

type OutputFormat = "jpg" | "png" | "webp" | "avif";

type StatusState = "idle" | "converting" | "done" | "error";

type ConvertedImage = {
  name: string;
  url: string;
  sizeBytes: number;
  originalUrl: string;
  originalSizeBytes: number;
};

type ModeResults = {
  status: StatusState;
  message: string;
  downloadUrl: string | null;
  convertedImages: ConvertedImage[];
};

const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

const formatOptions: { value: OutputFormat; label: string }[] = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WEBP" },
  { value: "avif", label: "AVIF" },
];

const formatBytes = (bytes: number) => {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
};

const initialModeResults: ModeResults = {
  status: "idle",
  message: "",
  downloadUrl: null,
  convertedImages: [],
};

export default function ConverterTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(75);
  const [isDragging, setIsDragging] = useState(false);
  const [activeMode, setActiveMode] = useState<"converter" | "optimizer">("converter");
  const [results, setResults] = useState<Record<"converter" | "optimizer", ModeResults>>({
    converter: initialModeResults,
    optimizer: initialModeResults,
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const status = results[activeMode].status;
  const message = results[activeMode].message;
  const downloadUrl = results[activeMode].downloadUrl;
  const convertedImages = results[activeMode].convertedImages;

  const totalBytes = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  useEffect(() => {
    return () => {
      Object.values(results).forEach(modeResult => {
        if (modeResult.downloadUrl) {
          URL.revokeObjectURL(modeResult.downloadUrl);
        }
        modeResult.convertedImages.forEach(img => {
          URL.revokeObjectURL(img.url);
          URL.revokeObjectURL(img.originalUrl);
        });
      });
    };
  }, []);

  const addFiles = (incoming: File[]) => {
    let notice = "";
    setFiles((prev) => {
      const images = incoming.filter((file) => file.type.startsWith("image/"));
      if (images.length === 0) {
        notice = "Only image files are supported.";
        return prev;
      }

      let combined = [...prev, ...images];
      if (combined.length > MAX_FILES) {
        combined = combined.slice(0, MAX_FILES);
        notice = "File limit reached. Only the first 50 images are kept.";
      }

      let runningBytes = 0;
      const limited: File[] = [];
      for (const file of combined) {
        if (runningBytes + file.size > MAX_TOTAL_BYTES) {
          notice = "Total size limit reached. Some files were skipped.";
          continue;
        }
        limited.push(file);
        runningBytes += file.size;
      }

      return limited;
    });

    if (notice) {
      setResults(prev => ({
        ...prev,
        [activeMode]: { ...prev[activeMode], message: notice }
      }));
    }
  };

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selection = Array.from(event.target.files ?? []);
    if (selection.length > 0) {
      addFiles(selection);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (dropped.length > 0) {
      addFiles(dropped);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setResults(prev => ({
        ...prev,
        [activeMode]: { ...prev[activeMode], message: "Add at least one image to convert." }
      }));
      return;
    }

    setResults(prev => ({
      ...prev,
      [activeMode]: { ...prev[activeMode], status: "converting", message: "" }
    }));

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      formData.append("format", activeMode === "optimizer" ? "original" : format);
      formData.append("quality", String(activeMode === "converter" ? 100 : quality));

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Conversion failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(blob);
      const extractedImages: ConvertedImage[] = [];

      let index = 0;
      for (const relativePath of Object.keys(loadedZip.files)) {
        const zipEntry = loadedZip.files[relativePath];
        if (!zipEntry.dir) {
          const fileBlob = await zipEntry.async("blob");
          const originalFile = files[index];
          const originalUrl = URL.createObjectURL(originalFile);

          extractedImages.push({
            name: zipEntry.name,
            url: URL.createObjectURL(fileBlob),
            sizeBytes: fileBlob.size,
            originalUrl,
            originalSizeBytes: originalFile.size,
          });
          index++;
        }
      }

      setResults(prev => {
        const oldResult = prev[activeMode];
        if (oldResult.downloadUrl) {
          URL.revokeObjectURL(oldResult.downloadUrl);
        }
        oldResult.convertedImages.forEach(img => {
          URL.revokeObjectURL(img.url);
          URL.revokeObjectURL(img.originalUrl);
        });

        return {
          ...prev,
          [activeMode]: {
            status: "done",
            message: "Conversion complete. You can now preview and download your files.",
            downloadUrl: url,
            convertedImages: extractedImages
          }
        };
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong.";
      setResults(prev => ({
        ...prev,
        [activeMode]: { ...prev[activeMode], status: "error", message: errorMessage }
      }));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleReset = () => {
    setFiles([]);
    setResults(prev => {
      const oldResult = prev[activeMode];
      if (oldResult.downloadUrl) {
        URL.revokeObjectURL(oldResult.downloadUrl);
      }
      oldResult.convertedImages.forEach(img => {
        URL.revokeObjectURL(img.url);
        URL.revokeObjectURL(img.originalUrl);
      });

      return {
        ...prev,
        [activeMode]: initialModeResults
      };
    });
  };

  const qualityEnabled = activeMode === "optimizer" ? true : format !== "png";

  const handleModeChange = (mode: "converter" | "optimizer") => {
    if (mode === activeMode) return;
    setActiveMode(mode);
  };

  return (
    <>
      {/* Centered header */}
      <div className="text-center space-y-5">
        <p className="eyebrow-label text-lg text-primary">
          {activeMode === "converter" ? "Conversion Tool" : "Optimization Tool"}
        </p>
        <div className="flex justify-center">
          <div className="flex w-fit rounded-full bg-black/5 p-1">
            <button
              onClick={() => handleModeChange("converter")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeMode === "converter"
                  ? "bg-white text-foreground shadow-formit-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Converter
            </button>
            <button
              onClick={() => handleModeChange("optimizer")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeMode === "optimizer"
                  ? "bg-white text-foreground shadow-formit-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Optimizer
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-display text-foreground md:text-4xl">
          {activeMode === "converter" ? "Convert batches in one pass." : "Optimize sizes instantly."}
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted">
          {activeMode === "converter"
            ? "Upload up to 50 images (max 50 MB total), select a target format, and download a single zip with your converted files."
            : "Upload up to 50 images to compress their file sizes without changing their original formats."}
        </p>
      </div>

      {/* Tool row: upload + settings side by side */}
      <div className="tool-grid mt-10 grid gap-8">
      <section className="space-y-6">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 transition ${
            isDragging
              ? "border-accent bg-white"
              : "border-black/10 bg-white/70 hover:bg-white/90"
          }`}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-2 text-lg font-semibold text-foreground shadow-formit-sm transition hover:scale-105"
            >
              +
            </button>
            <div>
              <p className="text-base font-semibold text-foreground">
                Drop images here
              </p>
              <p className="text-sm text-muted">
                or browse your files to add multiple images at once.
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Browse files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilePick}
              className="hidden"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-formit-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Selected files
            </p>
            <p className="text-xs text-muted">
              {files.length} / {MAX_FILES} files, {formatBytes(totalBytes)} used
            </p>
          </div>

          {files.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No files selected yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-black/10 bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-white"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-formit-lg">
          <h2 className="text-lg font-semibold text-foreground">
            Output settings
          </h2>
          <div className="mt-5 space-y-5">
            {activeMode === "converter" && (
              <label className="block text-sm font-semibold text-foreground">
                Format
                <select
                  value={format}
                  onChange={(event) =>
                    setFormat(event.target.value as OutputFormat)
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-foreground"
                >
                  {formatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {activeMode === "optimizer" && (
              <label className="block text-sm font-semibold text-foreground">
                Quality
                <input
                  type="range"
                  min={60}
                  max={100}
                  value={quality}
                  disabled={!qualityEnabled}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-3 w-full"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <span>{qualityEnabled ? "Higher is cleaner" : "Not used for PNG"}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {quality}
                  </span>
                </div>
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={handleConvert}
            disabled={status === "converting" || files.length === 0}
            className="mt-6 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-formit-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "converting" ? "Processing..." : (activeMode === "converter" ? "Convert" : "Optimize")}
          </button>

          {message ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-background text-muted"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>

      </aside>
    </div>

    {convertedImages.length > 0 && status === "done" && (
      <div className="mt-10 rounded-3xl border border-black/10 bg-white/90 p-8 shadow-formit-lg animate-fade-up">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display text-foreground">
            {activeMode === "converter" ? "Conversion Results" : "Optimization Results"}
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-formit-sm transition hover:bg-black/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {activeMode === "converter" ? "Convert again" : "Optimize again"}
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-8">
          {convertedImages.map((img, i) => (
            <div key={i} className="flex flex-col gap-6 rounded-3xl border border-black/10 bg-background p-6 shadow-formit-sm">
              <div className="flex items-center justify-between">
                <p className="truncate text-base font-semibold text-foreground" title={img.name}>
                  {img.name}
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={img.url}
                    download={img.name}
                    className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Download {activeMode === "converter" ? format.toUpperCase() : "Optimized"}
                  </a>
                  {convertedImages.length === 1 && downloadUrl && (
                     <a
                      href={downloadUrl}
                      download="converted-images.zip"
                      className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-black/5"
                    >
                      Download ZIP
                    </a>
                  )}
                </div>
              </div>
              
              {activeMode === "optimizer" ? (
                <ImageCompareSlider 
                  originalSrc={img.originalUrl}
                  optimizedSrc={img.url}
                  originalSize={formatBytes(img.originalSizeBytes)}
                  optimizedSize={formatBytes(img.sizeBytes)}
                />
              ) : (
                <div className="aspect-video w-full relative overflow-hidden rounded-xl bg-black/5 flex items-center justify-center p-2">
                  <img src={img.url} alt={img.name} className="max-h-full max-w-full object-contain drop-shadow-md" />
                </div>
              )}
            </div>
          ))}
        </div>
        {convertedImages.length > 1 && downloadUrl && (
          <div className="mt-8 flex justify-center">
            <a
              href={downloadUrl}
              download="converted-images.zip"
              className="rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white shadow-formit-sm transition hover:-translate-y-0.5"
            >
              Download All as ZIP
            </a>
          </div>
        )}
      </div>
    )}
    </>
  );
}
