"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { DAILY_PROMPTS, DEMO_JAMS } from "@/lib/demo-data";
import { claimNextLine, getJam, startJam } from "@/lib/firestore";
import type { Jam } from "@/lib/types";
import {
  countWords,
  MAX_LINE_WORDS,
  validatePoetryLine,
} from "@/lib/validation";

export function ComposeScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const jamId = params.get("jam");
  const promptId = params.get("prompt");
  const { user, configured } = useAuth();
  const [jam, setJam] = useState<Jam | null>(
    jamId && !configured
      ? (DEMO_JAMS.find((item) => item.id === jamId) ?? null)
      : null,
  );
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedPrompt = useMemo(
    () =>
      DAILY_PROMPTS.find((prompt) => prompt.id === promptId) ??
      DAILY_PROMPTS[0],
    [promptId],
  );
  const words = countWords(text);

  useEffect(() => {
    if (!jamId || !configured) return;
    getJam(jamId)
      .then(setJam)
      .catch(() => setError("This jam could not be opened."));
  }, [configured, jamId]);

  const submit = async () => {
    const validation = validatePoetryLine(text);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (!configured) {
      setError("Firebase must be connected before a line can be published.");
      return;
    }
    if (!user) {
      router.push("/welcome");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const identity = {
        uid: user.uid,
        displayName: user.displayName || "A poet",
      };
      if (jamId) {
        if (jam?.status !== "open_l2" && jam?.status !== "open_l3") {
          throw new Error("That line is no longer available.");
        }
        const updated = await claimNextLine(
          jamId,
          identity,
          validation.value,
          jam.status,
        );
        router.push(`/jam/${updated.id}`);
      } else {
        const createdId = await startJam(identity, validation.value, {
          id: selectedPrompt.id,
          text: selectedPrompt.text,
        });
        router.push(`/jam/${createdId}`);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The line could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen screen--compose">
      <header className="topbar">
        <Link
          className="icon-button"
          href={jamId ? "/deck" : "/"}
          aria-label="Go back"
        >
          <ArrowLeft aria-hidden="true" size={21} />
        </Link>
        <div className="topbar__title">
          <span className="eyebrow">
            {jamId ? `Line ${(jam?.lineCount ?? 1) + 1} of 3` : "New jam"}
          </span>
          <strong>{jamId ? "Carry it forward" : "Begin a thread"}</strong>
        </div>
        <span
          className="word-count"
          data-over={words > MAX_LINE_WORDS || undefined}
        >
          {words}/{MAX_LINE_WORDS}
        </span>
      </header>

      <div className="compose-prompt">
        <Sparkles aria-hidden="true" size={17} />
        <span>{jam?.promptText || selectedPrompt.text}</span>
      </div>

      {jam?.lines.map((line, index) => (
        <div className="context-line" key={`${line.authorId}-${index}`}>
          <span>Line {index + 1}</span>
          <blockquote>{line.text}</blockquote>
          <cite>— {line.authorName}</cite>
        </div>
      ))}

      <div className="compose-field">
        <label htmlFor="poetry-line">
          {jamId ? "Your line" : "First line"}
          <span>Make room for the next voice.</span>
        </label>
        <textarea
          id="poetry-line"
          autoFocus
          maxLength={180}
          onChange={(event) => {
            setText(event.target.value);
            setError("");
          }}
          placeholder={jamId ? "What happens next?" : "A door opens somewhere…"}
          rows={4}
          value={text}
          aria-describedby="line-guidance line-error"
        />
        <p id="line-guidance" className="field-help">
          Maximum {MAX_LINE_WORDS} words. No strict syllable count—rhythm
          belongs to you.
        </p>
        {error && (
          <p id="line-error" className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="compose-footer">
        <p>
          <Check aria-hidden="true" size={16} />
          Community pledge applies
        </p>
        <button
          className="button"
          disabled={submitting || words === 0 || words > MAX_LINE_WORDS}
          onClick={() => void submit()}
          type="button"
        >
          {submitting
            ? "Publishing…"
            : jamId
              ? "Add my line"
              : "Start this jam"}
          {!submitting && <ArrowRight aria-hidden="true" size={18} />}
        </button>
      </div>
    </div>
  );
}
