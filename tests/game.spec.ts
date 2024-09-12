import test, {expect} from "@playwright/test";

import {loginAsGuest} from "./utils";

test("Should play a game between two users", async ({browser}) => {
  /* #region Setup */
  test.setTimeout(60000);
  const hostContext = await browser.newContext();
  const userContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const userPage = await userContext.newPage();

  await loginAsGuest(hostPage, "guesthost1");
  await loginAsGuest(userPage, "guestuser1");
  /* #endregion */

  /* #region Create Room - Host */
  await hostPage.getByText("Create game").click();

  await hostPage.waitForURL(/\/game\//);

  const roomID = hostPage.url().split("/").pop();

  expect(roomID).toBeDefined();

  await expect(hostPage.getByText("Press start to play")).toBeVisible();
  /* #endregion */

  /* #region Enter room - User */
  await userPage.getByText("guesthost1's roomOwner: guesthost11/").click();

  await userPage.waitForURL(/\/game\//);

  expect(userPage.url().split("/").pop()).toEqual(roomID);

  /* #endregion */

  /* #region Start game - Host */
  expect(hostPage.getByText("guestuser1")).toBeVisible();

  await hostPage.getByText("Start!").click();

  // Wait for countdown
  userPage.waitForTimeout(3000);
  hostPage.waitForTimeout(3000);
  /* #endregion */

  /* #region Make clicks - Both */
  await Promise.all([
    hostPage
      .getByRole("button", {name: "Click"})
      .click({clickCount: 20, delay: 100}),
    userPage
      .getByRole("button", {name: "Click"})
      .click({clickCount: 10, delay: 200})
  ]);

  await expect(hostPage.getByText("Result - 1st place")).toBeVisible({
    timeout: 10000
  });
  await expect(userPage.getByText("Result - 2nd place")).toBeVisible({
    timeout: 10000
  });

  /* #endregion */
});
