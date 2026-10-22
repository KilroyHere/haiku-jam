"use client";

import { ArrowLeft, ArrowRight, Shuffle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { JamCard } from "@/components/jam-card";
import { DEMO_JAMS } from "@/lib/demo-data";
import { getDiscoveryDeck } from "@/lib/firestore";
import type { Jam } from "@/lib/types";

export function DeckScreen() {
  const { user, configured, loading: authLoading } = useAuth();
  const [jams, setJams] = useState<Jam[]>(
    configured ? [] : DEMO_JAMS.filter((j) => j.status !== "complete"),
  );
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured || !user) return;
    getDiscoveryDeck(user.uid)
      .then(setJams)
      .catch(() => setError("The open jams are out of reach right now."))
      .finally(() => setLoading(false));
  }, [configured, user]);

  const current = jams[index];

  return (
    <div className="screen screen--deck">
      <header className="topbar">
        <Link className="icon-button" href="/" aria-label="Back to feed">
          <ArrowLeft aria-hidden="true" size={21} />
        </Link>
        <div className="topbar__title">
          <span className="eyebrow">Open jams</span>
          <strong>Choose a thread</strong>
        </div>
        <span
          className="deck-count"
          aria-label={`${jams.length} jams available`}
        >
          {jams.length}
        </span>
      </header>

      {authLoading || (Boolean(user) && loading) ? (
        <div
          className="deck-stage"
          aria-busy="true"
          aria-label="Loading an open jam"
        >
          <div className="skeleton skeleton--deck" />
        </div>
      ) : error ? (
        <div className="state-card state-card--error" role="alert">
          <h1>The deck slipped away.</h1>
          <p>{error}</p>
          <button className="button" onClick={() => location.reload()}>
            Try again
          </button>
        </div>
      ) : configured && !user ? (
        <div className="state-card">
          <h1>Bring your own voice.</h1>
          <p>Sign in before adding a line. Reading always stays public.</p>
          <Link className="button" href="/welcome">
            Sign in to continue
          </Link>
        </div>
      ) : !current ? (
        <div className="state-card">
          <h1>You’ve met every open poem.</h1>
          <p>Begin something new while the other jams find their next voice.</p>
          <Link className="button" href="/compose">
            Start a fresh jam
          </Link>
        </div>
      ) : (
        <>
          <div className="deck-stage">
            <span className="deck-card deck-card--back" aria-hidden="true" />
            <JamCard jam={current} compact />
          </div>
          <div className="deck-actions">
            <button
              className="button button--secondary"
              onClick={() =>
                setIndex((value) => Math.min(value + 1, jams.length))
              }
              type="button"
            >
              <Shuffle aria-hidden="true" size={18} />
              Skip
            </button>
            <Link className="button" href={`/compose?jam=${current.id}`}>
              Add line {current.lineCount + 1}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
          <p className="deck-helper">
            You’ll only see jams you haven’t joined. Each poet gets one line.
          </p>
        </>
      )}
    </div>
  );
}
