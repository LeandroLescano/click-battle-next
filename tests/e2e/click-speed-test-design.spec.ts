import {expect, test} from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.route(
    /google-analytics\.com|analytics\.google\.com|identitytoolkit\.googleapis\.com|firestore\.googleapis\.com/,
    (route) => route.abort()
  );
});

test("the timer has tenths and a visible progress track", async ({page}) => {
  await page.goto("/click-speed-test");
  await expect(page.getByTestId("click-speed-test-timer")).toHaveText("5.0s");
  const progress = page.getByRole("progressbar", {name: "Time remaining"});
  await expect(progress).toBeVisible();
  await page.getByTestId("click-speed-test-start").click();
  await expect
    .poll(async () => Number(await progress.getAttribute("aria-valuenow")))
    .toBeLessThan(5);
});

test("shows a filled result during the safety lock, then enables both actions", async ({
  page
}) => {
  await page.goto("/click-speed-test");
  await page.clock.install();
  // Freeze wall time too: screenshot capture must not consume the 600ms lock.
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByTestId("click-speed-test-start").click();
  await page.getByTestId("click-speed-test-button").click({clickCount: 3});
  await page.clock.runFor(5001);
  const result = page.getByTestId("click-speed-test-result");
  await expect(result).toBeVisible();
  await expect(page.getByTestId("click-speed-test-score-cps")).toHaveText(
    "0.6"
  );
  await expect(page.getByTestId("click-speed-test-retry")).toBeDisabled();
  await expect(page.getByTestId("click-speed-test-challenge")).toHaveCount(0);
  await page.clock.runFor(650);
  await expect(page.getByTestId("click-speed-test-retry")).toBeEnabled();
  await expect(page.getByTestId("click-speed-test-challenge")).toBeVisible();
});

test("mobile puts the play target in the first viewport without clipping", async ({
  page
}) => {
  await page.setViewportSize({width: 375, height: 812});
  await page.goto("/click-speed-test");
  const target = await page.getByTestId("click-speed-test-start").boundingBox();
  expect(target).not.toBeNull();
  expect(target!.y + target!.height).toBeLessThan(812);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

for (const locale of ["en", "es", "pr"]) {
  for (const width of [320, 375, 768, 1440]) {
    for (const colorScheme of ["light", "dark"] as const) {
      test(`all game states fit ${width}px ${colorScheme} ${locale}`, async ({
        browser,
        baseURL
      }) => {
        const context = await browser.newContext({
          locale,
          viewport: {width, height: 812},
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
          await page.goto(`${origin}/click-speed-test`);
          await page.clock.install();
          // Freeze wall time too: screenshot capture must not consume the 600ms lock.
          await page.clock.pauseAt(new Date(Date.now() + 1000));
          const arena = page.locator(".cst-arena");
          const dimensions = await arena.boundingBox();
          await page.getByTestId("click-speed-test-start").click();
          await page
            .getByTestId("click-speed-test-button")
            .click({clickCount: 3});
          await page.clock.runFor(2500);
          if (locale === "en" && (width === 375 || width === 1440)) {
            await arena.screenshot({
              path: `test-results/cst-running-${width}-${colorScheme}.png`
            });
          }
          await page.clock.runFor(2501);
          await expect(
            page.getByTestId("click-speed-test-result")
          ).toBeVisible();
          await expect(
            page.getByTestId("click-speed-test-retry")
          ).toBeDisabled();
          const locked = await arena.boundingBox();
          expect(Math.abs(locked!.height - dimensions!.height)).toBeLessThan(2);
          await page.clock.runFor(650);
          const challenge = page.getByTestId("click-speed-test-challenge");
          await expect(challenge).toBeVisible();
          await expect(
            page.getByTestId("click-speed-test-retry")
          ).toBeEnabled();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            )
          ).toBe(true);
          for (const target of [
            challenge,
            page.getByTestId("click-speed-test-retry")
          ]) {
            const bounds = await target.boundingBox();
            const panel = await arena.boundingBox();
            expect(bounds!.x).toBeGreaterThanOrEqual(panel!.x);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
              panel!.x + panel!.width + 1
            );
            expect(bounds!.height).toBeGreaterThanOrEqual(44);
          }
          if (locale === "en" && (width === 375 || width === 1440)) {
            await arena.screenshot({
              path: `test-results/cst-result-${width}-${colorScheme}.png`
            });
            await page.screenshot({
              path: `test-results/cst-page-${width}-${colorScheme}.png`,
              fullPage: true
            });
          }
        } finally {
          await context.close();
        }
      });
    }
  }
}

