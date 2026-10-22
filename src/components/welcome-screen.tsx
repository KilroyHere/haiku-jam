"use client";

import { ArrowRight, Feather, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth-provider";

export function WelcomeScreen() {
  const router = useRouter();
  const { configured, signInWithGoogle, signInWithEmail, createAccount } =
    useAuth();
  const [mode, setMode] = useState<"sign-in" | "create">("create");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pledged, setPledged] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = () => router.push("/deck");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!configured) {
      setError("Firebase Authentication has not been connected yet.");
      return;
    }
    if (mode === "create" && !pledged) {
      setError("Please accept the community pledge.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "create") await createAccount(email, password, displayName);
      else await signInWithEmail(email, password);
      finish();
    } catch (caught) {
      setError(
        process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
          caught instanceof Error
          ? caught.message
          : "We couldn’t complete that sign-in. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!configured) {
      setError("Firebase Authentication has not been connected yet.");
      return;
    }
    setBusy(true);
    try {
      await signInWithGoogle();
      finish();
    } catch {
      setError("Google sign-in was closed or could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="welcome">
      <section className="welcome__story">
        <div className="brand-mark">
          <Feather aria-hidden="true" />
        </div>
        <p className="eyebrow">A poem passed hand to hand</p>
        <h1>One line from you. Two from strangers.</h1>
        <p>
          Morrow is a quiet place to begin, continue, and complete tiny poems
          together.
        </p>
        <div className="line-motif" aria-hidden="true">
          <span>01</span>
          <i />
          <span>02</span>
          <i />
          <span>03</span>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="auth-heading">
        <div>
          <p className="eyebrow">
            {mode === "create" ? "Join the commons" : "Welcome back"}
          </p>
          <h2 id="auth-heading">
            {mode === "create"
              ? "Make a little room for wonder."
              : "Find your unfinished lines."}
          </h2>
        </div>
        <button
          className="button button--google"
          onClick={() => void google()}
          disabled={busy}
        >
          <span aria-hidden="true">G</span>
          Continue with Google
        </button>
        <div className="auth-divider">
          <span>or with email</span>
        </div>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {mode === "create" && (
            <label>
              Pen name
              <input
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
            </label>
          )}
          <label>
            Email
            <span className="input-with-icon">
              <Mail aria-hidden="true" size={17} />
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </span>
          </label>
          <label>
            Password
            <input
              autoComplete={
                mode === "create" ? "new-password" : "current-password"
              }
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {mode === "create" && (
            <label className="pledge">
              <input
                checked={pledged}
                onChange={(event) => setPledged(event.target.checked)}
                type="checkbox"
              />
              <span>
                I’ll write with care, make space for others, and report harm
                when I see it.
              </span>
            </label>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy} type="submit">
            {busy
              ? "One moment…"
              : mode === "create"
                ? "Create my profile"
                : "Sign in"}
            {!busy && <ArrowRight aria-hidden="true" size={18} />}
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => {
            setMode((current) => (current === "create" ? "sign-in" : "create"));
            setError("");
          }}
          type="button"
        >
          {mode === "create"
            ? "Already have a profile? Sign in"
            : "New here? Create a profile"}
        </button>
      </section>
    </div>
  );
}
