import { describe, expect, it } from "vitest";

import {
  appendLine,
  isDiscoverableFor,
  JamTransitionError,
  nextStatus,
} from "@/lib/jam-state";
import type { JamLine } from "@/lib/types";

const first: JamLine = {
  text: "The first line waits",
  authorId: "one",
  authorName: "One",
  wordCount: 4,
  createdAt: new Date(),
};

const second: JamLine = {
  text: "another voice arrives",
  authorId: "two",
  authorName: "Two",
  wordCount: 3,
  createdAt: new Date(),
};

describe("jam state transitions", () => {
  it("maps line count to the next state", () => {
    expect(nextStatus(1)).toBe("open_l2");
    expect(nextStatus(2)).toBe("open_l3");
    expect(nextStatus(3)).toBe("complete");
  });

  it("advances atomically from line two to completion", () => {
    const afterSecond = appendLine(
      {
        status: "open_l2",
        lines: [first],
        lineCount: 1,
        participantIds: ["one"],
      },
      second,
    );
    expect(afterSecond).toMatchObject({
      status: "open_l3",
      lineCount: 2,
      participantIds: ["one", "two"],
    });

    const completed = appendLine(afterSecond, {
      text: "the small poem closes",
      authorId: "three",
      authorName: "Three",
      wordCount: 4,
      createdAt: new Date(),
    });
    expect(completed.status).toBe("complete");
    expect(completed.lines).toHaveLength(3);
  });

  it("prevents one user from writing twice", () => {
    expect(() =>
      appendLine(
        {
          status: "open_l2",
          lines: [first],
          lineCount: 1,
          participantIds: ["one"],
        },
        { ...second, authorId: "one" },
      ),
    ).toThrowError(JamTransitionError);
  });

  it("excludes participated and completed jams from discovery", () => {
    expect(
      isDiscoverableFor({ status: "open_l2", participantIds: ["one"] }, "one"),
    ).toBe(false);
    expect(
      isDiscoverableFor({ status: "open_l3", participantIds: ["one"] }, "two"),
    ).toBe(true);
    expect(
      isDiscoverableFor({ status: "complete", participantIds: [] }, "two"),
    ).toBe(false);
  });
});
