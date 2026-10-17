import {expect, test} from "./fixtures";

test.describe("Home mode selection", () => {
  test("selects a mode card and preserves the existing room configuration behavior", async ({
    hostPage
  }) => {
    const {page} = hostPage;

    await page.goto("/");

    const speedBattle = page.getByTestId("home-mode-classic-speed");
    const reactionBattle = page.getByTestId("home-mode-reaction");
    const timer = page.getByRole("combobox", {name: "Timer"});
    const legacyModeSelect = page.getByRole("combobox", {name: "Game mode"});

    await expect(speedBattle).toBeVisible();
    await expect(reactionBattle).toBeVisible();
    await expect(legacyModeSelect).toBeHidden();
    await expect(speedBattle).toHaveAttribute("aria-checked", "true");
    await expect(timer).toBeVisible();

    await reactionBattle.click({force: true});
    await expect(reactionBattle).toHaveAttribute("aria-checked", "true");
    await expect(speedBattle).toHaveAttribute("aria-checked", "false");
    await expect(timer).toBeHidden();

    await speedBattle.click();
    await expect(speedBattle).toHaveAttribute("aria-checked", "true");
    await expect(timer).toBeVisible();
  });

  test("keeps the mobile room setup compact and stable between modes", async ({
    hostPage
  }) => {
    const {page} = hostPage;
    await page.setViewportSize({width: 375, height: 812});
    await page.goto("/");

    const speedBattle = page.getByTestId("home-mode-classic-speed");
    const reactionBattle = page.getByTestId("home-mode-reaction");
    const maxUsers = page.getByRole("combobox", {name: "Max number of users"});
    const timer = page.getByRole("combobox", {name: "Timer"});

    await expect(speedBattle).toBeVisible();
    await expect(reactionBattle).toBeVisible();
    await expect(maxUsers).toBeVisible();
    await expect(timer).toBeVisible();

    const [speedBox, reactionBox, maxUsersBox, timerBox] = await Promise.all([
      speedBattle.boundingBox(),
      reactionBattle.boundingBox(),
      maxUsers.boundingBox(),
      timer.boundingBox()
    ]);

    expect(reactionBox!.x).toBeGreaterThan(speedBox!.x);
    expect(Math.abs(maxUsersBox!.y - timerBox!.y)).toBeLessThan(8);

    await reactionBattle.click({force: true});

    const noTimerNotice = page.getByTestId("reaction-no-timer");
    await expect(noTimerNotice).toBeVisible();
    await expect(noTimerNotice.locator("span").first()).toHaveText("No timer");

    const noTimerDimensions = await noTimerNotice.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight
    }));
    expect(noTimerDimensions.scrollHeight).toBeLessThanOrEqual(
      noTimerDimensions.clientHeight
    );

    const [reactionMaxUsersBox, noTimerBox] = await Promise.all([
      maxUsers.boundingBox(),
      noTimerNotice.boundingBox()
    ]);

    expect(Math.abs(reactionMaxUsersBox!.y - noTimerBox!.y)).toBeLessThan(2);
    expect(noTimerBox!.height).toBeLessThanOrEqual(
      reactionMaxUsersBox!.height + 1
    );
  });

  test("keeps the reaction timer replacement inside its narrow mobile control", async ({
    hostPage
  }, testInfo) => {
    const {page} = hostPage;
    await page.setViewportSize({width: 320, height: 640});
    await page.context().addCookies([
      {
        name: "i18next",
        value: "es",
        url: String(testInfo.project.use.baseURL)
      }
    ]);
    await page.goto("/");

    await page.getByTestId("home-mode-reaction").click({force: true});

    const noTimerNotice = page.getByTestId("reaction-no-timer");
    await expect(noTimerNotice.locator("span").first()).toHaveText("Sin timer");
    const dimensions = await noTimerNotice.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    }));

    expect(dimensions.scrollHeight).toBeLessThanOrEqual(
      dimensions.clientHeight
    );
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });

  for (const viewport of [
    {name: "phone", width: 375, height: 812},
    {name: "tablet", width: 768, height: 1024},
    {name: "desktop", width: 1920, height: 1080}
  ]) {
    test(`keeps mode cards usable without horizontal overflow on ${viewport.name}`, async ({
      hostPage
    }) => {
      const {page} = hostPage;

      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await page.goto("/");

      await expect(page.getByTestId("home-mode-classic-speed")).toBeVisible();
      await expect(page.getByTestId("home-mode-reaction")).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));

      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth
      );
    });
  }
});
