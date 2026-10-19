import {expect, test} from "@playwright/test";

test.beforeEach(async ({page}) => {
  await page.route(
    /google-analytics\.com|analytics\.google\.com|identitytoolkit\.googleapis\.com|firestore\.googleapis\.com/,
    (route) => route.abort()
  );
  await page.goto("/click-speed-test");
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
});

test("counts 3–2–1 without scoring, then gives five complete seconds", async ({
  page
}) => {
  await page.getByTestId("click-speed-test-start").click();
  const preparation = page.getByTestId("click-speed-test-countdown");
  const number = preparation.locator("strong");
  await expect(preparation).toBeDisabled();
  await expect(number).toHaveText("3");
  await preparation.dispatchEvent("click");
  await expect(page.locator(".cst-clicks strong")).toHaveText("0");
  await expect(page.getByTestId("click-speed-test-timer")).toHaveText("5.0s");
  await page.clock.runFor(999);
  await expect(number).toHaveText("3");
  await page.clock.runFor(1);
  await expect(number).toHaveText("2");
  await page.clock.runFor(1000);
  await expect(number).toHaveText("1");
  await page.clock.runFor(999);
  await expect(page.getByTestId("click-speed-test-button")).toHaveCount(0);
  await expect(page.getByTestId("click-speed-test-timer")).toHaveText("5.0s");
  await page.clock.runFor(1);
  const target = page.getByTestId("click-speed-test-button");
  await expect(target).toBeEnabled();
  await expect(page.getByTestId("click-speed-test-timer")).toHaveText("5.0s");
  await target.click({clickCount: 3});
  await page.clock.runFor(4999);
  await expect(page.getByTestId("click-speed-test-result")).toHaveCount(0);
  await expect(target).toBeEnabled();
  await page.clock.runFor(1);
  await expect(page.getByTestId("click-speed-test-result")).toBeVisible();
  await expect(page.getByTestId("click-speed-test-score-cps")).toHaveText(
    "0.6"
  );
  await expect(page.getByTestId("click-speed-test-retry")).toBeDisabled();
  await page.clock.runFor(600);
  await expect(page.getByTestId("click-speed-test-retry")).toBeEnabled();
});

test("retry resets the score and prepares again; start analytics fires only when play begins", async ({
  page
}) => {
  const starts = () =>
    page.evaluate(() => {
      const layer =
        (window as Window & {dataLayer?: IArguments[]}).dataLayer ?? [];
      return layer
        .map((entry) => Array.from(entry))
        .filter(
          (entry) =>
            entry[0] === "event" && entry[1] === "click_speed_test_start"
        ).length;
    });
  await page.getByTestId("click-speed-test-start").click();
  await expect.poll(starts).toBe(0);
  await page.clock.runFor(3000);
  await expect.poll(starts).toBe(1);
  await page.getByTestId("click-speed-test-button").click({clickCount: 3});
  await page.clock.runFor(5600);
  await page.getByTestId("click-speed-test-retry").click();
  const preparation = page.getByTestId("click-speed-test-countdown");
  await expect(preparation.locator("strong")).toHaveText("3");
  await expect(preparation).toBeDisabled();
  await preparation.dispatchEvent("click");
  await expect(page.locator(".cst-clicks strong")).toHaveText("0");
  await expect(page.getByTestId("click-speed-test-timer")).toHaveText("5.0s");
  await expect.poll(starts).toBe(1);
  await page.clock.runFor(3000);
  await expect.poll(starts).toBe(2);
  await page.getByTestId("click-speed-test-button").click();
  await page.clock.runFor(5000);
  await expect(page.getByTestId("click-speed-test-score-cps")).toHaveText(
    "0.2"
  );
});
