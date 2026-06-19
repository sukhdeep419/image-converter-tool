"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { signUp, signIn, user } = useAuth();
  const router = useRouter();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            You&apos;re logged in!
          </h2>
          <p className="text-muted mb-6">
            Welcome, {user.email}
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccess("Account created! Check your email to confirm.");
          setTimeout(() => router.push("/"), 2000);
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else {
          setSuccess("Logged in successfully!");
          setTimeout(() => router.push("/"), 2000);
        }
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="rounded-3xl border border-black/10 bg-white/90 p-8 shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-foreground"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="text-sm font-semibold text-foreground">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="********"
                className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-foreground"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-formit-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
              className="font-semibold text-accent transition hover:text-accent underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-muted transition hover:text-foreground"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
