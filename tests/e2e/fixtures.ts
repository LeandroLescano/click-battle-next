import {test as base, type Page} from "@playwright/test";
import {authenticate} from "./auth.utils";

// Page Object Model for the "admin" page.
// Here you can add locators and helper methods specific to the admin page.
class HostPage {
  // Page signed in as "host".
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

// Page Object Model for the "user" page.
// Here you can add locators and helper methods specific to the user page.
class UserPage {
  // Page signed in as "user".
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

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
