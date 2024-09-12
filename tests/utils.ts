import {Page} from "@playwright/test";

const getAuthResponse = (page: Page) => {
  return page.waitForResponse(/identitytoolkit.googleapis/);
};

export const loginAsGuest = async (page: Page, name = "guestuser") => {
  await page.goto("/");

  await page.getByRole("button", {name: "Login as guest"}).click();

  await getAuthResponse(page);

  await page.getByPlaceholder("Username").fill(name);

  await page.click("text=Choose");
};
