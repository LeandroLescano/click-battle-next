import {expect, test} from "@playwright/test";

const scenarios = [
  {
    locale: "en",
    multiplayer: "Play with friends",
    obsolete: [
      "Same device. Same test. Beat your score.",
      "Keep going — every click counts.",
      "Turn your score into a live challenge",
      "The solo test is a warm-up."
    ]
  },
  {
    locale: "es",
    multiplayer: "Jugá con amigos",
    obsolete: [
      "Mismo dispositivo, mismo test. Superá tu puntaje.",
      "Seguí, cada click cuenta.",
      "Convertí tu puntaje en un desafío en vivo",
      "El test individual es un calentamiento."
    ]
  },
  {
    locale: "pr",
    multiplayer: "Jogue com amigos",
    obsolete: [
      "Mesmo dispositivo, mesmo teste. Supere sua pontuação.",
      "Continue, cada clique conta.",
      "Transforme sua pontuação em um desafio ao vivo",
      "O teste individual é um aquecimento."
    ]
  }
];

for (const scenario of scenarios) {
  test(`instructions without motivational filler in ${scenario.locale}`, async ({
    browser,
    baseURL
  }) => {
    const context = await browser.newContext({locale: scenario.locale});
    const page = await context.newPage();
    try {
      const origin = new URL(baseURL!).origin;
      await page.route("**/*", (route) =>
        new URL(route.request().url()).origin === origin
          ? route.continue()
          : route.abort()
      );
      await page.goto(`${origin}/click-speed-test`);
      const surface = page.locator(".cst-page");
      await expect(
        page.getByRole("heading", {name: scenario.multiplayer, exact: true})
      ).toBeVisible();
      await expect(surface).toContainText("CPS");
      for (const text of scenario.obsolete)
        await expect(surface).not.toContainText(text);
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      await page.getByTestId("click-speed-test-start").click();
      await page.clock.runFor(3000);
      for (const text of scenario.obsolete)
        await expect(surface).not.toContainText(text);
      await page.getByTestId("click-speed-test-button").click({clickCount: 3});
      await page.clock.runFor(5600);
      await expect(page.getByTestId("click-speed-test-score-cps")).toHaveText(
        "0.6"
      );
      for (const text of scenario.obsolete)
        await expect(surface).not.toContainText(text);
      await expect(page.getByTestId("click-speed-test-retry")).toBeEnabled();
      await expect(
        page.getByTestId("click-speed-test-challenge")
      ).toHaveAttribute("href", "/?entry_point=click_speed_test");
    } finally {
      await context.close();
    }
  });
}
