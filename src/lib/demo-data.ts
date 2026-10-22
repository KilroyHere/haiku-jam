import type { DailyPrompt, Jam } from "@/lib/types";

const now = new Date("2026-10-22T12:00:00Z");

export const DAILY_PROMPTS: DailyPrompt[] = [
  {
    id: "small-light",
    text: "A small light",
    date: "2026-10-22",
    active: true,
    sort: 1,
  },
  {
    id: "after-rain",
    text: "After the rain",
    date: "2026-10-23",
    active: true,
    sort: 2,
  },
  {
    id: "almost-home",
    text: "Almost home",
    date: "2026-10-24",
    active: true,
    sort: 3,
  },
  {
    id: "borrowed-time",
    text: "Borrowed time",
    date: "2026-10-25",
    active: true,
    sort: 4,
  },
  {
    id: "window-open",
    text: "The window left open",
    date: "2026-10-26",
    active: true,
    sort: 5,
  },
  {
    id: "quiet-courage",
    text: "Quiet courage",
    date: "2026-10-27",
    active: true,
    sort: 6,
  },
  {
    id: "new-map",
    text: "A map drawn again",
    date: "2026-10-28",
    active: true,
    sort: 7,
  },
];

export const DEMO_JAMS: Jam[] = [
  {
    id: "morning-keeps",
    status: "complete",
    promptId: "small-light",
    promptText: "A small light",
    lines: [
      {
        text: "Morning keeps one gold coin beneath the curtains",
        authorId: "mina",
        authorName: "Mina",
        wordCount: 8,
        createdAt: now,
      },
      {
        text: "I spend it slowly on the dust",
        authorId: "ori",
        authorName: "Ori",
        wordCount: 8,
        createdAt: now,
      },
      {
        text: "and leave the room richer than before",
        authorId: "ada",
        authorName: "Ada",
        wordCount: 7,
        createdAt: now,
      },
    ],
    lineCount: 3,
    participantIds: ["mina", "ori", "ada"],
    createdAt: now,
    completedAt: now,
    createdBy: "mina",
  },
  {
    id: "rain-remembers",
    status: "complete",
    promptId: "after-rain",
    promptText: "After the rain",
    lines: [
      {
        text: "The pavement remembers every cloud",
        authorId: "leo",
        authorName: "Leo",
        wordCount: 6,
        createdAt: now,
      },
      {
        text: "bicycles stitch silver through the evening",
        authorId: "nia",
        authorName: "Nia",
        wordCount: 7,
        createdAt: now,
      },
      {
        text: "while windows learn to glow",
        authorId: "sam",
        authorName: "Sam",
        wordCount: 5,
        createdAt: now,
      },
    ],
    lineCount: 3,
    participantIds: ["leo", "nia", "sam"],
    createdAt: now,
    completedAt: now,
    createdBy: "leo",
  },
  {
    id: "open-kettle",
    status: "open_l2",
    promptId: "almost-home",
    promptText: "Almost home",
    lines: [
      {
        text: "The kettle calls from two rooms away",
        authorId: "rue",
        authorName: "Rue",
        wordCount: 8,
        createdAt: now,
      },
    ],
    lineCount: 1,
    participantIds: ["rue"],
    createdAt: now,
    completedAt: null,
    createdBy: "rue",
  },
];
