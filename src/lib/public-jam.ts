import "server-only";

import type { Jam, JamLine, JamStatus } from "@/lib/types";

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

function string(value?: FirestoreValue): string {
  return value?.stringValue ?? "";
}

function integer(value?: FirestoreValue): number {
  return Number(value?.integerValue ?? 0);
}

function timestamp(value?: FirestoreValue): Date | null {
  return value?.timestampValue ? new Date(value.timestampValue) : null;
}

function strings(value?: FirestoreValue): string[] {
  return value?.arrayValue?.values?.map(string) ?? [];
}

function lines(value?: FirestoreValue): JamLine[] {
  return (
    value?.arrayValue?.values?.map((item) => {
      const fields = item.mapValue?.fields ?? {};
      return {
        text: string(fields.text),
        authorId: string(fields.authorId),
        authorName: string(fields.authorName),
        wordCount: integer(fields.wordCount),
        createdAt: timestamp(fields.createdAt) ?? new Date(0),
      };
    }) ?? []
  );
}

export async function getPublicJam(jamId: string): Promise<Jam | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/jams/${encodeURIComponent(jamId)}`,
    { next: { revalidate: 60 } },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    fields?: Record<string, FirestoreValue>;
  };
  const fields = body.fields ?? {};
  if (string(fields.status) !== "complete") return null;
  return {
    id: jamId,
    status: string(fields.status) as JamStatus,
    promptId:
      fields.promptId?.nullValue === null ? null : string(fields.promptId),
    promptText: string(fields.promptText),
    lines: lines(fields.lines),
    lineCount: integer(fields.lineCount),
    participantIds: strings(fields.participantIds),
    createdAt: timestamp(fields.createdAt) ?? new Date(0),
    completedAt: timestamp(fields.completedAt),
    createdBy: string(fields.createdBy),
  };
}
