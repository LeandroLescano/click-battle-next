import {expect, test} from "@playwright/test";

const localized = [
  {
    locale: "en",
    title: "Click battles and reaction games with friends | Click Battle",
    homeDescription:
      "Create a room, share its link, and play Speed Battle or Reaction Battle with friends.",
    h1: "Create a room and play click or reaction battles with friends",
    homeIntro:
      "Share the room link to invite friends to Speed Battle or Reaction Battle.",
    guideTitle: "How to play Speed Battle and Reaction Battle",
    guideDescription:
      "Create or join a room, share its link, and learn how Speed Battle and Reaction Battle work before playing with friends.",
    speedHeading: "Speed Battle: click before the timer ends",
    reactionHeading: "Reaction Battle: wait for the signal",
    openLobby: "Open lobby",
    cps: "Try the Click Speed Test"
  },
  {
    locale: "es",
    title: "Batallas de clicks y reacción con amigos | Click Battle",
    homeDescription:
      "Creá una sala, compartí el link y jugá Speed Battle o Batalla de Reacción con amigos.",
    h1: "Creá una sala y jugá batallas de clicks o reacción con amigos",
    homeIntro:
      "Compartí el link de la sala para invitar amigos a Speed Battle o Batalla de Reacción.",
    guideTitle: "Cómo jugar Speed Battle y Batalla de Reacción",
    guideDescription:
      "Creá o unite a una sala, compartí el link y aprendé cómo funcionan Speed Battle y Batalla de Reacción antes de jugar con amigos.",
    speedHeading: "Speed Battle: hacé clicks antes de que termine el tiempo",
    reactionHeading: "Batalla de Reacción: esperá la señal",
    openLobby: "Abrir lobby",
    cps: "Probar el test de velocidad de clicks"
  },
  {
    locale: "pr",
    title: "Batalhas de cliques e reação com amigos | Click Battle",
    homeDescription:
      "Crie uma sala, compartilhe o link e jogue Speed Battle ou Batalha de Reação com amigos.",
    h1: "Crie uma sala e jogue batalhas de cliques ou reação com amigos",
    homeIntro:
      "Compartilhe o link da sala para convidar amigos para Speed Battle ou Batalha de Reação.",
    guideTitle: "Como jogar Speed Battle e Batalha de Reação",
    guideDescription:
      "Crie ou entre em uma sala, compartilhe o link e veja como funcionam Speed Battle e Batalha de Reação antes de jogar com amigos.",
    speedHeading: "Speed Battle: clique antes do tempo acabar",
    reactionHeading: "Batalha de Reação: espere o sinal",
    openLobby: "Abrir lobby",
    cps: "Testar o teste de velocidade de cliques"
  }
] as const;

test("home defaults to Spanish in server HTML without a saved preference", async ({
  request
}) => {
  const response = await request.get("/", {
    headers: {"Accept-Language": "en"}
  });
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain('<html lang="es"');
  expect(html).toContain(
    "<title>Batallas de clicks y reacción con amigos | Click Battle</title>"
  );
  expect(html).toContain(
    `name="description" content="${localized[1].homeDescription}"`
  );
  expect(html).toContain(localized[1].h1);
  expect(html).toContain(localized[1].homeIntro);
});

test("home emits one viewport tag with the existing mobile settings", async ({
  request
}) => {
  const response = await request.get("/", {
    headers: {"Accept-Language": "es"}
  });
  const html = await response.text();

  expect(html.match(/name="viewport"/g)).toHaveLength(1);
  expect(html).toContain(
    'name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover"'
  );
});

for (const preference of localized) {
  test(`saved ${preference.locale} preference controls server-rendered home metadata`, async ({
    request
  }) => {
    const conflictingAcceptLanguage = preference.locale === "en" ? "es" : "en";
    const response = await request.get("/", {
      headers: {
        "Accept-Language": conflictingAcceptLanguage,
        Cookie: `i18next=${preference.locale}`
      }
    });
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toContain(`<html lang="${preference.locale}"`);
    expect(html).toContain(`<title>${preference.title}</title>`);
    expect(html).toContain(preference.h1);
  });
}

test("language selector saves an explicit preference across reloads", async ({
  browser,
  baseURL
}) => {
  const origin = new URL(baseURL!).origin;
  const context = await browser.newContext({
    locale: "en",
    viewport: {width: 375, height: 844}
  });
  const page = await context.newPage();

  try {
    await page.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort()
    );
    await page.goto(`${origin}/how-to-play`, {waitUntil: "domcontentloaded"});
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", {level: 1})).toHaveText(
      localized[1].guideTitle
    );

    await page.locator("#language-menu").click();
    await page.getByRole("menuitem", {name: "en"}).click();
    await expect(page.getByRole("heading", {level: 1})).toHaveText(
      localized[0].guideTitle
    );
    await expect
      .poll(
        async () =>
          (await context.cookies()).find((cookie) => cookie.name === "i18next")
            ?.value
      )
      .toBe("en");

    await page.reload({waitUntil: "domcontentloaded"});
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", {level: 1})).toHaveText(
      localized[0].guideTitle
    );
  } finally {
    await context.close();
  }
});

for (const preference of localized) {
  for (const width of [375, 1440]) {
    test(`guide copy and internal links fit at ${width}px in ${preference.locale}`, async ({
      browser,
      baseURL
    }) => {
      const origin = new URL(baseURL!).origin;
      const context = await browser.newContext({
        locale: preference.locale,
        viewport: {width, height: 900},
        colorScheme: "light"
      });
      const page = await context.newPage();

      try {
        await context.addCookies([
          {name: "i18next", value: preference.locale, url: origin}
        ]);
        await page.route("**/*", (route) =>
          new URL(route.request().url()).origin === origin
            ? route.continue()
            : route.abort()
        );
        await page.goto(`${origin}/how-to-play`, {
          waitUntil: "domcontentloaded"
        });

        await expect(page.locator("html")).toHaveAttribute(
          "lang",
          preference.locale
        );
        await expect(
          page.getByRole("heading", {level: 1, name: preference.guideTitle})
        ).toBeVisible();
        await expect(page).toHaveTitle(
          `${preference.guideTitle} | Click Battle`
        );
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          "content",
          preference.guideDescription
        );
        await expect(
          page.getByRole("heading", {level: 2, name: preference.speedHeading})
        ).toBeVisible();
        await expect(
          page.getByRole("heading", {
            level: 2,
            name: preference.reactionHeading
          })
        ).toBeVisible();
        await expect(
          page.getByRole("link", {name: preference.openLobby})
        ).toHaveAttribute("href", "/");
        await expect(
          page.getByRole("link", {name: preference.cps})
        ).toHaveAttribute("href", "/click-speed-test");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true);

        if (preference.locale === "es") {
          await page.screenshot({
            path: `test-results/seo-home-guide-es-${width}.png`,
            fullPage: true
          });
        }
      } finally {
        await context.close();
      }
    });
  }
}
