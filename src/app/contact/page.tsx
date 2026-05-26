"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

type FormStatus = "idle" | "sending" | "sent" | "error";

const initialForm = {
  name: "",
  email: "",
  message: "",
  website: "",
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [notice, setNotice] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setNotice("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to send message.");
      }

      setForm(initialForm);
      setStatus("sent");
      setNotice("Thanks! Your message has been sent.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setStatus("error");
      setNotice(message);
    }
  };

  const noticeClass =
    status === "sent"
      ? "text-emerald-600"
      : status === "error"
      ? "text-red-600"
      : "text-[color:var(--muted)]";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-[var(--font-display)] text-[color:var(--foreground)] md:text-4xl">
            Tell us about your workflow.
          </h1>
          <p className="mt-3 text-base text-[color:var(--muted)]">
            Share what you need from the converter, and we can help you tune
            settings or plan custom exports. Messages go straight to our inbox.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[var(--shadow-lg)]"
        >
          <div>
            <label className="text-sm font-semibold text-[color:var(--foreground)]">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              required
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[color:var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[color:var(--foreground)]">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[color:var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[color:var(--foreground)]">
              What do you need?
            </label>
            <textarea
              rows={4}
              name="message"
              value={form.message}
              onChange={handleChange}
              minLength={10}
              required
              placeholder="Tell us about your image conversion needs."
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[color:var(--foreground)]"
            />
          </div>
          <label className="sr-only" aria-hidden="true">
            Website
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
          {notice ? (
            <p className={`text-sm ${noticeClass}`} aria-live="polite">
              {notice}
            </p>
          ) : null}
        </form>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            How we can help
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
            <li>Format recommendations for photography or UI assets.</li>
            <li>Guidance on quality settings for faster load times.</li>
            <li>Notes on handling large batches or automation.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-black/10 bg-[color:var(--foreground)] p-6 text-sm text-white">
          Typical response time: within 1 business day.
        </div>
      </aside>
    </div>
  );
}
