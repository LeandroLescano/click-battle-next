import {test, expect} from "./fixtures";

test.describe("Game", () => {
  test.describe.configure({mode: "serial"});

  test("Should play a game between two users", async ({
    hostPage,
    userPage: {page: userPage}
  }) => {
    const roomID = await hostPage.createRoom();
    await expect(hostPage.page.getByText("Press start to play")).toBeVisible();

    /* #region Enter room - User */
    await userPage.getByText("guesthost1's roomOwner: guesthost11/").click();
    await userPage.waitForURL(/\/game\//);

    expect(userPage.url().split("/").pop()).toEqual(roomID);
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

    await expect(hostPage.page.getByText("Result - 1st place")).toBeVisible({
      timeout: 10000
    });
    await expect(userPage.getByText("Result - 2nd place")).toBeVisible({
      timeout: 10000
    });

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
    /* #endregion */

    /* #region Kick user - Host */
    await hostPage.page.getByText("Kick").click();

    await expect(
      hostPage.page.getByText("Waiting for opponents...")
    ).toBeVisible();
    await expect(
      userPage.getByText("You were kicked out by the owner")
    ).toBeVisible();
    /* #endregion */
  });
});
