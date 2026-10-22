# Morrow

Morrow is an original, mobile-first collaborative poetry PWA. One person begins a
three-line jam, a second adds line two, and a third completes it. Every line is
limited to 17 words and every participant gets exactly one contribution.

[Open the Figma design system and six mobile screens](https://www.figma.com/design/xxf3Homc51c6McJ6cI0HM0)

## Product

- Daily prompts, an open-jam discovery deck, and a completed-poem feed
- Stable public links at `/jam/:id` with server-rendered Open Graph metadata
- Email/password and Google sign-in through Firebase Authentication
- Profiles, likes, comments, reports, and per-user hiding of reported poems
- Installable Android PWA and iOS Add to Home Screen support
- Offline shell, cached opened pages, connection status, and explicit loading,
  empty, error, and configuration states
- Accessible focus states, semantic landmarks, 44px minimum targets, responsive
  layouts, and reduced-motion support

## Architecture

- **Next.js 16 / React 19 / TypeScript:** App Router UI on Vercel Hobby. Public
  jam metadata uses a small server-side Firestore REST read; hot-path reads and
  writes use Firebase’s browser SDK.
- **Firebase Authentication:** email/password and Google providers. Public user
  documents contain only profile-safe fields.
- **Cloud Firestore:** `users`, `jams`, `prompts`, `comments`, `likes`, and
  `reports` collections. Rules and indexes are committed.
- **Concurrency:** `claimNextLine` uses a Firestore transaction and checks the
  state the writer saw (`open_l2` or `open_l3`). If two poets race for line two,
  the losing transaction retries, sees the changed state, and aborts instead of
  silently writing line three.
- **Trust and safety:** a small client blocklist rejects obvious abusive content,
  strict rules constrain stored shapes and sizes, reports are write-once, and a
  reported poem disappears immediately for its reporter.
- **PWA:** web manifest, 192/512/maskable icons, install prompt, service worker,
  and offline fallback.

## Local development

The latest Firebase SDK requires Node.js 24.12 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Firebase values, the UI runs in a clearly labelled read-only preview
mode using local sample poems. It never pretends preview writes were persisted.

## Firebase setup

1. Create or select a Firebase project on the Spark/free tier.
2. Register a web app and copy its public values into `.env.local`.
3. Replace `REPLACE_WITH_FIREBASE_ACCOUNT_EMAIL` in `firebase.json`.
4. Enable Email/Password and Google Authentication.
5. Deploy the authorization boundary and indexes:

```bash
npx -y firebase-tools@latest use YOUR_PROJECT_ID
npx -y firebase-tools@latest deploy --only firestore,auth
```

Add the Vercel production hostname to Firebase Authentication’s authorized
domains. Firebase web configuration is public by design; authorization lives in
`firestore.rules`.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:rules
npm run test:e2e
npm run build
```

`test:rules` starts the Firestore emulator and exercises unauthorized writes,
single-participation enforcement, and concurrent line claims. `test:e2e` starts
the Auth and Firestore emulators and runs the three-poet journey in Chromium,
mobile Chrome, and mobile Safari projects.

## Collections

| Collection | Purpose                                         |
| ---------- | ----------------------------------------------- |
| `users`    | Public-safe profile and moderation status       |
| `jams`     | Transactional three-line state machine          |
| `prompts`  | Date-keyed writing prompts                      |
| `comments` | Jam discussion                                  |
| `likes`    | Idempotent `jamId_uid` reactions                |
| `reports`  | Write-once moderation queue and per-user hiding |
