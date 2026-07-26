import {test, expect} from "./fixtures";

const hydrationCases = [
  {language: "en", heading: "How to start a Click Battle"},
  {language: "es", heading: "Como empezar una Click Battle"},
  {language: "pr", heading: "Como começar uma Click Battle"}
] as const;

for (const {language, heading} of hydrationCases) {
  test(`Should hydrate how-to-play in ${language}`, async ({
    context,
    page
  }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL);
    const hydrationErrors: string[] = [];
    const recordHydrationError = (message: string) => {
      if (/hydration|did not match|Minified React error #418/i.test(message)) {
        hydrationErrors.push(message);
      }
    };

    await context.addCookies([
      {
        name: "i18next",
        value: language,
        url: baseURL
      }
    ]);

    page.on("console", (message) => {
      if (message.type() === "error") {
        recordHydrationError(message.text());
      }
    });
    page.on("pageerror", (error) => recordHydrationError(error.message));

    await page.goto("/how-to-play", {waitUntil: "networkidle"});

    await expect(page.getByRole("heading", {level: 1})).toHaveText(heading);
    expect(hydrationErrors).toEqual([]);
  });
}

test("Should change language to spanish", async ({userPage: {page}}) => {
  await expect(page.getByText("Log Out")).toBeVisible();
  await page.getByRole("button", {name: "Profile"}).click();

  await page.getByRole("button", {name: /^en flag en$/i}).click();
  await page.getByRole("menuitem", {name: "es"}).click();

  await expect(page.getByText("Salas disponibles")).toBeVisible();
});

test("Should change language to portuguese", async ({userPage: {page}}) => {
  await expect(page.getByText("Log Out")).toBeVisible();
  await page.getByRole("button", {name: "Profile"}).click();

  await page.getByRole("button", {name: /^en flag en$/i}).click();
  await page.getByRole("menuitem", {name: "pr"}).click();

  await expect(page.getByText("Salas disponíveis")).toBeVisible();
});
