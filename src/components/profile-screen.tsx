"use client";

import { ArrowLeft, Edit3, LogOut, PencilLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { JamCard } from "@/components/jam-card";
import { DEMO_JAMS } from "@/lib/demo-data";
import { getUserJams, updateDisplayName } from "@/lib/firestore";
import type { Jam } from "@/lib/types";

export function ProfileScreen() {
  const { user, configured, signOutUser } = useAuth();
  const [jams, setJams] = useState<Jam[]>(
    configured ? [] : DEMO_JAMS.slice(0, 2),
  );
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (configured && user) {
      getUserJams(user.uid)
        .then(setJams)
        .catch(() => setError("Your poems could not be loaded."));
    }
  }, [configured, user]);

  if (configured && !user) {
    return (
      <div className="screen">
        <div className="state-card">
          <h1>Your shelf is waiting.</h1>
          <p>Sign in to collect the poems you started and joined.</p>
          <Link className="button" href="/welcome">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const visibleDisplayName = editing
    ? displayName
    : user?.displayName || displayName || "Morrow reader";
  const initials = visibleDisplayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="screen">
      <header className="topbar">
        <Link className="icon-button" href="/" aria-label="Back to feed">
          <ArrowLeft aria-hidden="true" size={21} />
        </Link>
        <div className="topbar__title">
          <span className="eyebrow">Profile</span>
          <strong>Your shelf</strong>
        </div>
        {user && (
          <button
            className="icon-button"
            onClick={() => void signOutUser()}
            aria-label="Sign out"
          >
            <LogOut aria-hidden="true" size={20} />
          </button>
        )}
      </header>

      <section className="profile-hero">
        <div className="avatar" aria-hidden="true">
          {initials || "MR"}
        </div>
        <div>
          {editing ? (
            <form
              className="inline-edit"
              onSubmit={async (event) => {
                event.preventDefault();
                if (user) await updateDisplayName(user.uid, displayName);
                setEditing(false);
              }}
            >
              <label htmlFor="display-name">Pen name</label>
              <input
                id="display-name"
                maxLength={40}
                onChange={(event) => setDisplayName(event.target.value)}
                value={displayName}
              />
              <button className="button button--small">Save</button>
            </form>
          ) : (
            <>
              <h1>{visibleDisplayName}</h1>
              <p>@{user?.email?.split("@")[0] || "preview-poet"}</p>
              <button
                className="text-button"
                onClick={() => {
                  setDisplayName(user?.displayName || "Morrow reader");
                  setEditing(true);
                }}
              >
                <Edit3 aria-hidden="true" size={17} />
                Edit pen name
              </button>
            </>
          )}
        </div>
      </section>

      <div className="profile-stats">
        <div>
          <strong>{jams.length}</strong>
          <span>joined</span>
        </div>
        <div>
          <strong>
            {jams.filter((jam) => jam.status === "complete").length}
          </strong>
          <span>completed</span>
        </div>
        <div>
          <strong>
            {jams.filter((jam) => jam.createdBy === user?.uid).length}
          </strong>
          <span>started</span>
        </div>
      </div>

      <section aria-labelledby="profile-jams-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your contributions</p>
            <h2 id="profile-jams-heading">Poems on your shelf</h2>
          </div>
          <Link className="text-button" href="/compose">
            <PencilLine aria-hidden="true" size={18} />
            Start new
          </Link>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {jams.length === 0 ? (
          <div className="state-card">
            <h3>No poems here yet.</h3>
            <p>Write one line and let two strangers surprise you.</p>
            <Link className="button" href="/compose">
              Start a jam
            </Link>
          </div>
        ) : (
          <div className="stack">
            {jams.map((jam) => (
              <JamCard compact jam={jam} key={jam.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
