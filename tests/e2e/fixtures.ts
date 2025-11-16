/* eslint-disable import/export */
import {test as base, type Page} from "@playwright/test";

import {authenticate} from "./auth.utils";

class GenericPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async createRoom(password?: string): Promise<string> {
    if (password) {
      await this.page.getByRole("textbox", {name: "Password"}).fill(password);
    }
    await this.page.getByText("Create game").click();
    await this.page.waitForURL(/\/game\//);

    const roomID = this.page.url().split("/").pop();

    return roomID || "";
  }
}

// Page Object Model for the "admin" page.
// Here you can add locators and helper methods specific to the admin page.
class HostPage extends GenericPage {}

// Page Object Model for the "user" page.
// Here you can add locators and helper methods specific to the user page.
class UserPage extends GenericPage {}

// Declare the types of your fixtures.
type MyFixtures = {
  hostPage: HostPage;
  userPage: UserPage;
};

export * from "@playwright/test";
export const test = base.extend<MyFixtures>({
  hostPage: async ({browser}, use) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/host.json"
    });
    const hostPage = new HostPage(await context.newPage());
    await authenticate(hostPage.page, "host");
    await use(hostPage);
    await context.close();
  },
  userPage: async ({browser}, use) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json"
    });
    const userPage = new UserPage(await context.newPage());
    await authenticate(userPage.page, "user");
    await use(userPage);
    await context.close();
  }
});
