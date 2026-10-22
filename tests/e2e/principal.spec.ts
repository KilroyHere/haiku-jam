import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function createPoet(page: Page, name: string, email: string) {
  await page.goto("/welcome");
  await page.getByLabel("Pen name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Morrow-test-2026!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create my profile" }).click();
  await expect(page).toHaveURL(/\/deck$/);
}

async function enterPoetryLine(
  page: Page,
  label: "First line" | "Your line",
  text: string,
) {
  const field = page.getByLabel(label);
  await field.click();
  await field.pressSequentially(text, { delay: 1 });
  await expect(field).toHaveValue(text);
}

test("three different poets complete one stable public jam", async ({
  browser,
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name.replace(/\W/g, "")}-${Date.now()}`;
  await createPoet(page, "First Poet", `first-${stamp}@example.com`);

  await page.goto("/compose?prompt=small-light");
  await enterPoetryLine(
    page,
    "First line",
    "Morning leaves a gold key under the door",
  );
  await page.getByRole("button", { name: "Start this jam" }).click();
  await expect(page).toHaveURL(/\/jam\/[^/]+$/);
  const jamUrl = page.url();
  const jamId = jamUrl.split("/").pop();
  expect(jamId).toBeTruthy();

  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  await createPoet(second, "Second Poet", `second-${stamp}@example.com`);
  await second.goto(`/compose?jam=${jamId}`);
  await expect(
    second.getByText("Morning leaves a gold key under the door"),
  ).toBeVisible();
  await enterPoetryLine(
    second,
    "Your line",
    "I turn it once and hear the sparrows",
  );
  await second.getByRole("button", { name: "Add my line" }).click();
  await expect(second).toHaveURL(jamUrl);

  const thirdContext = await browser.newContext();
  const third = await thirdContext.newPage();
  await createPoet(third, "Third Poet", `third-${stamp}@example.com`);
  await third.goto(`/compose?jam=${jamId}`);
  await expect(
    third.getByText("I turn it once and hear the sparrows"),
  ).toBeVisible();
  await enterPoetryLine(third, "Your line", "the whole street opens into song");
  await third.getByRole("button", { name: "Add my line" }).click();
  await expect(third).toHaveURL(jamUrl);
  await expect(third.getByText("Completed poem")).toBeVisible();
  await expect(
    third.getByText("the whole street opens into song"),
  ).toBeVisible();

  await secondContext.close();
  await thirdContext.close();
});

test("word limit, manifest, and mobile feed accessibility", async ({
  page,
}) => {
  await page.goto("/compose");
  const text = Array.from({ length: 18 }, (_, index) => `word${index}`).join(
    " ",
  );
  await enterPoetryLine(page, "First line", text);
  await expect(page.getByText("18/17")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start this jam" }),
  ).toBeDisabled();

  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({
    name: "Morrow — Collaborative Poetry",
    display: "standalone",
  });

  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
