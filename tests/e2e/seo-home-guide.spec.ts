import {expect, test} from "@playwright/test";

const localized = [
  {
    locale: "en",
    title: "Click Battle: Online Click Battles with Friends",
    homeDescription:
      "Create a room, share its link, and play quick online click battles with friends in your browser.",
    h1: "Create a room and play Click Battle with friends",
    homeIntro: "Share the room link to invite friends to your match.",
    guideTitle: "How to play Click Battle",
    guidePageTitle: "Click Battle: How to play",
    guideDescription:
      "Create or join a room, invite friends with its link, and learn how the available modes work.",
    speedHeading: "Speed Battle: click before the timer ends",
    speedDescription:
      "Click or tap as many times as you can before the timer expires. The player with more clicks wins.",
    reactionHeading: "Reaction Battle: wait for the signal",
    reactionDescription:
      "After the signal appears, click, tap, or press Space. The fastest valid reaction wins; clicking early loses the round.",
    openLobby: "Open lobby",
    cps: "Try the Click Speed Test"
  },
  {
    locale: "es",
    title: "Click Battle: batallas de clicks online con amigos",
    homeDescription:
      "Creá una sala, compartí el enlace y jugá batallas de clicks online con amigos desde el navegador.",
    h1: "Creá una sala y jugá Click Battle con tus amigos",
    homeIntro:
      "Compartí el enlace de la sala para invitar a tus amigos a jugar.",
    guideTitle: "Cómo jugar Click Battle",
    guidePageTitle: "Click Battle: cómo jugar",
    guideDescription:
      "Creá o unite a una sala, invitá a tus amigos con el link y aprendé cómo funcionan los modos disponibles.",
    speedHeading: "Speed Battle: hacé clicks antes de que termine el tiempo",
    speedDescription:
      "Hacé clicks o tocá la pantalla tantas veces como puedas antes de que termine el temporizador. Gana quien suma más clicks.",
    reactionHeading: "Batalla de Reacción: esperá la señal",
    reactionDescription:
      "Cuando aparezca la señal, hacé click, tocá la pantalla o presioná Espacio. Gana la reacción válida más rápida; si te adelantás, perdés la ronda.",
    openLobby: "Abrir lobby",
    cps: "Probar el test de velocidad de clicks"
  },
  {
    locale: "pr",
    title: "Click Battle: batalhas de cliques online com amigos",
    homeDescription:
      "Crie uma sala, compartilhe o link e jogue batalhas de cliques online com amigos pelo navegador.",
    h1: "Crie uma sala e jogue Click Battle com seus amigos",
    homeIntro:
      "Compartilhe o link da sala para convidar seus amigos para jogar.",
    guideTitle: "Como jogar Click Battle",
    guidePageTitle: "Click Battle: como jogar",
    guideDescription:
      "Crie ou entre em uma sala, convide seus amigos pelo link e veja como funcionam os modos disponíveis.",
    speedHeading: "Speed Battle: clique antes do tempo acabar",
    speedDescription:
      "Clique ou toque na tela o máximo de vezes possível antes do cronômetro acabar. Vence quem fizer mais cliques.",
    reactionHeading: "Batalha de Reação: espere o sinal",
    reactionDescription:
      "Quando o sinal aparecer, clique, toque na tela ou pressione Espaço. A reação válida mais rápida vence; clicar antes faz você perder a rodada.",
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
  expect(html).toContain(`<title>${localized[1].title}</title>`);
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
        await expect(page).toHaveTitle(preference.guidePageTitle);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          "content",
          preference.guideDescription
        );
        await expect(
          page.getByRole("heading", {level: 2, name: preference.speedHeading})
        ).toBeVisible();
        await expect(
          page.getByText(preference.speedDescription, {exact: true})
        ).toBeVisible();
        await expect(
          page.getByRole("heading", {
            level: 2,
            name: preference.reactionHeading
          })
        ).toBeVisible();
        await expect(
          page.getByText(preference.reactionDescription, {exact: true})
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
