import {test, expect} from "./fixtures";

// Use adminPage and userPage fixtures in the test.
test("host and user", async ({hostPage, userPage}) => {
  await expect(
    hostPage.page.getByPlaceholder("guesthost1's room")
  ).toBeVisible();
  await expect(
    userPage.page.getByPlaceholder("guestuser1's room")
  ).toBeVisible();
});
