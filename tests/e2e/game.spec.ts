import {test, expect} from "./fixtures";

test.describe("Game", () => {
  test.describe.configure({mode: "serial"});

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

    /* #region Enter room - User */
    await userPage.getByText("guesthost1's roomOwner: guesthost11/").click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
    await expect(
      userPage.getByRole("button", {name: "Settings", exact: true})
    ).not.toBeVisible();
    /* #endregion */

    /* #region Start game - Host */
    expect(hostPage.page.getByText("guestuser1")).toBeVisible();
    await hostPage.page.getByText("Start!").click();

    // Wait for countdown
    userPage.waitForTimeout(3000);
    hostPage.page.waitForTimeout(3000);
    /* #endregion */

    /* #region Make clicks - Both */
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

    /* #endregion */
  });

  test("Should create a room with password", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const pwd = "123456";
    const roomID = await hostPage.createRoom(pwd);

    /* #region Enter room - User */
    await userPage.getByText("guesthost1's roomOwner: guesthost11/").click();
    await userPage.locator("#swal2-input").fill(pwd);
    await userPage.getByRole("button", {name: "Enter"}).click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
    /* #endregion */
  });

  test("Should kick user when press on Kick button", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomID = await hostPage.createRoom();

    await expect(hostPage.page.getByText("Press start to play")).toBeVisible();

    /* #region Enter room - User */
    await userPage.getByText("guesthost1's roomOwner: guesthost11/").click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
    await expect(userPage.getByText("Kick")).not.toBeVisible();
    /* #endregion */

    /* #region Kick user - Host */
    await hostPage.page.getByText("Kick").click();

    await expect(
      hostPage.page.getByText("Waiting for opponents...")
    ).toBeVisible();
    await expect(
      userPage.getByText("You have been removed by the host")
    ).toBeVisible();
    /* #endregion */
  });

  test("Should enter room with password by invite link", async ({
    hostPage,
    userPage
  }) => {
    await hostPage.page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);

    await hostPage.createRoom("123");
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
    const roomID = await hostPage.createRoom(pwd);

    await userPage.page.goto(`/game/${roomID}`);

    await expect(userPage.page.getByText("Enter the password")).toBeVisible();

    await userPage.page.locator("#swal2-input").fill(pwd);
    await userPage.page.getByRole("button", {name: "Enter"}).click();

    await expect(userPage.page.getByText("Enter the password")).toBeVisible();
  });

  test("Should kick user if clicking too fast", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    await hostPage.createRoom();

    await userPage.getByText("guesthost1's roomOwner: guesthost11/").click();
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

    await userPage.getByText("guesthost1's roomOwner: guesthost11/").click();
    await userPage.waitForURL(/\/game\//);

    await hostPage.page
      .getByRole("button", {name: "Settings", exact: true})
      .click();
    await hostPage.page.getByLabel("Timer").selectOption({value: "15"});
    await hostPage.page.getByRole("button", {name: "Save settings"}).click();

    await expect(userPage.getByText("00:15")).toBeVisible();
    await expect(hostPage.page.getByText("00:15")).toBeVisible();
  });
});