test("reduced motion removes decorative transitions without changing the timer", async ({
  page
}) => {
  await page.emulateMedia({reducedMotion: "reduce"});
  await page.goto("/click-speed-test");
  await page.clock.install();
  // Freeze wall time too: screenshot capture must not consume the 600ms lock.
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByTestId("click-speed-test-start").click();
  const pad = page.getByTestId("click-speed-test-button");
  expect(
    await pad.evaluate((node) => getComputedStyle(node).transitionDuration)
  ).toBe("0s");
  await page.clock.runFor(5001);
  const result = page.getByTestId("click-speed-test-result");
  expect(
    await result.evaluate((node) => getComputedStyle(node).animationName)
  ).toBe("none");
  await expect(page.getByTestId("click-speed-test-timer")).toHaveText("0.0s");
});

test("keeps Tiny5 for the brand and inherits the site's text font elsewhere", async ({
  page
}) => {
  await page.goto("/click-speed-test");
  const siteFont = await page
    .locator("body")
    .evaluate((node) => getComputedStyle(node).fontFamily);
  for (const selector of [
    ".cst-intro h1",
    ".cst-metrics strong",
    ".cst-pad > strong"
  ]) {
    expect(
      await page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).fontFamily)
    ).toBe(siteFont);
  }
  expect(
    await page
      .locator(".cst-brand .font-tiny5")
      .evaluate((node) => getComputedStyle(node).fontFamily)
  ).not.toBe(siteFont);
  const icon = page.locator(".cst-pointer");
  await expect(icon).toHaveAttribute("shape-rendering", "crispEdges");
  await expect(icon).toHaveAttribute("fill", "currentColor");
  await expect(icon).not.toHaveAttribute("stroke", "currentColor");
});

test("review: uses the home brand and shared gameplay/result button palette", async ({
  page
}) => {
  await page.goto("/click-speed-test");
  const brand = page.locator(".cst-brand");
  await expect(brand).toHaveText("Click Battle!");
  await expect(brand.locator(".font-tiny5")).toBeVisible();
  await expect(brand).not.toContainText("↗");
  const start = page.getByTestId("click-speed-test-start");
  await expect(start).toHaveClass(/button-primary/);
  const comparePalette = async (selector: string, variant: string) => {
    await page.mouse.move(0, 0);
    await expect
      .poll(() =>
        page.locator(selector).evaluate((node, variant) => {
          const reference = document.createElement("button");
          reference.className = `button button-${variant}`;
          node.parentElement!.append(reference);
          const actual = getComputedStyle(node);
          const expected = getComputedStyle(reference);
          const matches = [
            "backgroundColor",
            "color",
            "borderTopColor",
            "borderRadius",
            "transform",
            "boxShadow"
          ].every(
            (key) =>
              actual[key as keyof CSSStyleDeclaration] ===
              expected[key as keyof CSSStyleDeclaration]
          );
          reference.remove();
          return matches;
        }, variant)
      )
      .toBe(true);
  };
  await comparePalette('[data-testid="click-speed-test-start"]', "primary");
  await page.clock.install();
  // Freeze wall time too: screenshot capture must not consume the 600ms lock.
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await start.click();
  await expect(page.getByTestId("click-speed-test-button")).toHaveClass(
    /button-primary/
  );
  await comparePalette('[data-testid="click-speed-test-button"]', "primary");
  const pad = page.getByTestId("click-speed-test-button");
  await pad.hover();
  await page.mouse.down();
  try {
    await expect
      .poll(() => pad.evaluate((node) => getComputedStyle(node).transform))
      .toBe("matrix(1, 0, 0, 1, 0, 0)");
  } finally {
    await page.mouse.up();
  }
  await page.clock.runFor(5650);
  await expect(page.getByTestId("click-speed-test-challenge")).toHaveClass(
    /button-primary/
  );
  await expect(page.getByTestId("click-speed-test-challenge")).toHaveAttribute(
    "href",
    "/?entry_point=click_speed_test"
  );
  await comparePalette('[data-testid="click-speed-test-challenge"]', "primary");
  await comparePalette('[data-testid="click-speed-test-retry"]', "outlined");
});
