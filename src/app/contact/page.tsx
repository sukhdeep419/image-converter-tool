"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/lib/authContext";
import { submitContactForm } from "@/lib/contact";

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
  const { user } = useAuth();

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
      const { error } = await submitContactForm(
        form.name,
        form.email,
        form.message,
        form.website
      );

      if (error) {
        throw new Error(error.message);
      }

      setForm(initialForm);
      setStatus("sent");
      setNotice("Thanks! Your message has been saved and we'll get back to you soon.");
      setTimeout(() => setStatus("idle"), 3000);
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
      : "text-muted";

  return (
    <div className="contact-grid grid gap-10">
      <section className="space-y-6">
        <div>
          <p className="eyebrow-label text-xs text-muted">
            Contact
          </p>
          <h1 className="mt-3 text-3xl font-display text-foreground md:text-4xl">
            Tell us about your workflow.
          </h1>
          <p className="mt-3 text-base text-muted">
            Share what you need from the converter, and we can help you tune
            settings or plan custom exports. Messages go straight to our inbox.
          </p>
          {user && (
            <p className="mt-2 text-sm text-accent">
              Logged in as {user.email}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-formit-lg"
        >
          <div>
            <label className="text-sm font-semibold text-foreground">
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
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">
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
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-foreground"
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
            className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white shadow-formit-sm disabled:cursor-not-allowed disabled:opacity-70"
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
          <h2 className="text-lg font-semibold text-foreground">
            How we can help
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>Format recommendations for photography or UI assets.</li>
            <li>Guidance on quality settings for faster load times.</li>
            <li>Notes on handling large batches or automation.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-black/10 bg-foreground p-6 text-sm text-white">
          Typical response time: within 1 business day.
        </div>
      </aside>
    </div>
  );
}

