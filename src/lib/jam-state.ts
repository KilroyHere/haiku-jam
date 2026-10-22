import type { Jam, JamLine, JamStatus } from "@/lib/types";

export class JamTransitionError extends Error {
  constructor(
    message: string,
    public readonly code:
      "already-participated" | "not-open" | "invalid-state" | "invalid-line",
  ) {
    super(message);
    this.name = "JamTransitionError";
  }
}

export function nextStatus(lineCount: number): JamStatus {
  if (lineCount === 1) return "open_l2";
  if (lineCount === 2) return "open_l3";
  if (lineCount === 3) return "complete";
  throw new JamTransitionError(
    "A jam must contain one to three lines.",
    "invalid-state",
  );
}

export function appendLine(
  jam: Pick<Jam, "status" | "lines" | "lineCount" | "participantIds">,
  line: JamLine,
): Pick<Jam, "status" | "lines" | "lineCount" | "participantIds"> {
  if (jam.status === "complete" || jam.status === "flagged") {
    throw new JamTransitionError("This jam is no longer open.", "not-open");
  }
  if (jam.participantIds.includes(line.authorId)) {
    throw new JamTransitionError(
      "Each poet may add only one line to a jam.",
      "already-participated",
    );
  }
  if (
    jam.lineCount !== jam.lines.length ||
    jam.lineCount < 1 ||
    jam.lineCount > 2
  ) {
    throw new JamTransitionError(
      "The jam state is inconsistent.",
      "invalid-state",
    );
  }
  const expectedStatus = nextStatus(jam.lineCount);
  if (jam.status !== expectedStatus) {
    throw new JamTransitionError(
      "The next line is not available.",
      "invalid-state",
    );
  }
  if (!line.text || line.wordCount < 1 || line.wordCount > 17) {
    throw new JamTransitionError("The line is invalid.", "invalid-line");
  }

  const lineCount = jam.lineCount + 1;
  return {
    lines: [...jam.lines, line],
    participantIds: [...jam.participantIds, line.authorId],
    lineCount,
    status: nextStatus(lineCount),
  };
}

export function isDiscoverableFor(
  jam: Pick<Jam, "status" | "participantIds">,
  uid: string,
): boolean {
  return (
    (jam.status === "open_l2" || jam.status === "open_l3") &&
    !jam.participantIds.includes(uid)
  );
}
