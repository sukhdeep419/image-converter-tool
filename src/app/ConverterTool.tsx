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

function FilePreview({ file, onRemove }: { file: File, onRemove: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="snap-center shrink-0 flex items-center gap-3 rounded-full bg-white/80 backdrop-blur-sm p-2 pr-4 shadow-sm border border-black/5 transition hover:bg-white">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-black/5 flex items-center justify-center shrink-0">
        {url && <img src={url} alt={file.name} className="w-full h-full object-cover" />}
      </div>
      <div className="flex flex-col">
        <p className="text-sm font-semibold text-foreground max-w-[120px] truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted">
          {formatBytes(file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 flex items-center justify-center w-6 h-6 rounded-full border border-black/10 text-muted hover:bg-black/5 hover:text-foreground transition shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
}

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
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8 px-4 w-full max-w-[95vw] mx-auto mt-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {activeMode === "converter" ? "Conversion Tool" : "Optimization Tool"}
        </h1>
        <div className="flex w-fit rounded-full bg-black/5 p-1 shadow-inner">
          <button
            onClick={() => handleModeChange("converter")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeMode === "converter"
                ? "bg-foreground text-white shadow-formit-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Converter
          </button>
          <button
            onClick={() => handleModeChange("optimizer")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeMode === "optimizer"
                ? "bg-foreground text-white shadow-formit-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Optimizer
          </button>
        </div>
      </div>

      {/* Massive Dropzone Area */}
      <div className="w-full max-w-[95vw] mx-auto min-h-[75vh] relative rounded-[32px] border-2 border-dashed border-black/15 bg-transparent p-8 flex flex-col items-center justify-center transition-all duration-300">
        
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={(e) => {
             // Only trigger if they didn't click inside the settings panel or a file remove button
             if ((e.target as HTMLElement).closest('.settings-panel, .file-remove-btn')) return;
             inputRef.current?.click();
          }}
          className={`absolute inset-0 rounded-[32px] cursor-pointer transition-colors ${
            isDragging ? "bg-white/50 border-black/30 border-2" : "hover:bg-white/30"
          }`}
        />

        <div className="flex flex-col items-center text-center z-10 pointer-events-none mt-10">
          {/* Icon */}
          <div className="w-16 h-16 rounded-[1.25rem] bg-[#eeb056] shadow-sm mb-6 flex items-center justify-center">
            {/* Inner aesthetic (if any) could go here */}
          </div>
          
          <h2 className="text-3xl font-display text-foreground font-bold mb-2">
            Drop images anywhere
          </h2>
          <p className="text-sm text-muted font-medium">
            or browse — up to 50 files, 50 MB total
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilePick}
            className="hidden"
          />
        </div>

        {/* Selected Files Tags */}
        {files.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 z-10 max-w-3xl">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm"
              >
                <span className="truncate max-w-[120px]">{file.name}</span>
                <span className="text-muted/50">·</span>
                <span className="text-muted font-medium">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="file-remove-btn ml-1 text-muted hover:text-foreground transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Floating Settings Panel */}
        <div className="settings-panel absolute bottom-6 right-6 md:bottom-10 md:right-10 z-20 w-full max-w-[300px] rounded-2xl bg-white p-6 shadow-formit-lg border border-black/5">
          <h3 className="text-[15px] font-bold text-foreground mb-4">Output settings</h3>
          
          <div className="flex flex-col gap-3">
            {/* Format Dropdown */}
            {activeMode === "converter" && (
              <div className="relative">
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value as OutputFormat)}
                  className="w-full appearance-none rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#e77a5b] shadow-sm"
                >
                  {formatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-foreground/50">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}

            {/* Quality Dropdown */}
            <div className="relative">
              <select
                value={quality}
                disabled={!qualityEnabled}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="w-full appearance-none rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#e77a5b] shadow-sm disabled:opacity-50"
              >
                <option value={100}>Maximum quality</option>
                <option value={90}>High quality</option>
                <option value={75}>Medium quality</option>
                <option value={60}>Low quality</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-foreground/50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* Convert Button */}
            <button
              type="button"
              onClick={handleConvert}
              disabled={status === "converting" || files.length === 0}
              className="w-full rounded-xl bg-[#de7f62] px-4 py-3 mt-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d47052] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "converting" ? "Processing..." : `Convert ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </button>
            
            {/* Status Footer */}
            {message ? (
              <p className="text-center text-xs text-muted mt-2 font-medium">
                {message}
              </p>
            ) : status === "done" ? (
              <p className="text-center text-xs text-muted mt-2 font-medium">
                {files.length} done · <a href="#results" className="underline hover:text-foreground">View results</a>
              </p>
            ) : (
              <div className="h-5 mt-2"></div>
            )}
          </div>
        </div>

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
                <div>
                  <p className="truncate text-base font-semibold text-foreground" title={img.name}>
                    {img.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs line-through text-muted/70">{formatBytes(img.originalSizeBytes)}</span>
                    <span className={`text-xs font-semibold ${img.sizeBytes < img.originalSizeBytes ? 'text-emerald-600' : 'text-red-500'}`}>
                      {formatBytes(img.sizeBytes)}
                    </span>
                    {img.sizeBytes < img.originalSizeBytes ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        -{Math.round(((img.originalSizeBytes - img.sizeBytes) / img.originalSizeBytes) * 100)}%
                      </span>
                    ) : img.sizeBytes > img.originalSizeBytes ? (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded">
                        +{Math.round(((img.sizeBytes - img.originalSizeBytes) / img.originalSizeBytes) * 100)}%
                      </span>
                    ) : null}
                  </div>
                </div>
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
