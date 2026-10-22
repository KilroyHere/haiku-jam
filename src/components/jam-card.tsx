"use client";

import { Flag, Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

import type { Jam } from "@/lib/types";

type JamCardProps = {
  jam: Jam;
  compact?: boolean;
  onLike?: () => void;
  liked?: boolean;
  onReport?: () => void;
};

export function JamCard({
  jam,
  compact = false,
  onLike,
  liked,
  onReport,
}: JamCardProps) {
  const share = async () => {
    const url = `${window.location.origin}/jam/${jam.id}`;
    if (navigator.share) {
      await navigator.share({ title: "A poem from Morrow", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <article className="jam-card" data-compact={compact || undefined}>
      {jam.promptText && <p className="eyebrow">Prompt · {jam.promptText}</p>}
      <Link
        href={`/jam/${jam.id}`}
        className="jam-card__poem"
        aria-label="Open poem"
      >
        {jam.lines.map((line, index) => (
          <div className="poem-line" key={`${line.authorId}-${index}`}>
            <p>{line.text}</p>
            <span>— {line.authorName}</span>
          </div>
        ))}
        {jam.status !== "complete" &&
          Array.from({ length: 3 - jam.lines.length }).map((_, index) => (
            <div
              className="poem-line poem-line--waiting"
              key={`waiting-${index}`}
            >
              <p>
                {index === 0
                  ? "A line is waiting for you…"
                  : "One more voice will follow."}
              </p>
            </div>
          ))}
      </Link>
      {jam.status === "complete" && !compact && (
        <div className="jam-card__actions" aria-label="Poem actions">
          {onLike && (
            <button
              className="text-button"
              data-active={liked || undefined}
              onClick={onLike}
              type="button"
              aria-pressed={liked}
            >
              <Heart
                aria-hidden="true"
                size={18}
                fill={liked ? "currentColor" : "none"}
              />
              {liked ? "Liked" : "Like"}
            </button>
          )}
          <Link className="text-button" href={`/jam/${jam.id}#comments`}>
            <MessageCircle aria-hidden="true" size={18} />
            Comment
          </Link>
          <button className="text-button" onClick={share} type="button">
            <Share2 aria-hidden="true" size={18} />
            Share
          </button>
          {onReport && (
            <button
              className="text-button text-button--danger"
              onClick={onReport}
              type="button"
            >
              <Flag aria-hidden="true" size={18} />
              Report
            </button>
          )}
        </div>
      )}
    </article>
  );
}
