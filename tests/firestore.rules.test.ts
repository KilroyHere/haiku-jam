import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  doc,
  getDoc,
  runTransaction,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

let environment: RulesTestEnvironment;

const line = (uid: string, text: string) => ({
  text,
  authorId: uid,
  authorName: uid,
  wordCount: text.split(" ").length,
  createdAt: Timestamp.now(),
});

const openJam = {
  status: "open_l2",
  promptId: null,
  promptText: "",
  lines: [line("user-one", "first light waits")],
  lineCount: 1,
  participantIds: ["user-one"],
  createdAt: Timestamp.now(),
  completedAt: null,
  createdBy: "user-one",
};

async function seedJam(id = "race-jam") {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "jams", id), openJam);
  });
}

async function claimExpectedLine(
  database: unknown,
  uid: string,
  expectedStatus: "open_l2" | "open_l3",
) {
  const db = database as Firestore;
  const ref = doc(db, "jams", "race-jam");
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    if (!current || current.status !== expectedStatus) {
      throw new Error("line-already-claimed");
    }
    const nextLine = line(uid, `line from ${uid}`);
    const nextCount = current.lineCount + 1;
    transaction.update(ref, {
      lines: [...current.lines, nextLine],
      participantIds: [...current.participantIds, uid],
      lineCount: nextCount,
      status: nextCount === 2 ? "open_l3" : "complete",
      completedAt: nextCount === 3 ? Timestamp.now() : null,
    });
  });
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "morrow-rules-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: await readFile("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
});

afterAll(async () => {
  await environment.cleanup();
});

describe("Firestore security rules", () => {
  it("allows a user to create only their own constrained profile", async () => {
    const owner = environment.authenticatedContext("profile-owner").firestore();
    await assertSucceeds(
      setDoc(doc(owner, "users", "profile-owner"), {
        uid: "profile-owner",
        handle: "careful-poet",
        displayName: "Careful Poet",
        photoURL: null,
        createdAt: Timestamp.now(),
        banned: false,
      }),
    );
    await assertFails(
      setDoc(doc(owner, "users", "someone-else"), {
        uid: "someone-else",
        handle: "spoofed",
        displayName: "Spoofed",
        photoURL: null,
        createdAt: Timestamp.now(),
        banned: false,
      }),
    );
  });

  it("allows public reads only for completed jams", async () => {
    await seedJam("open");
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "jams", "complete"), {
        ...openJam,
        status: "complete",
        lineCount: 3,
        lines: [
          openJam.lines[0],
          line("user-two", "second line here"),
          line("user-three", "third line closes"),
        ],
        participantIds: ["user-one", "user-two", "user-three"],
        completedAt: Timestamp.now(),
      });
    });
    const anonymous = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonymous, "jams", "open")));
    await assertSucceeds(getDoc(doc(anonymous, "jams", "complete")));
  });

  it("prevents a participant from adding another line", async () => {
    await seedJam();
    const db = environment.authenticatedContext("user-one").firestore();
    await assertFails(claimExpectedLine(db, "user-one", "open_l2"));
  });

  it("accepts only one of two concurrent claims for the same line", async () => {
    await seedJam();
    const second = environment.authenticatedContext("user-two").firestore();
    const third = environment.authenticatedContext("user-three").firestore();
    const results = await Promise.allSettled([
      claimExpectedLine(second, "user-two", "open_l2"),
      claimExpectedLine(third, "user-three", "open_l2"),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);

    await environment.withSecurityRulesDisabled(async (context) => {
      const snapshot = await getDoc(
        doc(context.firestore(), "jams", "race-jam"),
      );
      expect(snapshot.data()).toMatchObject({
        status: "open_l3",
        lineCount: 2,
      });
      expect(snapshot.data()?.lines).toHaveLength(2);
    });
  });

  it("rejects arbitrary jam edits and unauthenticated reports", async () => {
    await seedJam();
    const attacker = environment.authenticatedContext("attacker").firestore();
    await assertFails(
      setDoc(doc(attacker, "jams", "race-jam"), {
        ...openJam,
        status: "complete",
      }),
    );
    const anonymous = environment.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(anonymous, "reports", "race-jam_anon"), {
        targetType: "jam",
        targetId: "race-jam",
        reporterId: "anon",
        reason: "spam",
        createdAt: Timestamp.now(),
      }),
    );
  });
});
