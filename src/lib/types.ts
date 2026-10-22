import type { Timestamp } from "firebase/firestore";

export type JamStatus = "open_l2" | "open_l3" | "complete" | "flagged";

export type JamLine = {
  text: string;
  authorId: string;
  authorName: string;
  wordCount: number;
  createdAt: Timestamp | Date;
};

export type Jam = {
  id: string;
  status: JamStatus;
  promptId: string | null;
  promptText: string;
  lines: JamLine[];
  lineCount: number;
  participantIds: string[];
  createdAt: Timestamp | Date;
  completedAt: Timestamp | Date | null;
  createdBy: string;
};

export type PublicProfile = {
  uid: string;
  handle: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp | Date;
  banned: boolean;
};

export type DailyPrompt = {
  id: string;
  text: string;
  date: string;
  active: boolean;
  sort: number;
};

export type JamComment = {
  id: string;
  jamId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp | Date;
};
