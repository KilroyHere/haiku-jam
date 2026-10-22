"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { getFirebaseServices } from "@/lib/firebase";
import {
  appendLine,
  isDiscoverableFor,
  JamTransitionError,
} from "@/lib/jam-state";
import type { Jam, JamComment, JamStatus, PublicProfile } from "@/lib/types";
import { validateComment, validatePoetryLine } from "@/lib/validation";

type PoetIdentity = { uid: string; displayName: string };

function fromJamDoc(id: string, data: Record<string, unknown>): Jam {
  return { id, ...(data as Omit<Jam, "id">) };
}

export async function ensureProfile(profile: PublicProfile): Promise<void> {
  const { db } = getFirebaseServices();
  const ref = doc(db, "users", profile.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) await setDoc(ref, profile);
}

export async function startJam(
  poet: PoetIdentity,
  text: string,
  prompt: { id: string; text: string } | null,
): Promise<string> {
  const validation = validatePoetryLine(text);
  if (!validation.ok) throw new Error(validation.message);
  const { db } = getFirebaseServices();
  const now = Timestamp.now();
  const created = await addDoc(collection(db, "jams"), {
    status: "open_l2",
    promptId: prompt?.id ?? null,
    promptText: prompt?.text ?? "",
    lines: [
      {
        text: validation.value,
        authorId: poet.uid,
        authorName: poet.displayName,
        wordCount: validation.wordCount,
        createdAt: now,
      },
    ],
    lineCount: 1,
    participantIds: [poet.uid],
    createdAt: now,
    completedAt: null,
    createdBy: poet.uid,
  });
  return created.id;
}

export async function claimNextLine(
  jamId: string,
  poet: PoetIdentity,
  text: string,
  expectedStatus: Extract<JamStatus, "open_l2" | "open_l3">,
): Promise<Jam> {
  const validation = validatePoetryLine(text);
  if (!validation.ok) throw new Error(validation.message);
  const { db } = getFirebaseServices();
  const ref = doc(db, "jams", jamId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error("That jam no longer exists.");
    const jam = fromJamDoc(snapshot.id, snapshot.data());
    if (jam.status !== expectedStatus) {
      throw new JamTransitionError(
        "Another poet claimed this line first. Choose a new jam.",
        "invalid-state",
      );
    }
    const now = Timestamp.now();
    const transition = appendLine(jam, {
      text: validation.value,
      authorId: poet.uid,
      authorName: poet.displayName,
      wordCount: validation.wordCount,
      createdAt: now,
    });
    const completedAt = transition.status === "complete" ? now : null;
    transaction.update(ref, { ...transition, completedAt });
    return { ...jam, ...transition, completedAt };
  });
}

export async function getDiscoveryDeck(uid: string): Promise<Jam[]> {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, "jams"),
      where("status", "in", ["open_l2", "open_l3"]),
      orderBy("createdAt", "desc"),
      limit(24),
    ),
  );
  return snapshot.docs
    .map((item) => fromJamDoc(item.id, item.data()))
    .filter((jam) => isDiscoverableFor(jam, uid));
}

export async function getCompletedFeed(uid?: string): Promise<Jam[]> {
  const { db } = getFirebaseServices();
  const [jamsSnapshot, reportsSnapshot] = await Promise.all([
    getDocs(
      query(
        collection(db, "jams"),
        where("status", "==", "complete"),
        orderBy("completedAt", "desc"),
        limit(30),
      ),
    ),
    uid
      ? getDocs(
          query(
            collection(db, "reports"),
            where("reporterId", "==", uid),
            where("targetType", "==", "jam"),
            limit(100),
          ),
        )
      : Promise.resolve(null),
  ]);
  const hidden = new Set(
    reportsSnapshot?.docs.map((item) => item.data().targetId as string),
  );
  return jamsSnapshot.docs
    .filter((item) => !hidden.has(item.id))
    .map((item) => fromJamDoc(item.id, item.data()));
}

export async function getUserJams(uid: string): Promise<Jam[]> {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, "jams"),
      where("participantIds", "array-contains", uid),
      orderBy("createdAt", "desc"),
      limit(30),
    ),
  );
  return snapshot.docs.map((item) => fromJamDoc(item.id, item.data()));
}

export async function getJam(jamId: string): Promise<Jam | null> {
  const { db } = getFirebaseServices();
  const snapshot = await getDoc(doc(db, "jams", jamId));
  return snapshot.exists() ? fromJamDoc(snapshot.id, snapshot.data()) : null;
}

export async function toggleLike(jamId: string, uid: string): Promise<boolean> {
  const { db } = getFirebaseServices();
  const ref = doc(db, "likes", `${jamId}_${uid}`);
  const current = await getDoc(ref);
  if (current.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { jamId, userId: uid, createdAt: serverTimestamp() });
  return true;
}

export async function addComment(
  jamId: string,
  poet: PoetIdentity,
  text: string,
): Promise<string> {
  const validation = validateComment(text);
  if (!validation.ok) throw new Error(validation.message);
  const { db } = getFirebaseServices();
  const created = await addDoc(collection(db, "comments"), {
    jamId,
    authorId: poet.uid,
    authorName: poet.displayName,
    text: validation.value,
    createdAt: serverTimestamp(),
  });
  return created.id;
}

export async function getComments(jamId: string): Promise<JamComment[]> {
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, "comments"),
      where("jamId", "==", jamId),
      orderBy("createdAt", "asc"),
      limit(100),
    ),
  );
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<JamComment, "id">),
  }));
}

export async function reportJam(
  jamId: string,
  reporterId: string,
  reason: string,
): Promise<void> {
  const { db } = getFirebaseServices();
  await setDoc(doc(db, "reports", `${jamId}_${reporterId}`), {
    targetType: "jam",
    targetId: jamId,
    reporterId,
    reason,
    createdAt: serverTimestamp(),
  });
}

export async function updateDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  const { db } = getFirebaseServices();
  await updateDoc(doc(db, "users", uid), { displayName: displayName.trim() });
}
