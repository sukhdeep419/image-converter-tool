"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OutputFormat = "jpg" | "png" | "webp" | "avif";

type StatusState = "idle" | "converting" | "done" | "error";

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

export default function ToolPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("jpg");
  const [quality, setQuality] = useState(90);
  const [status, setStatus] = useState<StatusState>("idle");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const totalBytes = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

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

    setMessage(notice);
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
      setMessage("Add at least one image to convert.");
      return;
    }

    setStatus("converting");
    setMessage("");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      formData.append("format", format);
      formData.append("quality", String(quality));

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
      setDownloadUrl(url);
      setStatus("done");
      setMessage("Conversion complete. Your download should start now.");

      const link = document.createElement("a");
      link.href = url;
      link.download = "converted-images.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong.";
      setStatus("error");
      setMessage(errorMessage);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const qualityEnabled = format !== "png";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Conversion Tool
          </p>
          <h1 className="mt-3 text-3xl font-[var(--font-display)] text-[color:var(--foreground)] md:text-4xl">
            Convert batches in one pass.
          </h1>
          <p className="mt-3 text-base text-[color:var(--muted)]">
            Upload up to 50 images (max 50 MB total), select a target format, and
            download a single zip with your converted files.
          </p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 border-dashed p-8 transition ${
            isDragging
              ? "border-[color:var(--accent)] bg-white"
              : "border-black/10 bg-white/70"
          }`}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent-2)] text-lg font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)]">
              +
            </div>
            <div>
              <p className="text-base font-semibold text-[color:var(--foreground)]">
                Drop images here
              </p>
              <p className="text-sm text-[color:var(--muted)]">
                or browse your files to add multiple images at once.
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-[color:var(--foreground)] px-5 py-2 text-sm font-semibold text-white transition hover:translate-y-[-2px]"
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

        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">
              Selected files
            </p>
            <p className="text-xs text-[color:var(--muted)]">
              {files.length} / {MAX_FILES} files, {formatBytes(totalBytes)} used
            </p>
          </div>

          {files.length === 0 ? (
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              No files selected yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-black/10 bg-[color:var(--background)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--foreground)] transition hover:bg-white"
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
        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[var(--shadow-lg)]">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            Output settings
          </h2>
          <div className="mt-5 space-y-5">
            <label className="block text-sm font-semibold text-[color:var(--foreground)]">
              Format
              <select
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as OutputFormat)
                }
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[color:var(--foreground)]"
              >
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[color:var(--foreground)]">
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
              <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--muted)]">
                <span>{qualityEnabled ? "Higher is cleaner" : "Not used for PNG"}</span>
                <span className="text-sm font-semibold text-[color:var(--foreground)]">
                  {quality}
                </span>
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={handleConvert}
            disabled={status === "converting"}
            className="mt-6 w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:translate-y-[-2px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "converting" ? "Converting..." : "Convert and download"}
          </button>

          {downloadUrl && status === "done" ? (
            <a
              href={downloadUrl}
              download="converted-images.zip"
              className="mt-3 block text-center text-sm font-semibold text-[color:var(--foreground)]"
            >
              Download again
            </a>
          ) : null}

          {message ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-[color:var(--background)] text-[color:var(--muted)]"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-black/10 bg-white/80 p-6 text-sm text-[color:var(--muted)]">
          <h3 className="text-base font-semibold text-[color:var(--foreground)]">
            Tips for best results
          </h3>
          <ul className="mt-3 space-y-2">
            <li>Use JPG for photos and PNG for graphics.</li>
            <li>WEBP and AVIF give smaller sizes with good clarity.</li>
            <li>Lower quality for smaller files when exporting JPG or WEBP.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
