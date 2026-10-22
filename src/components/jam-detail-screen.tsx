"use client";

import { ArrowLeft, Flag, Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth-provider";
import { DEMO_JAMS } from "@/lib/demo-data";
import {
  addComment,
  getComments,
  getJam,
  reportJam,
  toggleLike,
} from "@/lib/firestore";
import type { Jam, JamComment } from "@/lib/types";

export function JamDetailScreen({
  jamId,
  initialJam,
}: {
  jamId: string;
  initialJam?: Jam | null;
}) {
  const router = useRouter();
  const { user, configured } = useAuth();
  const [jam, setJam] = useState<Jam | null>(
    initialJam ??
      (!configured
        ? (DEMO_JAMS.find((item) => item.id === jamId) ?? DEMO_JAMS[0])
        : null),
  );
  const [comments, setComments] = useState<JamComment[]>([]);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState("");
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!configured) return;
    if (!initialJam)
      getJam(jamId)
        .then(setJam)
        .catch(() => setError("This poem could not be loaded."));
    if (jam?.status === "complete") {
      getComments(jamId)
        .then(setComments)
        .catch(() => undefined);
    }
  }, [configured, initialJam, jam?.status, jamId]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share)
      await navigator.share({ title: "A poem from Morrow", url });
    else await navigator.clipboard.writeText(url);
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      router.push("/welcome");
      return;
    }
    try {
      await addComment(
        jamId,
        { uid: user.uid, displayName: user.displayName || "A poet" },
        comment,
      );
      setComment("");
      setComments(await getComments(jamId));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The comment could not be saved.",
      );
    }
  };

  if (reported) {
    return (
      <div className="screen">
        <div className="state-card">
          <h1>Poem hidden.</h1>
          <p>
            Thanks for looking out for the community. A moderator can review
            your report.
          </p>
          <Link className="button" href="/">
            Return to the feed
          </Link>
        </div>
      </div>
    );
  }

  if (!jam) {
    return (
      <div className="screen">
        <div className="state-card state-card--error" role="alert">
          <h1>This poem isn’t here.</h1>
          <p>
            {error || "It may have been removed or the link may be incomplete."}
          </p>
          <Link className="button" href="/">
            Browse recent poems
          </Link>
        </div>
      </div>
    );
  }

  const mayContinue =
    jam.status !== "complete" && user && !jam.participantIds.includes(user.uid);

  return (
    <div className="screen screen--detail">
      <header className="topbar">
        <Link className="icon-button" href="/" aria-label="Back to feed">
          <ArrowLeft aria-hidden="true" size={21} />
        </Link>
        <div className="topbar__title">
          <span className="eyebrow">
            {jam.status === "complete" ? "Completed poem" : "Open jam"}
          </span>
          <strong>{jam.promptText || "An unprompted thread"}</strong>
        </div>
        <button
          className="icon-button"
          onClick={() => void share()}
          aria-label="Share poem"
        >
          <Share2 aria-hidden="true" size={20} />
        </button>
      </header>

      <article className="completed-poem">
        <p className="eyebrow">Three voices · Morrow</p>
        <div className="completed-poem__lines">
          {jam.lines.map((line, index) => (
            <div key={`${line.authorId}-${index}`}>
              <span>0{index + 1}</span>
              <p>{line.text}</p>
              <cite>— {line.authorName}</cite>
            </div>
          ))}
          {jam.status !== "complete" && (
            <div className="completed-poem__waiting">
              <span>0{jam.lineCount + 1}</span>
              <p>The next line is still unwritten.</p>
            </div>
          )}
        </div>
        {mayContinue && (
          <Link className="button" href={`/compose?jam=${jam.id}`}>
            Add line {jam.lineCount + 1}
          </Link>
        )}
      </article>

      {jam.status === "complete" && (
        <>
          <div className="detail-actions">
            <button
              className="text-button"
              data-active={liked || undefined}
              onClick={async () => {
                if (!user) {
                  router.push("/welcome");
                  return;
                }
                setLiked(await toggleLike(jam.id, user.uid));
              }}
              aria-pressed={liked}
            >
              <Heart
                aria-hidden="true"
                size={19}
                fill={liked ? "currentColor" : "none"}
              />
              {liked ? "Liked" : "Like"}
            </button>
            <a className="text-button" href="#comments">
              <MessageCircle aria-hidden="true" size={19} />
              {comments.length} comments
            </a>
            <button
              className="text-button text-button--danger"
              onClick={async () => {
                if (!user) {
                  router.push("/welcome");
                  return;
                }
                if (!confirm("Hide this poem and report it for review?"))
                  return;
                await reportJam(jam.id, user.uid, "community-guidelines");
                setReported(true);
              }}
            >
              <Flag aria-hidden="true" size={19} />
              Report
            </button>
          </div>

          <section
            className="comments"
            id="comments"
            aria-labelledby="comments-heading"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">The margin</p>
                <h2 id="comments-heading">Responses</h2>
              </div>
            </div>
            {comments.length === 0 ? (
              <p className="empty-inline">No notes yet. Leave the first one.</p>
            ) : (
              <ul className="comment-list">
                {comments.map((item) => (
                  <li key={item.id}>
                    <strong>{item.authorName}</strong>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="comment-form"
              onSubmit={(event) => void submitComment(event)}
            >
              <label htmlFor="comment">Add a thoughtful note</label>
              <div>
                <input
                  id="comment"
                  maxLength={500}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What stayed with you?"
                  value={comment}
                />
                <button
                  className="button button--small"
                  disabled={!comment.trim()}
                >
                  Post
                </button>
              </div>
            </form>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
