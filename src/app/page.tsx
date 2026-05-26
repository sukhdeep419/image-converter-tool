import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8 animate-[fade-up_0.8s_ease-out]">
          <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] shadow-[var(--shadow-sm)]">
            Batch Image Conversion
          </div>
          <div className="space-y-5">
            <h1 className="text-4xl font-[var(--font-display)] leading-tight text-[color:var(--foreground)] md:text-6xl">
              Convert entire folders of images without losing control of quality.
            </h1>
            <p className="max-w-xl text-lg text-[color:var(--muted)]">
              Format Foundry keeps your images crisp while switching between JPG,
              PNG, WEBP, and more. Upload up to 50 files at once, adjust quality,
              and download a single clean bundle.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-lg)] transition hover:translate-y-[-2px]"
              href="/tool"
            >
              Open the converter
            </Link>
            <Link
              className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)] transition hover:translate-y-[-2px]"
              href="/contact"
            >
              Talk to the team
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Convert up to 50 files",
              "Quality slider control",
              "Download in one zip",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-black/10 bg-white/80 p-4 text-sm text-[color:var(--muted)] shadow-[var(--shadow-sm)] animate-[fade-up_0.8s_ease-out]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-base font-semibold text-[color:var(--foreground)]">
                  {item}
                </p>
                <p className="mt-2">
                  Purpose-built for clean exports and predictable color.
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[var(--shadow-lg)] animate-[fade-up_0.8s_ease-out]" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Quick Preview
            </p>
            <span className="rounded-full bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)]">
              Live
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { title: "Drop images", desc: "Drag a full folder or multi-select." },
              { title: "Pick format", desc: "JPG, PNG, WEBP, or AVIF." },
              { title: "Tune quality", desc: "Use the slider for JPG and WEBP." },
              { title: "Download bundle", desc: "One zip, ready to share." },
            ].map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-4 rounded-2xl border border-black/10 bg-[color:var(--background)] p-4 animate-[fade-up_0.8s_ease-out]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold text-[color:var(--foreground)]">
                    {step.title}
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-[color:var(--foreground)] p-5 text-sm text-white">
            Your images stay private. Files are processed on the server and
            bundled immediately after conversion.
          </div>
        </div>
      </section>
    </div>
  );
}
