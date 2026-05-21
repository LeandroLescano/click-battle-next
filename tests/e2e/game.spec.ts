import {expect, test} from "./fixtures";

test.describe("Game", () => {
  test.describe.configure({mode: "serial"});

  test("Should create classic-speed and reaction rooms with visible mode labels", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const classicRoomName = "classic-mode-room";
    const reactionRoomName = "reaction-mode-room";

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
    const roomID = await hostPage.createRoom();
    await expect(hostPage.page.getByText("Press start to play")).toBeVisible();
    await expect(
      hostPage.page.getByRole("button", {name: "Start!"})
    ).toBeDisabled();
    await expect(
      hostPage.page.getByRole("button", {name: "Settings", exact: true})
    ).toBeVisible();

    await userPage.getByRole("button", {name: /guesthost1's room/i}).click();
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
    const roomID = await hostPage.createRoom({gameMode: "reaction"});

    await expect(hostPage.page.getByText("Reaction Battle")).toBeVisible();

    await userPage.getByRole("button", {name: /guesthost1's room/i}).click();
    await userPage.waitForURL(/\/game\//);
    expect(userPage.url().split("/").pop()).toEqual(roomID);

    await hostPage.page
      .getByRole("button", {name: "Start reaction round"})
      .click();
    await hostPage.page.getByRole("button", {name: "Wait..."}).click();

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

  test("Should create a room with password", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const pwd = "123456";
    const roomID = await hostPage.createRoom({password: pwd});

    await userPage.getByRole("button", {name: /guesthost1's room/i}).click();
    await userPage.locator("#swal2-input").fill(pwd);
    await userPage.getByRole("button", {name: "Enter"}).click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
  });

  test("Should kick user when press on Kick button", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomID = await hostPage.createRoom();

    await expect(hostPage.page.getByText("Press start to play")).toBeVisible();

    await userPage.getByRole("button", {name: /guesthost1's room/i}).click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
    await expect(userPage.getByText("Kick")).not.toBeVisible();

    await hostPage.page.getByText("Kick").click();

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
    await hostPage.createRoom();

    await userPage.getByRole("button", {name: /guesthost1's room/i}).click();
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
    await hostPage.createRoom();

    await userPage.getByRole("button", {name: /guesthost1's room/i}).click();
    await userPage.waitForURL(/\/game\//);

    await hostPage.page
      .getByRole("button", {name: "Settings", exact: true})
      .click();
    await hostPage.page.getByLabel("Timer").selectOption({value: "15"});
    await hostPage.page.getByRole("button", {name: "Save settings"}).click();

    await expect(userPage.getByText("00:15")).toBeVisible();
    await expect(hostPage.page.getByText("00:15")).toBeVisible();
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
