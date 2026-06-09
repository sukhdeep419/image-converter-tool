"use client";

import { useState } from "react";

interface ImageCompareSliderProps {
  originalSrc: string;
  optimizedSrc: string;
  originalSize: string;
  optimizedSize: string;
}

export default function ImageCompareSlider({
  originalSrc,
  optimizedSrc,
  originalSize,
  optimizedSize,
}: ImageCompareSliderProps) {
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black/5 aspect-video md:aspect-[16/9]">
      {/* Optimized (Bottom Layer) */}
      <img
        src={optimizedSrc}
        alt="Optimized"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
      />

      {/* Original (Top Layer with Clip Path) */}
      <img
        src={originalSrc}
        alt="Original"
        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
      />

      {/* Slider Control */}
      <input
        type="range"
        min={0}
        max={100}
        value={sliderValue}
        onChange={(e) => setSliderValue(Number(e.target.value))}
        className="absolute inset-0 z-20 w-full cursor-ew-resize opacity-0"
      />

      {/* Custom Slider Thumb / Line */}
      <div
        className="absolute bottom-0 top-0 z-10 w-0.5 cursor-ew-resize bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `${sliderValue}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
          <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
          </svg>
        </div>
      </div>

      {/* Badges */}
      <div className="absolute left-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
        Original: {originalSize}
      </div>
      <div className="absolute right-4 top-4 z-10 rounded-full bg-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
        Optimized: {optimizedSize}
      </div>
    </div>
  );
}
