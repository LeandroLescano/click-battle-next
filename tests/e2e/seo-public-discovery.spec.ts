import {expect, test} from "@playwright/test";

test("home exposes the click speed test in HTML before authentication or JavaScript", async ({
  page,
  request
}) => {
  const response = await request.get("/", {
    headers: {"Accept-Language": "en"}
  });
  expect(response.status()).toBe(200);
  const html = await response.text();
  // Inspect only server HTML. Do not execute scripts or connect to Firebase.
  await page.route("**/*", (route) => route.abort());
  await page.setContent(
    html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  );
  // React streaming may place server HTML in hidden transport containers.
  // Include those nodes here; the separate rendered test checks visibility.
  const navigation = page.getByRole("navigation", {
    name: "Explore Click Battle",
    includeHidden: true
  });
  await expect(navigation).toBeAttached();
  await expect(
    navigation.getByRole("link", {
      name: "Try the Click Speed Test",
      includeHidden: true
    })
  ).toHaveAttribute("href", "/click-speed-test");
  await expect(
    navigation.getByRole("link", {
      name: "How to play",
      exact: true,
      includeHidden: true
    })
  ).toHaveAttribute("href", "/how-to-play");
  await expect(
    navigation.getByRole("link", {
      name: "Ranking",
      exact: true,
      includeHidden: true
    })
  ).toHaveAttribute("href", "/ranking");
});

for (const scenario of [
  {locale: "en", label: "Explore Click Battle"},
  {locale: "es", label: "Explorar Click Battle"},
  {locale: "pr", label: "Explore o Click Battle"}
]) {
  for (const width of [375, 1440]) {
    test(`public navigation is visible and fits at ${width}px in ${scenario.locale}`, async ({
      browser,
      baseURL
    }) => {
      const context = await browser.newContext({
        locale: scenario.locale,
        viewport: {width, height: 900},
        colorScheme: "dark"
      });
      const page = await context.newPage();
      try {
        const origin = new URL(baseURL!).origin;
        await page.route("**/*", (route) =>
          new URL(route.request().url()).origin === origin
            ? route.continue()
            : route.abort()
        );
        await page.goto(`${origin}/`, {waitUntil: "domcontentloaded"});
        const navigation = page.getByRole("navigation", {name: scenario.label});
        await navigation.scrollIntoViewIfNeeded();
        await expect(navigation).toBeVisible();
        await expect(
          navigation.locator('a[href="/click-speed-test"]')
        ).toBeVisible();
        expect(
          await navigation.evaluate(
            (node) => node.scrollWidth <= node.clientWidth
          )
        ).toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true);
        if (scenario.locale === "en") {
          await page.screenshot({
            path: `test-results/seo-public-navigation-${width}.png`
          });
        }
      } finally {
        await context.close();
      }
    });
  }
}
