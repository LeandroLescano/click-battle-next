import {expect, test} from "@playwright/test";

// All interactions are local or preview-only. Block collection and backend writes.
test.beforeEach(async ({page}) => {
  await page.route(
    /google-analytics\.com|analytics\.google\.com|identitytoolkit\.googleapis\.com|firestore\.googleapis\.com/,
    (route) => route.abort()
  );
});

test("CPS landing serves a specific title, instructions and score explanation", async ({
  page,
  request
}) => {
  const response = await request.get("/click-speed-test", {
    headers: {"Accept-Language": "en"}
  });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("5-Second Click Speed Test (CPS) | Click Battle");
  expect(html).toContain("CPS = total clicks / 5 seconds");
  expect(html).toContain('href="/how-to-play"');
  await page.goto("/click-speed-test");
  await expect(
    page.getByRole("heading", {level: 1, name: "5-Second Click Speed Test"})
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {name: "How to take the click speed test"})
  ).toBeAttached();
});

test("finishes a five-second test, preserves its score and can retry", async ({
  page
}) => {
  await page.goto("/click-speed-test");
  await page.getByTestId("click-speed-test-start").click();
  await page.getByTestId("click-speed-test-button").click({clickCount: 3});
  await expect(page.getByTestId("click-speed-test-challenge")).toBeVisible({
    timeout: 9000
  });
  await expect(page.getByText("3 clicks", {exact: true})).toBeVisible();
  await expect(
    page.getByText("0.6 clicks per second", {exact: true})
  ).toBeVisible();
  await expect(page.getByTestId("click-speed-test-challenge")).toHaveAttribute(
    "href",
    "/?entry_point=click_speed_test"
  );
  await page.getByTestId("click-speed-test-retry").click();
  await expect(page.getByTestId("click-speed-test-button")).toBeVisible();
  await expect(page.getByTestId("click-speed-test-challenge")).toHaveCount(0);
});

test("queues the real analytics funnel without sending test hits to Google", async ({
  page
}) => {
  await page.goto("/click-speed-test");
  await page.getByTestId("click-speed-test-start").click();
  await page.getByTestId("click-speed-test-button").click({clickCount: 3});
  const challenge = page.getByTestId("click-speed-test-challenge");
  await expect(challenge).toBeVisible({timeout: 9000});
  // Exercise the real click handler, but do not navigate into room/auth flows.
  await challenge.evaluate((element) =>
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true
    })
  );
  await challenge.click();
  const events = () =>
    page.evaluate(() => {
      const layer =
        (window as Window & {dataLayer?: IArguments[]}).dataLayer ?? [];
      return layer
        .map((entry) => Array.from(entry))
        .filter((entry) => entry[0] === "event")
        .map((entry) => ({
          name: entry[1],
          params: entry[2] as Record<string, unknown>
        }));
    });
  await expect
    .poll(async () => (await events()).map((event) => event.name))
    .toEqual([
      "click_speed_test_view",
      "click_speed_test_start",
      "click_speed_test_complete",
      "click_speed_test_challenge_click"
    ]);
  const recorded = await events();
  expect(recorded[2].params).toMatchObject({
    clicks: 3,
    clicksPerSecond: 0.6,
    durationSeconds: 5
  });
  expect(recorded[3].params).toMatchObject({clicks: 3, clicks_per_second: 0.6});
});

for (const scenario of [
  {locale: "en", heading: "5-Second Click Speed Test"},
  {locale: "es", heading: "Test de velocidad de clicks de 5 segundos"},
  {locale: "pr", heading: "Teste de velocidade de cliques de 5 segundos"}
]) {
  for (const width of [375, 1440]) {
    for (const colorScheme of ["light", "dark"] as const) {
      test(`CPS landing fits ${width}px ${colorScheme} in ${scenario.locale}`, async ({
        browser,
        baseURL
      }) => {
        const context = await browser.newContext({
          locale: scenario.locale,
          viewport: {width, height: 900},
          colorScheme
        });
        const page = await context.newPage();
        try {
          const origin = new URL(baseURL!).origin;
          await page.route("**/*", (route) =>
            new URL(route.request().url()).origin === origin
              ? route.continue()
              : route.abort()
          );
          await page.goto(`${origin}/click-speed-test`, {
            waitUntil: "domcontentloaded"
          });
          await expect(
            page.getByRole("heading", {level: 1, name: scenario.heading})
          ).toBeVisible();
          const start = page.getByTestId("click-speed-test-start");
          await start.scrollIntoViewIfNeeded();
          await expect(start).toBeVisible();
          const guide = page.locator(
            'section[aria-labelledby="click-speed-test-guide"]'
          );
          await guide.scrollIntoViewIfNeeded();
          await expect(guide).toBeVisible();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            )
          ).toBe(true);
          if (scenario.locale === "en")
            await page.screenshot({
              path: `test-results/cps-guide-${width}-${colorScheme}.png`,
              fullPage: true
            });
        } finally {
          await context.close();
        }
      });
    }
  }
}

test("short screens do not clip translated instructions or the play button", async ({
  browser,
  baseURL
}) => {
  const context = await browser.newContext({
    locale: "es",
    viewport: {width: 1024, height: 600}
  });
  const page = await context.newPage();
  try {
    const origin = new URL(baseURL!).origin;
    await page.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort()
    );
    await page.goto(`${origin}/click-speed-test`);
    const main = page.locator("main");
    const outside = await main
      .locator("h1, h2, p, button")
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const bounds = node.closest("main")!.getBoundingClientRect();
            const rect = node.getBoundingClientRect();
            return rect.bottom > bounds.bottom + 1 || rect.top < bounds.top - 1;
          })
          .map((node) => node.textContent)
      );
    expect(outside).toEqual([]);
  } finally {
    await context.close();
  }
});

test("guide follows the language selector without a reload", async ({page}) => {
  await page.goto("/click-speed-test");
  await page.locator("#language-menu").click();
  await page.getByRole("menuitem").filter({hasText: /^es$/}).click();
  await expect(
    page.getByRole("heading", {
      name: "Cómo hacer el test de velocidad de clicks"
    })
  ).toBeAttached();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Test de velocidad de clicks de 5 segundos"
    })
  ).toBeVisible();
});
