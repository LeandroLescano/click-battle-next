import {expect, test, type Page} from "./fixtures";

const uniqueRoomName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const getButtonBox = async (page: Page, name: string) => {
  const button = page.getByRole("button", {name});
  const box = await button.boundingBox();

  expect(box).not.toBeNull();

  return box!;
};

const expectStableBox = (
  before: {x: number; y: number; width: number; height: number},
  after: {x: number; y: number; width: number; height: number}
) => {
  expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
};

const finishReactionRoundWithHostWinner = async (
  hostPage: Page,
  userPage: Page
) => {
  await expect(hostPage.getByRole("button", {name: "Click!"})).toBeVisible({
    timeout: 7000
  });
  await expect(userPage.getByRole("button", {name: "Click!"})).toBeVisible({
    timeout: 7000
  });

  await hostPage.getByRole("button", {name: "Click!"}).click();
  await userPage.waitForTimeout(120);
  await userPage.getByRole("button", {name: "Click!"}).click();

  await expect(hostPage.getByText(/Winner: guesthost1/i)).toBeVisible({
    timeout: 7000
  });
};

test.describe("Game", () => {
  test.describe.configure({mode: "serial"});

  test("Should create classic-speed and reaction rooms with visible mode labels", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const classicRoomName = uniqueRoomName("classic-mode-room");
    const reactionRoomName = uniqueRoomName("reaction-mode-room");

    await hostPage.createRoom({roomName: classicRoomName});
    await userPage.goto("/");
    const classicRoomCard = userPage.getByRole("button", {
      name: new RegExp(classicRoomName, "i")
    });
    await expect(classicRoomCard).toBeVisible();
    await expect(classicRoomCard.getByText("Classic Speed")).toBeVisible();

    await hostPage.page.goto("/");
    await hostPage.createRoom({
      gameMode: "reaction",
      roomName: reactionRoomName
    });
    await userPage.goto("/");
    const reactionRoomCard = userPage.getByRole("button", {
      name: new RegExp(reactionRoomName, "i")
    });
    await expect(reactionRoomCard).toBeVisible();
    await expect(reactionRoomCard.getByText("Reaction Battle")).toBeVisible();
  });

  test("Should play a game between two users", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("classic-round");
    const roomID = await hostPage.createRoom({roomName});
    await expect(hostPage.page.getByText("Press start to play")).toBeVisible();
    await expect(
      hostPage.page.getByRole("button", {name: "Start!"})
    ).toBeDisabled();
    await expect(
      hostPage.page.getByRole("button", {name: "Settings", exact: true})
    ).toBeVisible();

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
    await expect(
      userPage.getByRole("button", {name: "Settings", exact: true})
    ).not.toBeVisible();

    await expect(hostPage.page.getByText("guestuser1")).toBeVisible();
    await hostPage.page.getByText("Start!").click();

    await userPage.waitForTimeout(3000);
    await hostPage.page.waitForTimeout(3000);

    await Promise.all([
      hostPage.page
        .getByRole("button", {name: "Click"})
        .click({clickCount: 20, delay: 100}),
      userPage
        .getByRole("button", {name: "Click"})
        .click({clickCount: 10, delay: 200})
    ]);

    await expect(hostPage.page.getByText("1st place")).toBeVisible({
      timeout: 10000
    });
    await expect(
      userPage.getByRole("heading", {name: "2nd place"})
    ).toBeVisible({
      timeout: 10000
    });
    await expect(hostPage.page.getByText(/remaining/i)).not.toBeVisible();
    await expect(
      hostPage.page.getByRole("button", {name: "Reset"})
    ).toBeVisible();
  });

  test("Should play a reaction round with false start and valid winner", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("reaction-false-start");
    const roomID = await hostPage.createRoom({gameMode: "reaction", roomName});

    await expect(hostPage.page.getByText("Reaction Battle")).toBeVisible();

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);
    expect(userPage.url().split("/").pop()).toEqual(roomID);

    await hostPage.page
      .getByRole("button", {name: "Start reaction round"})
      .click();
    await hostPage.page.getByRole("button", {name: "Stay ready..."}).click();

    await expect(
      hostPage.page.getByRole("heading", {name: "False start"})
    ).toBeVisible();
    await expect(userPage.getByRole("button", {name: "Click!"})).toBeVisible({
      timeout: 7000
    });

    await userPage.getByRole("button", {name: "Click!"}).click();

    await expect(userPage.getByText(/Winner: guestuser1/i)).toBeVisible({
      timeout: 7000
    });
    await expect(userPage.getByText(/Your reaction was .* ms/i)).toBeVisible();
  });

  test("Should keep reaction action stable and return to lobby after result", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("reaction-lobby-reset");
    const roomID = await hostPage.createRoom({
      gameMode: "reaction",
      roomName
    });

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);
    expect(userPage.url().split("/").pop()).toEqual(roomID);

    await hostPage.page
      .getByRole("button", {name: "Start reaction round"})
      .click();
    await expect(
      userPage.getByRole("button", {name: "Stay ready..."})
    ).toBeVisible();
    const armedBox = await getButtonBox(userPage, "Stay ready...");

    await expect(userPage.getByRole("button", {name: "Click!"})).toBeVisible({
      timeout: 7000
    });
    const signalBox = await getButtonBox(userPage, "Click!");
    expectStableBox(armedBox, signalBox);

    await finishReactionRoundWithHostWinner(hostPage.page, userPage);

    await expect(
      hostPage.page.getByRole("button", {name: "Start next round"})
    ).toBeVisible();
    await expect(
      hostPage.page.getByRole("button", {name: "Back to lobby"})
    ).toBeVisible();

    const celebration = hostPage.page.locator("#celebration");
    await expect(celebration).toBeVisible();
    const celebrationBox = await celebration.boundingBox();
    const viewport = hostPage.page.viewportSize();

    expect(celebrationBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.round(celebrationBox!.width)).toEqual(viewport!.width);
    expect(Math.round(celebrationBox!.height)).toEqual(viewport!.height);

    await hostPage.page.getByRole("button", {name: "Back to lobby"}).click();

    await expect(
      hostPage.page.getByRole("button", {name: "Start reaction round"})
    ).toBeVisible();
    await expect(hostPage.page.getByText("Opponents (1/1)")).toBeVisible();
    await expect(
      hostPage.page.getByRole("button", {name: "Back to lobby"})
    ).not.toBeVisible();
    await expect(hostPage.page.getByText(/Winner:/i)).not.toBeVisible();
    await expect(celebration).toBeHidden();
  });

  test("Should preserve both reaction results when players click together", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("reaction-simultaneous");
    const roomID = await hostPage.createRoom({
      gameMode: "reaction",
      roomName
    });

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);
    expect(userPage.url().split("/").pop()).toEqual(roomID);

    await hostPage.page
      .getByRole("button", {name: "Start reaction round"})
      .click();

    const hostClickButton = hostPage.page.getByRole("button", {
      name: "Click!"
    });
    const userClickButton = userPage.getByRole("button", {name: "Click!"});

    await expect(hostClickButton).toBeVisible({timeout: 7000});
    await expect(userClickButton).toBeVisible({timeout: 7000});

    await Promise.all([hostClickButton.click(), userClickButton.click()]);

    await expect
      .poll(
        async () => {
          const room = await hostPage.getRoom(roomID);
          const results = room?.reactionSession?.results ?? {};

          return Object.values(results).filter(
            (result) => result.status === "valid"
          ).length;
        },
        {timeout: 7000}
      )
      .toBe(2);

    await expect
      .poll(
        async () => {
          const room = await hostPage.getRoom(roomID);

          return room?.reactionSession?.status;
        },
        {timeout: 7000}
      )
      .toBe("ended");

    await expect(
      hostPage.page.getByText(/Your reaction was .* ms/i)
    ).toBeVisible();
    await expect(userPage.getByText(/Your reaction was .* ms/i)).toBeVisible();
  });

  test("Should start next reaction round without stale results", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("reaction-next-round");
    const roomID = await hostPage.createRoom({
      gameMode: "reaction",
      roomName
    });

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);
    expect(userPage.url().split("/").pop()).toEqual(roomID);

    await hostPage.page
      .getByRole("button", {name: "Start reaction round"})
      .click();
    await finishReactionRoundWithHostWinner(hostPage.page, userPage);

    await hostPage.page.getByRole("button", {name: "Start next round"}).click();

    await expect(
      hostPage.page.getByRole("button", {name: "Stay ready..."})
    ).toBeVisible();
    await expect(hostPage.page.getByText("Opponents (1/1)")).toBeVisible();
    await expect(
      hostPage.page.getByRole("button", {name: "Back to lobby"})
    ).not.toBeVisible();
    await expect(hostPage.page.getByText(/Winner:/i)).not.toBeVisible();
    await expect(hostPage.page.locator("#celebration")).toBeHidden();
  });

  test("Should create a room with password", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const pwd = "123456";
    const roomName = uniqueRoomName("password-room");
    const roomID = await hostPage.createRoom({password: pwd, roomName});

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.locator("#swal2-input").fill(pwd);
    await userPage.getByRole("button", {name: "Enter"}).click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
  });

  test("Should kick user when press on Kick button", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("remove-player-room");
    const roomID = await hostPage.createRoom({roomName});

    await expect(hostPage.page.getByText("Press start to play")).toBeVisible();

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
    await expect(
      userPage.getByRole("button", {name: "Kick"})
    ).not.toBeVisible();

    await hostPage.page.getByRole("button", {name: "Kick"}).click();

    await expect(
      hostPage.page.getByText("Waiting for opponents...")
    ).toBeVisible();
    await expect(
      userPage.getByText("You have been removed by the host")
    ).toBeVisible();
  });

  test("Should enter room with password by invite link", async ({
    hostPage,
    userPage
  }) => {
    await hostPage.page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);

    await hostPage.createRoom({password: "123"});
    await hostPage.page.getByText("Invite friends").click();

    const inviteLink = await (
      await hostPage.page.evaluateHandle(() => navigator.clipboard.readText())
    ).jsonValue();

    await userPage.page.goto(inviteLink);

    await expect(
      userPage.page.getByText("Enter the password")
    ).not.toBeVisible();
  });

  test("Should enter room with password by link asking for password", async ({
    hostPage,
    userPage
  }) => {
    await hostPage.page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);

    const pwd = "123";
    const roomID = await hostPage.createRoom({password: pwd});

    await userPage.page.goto(`/game/${roomID}`);

    await expect(userPage.page.getByText("Enter the password")).toBeVisible();

    await userPage.page.locator("#swal2-input").fill(pwd);
    await userPage.page.getByRole("button", {name: "Enter"}).click();

    await expect(
      userPage.page.getByText("Enter the password")
    ).not.toBeVisible();
  });

  test("Should kick user if clicking too fast", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("fast-click-room");
    await hostPage.createRoom({roomName});

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);

    await hostPage.page.getByText("Start!").click();
    await userPage.waitForTimeout(3000);
    await hostPage.page.waitForTimeout(3000);

    const clickButton = userPage.getByRole("button", {name: "Click"});
    for (let i = 0; i < 20; i++) {
      clickButton.click().catch(() => {});
      await userPage.waitForTimeout(5);
    }

    await userPage.waitForURL(
      (url) => url.searchParams.has("suspicionOfHack"),
      {
        timeout: 5000
      }
    );

    await expect(userPage.getByText(/Misuse detected/i)).toBeVisible();
  });

  test("Should update timer in settings and both users update timer in room", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomName = uniqueRoomName("timer-room");
    await hostPage.createRoom({roomName});

    await userPage
      .getByRole("button", {name: new RegExp(roomName, "i")})
      .click();
    await userPage.waitForURL(/\/game\//);
    await expect(hostPage.page.getByText("guestuser1")).toBeVisible();

    await hostPage.page
      .getByRole("button", {name: "Settings", exact: true})
      .click();
    await hostPage.page.getByLabel("Timer").selectOption({value: "15"});
    await hostPage.page.getByRole("button", {name: "Save settings"}).click();
    await expect(hostPage.page.getByText("Settings updated")).toBeVisible();

    await expect(userPage.getByText("00:15")).toBeVisible({timeout: 10000});
    await expect(hostPage.page.getByText("00:15")).toBeVisible({
      timeout: 10000
    });
  });

  test("Should route legacy rooms without game mode to classic-speed", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomID = await hostPage.createRoom();
    await hostPage.makeRoomLegacy(roomID);

    await userPage.goto(`/game/${roomID}`);
    await userPage.waitForURL(/\/game\//);

    await expect(hostPage.page.getByText("Press start to play")).toBeVisible();
    await hostPage.page.getByText("Start!").click();

    await userPage.waitForTimeout(3000);
    await expect(userPage.getByRole("button", {name: "Click"})).toBeVisible();
  });
});
