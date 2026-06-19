import Link from "next/link";
import ConverterTool from "./ConverterTool";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div className="top-level mt-10 flex flex-col gap-8 items-center">
        <div className="text-center eyebrow-label inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/70 px-8 py-2 text-md text-accent font-semibold">
          Batch Image Conversion
        </div>
        <div className="space-y-5">
          <h1 className="font-display text-5xl font-bold capitalize text-foreground text-center max-w-4xl">
            Convert entire folders of images without losing control of quality.
          </h1>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-formit-lg transition hover:-translate-y-0.5"
            href="#converter"
          >
            Open the converter
          </Link>
          <Link
            className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-foreground shadow-formit-sm transition hover:-translate-y-0.5"
            href="/contact"
          >
            Talk to the team
          </Link>
        </div>
      </div>
      <section className="mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: "140ms" }}>
          {[
            { title: "Drop images", desc: "Drag a full folder or multi-select." },
            { title: "Pick format", desc: "JPG, PNG, WEBP, or AVIF." },
            { title: "Tune quality", desc: "Use the slider for JPG and WEBP." },
            { title: "Download bundle", desc: "One zip, ready to share." },
          ].map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-4 rounded-2xl border border-black/10 bg-background p-4 animate-fade-up"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-semibold text-foreground shadow-formit-sm shrink-0">
                {index + 1}
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="text-sm text-muted">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 mx-auto w-full text-center max-w-fit rounded-2xl bg-foreground p-5 text-sm text-white">
          Your images stay private. Files are processed on the server and bundled immediately after conversion.
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="#converter" className="animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </Link>
        </div>
      </section>

      <section id="converter" className="mt-8 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <ConverterTool />
      </section>
    </div>
  );
}
