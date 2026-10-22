"use client";

import { Feather, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { JamCard } from "@/components/jam-card";
import { DAILY_PROMPTS, DEMO_JAMS } from "@/lib/demo-data";
import { getCompletedFeed, reportJam, toggleLike } from "@/lib/firestore";
import type { Jam } from "@/lib/types";

export function FeedScreen() {
  const router = useRouter();
  const { user, configured } = useAuth();
  const [jams, setJams] = useState<Jam[]>(
    configured ? [] : DEMO_JAMS.slice(0, 2),
  );
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!configured) return;
    let active = true;
    getCompletedFeed(user?.uid)
      .then((next) => {
        if (active) setJams(next);
      })
      .catch(() => {
        if (active)
          setError("The poems could not be gathered. Try again in a moment.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [configured, user?.uid]);

  const like = async (jamId: string) => {
    if (!user) {
      router.push("/welcome");
      return;
    }
    const active = await toggleLike(jamId, user.uid);
    setLiked((current) => {
      const next = new Set(current);
      if (active) next.add(jamId);
      else next.delete(jamId);
      return next;
    });
  };

  const report = async (jamId: string) => {
    if (!user) {
      router.push("/welcome");
      return;
    }
    if (!window.confirm("Hide this poem and send it to the moderation queue?"))
      return;
    await reportJam(jamId, user.uid, "community-guidelines");
    setJams((current) => current.filter((jam) => jam.id !== jamId));
  };

  return (
    <div className="screen">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Morrow home">
          <Feather aria-hidden="true" size={23} />
          morrow
        </Link>
        <Link
          className="icon-button"
          href="/profile"
          aria-label="Profile and settings"
        >
          <Settings2 aria-hidden="true" size={20} />
        </Link>
      </header>

      <section className="hero">
        <p className="eyebrow">Three voices · one small poem</p>
        <h1>Leave a line for someone you haven’t met.</h1>
        <p>
          Begin a thought, or carry another poet’s words somewhere unexpected.
        </p>
        <Link className="button" href="/deck">
          Find an open jam
        </Link>
      </section>

      <section aria-labelledby="prompt-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Today’s invitations</p>
            <h2 id="prompt-heading">Start with a spark</h2>
          </div>
        </div>
        <div className="prompt-row">
          {DAILY_PROMPTS.slice(0, 4).map((prompt, index) => (
            <Link
              className="prompt-chip"
              data-tone={index % 3}
              href={`/compose?prompt=${prompt.id}`}
              key={prompt.id}
            >
              <span>0{index + 1}</span>
              {prompt.text}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Just completed</p>
            <h2 id="recent-heading">Poems from the commons</h2>
          </div>
        </div>
        {loading && (
          <div
            className="stack"
            aria-label="Loading poems"
            aria-busy="true"
            role="status"
          >
            <div className="skeleton skeleton--card" />
            <div className="skeleton skeleton--card" />
          </div>
        )}
        {error && (
          <div className="state-card state-card--error" role="alert">
            <h3>The page lost its place.</h3>
            <p>{error}</p>
            <button
              className="button button--secondary"
              onClick={() => location.reload()}
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && jams.length === 0 && (
          <div className="state-card">
            <h3>The page is still blank.</h3>
            <p>Start a jam now. Two other poets can help finish it.</p>
            <Link className="button" href="/compose">
              Write the first line
            </Link>
          </div>
        )}
        <div className="stack">
          {jams.map((jam) => (
            <JamCard
              jam={jam}
              key={jam.id}
              liked={liked.has(jam.id)}
              onLike={() => void like(jam.id)}
              onReport={() => void report(jam.id)}
            />
          ))}
        </div>
      </section>
      {!configured && (
        <p className="demo-note" role="note">
          Preview mode · Connect Firebase to make writing and reactions live.
        </p>
      )}
    </div>
  );
}
