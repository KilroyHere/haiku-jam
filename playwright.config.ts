import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "morrow-rules-test.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "morrow-rules-test",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:test",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123",
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
    },
  },
});
